const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('🖼️ Ajout d\'images spécifiques...\n');

// Images libres de droits depuis Pexels (direct links)
const articleImages = {
    'adoption-de-l-ia': 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    'automatiser-sa-prospection': 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    'chatgpt-pour-les-avocats': 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    'creer-du-contenu-marketing': 'https://images.pexels.com/photos/4549414/pexels-photo-4549414.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    'ia-generative-2025': 'https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    'implementer-chatgpt': 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    'manifeste-prizm-ai': 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'
};

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Trouver l'image correspondante
    let imageUrl = null;
    for (let key in articleImages) {
        if (file.includes(key)) {
            imageUrl = articleImages[key];
            break;
        }
    }
    
    if (!imageUrl) return;
    
    // Modifier le frontmatter
    const parts = content.split('---');
    if (parts.length >= 3) {
        let frontmatter = parts[1];
        
        // Remplacer ou ajouter heroImage
        if (frontmatter.includes('heroImage:')) {
            frontmatter = frontmatter.replace(
                /heroImage:.*$/m,
                `heroImage: "${imageUrl}"`
            );
        } else {
            frontmatter = frontmatter.trim() + `\nheroImage: "${imageUrl}"`;
        }
        
        content = `---${frontmatter}\n---` + parts.slice(2).join('---');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file.substring(11, 50)}...`);
});

console.log('\n✨ Images spécifiques ajoutées!');