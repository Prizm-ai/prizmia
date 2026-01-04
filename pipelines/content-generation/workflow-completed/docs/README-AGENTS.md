# 🤖 README - AGENTS
## Documentation des agents du Workflow Completed

---

## 📋 VUE D'ENSEMBLE

Le système utilise 5 agents principaux qui travaillent en séquence pour générer des articles enrichis visuellement.

### Pipeline des agents

```
agent-veille → agent-redacteur → agent-analyseur → agent-generateur → agent-integrateur
     ↓              ↓                  ↓                ↓                  ↓
  01-veille    03-articles      analyse.json      05b-visuels      05-articles-finaux
```

---

## 1️⃣ AGENT VEILLE (agent-veille.cjs)

### Version actuelle : v6+ avec parser robuste

### Rôle
Collecte des sujets d'actualité IA pertinents pour les PME françaises via l'API Perplexity.

### Fonctionnalités clés
- **Parser robuste v6** : S'adapte automatiquement aux changements de format Perplexity
- **6 stratégies de parsing** : JSON, sections ###, sections **, fallback ligne par ligne
- **Scoring intelligent** : Évalue la pertinence PME (0-1)
- **Corpus enrichi** : 20-40 extraits par sujet

### Utilisation

```powershell
# Mode automatique (recherche générale)
node agents/agent-veille.cjs

# Mode dirigé (sujet spécifique)
node agents/agent-veille.cjs --dirige --titre "IA générative pour PME"

# Mode complet (recherche approfondie)
node agents/agent-veille.cjs --complet

# Mode test
node agents/agent-veille.cjs --test
```

### Sorties
- `output/01-veille/2025/11-novembre/veille-YYYY-MM-DD.md`
- `output/02-corpus/2025-MM-DD/[sujet]/metadata.json`
- `output/02-corpus/2025-MM-DD/[sujet]/source-N-[nom].md`

### Configuration
```javascript
// Dans agent-veille.cjs
const CONFIG = {
  NB_SUJETS_CIBLES: 5,
  NB_EXTRAITS_PAR_SUJET: 20,
  SCORE_MIN: 0.7,
  MODEL: 'sonar' // Nouveau modèle 2025
};
```

---

## 2️⃣ AGENT RÉDACTEUR FACTUEL (agent-redacteur-factuel.cjs)

### Version actuelle : v3+ optimisée

### Rôle
Génère des articles factuels de 1500+ mots basés sur les corpus vérifiés.

### Fonctionnalités clés
- **100% sourcé** : Aucune invention, tout vient du corpus
- **Structure SEO** : H1, H2, meta description
- **Citations intégrées** : Format (Source: nom)
- **Anti-répétition** : Tracking des sujets traités

### Utilisation

```powershell
# Utiliser le dernier corpus
node agents/agent-redacteur-factuel.cjs

# Spécifier un corpus
node agents/agent-redacteur-factuel.cjs --corpus "2025-11-01/1-adoption-ia"

# Mode test
node agents/agent-redacteur-factuel.cjs --test
```

### Sorties
- `output/03-articles-factuels/[date]-[slug].md`

### Structure de l'article
```markdown
---
title: "Titre optimisé SEO"
description: "Meta description 150-160 caractères"
date: 2025-11-02
author: "Prizm AI"
tags: ["IA", "PME", "Innovation"]
---

# Titre principal

## Introduction (200 mots)

## Section 1 : Contexte (400 mots)

## Section 2 : Solutions (500 mots)

## Section 3 : Cas pratiques (400 mots)

## Conclusion (200 mots)

### Sources et références
```

---

## 3️⃣ AGENT ANALYSEUR VISUEL (agent-analyseur-visuel.cjs)

### Version actuelle : v2.0

### Rôle
Analyse l'article généré et identifie les besoins en visuels.

### Fonctionnalités clés
- **Détection automatique** : Repère où placer les visuels
- **3 types** : Images (DALL-E), graphiques (Charts), schémas (Mermaid)
- **Prompts optimisés** : Génère les descriptions pour DALL-E
- **Positionnement intelligent** : Hero, sections, conclusion

### Utilisation

```powershell
# Analyser le dernier article
node agents/agent-analyseur-visuel.cjs

# Analyser un article spécifique
node agents/agent-analyseur-visuel.cjs --article "2025-11-02-adoption-ia.md"
```

### Sortie (JSON)
```json
{
  "article": "2025-11-02-adoption-ia.md",
  "visuels": [
    {
      "type": "hero",
      "position": 0,
      "prompt": "Modern office with AI visualization, professional",
      "format": "dalle"
    },
    {
      "type": "chart",
      "position": "section-2",
      "data": [20, 35, 52, 68],
      "labels": ["2021", "2022", "2023", "2024"],
      "format": "quickchart"
    },
    {
      "type": "schema",
      "position": "section-3",
      "mermaid": "graph LR\nA[Input]-->B[Process]-->C[Output]"
    }
  ]
}
```

---

## 4️⃣ AGENT GÉNÉRATEUR VISUEL (agent-generateur-visuel.cjs)

### Version actuelle : v2.1 (Session N7)

### Rôle
Orchestre la génération de tous les visuels identifiés.

