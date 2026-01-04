# 🎨 README - GÉNÉRATEURS VISUELS
## Documentation des générateurs du Workflow Completed

---

## 📋 VUE D'ENSEMBLE

Le système utilise 3 générateurs spécialisés pour créer différents types de visuels, tous upgradés en v2 lors des Sessions N6-N7.

### Architecture des générateurs

```
generateurs/
├── dalle.cjs      # v2.0 - Images via DALL-E 3 ✅
├── charts.cjs     # v2.1 - Graphiques via QuickChart ✅
└── mermaid.cjs    # v2.2 - Schémas via CLI mmdc ✅
```

---

## 🖼️ DALLE.CJS (v2.0)

### Statut : ✅ 100% Fonctionnel (Session N6)

### Rôle
Génère des images professionnelles via l'API DALL-E 3 d'OpenAI.

### Upgrade v2.0
- **Gestion d'erreurs robuste** : Retry automatique 3x
- **Optimisation des prompts** : Templates par type d'image
- **Téléchargement fiable** : Avec timeout et validation
- **Compression automatique** : Images optimisées pour le web

### Utilisation

```javascript
const DalleGenerator = require('./generateurs/dalle.cjs');
const dalle = new DalleGenerator();

// Image hero (bannière)
const hero = await dalle.generateHero({
  prompt: "Modern office with AI visualization, professional photography",
  slug: "adoption-ia-pme"
});

// Image de section
const section = await dalle.generateSection({
  prompt: "Data dashboard on computer screen",
  slug: "adoption-ia-pme",
  index: 1
});
```

### Configuration

```javascript
// Dans dalle.cjs
const CONFIG = {
  model: 'dall-e-3',
  quality: 'hd',
  style: 'vivid',
  heroSize: '1792x1024',
  sectionSize: '1024x1024',
  maxRetries: 3,
  timeout: 30000
};
```

### Templates de prompts optimisés

```javascript
const PROMPT_TEMPLATES = {
  hero: (topic) => `${topic}, professional business setting, modern, bright, high quality photography, wide angle`,
  
  section: (topic) => `${topic}, clean design, professional illustration, corporate style`,
  
  data: (topic) => `Data visualization of ${topic}, dashboard style, modern UI, blue color scheme`
};
```

### Sorties
- Hero : `output/05b-visuels/hero-[slug].png` (1792x1024)
- Sections : `output/05b-visuels/image-[slug]-[index].png` (1024x1024)

### Coût
- $0.08 par image HD
- ~$0.16 par article (2 images)

---

## 📊 CHARTS.CJS (v2.1)

### Statut : ✅ 100% Fonctionnel (Session N6)

### Rôle
Génère des graphiques professionnels via l'API QuickChart.

### Upgrade v2.1
- **Migration QuickChart** : Plus de dépendance canvas locale
- **API cloud** : Generation côté serveur
- **Templates prédéfinis** : 8 types de graphiques
- **Personnalisation** : Couleurs Prizm AI

### Utilisation

```javascript
const ChartsGenerator = require('./generateurs/charts.cjs');
const charts = new ChartsGenerator();

// Graphique en barres
const bar = await charts.generateBar({
  labels: ['2021', '2022', '2023', '2024'],
  data: [20, 35, 52, 68],
  title: 'Adoption IA dans les PME (%)',
  slug: 'adoption-ia'
});

// Graphique en ligne
const line = await charts.generateLine({
  labels: ['Jan', 'Fév', 'Mar', 'Avr'],
  datasets: [
    { label: 'PME', data: [10, 20, 30, 40] },
    { label: 'ETI', data: [15, 25, 35, 45] }
  ],
  title: 'Évolution mensuelle'
});

// Camembert
const pie = await charts.generatePie({
  labels: ['Satisfaits', 'Neutres', 'Insatisfaits'],
  data: [72, 20, 8],
  title: 'Satisfaction utilisateurs'
});
```

### Types disponibles

```javascript
// 8 types de graphiques
charts.generateBar()      // Barres verticales
charts.generateLine()     // Lignes
charts.generatePie()      // Camembert
charts.generateDonut()    // Donut
charts.generateRadar()    // Radar
charts.generatePolar()    // Polaire
charts.generateScatter()  // Nuage de points
charts.generateMixed()    // Mixte (barres + lignes)
```

### Configuration QuickChart

```javascript
const QUICKCHART_CONFIG = {
  baseUrl: 'https://quickchart.io/chart',
  version: '2.9.4',
  width: 800,
  height: 400,
  backgroundColor: 'white',
  devicePixelRatio: 2  // Retina
};
```

### Palette de couleurs Prizm

```javascript
const PRIZM_COLORS = {
  primary: '#3498db',    // Bleu
  secondary: '#2ecc71',  // Vert
  tertiary: '#f39c12',   // Orange
  quaternary: '#e74c3c', // Rouge
  gray: '#95a5a6'        // Gris
};
```

### Sorties
- `output/05b-visuels/chart-[slug]-[index].png`

