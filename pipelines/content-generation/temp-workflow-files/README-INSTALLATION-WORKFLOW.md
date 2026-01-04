# PRIZM AI - WORKFLOW COMPLETED

**Système de génération automatique d'articles avec enrichissement visuel**
**100% autonome et indépendant**

Version 1.0.0 - Octobre 2025

---

## 🎯 CONCEPT

**Workflow Completed** est un système **totalement séparé** de l'ancien pipeline.
- ✅ Aucune dépendance vers l'ancien système
- ✅ Tous les agents copiés et adaptés localement
- ✅ Configuration et sorties indépendantes
- ✅ Peut coexister sans conflit

---

## 📁 NOUVELLE STRUCTURE COMPLÈTE

```
C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\
│
├── [ANCIEN SYSTÈME] ← Reste intact, fonctionne normalement
│   ├── pipeline-v4-fixed.cjs
│   ├── pipeline-v5-batch.cjs
│   ├── agent-veille-v5.cjs
│   ├── agent-redacteur-factuel.cjs
│   ├── config/.env
│   └── output/
│
└── workflow-completed/         🆕 NOUVEAU SYSTÈME AUTONOME
    │
    ├── config/
    │   ├── .env               ← Config indépendante
    │   └── config-workflow.cjs
    │
    ├── agents/                ← TOUS les agents (copiés + nouveaux)
    │   ├── agent-veille.cjs              [COPIÉ + ADAPTÉ]
    │   ├── agent-redacteur-factuel.cjs   [COPIÉ + ADAPTÉ]
    │   ├── agent-analyseur-visuel.cjs    [NOUVEAU]
    │   ├── agent-generateur-visuel.cjs   [NOUVEAU]
    │   ├── agent-integrateur-visuel.cjs  [NOUVEAU]
    │   └── agent-email-validation.cjs    [NOUVEAU]
    │
    ├── generateurs/           ← Générateurs visuels spécialisés
    │   ├── dalle.cjs         [Image hero + sections]
    │   ├── charts.cjs        [Graphiques]
    │   └── mermaid.cjs       [Schémas]
    │
    ├── utils/                 ← Utilitaires
    │   ├── image-manager.cjs
    │   ├── moniteur.cjs
    │   ├── publisher.cjs
    │   ├── date-helper.cjs   [COPIÉ]
    │   └── sujet-scorer.cjs  [COPIÉ]
    │
    ├── templates/             ← Templates email
    │   ├── email-validation.html
    │   └── email-confirmation.html
    │
    ├── server/                ← Serveur validation
    │   └── validation-server.cjs
    │
    ├── pipeline-workflow.cjs  ← Pipeline principal
    ├── scheduler.bat          ← Scheduler Windows (8h quotidien)
    ├── package.json
    │
    └── output/                ← Sorties indépendantes
        ├── 01-veille/
        ├── 02-corpus/
        ├── 03-articles-factuels/
        ├── 05-articles-finaux/
        ├── 05b-visuels/
        ├── 06-rapports/
        └── 07-archives/
```

---

## 🚀 INSTALLATION ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Créer la structure de base

```batch
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation

:: Créer le dossier principal
mkdir workflow-completed
cd workflow-completed

:: Créer tous les sous-dossiers
mkdir config
mkdir agents
mkdir generateurs
mkdir utils
mkdir templates
mkdir server
mkdir output

:: Créer la structure output
cd output
mkdir 01-veille 02-corpus 03-articles-factuels 05-articles-finaux 05b-visuels 06-rapports 07-archives
cd ..
```

### ÉTAPE 2 : Copier les fichiers que je vous fournis

**Depuis le dossier de téléchargement vers workflow-completed :**

```batch
:: Fichier de configuration
copy config-workflow.cjs C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed\config\

:: Utilitaires
copy image-manager.cjs C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed\utils\
copy moniteur.cjs C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed\utils\

:: Package.json
copy package.json C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed\
```

### ÉTAPE 3 : Copier les agents existants depuis l'ancien système

**Ces agents existent déjà et fonctionnent, on les copie dans le nouveau système :**

```batch
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation

:: Copier agent de veille
copy agent-veille-v5.cjs workflow-completed\agents\agent-veille.cjs

:: Copier agent rédacteur
copy agent-redacteur-factuel.cjs workflow-completed\agents\

:: Copier utils nécessaires
copy utils\date-helper.cjs workflow-completed\utils\
copy utils\sujet-scorer.cjs workflow-completed\utils\
```

### ÉTAPE 4 : Adapter les chemins dans les agents copiés

**Dans `workflow-completed/agents/agent-veille.cjs` :**
```javascript
// REMPLACER :
require('dotenv').config({ path: './config/.env' });
const { DateHelper } = require('./utils/date-helper.cjs');

// PAR :
require('dotenv').config({ path: '../config/.env' });
const { DateHelper } = require('../utils/date-helper.cjs');
```

