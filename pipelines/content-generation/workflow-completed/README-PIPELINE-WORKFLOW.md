# 🚀 PIPELINE WORKFLOW PRIZM AI - Guide d'utilisation

**Version 1.0 - Session N8 - 02 novembre 2025**

---

## 📋 VUE D'ENSEMBLE

Le **Pipeline Workflow** est l'orchestrateur central qui automatise la génération complète d'articles enrichis pour le blog Prizm AI.

### Workflow complet

```
1. 📰 VEILLE (Perplexity)
   ↓
   Identification de 5-7 sujets d'actualité IA
   Création automatique des corpus
   ↓
2. ✍️  RÉDACTION (Claude)
   ↓
   Génération d'articles factuels ~1600 mots
   Anti-répétition automatique des sujets
   ↓
3. 🎨 ENRICHISSEMENT VISUEL
   ↓
   Analyseur → Générateur → Intégrateur
   Hero images + Charts + Schémas
   ↓
4. 📊 RAPPORT DE SESSION
   ↓
   Statistiques complètes (JSON + TXT)
```

---

## ⚡ DÉMARRAGE RAPIDE

### Mode test (1 article)

```bash
node pipeline-workflow.cjs
```

**Durée** : ~2-3 minutes  
**Coût** : ~$0.08  
**Résultat** : 1 article complet avec visuels

### Mode production (3 articles)

```bash
node pipeline-workflow.cjs --mode=production
```

**Durée** : ~10-15 minutes  
**Coût** : ~$0.24-$0.40  
**Résultat** : 3 articles complets avec visuels

---

## 📦 PRÉREQUIS

### Fichiers nécessaires

- ✅ `pipeline-workflow.cjs` (orchestrateur principal)
- ✅ `config/paths.cjs` (configuration chemins)
- ✅ `config/.env` (clés API)
- ✅ Tous les agents dans `agents/`
- ✅ Tous les générateurs dans `generateurs/`

### Clés API requises

Dans `config/.env` :

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
```

### Dépendances Node.js

```bash
npm install
# ou si besoin
npm install @anthropic-ai/sdk axios dotenv
```

---

## 🎮 MODES D'UTILISATION

### 1. Mode TEST (défaut)

**Objectif** : Tester rapidement le workflow

```bash
node pipeline-workflow.cjs
# ou explicitement
node pipeline-workflow.cjs --mode=test
```

**Configuration** :
- 1 article maximum
- Veille complète
- Enrichissement visuel complet

**Cas d'usage** :
- Vérifier que tout fonctionne
- Tester après une modification
- Debug rapide

---

### 2. Mode PRODUCTION

**Objectif** : Génération quotidienne automatique

```bash
node pipeline-workflow.cjs --mode=production
```

**Configuration** :
- 3 articles par défaut
- Veille complète
- Enrichissement visuel complet
- Pause de 5s entre articles

**Cas d'usage** :
- Génération quotidienne via scheduler
- Production de contenu en batch
- Remplissage initial du blog

---

### 3. Mode CUSTOM

**Personnaliser le nombre d'articles** :

```bash
node pipeline-workflow.cjs --mode=production --max-articles=5
```

**Options de skip** (pour debug) :

```bash
# Skip la veille (utiliser veille existante)
node pipeline-workflow.cjs --skip-veille

# Skip la rédaction (utiliser articles existants)
node pipeline-workflow.cjs --skip-redaction

# Skip les visuels (articles sans enrichissement)
node pipeline-workflow.cjs --skip-visuels
```

**Mode verbose** (logs détaillés) :

```bash
node pipeline-workflow.cjs --verbose
# ou
node pipeline-workflow.cjs -v
```

---

## 🔄 ANTI-RÉPÉTITION AUTOMATIQUE

Le pipeline vérifie automatiquement l'**historique des articles** pour éviter de traiter deux fois le même sujet.

### Comment ça fonctionne

1. La veille propose 5-7 sujets
2. Le pipeline lit `output/03-articles-factuels/`
3. Il compare les slugs des titres
4. Il filtre les sujets déjà traités
5. Il ne garde que les sujets nouveaux

### Exemple

```
Lundi : 
  Veille propose : 
    - "IA générative pour PME" ← NOUVEAU
    - "Automatisation RH" ← NOUVEAU
  → Génère 2 articles

Mardi :
  Veille propose :
    - "IA générative pour PME" ← DÉJÀ TRAITÉ ✗
    - "Cybersécurité et IA" ← NOUVEAU
    - "Formation IA dirigeants" ← NOUVEAU
  → Génère 2 articles (skip le doublon)