### Coût
- **Gratuit** (API QuickChart gratuite jusqu'à 10k/mois)

---

## 🗺️ MERMAID.CJS (v2.2)

### Statut : ✅ 100% Fonctionnel (Session N7)

### Rôle
Génère des schémas et diagrammes via Mermaid CLI.

### Upgrade v2.2 - Correction critique
- **Fix CLI mmdc v10+** : Syntaxe `--puppeteerConfigFile` au lieu de `-p`
- **Détection automatique** : Version mmdc installée
- **Fallback intelligent** : Si CLI échoue, export SVG direct
- **Templates optimisés** : 10 types de diagrammes

### Utilisation

```javascript
const MermaidGenerator = require('./generateurs/mermaid.cjs');
const mermaid = new MermaidGenerator();

// Diagramme de flux
const flowchart = await mermaid.generateFlowchart({
  code: `graph LR
    A[Collecte données] --> B[Analyse IA]
    B --> C{Décision}
    C -->|Oui| D[Action]
    C -->|Non| E[Révision]`,
  slug: 'processus-ia'
});

// Diagramme de séquence
const sequence = await mermaid.generateSequence({
  code: `sequenceDiagram
    User->>+API: Request
    API->>+AI: Process
    AI-->>-API: Result
    API-->>-User: Response`,
  slug: 'api-flow'
});
```

### Fix syntaxe mmdc v10+

```javascript
// ANCIEN (mmdc < v10) - NE MARCHE PLUS
const command = `mmdc -i input.mmd -o output.svg -p puppeteer-config.json`;

// NOUVEAU (mmdc v10+) - CORRIGÉ Session N7
const command = `mmdc -i input.mmd -o output.svg --puppeteerConfigFile puppeteer-config.json`;
```

### Types de diagrammes

```javascript
// 10 types supportés
mermaid.generateFlowchart()   // Flux/processus
mermaid.generateSequence()    // Séquence
mermaid.generateGantt()        // Planning Gantt
mermaid.generateClass()        // Classes UML
mermaid.generateState()        // États
mermaid.generateER()           // Entity-Relationship
mermaid.generateJourney()      // Parcours utilisateur
mermaid.generatePie()          // Camembert
mermaid.generateMindmap()      // Carte mentale
mermaid.generateTimeline()     // Timeline
```

### Configuration Puppeteer

```javascript
// puppeteer-config.json (Session N7)
{
  "args": ["--no-sandbox", "--disable-setuid-sandbox"],
  "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "headless": true
}
```

### Sorties
- SVG : `output/05b-visuels/schema-[slug]-[index].svg`
- PNG : `output/05b-visuels/schema-[slug]-[index].png`

### Coût
- **Gratuit** (génération locale)

---

## 🔧 CONFIGURATION COMMUNE

### Installation des dépendances

```bash
# Session N6-N7
npm install openai@latest        # Pour DALL-E
npm install axios                # Pour QuickChart
npm install @mermaid-js/mermaid-cli  # Pour Mermaid
```

### Variables d'environnement

```bash
# config/.env
OPENAI_API_KEY=sk-xxx           # Pour DALL-E
QUICKCHART_API_KEY=xxx          # Optionnel (pour features pro)
```

### Structure commune

```javascript
// Base class pour tous les générateurs
class BaseGenerator {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.outputDir = '../output/05b-visuels';
  }
  
  async generate(options) {
    try {
      // Validation
      this.validate(options);
      
      // Génération
      const result = await this.process(options);
      
      // Sauvegarde
      await this.save(result, options);
      
      return result;
    } catch (error) {
      console.error(`[${this.name}] Erreur :`, error);
      
      // Retry logic
      if (this.retries < this.maxRetries) {
        this.retries++;
        return this.generate(options);
      }
      
      throw error;
    }
  }
}
```

---

## 🐛 RÉSOLUTION DE PROBLÈMES

### DALL-E : "Rate limit exceeded"
```javascript
// Solution : Implémenter un delay
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Charts : "Invalid data format"
```javascript
// Solution : Valider les données
if (!Array.isArray(data) || data.length === 0) {
  throw new Error('Data must be non-empty array');
}
```

### Mermaid : "Command failed"
```javascript
// Solution Session N7 : Utiliser la bonne syntaxe
const flag = mmdc_version >= 10 ? '--puppeteerConfigFile' : '-p';
```

---

## 📊 PERFORMANCES

### Temps de génération (Session N9)
- **DALL-E** : 8-12 secondes par image
- **QuickChart** : 2-3 secondes par graphique
- **Mermaid** : 3-5 secondes par schéma

### Taux de succès
- **DALL-E** : 95% (avec retry)
- **QuickChart** : 99%
- **Mermaid** : 98% (après fix v2.2)

---

## 📈 ÉVOLUTIONS

### Historique
- **v1.0** : Versions initiales avec canvas local
- **v2.0** : Migration cloud (Session N6)
- **v2.1** : QuickChart API (Session N6)
- **v2.2** : Fix mmdc v10+ (Session N7)

### Roadmap
- **v3.0** : Support Midjourney
- **v4.0** : Génération vidéo courte
- **v5.0** : 3D et réalité augmentée

---

## 📚 DOCUMENTATION ASSOCIÉE

- `README-AGENTS.md` : Les agents qui utilisent ces générateurs
- `README-PIPELINE.md` : Le pipeline orchestrateur
- `PASSATION-SESSION-N7.md` : Détails des upgrades

---

*Document créé le : 02 novembre 2025*  
*Basé sur : Sessions N6-N7*  
*Versions : dalle v2.0, charts v2.1, mermaid v2.2*
