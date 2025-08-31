const fs = require('fs').promises;
const path = require('path');

/**
 * SCRIPT D'AUDIT ET OPTIMISATION DES ARTICLES PRIZM AI
 * Date : 23 août 2025
 * 
 * Objectifs :
 * 1. Inventorier tous les articles disponibles
 * 2. Vérifier leur formatage
 * 3. Optimiser leur mise en forme pour publication
 * 4. Préparer le push sur Git
 */

class ArticleAuditor {
  constructor() {
    this.baseDir = 'C:\\Users\\Samuel\\Documents\\prizmia';
    this.contentDir = path.join(this.baseDir, 'pipelines', 'content-generation');
    this.blogDir = path.join(this.baseDir, 'src', 'content', 'blog');
    this.report = {
      articlesFinaux: [],
      articlesConversationnels: [],
      articlesPublies: [],
      articlesAPousser: [],
      problemes: []
    };
  }

  // Correction de l'encodage UTF-8
  fixEncoding(text) {
    const replacements = {
      'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã ': 'à', 'Ã¢': 'â',
      'Ã´': 'ô', 'Ã®': 'î', 'Ã¯': 'ï', 'Ã§': 'ç', 'Ã¹': 'ù',
      'Ã»': 'û', 'Å"': 'œ', 'Ã‰': 'É', 'Ãˆ': 'È', 'Ã€': 'À',
      'â€™': "'", 'â€œ': '"', 'â€': '"', 'â€"': '—', 'â€¦': '...',
      'Â ': ' ', 'â€¢': '•', 'â€º': '›', 'â€¹': '‹'
    };
    
    let fixed = text;
    for (const [bad, good] of Object.entries(replacements)) {
      fixed = fixed.replace(new RegExp(bad, 'g'), good);
    }
    return fixed;
  }

