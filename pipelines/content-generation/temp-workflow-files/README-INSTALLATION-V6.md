# PRIZM AI - PIPELINE V6 ENRICHI

**Système de génération automatique d'articles avec enrichissement visuel**

Version 6.0.0 - Octobre 2025

---

## 🎯 NOUVEAUTÉS V6

✅ **Génération automatique de visuels**
- Image hero (DALL-E 3)
- Images de section (2-3 par article)
- Graphiques (Chart.js)
- Schémas (Mermaid)

✅ **Validation par email**
- Email avec aperçu de l'article
- Boutons d'action (Valider/Rejeter/Modifier)
- Serveur de validation intégré

✅ **Publication automatique**
- Copie vers le blog Astro
- Git commit + push automatique
- Déploiement Netlify

✅ **Scheduler intégré**
- Génération quotidienne à 8h
- Configurable (jours, nombre d'articles)

✅ **Monitoring temps réel**
- Interface visuelle type Make/Activepieces
- Barre de progression
- Estimation temps restant

---

## 📁 STRUCTURE

Ce nouveau système V6 est **complètement séparé** de l'ancien système (V4/V5) pour éviter tout risque de conflit.

```
content-generation/
├── [Ancien système V4/V5] ← NE PAS TOUCHER
│   ├── pipeline-v4-fixed.cjs
│   ├── pipeline-v5-batch.cjs
│   └── output/
│
└── v6-enrichi/             ← NOUVEAU SYSTÈME
    ├── config/
    │   ├── .env-v6         ← Configuration V6
    │   └── config-v6.cjs
    ├── agents/
    ├── generateurs/
    ├── utils/
    ├── templates/
    ├── server/
    ├── pipeline-v6-enrichi.cjs
    └── output-v6/
```

---

## 🚀 INSTALLATION

### Étape 1 : Créer la structure

```bash
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation

# Créer le dossier V6
mkdir v6-enrichi
cd v6-enrichi

# Créer les sous-dossiers
mkdir config agents generateurs utils templates server output-v6
cd output-v6
mkdir 01-veille 02-corpus 03-articles-factuels 05-articles-finaux 05b-visuels 06-rapports 07-archives
cd ..
```

### Étape 2 : Copier les fichiers

**Fichiers que je vous ai fournis :**
1. `config-v6.cjs` → `/v6-enrichi/config/`
2. `image-manager.cjs` → `/v6-enrichi/utils/`
3. `moniteur.cjs` → `/v6-enrichi/utils/`

**Commandes :**
```bash
# Depuis le dossier où vous avez téléchargé mes fichiers
copy config-v6.cjs C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\v6-enrichi\config\
copy image-manager.cjs C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\v6-enrichi\utils\
copy moniteur.cjs C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\v6-enrichi\utils\
```

### Étape 3 : Installer les dépendances

```bash
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\v6-enrichi

# Initialiser package.json
npm init -y

# Installer les dépendances
npm install dotenv
npm install sharp              # Optimisation images
npm install chart.js canvas    # Génération graphiques
npm install @mermaid-js/mermaid-cli  # Génération schémas
npm install nodemailer         # Envoi emails
npm install express            # Serveur validation
```

### Étape 4 : Configurer l'environnement

Créer le fichier `config/.env-v6` :

```bash
# APIs (réutiliser vos clés existantes)
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

**Pour obtenir EMAIL_APP_PASSWORD :**
1. Gmail → Paramètres → Sécurité
2. Activer validation 2 étapes
3. "Mots de passe des applications" → Générer
4. Copier le mot de passe (16 caractères)

---

## 📦 PROCHAINES ÉTAPES

Une fois l'installation terminée, je vais vous fournir :

### **PHASE 2 : Modules Visuels** (à venir)
- `agent-analyseur-visuel.cjs`
- `agent-generateur-visuel.cjs`
- Générateurs (DALL-E, Charts, Mermaid)
- `agent-integrateur-visuel.cjs`

### **PHASE 3 : Validation & Publication** (à venir)
- `agent-email-validation.cjs`
- `validation-server.cjs`
- `publisher.cjs`
- Templates email

### **PHASE 4 : Orchestrateur** (à venir)
- `pipeline-v6-enrichi.cjs`
- `scheduler.bat`

---

## ✅ VÉRIFICATION DE L'INSTALLATION

Une fois les étapes 1-4 terminées, vérifiez :

```bash
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\v6-enrichi

# Vérifier la structure
dir
# Vous devriez voir : config, agents, generateurs, utils, output-v6...

# Vérifier les dépendances
npm list --depth=0
# Vous devriez voir : sharp, chart.js, nodemailer, express...

# Tester la configuration
node config/config-v6.cjs
# Devrait afficher "Configuration valide" ou des erreurs à corriger
```

---

## 🔄 COHABITATION AVEC L'ANCIEN SYSTÈME

### ✅ Vous pouvez :
- Utiliser V4/V5 normalement (rien ne change)
- Tester V6 en parallèle
- Comparer les résultats
- Basculer progressivement

### ✅ Sécurité :
- V6 utilise `output-v6/` (pas de conflit avec `output/`)
- V6 utilise `.env-v6` (pas de conflit avec `.env`)
- Agents V6 dans `/v6-enrichi/` (isolation complète)

### ✅ Migration future :
Quand V6 est validé et stable :
1. Arrêter d'utiliser V4/V5
2. Archiver l'ancien système
3. V6 devient le système principal

---

## 📞 SUPPORT

Si problème durant l'installation, vérifiez :
1. Node.js version ≥ 18 : `node --version`
2. Toutes les dépendances installées : `npm list`
3. Fichier `.env-v6` bien configuré
4. Chemins corrects dans `config-v6.cjs`

---

## 🎯 PRÊT POUR LA PHASE 2

Une fois l'installation terminée, **dites-moi "Installation terminée"** et je vous fournirai les modules de la PHASE 2 (agents visuels).

**Durée estimée PHASE 2 : 30 minutes de code**

🚀 Let's go!
