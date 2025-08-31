/**
 * Script de correction des dates dans les articles pour compatibilité Astro
 * Corrige le format pubDate qui doit être YYYY-MM-DD sans guillemets
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', '..', 'src', 'content', 'blog');

// Articles à corriger
const ARTICLES_TO_FIX = [
  '2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux.md',
  '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-methode-en-.md',
  '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites.md',
  '2025-08-16-creer-du-contenu-marketing-avec-l-ia-workflow-complet-et-out.md',
  '2025-08-16-ia-generative-2025-les-outils-indispensables-pour-les-pme-fr.md',
  '2025-08-16-ia-generative-pour-pme-en.md',
  '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet-.md',
  '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet.md',
  '2025-08-16-intelligence-artificielle-et-transformation-digita.md',
  '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d.md'
];

function fixArticle(fileName) {
  const filePath = path.join(BLOG_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Fichier non trouvé : ${fileName}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Corriger le format de la date (enlever les guillemets si présents)
    content = content.replace(/pubDate:\s*["']?(\d{4}-\d{2}-\d{2})["']?/g, 'pubDate: $1');
    
    // S'assurer que title et description ont des guillemets
    content = content.replace(/^title:\s*(.+)$/m, (match, p1) => {
      // Si pas de guillemets, les ajouter
      if (!p1.startsWith('"') && !p1.startsWith("'")) {
        return `title: "${p1.trim()}"`;
      }
      return match;
    });
    
    content = content.replace(/^description:\s*(.+)$/m, (match, p1) => {
      // Si pas de guillemets, les ajouter
      if (!p1.startsWith('"') && !p1.startsWith("'")) {
        return `description: "${p1.trim()}"`;
      }
      return match;
    });
    
    // S'assurer que les champs obligatoires sont présents
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      let frontmatter = frontmatterMatch[1];
      
      // Vérifier que les champs obligatoires existent
      if (!frontmatter.includes('title:')) {
        console.log(`⚠️ Titre manquant dans ${fileName}`);
      }
      if (!frontmatter.includes('description:')) {
        console.log(`⚠️ Description manquante dans ${fileName}`);
      }
      if (!frontmatter.includes('pubDate:')) {
        // Ajouter la date d'aujourd'hui si manquante
        frontmatter += '\npubDate: 2025-08-16';
        content = content.replace(frontmatterMatch[0], `---\n${frontmatter}\n---`);
      }
    }
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Corrigé : ${fileName}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur avec ${fileName} : ${error.message}`);
    return false;
  }
}

console.log('🔧 CORRECTION DES FORMATS DE DATE POUR ASTRO');
console.log('=' .repeat(50));

let success = 0;
let failed = 0;

ARTICLES_TO_FIX.forEach(article => {
  if (fixArticle(article)) {
    success++;
  } else {
    failed++;
  }
});

console.log('\n' + '=' .repeat(50));
console.log(`✅ Articles corrigés : ${success}`);
if (failed > 0) {
  console.log(`❌ Échecs : ${failed}`);
}
console.log('\n✨ Relancez maintenant : npm run dev');