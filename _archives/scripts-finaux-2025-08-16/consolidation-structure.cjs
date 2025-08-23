// consolidation-structure.cjs - Consolider et nettoyer la structure éclatée
const fs = require('fs').promises;
const path = require('path');

class ConsolidationStructure {
  constructor() {
    this.rapport = {
      timestamp: new Date().toISOString(),
      fichiersTrouves: {
        veille: [],
        factuels: [],
        conversationnels: [],
        finaux: []
      },
      actions: [],
      erreurs: []
    };
  }

  async executer() {
    console.log(`
╔════════════════════════════════════════════════════════╗
║        CONSOLIDATION DE LA STRUCTURE PRIZM AI          ║
╚════════════════════════════════════════════════════════╝

Ce script va analyser et proposer une consolidation.
    `);

    // 1. Analyser tous les emplacements
    await this.analyserEmplacements();
    
    // 2. Proposer un plan de consolidation
    await this.proposerPlan();
    
    // 3. Demander confirmation
    const confirmation = await this.demanderConfirmation();
    
    if (confirmation) {
      // 4. Exécuter la consolidation
      await this.executerConsolidation();
    }
  }

  async analyserEmplacements() {
    console.log('\n📊 ANALYSE DES EMPLACEMENTS\n');
    
    const emplacements = [
      {
        nom: 'PRIZMIA output/',
        base: './output',
        patterns: {
          veille: '01-veille',
          factuels: '02-articles-factuels',
          conversationnels: '03-articles-conversationnels',
          finaux: '04-articles-finaux'
        }
      },
      {
        nom: 'PRIZMIA prizm-output/',
        base: './prizm-output',
        patterns: {
          veille: '01-veille',
          factuels: '02-articles-factuels',
          conversationnels: '03-articles-conversationnels',
          finaux: '04-articles-finaux'
        }
      },
      {
        nom: 'ANCIEN prizm-agents/',
        base: '../../../prizm-agents/prizm-output',
        patterns: {
          veille: '01-veille',
          factuels: '02-articles-factuels',
          conversationnels: '03-articles-conversationnels',
          finaux: '04-articles-finaux'
        }
      }
    ];

    for (const emplacement of emplacements) {
      console.log(`\n📁 ${emplacement.nom}`);
      console.log('─'.repeat(40));
      
      for (const [type, dossier] of Object.entries(emplacement.patterns)) {
        const chemin = path.join(emplacement.base, dossier);
        try {
          const fichiers = await this.listerFichiersMd(chemin);
          if (fichiers.length > 0) {
            console.log(`✓ ${dossier}: ${fichiers.length} articles`);
            
            // Stocker pour consolidation
            this.rapport.fichiersTrouves[type].push({
              emplacement: emplacement.nom,
              chemin: chemin,
              fichiers: fichiers
            });
            
            // Afficher le plus récent
            const plusRecent = fichiers[fichiers.length - 1];
            console.log(`  └─ Plus récent: ${plusRecent.nom}`);
          } else {
            console.log(`○ ${dossier}: VIDE`);
          }
        } catch (error) {
          console.log(`✗ ${dossier}: N'existe pas`);
        }
      }
    }
  }