```

**Pas d'intervention manuelle nécessaire** ✅

---

## 📊 RAPPORTS DE SESSION

Chaque exécution du pipeline génère **2 rapports** :

### 1. Rapport JSON (pour machines)

**Fichier** : `output/06-rapports/rapport-session-YYYY-MM-DD-HHMMSS.json`

```json
{
  "sessionId": "2025-11-02-083045",
  "timestamp": "2025-11-02T08:30:45.123Z",
  "duree": 187,
  "statistiques": {
    "veille": {
      "sujets_trouves": 7,
      "sujets_nouveaux": 5,
      "sujets_retenus": 3
    },
    "redaction": {
      "articles_generes": 3,
      "mots_total": 4850,
      "mots_moyen": 1617
    },
    "visuels": {
      "articles_enrichis": 3,
      "images_hero": 3,
      "charts": 6,
      "schemas": 3,
      "cout_total": 0.24
    }
  },
  "articles": [...],
  "erreurs": []
}
```

**Usage** : Monitoring automatique, métriques, alertes

---

### 2. Rapport TXT (pour humains)

**Fichier** : `output/06-rapports/rapport-session-YYYY-MM-DD-HHMMSS.txt`

```
══════════════════════════════════════════════════════════════════
  RAPPORT SESSION PRIZM AI - 2025-11-02-083045
══════════════════════════════════════════════════════════════════

📅 Date : 02/11/2025 08:30:45
⏱️  Durée : 3m 7s
⚙️  Mode : production

──────────────────────────────────────────────────────────────────
📊 STATISTIQUES GLOBALES
──────────────────────────────────────────────────────────────────

📰 VEILLE
   Sujets trouvés : 7
   Sujets nouveaux : 5
   Sujets retenus : 3

✍️  RÉDACTION
   Articles générés : 3
   Mots total : 4850
   Mots moyen : 1617

🎨 VISUELS
   Articles enrichis : 3
   Images hero : 3
   Graphiques : 6
   Schémas : 3
   Coût total : $0.24

──────────────────────────────────────────────────────────────────
📝 DÉTAIL DES ARTICLES
──────────────────────────────────────────────────────────────────

1. IA générative et productivité des PME françaises
   Slug : ia-generative-et-productivite-des-pme-francaises
   Mots : 1650
   Durée : 45s
   Visuels : 4/4 ($0.08)
   Fichier : 2025-11-02-ia-generative-et-productivite-des-pme-francaises-de-factuel.md

[...]
```

**Usage** : Revue humaine, debug, archivage

---

## 🤖 AUTOMATISATION QUOTIDIENNE

### Installation du scheduler Windows

**Étape 1** : Clic droit sur `install-scheduler.bat`  
**Étape 2** : "Exécuter en tant qu'administrateur"  
**Étape 3** : Suivre les instructions

### Vérification

Ouvrir le **Planificateur de tâches Windows** :
- Rechercher "Prizm AI - Generation Quotidienne"
- Vérifier : Quotidien à 8h00

### Test manuel

```bash
# Lancer la tâche manuellement (sans attendre 8h)
schtasks /run /tn "Prizm AI - Generation Quotidienne"
```

### Logs du scheduler

Les logs sont dans : `output/06-rapports/scheduler-YYYYMMDD-HHMMSS.log`

### Désinstallation

```bash
schtasks /delete /tn "Prizm AI - Generation Quotidienne" /f
```

---

## 📁 STRUCTURE DES FICHIERS

```
workflow-completed/
├── pipeline-workflow.cjs       ← Orchestrateur principal
├── scheduler.bat               ← Script scheduler
├── install-scheduler.bat       ← Installation scheduler
│
├── config/
│   ├── .env                    ← Clés API
│   └── paths.cjs               ← Configuration chemins
│
├── agents/
│   ├── agent-veille.cjs
│   ├── agent-redacteur-factuel.cjs
│   ├── agent-analyseur-visuel.cjs
│   ├── agent-generateur-visuel.cjs
│   └── agent-integrateur-visuel.cjs
│
├── generateurs/
│   ├── dalle.cjs
│   ├── charts.cjs
│   └── mermaid.cjs
│
└── output/
    ├── 01-veilles-brutes/
    ├── 02-corpus/
    ├── 03-articles-factuels/    ← Articles générés
    ├── 05b-visuels/
    └── 06-rapports/             ← Rapports de session
```

---

## ⚠️ GESTION D'ERREURS

### Erreurs non bloquantes

Si un **article** échoue, le pipeline :
- ✅ Log l'erreur dans le rapport
- ✅ Continue avec les autres articles
- ✅ Génère un rapport complet à la fin

**Exemple** :
```
Articles à générer : 3
Article 1 : ✅ OK
Article 2 : ❌ Erreur API Claude
Article 3 : ✅ OK

