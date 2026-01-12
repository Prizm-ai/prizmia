"""
Workflow LangGraph pour Prizm AI V5.

Définit le graphe d'exécution avec tous les nœuds (agents) et les transitions.
Le workflow gère automatiquement l'état partagé et les flux conditionnels.
"""

from typing import Literal
from langgraph.graph import StateGraph, END

from prizm_ai.graph.state import GraphState, create_initial_state, log_state
from prizm_ai.config import settings


# -----------------
# Fonctions de routage (edges conditionnelles)
# -----------------

def route_after_critique(state: GraphState) -> Literal["revision", "visuels", "reject"]:
    """
    Détermine le prochain nœud après l'évaluation critique.
    
    Logique:
    - Score >= 7.0 → Générer les visuels (article validé)
    - Score < 7.0 et révisions < max → Réviser l'article
    - Score < 7.0 et révisions >= max → Rejeter l'article
    
    Args:
        state: État actuel du workflow
        
    Returns:
        Nom du prochain nœud
    """
    score = state.get("score", 0)
    revision_count = state.get("revision_count", 0)
    max_revisions = settings.max_revisions
    target_score = settings.target_score
    
    if score >= target_score:
        return "visuels"
    elif revision_count < max_revisions:
        return "revision"
    else:
        # Trop de révisions sans atteindre le score
        print(f"❌ Article rejeté après {revision_count} révisions (score: {score})")
        return "reject"


def route_after_veille(state: GraphState) -> Literal["analyse", "end_no_subject"]:
    """
    Vérifie que la veille a trouvé des sujets.
    
    Args:
        state: État actuel
        
    Returns:
        "analyse" si sujets trouvés, "end_no_subject" sinon
    """
    if state.get("sujets") and len(state["sujets"]) > 0:
        return "analyse"
    else:
        print("⚠️ Aucun sujet trouvé par la veille")
        return "end_no_subject"


# -----------------
# Nœuds du graphe (placeholders - seront remplacés par les vrais agents)
# -----------------

async def node_veille(state: GraphState) -> GraphState:
    """Nœud de veille - À remplacer par VeilleAgent."""
    from prizm_ai.agents.veille import VeilleAgent
    agent = VeilleAgent()
    return await agent.run(state)


async def node_analyse(state: GraphState) -> GraphState:
    """Nœud d'analyse - À remplacer par AnalyseAgent."""
    from prizm_ai.agents.analyse import AnalyseAgent
    agent = AnalyseAgent()
    return await agent.run(state)


async def node_redaction(state: GraphState) -> GraphState:
    """Nœud de rédaction - À remplacer par RedactionAgent."""
    from prizm_ai.agents.redaction import RedactionAgent
    agent = RedactionAgent()
    return await agent.run(state)


async def node_critique(state: GraphState) -> GraphState:
    """Nœud de critique - À remplacer par CritiqueAgent."""
    from prizm_ai.agents.critique import CritiqueAgent
    agent = CritiqueAgent()
    return await agent.run(state)


async def node_revision(state: GraphState) -> GraphState:
    """Nœud de révision - À remplacer par RevisionAgent."""
    from prizm_ai.agents.revision import RevisionAgent
    agent = RevisionAgent()
    return await agent.run(state)


async def node_visuels(state: GraphState) -> GraphState:
    """Nœud de génération visuels - À remplacer par VisuelsAgent."""
    from prizm_ai.agents.visuels import VisuelsAgent
    agent = VisuelsAgent()
    return await agent.run(state)


async def node_publish(state: GraphState) -> GraphState:
    """Nœud de publication - À remplacer par PublishAgent."""
    from prizm_ai.agents.publish import PublishAgent
    agent = PublishAgent()
    return await agent.run(state)


