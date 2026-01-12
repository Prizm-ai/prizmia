"""
Agent Analyse - Sélectionne le sujet optimal et détermine le type d'article.

Analyse les sujets de la veille et choisit le meilleur selon :
- Le planning éditorial (ratio 40/30/20/10)
- La pertinence pour l'audience Prizm AI
- La fraîcheur et l'originalité
"""

from typing import Optional, List
from datetime import datetime
import random

from langchain_anthropic import ChatAnthropic

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState, Sujet
from prizm_ai.config import settings, TEMPLATES


class AnalyseAgent(BaseAgent):
    """
    Agent d'analyse et de sélection de sujet.
    
    Sélectionne le meilleur sujet parmi ceux identifiés par la veille
    et détermine le type d'article optimal.
    """
    
    name = "AnalyseAgent"
    
    # Ratio hebdomadaire des types d'articles
    TYPE_RATIOS = {
        "actualite": 0.40,
        "analyse": 0.30,
        "guide": 0.20,
        "opinion": 0.10
    }
    
    def __init__(self):
        super().__init__()
        self.llm = ChatAnthropic(
            model=settings.default_model,
            api_key=settings.anthropic_api_key,
            temperature=0.3
        )
    
    async def run(self, state: GraphState) -> GraphState:
        """
        Analyse les sujets et sélectionne le meilleur.
        
        Args:
            state: État avec sujets de la veille
            
        Returns:
            État avec sujet sélectionné et type d'article
        """
        state = self.log(state, "Analyse des sujets...")
        
        sujets = state.get("sujets", [])
        
        if not sujets:
            state = self.error(state, "Aucun sujet à analyser")
            return state
        
        try:
            # 1. Déterminer le type d'article optimal
            type_article = self._determine_type()
            
            # 2. Sélectionner le meilleur sujet pour ce type
            sujet = await self._select_best_subject(sujets, type_article)
            
            # 3. Définir l'angle Prizm
            angle = await self._define_angle(sujet, type_article)
            
            # Mettre à jour l'état
            state["sujet_selectionne"] = sujet
            state["type_article"] = type_article
            state["angle"] = angle
            
            state = self.log(state, f"✓ Sujet: '{sujet['titre']}' | Type: {type_article}")
            
        except Exception as e:
            state = self.error(state, f"Erreur analyse: {str(e)}")
        
        return state
    
    def _determine_type(self) -> str:
        """
        Détermine le type d'article selon le planning éditorial.
        
        TODO: Vérifier les articles déjà publiés cette semaine
        pour respecter le ratio 40/30/20/10.
        
        Returns:
            Type d'article (actualite, analyse, guide, opinion)
        """
        # Pour l'instant, sélection aléatoire pondérée
        types = list(self.TYPE_RATIOS.keys())
        weights = list(self.TYPE_RATIOS.values())
        
        return random.choices(types, weights=weights, k=1)[0]
    
    async def _select_best_subject(
        self, 
        sujets: List[Sujet], 
        type_article: str
    ) -> Sujet:
        """
        Sélectionne le meilleur sujet pour le type d'article.
        
        Args:
            sujets: Liste des sujets disponibles
            type_article: Type d'article cible
            
        Returns:
            Sujet sélectionné
        """
        # Trier par score de pertinence
        sorted_sujets = sorted(
            sujets, 
            key=lambda s: s.get("score_pertinence", 0), 
            reverse=True
        )
        
        # TODO: Utiliser Claude pour un choix plus intelligent
        # basé sur l'adéquation sujet/type
        
        return sorted_sujets[0]
    
    async def _define_angle(self, sujet: Sujet, type_article: str) -> str:
        """
        Définit l'angle Prizm spécifique pour le sujet.
        
        Args:
            sujet: Sujet sélectionné
            type_article: Type d'article
            
        Returns:
            Angle éditorial
        """
        # Utiliser l'angle déjà défini par la veille comme base
        base_angle = sujet.get("angle_prizm", "")
        
        # TODO: Enrichir avec Claude selon le type d'article
        
        template = TEMPLATES.get(type_article)
        if template:
            return f"{base_angle} | Ton: {template.ton}"
        
        return base_angle


# Test
if __name__ == "__main__":
    import asyncio
    from prizm_ai.graph.state import create_initial_state
    
    async def test():
        print("🎯 Test AnalyseAgent")
        print("=" * 40)
        
        agent = AnalyseAgent()
        
        # Créer un état avec des sujets fictifs
        state = create_initial_state()
        state["sujets"] = [
            {
                "titre": "Test sujet 1",
                "resume": "Description test",
                "sources": ["https://example.com"],
                "angle_prizm": "Angle test",
                "score_pertinence": 8.0,
                "date_detection": datetime.now().isoformat()
            }
        ]
        
        state = await agent.run(state)
        
        print(f"Type sélectionné: {state['type_article']}")
        print(f"Sujet: {state['sujet_selectionne']['titre']}")
        print("✓ Test réussi")
    
    asyncio.run(test())
