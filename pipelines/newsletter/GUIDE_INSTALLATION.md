# 📧 Guide de Mise en Place - PrizmAI Newsletter

## 🎯 Ce que j'ai amélioré

### 1. **Orchestrateur Principal** (`orchestrator.py`)
- ✅ Collecte depuis 11 sources RSS tech françaises et anglaises
- ✅ Extraction du contenu complet des articles (pas juste les résumés)
- ✅ Génération de contenu premium 2000-2500 mots avec GPT-4
- ✅ Intégration des liens sources directement dans le contenu
- ✅ Template HTML professionnel avec design moderne
- ✅ Sauvegarde automatique sur GitHub
- ✅ Envoi via Mailchimp avec mode test/production

### 2. **Améliorations du contenu**
- Structure éditoriale "no-bullshit" Prizm AI
- Deep Dives de 400 mots chacun avec analyses techniques
- Tech Radar avec score d'impact
- Métriques et insights visuels
- Action items concrets pour dirigeants

### 3. **Automatisation complète**
- Script de configuration GitHub
- Windows Task Scheduler pour envoi automatique
- Gestion des logs et erreurs

## 📋 Installation Étape par Étape

### Étape 1: Télécharger les fichiers
```bash
# Les fichiers sont dans le dossier newsletter-prizm/
# Copiez tout le dossier sur votre PC
```

### Étape 2: Installer les dépendances
```bash
cd newsletter-prizm
pip install -r requirements.txt
```

### Étape 3: Configurer les clés API
```bash
# Copier le template
copy .env.template .env

# Éditer .env avec Notepad++ ou VSCode
# Ajouter vos clés:
OPENAI_API_KEY=sk-...
MAILCHIMP_API_KEY=...-us21
MAILCHIMP_LIST_ID=...
GITHUB_TOKEN=ghp_... (optionnel)
TEST_EMAIL=votre.email@example.com
```

### Étape 4: Tester en local
```bash
# Mode test (sans envoi réel)
python orchestrator.py
```

## 🔗 Connexion avec GitHub

### Option A: Via le script automatique
```bash
python setup_github.py
# Suivez les instructions à l'écran
```

### Option B: Manuellement
```bash
# 1. Initialiser Git
git init

# 2. Ajouter les fichiers
git add .

# 3. Premier commit
git commit -m "Initial commit: PrizmAI Newsletter System"

# 4. Créer un repo sur GitHub (via le site)
# Ne PAS initialiser avec README

# 5. Ajouter le remote
git remote add origin https://github.com/VOTRE_USERNAME/prizm-newsletter.git

# 6. Pousser
git push -u origin main
```

## 🔄 Mise à jour du site web

Pour connecter la newsletter à votre site prizm-ai.netlify.app:

### 1. Dans votre repository du site
```bash
# Créer une nouvelle branche
git checkout -b feature/newsletter-integration

# Ajouter un lien vers les newsletters
# Dans votre index.html ou navigation, ajouter:
<a href="https://github.com/VOTRE_USERNAME/prizm-newsletter/tree/main/newsletters">
  📧 Newsletter
</a>
```

### 2. Créer une page dédiée (optionnel)
```html
<!-- newsletter.html -->
<!DOCTYPE html>
<html>
<head>
  <title>PrizmAI Newsletter</title>
</head>
<body>
  <h1>Newsletter PrizmAI</h1>
  <p>Recevez chaque semaine les dernières actualités IA</p>
  
  <!-- Formulaire Mailchimp -->
  <div id="mc_embed_signup">
    <!-- Votre formulaire Mailchimp ici -->
  </div>
  
  <!-- Archives -->
  <h2>Archives</h2>
  <ul>
    <li><a href="/newsletters/newsletter_2024-11-10.html">10 Nov 2024</a></li>
    <!-- etc -->
  </ul>
</body>
</html>
```

### 3. Automatiser la publication
```yaml
# .github/workflows/newsletter.yml
name: Publish Newsletter
on:
  push:
    paths:
      - 'newsletters/*.html'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        # Configuration Netlify
```

## ⏰ Automatisation Windows

```bash
# Configurer l'envoi automatique tous les mardis à 10h45
python setup_scheduler.py
```

## 🧪 Tests et Validation

### 1. Test de collecte RSS
```python
# test_rss.py
from orchestrator import NewsletterOrchestrator
orch = NewsletterOrchestrator()
articles = orch.collect_articles()
print(f"Articles collectés: {len(articles)}")
```

### 2. Test de génération
```python
# Mode fallback sans GPT-4
orch.generate_premium_content()
html = orch.generate_html_template()
# Ouvrir le HTML dans le navigateur
```

### 3. Test Mailchimp
```python
# Envoi de test
orch.send_via_mailchimp(test_mode=True)
```

## 🚀 Commandes utiles

```bash
# Génération manuelle
python orchestrator.py

# Mode production (envoi réel)
python orchestrator.py --production

# Voir les logs
type newsletter_prizm.log

# Vérifier la tâche planifiée
schtasks /query /tn PrizmAI_Newsletter

# Lancer manuellement la tâche
schtasks /run /tn PrizmAI_Newsletter

# Git - Voir le statut
git status

# Git - Pousser les changements
git add .
git commit -m "Update: amélioration du template"
git push
```

## 📊 Structure des dossiers

```
newsletter-prizm/
├── orchestrator.py          # 🎯 Script principal
├── setup_github.py          # 🔧 Config GitHub
├── setup_scheduler.py       # ⏰ Automatisation
├── requirements.txt         # 📦 Dépendances
├── .env                    # 🔑 Clés API (local only)
├── .env.template           # 📝 Template config
├── .gitignore              # 🚫 Fichiers ignorés
├── README.md               # 📚 Documentation
├── run_newsletter.bat      # 🏃 Script Windows
├── newsletter_prizm.log    # 📊 Logs
└── newsletters/            # 📧 Archives HTML
    ├── newsletter_2024-11-10.html
    └── ...
```

## ❓ Troubleshooting

### Erreur "Module not found"
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Erreur Mailchimp
- Vérifier la clé API et le datacenter (us21, eu1, etc.)
- Vérifier l'ID de la liste

### Erreur GitHub push
```bash
# Configurer l'authentification
git config --global user.name "Votre Nom"
git config --global user.email "email@example.com"

# Utiliser un token au lieu du mot de passe
# https://github.com/settings/tokens
```

### Newsletter vide
- Vérifier la clé OpenAI
- Tester avec le mode fallback d'abord
- Vérifier les sources RSS

## 🎉 C'est prêt !

Votre système de newsletter est maintenant:
- ✅ Amélioré avec contenu premium
- ✅ Prêt pour GitHub
- ✅ Automatisable sur Windows
- ✅ Connecté à Mailchimp

**Prochaines étapes:**
1. Configurer vos clés API dans `.env`
2. Tester localement
3. Pousser sur GitHub
4. Configurer l'automatisation
5. Lancer votre première newsletter !

---
💡 **Conseil:** Commencez par des tests avant de passer en production !
