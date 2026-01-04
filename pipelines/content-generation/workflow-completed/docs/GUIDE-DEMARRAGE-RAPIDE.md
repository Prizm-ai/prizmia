# 🚀 GUIDE DE DÉMARRAGE RAPIDE - WORKFLOW COMPLETED
## Comment reprendre le projet facilement

---

## ✅ CHECKLIST DE REPRISE (5 minutes)

### 1. Vérifier l'environnement

```powershell
# Naviguer vers le projet
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

# Vérifier Node.js
node --version
# Doit afficher v18 ou plus

# Vérifier les dossiers
dir agents
dir generateurs
dir output
```

### 2. Vérifier la configuration

```powershell
# Vérifier que .env existe
dir config\.env

# Si absent, créer depuis le template
copy config\.env.example config\.env
notepad config\.env
# Ajouter vos clés API
```

### 3. Test rapide du système

```powershell
# Tester l'agent veille
node agents/agent-veille.cjs --test

# Si OK, continuer
# Si erreur, voir section dépannage
```

---

## 🎯 GÉNÉRATION D'UN ARTICLE COMPLET (10 minutes)

### Méthode 1 : Pipeline automatique (RECOMMANDÉ)

```powershell
# Une seule commande pour tout faire
node pipeline-workflow.cjs

# Attendre ~6-7 minutes
# L'article enrichi sera dans output/05-articles-finaux/
```

### Méthode 2 : Étape par étape (pour débugger)

```powershell
# 1. Collecter des sujets (30 sec)
node agents/agent-veille.cjs

# 2. Générer l'article (90 sec)
node agents/agent-redacteur-factuel.cjs

# 3. Analyser besoins visuels (10 sec)
node agents/agent-analyseur-visuel.cjs

# 4. Générer les visuels (2-3 min)
node agents/agent-generateur-visuel.cjs

# 5. Intégrer dans l'article (10 sec)
node agents/agent-integrateur-visuel.cjs

# Article final dans output/05-articles-finaux/
```

---

## 📅 RÉACTIVER LA GÉNÉRATION AUTOMATIQUE QUOTIDIENNE

### Quand le site sera prêt :

```powershell
# 1. Installer le scheduler (génération à 8h chaque jour)
install-scheduler.bat

# 2. Vérifier l'installation
schtasks /query /tn "PrizmAI-Workflow"

# 3. C'est parti ! Un article par jour automatiquement
```

### Pour modifier l'heure :

```powershell
# Éditer scheduler.bat
notepad scheduler.bat
# Changer /st 08:00 par l'heure souhaitée
```

---

## 🔍 OÙ TROUVER LES RÉSULTATS

### Articles générés
```powershell
# Articles finaux avec visuels
dir output\05-articles-finaux\*.md /O-D

# Voir le dernier article
notepad output\05-articles-finaux\[dernier-article].md
```

### Images générées
```powershell
# Toutes les images
dir output\05b-visuels\*.png /O-D

# Ouvrir le dossier dans l'explorateur
explorer output\05b-visuels
```

### Logs et rapports
```powershell
# Rapports JSON détaillés
dir output\06-rapports\*.json /O-D

# Logs texte lisibles
dir output\06-rapports\*.txt /O-D
```

---

## 🛠️ DÉPANNAGE RAPIDE

### Erreur : "Cannot find module"

```powershell
# Installer les dépendances manquantes
npm install
```

### Erreur : "API key invalid"

```powershell
# Vérifier les clés
notepad config\.env

# Tester Perplexity
node agents/agent-veille.cjs --test

# Tester Claude
node agents/agent-redacteur-factuel.cjs --test
```

### Erreur : "No corpus found"

```powershell
# Lancer d'abord la veille
node agents/agent-veille.cjs

# Vérifier qu'un corpus existe
dir output\02-corpus\
```

### Erreur : "Command mmdc not found"

```powershell
# Installer Mermaid CLI
npm install -g @mermaid-js/mermaid-cli
```

---

## 📊 MONITORING RAPIDE

### Voir les statistiques

```powershell
# Compter les articles générés
dir output\05-articles-finaux\*.md /C

# Voir l'espace utilisé
dir output /S

# Dernière activité
dir output\*.* /S /O-D | more
```

### Vérifier les coûts

```powershell
# Voir le dernier rapport
type output\06-rapports\pipeline-report-*.txt | findstr "Coût"

# Estimation : ~$0.16 par article
```

---

## 🔄 COMMANDES UTILES À RETENIR

### Les essentielles

```powershell
# Générer un article complet
node pipeline-workflow.cjs

# Générer 3 articles
node pipeline-workflow.cjs --batch 3

# Mode test (sans sauvegarder)
node pipeline-workflow.cjs --test

# Activer génération quotidienne
install-scheduler.bat
```

### Pour aller plus loin

```powershell
# Veille sur sujet spécifique
node agents/agent-veille.cjs --dirige --titre "IA générative PME 2025"

# Mode économique (moins d'images)
node agents/agent-generateur-visuel.cjs --eco

# Nettoyer les anciens fichiers
move output\07-archives\*.* archives\backup-%DATE%\
```

---

## 📈 ÉTAT ACTUEL DU SYSTÈME (Post Session N9)

### ✅ CE QUI FONCTIONNE
- **Pipeline complet** : 100% opérationnel
- **Génération d'articles** : 1500-2200 mots
- **Visuels automatiques** : DALL-E + Charts + Mermaid
- **Anti-répétition** : Système de tracking
- **Scheduler** : Configuré mais désactivé

### ⏳ EN ATTENTE
- **Publication automatique** : Quand site prêt
- **Validation par email** : Phase 3 non testée
- **Dashboard monitoring** : Phase 6 à développer

### 🐛 BUGS CONNUS (non bloquants)
- Coût affiché $0.00 (réel : ~$0.16)
- Caractères UTF-8 dans PowerShell

---

## 💡 TIPS POUR LA PRODUCTIVITÉ

### 1. Commencer petit
```powershell
# D'abord tester avec 1 article
node pipeline-workflow.cjs

# Si OK, passer en mode batch
node pipeline-workflow.cjs --batch 5
```

### 2. Surveiller les quotas
- OpenAI : https://platform.openai.com/usage
- Claude : Console Anthropic
- Perplexity : Settings

### 3. Backup régulier
```powershell
# Sauvegarder les articles
xcopy output\05-articles-finaux\*.md D:\Backup\Prizm\%DATE%\ /Y
```

### 4. Optimiser les coûts
```powershell
# Mode éco = moins d'images DALL-E
node pipeline-workflow.cjs --eco

# Utiliser plus de graphiques (gratuits)
# Modifier dans agent-analyseur-visuel.cjs
```

---

## 🎯 EN RÉSUMÉ

### Pour générer un article maintenant :
```powershell
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed
node pipeline-workflow.cjs
```

### Pour automatiser (quand site prêt) :
```powershell
install-scheduler.bat
```

### En cas de problème :
1. Vérifier les clés API dans `config/.env`
2. Relancer avec `--test`
3. Consulter les logs dans `output/06-rapports/`

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consulter :
- `README-WORKFLOW-COMPLETED-ACTUEL.md` : Vue d'ensemble
- `README-AGENTS.md` : Documentation des agents
- `README-GENERATEURS.md` : Documentation des visuels
- `PROTOCOLE-COLLABORATION-V6.md` : Règles de développement

---

**Le système est prêt ! Bonne génération d'articles ! 🚀**

---

*Guide créé le : 02 novembre 2025*  
*Version système : Production-ready (Post Session N9)*  
*Temps pour reprendre : ~5 minutes*
