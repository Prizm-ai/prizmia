const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('🎨 Ajout de visuels aux articles...\n');

const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md') && !f.includes('manifeste'));

files.forEach(file => {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Ne pas ajouter si déjà des images/schémas
    if (content.includes('```mermaid') || content.includes('![')) {
        console.log(`⏭️  ${file} - Déjà illustré`);
        return;
    }
    
    // Déterminer le thème pour le schéma approprié
    let schema = '';
    if (file.includes('automatiser') || file.includes('automatisation')) {
        schema = `
\`\`\`mermaid
graph LR
    A[Processus Manuel] --> B[Analyse IA]
    B --> C[Automatisation]
    C --> D[Gain 70% temps]
    style B fill:#667eea,color:#fff
    style C fill:#764ba2,color:#fff
\`\`\``;
    } else if (file.includes('chatgpt') || file.includes('ia-generative')) {
        schema = `
\`\`\`mermaid
flowchart TD
    A[Prompt] --> B{IA Générative}
    B --> C[Contenu]
    B --> D[Code]
    B --> E[Analyse]
    style B fill:#667eea,color:#fff
\`\`\``;
    } else if (file.includes('adoption') || file.includes('transformation')) {
        schema = `
\`\`\`mermaid
journey
    title Adoption IA en PME
    section Phase 1
      Audit besoins: 5
      Formation: 4
    section Phase 2
      Projet pilote: 5
      Mesure ROI: 5
    section Phase 3
      Déploiement: 5
\`\`\``;
    } else {
        schema = `
\`\`\`mermaid
pie title "Impact IA sur les PME"
    "Productivité" : 35
    "Réduction coûts" : 25
    "Innovation" : 20
    "Satisfaction client" : 20
\`\`\``;
    }
    
    // Insérer après le premier paragraphe
    const lines = content.split('\n');
    let inserted = false;
    for (let i = 0; i < lines.length; i++) {
        if (!inserted && lines[i] === '' && i > 10) {
            lines.splice(i, 0, schema);
            inserted = true;
            break;
        }
    }
    
    if (inserted) {
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`✅ ${file} - Schéma ajouté`);
    }
});

console.log('\n✨ Terminé!');