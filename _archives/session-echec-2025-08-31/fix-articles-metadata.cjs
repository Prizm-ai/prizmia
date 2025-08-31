const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('🔧 Correction des métadonnées des articles...\n');

// Lire tous les articles (sauf le manifeste)
const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md') && !f.includes('manifeste'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Séparer frontmatter et body
    const parts = content.split('---');
    if (parts.length < 3) return;
    
    const frontmatter = parts[1];
    const body = parts.slice(2).join('---');
    
    // Extraire une description unique du début de l'article
    const cleanBody = body.replace(/^#+\s+.*\n/gm, ''); // Retirer les titres
    const firstSentence = cleanBody.match(/[^.!?]+[.!?]/)?.[0] || '';
    const uniqueDescription = firstSentence.trim().substring(0, 155);
    
    // Remplacer la description générique
    let newFrontmatter = frontmatter.replace(
        /description: "Guide pratique pour les PME[^"]*"/,
        `description: "${uniqueDescription}"`
    );
    
    // Retirer TOUTE mention de fiabilité dans les sources
    let newBody = body
        .replace(/\nFiabilité\s*:\s*\d+\/10/g, '')
        .replace(/^\s*Fiabilité\s*:\s*\d+\/10\s*$/gm, '')
        .replace(/\s*-\s*Fiabilité\s*:\s*\d+\/10/g, '');
    
    // Reconstruire et sauvegarder
    const newContent = `---${newFrontmatter}---${newBody}`;
    fs.writeFileSync(filePath, newContent);
    
    console.log(`✅ ${file}`);
    console.log(`   Description: "${uniqueDescription.substring(0, 60)}..."`);
});

console.log('\n✨ Terminé!');