// fix-agent-paths.cjs
// Met à jour les chemins dans les agents après la réorganisation
// Usage : node fix-agent-paths.cjs

const fs = require('fs').promises;
const path = require('path');

async function updatePaths() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     MISE À JOUR DES CHEMINS APRÈS RÉORGANISATION      ║
╚════════════════════════════════════════════════════════╝
  `);

  const agentsDir = 'C:/Users/Samuel/Documents/prizmia/pipelines/content-generation/agents';
  const updates = [];

  // Corrections à appliquer
  const pathFixes = [
    // Dans les agents, corriger les chemins vers config et utils
    { 
      from: /require\(['"]\.\.\/config\//g,
      to: "require('../../config/",
      files: ['agent-*.cjs', 'pipeline-*.cjs']
    },
    {
      from: /require\(['"]\.\/config\//g, 
      to: "require('../config/",
      files: ['agent-*.cjs', 'pipeline-*.cjs']
    },
    {
      from: /require\(['"]\.\.\/utils\//g,
      to: "require('../../utils/",
      files: ['agent-*.cjs', 'pipeline-*.cjs']
    },
    {
      from: /require\(['"]\.\/utils\//g,
      to: "require('../utils/",
      files: ['agent-*.cjs', 'pipeline-*.cjs']
    },
    // Corriger les références entre agents
    {
      from: /require\(['"]\.\/agent-/g,
      to: "require('./agent-",
      files: ['pipeline-*.cjs']
    },
    // Corriger les chemins dotenv
    {
      from: /config\({ path: ['"]\.\/config\/\.env['"]/g,
      to: "config({ path: '../config/.env'",
      files: ['*.cjs']
    },
    {
      from: /config\({ path: ['"]config\/\.env['"]/g,
      to: "config({ path: '../config/.env'",
      files: ['*.cjs']
    }
  ];

  // Parcourir tous les fichiers d'agents
  const files = await fs.readdir(agentsDir);
  
  for (const file of files) {
    if (file.endsWith('.cjs')) {
      const filePath = path.join(agentsDir, file);
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      for (const fix of pathFixes) {
        // Vérifier si ce fichier doit être traité
        const shouldProcess = fix.files.some(pattern => {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(file);
        });
        
        if (shouldProcess && fix.from.test(content)) {
          content = content.replace(fix.from, fix.to);
          modified = true;
          updates.push({
            file: file,
            fix: fix.from.toString() + ' → ' + fix.to
          });
        }
      }
      
      if (modified) {
        // Sauvegarder avec backup
        const backupPath = filePath + '.backup-paths';
        await fs.writeFile(backupPath, await fs.readFile(filePath));
        await fs.writeFile(filePath, content);
        console.log(`✅ ${file} mis à jour`);
      }
    }
  }

  // Mettre à jour aussi le package.json si nécessaire
  const packagePath = 'C:/Users/Samuel/Documents/prizmia/package.json';
  try {
    let packageContent = await fs.readFile(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    
    if (packageData.scripts) {
      let scriptsModified = false;
      
      // Mettre à jour les scripts npm
      const scriptFixes = {
        'content:generate': 'cd pipelines/content-generation/agents && node pipeline-v5-batch.cjs',
        'content:test': 'cd pipelines/content-generation/agents && node pipeline-v5-batch.cjs --test',
        'content:single': 'cd pipelines/content-generation/agents && node pipeline-v5-batch.cjs --single'
      };
      
      for (const [key, value] of Object.entries(scriptFixes)) {
        if (packageData.scripts[key] !== value) {
          packageData.scripts[key] = value;
          scriptsModified = true;
          console.log(`✅ Script npm "${key}" mis à jour`);
        }
      }
      
      if (scriptsModified) {
        await fs.writeFile(packagePath + '.backup', packageContent);
        await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
        console.log('✅ package.json mis à jour');
      }
    }
  } catch (error) {
    console.log('⚠️  package.json non modifié (erreur ou non trouvé)');
  }

  // Créer un script de lancement direct
  const launchScript = `@echo off
cd /d "%~dp0"
echo ===============================================
echo     PIPELINE PRIZM AI V5 - GENERATION BATCH
echo ===============================================
echo.
node pipeline-v5-batch.cjs %*
pause`;

  await fs.writeFile(path.join(agentsDir, 'launch-pipeline.bat'), launchScript);
  console.log('✅ Script de lancement créé : launch-pipeline.bat');

  // Afficher le résumé
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RÉSUMÉ DES MISES À JOUR');
  console.log('═'.repeat(60));
  
  if (updates.length > 0) {
    console.log('\n✅ Chemins corrigés :');
    const uniqueFiles = [...new Set(updates.map(u => u.file))];
    uniqueFiles.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log('\n✅ Aucune mise à jour nécessaire - Les chemins sont déjà corrects !');
  }

  console.log('\n💡 POUR TESTER LE PIPELINE :');
  console.log('   cd agents');
  console.log('   node pipeline-v5-batch.cjs --test');
  console.log('\n   OU utilisez : launch-pipeline.bat');
}

// Exécuter
updatePaths().catch(console.error);