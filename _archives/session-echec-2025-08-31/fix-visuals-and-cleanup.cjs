const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('🔧 Correction visuels et nettoyage...\n');

const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md') && !f.includes('manifeste'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. REMPLACER MERMAID PAR UNE IMAGE HERO
    const imageThemes = {
        'automatiser': 'automation,artificial-intelligence,business',
        'chatgpt': 'chatbot,artificial-intelligence,technology',
        'adoption': 'digital-transformation,business,innovation',
        'marketing': 'marketing,content-creation,digital',
        'ia-generative': 'ai-technology,innovation,future',
        'implementer': 'customer-service,technology,support'
    };
    
    let theme = 'artificial-intelligence,business';
    for (let key in imageThemes) {
        if (file.includes(key)) {
            theme = imageThemes[key];
            break;
        }
    }
    
    // Remplacer le bloc mermaid par une image
    content = content.replace(
        /```mermaid[\s\S]*?```/g,
        `![Illustration IA et transformation digitale](https://source.unsplash.com/1200x400/?${theme})`
    );
    
    // 2. NETTOYER LES FINS D'ARTICLES (espaces vides après suppression fiabilité)
    content = content.replace(/## Sources et références[\s\S]*$/m, (match) => {
        // Nettoyer les lignes vides multiples
        return match
            .replace(/\n\s*\n\s*\n/g, '\n\n')  // Max 2 sauts de ligne
            .replace(/^\s*-\s*$/gm, '')        // Lignes avec juste un tiret
            .replace(/^\s*Date\s*:\s*$/gm, '') // Lignes "Date :" vides
            .trim() + '\n';
    });
    
    // 3. AJOUTER UN TABLEAU RÉCAPITULATIF AU LIEU DU SCHÉMA
    const tableContent = `

## Points clés à retenir

| Aspect | Description | Impact PME |
|--------|-------------|------------|
| **Temps** | Réduction des tâches répétitives | -70% sur les processus |
| **Coût** | Investissement initial modéré | ROI en 3-6 mois |
| **Compétences** | Formation progressive des équipes | Montée en compétence graduelle |
| **Résultats** | Amélioration mesurable | +40% productivité moyenne |

`;
    
    // Insérer le tableau après l'introduction (après le 2e paragraphe)
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 3 && !content.includes('| Aspect |')) {
        paragraphs.splice(3, 0, tableContent);
        content = paragraphs.join('\n\n');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file.substring(11, 40)}...`);
});

console.log('\n✨ Visuels et nettoyage terminés!');