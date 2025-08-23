// fix-js-encoding.cjs
// Corrige l'encodage cassé dans TOUS les fichiers JavaScript du système
const fs = require('fs').promises;
const path = require('path');

async function fixJSEncoding() {
  console.log('\n🔧 CORRECTION DE L\'ENCODAGE DES FICHIERS JAVASCRIPT');
  console.log('='.repeat(60) + '\n');
  
  const BASE_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\pipelines\\content-generation';
  
  // Fichiers critiques à corriger
  const filesToFix = [
    'config/prizm-config.cjs',
    'agent-redacteur-factuel.cjs',
    'agent-veille-v5.cjs',
    'agent-style-conversationnel.cjs',
    'pipeline-v5-batch.cjs'
  ];
  
  // Dictionnaire de corrections
  const corrections = {
    // Caractères français de base
    'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â', 'Ãª': 'ê',
    'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã§': 'ç', 'Ã®': 'î',
    'Ã¯': 'ï', 'Ã‰': 'É', 'Ãˆ': 'È', 'Ã€': 'À', 'Ã‡': 'Ç',
    'ÃŠ': 'Ê', 'Ã"': 'Ô', 'Ã‚': 'Â',
    // Cas spéciaux
    'gÃ©nÃ©rale': 'générale',
    'OÃ¹': 'Où',
    'oÃ¹': 'où',
    'crÃ©er': 'créer',
    'crÃ©Ã©': 'créé',
    'gÃ©nÃ©rer': 'générer',
    'rÃ©dacteur': 'rédacteur',
    'prÃªts': 'prêts',
    'vÃ©rifiÃ©es': 'vérifiées',
    'sauvegardÃ©': 'sauvegardé',
    'terminÃ©': 'terminé',
    'rÃ©ussis': 'réussis',
    'Ã©checs': 'échecs',
    'durÃ©e': 'durée',
    'Ã©quipe': 'équipe',
    'catÃ©gorie': 'catégorie',
    'qualitÃ©': 'qualité',
    // Symboles de console (on les laisse, ils seront corrigés plus tard)
  };
  
  let totalFixed = 0;
  
  for (const file of filesToFix) {
    const filepath = path.join(BASE_DIR, file);
    
    try {
      console.log(`\n📄 Traitement de ${file}...`);
      
      // Lire le fichier
      let content = await fs.readFile(filepath, 'utf8');
      const originalContent = content;
      let fixCount = 0;
      
      // Appliquer toutes les corrections
      for (const [bad, good] of Object.entries(corrections)) {
        const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, good);
          fixCount += matches.length;
        }
      }
      
      // Si des modifications ont été faites
      if (content !== originalContent) {
        // Créer une sauvegarde
        const backupPath = filepath + '.backup-' + Date.now();
        await fs.writeFile(backupPath, originalContent, 'utf8');
        console.log(`   💾 Sauvegarde : ${path.basename(backupPath)}`);
        
        // Écrire le fichier corrigé
        await fs.writeFile(filepath, content, 'utf8');
        console.log(`   ✅ ${fixCount} corrections appliquées`);
        totalFixed += fixCount;
        
        // Afficher quelques exemples de ce qui a été corrigé
        const examples = [];
        for (const [bad, good] of Object.entries(corrections)) {
          if (originalContent.includes(bad)) {
            examples.push(`${bad} → ${good}`);
            if (examples.length >= 3) break;
          }
        }
        if (examples.length > 0) {
          console.log(`   📝 Exemples : ${examples.join(', ')}`);
        }
      } else {
        console.log(`   ⏭️  Pas de caractères mal encodés trouvés`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur : ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 TOTAL : ${totalFixed} corrections appliquées`);
  
  if (totalFixed > 0) {
    console.log('\n✅ Les fichiers JavaScript sont maintenant correctement encodés !');
    console.log('\n🧪 ÉTAPE SUIVANTE : Test de génération');
    console.log('1. Générer un article de test :');
    console.log('   node pipeline-v5-batch.cjs --single --titre "Test encodage UTF-8 corrigé"');
    console.log('\n2. Vérifier l\'article généré :');
    console.log('   type output\\articles-batch-v5-ready\\*.md | Select-Object -First 20');
    console.log('\n3. Si OK, générer les 5 articles restants');
  } else {
    console.log('\n✅ Tous les fichiers sont déjà correctement encodés.');
  }
}

// Lancer
fixJSEncoding().catch(console.error);