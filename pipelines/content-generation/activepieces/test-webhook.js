/**
 * Script de test pour le serveur webhook
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function testEndpoint(name, endpoint, data = null) {
  try {
    log.info(`Test de ${name}...`);
    
    const config = {
      method: data ? 'POST' : 'GET',
      url: `${BASE_URL}${endpoint}`,
      ...(data && { data })
    };
    
    const response = await axios(config);
    
    if (response.data.success !== false) {
      log.success(`${name} - Status: ${response.status}`);
      console.log('  Réponse:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...\n');
      return true;
    } else {
      log.error(`${name} - Erreur dans la réponse`);
      return false;
    }
  } catch (error) {
    log.error(`${name} - Erreur: ${error.message}`);
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Données:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     TESTS DU SERVEUR WEBHOOK PRIZM AI      ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Test 1: Santé
  await testEndpoint('Santé du serveur', '/health');

  // Test 2: Génération de veille
  log.warn('Test de génération de veille (peut prendre 30-60 secondes)...');
  const veilleResult = await testEndpoint('Génération veille', '/api/veille', {});

  // Test 3: Sélection de sujet (avec données simulées)
  await testEndpoint('Sélection sujet', '/api/select-subject', {
    veilleFile: 'C:\\Users\\Samuel\\Documents\\prizmia\\pipelines\\content-generation\\output\\01-veille\\2025\\10-octobre\\veille-2025-10-25.json'
  });

  // Test 4: Génération de corpus
  await testEndpoint('Génération corpus', '/api/corpus', {
    subject: {
      title: "Test : L'IA dans les PME françaises",
      description: "Article test sur l'adoption de l'IA",
      category: "transformation-digitale"
    }
  });

  // Résumé
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║              RÉSUMÉ DES TESTS               ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  log.info('Tests terminés !');
  log.warn('Note: Certains tests peuvent échouer si les agents ne sont pas configurés');
  log.info('Pour un test complet, utilisez le pipeline via Activepieces');
}

// Auto-exécution
if (require.main === module) {
  // Vérifier que le serveur est lancé
  axios.get(`${BASE_URL}/health`)
    .then(() => {
      log.success('Serveur webhook accessible');
      runTests();
    })
    .catch(() => {
      log.error('Le serveur webhook n\'est pas accessible');
      log.info('Lancez d\'abord: node webhook-server.js');
      process.exit(1);
    });
}

module.exports = { testEndpoint };