  // Vérifier et optimiser le frontmatter
  optimizeFrontmatter(content, filename) {
    const lines = content.split('\n');
    let frontmatterStart = -1;
    let frontmatterEnd = -1;
    
    // Trouver le frontmatter
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (frontmatterStart === -1) {
          frontmatterStart = i;
        } else {
          frontmatterEnd = i;
          break;
        }
      }
    }
    
    if (frontmatterStart === -1 || frontmatterEnd === -1) {
      // Créer un frontmatter par défaut
      const date = filename.match(/\d{4}-\d{2}-\d{2}/) ? 
                   filename.match(/\d{4}-\d{2}-\d{2}/)[0] : 
                   new Date().toISOString().split('T')[0];
      
      const title = this.extractTitle(content);
      const category = this.determineCategory(content);
      
      const newFrontmatter = `---
title: "${title}"
description: "Analyse approfondie et conseils pratiques pour les PME/ETI"
date: "${date}"
author: "Prizm AI"
categories: ["${category}"]
tags: ["IA", "PME", "Transformation digitale"]
image: "/images/blog/${this.slugify(title)}.jpg"
featured: false
readingTime: "${Math.ceil(content.split(' ').length / 250)} min"
---

`;
      return newFrontmatter + content;
    }
    
    return content;
  }

  // Extraire le titre du contenu
  extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1].replace(/["|']/g, '');
    }
    return "Article Prizm AI";
  }

  // Déterminer la catégorie selon le contenu
  determineCategory(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('guide') || contentLower.includes('comment') || 
        contentLower.includes('étapes') || contentLower.includes('tutoriel')) {
      return 'guides';
    }
    
    if (contentLower.includes('analyse') || contentLower.includes('décryptage') || 
        contentLower.includes('comprendre') || contentLower.includes('enjeux')) {
      return 'analyses';
    }
    
    return 'actualites';
  }

  // Créer un slug à partir du titre
  slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  // Scanner un dossier
  async scanDirectory(dir, type) {
    try {
      const files = await fs.readdir(dir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      console.log(`\n📁 ${type} : ${mdFiles.length} articles trouvés`);
      
      for (const file of mdFiles) {
        const fullPath = path.join(dir, file);
        const content = await fs.readFile(fullPath, 'utf8');
        const stats = await fs.stat(fullPath);
        
        const articleInfo = {
          filename: file,
          path: fullPath,
          size: Math.round(stats.size / 1024) + ' KB',
          wordCount: content.split(/\s+/).length,
          hasEncoding: content.includes('Ã©') || content.includes('â€™'),
          hasFrontmatter: content.startsWith('---'),
          title: this.extractTitle(content),
          category: this.determineCategory(content),
          lastModified: stats.mtime.toISOString().split('T')[0]
        };
        
        this.report[type].push(articleInfo);
        
        // Signaler les problèmes
        if (articleInfo.hasEncoding) {
          this.report.problemes.push(`⚠️ Encodage : ${file}`);
        }
        if (!articleInfo.hasFrontmatter) {
          this.report.problemes.push(`⚠️ Pas de frontmatter : ${file}`);
        }
      }
    } catch (err) {
      console.log(`   ⚠️ Impossible d'accéder à ${dir}`);
    }
  }

  // Préparer les articles pour publication
  async prepareForPublication() {
    console.log('\n🔧 PRÉPARATION POUR PUBLICATION\n');
    
    const outputDir = path.join(this.contentDir, 'output', '00-prets-pour-publication');
    
    // Créer le dossier s'il n'existe pas
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {}
    
    // Traiter les articles finaux et conversationnels
    const allArticles = [
      ...this.report.articlesFinaux,
      ...this.report.articlesConversationnels
    ];
    
    for (const article of allArticles) {
      // Vérifier si déjà publié
      const isPublished = this.report.articlesPublies.some(
        pub => pub.title === article.title
      );
      
      if (!isPublished) {
        console.log(`   📝 Préparation : ${article.filename}`);
        
        // Lire et optimiser le contenu
        let content = await fs.readFile(article.path, 'utf8');
        
        // Corriger l'encodage
        if (article.hasEncoding) {
          content = this.fixEncoding(content);
        }
        
        // Optimiser le frontmatter
        if (!article.hasFrontmatter) {
          content = this.optimizeFrontmatter(content, article.filename);
        }
        
        // Sauvegarder dans le dossier de préparation
        const newFilename = `${article.lastModified}-${this.slugify(article.title)}.md`;
        const newPath = path.join(outputDir, newFilename);
        
        await fs.writeFile(newPath, content, 'utf8');
        
        this.report.articlesAPousser.push({
          original: article.filename,
          nouveau: newFilename,
          categorie: article.category,
          mots: article.wordCount
        });
      }
    }
  }

  // Générer le rapport
  generateReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RAPPORT D\'AUDIT COMPLET');
    console.log('═'.repeat(60));
    
    console.log('\n📚 INVENTAIRE :');
    console.log(`   • Articles finaux : ${this.report.articlesFinaux.length}`);
    console.log(`   • Articles conversationnels : ${this.report.articlesConversationnels.length}`);
    console.log(`   • Déjà publiés sur le blog : ${this.report.articlesPublies.length}`);
    console.log(`   • Prêts à pousser : ${this.report.articlesAPousser.length}`);
    
    if (this.report.problemes.length > 0) {
      console.log('\n⚠️ PROBLÈMES DÉTECTÉS :');
      this.report.problemes.forEach(p => console.log(`   ${p}`));
    }
    
    if (this.report.articlesAPousser.length > 0) {
      console.log('\n🚀 ARTICLES PRÊTS À PUBLIER :');
      this.report.articlesAPousser.forEach(a => {
        console.log(`   • ${a.nouveau}`);
        console.log(`     Catégorie : ${a.categorie} | ${a.mots} mots`);
      });
      
      console.log('\n📝 COMMANDES GIT POUR PUBLIER :');
      console.log('   cd C:\\Users\\Samuel\\Documents\\prizmia');
      console.log('   git pull origin master');
      console.log('   xcopy pipelines\\content-generation\\output\\00-prets-pour-publication\\*.md src\\content\\blog\\ /Y');
      console.log('   git add src/content/blog/*.md');
      console.log('   git commit -m "feat: ajout de ' + this.report.articlesAPousser.length + ' nouveaux articles"');
      console.log('   git push origin master');
    }
    
    // Sauvegarder le rapport
    const reportPath = path.join(this.contentDir, 'output', '06-rapports', 
                                  `audit-${new Date().toISOString().split('T')[0]}.json`);
    
    fs.writeFile(reportPath, JSON.stringify(this.report, null, 2))
      .then(() => console.log(`\n💾 Rapport sauvegardé : ${reportPath}`))
      .catch(() => {});
  }

  // Lancer l'audit complet
  async run() {
    console.log('\n🔍 AUDIT COMPLET DU SYSTÈME PRIZM AI');
    console.log('Date : ' + new Date().toLocaleString('fr-FR'));
    console.log('=' .repeat(60));
    
    // Scanner les dossiers
    await this.scanDirectory(
      path.join(this.contentDir, 'output', '05-articles-finaux'),
      'articlesFinaux'
    );
    
    await this.scanDirectory(
      path.join(this.contentDir, 'output', '04-articles-conversationnels'),
      'articlesConversationnels'
    );
    
    await this.scanDirectory(this.blogDir, 'articlesPublies');
    
    // Préparer pour publication
    await this.prepareForPublication();
    
    // Générer le rapport
    this.generateReport();
  }
}

// Lancer l'audit
const auditor = new ArticleAuditor();
auditor.run().catch(console.error);