async def node_reject(state: GraphState) -> GraphState:
    """Nœud de rejet - Sauvegarde l'article rejeté pour analyse."""
    from pathlib import Path
    from datetime import datetime
    
    state = log_state(state, f"Article rejeté (score: {state.get('score', 0)})")
    state["published"] = False
    
    # Sauvegarder quand même l'article pour analyse
    article = state.get("article_revise") or state.get("article_brut", "")
    if article:
        output_dir = Path(settings.output_path) / "articles" / "rejected"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        sujet = state.get("sujet_selectionne", {})
        titre = sujet.get("titre", "article")[:50].replace(" ", "-").lower()
        filename = f"{timestamp}-{titre}-REJECTED.md"
        
        filepath = output_dir / filename
        filepath.write_text(article, encoding="utf-8")
        state["filepath"] = str(filepath)
        state = log_state(state, f"Article rejeté sauvegardé: {filepath}")
    
    return state


async def node_no_subject(state: GraphState) -> GraphState:
    """Nœud fin sans sujet - Aucun sujet trouvé."""
    state = log_state(state, "Fin workflow: aucun sujet trouvé")
    return state


# -----------------
# Construction du workflow
# -----------------

def create_workflow() -> StateGraph:
    """
    Crée et compile le workflow LangGraph complet.
    
    Architecture:
    ```
    VEILLE → ANALYSE → RÉDACTION → CRITIQUE ←→ RÉVISION
                                      ↓
                                   VISUELS → PUBLISH → END
    ```
    
    Returns:
        Workflow compilé prêt à être exécuté
    """
    
    # Créer le graphe avec l'état
    workflow = StateGraph(GraphState)
    
    # -----------------
    # Ajouter les nœuds
    # -----------------
    workflow.add_node("veille", node_veille)
    workflow.add_node("analyse", node_analyse)
    workflow.add_node("redaction", node_redaction)
    workflow.add_node("critique", node_critique)
    workflow.add_node("revision", node_revision)
    workflow.add_node("visuels", node_visuels)
    workflow.add_node("publish", node_publish)
    workflow.add_node("reject", node_reject)
    workflow.add_node("no_subject", node_no_subject)
    
    # -----------------
    # Définir le point d'entrée
    # -----------------
    workflow.set_entry_point("veille")
    
    # -----------------
    # Ajouter les arêtes (transitions)
    # -----------------
    
    # Veille → (conditionnel) Analyse ou fin
    workflow.add_conditional_edges(
        "veille",
        route_after_veille,
        {
            "analyse": "analyse",
            "end_no_subject": "no_subject"
        }
    )
    
    # Analyse → Rédaction
    workflow.add_edge("analyse", "redaction")
    
    # Rédaction → Critique
    workflow.add_edge("redaction", "critique")
    
    # Critique → (conditionnel) Révision, Visuels ou Rejet
    workflow.add_conditional_edges(
        "critique",
        route_after_critique,
        {
            "revision": "revision",
            "visuels": "visuels",
            "reject": "reject"
        }
    )
    
    # Révision → Critique (boucle)
    workflow.add_edge("revision", "critique")
    
    # Visuels → Publication
    workflow.add_edge("visuels", "publish")
    
    # Publication → Fin
    workflow.add_edge("publish", END)
    
    # Rejet → Fin
    workflow.add_edge("reject", END)
    
    # Pas de sujet → Fin
    workflow.add_edge("no_subject", END)
    
    # -----------------
    # Compiler et retourner
    # -----------------
    return workflow.compile()


# Instance du workflow (singleton)
_workflow = None


def get_workflow() -> StateGraph:
    """
    Récupère l'instance du workflow (crée si nécessaire).
    
    Returns:
        Workflow compilé
    """
    global _workflow
    if _workflow is None:
        _workflow = create_workflow()
    return _workflow


# Test
if __name__ == "__main__":
    print("🔄 Test création workflow LangGraph")
    print("=" * 40)
    
    workflow = create_workflow()
    print("✅ Workflow créé avec succès")
    
    # Afficher les nœuds
    print("\nNœuds du graphe:")
    nodes = ["veille", "analyse", "redaction", "critique", "revision", "visuels", "publish", "reject", "no_subject"]
    for node in nodes:
        print(f"  • {node}")
    
    print("\nTransitions conditionnelles:")
    print("  • veille → [analyse | no_subject]")
    print("  • critique → [revision | visuels | reject]")
