# 🚀 Prizm AI V5 - Pipeline Python/LangGraph

**Système de génération automatique d'articles B2B sur l'IA pour PME françaises.**

## 📋 Vue d'ensemble

Prizm AI V5 est un pipeline de génération de contenu basé sur :
- **LangGraph** pour l'orchestration des agents
- **Claude** (Anthropic) pour la rédaction
- **Perplexity** pour la veille en temps réel
- **DALL-E** pour les visuels
- **RAGAS** pour l'évaluation qualité

## 🏗️ Architecture

```
VEILLE → ANALYSE → RÉDACTION → CRITIQUE ←→ RÉVISION → VISUELS → PUBLISH
                                  ↓
                            (boucle max 2x)
```

### Les 7 agents

| Agent | Rôle |
|-------|------|
| **VeilleAgent** | Scan l'actualité IA (Perplexity) |
| **AnalyseAgent** | Sélectionne le sujet et le type |
| **RedactionAgent** | Rédige l'article (Claude) |
| **CritiqueAgent** | Évalue la qualité (RAGAS) |
| **RevisionAgent** | Améliore si score < 7 |
| **VisuelsAgent** | Génère hero + graphiques |
| **PublishAgent** | Publie sur le blog (Git) |

## ⚡ Installation

### 1. Prérequis

- Python 3.11+
- Git

### 2. Installation des dépendances

```bash
cd prizm-ai-v5
pip install -e .
```

### 3. Configuration

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos clés API
notepad .env
```

Clés requises :
- `ANTHROPIC_API_KEY` - [console.anthropic.com](https://console.anthropic.com/)
- `OPENAI_API_KEY` - [platform.openai.com](https://platform.openai.com/api-keys)
- `PERPLEXITY_API_KEY` - [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

### 4. Vérification

```bash
python -m prizm_ai.main --test
```

## 🚀 Utilisation

### Exécution manuelle

```bash
# Mode standard
python -m prizm_ai.main

# Mode verbeux
python -m prizm_ai.main --verbose
```

### Scheduler (production)

```bash
# Windows Task Scheduler
python scripts/scheduler.py
```

## 📁 Structure du projet

```
prizm-ai-v5/
├── src/prizm_ai/
│   ├── config/          # Configuration
│   │   ├── settings.py      # Variables environnement
│   │   ├── visual_identity.py  # Charte graphique
│   │   ├── voix_prizm.py    # Voix éditoriale
│   │   └── templates.py     # Templates 4 types
│   ├── agents/          # Les 7 agents
│   ├── graph/           # Workflow LangGraph
│   ├── evaluation/      # RAGAS
│   └── utils/           # Utilitaires
├── templates/           # Templates Markdown
├── output/              # Fichiers générés
└── tests/               # Tests
```

## 🎨 Types d'articles

| Type | Ratio | Description |
|------|-------|-------------|
| **Actualité** | 40% | Décryptage news IA |
| **Analyse** | 30% | Analyse tendance/étude |
| **Guide** | 20% | Tutoriel pas-à-pas |
| **Opinion** | 10% | Prise de position |

## 📊 Critères de qualité

L'Agent Critique évalue sur :
- **Longueur** (15%) : 1400-2000 mots
- **Sources** (20%) : 3+ citations
- **Répétitions** (15%) : PME ≤ 5, ETI ≤ 3
- **Structure** (15%) : 3+ H2
- **Voix Prizm** (15%) : Questions, frameworks
- **Faithfulness** (20%) : Fidélité aux sources

Score cible : **7/10 minimum**

## 💰 Coûts

| Service | Coût/article |
|---------|--------------|
| Claude | ~$0.08 |
| DALL-E | ~$0.04 |
| Perplexity | ~$0.02 |
| **Total** | **~$0.14** |

## 🔧 Développement

### Tests

```bash
pytest tests/
```

### Linting

```bash
ruff check src/
```

## 📝 License

MIT

---

**Prizm AI** - L'IA actionnelle pour les PME françaises 🇫🇷
