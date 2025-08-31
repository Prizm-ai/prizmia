// fix-output-paths.cjs
// Corrige les chemins vers le dossier output après réorganisation
// Usage : node fix-output-paths.cjs

const fs = require('fs').promises;
const path = require('path');

async function fixOutputPaths() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║        CORRECTION DES CHEMINS OUTPUT                   ║
╚════════════════════════════════════════════════════════╝
  `);

  const agentsDir = 'C:/Users/Samuel/Documents/prizmia/pipelines/content-generation/agents';
  const files = [
    'agent-veille-v5.cjs',
    'agent-redacteur-factuel.cjs', 
    'agent-style-conversationnel.cjs',
    'pipeline-v4-fixed.cjs',
    'pipeline-v5-batch.cjs'
  ];

  // Corrections spécifiques pour les chemins output
  const outputFixes = [
    // Chemins relatifs vers output
    {
      from: /['"]\.\/output\//g,
      to: "'../output/"
    },
    {
      from: /path\.join\(CONFIG\.STRUCTURE\.base,/g,
      to: "path.join('../output',"
    },
    {
      from: /const outputDir = ['"]\.\/output\//g,
      to: "const outputDir = '../output/"
    },
    {
      from: /CONFIG\.STRUCTURE\.base = ['"]\.\/output['"]/g,
      to: "CONFIG.STRUCTURE.base = '../output'"
    },
    // Pour les paths.join qui utilisent ./output
    {
      from: /path\.join\(['"]\.\/output['"]/g,
      to: "path.join('../output'"
    },
    // Pour CONFIG.CORPUS_DIR
    {
      from: /CORPUS_DIR: ['"]\.\/output\/02-corpus['"]/g,
      to: "CORPUS_DIR: '../output/02-corpus'"
    }
  ];

  let totalFixes = 0;

  for (const fileName of files) {
    const filePath = path.join(agentsDir, fileName);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      for (const fix of outputFixes) {
        if (fix.from.test(content)) {
          content = content.replace(fix.from, fix.to);
          modified = true;
          totalFixes++;
        }
      }
      
      if (modified) {
        // Créer un backup
        await fs.writeFile(filePath + '.backup-output', await fs.readFile(filePath));
        // Sauvegarder les corrections
        await fs.writeFile(filePath, content);
        console.log(`✅ ${fileName} - chemins output corrigés`);
      }
    } catch (error) {
      console.log(`⚠️  Erreur avec ${fileName}: ${error.message}`);
    }
  }

  // Créer aussi le dossier articles-batch-v5-ready s'il n'existe pas
  const batchReadyDir = 'C:/Users/Samuel/Documents/prizmia/pipelines/content-generation/output/articles-batch-v5-ready';
  try {
    await fs.mkdir(batchReadyDir, { recursive: true });
    console.log('✅ Dossier articles-batch-v5-ready créé');
  } catch (error) {
    // Le dossier existe déjà
  }

  // Résumé
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('═'.repeat(60));
  console.log(`✅ ${totalFixes} corrections appliquées`);
  console.log('\n💡 TEST RECOMMANDÉ :');
  console.log('   cd agents');
  console.log('   node pipeline-v5-batch.cjs --test');
}

// Exécuter
fixOutputPaths().catch(console.error);