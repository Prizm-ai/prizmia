const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = false; // TOUJOURS commencer en dry-run
const articlesDir = 'src/content/blog';

console.log('=== SUPPRESSION DES SCORES DE FIABILITÉ ===\n');
console.log(`Mode: ${DRY_RUN ? 'DRY-RUN' : 'EXÉCUTION'}\n`);

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
let totalCleaned = 0;

files.forEach(file => {
    if (file.includes('manifeste')) {
        console.log(`⏭️  ${file} - IGNORÉ (manifeste)`);
        return;
    }
    
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Patterns à supprimer
    const patterns = [
        /Fiabilité\s*:\s*\d+\/?\d*\s*/gi,  // "Fiabilité : 8" ou "Fiabilité : 8/10"
        /\(Fiabilité\s*:\s*\d+\/?\d*\)/gi,  // "(Fiabilité : 8)"
        /Score de fiabilité\s*:\s*\d+\/?\d*\s*/gi,  // "Score de fiabilité : 8"
    ];
    
    let cleanedCount = 0;
    patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            cleanedCount += matches.length;
            content = content.replace(pattern, '');
        }
    });
    
    // Nettoyer les espaces doubles qui pourraient rester
    content = content.replace(/  +/g, ' ');
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (cleanedCount > 0) {
        console.log(`✅ ${file}`);
        console.log(`   → ${cleanedCount} mention(s) de fiabilité supprimée(s)`);
        totalCleaned++;
        
        if (!DRY_RUN) {
            fs.writeFileSync(filePath, content, 'utf-8');
        }
    } else {
        console.log(`⏭️  ${file} - Aucun score trouvé`);
    }
});

console.log(`\n=== RÉSUMÉ ===`);
console.log(`Articles analysés: ${files.length}`);
console.log(`Articles à nettoyer: ${totalCleaned}`);

if (DRY_RUN) {
    console.log('\n⚠️ Mode DRY-RUN - Changez DRY_RUN = false pour nettoyer');
}