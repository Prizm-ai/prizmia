# 🚀 DÉMARRAGE SESSION N8 - PHASE 4 : ORCHESTRATEUR

**Date prévue** : À définir  
**Durée estimée** : 1h - 1h30  
**Objectif** : Créer le pipeline automatisé complet + scheduler  
**Prérequis** : Phase 2 (Agents visuels) 100% complétée ✅

---

## 🎯 OBJECTIF PRINCIPAL

**Créer un système complètement automatisé** qui :
1. Lance tout le workflow en une seule commande
2. Peut être schedulé quotidiennement (8h du matin)
3. Génère des rapports de session
4. Gère les erreurs proprement

---

## 📋 LIVRABLES SESSION N8

### 1. **pipeline-workflow.cjs** (Principal)

**Rôle** : Orchestrateur qui enchaîne tous les agents

**Séquence d'exécution** :
```
1. Agent Veille (Perplexity)
   ↓
2. Agent Rédacteur Factuel (Claude)
   ↓
3. Agent Analyseur Visuel (Claude)
   ↓
4. Agent Générateur Visuel (DALL-E + Charts + Mermaid)
   ↓
5. Agent Intégrateur Visuel
   ↓
6. Rapport de session
```

**Fonctionnalités requises** :
- ✅ Gestion d'erreurs à chaque étape
- ✅ Logs détaillés (console + fichier)
- ✅ Statistiques de coût (DALL-E)
- ✅ Rapport final JSON + TXT
- ✅ Mode test (1 article) vs production (5-7 articles)
- ✅ Possibilité de reprendre après erreur

**Paramètres configurables** :
```javascript
const CONFIG = {
  MODE: 'test',              // 'test' (1 article) ou 'production' (5-7)
  SKIP_VEILLE: false,        // true pour utiliser veille existante
  SKIP_REDACTION: false,     // true pour utiliser articles existants
  SKIP_VISUELS: false,       // true pour tester sans visuels
  MAX_ARTICLES: 7,           // Nombre max d'articles à générer
  PAUSE_BETWEEN_ARTICLES: 5000  // Pause entre articles (ms)
};
```

**Structure du rapport** :
```json
{
  "timestamp": "2025-11-03T08:00:00.000Z",
  "duree": "12m 34s",
  "articles_generes": 5,
  "articles_enrichis": 5,
  "visuels_total": 18,
  "cout_total": 0.40,
  "erreurs": [],
  "statistiques": {
    "veille": { "sujets_trouves": 7, "sujets_retenus": 5 },
    "redaction": { "articles": 5, "mots_moyen": 1850 },
    "visuels": { "images": 5, "charts": 8, "schemas": 5 }
  }
}
```

---

### 2. **scheduler.bat** (Tâche planifiée)

**Rôle** : Lance le pipeline automatiquement chaque jour à 8h

**Contenu du fichier** :
```batch
@echo off
:: Scheduler Prizm AI - Génération quotidienne
:: Lance à 8h00 tous les jours

cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

:: Créer un log de la session
set LOGFILE=output\06-rapports\scheduler-%date:~-4,4%%date:~-7,2%%date:~-10,2%.log

echo [%date% %time%] Démarrage génération quotidienne >> %LOGFILE%

:: Lancer le pipeline en mode production
node pipeline-workflow.cjs --mode=production >> %LOGFILE% 2>&1

echo [%date% %time%] Génération terminée >> %LOGFILE%
```

**Installation tâche planifiée** :
```batch
:: Script d'installation à créer : install-scheduler.bat
schtasks /create /tn "Prizm AI - Génération Quotidienne" /tr "C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed\scheduler.bat" /sc daily /st 08:00 /ru SYSTEM
```

---

## 🔧 ARCHITECTURE TECHNIQUE

### Structure du pipeline-workflow.cjs