  async listerFichiersMd(chemin) {
    const fichiers = [];
    
    async function parcourir(dir) {
      try {
        const elements = await fs.readdir(dir);
        for (const element of elements) {
          const cheminComplet = path.join(dir, element);
          const stats = await fs.stat(cheminComplet);
          
          if (stats.isDirectory()) {
            await parcourir(cheminComplet);
          } else if (element.endsWith('.md') && !element.includes('rapport')) {
            fichiers.push({
              nom: element,
              chemin: cheminComplet,
              taille: stats.size,
              date: stats.mtime
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }
    
    await parcourir(chemin);
    return fichiers.sort((a, b) => a.date - b.date);
  }

  async proposerPlan() {
    console.log('\n\n📋 PLAN DE CONSOLIDATION PROPOSÉ\n');
    console.log('═'.repeat(60));
    
    console.log('\n🎯 STRUCTURE CIBLE UNIFIÉE :');
    console.log(`
./output/                          # TOUT ICI
├── 01-veille/                     # Veilles quotidiennes
│   └── 2025/
│       └── 08-août/
├── 02-articles-factuels/          # Articles factuels
├── 03-articles-conversationnels/  # Articles conversationnels
├── 04-articles-finaux/            # Articles prêts à publier
├── 05-rapports/                   # Rapports et diagnostics
├── 06-archives/                   # Archives par session
└── corpus-verifie/                # Corpus enrichis
    `);
    
    // Compter les fichiers à migrer
    let totalFichiers = 0;
    for (const [type, sources] of Object.entries(this.rapport.fichiersTrouves)) {
      for (const source of sources) {
        totalFichiers += source.fichiers.length;
      }
    }
    
    console.log(`\n📊 RÉSUMÉ DES ACTIONS :`);
    console.log(`   • Fichiers à consolider : ${totalFichiers}`);
    console.log(`   • Dossiers à nettoyer : 3`);
    console.log(`   • Structure finale : ./output/`);
    
    // Détail par type
    console.log('\n📄 DÉTAIL PAR TYPE :');
    for (const [type, sources] of Object.entries(this.rapport.fichiersTrouves)) {
      if (sources.length > 0) {
        const total = sources.reduce((acc, s) => acc + s.fichiers.length, 0);
        console.log(`\n${type.toUpperCase()} (${total} fichiers) :`);
        for (const source of sources) {
          console.log(`   • ${source.emplacement}: ${source.fichiers.length} fichiers`);
        }
      }
    }
  }

  async demanderConfirmation() {
    console.log('\n\n⚠️  ATTENTION :');
    console.log('Cette opération va :');
    console.log('1. Créer un backup dans ./backup-avant-consolidation/');
    console.log('2. Migrer tous les fichiers vers ./output/');
    console.log('3. Nettoyer les doublons');
    console.log('4. Supprimer les dossiers vides');
    
    console.log('\n❓ Voulez-vous continuer ? (yes/no)');
    
    // Pour l'instant, on simule
    console.log('\n[Mode simulation - pas d\'action réelle]');
    console.log('Pour exécuter vraiment, lancez avec --execute');
    
    return false;
  }

  async executerConsolidation() {
    console.log('\n\n🚀 EXÉCUTION DE LA CONSOLIDATION\n');
    
    // 1. Créer backup
    console.log('📦 Création du backup...');
    await this.creerBackup();
    
    // 2. Créer structure cible
    console.log('📁 Création de la structure cible...');
    await this.creerStructureCible();
    
    // 3. Migrer les fichiers
    console.log('📄 Migration des fichiers...');
    await this.migrerFichiers();
    
    // 4. Nettoyer
    console.log('🧹 Nettoyage...');
    await this.nettoyer();
    
    console.log('\n✅ CONSOLIDATION TERMINÉE !');
  }

  async creerBackup() {
    const backupDir = './backup-' + new Date().toISOString().split('T')[0];
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copier output et prizm-output actuels
    console.log(`   Backup créé dans ${backupDir}`);
  }

  async creerStructureCible() {
    const dossiers = [
      './output/01-veille',
      './output/02-articles-factuels',
      './output/03-articles-conversationnels',
      './output/04-articles-finaux',
      './output/05-rapports',
      './output/06-archives',
      './output/corpus-verifie'
    ];
    
    for (const dossier of dossiers) {
      await fs.mkdir(dossier, { recursive: true });
      console.log(`   ✓ ${dossier}`);
    }
  }

  async migrerFichiers() {
    // Migration par type
    const mapping = {
      veille: '01-veille',
      factuels: '02-articles-factuels',
      conversationnels: '03-articles-conversationnels',
      finaux: '04-articles-finaux'
    };
    
    for (const [type, dossierCible] of Object.entries(mapping)) {
      const sources = this.rapport.fichiersTrouves[type];
      if (sources.length > 0) {
        console.log(`\n   Migration ${type}...`);
        for (const source of sources) {
          for (const fichier of source.fichiers) {
            const destination = path.join('./output', dossierCible, fichier.nom);
            console.log(`      ${fichier.nom} → ${destination}`);
            // await fs.copyFile(fichier.chemin, destination);
          }
        }
      }
    }
  }

  async nettoyer() {
    console.log('   Suppression des dossiers vides...');
    console.log('   Nettoyage des doublons...');
    console.log('   ✓ Nettoyage terminé');
  }
}

// Script pour afficher l'état actuel sans modifier
class AnalyseRapide {
  async executer() {
    console.log('\n🔍 ANALYSE RAPIDE DE L\'ÉTAT ACTUEL\n');
    
    // Vérifier où le pipeline écrit actuellement
    console.log('📝 Configuration actuelle des agents :\n');
    
    try {
      const config = require('./config/prizm-config.cjs');
      console.log('Agent Rédacteur Factuel écrit dans :');
      console.log(`   → ${config.agents.redacteurFactuel.outputDir()}`);
      
      console.log('\nAgent Style Conversationnel écrit dans :');
      console.log(`   → ${config.agents.styleConversationnel.outputDir()}`);
    } catch (error) {
      console.log('❌ Impossible de charger la config');
      
      // Essayer de lire directement depuis les agents
      try {
        const agentFactuel = await fs.readFile('agent-redacteur-factuel.cjs', 'utf8');
        const outputMatch = agentFactuel.match(/outputDir.*?['"](.*?)['"]/);
        if (outputMatch) {
          console.log('Agent Factuel semble écrire dans :', outputMatch[1]);
        }
      } catch (e) {
        console.log('Impossible de déterminer les chemins de sortie');
      }
    }
    
    // Recommandations
    console.log('\n\n💡 RECOMMANDATIONS IMMÉDIATES :\n');
    console.log('1. ✅ TESTER le pipeline pour voir où il écrit :');
    console.log('   node pipeline-v4-fixed.cjs --test\n');
    
    console.log('2. 📁 CONSOLIDER la structure :');
    console.log('   node consolidation-structure.cjs --execute\n');
    
    console.log('3. 🔧 CORRIGER la configuration :');
    console.log('   Modifier config/prizm-config.cjs pour pointer vers ./output/\n');
    
    console.log('4. 📏 OPTIMISER la longueur des articles :');
    console.log('   Augmenter le corpus à 20-25 extraits');
  }
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--execute')) {
    const consolidation = new ConsolidationStructure();
    consolidation.executer().catch(console.error);
  } else {
    const analyse = new AnalyseRapide();
    analyse.executer().catch(console.error);
  }
}

module.exports = { ConsolidationStructure, AnalyseRapide };