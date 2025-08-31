const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = true; // TOUJOURS commencer en dry-run
const articlesDir = 'src/content/blog';

console.log('=== NETTOYAGE DES ARTICLES DÉFECTUEUX ===\n');
console.log(`Mode: ${DRY_RUN ? 'DRY-RUN' : 'EXÉCUTION'}\n`);

// Patterns qui indiquent un article raté
const badPatterns = [
    /Je ne peux pas rédiger/i,
    /Je remarque une incohérence/i,
    /Fiabilité\s*:\s*\d+/i,  // Articles avec scores de fiabilité
    /Score de fiabilité/i,
];

// Également supprimer les fichiers avec scores dans le nom
const badFilePatterns = [
    /-0\.\d+\.md$/,  // Fichiers finissant par -0.XX.md
];

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
const toDelete = [];

files.forEach(file => {
    // Ne jamais toucher au manifeste
    if (file.includes('manifeste')) {
        console.log(`⏭️  ${file} - IGNORÉ (manifeste)`);
        return;
    }
    
    // Vérifier le nom du fichier
    let shouldDelete = false;
    for (const pattern of badFilePatterns) {
        if (pattern.test(file)) {
            console.log(`❌ ${file} - Score dans le nom`);
            shouldDelete = true;
            break;
        }
    }
    
    // Vérifier le contenu
    if (!shouldDelete) {
        const filePath = path.join(articlesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        for (const pattern of badPatterns) {
            if (pattern.test(content)) {
                console.log(`❌ ${file} - Contenu défectueux détecté`);
                shouldDelete = true;
                break;
            }
        }
    }
    
    if (shouldDelete) {
        toDelete.push(file);
    } else {
        console.log(`✅ ${file} - Article valide`);
    }
});

console.log(`\n=== RÉSUMÉ ===`);
console.log(`Articles analysés: ${files.length}`);
console.log(`Articles à supprimer: ${toDelete.length}`);

if (toDelete.length > 0) {
    console.log('\nArticles qui seront supprimés:');
    toDelete.forEach(f => console.log(`  - ${f}`));
    
    if (!DRY_RUN) {
        toDelete.forEach(file => {
            const filePath = path.join(articlesDir, file);
            fs.unlinkSync(filePath);
            console.log(`🗑️  ${file} supprimé`);
        });
        console.log('\n✅ Nettoyage terminé');
    } else {
        console.log('\n🔍 [DRY-RUN] Ces fichiers seraient supprimés');
    }
}

if (DRY_RUN) {
    console.log('\n⚠️ Mode DRY-RUN - Changez DRY_RUN = false pour supprimer');
}