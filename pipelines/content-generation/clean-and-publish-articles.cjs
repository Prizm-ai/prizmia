/**
 * Script de nettoyage et publication propre des articles
 * Version 2.0 - Corrigée et testée
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  SOURCE_DIR: path.join(__dirname, 'output', '03-articles-factuels'),
  TARGET_DIR: path.join(__dirname, '..', '..', 'src', 'content', 'blog'),
  
  // Articles à publier (les 10 plus récents du 16 août)
  ARTICLES_TO_PUBLISH: [
    {
      source: '2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux-2025-factuel.md',
      title: "Adoption de l'IA dans les PME françaises : état des lieux 2025"
    },
    {
      source: '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-methode-en--factuel.md',
      title: "Automatiser sa prospection commerciale avec l'IA : méthode complète"
    },
    {
      source: '2025-08-16-creer-du-contenu-marketing-avec-l-ia-workflow-complet-et-out-factuel.md',
      title: "Créer du contenu marketing avec l'IA : workflow complet et outils"
    },
    {
      source: '2025-08-16-ia-generative-2025-les-outils-indispensables-pour-les-pme-fr-factuel.md',
      title: "IA générative 2025 : les outils indispensables pour les PME"
    },
    {
      source: '2025-08-16-ia-generative-pour-pme-en-2025-factuel.md',
      title: "IA générative pour PME en 2025 : guide pratique"
    },
    {
      source: '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet--factuel.md',
      title: "Implémenter ChatGPT dans votre service client : guide complet"
    },
    {
      source: '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites-factuel.md',
      title: "ChatGPT pour les avocats : cas d'usage et limites"
    },
    {
      source: '2025-08-16-intelligence-artificielle-et-transformation-digita-factuel.md',
      title: "Intelligence artificielle et transformation digitale des PME"
    },
    {
      source: '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d-factuel.md',
      title: "L'IA dans la comptabilité : automatisation et gains de productivité"
    },
    {
      source: '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet-factuel.md',
      title: "Implémenter ChatGPT dans votre service client : guide pratique"
    }
  ]
};

// Étape 1 : Nettoyer les anciens articles mal générés
function cleanOldArticles() {
  console.log('\n🧹 NETTOYAGE DES ARTICLES MAL GÉNÉRÉS');
  console.log('=' .repeat(60));
  
  const articlesToDelete = [
    '2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux.md',
    '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-methode-en-.md',
    '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites.md',
    '2025-08-16-creer-du-contenu-marketing-avec-l-ia-workflow-complet-et-out.md',
    '2025-08-16-ia-generative-2025-les-outils-indispensables-pour-les-pme-fr.md',
    '2025-08-16-ia-generative-pour-pme-en.md',
    '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet-.md',
    '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet.md',
    '2025-08-16-intelligence-artificielle-et-transformation-digita.md',
    '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d.md'
  ];
  
  let deleted = 0;
  articlesToDelete.forEach(file => {
    const filePath = path.join(CONFIG.TARGET_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  ✓ Supprimé : ${file}`);
      deleted++;
    }
  });
  
  console.log(`\n✅ ${deleted} articles supprimés`);
  return deleted;
}

// Étape 2 : Extraire le titre depuis le contenu si nécessaire
function extractTitle(content) {
  // Chercher dans le frontmatter existant
  const frontmatterMatch = content.match(/title:\s*["'](.+?)["']/);
  if (frontmatterMatch) {
    return frontmatterMatch[1];
  }
  
  // Chercher le premier # titre
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1];
  }
  
  return null;
}

// Étape 3 : Nettoyer le nom de fichier pour publication
function cleanFileName(fileName) {
  return fileName
    .replace(/-factuel\.md$/, '.md')
    .replace(/--+/g, '-')
    .replace(/-(\d+)\.md$/, '.md');
}

// Étape 4 : Créer un frontmatter propre pour Astro
function createFrontmatter(title, content) {
  // Calculer le temps de lecture
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  // Déterminer l'emoji selon le sujet
  let emoji = '🚀';
  if (title.toLowerCase().includes('ia générative')) emoji = '🤖';
  else if (title.toLowerCase().includes('pme')) emoji = '🏢';
  else if (title.toLowerCase().includes('chatgpt')) emoji = '💬';
  else if (title.toLowerCase().includes('automatiser')) emoji = '⚡';
  else if (title.toLowerCase().includes('marketing')) emoji = '📈';
  else if (title.toLowerCase().includes('avocats')) emoji = '⚖️';
  else if (title.toLowerCase().includes('comptabilité')) emoji = '📊';
  else if (title.toLowerCase().includes('transformation')) emoji = '🔄';
  else if (title.toLowerCase().includes('prospection')) emoji = '🎯';
  
  return `---
title: "${title}"
description: "Guide pratique pour les PME : ${title}"
pubDate: 2025-08-16
author: "L'équipe Prizm AI"
emoji: "${emoji}"
category: "analyses"
featured: false
readingTime: "${readingTime} min"
---`;
}

// Étape 5 : Transformer les citations en format journalistique léger
function transformCitations(content) {
  let transformedContent = content;
  
  // Simplifier les citations - juste enlever les références lourdes
  // Remplacer (Source : XXX) par rien ou par ¹
  transformedContent = transformedContent.replace(/\(Source\s*:\s*[^)]+\)/g, '');
  
  // Pour les citations avec "Selon XXX" ou "D'après XXX", les garder telles quelles
  // car elles sont déjà dans un format acceptable
  
  return transformedContent;
}

// Étape 6 : Traiter un article complet
function processArticle(articleConfig, index) {
  console.log(`\n📄 [${index + 1}/10] ${articleConfig.title}`);
  
  const sourcePath = path.join(CONFIG.SOURCE_DIR, articleConfig.source);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`  ❌ Fichier source non trouvé`);
    return { success: false, error: 'Fichier non trouvé' };
  }
  
  try {
    // Lire le contenu avec le bon encodage
    let content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Supprimer le BOM si présent
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Extraire le contenu sans l'ancien frontmatter
    let mainContent = content;
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
    if (frontmatterRegex.test(content)) {
      mainContent = content.replace(frontmatterRegex, '');
    }
    
    // Transformer les citations
    mainContent = transformCitations(mainContent);
    console.log(`  ✓ Citations transformées`);
    
    // Créer le nouveau frontmatter
    const newFrontmatter = createFrontmatter(articleConfig.title, mainContent);
    
    // Assembler le contenu final
    const finalContent = `${newFrontmatter}\n\n${mainContent.trim()}\n`;
    
    // Générer le nom de fichier propre
    const targetFileName = cleanFileName(articleConfig.source);
    const targetPath = path.join(CONFIG.TARGET_DIR, targetFileName);
    
    // Écrire le fichier
    fs.writeFileSync(targetPath, finalContent, 'utf-8');
    console.log(`  ✓ Publié : ${targetFileName}`);
    console.log(`  ✓ ${finalContent.split(/\s+/).length} mots`);
    
    return { 
      success: true, 
      fileName: targetFileName,
      wordCount: finalContent.split(/\s+/).length
    };
    
  } catch (error) {
    console.error(`  ❌ Erreur : ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction principale
function main() {
  console.log('🚀 PUBLICATION PROPRE DES ARTICLES PRIZM AI - V2.0');
  console.log('=' .repeat(60));
  
  // Étape 1 : Nettoyer
  const deleted = cleanOldArticles();
  
  // Étape 2 : Publier proprement
  console.log('\n📝 PUBLICATION DES NOUVEAUX ARTICLES');
  console.log('=' .repeat(60));
  
  const results = CONFIG.ARTICLES_TO_PUBLISH.map((article, index) => 
    processArticle(article, index)
  );
  
  // Rapport final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Succès : ${successful.length}/10 articles`);
  console.log(`❌ Échecs : ${failed.length}/10 articles`);
  
  if (successful.length > 0) {
    const totalWords = successful.reduce((sum, r) => sum + r.wordCount, 0);
    const avgWords = Math.round(totalWords / successful.length);
    console.log(`📊 Moyenne : ${avgWords} mots par article`);
  }
  
  // Instructions finales
  console.log('\n' + '=' .repeat(60));
  console.log('📝 PROCHAINES ÉTAPES');
  console.log('=' .repeat(60));
  console.log('\n1. Tester le site localement :');
  console.log('   cd ../..');
  console.log('   npm run dev');
  console.log('   # Ouvrir http://localhost:4321\n');
  console.log('2. Si tout est OK, publier :');
  console.log('   git add src/content/blog/*.md');
  console.log('   git commit -m "Publication de 10 articles IA - Août 2025"');
  console.log('   git push\n');
  console.log('✨ Les articles seront automatiquement déployés sur Netlify !');
}

// Lancer le script
if (require.main === module) {
  main();
}