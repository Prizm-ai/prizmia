// final-cleanup.cjs
// Nettoyage final de tous les fichiers temporaires restants
// Usage : node final-cleanup.cjs [--dry-run]

const fs = require('fs').promises;
const path = require('path');

class FinalCleanup {
  constructor(dryRun = false) {
    this.baseDir = 'C:/Users/Samuel/Documents/prizmia';
    this.archiveDir = path.join(this.baseDir, '_archives');
    this.timestamp = new Date().toISOString().split('T')[0];
    this.dryRun = dryRun;
    
    this.stats = {
      moved: 0,
      deleted: 0,
      errors: [],
      totalSize: 0
    };
  }

  async execute() {
    console.log(`
╔════════════════════════════════════════════════════════╗
║           NETTOYAGE FINAL PRIZM AI                     ║
║                ${this.timestamp}                        ║
║           Mode: ${this.dryRun ? 'DRY RUN' : 'EXÉCUTION'}                    ║
╚════════════════════════════════════════════════════════╝
    `);

    // Créer les dossiers d'archive si nécessaire
    await this.createArchiveDirs();

    // Phase 1 : Nettoyer pipelines/content-generation/
    console.log('\n📁 PHASE 1 : Nettoyage pipelines/content-generation/');
    await this.cleanPipelinesRoot();

    // Phase 2 : Nettoyer agents/
    console.log('\n📁 PHASE 2 : Nettoyage agents/');
    await this.cleanAgentsDir();

    // Phase 3 : Nettoyer la racine
    console.log('\n📁 PHASE 3 : Nettoyage racine du projet');
    await this.cleanProjectRoot();

    // Afficher le rapport
    await this.showReport();
  }

  async createArchiveDirs() {
    const dirs = [
      `${this.archiveDir}/scripts-finaux-${this.timestamp}`,
      `${this.archiveDir}/backups-finaux-${this.timestamp}`,
      `${this.archiveDir}/tests-finaux-${this.timestamp}`
    ];

    for (const dir of dirs) {
      if (!this.dryRun) {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async cleanPipelinesRoot() {
    const pipelineDir = path.join(this.baseDir, 'pipelines/content-generation');
    
    const filesToArchive = {
      'backups': [
        'agent-veille-v4.cjs.backup',
        'agent-veille-v4.cjs.backup-1755251834183',
        'agent-veille-v4.cjs.backup-date-fix',
        'pipeline-v4-fixed.cjs.backup-1755249521831',
        'pipeline-v5-batch.cjs.backup-1755353042124'
      ],
      'scripts': [
        'archive-cleanup-complete.cjs',
        'clean-duplicate-frontmatter.cjs',
        'consolidation-structure.cjs',
        'diagnostic-system-complet.cjs',
        'diagnostic-system-complet.js',
        'finalise-structure.cjs',
        'fix-agent-paths.cjs',
        'fix-and-publish-factuels.cjs',
        'fix-js-encoding.cjs',
        'structure-config.cjs'  // Si existe déjà dans config/
      ],
      'tests': [
        'test-final.cjs',
        'test-read.js',
        'test-simple.cjs',
        'test-simple.js'
      ]
    };

    for (const [category, files] of Object.entries(filesToArchive)) {
      const targetDir = category === 'backups' ? 
        `${this.archiveDir}/backups-finaux-${this.timestamp}` :
        category === 'scripts' ?
        `${this.archiveDir}/scripts-finaux-${this.timestamp}` :
        `${this.archiveDir}/tests-finaux-${this.timestamp}`;

      for (const file of files) {
        await this.moveFile(path.join(pipelineDir, file), targetDir);
      }
    }
  }

  async cleanAgentsDir() {
    const agentsDir = path.join(this.baseDir, 'pipelines/content-generation/agents');
    
    const backupsToArchive = [
      'agent-redacteur-factuel.cjs.backup-paths',
      'agent-style-conversationnel.cjs.backup-output',
      'agent-style-conversationnel.cjs.backup-paths',
      'agent-veille-v5.cjs.backup-output',
      'agent-veille-v5.cjs.backup-paths',
      'pipeline-v4-fixed.cjs.backup-output',
      'pipeline-v4-fixed.cjs.backup-paths',
      'pipeline-v5-batch.cjs.backup-output',
      'pipeline-v5-batch.cjs.backup-paths',
      'fix-output-paths.cjs'  // Script déjà appliqué
    ];

    const targetDir = `${this.archiveDir}/backups-finaux-${this.timestamp}`;
    
    for (const file of backupsToArchive) {
      await this.moveFile(path.join(agentsDir, file), targetDir);
    }
  }

  async cleanProjectRoot() {
    const rootDir = this.baseDir;
    
    const rootFilesToArchive = [
      'clean-duplicate-frontmatter.js',
      'fix-all-blog-issues.js',
      'fix-articlecard-integration.js',
      'fix-date-field.js',
      'fix-dates-correctly.js',
      'fix-frontmatter-encoding.js',
      'integrate-best-of-both.js',
      'revert-to-pubdate.js',
      'update-css-variables.js',
      'git-analysis-1754981663535.json',
      'package.json.backup'
    ];

    const targetDir = `${this.archiveDir}/scripts-finaux-${this.timestamp}`;
    
    for (const file of rootFilesToArchive) {
      await this.moveFile(path.join(rootDir, file), targetDir);
    }
  }

  async moveFile(source, targetDir) {
    try {
      // Vérifier si le fichier existe
      await fs.access(source);
      
      const fileName = path.basename(source);
      const dest = path.join(targetDir, fileName);
      
      if (this.dryRun) {
        console.log(`   [DRY RUN] ${fileName} → archives`);
      } else {
        // Créer le dossier cible si nécessaire
        await fs.mkdir(targetDir, { recursive: true });
        
        // Obtenir la taille
        const stats = await fs.stat(source);
        this.stats.totalSize += stats.size;
        
        // Déplacer le fichier
        await fs.rename(source, dest);
        console.log(`   ✅ ${fileName} → archives`);
      }
      
      this.stats.moved++;
      
    } catch (error) {
      // Le fichier n'existe pas ou autre erreur
      if (error.code !== 'ENOENT') {
        this.stats.errors.push(`${path.basename(source)}: ${error.message}`);
      }
    }
  }

  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async showReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RAPPORT DE NETTOYAGE FINAL');
    console.log('═'.repeat(60));
    
    console.log(`\n✅ Fichiers archivés : ${this.stats.moved}`);
    console.log(`💾 Taille totale : ${this.formatSize(this.stats.totalSize)}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️ Erreurs (fichiers déjà supprimés) : ${this.stats.errors.length}`);
    }

    if (!this.dryRun) {
      // Sauvegarder le rapport
      const reportPath = path.join(this.archiveDir, `rapport-nettoyage-final-${this.timestamp}.json`);
      await fs.writeFile(reportPath, JSON.stringify(this.stats, null, 2));
      console.log(`\n📝 Rapport sauvegardé : ${reportPath}`);
    }

    console.log('\n✨ Nettoyage terminé !');
    
    if (this.dryRun) {
      console.log('\n⚠️ MODE DRY RUN - Aucun fichier n\'a été déplacé');
      console.log('Pour exécuter réellement : node final-cleanup.cjs');
    } else {
      console.log('\n🎉 VOTRE PROJET EST MAINTENANT PARFAITEMENT PROPRE !');
    }
  }
}

// Exécution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  const cleanup = new FinalCleanup(dryRun);
  await cleanup.execute();
}

if (require.main === module) {
  main().catch(console.error);
}