**Dans `workflow-completed/agents/agent-redacteur-factuel.cjs` :**
```javascript
// REMPLACER :
const prizm = require('./config/prizm-config.cjs');

// PAR :
const prizm = require('../config/config-workflow.cjs');
```

### ÉTAPE 5 : Installer les dépendances

```batch
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

:: Installer toutes les dépendances
npm install
```

**Cela installera :**
- dotenv (variables d'environnement)
- sharp (optimisation images)
- chart.js + canvas (graphiques)
- @mermaid-js/mermaid-cli (schémas)
- nodemailer (emails)
- express (serveur validation)
- @anthropic-ai/sdk (Claude)
- axios (requêtes HTTP)

### ÉTAPE 6 : Configurer l'environnement

**Créer le fichier `config/.env` :**

```bash
# APIs (copier vos clés existantes)
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
OPENAI_API_KEY=sk-...

# Email de notification (NOUVEAU)
EMAIL_FROM=votre-email@gmail.com
EMAIL_TO=samuel@prizm-ai.fr
EMAIL_APP_PASSWORD=xxxxxxxxxxxx

# Serveur de validation (NOUVEAU)
VALIDATION_SERVER_PORT=3001
VALIDATION_BASE_URL=http://localhost:3001

# Publication automatique (NOUVEAU)
GIT_AUTO_PUSH=true
```

**🔐 Pour obtenir EMAIL_APP_PASSWORD (Gmail) :**
1. Aller sur https://myaccount.google.com/security
2. Activer "Validation en 2 étapes"
3. Chercher "Mots de passe des applications"
4. Générer un nouveau mot de passe pour "Autres (nom personnalisé)" → "Prizm AI"
5. Copier le mot de passe de 16 caractères généré

---

## ✅ VÉRIFICATION DE L'INSTALLATION

```batch
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

:: 1. Vérifier la structure
dir
:: Vous devez voir : config, agents, generateurs, utils, output, package.json

:: 2. Vérifier les dépendances
npm list --depth=0
:: Vous devez voir toutes les libs sans erreur

:: 3. Vérifier les agents copiés
dir agents
:: Vous devez voir : agent-veille.cjs, agent-redacteur-factuel.cjs

:: 4. Tester la configuration
node config/config-workflow.cjs
:: Doit afficher les paramètres ou erreurs de config
```

---

## 📊 COMPARAISON ANCIEN vs WORKFLOW COMPLETED

| Aspect | Ancien Système | Workflow Completed |
|--------|---------------|-------------------|
| **Localisation** | `/content-generation/` | `/workflow-completed/` |
| **Configuration** | `.env` | `.env` (indépendant) |
| **Agents** | Dossier racine | `/agents/` (local) |
| **Sorties** | `/output/` | `/output/` (indépendant) |
| **Visuels** | ❌ Non | ✅ Automatique |
| **Validation** | ❌ Manuelle | ✅ Par email |
| **Publication** | ❌ Manuelle | ✅ Automatique |
| **Scheduler** | ❌ Non | ✅ 8h quotidien |

---

## 🔄 COHABITATION

### ✅ Les deux systèmes peuvent coexister :
- **Ancien** : Continue de fonctionner normalement
- **Workflow** : Nouveau système indépendant
- **Aucun conflit** : Configurations et sorties séparées

### ✅ Migration progressive :
1. Installer Workflow Completed
2. Le tester en parallèle
3. Comparer les résultats
4. Quand validé → utiliser uniquement Workflow
5. Archiver l'ancien système

---

## 📦 FICHIERS À RECEVOIR

**PHASE 1 (TERMINÉE) :**
- ✅ config-workflow.cjs
- ✅ image-manager.cjs
- ✅ moniteur.cjs
- ✅ package.json
- ✅ README-INSTALLATION-WORKFLOW.md

**PHASE 2 (à venir) - Agents Visuels :**
- agent-analyseur-visuel.cjs
- agent-generateur-visuel.cjs
- agent-integrateur-visuel.cjs
- dalle.cjs
- charts.cjs
- mermaid.cjs

**PHASE 3 (à venir) - Validation & Publication :**
- agent-email-validation.cjs
- validation-server.cjs
- publisher.cjs
- email-validation.html
- email-confirmation.html

**PHASE 4 (à venir) - Orchestrateur :**
- pipeline-workflow.cjs
- scheduler.bat

---

## 🎯 PRÊT POUR LA SUITE

**Une fois les étapes 1-6 terminées, dites-moi :**
✅ "Installation phase 1 terminée"

**Et je vous fournirai :**
→ Tous les agents visuels (PHASE 2)
→ Durée estimée : 30 min de code

---

## 💡 AVANTAGES DU SYSTÈME SÉPARÉ

1. **Zéro risque** : L'ancien système reste intact
2. **Test facile** : Compare les deux systèmes
3. **Rollback simple** : Retour à l'ancien si besoin
4. **Migration douce** : Bascule quand vous voulez
5. **Autonomie totale** : Aucune dépendance croisée

🚀 **Prêt à installer !**
