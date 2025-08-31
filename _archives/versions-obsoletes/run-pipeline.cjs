// run-pipeline.cjs
// Script de lancement unifié qui garantit le bon fonctionnement

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: './config/.env' });

console.log(`
╔═══════════════════════════════════════════════════════╗
║         PIPELINE PRIZM AI - VERSION MIGRÉE           ║
║              Prêt pour la production !                ║
╚═══════════════════════════════════════════════════════╝
`);

// Vérifier les clés API
if (!process.env.ANTHROPIC_API_KEY || !process.env.PERPLEXITY_API_KEY) {
  console.error('❌ Clés API manquantes dans config/.env');
  process.exit(1);
}

console.log('✅ Clés API chargées\n');

// Créer tous les dossiers nécessaires
const dirs = [
  './output/01-veille',
  './output/02-articles-factuels',
  './output/03-articles-conversationnels',
  './output/04-articles-finaux',
  './output/corpus-verifie'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('✅ Structure de dossiers vérifiée\n');

// Lancer le pipeline
console.log('🚀 Lancement du pipeline...\n');

exec('node pipeline-v4-fixed.cjs', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }
  if (stderr) {
    console.error('⚠️ Avertissements:', stderr);
  }
  console.log(stdout);
});
