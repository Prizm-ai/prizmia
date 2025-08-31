// fix-frontmatter-encoding.cjs
// Corrige l'encodage cassé dans le frontmatter des articles
const fs = require('fs').promises;
const path = require('path');

async function fixFrontmatterEncoding() {
  const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
  
  console.log('\n🔧 CORRECTION DE L\'ENCODAGE DU FRONTMATTER');
  console.log('='.repeat(60) + '\n');
  
  // Articles à corriger (pas le manifeste qui fonctionne)
  const articlesToFix = [
    '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-methode-en-.md',
    '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites.md',
    '2025-08-16-l-ia-dans-la-comptabilite-automatisation-et-gains-de-product.md',
    '2025-08-16-reglementation-ia-europeenne-guide-de-conformite-pratique-po.md'
  ];
  
  let fixed = 0;
  
  for (const filename of articlesToFix) {
    const filepath = path.join(BLOG_DIR, filename);
    
    try {
      let content = await fs.readFile(filepath, 'utf8');
      const originalContent = content;
      
      // Corrections d'encodage spécifiques
      const replacements = {
        // Caractères français
        'Ã©': 'é',
        'Ã¨': 'è',
        'Ã ': 'à',
        'Ã¢': 'â',
        'Ãª': 'ê',
        'Ã´': 'ô',
        'Ã¹': 'ù',
        'Ã»': 'û',
        'Ã§': 'ç',
        'Ã®': 'î',
        'Ã¯': 'ï',
        'Ã‰': 'É',
        'Ãˆ': 'È',
        'Ã€': 'À',
        'Ã‡': 'Ç',
        // Problème spécifique avec "équipe"
        "L'Ã©quipe": "L'équipe",
        // Descriptions
        'basÃ©e': 'basée',
        'vÃ©rifiÃ©es': 'vérifiées',
        'franÃ§aises': 'françaises',
        'conformitÃ©': 'conformité',
        'europÃ©enne': 'européenne',
        'RÃ©glementation': 'Réglementation',
        'comptabilitÃ©': 'comptabilité',
        'mÃ©thode': 'méthode',
        'Ã©tapes': 'étapes',
        'productivitÃ©': 'productivité',
        'mesurÃ©s': 'mesurés',
        // Emojis mal encodés - on les remplace par des emojis simples
        '"âš–ï¸"': '"⚖️"',
        '"ðŸ"ˆ"': '"📈"',
        '"ðŸ'°"': '"💰"',
        '"ðŸ"‹"': '"📋"'
      };
      
      // Appliquer toutes les corrections
      for (const [bad, good] of Object.entries(replacements)) {
        content = content.replace(new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), good);
      }
      
      // Si des modifications ont été faites
      if (content !== originalContent) {
        await fs.writeFile(filepath, content, 'utf8');
        console.log(`✅ Corrigé : ${filename}`);
        
        // Afficher ce qui a été corrigé dans le frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const authorMatch = frontmatterMatch[1].match(/author: "(.+)"/);
          const emojiMatch = frontmatterMatch[1].match(/emoji: "(.+)"/);
          if (authorMatch) console.log(`   Author : ${authorMatch[1]}`);
          if (emojiMatch) console.log(`   Emoji : ${emojiMatch[1]}`);
        }
        fixed++;
      } else {
        console.log(`⏭️  Pas de changement : ${filename}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur avec ${filename}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Articles corrigés : ${fixed}/4`);
  
  if (fixed > 0) {
    console.log('\n✨ L\'encodage du frontmatter est corrigé !');
    console.log('\n🚀 ACTIONS :');
    console.log('1. Arrêter le serveur (Ctrl+C)');
    console.log('2. Relancer : npm run dev');
    console.log('3. Ouvrir : http://localhost:4321/blog');
    console.log('\n🎉 Les 5 articles devraient maintenant s\'afficher correctement !');
  }
}

// Lancer
fixFrontmatterEncoding().catch(console.error);