```javascript
// 1. Imports et configuration
const AgentVeille = require('./agents/agent-veille.cjs');
const AgentRedacteur = require('./agents/agent-redacteur-factuel.cjs');
const AgentAnalyseur = require('./agents/agent-analyseur-visuel.cjs');
const GenerateurVisuel = require('./agents/agent-generateur-visuel.cjs');
const AgentIntegrateur = require('./agents/agent-integrateur-visuel.cjs');
const Moniteur = require('./utils/moniteur.cjs');

// 2. Classe principale
class PipelineWorkflow {
  constructor(config) {
    this.config = config;
    this.moniteur = new Moniteur();
    this.rapportSession = {
      timestamp: new Date(),
      articles: [],
      erreurs: [],
      statistiques: {}
    };
  }

  // 3. Méthode principale
  async executer() {
    try {
      // Étape 1 : Veille
      const sujets = await this.etapeVeille();
      
      // Étape 2 : Rédaction
      const articles = await this.etapeRedaction(sujets);
      
      // Étape 3 : Enrichissement visuel
      const articlesEnrichis = await this.etapeVisuels(articles);
      
      // Étape 4 : Rapport
      await this.genererRapport();
      
      return this.rapportSession;
    } catch (error) {
      this.gererErreur(error);
    }
  }

  // 4. Méthodes par étape
  async etapeVeille() { /* ... */ }
  async etapeRedaction(sujets) { /* ... */ }
  async etapeVisuels(articles) { /* ... */ }
  
  // 5. Gestion d'erreurs
  gererErreur(error) { /* ... */ }
  
  // 6. Rapports
  async genererRapport() { /* ... */ }
}

// 7. CLI
if (require.main === module) {
  const config = parseArgs(process.argv);
  const pipeline = new PipelineWorkflow(config);
  pipeline.executer();
}
```

---

## 📊 GESTION D'ERREURS

### Stratégies par type d'erreur

**1. Erreur API (Perplexity, Claude, DALL-E)**
```javascript
// Retry automatique 3 fois
async callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.pause(3000 * (i + 1)); // 3s, 6s, 9s
    }
  }
}
```

**2. Erreur génération article**
```javascript
// Logger et continuer avec les autres
try {
  const article = await redacteur.generer(sujet);
} catch (error) {
  this.rapportSession.erreurs.push({
    etape: 'redaction',
    sujet: sujet.titre,
    erreur: error.message
  });
  // Continuer avec sujet suivant
  continue;
}
```

**3. Erreur fichier/système**
```javascript
// Vérifier existence avant utilisation
if (!fs.existsSync(articlePath)) {
  throw new Error(`Article introuvable: ${articlePath}`);
}
```

---

## 🎯 MODES D'EXÉCUTION

### Mode Test (1 article)
```bash
node pipeline-workflow.cjs --mode=test
```
**Objectif** : Valider le pipeline rapidement  
**Durée** : ~2 min  
**Coût** : $0.08

### Mode Production (5-7 articles)
```bash
node pipeline-workflow.cjs --mode=production
```
**Objectif** : Génération quotidienne complète  
**Durée** : ~10-15 min  
**Coût** : $0.40-$0.56

### Mode Debug
```bash
node pipeline-workflow.cjs --mode=test --verbose --skip-visuels
```
**Options utiles** :
- `--verbose` : Logs détaillés
- `--skip-veille` : Utiliser veille existante
- `--skip-redaction` : Utiliser articles existants
- `--skip-visuels` : Tester sans visuels
- `--max-articles=3` : Limiter le nombre

---

## 📋 CHECKLIST DE DÉVELOPPEMENT

### Phase 1 : Structure de base (15 min)

- [ ] Créer `pipeline-workflow.cjs`
- [ ] Importer tous les agents
- [ ] Créer classe `PipelineWorkflow`
- [ ] Implémenter constructeur avec config
- [ ] Créer structure rapport session

### Phase 2 : Méthode principale (10 min)

- [ ] Méthode `executer()`
- [ ] Try/catch global
- [ ] Appel séquentiel des étapes
- [ ] Génération rapport final

### Phase 3 : Étape Veille (10 min)

- [ ] Méthode `etapeVeille()`
- [ ] Instanciation AgentVeille
- [ ] Gestion erreurs
- [ ] Logging progression

### Phase 4 : Étape Rédaction (10 min)

- [ ] Méthode `etapeRedaction(sujets)`
- [ ] Boucle sur chaque sujet
- [ ] Pause entre articles
- [ ] Comptage mots/coûts

