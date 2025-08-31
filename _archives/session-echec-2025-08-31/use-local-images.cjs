const fs = require('fs');
const path = require('path');

// Modifier les articles pour utiliser une image locale par défaut
const articlesDir = 'src/content/blog';
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md') && !f.includes('manifeste'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const parts = content.split('---');
    if (parts.length >= 3) {
        let frontmatter = parts[1];
        
        // Remplacer l'URL Pexels par une image locale
        frontmatter = frontmatter.replace(
            /heroImage: "https:\/\/images\.pexels\.com[^"]*"/g,
            'heroImage: "/images/blog/default-hero.jpg"'
        );
        
        content = `---${frontmatter}---` + parts.slice(2).join('---');
        fs.writeFileSync(filePath, content);
    }
});

console.log('✅ Images converties en local');