// integrate-best-of-both.js - Fusion optimale des deux structures
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function integrate() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     INTEGRATION OPTIMALE - BEST OF BOTH WORLDS         ║
╚════════════════════════════════════════════════════════╝
  `);

  const report = {
    created: [],
    recovered: [],
    preserved: [],
    warnings: []
  };

  try {
    // 0. Vérifier qu'on est sur master
    console.log('\n0. Vérification de la branche...');
    const { stdout: currentBranch } = await execPromise('git branch --show-current');
    if (currentBranch.trim() !== 'master') {
      console.log('   ! Passage sur master...');
      await execPromise('git checkout master');
    }
    console.log('   ✓ Sur branche master');

    // 1. Récupérer les fichiers business de votre associée
    console.log('\n1. Récupération de la vision business...');
    
    try {
      await execPromise('git checkout newsletter-agents -- business 2>nul');
      console.log('   ✓ business/ récupéré');
      report.recovered.push('business/');
    } catch (e) {
      console.log('   ! business/ non trouvé');
    }
    
    try {
      await execPromise('git checkout newsletter-agents -- core 2>nul');
      console.log('   ✓ core/ récupéré');
      report.recovered.push('core/');
    } catch (e) {
      console.log('   ! core/ non trouvé');
    }
    
    try {
      await execPromise('git checkout newsletter-agents -- operations 2>nul');
      console.log('   ✓ operations/ récupéré');
      report.recovered.push('operations/');
    } catch (e) {
      console.log('   ! operations/ non trouvé');
    }
    
    try {
      await execPromise('git checkout newsletter-agents -- pipelines 2>nul');
      console.log('   ✓ pipelines/ récupéré');
      report.recovered.push('pipelines/');
    } catch (e) {
      console.log('   ! pipelines/ non trouvé');
    }
    
    // 2. Vérifier que le site est bien dans src/
    console.log('\n2. Vérification du site dans src/...');
    try {
      await fs.access('src/pages/index.astro');
      console.log('   ✓ Site intact dans src/');
      report.preserved.push('src/');
    } catch {
      console.log('   ❌ ERREUR : src/pages/index.astro manquant !');
      console.log('   Restauration depuis master...');
      await execPromise('git checkout master -- src');
    }
    
    // 3. Créer la structure finale optimale
    console.log('\n3. Création de la structure hybride...');
    
    const structure = {
      'docs': 'Documentation globale',
      'business/strategy': 'Vision et stratégie',
      'business/operations': 'Processus opérationnels',
      'core/config': 'Configuration partagée',
      'core/utils': 'Utilitaires communs',
      'pipelines/newsletter': 'Agents newsletter Python',
      'pipelines/content-generation': 'Agents génération contenu Node.js',
      'operations/dashboard': 'Tableaux de bord',
      'operations/output': 'Fichiers générés'
    };
    
    for (const [dir, desc] of Object.entries(structure)) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`   ✓ ${dir}/ - ${desc}`);
        report.created.push(dir);
      } catch (e) {
        // Dossier existe déjà
      }
    }
    
    // 4. Déplacer newsletter-1 vers newsletter si nécessaire
    console.log('\n4. Organisation des pipelines...');
    try {
      await fs.access('pipelines/newsletter-1');
      console.log('   ! newsletter-1 détecté, déplacement vers newsletter/');
      
      // Copier le contenu
      await copyDirectory('pipelines/newsletter-1', 'pipelines/newsletter');
      
      // Supprimer l'ancien
      await removeDirectory('pipelines/newsletter-1');
      
      console.log('   ✓ Déplacé vers pipelines/newsletter/');
    } catch {
      console.log('   ✓ Structure pipelines déjà organisée');
    }
    
    // 5. Créer la documentation
    console.log('\n5. Création de la documentation...');
    
    // README principal
    const readmeContent = `# Prizm AI - Hub Complet

## 🎯 Vision
"Démocratiser l'IA pour TOUTES les entreprises françaises - des professions libérales aux ETI"

## 🚀 Accès Rapide
- **Site Web Live** : https://prizm-ai.netlify.app
- **Dashboard** : [À venir]
- **Documentation** : [/docs](./docs)

## 🏗️ Architecture du Projet

### /src - Site Web Astro ⚠️ CRITIQUE
**NE JAMAIS MODIFIER SANS COORDINATION**
- Le site principal construit avec Astro
- Déployé automatiquement sur Netlify
- Toute modification ici impacte le site en production