Résultat : 2 articles générés, 1 erreur loggée
```

### Erreurs bloquantes

Si la **veille** échoue :
- ❌ Le pipeline s'arrête
- ❌ Aucun article généré
- ✅ Rapport d'erreur créé

**Solution** : Vérifier les clés API, réseau, quotas

### Retry automatique

Le pipeline **retente automatiquement** 3 fois en cas d'erreur API :
- Tentative 1 : immédiate
- Tentative 2 : après 3s
- Tentative 3 : après 6s

---

## 💰 COÛTS

### Par article

| Composant | Coût |
|-----------|------|
| Veille (Perplexity) | Inclus forfait |
| Rédaction (Claude) | Inclus forfait |
| Hero image (DALL-E 3) | $0.08 |
| Charts (QuickChart) | Gratuit |
| Schémas (Mermaid) | Gratuit |
| **TOTAL** | **~$0.08/article** |

### Par session

| Mode | Articles | Coût |
|------|----------|------|
| Test | 1 | $0.08 |
| Production | 3 | $0.24 |
| Custom (5) | 5 | $0.40 |

### Par mois (quotidien)

- 3 articles/jour × 30 jours = 90 articles/mois
- Coût = 90 × $0.08 = **$7.20/mois**

---

## 🐛 DEBUG & TROUBLESHOOTING

### Le pipeline ne démarre pas

**Erreur** : `Cannot find module`

**Solution** :
```bash
npm install
```

---

### Erreur "Aucun sujet nouveau"

**Cause** : Tous les sujets proposés ont déjà été traités

**Solution** :
- Attendre le lendemain (nouveaux sujets)
- OU utiliser mode dirigé de l'agent veille
- OU supprimer des anciens articles pour "libérer" des sujets

---

### Erreur API Claude/Perplexity

**Erreur** : `401 Unauthorized` ou `API key invalid`

**Solution** :
1. Vérifier `config/.env`
2. Vérifier que les clés sont valides
3. Vérifier les quotas API

---

### Les visuels ne s'affichent pas

**Cause** : Chemins relatifs incorrects

**Solution** : Vérifier que `config/paths.cjs` pointe vers les bons dossiers

---

### Le scheduler ne se lance pas

**Erreur** : Tâche existe mais ne s'exécute pas

**Solution** :
1. Ouvrir Planificateur de tâches
2. Vérifier les permissions (SYSTEM)
3. Vérifier le chemin du script
4. Tester manuellement : `scheduler.bat`

---

## 📞 SUPPORT

### Logs à fournir en cas de problème

1. Sortie console complète
2. Rapport JSON dans `output/06-rapports/`
3. Logs scheduler si applicable

### Vérifications rapides

```bash
# Version Node.js
node --version
# Doit être >= 18.0.0

# Clés API présentes
type config\.env
# Doit afficher ANTHROPIC_API_KEY et PERPLEXITY_API_KEY

# Structure des dossiers
dir output
# Doit afficher 01-veilles-brutes, 02-corpus, etc.
```

---

## 🎯 BONNES PRATIQUES

### ✅ À FAIRE

- Lancer en mode test après chaque modification
- Vérifier les rapports régulièrement
- Surveiller les coûts DALL-E
- Backup régulier de `output/03-articles-factuels/`
- Rotation des logs (supprimer anciens rapports)

### ❌ À ÉVITER

- Ne pas modifier les agents pendant l'exécution
- Ne pas lancer plusieurs pipelines en parallèle
- Ne pas supprimer `output/03-articles-factuels/` (historique anti-répétition)
- Ne pas commit les clés API (vérifier `.gitignore`)

---

## 📜 CHANGELOG

### v1.0 - 02 novembre 2025 (Session N8)

**Création initiale** :
- ✅ Workflow complet automatisé
- ✅ Anti-répétition des sujets
- ✅ Gestion d'erreurs robuste
- ✅ Rapports détaillés JSON + TXT
- ✅ Scheduler Windows
- ✅ Configuration centralisée (paths.cjs)
- ✅ Modes test/production
- ✅ Documentation complète

---

## 🚀 PROCHAINES ÉVOLUTIONS (BACKLOG)

### Phase 3 - Validation (À venir)

- [ ] Système d'email validation avant publication
- [ ] Interface web de preview
- [ ] Publication automatique sur le site

### Optimisations

- [ ] Parallélisation des agents visuels
- [ ] Cache des résultats Perplexity
- [ ] Dashboard web de monitoring
- [ ] Métriques temps réel
- [ ] Alertes Slack/Discord

---

**📖 Documentation créée le 02 novembre 2025**  
**✍️  Session N8 - Phase 4 : Orchestrateur**  
**🎯 Status : Production ready**
