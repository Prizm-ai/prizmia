const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('🔧 Corrections finales...\n');

// 1. CORRIGER LES DESCRIPTIONS COUPÉES
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const parts = content.split('---');
    if (parts.length < 3) return;
    
    let frontmatter = parts[1];
    const body = parts.slice(2).join('---');
    
    // Extraire la description actuelle
    const descMatch = frontmatter.match(/description:\s*"([^"]*)"/);
    if (descMatch) {
        let desc = descMatch[1];
        
        // Corriger les coupures de mots
        if (desc.length > 150) {
            const lastSpace = desc.lastIndexOf(' ', 150);
            desc = desc.substring(0, lastSpace) + '...';
        }
        
        frontmatter = frontmatter.replace(descMatch[0], `description: "${desc}"`);
    }
    
    // 2. DESCRIPTION SPÉCIALE POUR LE MANIFESTE
    if (file.includes('manifeste')) {
        frontmatter = frontmatter.replace(
            /description:\s*"[^"]*"/,
            `description: "Notre vision pour démocratiser l'IA : accompagner concrètement les PME françaises dans leur transformation digitale avec des solutions pragmatiques et accessibles"`
        );
        console.log('✨ Manifeste : description valorisante ajoutée');
    }
    
    // 3. CORRIGER LES ARTICLES RATÉS
    if (body.includes('Je ne peux pas rédiger') || body.includes('Je remarque une incohérence')) {
        console.log(`⚠️  ${file} - Article défectueux détecté`);
        // Marquer comme brouillon
        frontmatter = frontmatter.replace(/pubDate:/, 'draft: true\npubDate:');
    }
    
    const newContent = `---${frontmatter}---${body}`;
    fs.writeFileSync(filePath, newContent);
});

// 4. SUPPRIMER L'ARTICLE COMPLÈTEMENT RATÉ
const articlesToDelete = [
    '2025-08-16-intelligence-artificielle-et-transformation-digita.md',
    '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d.md'
];

articlesToDelete.forEach(file => {
    const filePath = path.join(articlesDir, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  ${file} - Supprimé (contenu défectueux)`);
    }
});

console.log('\n✅ Corrections terminées!');