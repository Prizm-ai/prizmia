"""
Templates pour les 4 types d'articles Prizm AI.

Chaque type a sa propre structure, son angle et ses spécificités.
Ratio hebdomadaire : Actualité 40%, Analyse 30%, Guide 20%, Opinion 10%
"""

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class ArticleTemplate:
    """Template pour un type d'article."""
    
    nom: str
    ratio_hebdo: float  # Pourcentage du planning
    description: str
    structure: List[str]
    ton: str
    longueur_cible: str
    elements_requis: List[str]
    exemple_titres: List[str]


# -----------------
# Les 4 templates
# -----------------

TEMPLATE_ACTUALITE = ArticleTemplate(
    nom="actualite",
    ratio_hebdo=0.40,
    description="Décryptage d'une actualité IA récente avec angle PME français",
    structure=[
        "## Le fait : ce qui vient de se passer",
        "## Pourquoi c'est important pour les PME",
        "## Ce que ça change concrètement",
        "## Comment s'y préparer dès maintenant",
        "## En synthèse"
    ],
    ton="Réactif, informatif, tourné vers l'action",
    longueur_cible="1400-1600 mots",
    elements_requis=[
        "Date et source de l'actualité",
        "Chiffres clés",
        "Impact concret PME",
        "1-2 actions immédiates",
        "Liens vers sources"
    ],
    exemple_titres=[
        "L'AI Act entre en vigueur : ce que ça change pour votre PME",
        "Claude 4 est sorti : faut-il migrer maintenant ?",
        "France 2030 débloque 500M€ pour l'IA : comment en profiter"
    ]
)

TEMPLATE_ANALYSE = ArticleTemplate(
    nom="analyse",
    ratio_hebdo=0.30,
    description="Analyse approfondie d'une tendance, étude ou phénomène IA",
    structure=[
        "## Le constat : les chiffres qui interpellent",
        "## L'analyse : pourquoi on en est là",
        "## Les implications pour les PME françaises",
        "## Les stratégies qui fonctionnent",
        "## Notre lecture"
    ],
    ton="Analytique, nuancé, expert mais accessible",
    longueur_cible="1600-1800 mots",
    elements_requis=[
        "Données chiffrées multiples",
        "Comparaisons (France vs monde, PME vs grands groupes)",
        "Analyse causale",
        "Framework d'interprétation",
        "Position argumentée"
    ],
    exemple_titres=[
        "Pourquoi 73% des PME n'ont pas de stratégie IA (et comment y remédier)",
        "IA générative : le fossé se creuse entre PME et ETI",
        "Les 3 modèles d'adoption IA qui marchent vraiment"
    ]
)

TEMPLATE_GUIDE = ArticleTemplate(
    nom="guide",
    ratio_hebdo=0.20,
    description="Guide pratique pas-à-pas pour implémenter une solution IA",
    structure=[
        "## Pourquoi ce guide (le problème que vous avez)",
        "## Les prérequis avant de commencer",
        "## Étape 1 : [Action concrète]",
        "## Étape 2 : [Action concrète]",
        "## Étape 3 : [Action concrète]",
        "## Les pièges à éviter",
        "## Checklist récapitulative"
    ],
    ton="Pédagogique, encourageant, très concret",
    longueur_cible="1600-2000 mots",
    elements_requis=[
        "Étapes numérotées claires",
        "Outils recommandés avec prix",
        "Temps estimé par étape",
        "Erreurs courantes à éviter",
        "Checklist téléchargeable"
    ],
    exemple_titres=[
        "Automatiser son SAV en 5 étapes (budget : 2-10K€)",
        "Guide : choisir son premier outil IA sans se tromper",
        "Comment former votre équipe à l'IA en 30 jours"
    ]
)

TEMPLATE_OPINION = ArticleTemplate(
    nom="opinion",
    ratio_hebdo=0.10,
    description="Prise de position argumentée sur un sujet IA controversé ou émergent",
    structure=[
        "## La thèse : ce que nous affirmons",
        "## L'argument principal",
        "## Les objections (et nos réponses)",
        "## Ce que ça implique pour vous",
        "## Notre conviction"
    ],
    ton="Affirmé, argumenté, engagé mais respectueux",
    longueur_cible="1400-1600 mots",
    elements_requis=[
        "Thèse claire dès l'intro",
        "Arguments factuels",
        "Contre-arguments adressés",
        "Prise de position assumée",
        "Call-to-action engageant"
    ],
    exemple_titres=[
        "Non, l'IA ne remplacera pas vos commerciaux",
        "Pourquoi les PME devraient ignorer ChatGPT (pour l'instant)",
        "L'erreur que font 90% des PME avec l'IA générative"
    ]
)


# -----------------
# Dictionnaire des templates
# -----------------

TEMPLATES: Dict[str, ArticleTemplate] = {
    "actualite": TEMPLATE_ACTUALITE,
    "analyse": TEMPLATE_ANALYSE,
    "guide": TEMPLATE_GUIDE,
    "opinion": TEMPLATE_OPINION
}


def get_template(type_article: str) -> ArticleTemplate:
    """
    Récupère le template pour un type d'article.
    
    Args:
        type_article: Type d'article (actualite, analyse, guide, opinion)
        
    Returns:
        Template correspondant
        
    Raises:
        ValueError: Si le type n'existe pas
    """
    if type_article not in TEMPLATES:
        raise ValueError(f"Type inconnu: {type_article}. Types valides: {list(TEMPLATES.keys())}")
    return TEMPLATES[type_article]


def get_template_prompt(type_article: str) -> str:
    """
    Génère le prompt de structure pour un type d'article.
    
    Args:
        type_article: Type d'article
        
    Returns:
        Prompt formaté pour Claude
    """
    template = get_template(type_article)
    
    structure_formatted = "\n".join(template.structure)
    elements_formatted = "\n".join(f"- {e}" for e in template.elements_requis)
    
    return f"""## TYPE D'ARTICLE : {template.nom.upper()}

**Description** : {template.description}

**Ton** : {template.ton}

**Longueur cible** : {template.longueur_cible}

**Structure à suivre** :
{structure_formatted}

**Éléments requis** :
{elements_formatted}

**Exemples de titres** :
- {template.exemple_titres[0]}
- {template.exemple_titres[1]}
"""


# Test
if __name__ == "__main__":
    print("📋 Templates Articles Prizm AI")
    print("=" * 40)
    
    for nom, template in TEMPLATES.items():
        print(f"\n{nom.upper()} ({int(template.ratio_hebdo * 100)}%)")
        print(f"  {template.description}")
        print(f"  Longueur: {template.longueur_cible}")
    
    print("\n" + "=" * 40)
    print("Exemple prompt pour 'analyse':")
    print(get_template_prompt("analyse"))
