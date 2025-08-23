// archive-cleanup-complete.cjs
// Script d'archivage et de nettoyage complet du projet Prizm AI
// Date : 16 août 2025
// Usage : node archive-cleanup-complete.cjs [--dry-run]

const fs = require('fs').promises;
const path = require('path');

class PrizmArchiver {
  constructor(dryRun = false) {
    this.baseDir = 'C:/Users/Samuel/Documents/prizmia';
    this.archiveDir = path.join(this.baseDir, '_archives');
    this.pipelineDir = path.join(this.baseDir, 'pipelines/content-generation');
    this.timestamp = new Date().toISOString().split('T')[0];
    this.dryRun = dryRun;
    
    this.report = {
      archived: [],
      errors: [],
      created: [],
      cleaned: [],
      totalSize: 0
    };
  }

  async init() {
    console.log(`
╔════════════════════════════════════════════════════════╗
║           ARCHIVAGE COMPLET PRIZM AI                   ║
║                ${this.timestamp}                        ║
║           Mode: ${this.dryRun ? 'DRY RUN (test)' : 'EXECUTION RÉELLE'}          ║
╚════════════════════════════════════════════════════════╝
    `);
    
    try {
      // Créer la structure d'archives
      await this.createArchiveStructure();
      
      // Exécuter l'archivage par catégorie
      console.log('\n📦 PHASE 1 : Archivage des backups...');
      await this.archiveBackups();
      
      console.log('\n🔧 PHASE 2 : Archivage des scripts de migration...');
      await this.archiveScripts();
      
      console.log('\n🧪 PHASE 3 : Archivage des fichiers de test...');
      await this.archiveTests();
      
      console.log('\n📄 PHASE 4 : Archivage des versions obsolètes...');
      await this.archiveObsoleteVersions();
      
      console.log('\n📝 PHASE 5 : Archivage des articles publiés...');
      await this.archivePublishedArticles();
      
      console.log('\n🗑️ PHASE 6 : Nettoyage des fichiers temporaires...');
      await this.archiveTemporaryFiles();
      
      console.log('\n🏗️ PHASE 7 : Réorganisation de la structure active...');
      await this.reorganizeActiveFiles();
      
      console.log('\n🧹 PHASE 8 : Nettoyage des dossiers vides...');
      await this.cleanEmptyDirectories();
      
      // Générer le rapport final
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erreur critique :', error);
      this.report.errors.push(error.message);
    }
  }

  async createArchiveStructure() {
    const archiveDirs = [
      `${this.archiveDir}/backups-${this.timestamp}`,
      `${this.archiveDir}/scripts-migration`,
      `${this.archiveDir}/tests-temporaires`,
      `${this.archiveDir}/versions-obsoletes`,
      `${this.archiveDir}/articles-publies-${this.timestamp}`,
      `${this.archiveDir}/fichiers-temporaires`,
      `${this.archiveDir}/sessions-historique`
    ];

    for (const dir of archiveDirs) {
      if (!this.dryRun) {
        await fs.mkdir(dir, { recursive: true });
      }
      this.report.created.push(dir);
      console.log(`   ✅ Dossier créé : ${path.basename(dir)}`);
    }
  }

  async archiveBackups() {
    const backupPatterns = [
      '*.backup',
      '*.backup-*',
      '*-backup.*',
      '*.bak'
    ];

    const targetDir = `${this.archiveDir}/backups-${this.timestamp}`;
    let count = 0;

    for (const pattern of backupPatterns) {
      const files = await this.findFiles(this.pipelineDir, pattern);
      for (const file of files) {
        await this.moveFile(file, targetDir);
        count++;
      }
    }

    console.log(`   → ${count} fichiers de backup archivés`);
  }

  async archiveScripts() {
    const scriptPatterns = [
      'fix-*.cjs',
      'fix-*.js',
      'diagnostic-*.cjs',
      'diagnostic-*.js',
      'consolidation-*.cjs',
      'finalise-*.cjs',
      'clean-duplicate-*.cjs',
      'migrate-*.js',
      'apply-*.js'
    ];

    const targetDir = `${this.archiveDir}/scripts-migration`;
    let count = 0;

    for (const pattern of scriptPatterns) {
      const files = await this.findFiles(this.pipelineDir, pattern);
      for (const file of files) {
        await this.moveFile(file, targetDir);
        count++;
      }
    }

    // Garder structure-guardian.cjs (il est utile)
    const guardian = path.join(this.pipelineDir, 'structure-guardian.cjs');
    if (await this.fileExists(guardian)) {
      console.log('   ⚠️  structure-guardian.cjs conservé (script de maintenance actif)');
    }

    console.log(`   → ${count} scripts de migration archivés`);
  }

