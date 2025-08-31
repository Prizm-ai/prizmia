const fs = require('fs');

const blogPath = 'src/pages/blog/index.astro';
let content = fs.readFileSync(blogPath, 'utf-8');

// Retirer le code d'image ajouté qui pourrait causer des problèmes
content = content.replace(
    /{post\.data\.heroImage && \([\s\S]*?\)\s*}/g, 
    ''
);

// Retirer les divs vides qui pourraient rester
content = content.replace(
    /<div class="article-image-container">[\s\S]*?<\/div>\s*/g,
    ''
);

fs.writeFileSync(blogPath, content);
console.log('✅ Page blog restaurée');