const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * PRODUCTION BATCH OPTIMISÉE - PRIZM AI
 * Génère 10 articles et les prépare pour publication
 * Adapté au format exact du blog Astro
 * 
 * UTILISATION :
 * Sauvegarder ce fichier comme : batch-production-optimized.cjs
 * Lancer avec : node batch-production-optimized.cjs
 */

class BatchProductionOptimized {
  constructor() {
    this.baseDir = 'C:\\Users\\Samuel\\Documents\\prizmia\\pipelines\\content-generation';
    this.outputDir = path.join(this.baseDir, 'output');
    this.blogDir = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
    this.stagingDir = path.join(this.baseDir, 'articles-ready-to-publish');
    
    // Configuration des articles à générer
    this.articles = [
      // L'Essentiel IA (4 articles)
      {
        titre: "IA générative 2025 : les 5 outils indispensables pour les PME",
        category: "actualites",
        emoji: "🚀",
        focus: "Présentation des nouveaux outils IA accessibles aux PME avec exemples concrets d'utilisation et ROI"
      },
      {
        titre: "Réglementation IA européenne : guide de conformité pour PME",
        category: "actualites", 
        emoji: "📋",
        focus: "Décryptage de l'AI Act et check-list de mise en conformité pour les entreprises françaises"
      },
      {
        titre: "Microsoft Copilot vs ChatGPT Enterprise : quel assistant IA pour votre PME ?",
        category: "actualites",
        emoji: "🤖",
        focus: "Comparatif détaillé avec cas d'usage, prix et recommandations selon la taille d'entreprise"
      },
      {
        titre: "L'IA dans la comptabilité : automatisation et gains de productivité",
        category: "actualites",
        emoji: "💰",
        focus: "Solutions IA pour automatiser la saisie comptable, la facturation et le reporting financier"
      },
      
      // Guides Pratiques (4 articles)
      {
        titre: "Implémenter ChatGPT dans votre service client : guide pas à pas",
        category: "guides",
        emoji: "💬",
        focus: "Tutoriel complet : choix de la solution, paramétrage, formation des équipes et mesure du ROI"
      },
      {
        titre: "Automatiser sa prospection commerciale avec l'IA en 5 étapes",
        category: "guides",
        emoji: "📈",
        focus: "Méthode pratique pour identifier, qualifier et contacter automatiquement vos prospects"
      },
      {
        titre: "Créer du contenu marketing avec l'IA : workflow complet",
        category: "guides",
        emoji: "✍️",
        focus: "Process détaillé pour générer articles, posts sociaux et newsletters avec l'IA"
      },
      {
        titre: "Calculer le ROI de l'IA : méthode et tableur Excel gratuit",
        category: "guides",
        emoji: "📊",
        focus: "Framework de calcul avec exemples chiffrés et template téléchargeable"
      },
      
      // Analyses & Décryptages (2 articles)
      {
        titre: "Étude : l'adoption de l'IA dans les PME françaises en 2025",
        category: "analyses",
        emoji: "🔍",
        focus: "Analyse des chiffres, freins à l'adoption et opportunités pour prendre de l'avance"
      },
      {
        titre: "IA et cybersécurité : nouveaux risques et solutions pour les PME",
        category: "analyses",
        emoji: "🔒",
        focus: "Décryptage des menaces liées à l'IA et guide de protection des données d'entreprise"
      }
    ];
    
    this.stats = {
      startTime: Date.now(),
      generated: 0,
      failed: 0,
      published: 0,
      results: []
    };
  }

  /**
   * MÉTHODE PRINCIPALE
   */
  async run() {
    console.log('\n🚀 PRODUCTION BATCH OPTIMISÉE - PRIZM AI');
    console.log('═'.repeat(60));
    console.log(`Objectif : ${this.articles.length} articles de qualité`);
    console.log(`Heure de début : ${new Date().toLocaleTimeString('fr-FR')}\n`);
    
    // 1. Préparer l'environnement
    await this.prepareEnvironment();
    
    // 2. Générer les articles
    await this.generateArticles();
    
    // 3. Préparer pour publication
    await this.prepareForPublishing();
    
    // 4. Rapport final
    await this.generateReport();
    
    return this.stats;
  }

