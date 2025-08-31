// clean-duplicate-frontmatter.cjs
const fs = require('fs');
const path = require('path');

const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';

console.log('🧹 NETTOYAGE DES FRONTMATTERS DUPLIQUÉS');
console.log('='.repeat(60));

// Lire tous les fichiers .md
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
console.log(`📂 ${files.length} articles trouvés\n`);

let cleanedCount = 0;
let skippedCount = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Compter les frontmatters (chercher les blocs ---...---)
  const frontmatterMatches = content.match(/^---\n[\s\S]*?\n---/gm);
  
  if (!frontmatterMatches) {
    console.log(`⏭️  ${file} - Pas de frontmatter`);
    skippedCount++;
    return;
  }
  
  if (frontmatterMatches.length === 1) {
    console.log(`✅ ${file} - Déjà OK (1 frontmatter)`);
    skippedCount++;
    return;
  }
  
  if (frontmatterMatches.length === 2) {
    console.log(`🔧 ${file} - Nettoyage nécessaire (2 frontmatters)`);
    
    // Créer une sauvegarde
    const backupPath = filePath + '.backup-' + Date.now();
    fs.copyFileSync(filePath, backupPath);
    console.log(`   💾 Sauvegarde: ${path.basename(backupPath)}`);
    
    // Garder seulement le premier frontmatter et le contenu après le deuxième
    const firstFrontmatter = frontmatterMatches[0];
    const contentAfterSecond = content.split(frontmatterMatches[1])[1];
    
    // Reconstruire le fichier avec un seul frontmatter
    const newContent = firstFrontmatter + '\n' + contentAfterSecond;
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`   ✅ Nettoyé\n`);
    cleanedCount++;
  }
});

console.log('='.repeat(60));
console.log(`📊 RÉSUMÉ :`);
console.log(`   ✅ Articles nettoyés : ${cleanedCount}`);
console.log(`   ⏭️  Articles déjà OK : ${skippedCount}`);
console.log(`\n🎉 Nettoyage terminé !`);
console.log(`\n🚀 Prochaine étape : npm run dev`);