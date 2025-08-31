const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('🔧 Correction V2 des descriptions...\n');

const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md') && !f.includes('manifeste'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const parts = content.split('---');
    if (parts.length < 3) return;
    
    const frontmatter = parts[1];
    const body = parts.slice(2).join('---');
    
    // Nettoyer le body : retirer titres et espaces
    const cleanBody = body
        .replace(/^#{1,6}\s+.*$/gm, '') // Retirer tous les titres
        .replace(/^\s*[\r\n]/gm, '') // Retirer lignes vides
        .trim();
    
    // Prendre la première vraie phrase
    const firstSentence = cleanBody.match(/^[^.!?]+[.!?]/)?.[0] || 
                         cleanBody.substring(0, 150);
    const uniqueDescription = firstSentence.trim().substring(0, 155);
    
    // Mise à jour du frontmatter
    let newFrontmatter = frontmatter.replace(
        /description:\s*"[^"]*"/,
        `description: "${uniqueDescription}"`
    );
    
    // Reconstruire
    const newContent = `---${newFrontmatter}---${body}`;
    fs.writeFileSync(filePath, newContent);
    
    console.log(`✅ ${file.substring(11, 40)}...`);
    console.log(`   → "${uniqueDescription.substring(0, 70)}..."`);
});

console.log('\n✨ Descriptions corrigées!');