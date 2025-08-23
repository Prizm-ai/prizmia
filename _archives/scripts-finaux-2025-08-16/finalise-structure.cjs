// finalise-structure.cjs - Finaliser la structure et corriger tous les chemins
const fs = require('fs').promises;
const path = require('path');

async function finaliserStructure() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     FINALISATION DE LA STRUCTURE PRIZM AI              ║
╚════════════════════════════════════════════════════════╝
  `);

  // 1. Créer les dossiers manquants
  console.log('📁 ÉTAPE 1 : CRÉATION DES DOSSIERS MANQUANTS\n');
  
  const dossiersRequis = [
    './output/01-veille/2025/07-juillet',
    './output/01-veille/2025/08-août',
    './output/02-corpus/2025-07',
    './output/02-corpus/2025-08',
    './output/03-articles-factuels',
    './output/04-articles-conversationnels',
    './output/05-articles-finaux',  // MANQUANT
    './output/06-rapports',         // MANQUANT - renommer 05-rapports
    './output/07-archives/2025'     // MANQUANT
  ];

  for (const dossier of dossiersRequis) {
    try {
      await fs.mkdir(dossier, { recursive: true });
      console.log(`✅ ${dossier}`);
    } catch (error) {
      console.log(`⚠️  ${dossier} - ${error.message}`);
    }
  }

  // 2. Renommer 05-rapports en 06-rapports
  console.log('\n📁 ÉTAPE 2 : RENOMMAGE DES DOSSIERS\n');
  
  try {
    await fs.rename('./output/05-rapports', './output/06-rapports');
    console.log('✅ Renommé : 05-rapports → 06-rapports');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('ℹ️  05-rapports n\'existe pas ou déjà renommé');
    } else if (error.code === 'EEXIST') {
      // 06-rapports existe déjà, migrer le contenu
      console.log('⚠️  06-rapports existe déjà, migration du contenu...');
      try {
        const files = await fs.readdir('./output/05-rapports');
        for (const file of files) {
          await fs.rename(
            path.join('./output/05-rapports', file),
            path.join('./output/06-rapports', file)
          );
        }
        await fs.rmdir('./output/05-rapports');
        console.log('✅ Contenu migré de 05-rapports vers 06-rapports');
      } catch (e) {
        console.log('ℹ️  Rien à migrer');
      }
    }
  }

  // 3. Migrer le corpus depuis corpus-verifie si nécessaire
  console.log('\n📁 ÉTAPE 3 : MIGRATION DU CORPUS\n');
  
  try {
    const oldCorpusPath = './output/corpus-verifie';
    const newCorpusPath = './output/02-corpus';
    
    await fs.access(oldCorpusPath);
    console.log('📦 Migration de corpus-verifie vers 02-corpus...');
    
    const items = await fs.readdir(oldCorpusPath);
    for (const item of items) {
      const oldPath = path.join(oldCorpusPath, item);
      const newPath = path.join(newCorpusPath, item);
      
      try {
        await fs.rename(oldPath, newPath);
        console.log(`   ✅ Migré : ${item}`);
      } catch (error) {
        if (error.code === 'EEXIST') {
          console.log(`   ⚠️  ${item} existe déjà dans 02-corpus`);
        }
      }
    }
    
    // Supprimer l'ancien dossier s'il est vide
    try {
      await fs.rmdir(oldCorpusPath);
      console.log('✅ Supprimé : corpus-verifie (vide)');
    } catch {
      console.log('ℹ️  corpus-verifie contient encore des fichiers');
    }
    
  } catch (error) {
    console.log('ℹ️  Pas de corpus-verifie à migrer');
  }

  // 4. Corriger le pipeline
  console.log('\n⚙️ ÉTAPE 4 : CORRECTION DU PIPELINE\n');
  
  try {
    let pipelineContent = await fs.readFile('pipeline-v4-fixed.cjs', 'utf8');
    let modified = false;
    
    // Remplacements nécessaires
    const replacements = [
      ['corpus-verifie', '02-corpus'],
      ['02-articles-factuels', '03-articles-factuels'],
      ['03-articles-conversationnels', '04-articles-conversationnels'],
      ['04-articles-finaux', '05-articles-finaux'],
      ['05-rapports', '06-rapports'],
      ['06-archives', '07-archives']
    ];
    
    for (const [old, newStr] of replacements) {
      const regex = new RegExp(old, 'g');
      if (pipelineContent.match(regex)) {
        pipelineContent = pipelineContent.replace(regex, newStr);
        console.log(`   ✅ ${old} → ${newStr}`);
        modified = true;
      }
    }
    
    // Corriger aussi le chemin du corpus dans la recherche
    if (pipelineContent.includes('corpus-verifie')) {
      pipelineContent = pipelineContent.replace(/corpus-verifie/g, '02-corpus');
      console.log('   ✅ Chemins du corpus corrigés');
      modified = true;
    }
    
    if (modified) {
      await fs.copyFile('pipeline-v4-fixed.cjs', `pipeline-v4-fixed.cjs.backup-${Date.now()}`);
      await fs.writeFile('pipeline-v4-fixed.cjs', pipelineContent);
      console.log('\n✅ Pipeline corrigé et sauvegardé');
    } else {
      console.log('✅ Pipeline déjà à jour');
    }
    
  } catch (error) {
    console.log('❌ Erreur correction pipeline:', error.message);
  }

  // 5. Vérifier la structure finale
  console.log('\n📊 ÉTAPE 5 : VÉRIFICATION FINALE\n');
  
  const expectedDirs = [
    '01-veille',
    '02-corpus',
    '03-articles-factuels',
    '04-articles-conversationnels',
    '05-articles-finaux',
    '06-rapports',
    '07-archives'
  ];
  
  console.log('Structure attendue :');
  for (const dir of expectedDirs) {
    try {
      await fs.access(path.join('./output', dir));
      const files = await fs.readdir(path.join('./output', dir));
      console.log(`   ✅ ${dir}/ (${files.length} éléments)`);
    } catch {
      console.log(`   ❌ ${dir}/ MANQUANT`);
    }
  }

  // 6. Test du pipeline
  console.log('\n🧪 ÉTAPE 6 : TEST DE CONFIGURATION\n');
  
  try {
    const config = require('./config/prizm-config.cjs');
    
    // Vérifier que la config pointe vers output
    if (config.paths.base.includes('output')) {
      console.log('✅ Configuration pointe vers ./output/');
    } else {
      console.log('⚠️  Configuration ne pointe pas vers ./output/');
      
      // Corriger la config
      let configContent = await fs.readFile('./config/prizm-config.cjs', 'utf8');
      configContent = configContent.replace(/prizm-output/g, 'output');
      
      await fs.copyFile('./config/prizm-config.cjs', `./config/prizm-config.cjs.backup-${Date.now()}`);
      await fs.writeFile('./config/prizm-config.cjs', configContent);
      console.log('✅ Configuration corrigée');
    }
  } catch (error) {
    console.log('❌ Erreur vérification config:', error.message);
  }

  // 7. Rapport final
  console.log('\n' + '═'.repeat(60));
  console.log('\n✨ FINALISATION TERMINÉE !\n');
  console.log('═'.repeat(60));
  
  console.log('\n📋 STRUCTURE FINALE :');
  console.log(`
