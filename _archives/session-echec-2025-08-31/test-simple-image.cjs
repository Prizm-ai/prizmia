const fs = require('fs');

// Ajouter UNE image à UN article pour tester
const testFile = 'src/content/blog/2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux.md';
let content = fs.readFileSync(testFile, 'utf-8');

const parts = content.split('---');
if (parts.length >= 3) {
    let frontmatter = parts[1];
    
    // Ajouter l'image du manifeste qui EXISTE
    if (!frontmatter.includes('heroImage')) {
        frontmatter = frontmatter.trim() + '\nheroImage: "/images/blog/manifeste-prizm-ai.jpg"';
    }
    
    content = `---${frontmatter}\n---` + parts.slice(2).join('---');
    fs.writeFileSync(testFile, content);
}

console.log('✅ Image ajoutée à UN article de test');