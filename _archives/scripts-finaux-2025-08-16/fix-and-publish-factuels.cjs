// fix-and-publish-factuels.cjs
// Script pour corriger l'encodage et publier les 4 articles factuels
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const BASE = 'C:\\Users\\Samuel\\Documents\\prizmia\\pipelines\\content-generation';
  const BLOG = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
  
  console.log('\n📚 PUBLICATION DES ARTICLES FACTUELS');
  console.log('═'.repeat(60));
  
  // Les 4 articles factuels à traiter
  const articles = [
    {
      source: '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-m-factuel.md',
      titre: 'Automatiser sa prospection commerciale avec l\'IA : méthode en 5 étapes',
      category: 'guides',
      emoji: '📈'
    },
    {
      source: '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites-factuel.md',
      titre: 'ChatGPT pour les avocats : cas d\'usage et limites',
      category: 'guides',
      emoji: '⚖️'
    },
    {
      source: '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d-factuel.md',
      titre: 'L\'IA dans la comptabilité : automatisation et gains de productivité',
      category: 'actualites',
      emoji: '💰'
    },
    {
      source: '2025-08-16-r-glementation-ia-europ-enne-guide-de-conformit-pr-factuel.md',
      titre: 'Réglementation IA européenne : guide de conformité pratique pour PME',
      category: 'actualites',
      emoji: '📋'
    }
  ];
  
  let published = 0;
  const date = new Date().toISOString().split('T')[0];
  
  for (const article of articles) {
    console.log(`\n📄 Traitement : ${article.titre}`);
    
    try {
      // Lire le contenu de l'article factuel
      const sourcePath = path.join(BASE, 'output', '03-articles-factuels', article.source);
      let contenu = await fs.readFile(sourcePath, 'utf8');
      
      // Corriger l'encodage
      contenu = corrigerEncodage(contenu);
      
      // Remplacer ou ajouter le frontmatter correct
      contenu = corrigerFrontmatter(contenu, article, date);
      
      // Créer le nom de fichier final
      const slug = slugify(article.titre);
      const filename = `${date}-${slug}.md`;
      const blogPath = path.join(BLOG, filename);
      
      // Sauvegarder dans le blog
      await fs.writeFile(blogPath, contenu, 'utf8');
      
      console.log(`   ✅ Publié : ${filename}`);
      console.log(`   📂 Catégorie : ${article.category}`);
      published++;
      
    } catch (error) {
      console.log(`   ❌ Erreur : ${error.message}`);
    }
  }
  
  // Créer aussi une copie de sauvegarde
  const backupDir = path.join(BASE, 'articles-factuels-publies');
  await fs.mkdir(backupDir, { recursive: true });
  
  for (const article of articles) {
    try {
      const sourcePath = path.join(BASE, 'output', '03-articles-factuels', article.source);
      let contenu = await fs.readFile(sourcePath, 'utf8');
      contenu = corrigerEncodage(contenu);
      contenu = corrigerFrontmatter(contenu, article, date);
      
      const slug = slugify(article.titre);
      const filename = `${date}-${slug}.md`;
      const backupPath = path.join(backupDir, filename);
      
      await fs.writeFile(backupPath, contenu, 'utf8');
    } catch (error) {
      // Ignorer les erreurs de backup
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n✨ RÉSUMÉ`);
  console.log(`   Articles publiés : ${published}/4`);
  console.log(`   Destination : ${BLOG}`);
  console.log(`   Backup : ${backupDir}`);
  
  console.log('\n📋 PROCHAINES ÉTAPES :');
  console.log('1. Tester localement :');
  console.log('   cd C:\\Users\\Samuel\\Documents\\prizmia');
  console.log('   npm run dev');
  console.log('   # Vérifier sur http://localhost:4321\n');
  
  console.log('2. Déployer :');
  console.log('   git add .');
  console.log(`   git commit -m "Ajout de ${published} articles factuels sur l'IA"`);
  console.log('   git push\n');
  
  console.log('✅ Script terminé !');
}

function corrigerEncodage(texte) {
  const replacements = {
    'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â', 'Ãª': 'ê',
    'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã§': 'ç', 'Ã®': 'î',
    'Ã¯': 'ï', 'Å"': 'œ', 'Ã‰': 'É', 'Ãˆ': 'È', 'Ã€': 'À',
    'â€™': "'", 'â€œ': '"', 'â€': '"', 'â€¦': '...',
    'â€"': '—', 'â€¢': '•', 'â„¢': '™', 'Â©': '©',
    'Ã‡': 'Ç', 'Ãƒ': 'À', 'Ã"': 'Ô', 'ÃŠ': 'Ê'
  };
  
  let fixed = texte;
  for (const [bad, good] of Object.entries(replacements)) {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  }
  return fixed;
}

function corrigerFrontmatter(contenu, article, date) {
  // Supprimer l'ancien frontmatter s'il existe
  contenu = contenu.replace(/^---[\s\S]*?---\n*/m, '');
  
  // Extraire le titre du contenu si possible
  const titleMatch = contenu.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace(/\|.*$/, '').trim() : article.titre;
  
  // Calculer le temps de lecture
  const words = contenu.split(/\s+/).length;
  const readingTime = Math.ceil(words / 250);
  
  // Créer le nouveau frontmatter
  const frontmatter = `---
title: "${title}"
description: "Analyse approfondie basée sur des sources vérifiées. Guide pratique pour les PME et ETI françaises."
pubDate: ${date}
author: "L'équipe Prizm AI"
emoji: "${article.emoji}"
category: "${article.category}"
featured: false
readingTime: "${readingTime} min"
---

`;
  
  return frontmatter + contenu;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// Lancer le script
main().catch(console.error);