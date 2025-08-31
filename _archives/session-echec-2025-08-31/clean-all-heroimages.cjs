const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Retirer TOUTE ligne contenant heroImage
    content = content.replace(/^heroImage:.*$/gm, '');
    
    // Nettoyer les lignes vides multiples
    content = content.replace(/\n{3,}/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
});

console.log('✅ Toutes les références heroImage retirées');