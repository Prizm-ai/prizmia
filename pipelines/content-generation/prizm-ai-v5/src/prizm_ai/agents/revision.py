"""
Agent Révision - Améliore l'article selon les critiques.

Prend les critiques de l'Agent Critique et révise l'article
pour atteindre le score cible (7+).
"""

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState
from prizm_ai.config import settings, voix_prizm


class RevisionAgent(BaseAgent):
    """
    Agent de révision d'articles.
    
    Révise l'article en fonction des critiques reçues.
    Maximum 2 révisions pour éviter les boucles infinies.
    """
    
    name = "RevisionAgent"
    
    def __init__(self):
        super().__init__()
        self.llm = ChatAnthropic(
            model=settings.default_model,
            api_key=settings.anthropic_api_key,
            temperature=0.5,  # Équilibre créativité/fidélité
            max_tokens=4000
        )
    
    async def run(self, state: GraphState) -> GraphState:
        """
        Révise l'article.
        
        Args:
            state: État avec article et critiques
            
        Returns:
            État avec article révisé
        """
        revision_num = state.get("revision_count", 0) + 1
        state = self.log(state, f"Révision #{revision_num}...")
        
        article = state.get("article_revise") or state.get("article_brut", "")
        critiques = state.get("critiques", [])
        score = state.get("score", 0)
        
        if not article:
            state = self.error(state, "Aucun article à réviser")
            return state
        
        if not critiques:
            state = self.log(state, "Aucune critique, article conservé")
            return state
        
        try:
            # Construire le prompt de révision
            prompt = self._build_revision_prompt(article, critiques, score)
            
            # Appel à Claude
            messages = [
                SystemMessage(content=voix_prizm.system_prompt),
                HumanMessage(content=prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            revised_article = response.content
            
            # Mettre à jour l'état
            state["article_revise"] = revised_article
            state["revision_count"] = revision_num
            
            word_count = len(revised_article.split())
            state = self.log(state, f"✓ Article révisé ({word_count} mots)")
            
        except Exception as e:
            state = self.error(state, f"Erreur révision: {str(e)}")
        
        return state
    
    def _build_revision_prompt(
        self, 
        article: str, 
        critiques: list, 
        score: float
    ) -> str:
        """Construit le prompt de révision."""
        critiques_formatted = "\n".join(f"- {c}" for c in critiques)
        
        return f"""## MISSION

Révise cet article pour atteindre un score de 7/10 minimum.
Score actuel : {score}/10

## CRITIQUES À ADRESSER

{critiques_formatted}

## ARTICLE À RÉVISER

{article}

## INSTRUCTIONS

1. Adresse CHAQUE critique listée ci-dessus
2. Garde le même sujet, ton et structure générale
3. Améliore les points faibles sans casser ce qui fonctionne
4. Assure-toi que l'article fait 1400-2000 mots
5. Vérifie les répétitions (PME ≤ 5, ETI ≤ 3)

## FORMAT

Retourne l'article COMPLET révisé en Markdown.
Commence directement par le titre (pas de préambule ni d'explication).
"""


# Test
if __name__ == "__main__":
    print("🔄 Test RevisionAgent")
    print("=" * 40)
    
    agent = RevisionAgent()
    print(f"Modèle: {settings.default_model}")
    print("✓ Agent initialisé")