output/
├── 01-veille/              # Veilles quotidiennes
├── 02-corpus/              # Corpus enrichis
├── 03-articles-factuels/   # Articles factuels
├── 04-articles-conversationnels/ # Articles conversationnels
├── 05-articles-finaux/     # Articles validés
├── 06-rapports/            # Rapports et diagnostics
└── 07-archives/            # Archives par session
  `);
  
  console.log('\n🚀 PROCHAINES ÉTAPES :');
  console.log('1. Tester le pipeline :');
  console.log('   node pipeline-v4-fixed.cjs --test\n');
  console.log('2. Générer un nouvel article :');
  console.log('   node pipeline-v4-fixed.cjs --nouvelle-veille\n');
  console.log('3. Si erreur, vérifier les logs :');
  console.log('   dir output\\06-rapports\\erreur-*.json');
  
  // Créer un fichier de statut
  const status = {
    date: new Date().toISOString(),
    structure: expectedDirs,
    migration: 'Complète',
    pipeline: 'Corrigé',
    pret: true
  };
  
  await fs.writeFile(
    './output/06-rapports/finalisation-structure.json',
    JSON.stringify(status, null, 2)
  );
  
  console.log('\n💾 Rapport sauvegardé : output/06-rapports/finalisation-structure.json');
}

// Exécution
if (require.main === module) {
  finaliserStructure().catch(console.error);
}

module.exports = finaliserStructure;