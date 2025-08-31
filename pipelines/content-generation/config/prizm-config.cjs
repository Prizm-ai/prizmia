// prizm-config.js - Configuration centralisée du système Prizm AI
const path = require('path');

// Configuration centrale pour TOUS les agents et pipelines
const PRIZM_CONFIG = {
  // Configuration générale
  system: {
    encoding: 'utf8',
    platform: process.platform,
    nodeVersion: process.version
  },
  
  // Base des chemins
  paths: {
    base: path.resolve(__dirname, '../output'),
    config: path.resolve(__dirname, '../config'),
    utils: path.resolve(__dirname, '../utils'),
    agents: path.resolve(__dirname, '../agents-actifs')
  },
  
  // Structure des dossiers pour le pipeline v4
  structure: {
    // Entrées
    veille: '01-veille',
    corpus: '02-corpus',
    
    // Processus
    factuels: '03-articles-factuels',        // Où l'agent rédacteur DOIT sauvegarder
    conversationnels: '04-articles-conversationnels', // Où l'agent style DOIT sauvegarder
    
    // Sorties
    finaux: '05-articles-finaux',            // Articles prêts à publier
    rapports: '06-rapports',                 // Rapports et diagnostics
    archives: '07-archives',                 // Archives par session
    
    // Dossiers legacy (à migrer progressivement)
    legacy: {
      brouillons: '02-brouillons',
      detection: '03-detection',
      corrections: '04-corrections',
      brouillonsFactuels: '02-brouillons-factuels',
      articlesFinauxV3: '05-articles-finaux'
    }
  },
  
  // Configuration des agents
  agents: {
    veille: {
      executable: 'agent-veille-v4.js',
      outputDir: function() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
        const day = String(date.getDate()).padStart(2, '0');
        
        return path.join(
          PRIZM_CONFIG.paths.base,
          PRIZM_CONFIG.structure.veille,
          `${year}`,
          `${month}-${monthName}`,
          `${year}-${month}-${day}`
        );
      },
      corpusDir: function() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(
          PRIZM_CONFIG.paths.base,
          PRIZM_CONFIG.structure.corpus,
          date
        );
      }
    },
    
    redacteurFactuel: {
      executable: 'agent-redacteur-factuel.js',
      // IMPORTANT : Utiliser le bon dossier pour la cohérence
      outputDir: function() {
        return path.join(
          PRIZM_CONFIG.paths.base,
          PRIZM_CONFIG.structure.factuels
        );
      },
      encoding: 'utf8',
      fileExtension: '-factuel.md'
    },
    
    styleConversationnel: {
      executable: 'agent-style-conversationnel.js',
      // IMPORTANT : Utiliser le bon dossier pour la cohérence
      outputDir: function() {
        return path.join(
          PRIZM_CONFIG.paths.base,
          PRIZM_CONFIG.structure.conversationnels
        );
      },
      encoding: 'utf8',
      fileExtension: '-conversationnel.md'
    }
  },
  
  // Configuration du pipeline
  pipeline: {
    version: 'v4',
    defaultOptions: {
      archiver: true,
      genererRapport: true,
      afficherStats: true
    },
    validation: {
      longueurMin: 1200,
      longueurMax: 1800,
      longueurCible: 1500
    }
  },
  
  // Configuration de l'encodage (CRITIQUE pour Windows)
  encoding: {
    // Forcer UTF-8 partout
    default: 'utf8',
    
    // Options pour fs.readFile/writeFile
    readOptions: { encoding: 'utf8' },
    writeOptions: { encoding: 'utf8' },
    
    // Configuration pour les processus enfants
    execOptions: {
      encoding: 'utf8',
      env: {
        ...process.env,
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8'
      }
    }
  },
  
  // Utilitaires
  utils: {
    // Obtenir le chemin complet d'un dossier de structure
    getPath: function(type) {
      const structure = PRIZM_CONFIG.structure;
      const folder = structure[type] || structure.legacy[type];
      
      if (!folder) {
        throw new Error(`Type de dossier inconnu : ${type}`);
      }
      
      return path.join(PRIZM_CONFIG.paths.base, folder);
    },
    
    // Créer tous les dossiers nécessaires
    ensureDirectories: async function() {
      const fs = require('fs').promises;
      const dirs = [];
      
      // Dossiers principaux
      for (const [key, folder] of Object.entries(PRIZM_CONFIG.structure)) {
        if (key !== 'legacy' && typeof folder === 'string') {
          dirs.push(path.join(PRIZM_CONFIG.paths.base, folder));
        }
      }
      
      // Créer tous les dossiers
      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }
      
      return dirs;
    },
    
    // Lire un fichier avec l'encodage correct
    readFile: async function(filepath) {
      const fs = require('fs').promises;
      return await fs.readFile(filepath, PRIZM_CONFIG.encoding.readOptions);
    },
    
    // Écrire un fichier avec l'encodage correct
    writeFile: async function(filepath, content) {
      const fs = require('fs').promises;
      return await fs.writeFile(filepath, content, PRIZM_CONFIG.encoding.writeOptions);
    },
    
    // Migrer les fichiers legacy
    migrateLegacy: async function() {
      const fs = require('fs').promises;
      const migrations = [
        {
          from: PRIZM_CONFIG.structure.legacy.brouillonsFactuels,
          to: PRIZM_CONFIG.structure.factuels
        },
        {
          from: PRIZM_CONFIG.structure.legacy.articlesFinauxV3,
          to: PRIZM_CONFIG.structure.conversationnels
        }
      ];
      
      for (const migration of migrations) {
        const fromPath = path.join(PRIZM_CONFIG.paths.base, migration.from);
        const toPath = path.join(PRIZM_CONFIG.paths.base, migration.to);
        
        try {
          const files = await fs.readdir(fromPath);
          console.log(`Migration : ${migration.from} → ${migration.to}`);
          
          for (const file of files) {
            if (file.endsWith('.md')) {
              const source = path.join(fromPath, file);
              const dest = path.join(toPath, file);
              
              // Lire avec le bon encodage
              const content = await PRIZM_CONFIG.utils.readFile(source);
              
              // Écrire avec le bon encodage
              await PRIZM_CONFIG.utils.writeFile(dest, content);
              
              console.log(`   ✅ ${file}`);
            }
          }
        } catch (error) {
          // Ignorer si le dossier n'existe pas
        }
      }
    }
  }
};

