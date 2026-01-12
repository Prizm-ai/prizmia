"""
État partagé entre tous les agents du workflow LangGraph.

Le GraphState est le "cerveau" du pipeline : chaque agent le lit et le modifie.
LangGraph gère automatiquement la propagation des modifications.

V2 : Ajout structures Source et Extrait pour traçabilité (inspiré V4)
FUSION V4 : Ajout mode dirigé, historique, stats session, anti-répétition contenus
"""

from typing import TypedDict, Optional, List, Dict, Any, Literal
from datetime import datetime
import unicodedata
import re


class Source(TypedDict):
    """
    Structure d'une source vérifiée (inspiré V4).
    
    Chaque source a une fiabilité évaluée et des extraits traçables.
    """
    nom: str                    # Nom du site/publication
    url: str                    # URL complète
    type: str                   # "etude" | "rapport_officiel" | "article_presse" | "blog"
    date: str                   # Date publication (JJ/MM/AAAA)
    fiabilite: int              # Score 1-10
    fiabilite_raison: str       # Justification du score
    extraits: List[str]         # Citations exactes entre guillemets
    donnees: List[str]          # Données chiffrées avec contexte


class Extrait(TypedDict):
    """Extrait traçable vers sa source."""
    type: Literal["citation", "donnee"]
    contenu: str
    source_nom: str
    source_url: str


class Sujet(TypedDict):
    """Structure d'un sujet identifié par la veille."""
    titre: str
    resume: str
    sources: List[Source]       # Sources structurées (pas juste URLs)
    sources_urls: List[str]     # URLs pour compatibilité
    sources_noms: List[str]     # Noms pour citations
    extraits: List[Extrait]     # Tous les extraits agrégés
    angle_prizm: str
    score_pertinence: float
    score_sources: float        # Score moyen fiabilité sources
    date_detection: str


class Visuels(TypedDict):
    """Structure des visuels générés."""
    hero: Optional[Dict[str, str]]  # {path, prompt, alt}
    graphiques: List[Dict[str, str]]  # [{path, type, data}]


class ScoresDetail(TypedDict):
    """Détail des scores d'évaluation."""
    longueur: float
    sources: float
    repetition: float
    structure: float
    voix_prizm: float
    faithfulness: float


# -----------------
# FUSION V4 : Nouvelles structures
# -----------------

class SujetImpose(TypedDict):
    """Structure pour le mode dirigé (FUSION V4)."""
    titre: str                  # Titre du sujet à traiter
    angle: Optional[str]        # Angle éditorial recommandé
    keywords: Optional[str]     # Mots-clés pour la recherche
    category: Optional[str]     # Catégorie (actualites, guides, analyses, opinions)


class StatsSession(TypedDict):
    """Statistiques de session (FUSION V4)."""
    debut: str                  # Timestamp début
    duree_secondes: int         # Durée totale
    articles_generes: int       # Nombre d'articles générés
    mots_total: int             # Total de mots générés
    mots_moyen: int             # Moyenne de mots par article
    visuels_generes: int        # Nombre de visuels générés
    erreurs_count: int          # Nombre d'erreurs


class GraphState(TypedDict):
    """
    État partagé du workflow LangGraph.
    
    Cet état circule entre tous les agents et accumule les résultats.
    Chaque agent peut lire tout l'état et modifier les champs qui le concernent.
    """
    
    # -----------------
    # Métadonnées session
    # -----------------
    session_id: str
    started_at: str
    
    # -----------------
    # Mode Dirigé (FUSION V4)
    # -----------------
    mode_veille: str                        # "AUTO" ou "DIRIGE"
    sujet_impose: Optional[SujetImpose]     # Sujet imposé en mode DIRIGE
    
    # -----------------
    # Historique Anti-répétition (FUSION V4)
    # -----------------
    historique_sujets: List[str]            # Slugs des sujets déjà traités
    
    # -----------------
    # Étape Veille
    # -----------------
    sujets: List[Sujet]           # Liste des 5-7 sujets identifiés
    sources_brutes: List[str]     # Toutes les URLs collectées
    
    # -----------------
    # Étape Analyse
    # -----------------
    sujet_selectionne: Optional[Sujet]  # Le sujet choisi
    type_article: str                    # actualite, analyse, guide, opinion
    angle: str                           # Angle spécifique Prizm
    
    # -----------------
    # Étape Rédaction
    # -----------------
    article_brut: str             # Article généré (Markdown)
    article_revise: str           # Article après révision(s)
    
    # -----------------
    # Anti-répétition contenus (FUSION V4)
    # -----------------
    contenus_utilises: List[str]  # Hashes des contenus déjà utilisés dans la session
    
    # -----------------
    # Étape Critique
    # -----------------
    score: float                  # Score global (0-10)
    scores_detail: ScoresDetail   # Scores par critère
    critiques: List[str]          # Liste des points à améliorer
    revision_count: int           # Nombre de révisions effectuées
    
    # -----------------
    # Étape Visuels
    # -----------------
    visuels: Visuels              # Images générées
    
    # -----------------
    # Étape Publication
    # -----------------
    published: bool               # Article publié ?
    url: str                      # URL de l'article publié
    filepath: str                 # Chemin du fichier .md
    
    # -----------------
    # Stats Session (FUSION V4)
    # -----------------
    stats_session: Optional[StatsSession]
    
    # -----------------
    # Erreurs et logs
    # -----------------
    errors: List[str]             # Erreurs rencontrées
    logs: List[str]               # Logs de debug


