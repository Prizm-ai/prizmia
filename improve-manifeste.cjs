const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = false; // TOUJOURS commencer en dry-run
const manifestePath = 'src/content/blog/2025-08-12-manifeste-prizm-ai.md';

console.log('=== AMÉLIORATION DU MANIFESTE ===\n');
console.log(`Mode: ${DRY_RUN ? 'DRY-RUN' : 'EXÉCUTION'}\n`);

// Nouvelle description valorisante
const nouvelleDescription = "Notre vision pour démocratiser l'IA : accompagner concrètement les PME françaises dans leur transformation digitale avec des solutions pragmatiques et accessibles.";

if (fs.existsSync(manifestePath)) {
    let content = fs.readFileSync(manifestePath, 'utf-8');
    
    // Extraire la description actuelle
    const currentDescMatch = content.match(/description:\s*"([^"]+)"/);
    if (currentDescMatch) {
        console.log('Description actuelle:');
        console.log(`  "${currentDescMatch[1]}"\n`);
        console.log('Nouvelle description:');
        console.log(`  "${nouvelleDescription}"\n`);
        
        if (!DRY_RUN) {
            content = content.replace(
                /description:\s*"[^"]+"/,
                `description: "${nouvelleDescription}"`
            );
            fs.writeFileSync(manifestePath, content, 'utf-8');
            console.log('✅ Manifeste mis à jour avec succès');
        } else {
            console.log('🔍 [DRY-RUN] Le manifeste serait modifié');
        }
    }
} else {
    console.log('❌ Fichier manifeste non trouvé');
}

if (DRY_RUN) {
    console.log('\n⚠️ Mode DRY-RUN - Changez DRY_RUN = false pour appliquer');
}