// Export pour utilisation dans tous les agents
module.exports = PRIZM_CONFIG;

// Si exécuté directement, afficher la configuration
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         CONFIGURATION PRIZM AI CENTRALISÉE             ║
╚════════════════════════════════════════════════════════╝

Cette configuration centralise TOUS les paramètres du système.

📁 STRUCTURE DES DOSSIERS :
`);
  
  console.log('Pipeline v4 :');
  for (const [key, value] of Object.entries(PRIZM_CONFIG.structure)) {
    if (key !== 'legacy' && typeof value === 'string') {
      console.log(`  ${key.padEnd(20)} : ${value}`);
    }
  }
  
  console.log('\n🤖 AGENTS :');
  for (const [agent, config] of Object.entries(PRIZM_CONFIG.agents)) {
    console.log(`  ${agent} :`);
    console.log(`    - Sauvegarde dans : ${typeof config.outputDir === 'function' ? config.outputDir() : config.outputDir}`);
  }
  
  console.log('\n⚙️  ENCODAGE :');
  console.log(`  Défaut : ${PRIZM_CONFIG.encoding.default}`);
  
  console.log('\n💡 UTILISATION :');
  console.log(`
Dans chaque agent, remplacer :

  const outputDir = '../prizm-output/02-articles-factuels';

Par :

  const PRIZM_CONFIG = require('../config/prizm-config');
  const outputDir = PRIZM_CONFIG.agents.redacteurFactuel.outputDir();

Cela garantit la cohérence entre TOUS les composants.
`);
}