  async archiveTests() {
    const testPatterns = [
      'test-*.cjs',
      'test-*.js',
      '*-test.cjs',
      '*-test.js',
      'output-test.txt',
      'test-*.txt'
    ];

    const targetDir = `${this.archiveDir}/tests-temporaires`;
    let count = 0;

    for (const pattern of testPatterns) {
      const files = await this.findFiles(this.pipelineDir, pattern);
      for (const file of files) {
        await this.moveFile(file, targetDir);
        count++;
      }
    }

    console.log(`   → ${count} fichiers de test archivés`);
  }

  async archiveObsoleteVersions() {
    const obsoleteFiles = [
      'batch-production-optimized.cjs',
      'publish-factuels-final.cjs',
      'run-pipeline.cjs',
      'agent-veille-v4.cjs', // Remplacé par v5
      'pipeline-v4.cjs',     // Si existe (ancienne version)
      'fix-encoding.ps1'     // Script PowerShell obsolète
    ];

    const targetDir = `${this.archiveDir}/versions-obsoletes`;
    let count = 0;

    for (const fileName of obsoleteFiles) {
      const filePath = path.join(this.pipelineDir, fileName);
      if (await this.fileExists(filePath)) {
        await this.moveFile(filePath, targetDir);
        count++;
      }
    }

    console.log(`   → ${count} versions obsolètes archivées`);
  }

  async archivePublishedArticles() {
    const articleDirs = [
      'articles-factuels-publies',
      'articles-batch-v5-ready'
    ];

    const targetDir = `${this.archiveDir}/articles-publies-${this.timestamp}`;
    let count = 0;

    for (const dir of articleDirs) {
      const sourcePath = path.join(this.pipelineDir, dir);
      if (await this.fileExists(sourcePath)) {
        const files = await fs.readdir(sourcePath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            await this.moveFile(
              path.join(sourcePath, file),
              targetDir
            );
            count++;
          }
        }
        // Supprimer le dossier vide
        if (!this.dryRun) {
          await fs.rmdir(sourcePath);
        }
        this.report.cleaned.push(sourcePath);
      }
    }