### Fonctionnalités clés
- **Orchestration simplifiée** : Appelle les bons générateurs
- **Gestion d'erreurs** : Retry automatique, fallback
- **Optimisation coûts** : Skip si quota dépassé
- **Formats multiples** : PNG, SVG, WebP

### Utilisation

```powershell
# Générer depuis la dernière analyse
node agents/agent-generateur-visuel.cjs

# Depuis une analyse spécifique
node agents/agent-generateur-visuel.cjs --analyse "analyse-2025-11-02.json"

# Mode économique (moins d'images)
node agents/agent-generateur-visuel.cjs --eco
```

### Sorties
- Images : `output/05b-visuels/*.png`
- Rapport : `output/06-rapports/generation-[timestamp].json`

### Workflow interne
```javascript
// Pour chaque visuel
if (visuel.type === 'hero' || visuel.type === 'image') {
  await dalle.generate(visuel.prompt);
} else if (visuel.type === 'chart') {
  await charts.generate(visuel.data);
} else if (visuel.type === 'schema') {
  await mermaid.generate(visuel.mermaid);
}
```

---

## 5️⃣ AGENT INTÉGRATEUR VISUEL (agent-integrateur-visuel.cjs)

### Version actuelle : v2.0

### Rôle
Intègre les visuels générés dans l'article markdown.

### Fonctionnalités clés
- **Insertion intelligente** : Aux positions identifiées
- **Alt text SEO** : Descriptions optimisées
- **Chemins relatifs** : Pour compatibilité blog
- **Légendes** : Avec numérotation automatique

### Utilisation

```powershell
# Intégrer dans le dernier article
node agents/agent-integrateur-visuel.cjs

# Article et visuels spécifiques
node agents/agent-integrateur-visuel.cjs --article "article.md" --visuels "generation.json"
```

### Sortie
- `output/05-articles-finaux/[date]-[slug]-enrichi.md`

### Format d'intégration
```markdown
# Titre de l'article

![Hero - Description SEO optimisée](../05b-visuels/hero-[slug].png)

## Introduction
[Texte...]

## Section avec données

![Graphique - Évolution adoption IA](../05b-visuels/chart-[slug]-1.png)
*Figure 1 : Évolution de l'adoption de l'IA dans les PME (Source : Étude 2025)*

[Texte...]
```

---

## 🔧 CONFIGURATION COMMUNE

### Variables d'environnement
Tous les agents utilisent le même `.env` :

```bash
# config/.env
ANTHROPIC_API_KEY=sk-ant-xxx
PERPLEXITY_API_KEY=pplx-xxx
OPENAI_API_KEY=sk-xxx
```

### Gestion des chemins
Centralisée dans `config/paths.cjs` :

```javascript
// Tous les agents importent
const paths = require('../config/paths.cjs');

// Utilisation
const outputDir = paths.OUTPUT_DIR;
const veilleDir = paths.VEILLE_DIR;
```

---

## 🐛 DÉBOGAGE

### Logs
Chaque agent génère des logs dans `output/06-rapports/` :
- Format JSON pour parsing
- Format TXT pour lecture humaine

### Mode debug
```powershell
# Activer le mode debug
set DEBUG=true
node agents/[agent].cjs
```

### Erreurs communes

#### Agent veille : "Parser failed"
- Vérifier la clé API Perplexity
- Le parser v6 devrait s'adapter automatiquement

#### Agent rédacteur : "No corpus found"
- Vérifier que l'agent veille a créé un corpus
- Vérifier le chemin dans 02-corpus

#### Agent générateur : "API quota exceeded"
- Vérifier les quotas OpenAI
- Utiliser mode --eco

#### Agent intégrateur : "Image not found"
- Vérifier que les images sont dans 05b-visuels
- Vérifier les noms de fichiers

---

## 📊 MÉTRIQUES

### Performance moyenne (Session N9)
- **Agent veille** : 30-45 secondes
- **Agent rédacteur** : 60-90 secondes
- **Agent analyseur** : 5-10 secondes
- **Agent générateur** : 2-3 minutes (avec visuels)
- **Agent intégrateur** : 5-10 secondes

**Total pipeline** : ~6-7 minutes par article complet

### Coûts API
- **Perplexity** : ~$0.01/veille
- **Claude** : ~$0.03/article
- **DALL-E** : ~$0.08/image
- **QuickChart** : Gratuit
- **Total** : ~$0.16/article avec 2 images

---

## 🔄 ÉVOLUTION DES AGENTS

### Historique
- **v1-v5** : Versions initiales avec problèmes de parsing
- **v6** : Parser robuste multi-format (Session N1)
- **v2.0** : Agents visuels créés (Session N6)
- **v2.1** : Agent générateur simplifié (Session N7)

### Prévisions
- **v3.0** : Agents avec IA locale (Ollama)
- **v4.0** : Multi-langue
- **v5.0** : Apprentissage personnalisé

---

## 📚 DOCUMENTATION ASSOCIÉE

- `README-GENERATEURS.md` : Documentation des générateurs visuels
- `README-PIPELINE.md` : Documentation du pipeline orchestrateur
- `PROTOCOLE-COLLABORATION-V6.md` : Règles de développement

---

*Document créé le : 02 novembre 2025*  
*Basé sur : Sessions N1-N9*  
*Version agents : v2.0-v6.0*
