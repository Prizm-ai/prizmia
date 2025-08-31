/**
 * BATCH 10 ARTICLES FACTUELS - CORPUS DU 16 AOÛT 2025
 * 
 * Script pour générer automatiquement des articles factuels
 * sur tous les corpus existants du 16 août
 * 
 * Date : 16 août 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  CORPUS_DIR: './output/02-corpus/2025-08-16',  // Corpus du 16 août
  ARTICLES_DIR: './output/03-articles-factuels',
  AGENT_PATH: './agents/agent-redacteur-factuel.cjs',
  PAUSE_ENTRE_ARTICLES: 5000,  // 5 secondes entre chaque article
  MAX_ARTICLES: 10  // Limite à 10 articles
};

/**
 * Classe principale pour le batch
 */
class BatchArticlesFactuels {
  constructor() {
    this.corpus = [];
    this.resultats = {
      reussis: [],
      echecs: [],
      total: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Lister tous les corpus disponibles
   */
  async listerCorpus() {
    console.log('\n📚 RECHERCHE DES CORPUS DU 16 AOÛT 2025...');
    console.log('=' .repeat(60));
    
    try {
      // Vérifier que le dossier existe
      await fs.access(CONFIG.CORPUS_DIR);
      
      // Lister les corpus
      const items = await fs.readdir(CONFIG.CORPUS_DIR);
      
      // Filtrer les dossiers uniquement
      for (const item of items) {
        const itemPath = path.join(CONFIG.CORPUS_DIR, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Vérifier qu'il y a un metadata.json
          try {
            const metadataPath = path.join(itemPath, 'metadata.json');
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            this.corpus.push({
              nom: item,
              chemin: itemPath,
              titre: metadata.titre || item,
              date: metadata.date || '2025-08-16'
            });
          } catch (e) {
            console.log(`   ⚠️ Corpus invalide ignoré : ${item}`);
          }
        }
      }
      
      console.log(`\n✅ ${this.corpus.length} corpus trouvés`);
      
      // Afficher la liste
      this.corpus.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.titre}`);
      });
      
      return this.corpus.length > 0;
      
    } catch (error) {
      console.error('❌ Erreur accès dossier corpus:', error.message);
      return false;
    }
  }

  /**
   * Vérifier si un article existe déjà
   */
  async articleExiste(corpus) {
    try {
      const nomArticle = `2025-08-16-${corpus.nom.substring(2).substring(0, 60)}-factuel.md`;
      const cheminArticle = path.join(CONFIG.ARTICLES_DIR, nomArticle);
      await fs.access(cheminArticle);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Générer un article
   */
  async genererArticle(corpus, index) {
    const numero = `[${index}/${this.corpus.length}]`;
    console.log(`\n${numero} 📝 GÉNÉRATION : ${corpus.titre}`);
    console.log('   ⏳ Traitement en cours...');
    
    const startTime = Date.now();
    
    try {
      // Vérifier si l'article existe déjà
      if (await this.articleExiste(corpus)) {
        console.log('   ⚠️ Article déjà existant - ignoré');
        return {
          statut: 'existe',
          corpus: corpus.titre,
          duree: 0
        };
      }
      
      // Lancer l'agent rédacteur
      const command = `node "${CONFIG.AGENT_PATH}" "${corpus.chemin}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10  // 10MB buffer
      });
      
      // Analyser le résultat
      const lines = stdout.split('\n');
      const statsLine = lines.find(l => l.includes('Longueur totale'));
      const savedLine = lines.find(l => l.includes('Article sauvegardé'));
      
      if (savedLine) {
        const wordCount = statsLine ? statsLine.match(/\d+/)[0] : '?';
        const duree = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`   ✅ Succès ! ${wordCount} mots en ${duree}s`);
        
        this.resultats.reussis.push({
          titre: corpus.titre,
          mots: parseInt(wordCount) || 0,
          duree
        });
        
        return {
          statut: 'succes',
          corpus: corpus.titre,
          mots: wordCount,
          duree
        };
      } else {
        throw new Error('Article non sauvegardé');
      }
      
    } catch (error) {
      const duree = Math.round((Date.now() - startTime) / 1000);
      console.log(`   ❌ Échec : ${error.message}`);
      
      this.resultats.echecs.push({
        titre: corpus.titre,
        erreur: error.message,
        duree
      });
      
      return {
        statut: 'echec',
        corpus: corpus.titre,
        erreur: error.message,
        duree
      };
    }
  }

  /**
   * Attendre entre les articles
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Générer le rapport final
   */
  async genererRapport() {
    const dureeTotal = Math.round((Date.now() - this.startTime) / 1000);
    const motsTotaux = this.resultats.reussis.reduce((sum, r) => sum + (r.mots || 0), 0);
    
    let rapport = '\n' + '=' .repeat(60) + '\n';
    rapport += '📊 RAPPORT DE GÉNÉRATION\n';
    rapport += '=' .repeat(60) + '\n\n';
    
    rapport += `📅 Date : ${new Date().toLocaleString('fr-FR')}\n`;
    rapport += `⏱️ Durée totale : ${Math.floor(dureeTotal / 60)}m ${dureeTotal % 60}s\n`;
    rapport += `📄 Articles générés : ${this.resultats.reussis.length}/${this.corpus.length}\n`;
    rapport += `📝 Mots totaux : ${motsTotaux}\n`;
    rapport += `📈 Moyenne : ${Math.round(motsTotaux / this.resultats.reussis.length) || 0} mots/article\n\n`;
    
    if (this.resultats.reussis.length > 0) {
      rapport += '✅ ARTICLES GÉNÉRÉS AVEC SUCCÈS\n';
      rapport += '-'.repeat(40) + '\n';
      this.resultats.reussis.forEach(r => {
        rapport += `• ${r.titre}\n`;
        rapport += `  └─ ${r.mots} mots | ${r.duree}s\n`;
      });
      rapport += '\n';
    }
    
    if (this.resultats.echecs.length > 0) {
      rapport += '❌ ÉCHECS\n';
      rapport += '-'.repeat(40) + '\n';
      this.resultats.echecs.forEach(e => {
        rapport += `• ${e.titre}\n`;
        rapport += `  └─ Erreur : ${e.erreur}\n`;
      });
      rapport += '\n';
    }
    
    // Sauvegarder le rapport
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const rapportPath = `./output/06-rapports/batch-factuels-${date}.txt`;
    
    try {
      await fs.mkdir('./output/06-rapports', { recursive: true });
      await fs.writeFile(rapportPath, rapport, 'utf-8');
      console.log(rapport);
      console.log(`💾 Rapport sauvegardé : ${rapportPath}`);
    } catch (e) {
      console.log(rapport);
      console.log('⚠️ Impossible de sauvegarder le rapport');
    }
    
    return rapport;
  }

  /**
   * Exécuter le batch complet
   */
  async executer() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     BATCH 10 ARTICLES FACTUELS - CORPUS 16/08/2025    ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    // 1. Lister les corpus
    const corpusTrouves = await this.listerCorpus();
    
    if (!corpusTrouves) {
      console.log('\n❌ Aucun corpus trouvé pour le 16 août 2025');
      return false;
    }
    
    // 2. Limiter à 10 articles
    if (this.corpus.length > CONFIG.MAX_ARTICLES) {
      console.log(`\n⚠️ Limitation à ${CONFIG.MAX_ARTICLES} articles (${this.corpus.length} corpus disponibles)`);
      this.corpus = this.corpus.slice(0, CONFIG.MAX_ARTICLES);
    }
    
    // 3. Confirmation
    console.log('\n🎯 ARTICLES À GÉNÉRER :');
    console.log(`   • Nombre : ${this.corpus.length}`);
    console.log(`   • Temps estimé : ${Math.round(this.corpus.length * 80 / 60)} minutes`);
    console.log(`   • Pause entre articles : ${CONFIG.PAUSE_ENTRE_ARTICLES / 1000}s`);
    
    console.log('\n⏳ Démarrage dans 5 secondes... (Ctrl+C pour annuler)');
    await this.sleep(5000);
    
    // 4. Générer les articles
    console.log('\n🚀 DÉBUT DE LA GÉNÉRATION');
    console.log('=' .repeat(60));
    
    for (let i = 0; i < this.corpus.length; i++) {
      await this.genererArticle(this.corpus[i], i + 1);
      
      // Pause entre les articles (sauf le dernier)
      if (i < this.corpus.length - 1) {
        console.log(`   ⏸️ Pause de ${CONFIG.PAUSE_ENTRE_ARTICLES / 1000}s...`);
        await this.sleep(CONFIG.PAUSE_ENTRE_ARTICLES);
      }
    }
    
    // 5. Générer le rapport
    await this.genererRapport();
    
    // 6. Prochaines étapes
    console.log('\n📋 PROCHAINES ÉTAPES');
    console.log('=' .repeat(60));
    console.log('1. Vérifier les articles :');
    console.log('   cd output/03-articles-factuels');
    console.log('   dir *.md\n');
    console.log('2. Générer les versions conversationnelles (optionnel) :');
    console.log('   node agents/agent-style-conversationnel.cjs [article]\n');
    console.log('3. Copier vers le blog :');
    console.log('   copy output\\03-articles-factuels\\*.md ..\\..\\src\\content\\blog\\\n');
    console.log('4. Publier :');
    console.log('   cd ..\\..\\');
    console.log('   git add .');
    console.log('   git commit -m "feat: ajout de 10 articles - batch 16/08"');
    console.log('   git push\n');
    
    console.log('✨ Batch terminé avec succès !');
    
    return true;
  }
}

/**
 * Point d'entrée
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🚀 BATCH 10 ARTICLES FACTUELS
==============================

Génère automatiquement des articles factuels pour tous les corpus
du 16 août 2025 (limité à 10 articles).

Usage :
  node batch-10-articles-factuels.cjs
  node batch-10-articles-factuels.cjs --help

Configuration :
  • Corpus : output/02-corpus/2025-08-16/
  • Articles : output/03-articles-factuels/
  • Pause : 5 secondes entre articles
  • Limite : 10 articles maximum

Durée estimée : ~15 minutes pour 10 articles
`);
    process.exit(0);
  }
  
  const batch = new BatchArticlesFactuels();
  
  try {
    await batch.executer();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Erreur fatale :', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Lancer si exécuté directement
if (require.main === module) {
  main();
}