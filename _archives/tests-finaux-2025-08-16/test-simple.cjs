const fs = require('fs');

console.log("=== Test de lecture/écriture UTF-8 ===");

// Lire le fichier test
const content = fs.readFileSync('test-encoding.txt', 'utf8');
console.log("Lu avec UTF-8:", content.substring(0, 50));

// Écrire dans un nouveau fichier
fs.writeFileSync('output-test.txt', content, 'utf8');
console.log("\nFichier output-test.txt créé");

// Relire pour vérifier
const verification = fs.readFileSync('output-test.txt', 'utf8');
console.log("Vérification:", verification.substring(0, 50));