  /**
   * PHASE 1 : PRÉPARATION
   */
  async prepareEnvironment() {
    console.log('📁 PRÉPARATION DE L\'ENVIRONNEMENT\n');
    
    // Créer le dossier de staging
    try {
      await fs.mkdir(this.stagingDir, { recursive: true });
      console.log('   ✅ Dossier de staging créé');
    } catch (e) {
      console.log('   ℹ️  Dossier de staging existant');
    }
    
    // Vérifier le pipeline
    try {
      await fs.access(path.join(this.baseDir, 'pipeline-v4-fixed.cjs'));
      console.log('   ✅ Pipeline v4 disponible');
    } catch (e) {
      throw new Error('Pipeline v4 non trouvé !');
    }
    
    // Nettoyer les anciens fichiers de staging
    try {
      const oldFiles = await fs.readdir(this.stagingDir);
      for (const file of oldFiles) {
        if (file.endsWith('.md')) {
          await fs.unlink(path.join(this.stagingDir, file));
        }
      }
      console.log(`   ✅ ${oldFiles.length} anciens fichiers nettoyés`);
    } catch (e) {
      // Pas grave si le dossier est vide
    }
    
    console.log();
  }

  /**
   * PHASE 2 : GÉNÉRATION
   */
  async generateArticles() {
    console.log('📝 GÉNÉRATION DES ARTICLES\n');
    console.log('═'.repeat(40));
    
    for (let i = 0; i < this.articles.length; i++) {
      const article = this.articles[i];
      const num = i + 1;
      
      console.log(`\n[${num}/${this.articles.length}] ${article.titre}`);
      console.log(`     Catégorie : ${article.category}`);
      
      try {
        // Option A : Utiliser un corpus existant si disponible
        const existingCorpus = await this.findMatchingCorpus(article);
        
        if (existingCorpus) {
          console.log(`     📚 Corpus existant trouvé : ${existingCorpus}`);
        } else {
          // Option B : Créer une nouvelle veille
          console.log(`     📰 Création d'une nouvelle veille...`);
          await this.createVeille(article);
          await this.pause(2000); // Petite pause
        }
        
        // Lancer le pipeline
        console.log(`     ⚙️  Génération en cours...`);
        const startGen = Date.now();
        
        const result = await this.runPipeline(article);
        
        const duration = Math.round((Date.now() - startGen) / 1000);
        console.log(`     ✅ Article généré en ${duration}s`);
        
        // Préparer l'article avec le bon format
        const prepared = await this.formatArticle(result, article);
        
        this.stats.generated++;
        this.stats.results.push({
          success: true,
          article: article,
          file: prepared.filename,
          duration: duration
        });
        
        // Pause entre articles pour éviter surcharge API
        if (i < this.articles.length - 1) {
          const pauseTime = 15; // secondes
          console.log(`     ⏸️  Pause de ${pauseTime}s avant le prochain...`);
          await this.pause(pauseTime * 1000);
        }
        
      } catch (error) {
        console.log(`     ❌ Erreur : ${error.message}`);
        this.stats.failed++;
        this.stats.results.push({
          success: false,
          article: article,
          error: error.message
        });
        
        // Continuer avec le prochain article
        console.log(`     ⏭️  Passage à l'article suivant...`);
        await this.pause(5000);
      }
    }
    
    console.log('\n' + '═'.repeat(40));
    console.log(`✅ Génération terminée : ${this.stats.generated}/${this.articles.length} réussis`);
  }

