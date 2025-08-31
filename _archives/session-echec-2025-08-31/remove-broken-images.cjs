const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Retirer complètement heroImage pour que les articles fonctionnent
    content = content.replace(/\nheroImage: "[^"]*"\n/g, '\n');
    content = content.replace(/heroImage: "[^"]*"\n/g, '');
    
    fs.writeFileSync(filePath, content);
});

console.log('✅ HeroImages retirées - les articles devraient fonctionner');