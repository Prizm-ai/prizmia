const fs = require('fs');

// Tester sur UN seul article
const testFile = 'src/content/blog/2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux.md';
let content = fs.readFileSync(testFile, 'utf-8');

const parts = content.split('---');
if (parts.length >= 3) {
    let frontmatter = parts[1];
    
    // Ajouter heroImage avec le chemin de l'image du manifeste qui existe
    if (!frontmatter.includes('heroImage')) {
        frontmatter = frontmatter.trim() + '\nheroImage: "/images/blog/manifeste-prizm-ai.jpg"';
    } else {
        // Remplacer si déjà présent
        frontmatter = frontmatter.replace(/heroImage:.*$/m, 'heroImage: "/images/blog/manifeste-prizm-ai.jpg"');
    }
    
    content = `---${frontmatter}\n---` + parts.slice(2).join('---');
    fs.writeFileSync(testFile, content);
}

console.log('✅ heroImage ajouté à l\'article test');