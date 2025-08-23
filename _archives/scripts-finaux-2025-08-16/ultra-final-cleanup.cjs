// ultra-final-cleanup.cjs
// Nettoyage ULTIME des derniers fichiers restants
// Usage : node ultra-final-cleanup.cjs

const fs = require('fs').promises;
const path = require('path');

async function ultraFinalCleanup() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║        NETTOYAGE ULTIME - DERNIERS FICHIERS           ║
╚════════════════════════════════════════════════════════╝
  `);

  const baseDir = 'C:/Users/Samuel/Documents/prizmia';
  const archiveDir = path.join(baseDir, '_archives/scripts-finaux-2025-08-16');
  
  // Créer le dossier d'archive
  await fs.mkdir(archiveDir, { recursive: true });

  let movedCount = 0;
  let errors = [];

  // FICHIERS DANS LA RACINE À ARCHIVER
  const rootFiles = [
    'clean-duplicate-frontmatter.js',
    'fix-all-blog-issues.js', 
    'fix-articlecard-integration.js',
    'fix-date-field.js',
    'fix-dates-correctly.js',
    'fix-frontmatter-encoding.js',
    'integrate-best-of-both.js',
    'revert-to-pubdate.js',
    'update-css-variables.js'
  ];

  console.log('\n📁 Nettoyage de la racine du projet :');
  
  for (const file of rootFiles) {
    const source = path.join(baseDir, file);
    const dest = path.join(archiveDir, file);
    
    try {
      await fs.access(source);
      await fs.rename(source, dest);
      console.log(`   ✅ ${file} → archives`);
      movedCount++;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`   ⚠️  ${file} - déjà archivé ou n'existe pas`);
      } else {
        errors.push(`${file}: ${error.message}`);
      }
    }
  }

  // DOSSIER output DANS agents/ - À DÉPLACER
  console.log('\n📁 Déplacement du dossier output mal placé :');
  
  const wrongOutputPath = path.join(baseDir, 'pipelines/content-generation/agents/output');
  const correctOutputPath = path.join(baseDir, 'pipelines/content-generation/output-temp-backup');
  
  try {
    await fs.access(wrongOutputPath);
    
    // Si le dossier output existe dans agents/, c'est une erreur
    // On le déplace temporairement pour vérifier son contenu
    await fs.rename(wrongOutputPath, correctOutputPath);
    console.log(`   ✅ output/ déplacé de agents/ vers content-generation/output-temp-backup`);
    console.log(`   ⚠️  VÉRIFIEZ ce dossier et fusionnez avec le vrai output/ si nécessaire`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`   ℹ️  Pas de dossier output dans agents/ (c'est normal)`);
    } else {
      errors.push(`output: ${error.message}`);
    }
  }

  // RÉSUMÉ
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RÉSUMÉ DU NETTOYAGE ULTIME');
  console.log('═'.repeat(60));
  console.log(`\n✅ Fichiers archivés : ${movedCount}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Erreurs rencontrées :`);
    errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✨ NETTOYAGE ULTIME TERMINÉ !');
  
  // VÉRIFICATION FINALE
  console.log('\n📋 STRUCTURE FINALE ATTENDUE :');
  console.log(`
prizmia/
├── _archives/              ✅ Tous les backups et scripts
├── pipelines/              ✅ Pipeline de génération
│   └── content-generation/
│       ├── agents/         ✅ 5 agents + launch.bat SEULEMENT
│       ├── config/         ✅ Configuration
│       ├── utils/          ✅ Utilitaires  
│       ├── maintenance/    ✅ Scripts maintenance
│       └── output/         ✅ Production
├── src/                    ✅ Site web
├── public/                 ✅ Assets publics
├── operations/             ✅ (vide ou peu utilisé)
├── .env                    ✅ Variables d'environnement
├── .gitignore             ✅ Git ignore
├── astro.config           ✅ Config Astro
├── package.json           ✅ Dependencies
├── package-lock.json      ✅ Lock file
├── tsconfig.json          ✅ TypeScript config
├── README.md              ✅ Documentation
├── PROTOCOLE-COLLABORATION-V2.md ✅ Protocole
└── structure-prizmia.txt  ✅ Arborescence
  `);
  
  console.log('🎯 Votre projet est maintenant ULTRA PROPRE !');
}

// Exécuter
ultraFinalCleanup().catch(console.error);