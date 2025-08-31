// structure-guardian.cjs
// GARDIEN DE LA STRUCTURE - Empêche la création de dossiers parasites

const fs = require('fs');
const path = require('path');

// La SEULE structure autorisée
const STRUCTURE_AUTORISEE = {
  '01-veille': true,
  '02-corpus': true,
  '03-articles-factuels': true,
  '04-articles-conversationnels': true,
  '05-articles-finaux': true,
  '06-rapports': true,
  '07-archives': true,
  'README-STRUCTURE.md': true // Fichier autorisé
};

// Vérifier périodiquement
function verifierStructure() {
  const outputDir = './output';
  
  try {
    const items = fs.readdirSync(outputDir);
    
    for (const item of items) {
      if (!STRUCTURE_AUTORISEE[item]) {
        console.log(`⚠️  ALERTE : Dossier/fichier non autorisé détecté : ${item}`);
        
        const chemin = path.join(outputDir, item);
        const stats = fs.statSync(chemin);
        
        if (stats.isDirectory()) {
          console.log(`   → Suppression du dossier interdit`);
          fs.rmSync(chemin, { recursive: true });
        }
      }
    }
  } catch (error) {
    // Ignorer les erreurs
  }
}

// Exporter pour utilisation dans d'autres scripts
module.exports = { verifierStructure, STRUCTURE_AUTORISEE };

// Si exécuté directement
if (require.main === module) {
  console.log('🛡️  Gardien de structure activé');
  verifierStructure();
  console.log('✅ Structure vérifiée et nettoyée');
}