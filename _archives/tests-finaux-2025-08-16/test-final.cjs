// test-final.js
const path = require('path');

console.log('🧪 Test final de la migration...\n');

// Charger les variables d'environnement
require('dotenv').config({ path: './config/.env' });

// Vérifier les clés API
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;

console.log('Variables d\'environnement:');
console.log(`  Anthropic: ${hasAnthropic ? '✓' : '❌'}`);
console.log(`  Perplexity: ${hasPerplexity ? '✓' : '❌'}`);

// Tester le chargement des agents
try {
  const pipeline = require('./pipeline-v4-fixed.js');
  console.log('\n✓ Pipeline chargé avec succès');
} catch (error) {
  console.log(`\n❌ Erreur pipeline: ${error.message}`);
}

console.log('\n✅ Pour lancer le pipeline:');
console.log('   node pipeline-v4-fixed.js');
