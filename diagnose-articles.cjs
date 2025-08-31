const fs = require('fs');
const path = require('path');

const articlesDir = 'src/content/blog';
console.log('=== DIAGNOSTIC DÉTAILLÉ DES ARTICLES ===\n');

const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md') && !f.includes('manifeste'))
    .slice(0, 2); // Analyser seulement 2 articles pour commencer

files.forEach(file => {
    console.log(`\n📄 ${file}`);
    console.log('='.repeat(50));
    
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Chercher les patterns suspects
    const patterns = [
        { name: 'Fiabilité avec score', regex: /Fiabilité\s*:\s*\d+/gi },
        { name: 'Score de fiabilité', regex: /Score de fiabilité/gi },
        { name: 'Je ne peux pas', regex: /Je ne peux pas rédiger/gi },
        { name: 'Incohérence', regex: /Je remarque une incohérence/gi },
        { name: 'Source:', regex: /Source\s*:/gi },
        { name: 'Fiabilité seul', regex: /fiabilité/gi }
    ];
    
    patterns.forEach(({ name, regex }) => {
        const matches = content.match(regex);
        if (matches) {
            console.log(`  ⚠️ Pattern trouvé: "${name}"`);
            console.log(`     Occurrences: ${matches.length}`);
            console.log(`     Exemples: ${matches.slice(0, 2).join(' | ')}`);
        }
    });
    
    // Montrer les 500 premiers caractères
    console.log('\n  📝 Début du contenu:');
    console.log('  ' + content.substring(0, 500).replace(/\n/g, '\n  '));
});