  /**
   * Chercher un corpus existant correspondant
   */
  async findMatchingCorpus(article) {
    try {
      const corpusDir = path.join(this.outputDir, '02-corpus');
      const files = await fs.readdir(corpusDir);
      
      // Chercher un corpus qui pourrait correspondre
      const keywords = article.titre.toLowerCase().split(' ')
        .filter(w => w.length > 4); // Mots significatifs
      
      for (const file of files) {
        const filename = file.toLowerCase();
        const matches = keywords.filter(k => filename.includes(k));
        
        if (matches.length >= 2) { // Au moins 2 mots-clés correspondent
          return file;
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Créer une veille pour l'article
   */
  async createVeille(article) {
    const date = new Date().toISOString().split('T')[0];
    const slug = this.slugify(article.titre);
    
    const veilleContent = `# Veille IA - ${article.titre}

Date: ${date}
Catégorie: ${article.category}

## Sujet principal
${article.focus}

## Points clés à développer
1. Contexte et enjeux pour les PME françaises
2. Solutions disponibles sur le marché
3. Cas d'usage concrets et retours d'expérience
4. Méthodologie de mise en œuvre
5. ROI et métriques de succès

## Angle éditorial
- Ton professionnel mais accessible
- Focus sur l'actionnable et le pratique
- Exemples chiffrés et cas réels
- Éviter le jargon technique excessif

## Sources à privilégier
- Documentation officielle des outils mentionnés
- Études sectorielles récentes (2024-2025)
- Retours d'expérience d'entreprises françaises
- Analyses d'experts reconnus
`;
    
    const veillePath = path.join(
      this.outputDir,
      '01-veille',
      `veille-${slug}-${date}.md`
    );
    
    await fs.writeFile(veillePath, veilleContent, 'utf8');
    return veillePath;
  }

  /**
   * Lancer le pipeline
   */
  async runPipeline(article) {
    return new Promise((resolve, reject) => {
      try {
        // Lancer le pipeline en mode silencieux
        execSync('node pipeline-v4-fixed.cjs', {
          cwd: this.baseDir,
          stdio: 'ignore', // Ignorer les outputs pour éviter le flood
          encoding: 'utf8'
        });
        
        // Récupérer le dernier article généré
        setTimeout(async () => {
          try {
            const finalDir = path.join(this.outputDir, '05-articles-finaux');
            const files = await fs.readdir(finalDir);
            
            if (files.length === 0) {
              reject(new Error('Aucun article généré'));
              return;
            }
            
            // Prendre le plus récent
            const latest = files.sort().pop();
            const content = await fs.readFile(
              path.join(finalDir, latest),
              'utf8'
            );
            
            resolve({
              filename: latest,
              content: content,
              path: path.join(finalDir, latest)
            });
            
          } catch (e) {
            reject(e);
          }
        }, 2000); // Attendre que le fichier soit écrit
        
      } catch (error) {
        reject(new Error(`Pipeline error: ${error.message}`));
      }
    });
  }

  /**
   * PHASE 3 : FORMATAGE
   */
  async formatArticle(result, articleConfig) {
    const date = new Date().toISOString().split('T')[0];
    const slug = this.slugify(articleConfig.titre);
    
    // Nettoyer le contenu
    let content = result.content;
    
    // Supprimer l'ancien frontmatter s'il existe
    content = content.replace(/^---[\s\S]*?---\n*/m, '');
    
    // Corriger l'encodage
    content = this.fixEncoding(content);
    
    // Extraire ou générer le titre
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = articleConfig.titre;
    
    // Calculer le temps de lecture
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 250); // 250 mots/minute
    
    // Générer la description
    const description = this.generateDescription(content, articleConfig);
    
    // Créer le frontmatter au format exact du blog
    const frontmatter = `---
title: "${title}"
description: "${description}"
pubDate: ${date}
author: "L'équipe Prizm AI"
emoji: "${articleConfig.emoji}"
category: "${articleConfig.category}"
featured: ${this.stats.generated < 3 ? 'true' : 'false'}
readingTime: "${readingTime} min"
---

`;
    
    // Assembler l'article final
    const finalContent = frontmatter + content;
    
    // Sauvegarder dans le staging
    const filename = `${date}-${slug}.md`;
    const stagingPath = path.join(this.stagingDir, filename);
    
    await fs.writeFile(stagingPath, finalContent, 'utf8');
    
    return {
      filename: filename,
      path: stagingPath,
      category: articleConfig.category,
      title: title
    };
  }

  /**
   * PHASE 4 : PUBLICATION
   */
  async prepareForPublishing() {
    console.log('\n\n📤 PRÉPARATION POUR PUBLICATION\n');
    console.log('═'.repeat(40));
    
    const successfulArticles = this.stats.results.filter(r => r.success);
    
    if (successfulArticles.length === 0) {
      console.log('   ⚠️  Aucun article à publier');
      return;
    }
    
    console.log(`   ${successfulArticles.length} articles prêts à publier\n`);
    
    // Script de copie vers le blog
    const copyScript = `
# Script de publication des articles
# Exécuter depuis PowerShell

$source = "${this.stagingDir}"
$dest = "${this.blogDir}"

Write-Host "Copie des articles vers le blog..." -ForegroundColor Green

Get-ChildItem -Path $source -Filter "*.md" | ForEach-Object {
    Copy-Item $_.FullName -Destination $dest -Force
    Write-Host "✅ Copié : $($_.Name)" -ForegroundColor Cyan
}

Write-Host "\\nTerminé ! ${successfulArticles.length} articles copiés." -ForegroundColor Green
`;
    
    const scriptPath = path.join(this.stagingDir, 'publish-to-blog.ps1');
    await fs.writeFile(scriptPath, copyScript, 'utf8');
    
    console.log('   ✅ Script de publication créé : publish-to-blog.ps1');
    
    // Instructions
    console.log('\n📋 INSTRUCTIONS DE PUBLICATION :');
    console.log('═'.repeat(40));
    console.log('\n1. VÉRIFIER LES ARTICLES :');
    console.log(`   cd ${this.stagingDir}`);
    console.log('   # Ouvrir et vérifier quelques articles\n');
    
    console.log('2. COPIER VERS LE BLOG :');
    console.log('   .\\publish-to-blog.ps1\n');
    
    console.log('3. TESTER LOCALEMENT :');
    console.log('   cd C:\\Users\\Samuel\\Documents\\prizmia');
    console.log('   npm run dev');
    console.log('   # Vérifier sur http://localhost:4321\n');
    
    console.log('4. DÉPLOYER :');
    console.log('   git add .');
    console.log(`   git commit -m "Ajout de ${successfulArticles.length} nouveaux articles"`);
    console.log('   git push\n');
    
    console.log('   → Netlify déploiera automatiquement !');
  }

  /**
   * RAPPORT FINAL
   */
  async generateReport() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000 / 60);
    
    console.log('\n\n📊 RAPPORT FINAL');
    console.log('═'.repeat(60));
    
    console.log(`\nDurée totale : ${duration} minutes`);
    console.log(`Articles générés : ${this.stats.generated}/${this.articles.length}`);
    console.log(`Échecs : ${this.stats.failed}`);
    
    if (this.stats.generated > 0) {
      console.log('\n✅ ARTICLES RÉUSSIS :');
      this.stats.results
        .filter(r => r.success)
        .forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.article.titre}`);
          console.log(`      📁 ${r.file}`);
          console.log(`      ⏱️  ${r.duration}s`);
        });
    }
    
    if (this.stats.failed > 0) {
      console.log('\n❌ ÉCHECS :');
      this.stats.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.article.titre}`);
          console.log(`     Erreur : ${r.error}`);
        });
    }
    
    // Sauvegarder le rapport
    const reportPath = path.join(
      this.outputDir,
      '06-rapports',
      `batch-production-${new Date().toISOString().split('T')[0]}.json`
    );
    
    await fs.writeFile(
      reportPath,
      JSON.stringify(this.stats, null, 2),
      'utf8'
    );
    
    console.log(`\n💾 Rapport sauvegardé : ${reportPath}`);
    
    // Répartition par catégorie
    console.log('\n📊 RÉPARTITION PAR CATÉGORIE :');
    const categories = {};
    this.stats.results
      .filter(r => r.success)
      .forEach(r => {
        const cat = r.article.category;
        categories[cat] = (categories[cat] || 0) + 1;
      });
    
    for (const [cat, count] of Object.entries(categories)) {
      console.log(`   ${cat} : ${count} articles`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 PRODUCTION BATCH TERMINÉE AVEC SUCCÈS !');
  }

  /**
   * UTILITAIRES
   */
  
  slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); // Limiter la longueur
  }

  fixEncoding(text) {
    const replacements = {
      'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â', 'Ãª': 'ê',
      'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã§': 'ç', 'Ã®': 'î',
      'Ã¯': 'ï', 'Å"': 'œ', 'Ã‰': 'É', 'Ãˆ': 'È', 'Ã€': 'À',
      'â€™': "'", 'â€œ': '"', 'â€': '"', 'â€¦': '...',
      'â€"': '—', 'â€"': '–', 'â„¢': '™', 'Â©': '©'
    };
    
    let fixed = text;
    for (const [bad, good] of Object.entries(replacements)) {
      fixed = fixed.replace(new RegExp(bad, 'g'), good);
    }
    return fixed;
  }

  generateDescription(content, article) {
    // Chercher le premier paragraphe significatif
    const lines = content.split('\n');
    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned.length > 60 && !cleaned.startsWith('#') && !cleaned.startsWith('*')) {
        return cleaned.substring(0, 150).replace(/[*_`]/g, '') + '...';
      }
    }
    
    // Sinon, utiliser le focus de l'article
    return article.focus.substring(0, 150) + '...';
  }

  pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * FONCTION PRINCIPALE
 */
async function main() {
  const production = new BatchProductionOptimized();
  
  try {
    console.log('\n🚀 DÉMARRAGE DE LA PRODUCTION BATCH OPTIMISÉE');
    console.log('═'.repeat(60));
    console.log('Système : Prizm AI');
    console.log('Objectif : 10 articles de qualité');
    console.log('Date : ' + new Date().toLocaleDateString('fr-FR'));
    console.log();
    
    await production.run();
    
    console.log('\n✨ Production terminée avec succès !');
    console.log('\nLes articles sont dans : articles-ready-to-publish/');
    console.log('Suivez les instructions ci-dessus pour publier.');
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE :', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Lancer si exécuté directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BatchProductionOptimized };