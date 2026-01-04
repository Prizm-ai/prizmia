const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/.env') });

console.log('Clé chargée :', process.env.PERPLEXITY_API_KEY ? 'OUI' : 'NON');
console.log('Début de la clé :', process.env.PERPLEXITY_API_KEY?.substring(0, 10));