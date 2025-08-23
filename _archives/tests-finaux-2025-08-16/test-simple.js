const fs = require('fs');
const content = fs.readFileSync('test-encoding.txt', 'utf8');
fs.writeFileSync('output-test.txt', content, 'utf8');
console.log("Fichier créé. Vérifiez output-test.txt");