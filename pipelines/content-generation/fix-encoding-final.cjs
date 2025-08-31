/**
 * Script de correction finale de l'encodage UTF-8
 * Corrige tous les caractères corrompus dans les articles publiés
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', '..', 'src', 'content', 'blog');

// Mapping des caractères corrompus vers les bons caractères
const REPLACEMENTS = {
  // Caractères français
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ãª': 'ê',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã´': 'ô',
  'Ã®': 'î',
  'Ã¯': 'ï',
  'Ã§': 'ç',
  'Ã¹': 'ù',
  'Ã»': 'û',
  'Ã¼': 'ü',
  'Ã¶': 'ö',
  'Ã«': 'ë',
  'Ã€': 'À',
  'Ã‰': 'É',
  'Ãˆ': 'È',
  'Ãª': 'ê',
  'Ã‡': 'Ç',
  'Å"': 'œ',
  'Ã"': 'œ',
  
  // Guillemets et apostrophes
  'â€™': "'",
  'â€œ': '"',
  'â€': '"',
  'â€˜': "'",
  'Â«': '«',
  'Â»': '»',
  
  // Tirets et espaces
  'â€"': '—',
  'â€"': '–',
  'Â ': ' ',
  'â€¦': '…',
  
  // Symboles
  'â€¢': '•',
  'â‚¬': '€',
  'Â°': '°',
  '%C2%A0': ' ',
  
  // Emojis corrompus
  'ðŸš€': '🚀',
  'ðŸ¢': '🏢',
  'ðŸ¤–': '🤖',
  'ðŸ'¬': '💬',
  'âš¡': '⚡',
  'ðŸ"ˆ': '📈',
  'ðŸ"Š': '📊',
  'ðŸ"š': '📚',
  'ðŸ"„': '🔄',
  'ðŸŽ¯': '🎯',
  'âš–ï¸': '⚖️',
  
  // Corrections supplémentaires
  'L\'Ã©quipe Prizm AI': "L'équipe Prizm AI",
  'L\'Acquipe Prizm AI': "L'équipe Prizm AI",
  'dYs?': '🚀'
};

// Articles à corriger
const ARTICLES_TO_FIX = [
  '2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux.md',
  '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-methode-en-.md',
  '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites.md',
  '2025-08-16-creer-du-contenu-marketing-avec-l-ia-workflow-complet-et-out.md',
  '2025-08-16-ia-generative-2025-les-outils-indispensables-pour-les-pme-fr.md',
  '2025-08-16-ia-generative-pour-pme-en.md',
  '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet.md',
  '2025-08-16-intelligence-artificielle-et-transformation-digita.md',
  '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d.md'
];

function fixEncoding(content) {
  let fixed = content;
  
  // Appliquer tous les remplacements
  Object.entries(REPLACEMENTS).forEach(([bad, good]) => {
    const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    fixed = fixed.replace(regex, good);
  });
  
  // Corrections spécifiques pour les patterns récurrents
  fixed = fixed
    .replace(/L['']Ã©quipe/g, "L'équipe")
    .replace(/L['']Acquipe/g, "L'équipe")
    .replace(/mÃ©/g, 'mé')
    .replace(/tÃ©/g, 'té')
    .replace(/rÃ©/g, 'ré')
    .replace(/dÃ©/g, 'dé')
    .replace(/gÃ©/g, 'gé')
    .replace(/nÃ©/g, 'né')
    .replace(/sÃ©/g, 'sé')
    .replace(/lÃ©/g, 'lé')
    .replace(/vÃ©/g, 'vé')
    .replace(/pÃ©/g, 'pé')
    .replace(/fÃ©/g, 'fé')
    .replace(/bÃ©/g, 'bé')
    .replace(/cÃ©/g, 'cé');
  
  return fixed;
}

function fixArticle(fileName) {
  const filePath = path.join(BLOG_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé : ${fileName}`);
    return false;
  }
  
  try {
    // Lire le contenu
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalLength = content.length;
    
    // Corriger l'encodage
    content = fixEncoding(content);
    
    // Compter les changements
    const changes = originalLength !== content.length;
    
    // Sauvegarder
    fs.writeFileSync(filePath, content, 'utf-8');
    
    console.log(`✅ ${fileName}`);
    console.log(`   ${changes ? '✓ Caractères corrigés' : '⚠️ Aucun changement détecté'}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur : ${error.message}`);
    return false;
  }
}

// Fonction principale
function main() {
  console.log('🔧 CORRECTION FINALE DE L\'ENCODAGE UTF-8');
  console.log('=' .repeat(60));
  
  let success = 0;
  let failed = 0;
  
  ARTICLES_TO_FIX.forEach(article => {
    if (fixArticle(article)) {
      success++;
    } else {
      failed++;
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RÉSULTAT');
  console.log('=' .repeat(60));
  console.log(`✅ Articles corrigés : ${success}`);
  if (failed > 0) {
    console.log(`❌ Échecs : ${failed}`);
  }
  
  console.log('\n🎯 Prochaine étape :');
  console.log('   cd ../..');
  console.log('   npm run dev');
  console.log('   # Le site devrait maintenant fonctionner !');
}

// Lancer le script
if (require.main === module) {
  main();
}