def create_initial_state(
    mode_veille: str = "AUTO",
    sujet_impose: Optional[SujetImpose] = None,
    historique_sujets: Optional[List[str]] = None
) -> GraphState:
    """
    Crée un état initial vide pour démarrer le workflow.
    
    FUSION V4 : Accepte maintenant mode_veille, sujet_impose et historique.
    
    Args:
        mode_veille: "AUTO" ou "DIRIGE"
        sujet_impose: Sujet imposé si mode DIRIGE
        historique_sujets: Liste des slugs déjà traités
    
    Returns:
        GraphState initialisé avec valeurs par défaut
    """
    return GraphState(
        # Métadonnées
        session_id=datetime.now().strftime("%Y%m%d-%H%M%S"),
        started_at=datetime.now().isoformat(),
        
        # Mode Dirigé (FUSION V4)
        mode_veille=mode_veille,
        sujet_impose=sujet_impose,
        
        # Historique (FUSION V4)
        historique_sujets=historique_sujets or [],
        
        # Veille
        sujets=[],
        sources_brutes=[],
        
        # Analyse
        sujet_selectionne=None,
        type_article="",
        angle="",
        
        # Rédaction
        article_brut="",
        article_revise="",
        
        # Anti-répétition contenus (FUSION V4)
        contenus_utilises=[],
        
        # Critique
        score=0.0,
        scores_detail={
            "longueur": 0.0,
            "sources": 0.0,
            "repetition": 0.0,
            "structure": 0.0,
            "voix_prizm": 0.0,
            "faithfulness": 0.0
        },
        critiques=[],
        revision_count=0,
        
        # Visuels
        visuels={
            "hero": None,
            "graphiques": []
        },
        
        # Publication
        published=False,
        url="",
        filepath="",
        
        # Stats Session (FUSION V4)
        stats_session=None,
        
        # Debug
        errors=[],
        logs=[]
    )


def log_state(state: GraphState, message: str) -> GraphState:
    """Ajoute un log à l'état."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    state["logs"].append(f"[{timestamp}] {message}")
    return state


def add_error(state: GraphState, error: str) -> GraphState:
    """Ajoute une erreur à l'état."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    state["errors"].append(f"[{timestamp}] {error}")
    return state


# -----------------
# FUSION V4 : Fonctions utilitaires
# -----------------

def slugify(text: str) -> str:
    """
    Convertit un texte en slug (FUSION V4).
    
    Utilisé pour l'anti-répétition des sujets.
    """
    # Normaliser et retirer accents
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')
    
    # Minuscules, remplacer espaces et caractères spéciaux
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    
    return text[:80]


def marquer_contenu_utilise(state: GraphState, contenu: str) -> GraphState:
    """
    Marque un contenu comme utilisé pour éviter les répétitions (FUSION V4).
    
    Stocke un hash des 100 premiers caractères.
    """
    hash_contenu = contenu[:100].strip()
    if hash_contenu not in state["contenus_utilises"]:
        state["contenus_utilises"].append(hash_contenu)
    return state


def est_contenu_utilise(state: GraphState, contenu: str) -> bool:
    """Vérifie si un contenu a déjà été utilisé (FUSION V4)."""
    hash_contenu = contenu[:100].strip()
    return hash_contenu in state["contenus_utilises"]
