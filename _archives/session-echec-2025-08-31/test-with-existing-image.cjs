const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md') && !f.includes('manifeste'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const parts = content.split('---');
    if (parts.length >= 3) {
        let frontmatter = parts[1];
        
        // Utiliser l'image du manifeste qui existe déjà
        frontmatter = frontmatter.replace(
            /heroImage: "[^"]*"/g,
            'heroImage: "/images/blog/manifeste-prizm-ai.jpg"'
        );
        
        content = `---${frontmatter}---` + parts.slice(2).join('---');
        fs.writeFileSync(filePath, content);
    }
});

console.log('✅ Images remplacées par une image locale existante');