### Phase 5 : Étape Visuels (15 min)

- [ ] Méthode `etapeVisuels(articles)`
- [ ] Pour chaque article :
  - [ ] Agent analyseur
  - [ ] Agent générateur
  - [ ] Agent intégrateur
- [ ] Gestion erreurs par article
- [ ] Comptage coûts DALL-E

### Phase 6 : Rapports (10 min)

- [ ] Méthode `genererRapport()`
- [ ] Format JSON
- [ ] Format TXT lisible
- [ ] Sauvegarde dans `output/06-rapports/`

### Phase 7 : CLI et arguments (10 min)

- [ ] Parser arguments ligne de commande
- [ ] Mode test/production
- [ ] Options skip
- [ ] Aide (`--help`)

### Phase 8 : Scheduler (10 min)

- [ ] Créer `scheduler.bat`
- [ ] Créer `install-scheduler.bat`
- [ ] Tester lancement manuel
- [ ] Documenter installation

---

## 🧪 PLAN DE TEST

### Test 1 : Mode Test (article unique)

**Objectif** : Valider pipeline bout-en-bout rapidement

```bash
node pipeline-workflow.cjs --mode=test
```

**Vérifications** :
- [ ] Agent veille s'exécute
- [ ] 1 sujet retenu
- [ ] 1 article généré
- [ ] Visuels créés et intégrés
- [ ] Rapport généré
- [ ] Pas d'erreurs

**Durée attendue** : ~2 min

---

### Test 2 : Mode Production (plusieurs articles)

**Objectif** : Valider génération multiple

```bash
node pipeline-workflow.cjs --mode=production --max-articles=3
```

**Vérifications** :
- [ ] 3 articles générés
- [ ] Tous enrichis de visuels
- [ ] Pause entre articles respectée
- [ ] Coûts calculés correctement
- [ ] Rapport détaillé

**Durée attendue** : ~6-8 min

---

### Test 3 : Gestion d'erreurs

**Objectif** : Vérifier robustesse

**Scénarios à tester** :
1. Clé API invalide
2. Article sans sections (edge case)
3. Erreur DALL-E (quota dépassé)
4. Fichier manquant

**Vérifications** :
- [ ] Erreur loggée dans rapport
- [ ] Pipeline continue avec articles suivants
- [ ] Message d'erreur clair
- [ ] Pas de crash

---

### Test 4 : Scheduler

**Objectif** : Valider tâche planifiée

```batch
:: Test manuel
scheduler.bat
```

**Vérifications** :
- [ ] Pipeline se lance
- [ ] Logs créés dans output/06-rapports/
- [ ] Exécution complète
- [ ] Pas d'interaction requise

**Puis** : Planifier pour demain 8h et vérifier

---

## 📝 TEMPLATE RAPPORT DE SESSION

```markdown
# RAPPORT SESSION - [DATE]

## Résumé
- Durée : 12m 34s
- Articles générés : 5
- Visuels créés : 18
- Coût total : $0.40
- Erreurs : 0

## Détail par article

### 1. [Titre Article 1]
- Mots : 1850
- Visuels : 4 (1 hero, 2 charts, 1 schema)
- Coût : $0.08
- Status : ✅ Publié

[...]

## Statistiques

### Veille
- Sujets trouvés : 7
- Sujets retenus : 5
- Critères : Pertinence IA + PME/ETI

### Rédaction
- Articles : 5
- Mots moyen : 1850
- Temps moyen : 90s
- Coût Claude : Inclus forfait

### Visuels
- Images DALL-E : 5 ($0.40)
- Graphiques : 8 (gratuit)
- Schémas : 5 (gratuit)

## Prochaine exécution
- Prévue : [DATE+1] 08:00
- Mode : production
```

---

## 🎯 OBJECTIFS DE QUALITÉ

### Performance
- ⏱️ Mode test : < 3 min
- ⏱️ Mode production (5 articles) : < 15 min
- 💰 Coût par article : ~$0.08

### Robustesse
- ✅ Gestion d'erreurs exhaustive
- ✅ Retry automatique (3x)
- ✅ Continuation après erreur
- ✅ Logs détaillés

