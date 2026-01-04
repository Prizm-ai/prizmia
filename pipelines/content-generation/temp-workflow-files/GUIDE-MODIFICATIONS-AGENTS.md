# GUIDE DE MODIFICATION DES AGENTS COPIÉS

Après avoir copié les agents depuis l'ancien système, il faut adapter les chemins pour qu'ils fonctionnent dans le nouveau système **workflow-completed**.

---

## 📝 MODIFICATIONS À FAIRE

### 1. **agent-veille.cjs**

**Fichier :** `workflow-completed/agents/agent-veille.cjs`

#### Modification A : Chemins dotenv et imports

**CHERCHER :**
```javascript
require('dotenv').config({ path: './config/.env' });
const { DateHelper } = require('./utils/date-helper.cjs');
const { SujetScorer } = require('./utils/sujet-scorer.cjs');
```

**REMPLACER PAR :**
```javascript
require('dotenv').config({ path: '../config/.env' });
const { DateHelper } = require('../utils/date-helper.cjs');
const { SujetScorer } = require('../utils/sujet-scorer.cjs');
```

#### Modification B : Chemins de sortie

**CHERCHER :**
```javascript
const OUTPUT_BASE = './output';
```

**REMPLACER PAR :**
```javascript
const OUTPUT_BASE = '../output';
```

---

### 2. **agent-redacteur-factuel.cjs**

**Fichier :** `workflow-completed/agents/agent-redacteur-factuel.cjs`

#### Modification A : Import de configuration

**CHERCHER :**
```javascript
require('dotenv').config({ path: './config/.env' });
const prizm = require('./config/prizm-config.cjs');
```

**REMPLACER PAR :**
```javascript
require('dotenv').config({ path: '../config/.env' });
const prizm = require('../config/config-workflow.cjs');
```

#### Modification B : Chemins de sortie

**CHERCHER :**
```javascript
const OUTPUT_DIR = './output/03-articles-factuels';
```

**REMPLACER PAR :**
```javascript
const OUTPUT_DIR = '../output/03-articles-factuels';
```

---

## 🔍 VÉRIFICATION RAPIDE

Pour vérifier que les modifications sont correctes, cherchez dans les deux fichiers :

**✅ Tous les chemins doivent commencer par `../` car on est dans `/agents/`**

**Exemples corrects :**
```javascript
require('dotenv').config({ path: '../config/.env' });
const helper = require('../utils/date-helper.cjs');
const outputDir = '../output/01-veille';
```

**❌ Exemples incorrects :**
```javascript
require('dotenv').config({ path: './config/.env' });  // ❌ Mauvais
const helper = require('./utils/date-helper.cjs');    // ❌ Mauvais
const outputDir = './output/01-veille';               // ❌ Mauvais
```

---

## 🛠️ MÉTHODE RAPIDE (Find & Replace)

### Dans VS Code :

1. Ouvrir `workflow-completed/agents/agent-veille.cjs`
2. **Ctrl+H** (Find & Replace)
3. Remplacer en masse :

| Chercher | Remplacer par | 
|----------|---------------|
| `'./config/` | `'../config/` |
| `'./utils/` | `'../utils/` |
| `'./output/` | `'../output/` |

4. Faire de même pour `agent-redacteur-factuel.cjs`

---

## ✅ TEST APRÈS MODIFICATION

Une fois les modifications faites, testez que les agents se chargent correctement :

```bash
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

# Tester que l'agent veille se charge sans erreur
node agents/agent-veille.cjs --test

# Tester que l'agent rédacteur se charge sans erreur
node agents/agent-redacteur-factuel.cjs --help
```

**Si vous obtenez des erreurs de type "Cannot find module" → vérifier les chemins**

---

## 📋 CHECKLIST FINALE

Avant de passer à la PHASE 2, vérifiez :

- [ ] `agent-veille.cjs` : tous les chemins en `../`
- [ ] `agent-redacteur-factuel.cjs` : tous les chemins en `../`
- [ ] `config/.env` créé et rempli avec vos clés
- [ ] Les agents se chargent sans erreur (test ci-dessus)
- [ ] Dépendances npm installées (`node_modules` existe)

**Une fois tout coché, dites à Claude : "Installation phase 1 terminée"**

Et vous recevrez tous les agents visuels de la PHASE 2 ! 🚀
