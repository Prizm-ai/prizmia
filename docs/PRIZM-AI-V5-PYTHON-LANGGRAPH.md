# 🚀 PRIZM AI V5 - ARCHITECTURE PYTHON/LANGGRAPH

**Date** : 11 janvier 2026  
**Version** : 3.0 (Refonte complète)  
**Stack** : Python + LangGraph + LangChain + RAGAS  
**Objectif** : Système de production d'articles optimal, maintenable et évolutif

---

## 📋 TABLE DES MATIÈRES

1. [Vision et objectifs](#-vision-et-objectifs)
2. [Pourquoi Python/LangGraph](#-pourquoi-pythonlanggraph)
3. [Architecture globale](#-architecture-globale)
4. [Les agents en détail](#-les-agents-en-détail)
5. [Identité visuelle intégrée](#-identité-visuelle-intégrée)
6. [Stack technique complet](#-stack-technique-complet)
7. [Structure du projet](#-structure-du-projet)
8. [Workflow LangGraph](#-workflow-langgraph)
9. [Évaluation qualité (RAGAS)](#-évaluation-qualité-ragas)
10. [Plan d'implémentation](#-plan-dimplémentation)
11. [Coûts et ressources](#-coûts-et-ressources)

---

## 🎯 VISION ET OBJECTIFS

### Mission

Construire un système de production de contenu **autonome, intelligent et différenciant** qui génère des articles B2B sur l'IA de qualité professionnelle pour les PME françaises.

### Objectifs clés

| Objectif | Métrique cible |
|----------|----------------|
| **Fiabilité** | 0 hallucination, 100% sources vérifiables |
| **Qualité** | Score RAGAS Faithfulness > 0.85 |
| **Cohérence** | Identité visuelle reconnaissable |
| **Variété** | 4 types d'articles équilibrés |
| **Autonomie** | 0 intervention manuelle |
| **Évolutivité** | Facilement extensible |

### Ce que le système produit

```
INPUT  : Scheduler quotidien (8h00)
OUTPUT : Article publié avec visuels cohérents
         ├── 1400-2000 mots
         ├── Sources vérifiées et citées
         ├── Image hero style "Flat Bold"
         ├── 1-3 graphiques data
         └── Publié automatiquement sur le blog
```

---

## 🐍 POURQUOI PYTHON/LANGGRAPH

### Comparatif objectif

| Critère | Node.js (V5 précédente) | Python/LangGraph |
|---------|-------------------------|------------------|
| **Écosystème IA** | Limité | Dominant, mature |
| **Frameworks agents** | Aucun standard | LangGraph, CrewAI, AutoGen |
| **Évaluation qualité** | À coder from scratch | RAGAS intégré |
| **Communauté** | Petite pour l'IA | Massive, active |
| **Debugging** | Console.log | LangSmith, traces structurées |
| **État des agents** | Manuel | Natif avec checkpointing |
| **Boucles feedback** | Complexe | Natif |
| **Maintenance** | Dette technique | Patterns établis |

### Ce que LangGraph apporte

```
┌─────────────────────────────────────────────────────────────────┐
│                    AVANTAGES LANGGRAPH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ GRAPHES D'ÉTAT                                              │
│     Chaque agent accède à un état partagé et le modifie        │
│     → Plus de données perdues entre agents                      │
│                                                                  │
│  ✅ FLUX CONDITIONNELS                                          │
│     if score < 7: → révision                                    │
│     if score >= 7: → publication                                │
│     → Logique métier native                                     │
│                                                                  │
│  ✅ BOUCLES DE FEEDBACK                                         │
│     Agent Critique → Agent Rédacteur → Agent Critique           │
│     → Amélioration itérative automatique                        │
│                                                                  │
│  ✅ CHECKPOINTING                                               │
│     Sauvegarde état à chaque étape                             │
│     → Reprise en cas d'échec, pas de perte                     │
│                                                                  │
│  ✅ STREAMING                                                   │
│     Voir la génération en temps réel                           │
│     → Debugging facilité                                        │
│                                                                  │
│  ✅ OBSERVABILITÉ (LangSmith)                                   │
│     Traces, métriques, debugging visuel                        │
│     → Comprendre ce qui se passe vraiment                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARCHITECTURE GLOBALE

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIZM AI - LANGGRAPH WORKFLOW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                │
│                              │  SCHEDULER  │                                │
│                              │   (cron)    │                                │
│                              └──────┬──────┘                                │
│                                     │                                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         STATE (GraphState)                            │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ • sujet: dict           • article: str        • score: float    │ │   │
│  │  │ • type_article: str     • visuels: dict       • published: bool │ │   │
│  │  │ • sources: list         • critiques: list     • errors: list    │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│       ┌─────────────────────────────┼─────────────────────────────┐         │
│       │                             │                             │         │
│       ▼                             ▼                             ▼         │
│  ┌─────────┐                  ┌─────────┐                  ┌─────────┐      │
│  │ VEILLE  │────────────────▶│ ANALYSE │────────────────▶│RÉDACTION│      │
│  │  Agent  │                  │  Agent  │                  │  Agent  │      │
│  └─────────┘                  └─────────┘                  └────┬────┘      │
│       │                             │                           │           │
│       │ Perplexity API             │ Claude                    │ Claude    │
│       │ → 5-7 sujets               │ → Type optimal            │ → Article │
│       │                             │ → Angle Prizm             │           │
│       │                             │                           │           │
│       │                             │                           ▼           │
│       │                             │                    ┌───────────┐      │
│       │                             │                    │ CRITIQUE  │      │
│       │                             │                    │   Agent   │◀──┐  │
│       │                             │                    └─────┬─────┘   │  │
│       │                             │                          │         │  │
│       │                             │              ┌───────────┴────┐    │  │
│       │                             │              ▼                ▼    │  │
│       │                             │        Score ≥ 7        Score < 7  │  │
│       │                             │              │                │    │  │
│       │                             │              │                ▼    │  │
│       │                             │              │         ┌─────────┐ │  │
│       │                             │              │         │RÉVISION │─┘  │
│       │                             │              │         │  Agent  │    │
│       │                             │              │         └─────────┘    │
│       │                             │              │          (max 2x)      │
│       │                             │              ▼                        │
│       │                             │        ┌─────────┐                    │
│       │                             │        │ VISUELS │                    │
│       │                             │        │  Agent  │                    │
│       │                             │        └────┬────┘                    │
│       │                             │             │                         │
│       │                             │             │ DALL-E + QuickChart     │
│       │                             │             ▼                         │
│       │                             │        ┌─────────┐                    │
│       │                             │        │ PUBLISH │                    │
│       │                             │        │  Agent  │                    │
│       │                             │        └────┬────┘                    │
│       │                             │             │                         │
│       │                             │             │ Git + Astro             │
│       │                             │             ▼                         │
│       │                             │        ┌─────────┐                    │
│       │                             │        │  DONE   │                    │
│       │                             │        └─────────┘                    │
│       │                             │                                       │
└───────┴─────────────────────────────┴───────────────────────────────────────┘
```

### Flux conditionnel

```python
# Logique de routage native LangGraph
def router(state: GraphState) -> str:
    if state.score >= 7:
        return "visuels"      # Assez bon → générer visuels
    elif state.revision_count < 2:
        return "revision"     # Pas assez bon → réviser
    else:
        return "reject"       # Trop de révisions → rejeter
```

---

## 🤖 LES AGENTS EN DÉTAIL

### 1. Agent Veille (VeilleAgent)

**Rôle** : Scanner l'actualité IA et identifier les sujets pertinents pour PME françaises

**Input** : Aucun (autonome)  
**Output** : Liste de 5-7 sujets structurés

```python
class VeilleAgent:
    """
    Utilise Perplexity API pour la veille en temps réel.
    Parse et structure les résultats de manière robuste.
    """
    
    def __init__(self):
        self.client = Perplexity(api_key=os.getenv("PERPLEXITY_API_KEY"))
        self.prompt = """
        Tu es un veilleur expert en IA pour les PME françaises.
        
        Identifie 5-7 sujets d'actualité IA des dernières 48h qui sont :
        - Pertinents pour les PME/ETI françaises
        - Actionnables (pas juste théoriques)
        - Sourcés (avec URLs vérifiables)
        
        Pour chaque sujet, fournis :
        - Titre accrocheur
        - Résumé (2-3 phrases)
        - Sources (URLs complètes)
        - Angle Prizm (pourquoi c'est pertinent pour nos lecteurs)
        - Score pertinence (1-10)
        """
    
    async def run(self, state: GraphState) -> GraphState:
        response = await self.client.search(self.prompt)
        sujets = self.parse_response(response)
        
        # Mise à jour de l'état partagé
        state.sujets = sujets
        state.sources = self.extract_all_sources(sujets)
        
        return state
```

---

### 2. Agent Analyse (AnalyseAgent)

**Rôle** : Analyser les sujets et déterminer le type d'article optimal

**Input** : Liste de sujets (state.sujets)  
**Output** : Sujet sélectionné + type d'article + angle

```python
class AnalyseAgent:
    """
    Sélectionne le meilleur sujet et détermine le type d'article.
    Respecte le planning éditorial (ratio 40/30/20/10).
    """
    
    TYPES = {
        "actualite": 0.40,   # 40% des articles
        "analyse": 0.30,     # 30%
        "guide": 0.20,       # 20%
        "opinion": 0.10      # 10%
    }
    
    async def run(self, state: GraphState) -> GraphState:
        # 1. Déterminer le type selon planning
        type_optimal = self.determine_type()
        
        # 2. Sélectionner le sujet le plus adapté à ce type
        sujet = self.select_best_subject(state.sujets, type_optimal)
        
        # 3. Définir l'angle Prizm
        angle = await self.define_angle(sujet, type_optimal)
        
        state.sujet = sujet
        state.type_article = type_optimal
        state.angle = angle
        
        return state
    
    def determine_type(self) -> str:
        """Respecte le ratio hebdomadaire 40/30/20/10"""
        # Vérifie les articles déjà publiés cette semaine
        # Retourne le type sous-représenté
        ...
```

---

### 3. Agent Rédaction (RedactionAgent)

**Rôle** : Rédiger l'article complet selon le type et la voix Prizm

**Input** : Sujet + type + angle (state)  
**Output** : Article brut (1400-2000 mots)

```python
class RedactionAgent:
    """
    Rédige l'article en respectant :
    - Le template du type d'article
    - La voix Prizm AI (85% pro + 15% personnalité)
    - Les contraintes (anti-répétition, sources citées)
    """
    
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
        self.templates = self.load_templates()
        self.voix = self.load_voix_prizm()
    
    async def run(self, state: GraphState) -> GraphState:
        template = self.templates[state.type_article]
        
        prompt = f"""
        {self.voix.system_prompt}
        
        ## SUJET
        {state.sujet}
        
        ## TYPE D'ARTICLE
        {state.type_article}
        
        ## TEMPLATE À SUIVRE
        {template}
        
        ## ANGLE PRIZM
        {state.angle}
        
        ## SOURCES DISPONIBLES
        {state.sources}
        
        ## CONTRAINTES
        - 1400-2000 mots
        - Maximum 5 occurrences de "PME"
        - Maximum 3 occurrences de "ETI"
        - Chaque affirmation doit citer sa source
        - Au moins 2 questions engageantes
        - Au moins 1 framework actionnable
        
        Rédige l'article complet en Markdown.
        """
        
        response = await self.llm.ainvoke(prompt)
        
        state.article = response.content
        state.revision_count = 0
        
        return state
```

---

### 4. Agent Critique (CritiqueAgent)

**Rôle** : Évaluer la qualité de l'article et fournir un feedback structuré

**Input** : Article brut (state.article)  
**Output** : Score + critiques détaillées

```python
class CritiqueAgent:
    """
    Évalue l'article selon les critères Prizm AI.
    Utilise RAGAS pour l'évaluation objective.
    Fournit un feedback actionnable pour révision.
    """
    
    CRITERES = {
        "longueur": {"poids": 0.15, "cible": "1400-2000 mots"},
        "sources": {"poids": 0.20, "cible": "3+ citations"},
        "repetition": {"poids": 0.15, "cible": "PME≤5, ETI≤3"},
        "structure": {"poids": 0.15, "cible": "3+ H2, intro, conclusion"},
        "voix_prizm": {"poids": 0.15, "cible": "questions, frameworks"},
        "faithfulness": {"poids": 0.20, "cible": "RAGAS > 0.85"}
    }
    
    async def run(self, state: GraphState) -> GraphState:
        # 1. Métriques automatiques
        scores = {}
        scores["longueur"] = self.eval_longueur(state.article)
        scores["sources"] = self.eval_sources(state.article, state.sources)
        scores["repetition"] = self.eval_repetition(state.article)
        scores["structure"] = self.eval_structure(state.article)
        scores["voix_prizm"] = self.eval_voix(state.article)
        
        # 2. RAGAS Faithfulness
        scores["faithfulness"] = await self.eval_ragas(
            state.article, 
            state.sources
        )
        
        # 3. Score global pondéré
        score_global = sum(
            scores[k] * self.CRITERES[k]["poids"] 
            for k in scores
        )
        
        # 4. Générer critiques si score < 7
        critiques = []
        if score_global < 7:
            critiques = self.generate_critiques(scores)
        
        state.score = round(score_global, 1)
        state.critiques = critiques
        state.scores_detail = scores
        
        return state
    
    async def eval_ragas(self, article: str, sources: list) -> float:
        """Évalue la fidélité aux sources avec RAGAS"""
        from ragas.metrics import faithfulness
        from ragas import evaluate
        
        # Préparer le dataset RAGAS
        dataset = Dataset.from_dict({
            "question": ["Résume les informations clés"],
            "answer": [article],
            "contexts": [sources]
        })
        
        result = evaluate(dataset, metrics=[faithfulness])
        return result["faithfulness"]
```

---

### 5. Agent Révision (RevisionAgent)

**Rôle** : Améliorer l'article selon les critiques

**Input** : Article + critiques (state)  
**Output** : Article révisé

```python
class RevisionAgent:
    """
    Révise l'article en fonction des critiques.
    Maximum 2 révisions pour éviter les boucles infinies.
    """
    
    async def run(self, state: GraphState) -> GraphState:
        prompt = f"""
        ## ARTICLE ACTUEL
        {state.article}
        
        ## CRITIQUES À ADRESSER
        {state.critiques}
        
        ## SCORE ACTUEL
        {state.score}/10
        
        ## OBJECTIF
        Score ≥ 7/10
        
        Révise l'article pour adresser CHAQUE critique.
        Garde le même ton et la même structure générale.
        Retourne l'article complet révisé.
        """
        
        response = await self.llm.ainvoke(prompt)
        
        state.article = response.content
        state.revision_count += 1
        
        return state
```

---

### 6. Agent Visuels (VisuelsAgent)

**Rôle** : Générer l'image hero et les graphiques

**Input** : Article validé (state)  
**Output** : Chemins des visuels générés

```python
class VisuelsAgent:
    """
    Génère les visuels avec l'identité Prizm AI :
    - Image hero (DALL-E, style Flat Bold)
    - Graphiques (QuickChart, palette Prizm)
    """
    
    PROMPT_SIGNATURE = """
    Editorial illustration in the style of The Economist and New York Times Opinion.
    Bold flat color blocks with visible risograph grain texture.
    Professional business people with stylized but expressive features, no generic faces.
    Serious, engaged expressions - no forced corporate smiles.
    Dynamic multi-figure composition with varied angles and gazes.
    Limited palette strictly enforced: deep navy blue (#1E3A5F), warm coral-orange (#F97316), indigo (#6366F1), cream white (#F8FAFC).
    Subtle retro editorial aesthetic, confident and authoritative.
    No 3D effects, no gradients, no stock photo aesthetic.
    Aspect ratio 16:9, high contrast.
    """
    
    TYPE_ADAPTATIONS = {
        "actualite": "Sense of immediacy, news-like urgency, forward-looking gazes.",
        "analyse": "Contemplative poses, analytical mood, examining data elements.",
        "guide": "Helpful gestures, teaching poses, step-by-step visual metaphor.",
        "opinion": "Confident stance, thought leadership pose, bold composition."
    }
    
    PALETTE = {
        "principal": "#1E3A5F",
        "secondaire": "#6366F1",
        "accent": "#F97316",
        "fond": "#F8FAFC",
        "texte": "#1E293B"
    }
    
    async def run(self, state: GraphState) -> GraphState:
        visuels = {"hero": None, "graphiques": []}
        
        # 1. Image Hero (DALL-E)
        visuels["hero"] = await self.generate_hero(
            state.sujet["titre"],
            state.type_article
        )
        
        # 2. Graphiques (si données dans l'article)
        donnees = self.extract_data_points(state.article)
        for data in donnees[:3]:  # Max 3 graphiques
            graphique = await self.generate_chart(data)
            visuels["graphiques"].append(graphique)
        
        state.visuels = visuels
        
        return state
    
    async def generate_hero(self, titre: str, type_article: str) -> dict:
        """Génère l'image hero avec DALL-E"""
        adaptation = self.TYPE_ADAPTATIONS.get(type_article, "")
        
        prompt = f"{self.PROMPT_SIGNATURE}\n{adaptation}\nTopic: {titre}"
        
        response = await self.openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",
            quality="standard"
        )
        
        # Télécharger et optimiser
        image_path = await self.download_and_optimize(
            response.data[0].url,
            titre
        )
        
        return {"path": image_path, "prompt": prompt}
```

---

### 7. Agent Publication (PublishAgent)

**Rôle** : Publier l'article sur le blog

**Input** : Article + visuels (state)  
**Output** : URL de l'article publié

```python
class PublishAgent:
    """
    Publie l'article sur le blog Astro :
    - Génère le frontmatter
    - Copie les images
    - Commit et push Git
    """
    
    async def run(self, state: GraphState) -> GraphState:
        # 1. Préparer le fichier Markdown
        frontmatter = self.generate_frontmatter(state)
        content = f"---\n{frontmatter}---\n\n{state.article}"
        
        # 2. Nommer le fichier
        date = datetime.now().strftime("%Y-%m-%d")
        slug = self.slugify(state.sujet["titre"])
        filename = f"{date}-{slug}.md"
        
        # 3. Copier les images
        await self.copy_images(state.visuels, slug)
        
        # 4. Écrire l'article
        filepath = BLOG_PATH / filename
        filepath.write_text(content, encoding="utf-8")
        
        # 5. Git commit + push
        await self.git_publish(filename, state.sujet["titre"])
        
        state.published = True
        state.url = f"https://prizm-ai.com/blog/{slug}"
        
        return state
```

---

## 🎨 IDENTITÉ VISUELLE INTÉGRÉE

### Charte graphique

```python
# config/visual_identity.py

VISUAL_IDENTITY = {
    "style": "Flat Bold Editorial",
    
    "palette": {
        "principal": "#1E3A5F",    # Navy Blue - Confiance
        "secondaire": "#6366F1",   # Indigo - Innovation
        "accent": "#F97316",       # Coral Orange - Action
        "fond": "#F8FAFC",         # Off-white - Respiration
        "texte": "#1E293B",        # Near-black - Lisibilité
        "gris": "#64748B"          # Slate - Secondaire
    },
    
    "inspirations": [
        "The Economist illustrations",
        "New York Times Opinion",
        "Risograph texture"
    ],
    
    "caracteristiques": [
        "Aplats de couleur francs",
        "Texture grain risograph",
        "Personnages stylisés expressifs",
        "Compositions dynamiques",
        "Expressions sérieuses engagées",
        "Pas de sourires corporate"
    ],
    
    "prompt_base": """
    Editorial illustration in the style of The Economist and New York Times Opinion.
    Bold flat color blocks with visible risograph grain texture.
    Professional business people with stylized but expressive features, no generic faces.
    Serious, engaged expressions - no forced corporate smiles.
    Dynamic multi-figure composition with varied angles and gazes.
    Limited palette strictly enforced: deep navy blue (#1E3A5F), warm coral-orange (#F97316), indigo (#6366F1), cream white (#F8FAFC).
    Subtle retro editorial aesthetic, confident and authoritative.
    No 3D effects, no gradients, no stock photo aesthetic.
    Aspect ratio 16:9, high contrast.
    """,
    
    "adaptations_type": {
        "actualite": "Sense of immediacy, news-like urgency, forward-looking gazes.",
        "analyse": "Contemplative poses, analytical mood, examining data elements.",
        "guide": "Helpful gestures, teaching poses, step-by-step visual metaphor.",
        "opinion": "Confident stance, thought leadership pose, bold composition."
    },
    
    "graphiques": {
        "type_default": "horizontalBar",
        "border_width": 0,
        "font_family": "Inter, sans-serif",
        "title_size": 18,
        "label_size": 12,
        "source_size": 10
    }
}
```

---

## 🛠️ STACK TECHNIQUE COMPLET

### Dépendances principales

```toml
# pyproject.toml

[project]
name = "prizm-ai"
version = "5.0.0"
requires-python = ">=3.11"

dependencies = [
    # Framework agents
    "langgraph>=0.2.0",
    "langchain>=0.3.0",
    "langchain-anthropic>=0.2.0",
    "langchain-openai>=0.2.0",
    
    # Évaluation qualité
    "ragas>=0.2.0",
    "datasets>=2.0.0",
    
    # APIs externes
    "openai>=1.0.0",           # DALL-E
    "httpx>=0.27.0",           # HTTP async (Perplexity)
    "quickchart.io>=1.0.0",    # Graphiques
    
    # Traitement texte
    "pydantic>=2.0.0",         # Validation données
    "tiktoken>=0.7.0",         # Comptage tokens
    "markdown>=3.6",           # Parsing Markdown
    
    # Utilitaires
    "python-dotenv>=1.0.0",    # Variables environnement
    "pillow>=10.0.0",          # Traitement images
    "aiofiles>=24.0.0",        # I/O async
    "gitpython>=3.1.0",        # Git automation
    
    # Observabilité (optionnel)
    "langsmith>=0.1.0",        # Tracing LangGraph
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "ruff>=0.4.0",
    "mypy>=1.10.0",
]
```

### Configuration environnement

```bash
# .env

# APIs IA
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# Observabilité (optionnel)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=prizm-ai-v5

# Chemins
BLOG_PATH=/path/to/prizmia/src/content/blog
IMAGES_PATH=/path/to/prizmia/public/images/blog
OUTPUT_PATH=/path/to/prizm-ai/output

# Configuration
MAX_REVISIONS=2
TARGET_SCORE=7.0
DEFAULT_MODEL=claude-3-5-sonnet-20241022
```

---

## 📁 STRUCTURE DU PROJET

```
prizm-ai/
│
├── pyproject.toml                 # Configuration projet
├── .env                           # Variables environnement
├── README.md                      # Documentation
│
├── src/
│   └── prizm_ai/
│       │
│       ├── __init__.py
│       ├── main.py                # Point d'entrée
│       │
│       ├── config/
│       │   ├── __init__.py
│       │   ├── settings.py        # Configuration Pydantic
│       │   ├── visual_identity.py # Charte visuelle
│       │   ├── voix_prizm.py      # Guide voix éditoriale
│       │   └── templates.py       # Templates 4 types
│       │
│       ├── agents/
│       │   ├── __init__.py
│       │   ├── veille.py          # VeilleAgent
│       │   ├── analyse.py         # AnalyseAgent
│       │   ├── redaction.py       # RedactionAgent
│       │   ├── critique.py        # CritiqueAgent
│       │   ├── revision.py        # RevisionAgent
│       │   ├── visuels.py         # VisuelsAgent
│       │   └── publish.py         # PublishAgent
│       │
│       ├── graph/
│       │   ├── __init__.py
│       │   ├── state.py           # GraphState (état partagé)
│       │   ├── nodes.py           # Nœuds du graphe
│       │   ├── edges.py           # Conditions de routage
│       │   └── workflow.py        # Construction du graphe
│       │
│       ├── evaluation/
│       │   ├── __init__.py
│       │   ├── metrics.py         # Métriques custom
│       │   └── ragas_eval.py      # Intégration RAGAS
│       │
│       └── utils/
│           ├── __init__.py
│           ├── perplexity.py      # Client Perplexity
│           ├── images.py          # Traitement images
│           ├── git.py             # Git automation
│           └── parsing.py         # Parsing texte
│
├── templates/
│   ├── actualite.md               # Template actualité
│   ├── analyse.md                 # Template analyse
│   ├── guide.md                   # Template guide
│   └── opinion.md                 # Template opinion
│
├── tests/
│   ├── __init__.py
│   ├── test_agents/
│   ├── test_evaluation/
│   └── test_workflow/
│
├── output/
│   ├── articles/                  # Articles générés
│   ├── visuels/                   # Images générées
│   └── reports/                   # Rapports de session
│
└── scripts/
    ├── run_pipeline.py            # Exécution manuelle
    ├── scheduler.py               # Scheduler quotidien
    └── test_visual.py             # Test génération image
```

---

## 🔄 WORKFLOW LANGGRAPH

### Définition du graphe

```python
# src/prizm_ai/graph/workflow.py

from langgraph.graph import StateGraph, END
from prizm_ai.graph.state import GraphState
from prizm_ai.agents import (
    VeilleAgent, AnalyseAgent, RedactionAgent,
    CritiqueAgent, RevisionAgent, VisuelsAgent, PublishAgent
)

def create_workflow() -> StateGraph:
    """Crée le workflow LangGraph complet"""
    
    # Initialiser le graphe avec l'état
    workflow = StateGraph(GraphState)
    
    # Instancier les agents
    veille = VeilleAgent()
    analyse = AnalyseAgent()
    redaction = RedactionAgent()
    critique = CritiqueAgent()
    revision = RevisionAgent()
    visuels = VisuelsAgent()
    publish = PublishAgent()
    
    # Ajouter les nœuds
    workflow.add_node("veille", veille.run)
    workflow.add_node("analyse", analyse.run)
    workflow.add_node("redaction", redaction.run)
    workflow.add_node("critique", critique.run)
    workflow.add_node("revision", revision.run)
    workflow.add_node("visuels", visuels.run)
    workflow.add_node("publish", publish.run)
    
    # Définir le point d'entrée
    workflow.set_entry_point("veille")
    
    # Ajouter les arêtes (flux linéaire)
    workflow.add_edge("veille", "analyse")
    workflow.add_edge("analyse", "redaction")
    workflow.add_edge("redaction", "critique")
    
    # Arête conditionnelle après critique
    workflow.add_conditional_edges(
        "critique",
        route_after_critique,
        {
            "revision": "revision",
            "visuels": "visuels",
            "reject": END
        }
    )
    
    # Retour de révision vers critique
    workflow.add_edge("revision", "critique")
    
    # Flux final
    workflow.add_edge("visuels", "publish")
    workflow.add_edge("publish", END)
    
    return workflow.compile()


def route_after_critique(state: GraphState) -> str:
    """Détermine le prochain nœud après critique"""
    
    if state.score >= 7.0:
        return "visuels"
    elif state.revision_count < 2:
        return "revision"
    else:
        # Trop de révisions, on rejette
        print(f"❌ Article rejeté après {state.revision_count} révisions (score: {state.score})")
        return "reject"
```

### État partagé

```python
# src/prizm_ai/graph/state.py

from typing import TypedDict, Optional
from pydantic import BaseModel

class GraphState(TypedDict):
    """État partagé entre tous les agents"""
    
    # Veille
    sujets: list[dict]
    sources: list[str]
    
    # Analyse
    sujet: dict
    type_article: str
    angle: str
    
    # Rédaction
    article: str
    
    # Critique
    score: float
    critiques: list[str]
    scores_detail: dict
    revision_count: int
    
    # Visuels
    visuels: dict
    
    # Publication
    published: bool
    url: str
    
    # Erreurs
    errors: list[str]
```

### Exécution

```python
# src/prizm_ai/main.py

import asyncio
from prizm_ai.graph.workflow import create_workflow
from prizm_ai.graph.state import GraphState

async def run_pipeline():
    """Exécute le pipeline complet"""
    
    # Créer le workflow
    workflow = create_workflow()
    
    # État initial
    initial_state = GraphState(
        sujets=[],
        sources=[],
        sujet={},
        type_article="",
        angle="",
        article="",
        score=0.0,
        critiques=[],
        scores_detail={},
        revision_count=0,
        visuels={},
        published=False,
        url="",
        errors=[]
    )
    
    # Exécuter avec streaming
    print("🚀 Démarrage pipeline Prizm AI V5\n")
    
    async for event in workflow.astream(initial_state):
        # Afficher la progression
        node = list(event.keys())[0]
        print(f"✅ {node.upper()} terminé")
        
        # Afficher le score si disponible
        if "critique" in event:
            score = event["critique"].get("score", 0)
            print(f"   Score: {score}/10")
    
    # Récupérer l'état final
    final_state = await workflow.ainvoke(initial_state)
    
    # Résumé
    print("\n" + "="*50)
    print("📊 RÉSUMÉ SESSION")
    print("="*50)
    print(f"Sujet: {final_state['sujet'].get('titre', 'N/A')}")
    print(f"Type: {final_state['type_article']}")
    print(f"Score: {final_state['score']}/10")
    print(f"Publié: {'✓' if final_state['published'] else '✗'}")
    if final_state['published']:
        print(f"URL: {final_state['url']}")
    
    return final_state


if __name__ == "__main__":
    asyncio.run(run_pipeline())
```

---

## 📊 ÉVALUATION QUALITÉ (RAGAS)

### Intégration RAGAS

```python
# src/prizm_ai/evaluation/ragas_eval.py

from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision
)
from datasets import Dataset

async def evaluate_article(
    article: str,
    sources: list[str],
    sujet: dict
) -> dict:
    """
    Évalue l'article avec RAGAS.
    
    Metrics:
    - Faithfulness: L'article est-il fidèle aux sources ?
    - Relevancy: L'article répond-il au sujet ?
    - Precision: Les sources sont-elles bien utilisées ?
    """
    
    # Préparer le dataset
    dataset = Dataset.from_dict({
        "question": [sujet.get("titre", "")],
        "answer": [article],
        "contexts": [sources],
        "ground_truth": [sujet.get("resume", "")]
    })
    
    # Évaluer
    result = evaluate(
        dataset,
        metrics=[
            faithfulness,
            answer_relevancy,
            context_precision
        ]
    )
    
    return {
        "faithfulness": result["faithfulness"],
        "relevancy": result["answer_relevancy"],
        "precision": result["context_precision"],
        "global": (
            result["faithfulness"] * 0.5 +
            result["answer_relevancy"] * 0.3 +
            result["context_precision"] * 0.2
        )
    }
```

### Métriques custom

```python
# src/prizm_ai/evaluation/metrics.py

import re
from collections import Counter

def eval_longueur(article: str) -> float:
    """Évalue la longueur (cible: 1400-2000 mots)"""
    mots = len(article.split())
    
    if 1400 <= mots <= 2000:
        return 10.0
    elif 1200 <= mots <= 2200:
        return 7.0
    elif 1000 <= mots <= 2500:
        return 5.0
    else:
        return 3.0


def eval_repetition(article: str) -> float:
    """Évalue les répétitions (PME ≤ 5, ETI ≤ 3)"""
    pme_count = len(re.findall(r'\bPME\b', article, re.IGNORECASE))
    eti_count = len(re.findall(r'\bETI\b', article, re.IGNORECASE))
    
    score = 10.0
    if pme_count > 5:
        score -= (pme_count - 5) * 0.5
    if eti_count > 3:
        score -= (eti_count - 3) * 0.5
    
    return max(0, score)


def eval_diversite_lexicale(article: str) -> float:
    """Évalue la richesse du vocabulaire"""
    mots = re.findall(r'\b[a-zàâäéèêëïîôùûüç]{4,}\b', article.lower())
    unique = set(mots)
    
    ratio = len(unique) / len(mots) if mots else 0
    
    # Ratio ~0.65 = excellent
    return min(10.0, ratio * 15)


def eval_structure(article: str) -> float:
    """Évalue la structure (H2, intro, conclusion)"""
    h2_count = len(re.findall(r'^##\s', article, re.MULTILINE))
    h3_count = len(re.findall(r'^###\s', article, re.MULTILINE))
    
    score = 0
    if h2_count >= 3:
        score += 4
    if h2_count >= 4:
        score += 2
    if h3_count >= 2:
        score += 2
    
    # Intro et conclusion
    if len(article[:500]) > 200:
        score += 1
    if "conclusion" in article[-500:].lower() or "synthèse" in article[-500:].lower():
        score += 1
    
    return min(10, score)


def eval_voix_prizm(article: str) -> float:
    """Évalue la présence de la voix Prizm AI"""
    score = 5.0  # Base
    
    # Questions engageantes
    questions = len(re.findall(r'\?', article))
    if questions >= 2:
        score += 2
    
    # Listes / frameworks
    listes = len(re.findall(r'^[-•→]\s', article, re.MULTILINE))
    if listes >= 3:
        score += 1.5
    
    # Chiffres / données
    chiffres = len(re.findall(r'\d+%|\d+\s*(millions?|milliards?|€|euros?)', article, re.IGNORECASE))
    if chiffres >= 3:
        score += 1.5
    
    return min(10, score)
```

---

## 📅 PLAN D'IMPLÉMENTATION

### Vue d'ensemble

| Phase | Durée | Focus | Livrable |
|-------|-------|-------|----------|
| **0** | 2 jours | Setup | Environnement Python, structure projet |
| **1** | 1 semaine | Core | Workflow LangGraph basique fonctionnel |
| **2** | 1 semaine | Qualité | RAGAS, critique, révision, visuels |
| **3** | 3-5 jours | Production | Publication auto, scheduler, monitoring |

**Total estimé : 4-5 semaines**

---

### Phase 0 : Setup (Jours 1-2)

| Tâche | Temps | Priorité |
|-------|-------|----------|
| Créer projet Python (pyproject.toml, structure) | 2h | 🔴 |
| Configurer environnement (.env, settings) | 1h | 🔴 |
| Installer dépendances (LangGraph, LangChain, etc.) | 1h | 🔴 |
| Configurer LangSmith (observabilité) | 1h | 🟡 |
| Tester connexion APIs (Claude, DALL-E, Perplexity) | 2h | 🔴 |

**Livrable** : Projet Python fonctionnel avec APIs connectées

---

### Phase 1 : Core (Semaine 1)

| Jour | Tâche | Temps |
|------|-------|-------|
| **1** | GraphState + structure workflow | 3h |
| **2** | VeilleAgent (Perplexity) | 4h |
| **3** | AnalyseAgent (sélection sujet, type) | 3h |
| **4** | RedactionAgent (templates, voix Prizm) | 5h |
| **5** | Intégration workflow basique | 3h |
| **5** | Tests end-to-end | 2h |

**Livrable** : Pipeline génère un article brut

---

### Phase 2 : Qualité (Semaine 2)

| Jour | Tâche | Temps |
|------|-------|-------|
| **1** | CritiqueAgent (métriques custom) | 4h |
| **2** | Intégration RAGAS | 3h |
| **3** | RevisionAgent + boucle feedback | 3h |
| **4** | VisuelsAgent (DALL-E + QuickChart) | 5h |
| **5** | Tests qualité sur 5 articles | 3h |

**Livrable** : Articles validés avec score qualité et visuels

---

### Phase 3 : Production (Jours 15-20)

| Jour | Tâche | Temps |
|------|-------|-------|
| **1** | PublishAgent (Git, frontmatter) | 4h |
| **2** | Scheduler (cron Python) | 2h |
| **3** | Monitoring + alertes | 3h |
| **4** | Documentation | 2h |
| **5** | Tests production 3 articles | 3h |

**Livrable** : Production automatique avec monitoring

---

## 💰 COÛTS ET RESSOURCES

### Développement

| Phase | Heures | Équivalent freelance (60€/h) |
|-------|--------|------------------------------|
| Phase 0 | 7h | 420€ |
| Phase 1 | 20h | 1200€ |
| Phase 2 | 18h | 1080€ |
| Phase 3 | 14h | 840€ |
| **Total** | **59h** | **3540€** |

### Coûts opérationnels mensuels

| Service | Usage | Coût |
|---------|-------|------|
| Anthropic (Claude) | ~90 articles/mois | ~40€ |
| OpenAI (DALL-E) | ~90 images/mois | ~15€ |
| Perplexity | ~90 veilles/mois | ~20€ |
| LangSmith (optionnel) | Tracing | Gratuit (tier free) |
| **Total** | | **~75€/mois** |

### Coût par article

```
Claude (rédaction + critique + révision) : ~$0.10
DALL-E (image hero)                      : ~$0.04
Perplexity (veille)                      : ~$0.02
QuickChart (graphiques)                  : Gratuit
─────────────────────────────────────────────────
Total                                    : ~$0.16/article (~0.15€)
```

---

## ✅ CRITÈRES DE SUCCÈS

### Phase 1
- [ ] Workflow LangGraph exécute sans erreur
- [ ] Article généré avec 1400+ mots
- [ ] 4 types d'articles fonctionnels

### Phase 2
- [ ] Score RAGAS Faithfulness > 0.85
- [ ] Boucle révision fonctionne (max 2 itérations)
- [ ] Image hero générée avec style Flat Bold
- [ ] Graphiques générés avec palette Prizm

### Phase 3
- [ ] Publication automatique (Git push)
- [ ] Scheduler quotidien fonctionnel
- [ ] Taux de succès > 95%
- [ ] Monitoring avec alertes

---

## 🎯 PROCHAINE ÉTAPE

**Phase 0 : Setup**

Je peux commencer par créer :
1. La structure du projet Python
2. Le fichier `pyproject.toml` avec toutes les dépendances
3. Les fichiers de configuration (settings, visual_identity, voix_prizm)
4. Le squelette des agents

**Tu veux qu'on démarre ?**