### Utilisabilité
- ✅ Une seule commande pour tout
- ✅ Modes test/production clairs
- ✅ Options skip pour debug
- ✅ Rapports lisibles

---

## 🔄 INTÉGRATION AVEC PHASES PRÉCÉDENTES

### Phase 1 : Structure ✅
- Config indépendante
- Dossiers output/

### Phase 2 : Agents Visuels ✅
- Tous les agents fonctionnent
- Tests bout-en-bout validés

### Phase 4 : Orchestrateur (Session N8)
- **Utilise** tous les agents existants
- **Ajoute** orchestration et monitoring
- **Crée** scheduler automatique

### Phase 3 : Validation (après Phase 4)
- Email validation
- Publication auto
- À intégrer dans le pipeline

---

## 📚 RESSOURCES DISPONIBLES

### Documents à consulter

**Obligatoires** :
1. `PASSATION-SESSION-N7.md` - Ce qui a été fait
2. `PROTOCOLE-COLLABORATION-V6.md` - Bonnes pratiques
3. `CONSEILS-COLLABORATION.md` - Ce qui marche

**Référence** :
- Structure projet : `structure.txt`
- Config : `config/config-workflow.cjs`
- Agents existants : `agents/`

### Fichiers de la Session N7

**Dans** `/mnt/user-data/outputs/` :
- `mermaid.cjs` v2.2
- `agent-generateur-visuel.cjs` v2.1

---

## ⚠️ POINTS D'ATTENTION

### 1. Chemins Windows
```javascript
// Utiliser path.join() partout
const articlePath = path.join(__dirname, 'output', '03-articles-factuels', filename);

// Pas de chemins en dur
❌ '../output/03-articles-factuels/article.md'
✅ path.join(__dirname, '../output/03-articles-factuels/article.md')
```

### 2. Gestion asynchrone
```javascript
// Toujours await dans les boucles
for (const article of articles) {
  await this.traiterArticle(article); // Séquentiel
  await this.pause(5000); // Pause entre articles
}
```

### 3. Logs clairs
```javascript
// Logs structurés avec émojis
console.log('📰 [1/5] Génération article...');
console.log('   ✅ Article généré (1850 mots)');
console.log('   💰 Coût: $0.08');
```

### 4. Rapports JSON
```javascript
// Toujours JSON.stringify avec indentation
fs.writeFileSync(
  reportPath, 
  JSON.stringify(rapport, null, 2), // 2 espaces d'indentation
  'utf8'
);
```

---

## ✅ CRITÈRES DE SUCCÈS SESSION N8

### Fonctionnel
- [ ] Pipeline complet fonctionne en une commande
- [ ] Mode test (1 article) validé
- [ ] Mode production (5 articles) validé
- [ ] Scheduler installé et testé

### Qualité
- [ ] Gestion d'erreurs robuste
- [ ] Logs clairs et utiles
- [ ] Rapports détaillés (JSON + TXT)
- [ ] Performance < 15 min pour 5 articles

### Documentation
- [ ] README d'utilisation
- [ ] Guide installation scheduler
- [ ] Rapport de session
- [ ] Passation pour Session N9

---

## 🎯 ESTIMATION TEMPS

| Tâche | Temps estimé |
|-------|--------------|
| Structure pipeline-workflow.cjs | 15 min |
| Étape Veille | 10 min |
| Étape Rédaction | 10 min |
| Étape Visuels | 15 min |
| Rapports | 10 min |
| CLI et arguments | 10 min |
| Scheduler .bat | 10 min |
| Tests et debug | 20 min |
| **TOTAL** | **1h40** |

**Avec marge** : 1h - 1h30 si pas de problèmes

---

## 🚀 PRÊT POUR LE DÉVELOPPEMENT

**Tous les prérequis sont en place** :
- ✅ Agents fonctionnels
- ✅ Tests validés
- ✅ Structure claire
- ✅ Documentation complète

**Il ne reste plus qu'à** :
1. Créer `pipeline-workflow.cjs`
2. Créer `scheduler.bat`
3. Tester
4. Documenter

---

**Bonne chance pour la Session N8 ! 🚀**

**N'oubliez pas** : Protocole V6 actif, documentation first, questions > suppositions !