    console.log(`   → ${count} articles publiés archivés`);
  }

  async archiveTemporaryFiles() {
    const tempFiles = [
      'sujets-5-derniers.json',
      'sujets-9-restants.json',
      'test-encoding.txt',
      'output-test.txt',
      'corpus-verifie', // Fichier orphelin
      'AUDIT-SYSTEME-2025-08-15.md' // Déplacer vers documentation
    ];

    const targetDir = `${this.archiveDir}/fichiers-temporaires`;
    let count = 0;

    for (const fileName of tempFiles) {
      const filePath = path.join(this.pipelineDir, fileName);
      if (await this.fileExists(filePath)) {
        // AUDIT-SYSTEME va dans la documentation
        if (fileName.includes('AUDIT-SYSTEME')) {
          await this.moveFile(filePath, `${this.baseDir}/documentation/audit-systeme`);
        } else {
          await this.moveFile(filePath, targetDir);
        }
        count++;
      }
    }

    // Nettoyer aussi dans output/
    const outputTemp = path.join(this.pipelineDir, 'output/corpus-verifie');
    if (await this.fileExists(outputTemp)) {
      await this.moveFile(outputTemp, targetDir);
      count++;
    }

    console.log(`   → ${count} fichiers temporaires archivés`);
  }

  async reorganizeActiveFiles() {
    // Créer les nouveaux dossiers organisés
    const newStructure = {
      'agents': [
        'agent-veille-v5.cjs',
        'agent-redacteur-factuel.cjs',
        'agent-style-conversationnel.cjs',
        'pipeline-v4-fixed.cjs',
        'pipeline-v5-batch.cjs'
      ],
      'maintenance': [
        'structure-guardian.cjs',
        'launch.bat'
      ]
    };

    for (const [folder, files] of Object.entries(newStructure)) {
      const folderPath = path.join(this.pipelineDir, folder);
      
      if (!this.dryRun) {
        await fs.mkdir(folderPath, { recursive: true });
      }
      
      for (const file of files) {
        const source = path.join(this.pipelineDir, file);
        const dest = path.join(folderPath, file);
        
        if (await this.fileExists(source)) {
          if (!this.dryRun) {
            await fs.rename(source, dest);
          }
          console.log(`   ✅ ${file} → ${folder}/`);
          this.report.archived.push({ from: source, to: dest });
        }
      }
    }
  }

  async cleanEmptyDirectories() {
    const outputDir = path.join(this.pipelineDir, 'output');
    
    // Nettoyer les sous-dossiers vides dans 01-veille
    const veilleDir = path.join(outputDir, '01-veille/2025');
    if (await this.fileExists(veilleDir)) {
      const months = await fs.readdir(veilleDir);
      for (const month of months) {
        const monthPath = path.join(veilleDir, month);
        const files = await fs.readdir(monthPath);
        if (files.length === 0 && !this.dryRun) {
          await fs.rmdir(monthPath);
          this.report.cleaned.push(monthPath);
          console.log(`   🗑️ Dossier vide supprimé : ${month}`);
        }
      }
    }

    // Supprimer 02-brouillons s'il existe
    const brouillonsDir = path.join(outputDir, '02-brouillons');
    if (await this.fileExists(brouillonsDir)) {
      const files = await fs.readdir(brouillonsDir);
      if (files.length === 0 && !this.dryRun) {
        await fs.rmdir(brouillonsDir);
        this.report.cleaned.push(brouillonsDir);
        console.log(`   🗑️ Dossier obsolète supprimé : 02-brouillons`);
      }
    }
  }

  // Méthodes utilitaires
  async findFiles(dir, pattern) {
    const files = [];
    try {
      const items = await fs.readdir(dir);
      for (const item of items) {
        if (this.matchPattern(item, pattern)) {
          files.push(path.join(dir, item));
        }
      }
    } catch (error) {
      // Ignorer si le dossier n'existe pas
    }
    return files;
  }

  matchPattern(filename, pattern) {
    // Convertir le pattern en regex
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    return new RegExp(`^${regex}$`).test(filename);
  }

  async moveFile(source, targetDir) {
    try {
      const fileName = path.basename(source);
      const dest = path.join(targetDir, fileName);
      
      if (!this.dryRun) {
        // Créer le dossier cible si nécessaire
        await fs.mkdir(targetDir, { recursive: true });
        // Déplacer le fichier
        await fs.rename(source, dest);
      }
      
      // Obtenir la taille du fichier
      const stats = await fs.stat(source);
      this.report.totalSize += stats.size;
      
      this.report.archived.push({
        from: source,
        to: dest,
        size: stats.size
      });
      
    } catch (error) {
      this.report.errors.push(`Erreur déplacement ${source}: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  async generateReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RAPPORT FINAL D\'ARCHIVAGE');
    console.log('═'.repeat(60));
    
    console.log(`\n✅ Opérations réussies :`);
    console.log(`   - Fichiers archivés : ${this.report.archived.length}`);
    console.log(`   - Dossiers créés : ${this.report.created.length}`);
    console.log(`   - Dossiers nettoyés : ${this.report.cleaned.length}`);
    console.log(`   - Taille totale archivée : ${this.formatSize(this.report.totalSize)}`);
    
    if (this.report.errors.length > 0) {
      console.log(`\n⚠️ Erreurs rencontrées :`);
      this.report.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Sauvegarder le rapport
    const reportPath = path.join(this.archiveDir, `rapport-archivage-${this.timestamp}.json`);
    if (!this.dryRun) {
      await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
      console.log(`\n💾 Rapport sauvegardé : ${reportPath}`);
    }

    console.log('\n✨ Archivage terminé avec succès !');
    
    if (this.dryRun) {
      console.log('\n⚠️ MODE DRY RUN : Aucun fichier n\'a été déplacé.');
      console.log('Pour exécuter réellement : node archive-cleanup-complete.cjs');
    }
  }
}

// Point d'entrée
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.clear();
  
  const archiver = new PrizmArchiver(dryRun);
  await archiver.init();
}

// Lancer le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PrizmArchiver;