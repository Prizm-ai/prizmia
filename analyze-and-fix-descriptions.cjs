const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = false; // Passer à false pour exécuter réellement
const articlesDir = 'src/content/blog';

console.log('=== ANALYSE ET CORRECTION DES DESCRIPTIONS ===\n');
console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (simulation)' : 'EXECUTION RÉELLE'}\n`);

// Nouvelles descriptions uniques basées sur le contenu réel des articles
const newDescriptions = {
    'adoption-de-l-ia-dans-les-pme-francaises': 
        "État des lieux 2025 de l'adoption de l'IA dans les PME françaises : chiffres clés, freins principaux et opportunités de croissance.",
    
    'automatiser-sa-prospection-commerciale': 
        "Méthode complète pour automatiser votre prospection commerciale avec l'IA : outils, techniques et retours d'expérience concrets.",
    
    'chatgpt-pour-les-avocats': 
        "Cas d'usage pratiques et limites éthiques de ChatGPT pour les professionnels du droit : rédaction, recherche juridique et confidentialité.",
    
    'creer-du-contenu-marketing': 
        "Workflow complet et outils IA pour créer du contenu marketing efficace : de l'idéation à la publication, avec exemples concrets.",
    
    'ia-generative-2025': 
        "Sélection 2025 des outils d'IA générative indispensables pour les PME : ChatGPT, Claude, Midjourney et alternatives françaises.",
    
    'implementer-chatgpt-dans-votre-service-client': 
        "Guide pratique pour intégrer ChatGPT dans votre service client : configuration, formation des équipes et mesure du ROI.",
    
    'intelligence-artificielle-et-transformation-digita': 
        "Comment l'IA accélère la transformation digitale des PME : stratégies, exemples sectoriels et feuille de route sur 12 mois.",
    
    'l-ia-dans-la-comptabilit': 
        "Automatisation comptable par l'IA : gains de productivité mesurés, outils spécialisés et retours d'expérience de cabinets."
};

// Lire et traiter chaque fichier
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    if (file.includes('manifeste')) {
        console.log(`⏭️  ${file} - IGNORÉ (manifeste)`);
        return;
    }
    
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Extraire la description actuelle
    const currentDescMatch = content.match(/description:\s*"([^"]+)"/);
    if (!currentDescMatch) {
        console.log(`⚠️  ${file} - Pas de description trouvée`);
        return;
    }
    
    const currentDesc = currentDescMatch[1];
    
    // Trouver la nouvelle description
    let newDesc = null;
    for (const [key, desc] of Object.entries(newDescriptions)) {
        if (file.includes(key)) {
            newDesc = desc;
            break;
        }
    }
    
    if (!newDesc) {
        console.log(`❌ ${file} - Pas de nouvelle description`);
        return;
    }
    
    console.log(`\n📄 ${file}`);
    console.log(`   AVANT: "${currentDesc.substring(0, 60)}..."`);
    console.log(`   APRÈS: "${newDesc.substring(0, 60)}..."`);
    
    if (!DRY_RUN) {
        // Remplacer la description
        content = content.replace(
            /description:\s*"[^"]+"/,
            `description: "${newDesc}"`
        );
        
        // Sauvegarder
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`   ✅ Modifié`);
    } else {
        console.log(`   🔍 [DRY-RUN] Serait modifié`);
    }
});

console.log('\n=== RÉSUMÉ ===');
console.log(`${files.length} fichiers analysés`);
if (DRY_RUN) {
    console.log('\n⚠️  Mode DRY-RUN - Aucune modification effectuée');
    console.log('Pour appliquer les changements, modifiez DRY_RUN = false');
}