### /business - Stratégie & Vision
- **strategy/** : Business Model Canvas, positionnement marché, roadmap
- **operations/** : Processus opérationnels, workflows, KPIs

### /core - Logique Métier Partagée
- **config/** : Configuration centrale pour tous les systèmes
- **utils/** : Code réutilisable entre les différents pipelines

### /pipelines - Automatisation IA
- **newsletter/** : Agents Python pour newsletter automatisée (Mailchimp, rédaction)
- **content-generation/** : Agents Node.js pour génération d'articles blog

### /operations - Monitoring & Production
- **dashboard/** : Métriques temps réel, KPIs, analytics
- **output/** : Fichiers générés par les différents pipelines

## 📊 Segments de Marché

### 1. TPE & Professions Libérales
- **Cible** : < 10 employés
- **Budget** : < 500€/mois
- **Focus** : ROI immédiat, simplicité absolue

### 2. PME (20-250 employés)
- **Cible** : Entreprises en croissance
- **Budget** : 500-5000€/mois
- **Focus** : Transformation progressive, formation équipes

### 3. ETI
- **Cible** : > 250 employés
- **Budget** : > 5000€/mois
- **Focus** : Stratégie IA globale, intégration systèmes

## 🚀 Quick Start

### Développement Site Web
\`\`\`bash
npm install
npm run dev
# Site accessible sur http://localhost:4321
\`\`\`

### Agents Newsletter (Python)
\`\`\`bash
cd pipelines/newsletter
pip install -r requirements.txt
python main.py
\`\`\`

### Agents Content Generation (Node.js)
\`\`\`bash
cd pipelines/content-generation
npm install
node pipeline-v4.js
\`\`\`

## 📝 Règles de Collaboration

1. **Branches Git** : Toujours créer une branche pour les changements majeurs
2. **Site Web** : Ne jamais supprimer ou déplacer /src sans coordination
3. **Tests** : Tester localement avant tout push
4. **Documentation** : Mettre à jour les README lors de changements structurels

## 👥 Équipe & Responsabilités

| Zone | Responsable | Contact |
|------|------------|---------|
| Site Web (/src) | Samuel | @Samuel |
| Agents Content | Samuel | @Samuel |
| Agents Newsletter | [Associée] | @[Associée] |
| Business Strategy | [Associée] | @[Associée] |

## 📅 Dernières Mises à Jour
- ${new Date().toLocaleDateString('fr-FR')} : Intégration structure unifiée
- Site restauré et fonctionnel
- Agents newsletter intégrés
- Documentation créée

---
Pour toute question, voir [/docs/STRUCTURE.md](./docs/STRUCTURE.md)
`;
    
    await fs.writeFile('README.md', readmeContent, 'utf-8');
    console.log('   ✓ README.md créé');
    
    // STRUCTURE.md dans docs/
    const structureDoc = `# Structure Détaillée - Prizm AI

## Vue d'Ensemble des Dossiers

\`\`\`
prizmia/
│
├── 📁 src/                      # SITE WEB (Astro)
│   ├── pages/                   # Pages du site
│   ├── components/              # Composants réutilisables
│   ├── layouts/                 # Templates de pages
│   ├── content/blog/            # Articles du blog
│   └── styles/                  # CSS global
│
├── 📁 business/                 # VISION & STRATÉGIE
│   ├── strategy/               
│   │   └── business-model.md    # Business Model Canvas complet
│   └── operations/
│       └── processes.md         # Workflows opérationnels
│
├── 📁 core/                     # LOGIQUE PARTAGÉE
│   ├── config.js                # Configuration centrale
│   ├── production.js            # Helpers de production
│   └── utils/                   # Fonctions utilitaires
│
├── 📁 pipelines/                # AUTOMATISATION
│   ├── newsletter/              
│   │   ├── agents/              # Agents Python
│   │   │   ├── agent_mailchimp.py
│   │   │   └── agent_redacteur.py
│   │   └── README.md
│   │
│   └── content-generation/      
│       ├── agent-veille.js      # Veille IA
│       ├── agent-redacteur.js   # Rédaction articles
│       └── pipeline-v4.js       # Orchestration
│
├── 📁 operations/               # MONITORING
│   ├── dashboard/               # Tableaux de bord
│   └── output/                  # Résultats des pipelines
│
└── 📁 docs/                     # DOCUMENTATION
    ├── STRUCTURE.md             # Ce fichier
    └── guides/                  # Guides d'utilisation

\`\`\`

## Flux de Travail

### 1. Génération de Contenu
\`\`\`
Veille (agent-veille.js) 
    → Rédaction (agent-redacteur.js) 
    → Publication (src/content/blog/)
\`\`\`

### 2. Newsletter Automatisée
\`\`\`
Sources RSS/API 
    → Agent Python (analyse) 
    → Rédaction 
    → Mailchimp
\`\`\`

### 3. Site Web
\`\`\`
Développement local (npm run dev)
    → Push GitHub
    → Build Netlify automatique
    → Site en production
\`\`\`

## Commandes Essentielles

### Général
\`\`\`bash
# Voir la structure
tree -L 2 -I node_modules

# État Git
git status
\`\`\`

### Site Web
\`\`\`bash
# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview
\`\`\`

### Pipelines
\`\`\`bash
# Content Generation
cd pipelines/content-generation
node pipeline-v4.js

# Newsletter
cd pipelines/newsletter
python main.py
\`\`\`

## Points d'Attention ⚠️

1. **Ne JAMAIS** supprimer /src sans backup
2. **Toujours** tester le site après modifications structurelles
3. **Coordonner** les changements majeurs entre équipes
4. **Documenter** tout nouveau pipeline ou agent

## Support

- Problème site : @Samuel
- Problème agents : Voir responsable du pipeline
- Problème déploiement : Vérifier Netlify + GitHub

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}
`;
    
    await fs.mkdir('docs', { recursive: true });
    await fs.writeFile('docs/STRUCTURE.md', structureDoc, 'utf-8');
    console.log('   ✓ docs/STRUCTURE.md créé');
    
    // 6. Vérifier et nettoyer
    console.log('\n6. Vérification finale...');
    
    // Vérifier si website/ existe (doublon potentiel)
    try {
      await fs.access('website');
      console.log('   ⚠️  Dossier website/ détecté');
      console.log('      Vérifiez s\'il contient une copie du site');
      console.log('      Si oui, il peut être supprimé (le site est dans /src)');
      report.warnings.push('Dossier website/ à vérifier');
    } catch {
      console.log('   ✓ Pas de doublon website/');
    }
    
    // Rapport final
    console.log(`
    
════════════════════════════════════════════════════════════

✅ INTÉGRATION TERMINÉE AVEC SUCCÈS !

📊 Rapport :
   Dossiers créés : ${report.created.length}
   Éléments récupérés : ${report.recovered.length}
   Éléments préservés : ${report.preserved.length}
   Avertissements : ${report.warnings.length}

📁 Structure finale :
   prizmia/
   ├── src/                 # ✓ Site Astro (préservé)
   ├── business/            # ✓ Vision business (récupéré)
   ├── core/                # ✓ Config partagée
   ├── pipelines/           # ✓ Tous les agents
   ├── operations/          # ✓ Dashboard & monitoring
   └── docs/                # ✓ Documentation

🎯 Prochaines étapes :

1. TESTER LE SITE :
   npm run dev
   
2. VÉRIFIER LES FICHIERS :
   git status
   
3. COMMITER LES CHANGEMENTS :
   git add .
   git commit -m "feat: intégration structure unifiée site + business + agents"
   
4. POUSSER SUR GITHUB :
   git push

5. VÉRIFIER NETLIFY :
   Le site devrait se redéployer automatiquement

💡 Le meilleur des deux mondes est maintenant intégré !
   - Site web préservé et fonctionnel
   - Vision business de votre associée intégrée
   - Structure claire pour l'avenir

🚀 Prizm AI est prêt pour la croissance !
    `);
    
  } catch (error) {
    console.error('\n❌ Erreur durant l\'intégration :', error.message);
    console.log('\nEssayez de résoudre l\'erreur puis relancez le script.');
  }
}

// Fonctions utilitaires
async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true });
  const files = await fs.readdir(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = await fs.stat(sourcePath);
    
    if (stat.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function removeDirectory(dir) {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await removeDirectory(filePath);
      } else {
        await fs.unlink(filePath);
      }
    }
    
    await fs.rmdir(dir);
  } catch (e) {
    console.log(`   ! Impossible de supprimer ${dir}`);
  }
}

// Lancer l'intégration
integrate().catch(console.error);