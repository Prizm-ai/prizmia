// publish-factuels-final.cjs
// Script pour formater et publier les articles factuels sur le blog Prizm AI
const fs = require('fs').promises;
const path = require('path');

async function publishFactuels() {
  const FACTUELS_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\pipelines\\content-generation\\output\\03-articles-factuels';
  const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
  
  console.log('\n📚 PUBLICATION DES ARTICLES FACTUELS SUR LE BLOG');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Lister tous les articles factuels
    const files = await fs.readdir(FACTUELS_DIR);
    const articleFiles = files.filter(f => 
      f.endsWith('.md') && 
      f.includes('2025-08-16') // Articles du jour
    );
    
    console.log(`📊 Articles factuels trouvés : ${articleFiles.length}\n`);
    
    let published = 0;
    let skipped = 0;
    
    for (const filename of articleFiles) {
      console.log(`\n📄 Traitement : ${filename}`);
      
      try {
        // Lire l'article factuel
        const sourcePath = path.join(FACTUELS_DIR, filename);
        let content = await fs.readFile(sourcePath, 'utf8');
        
        // Extraire le titre du contenu (après le # principal)
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (!titleMatch) {
          console.log(`   ⚠️  Pas de titre trouvé, article ignoré`);
          skipped++;
          continue;
        }
        
        // Nettoyer le titre (enlever les parties après |)
        const title = titleMatch[1].replace(/\|.*$/, '').trim();
        
        // Déterminer la catégorie et l'emoji selon le contenu du titre
        let category = 'actualites';
        let emoji = '🚀';
        
        const titleLower = title.toLowerCase();
        
        // Détection de la catégorie basée sur le titre
        if (titleLower.includes('guide') || 
            titleLower.includes('implémenter') || 
            titleLower.includes('implementer') ||
            titleLower.includes('créer') ||
            titleLower.includes('automatiser') ||
            titleLower.includes('méthode') ||
            titleLower.includes('étapes') ||
            titleLower.includes('workflow') ||
            titleLower.includes('comment')) {
          category = 'guides';
          emoji = '📚';
        } else if (titleLower.includes('analyse') || 
                   titleLower.includes('adoption') || 
                   titleLower.includes('état des lieux') ||
                   titleLower.includes('tendances') ||
                   titleLower.includes('statistiques') ||
                   titleLower.includes('chiffres')) {
          category = 'analyses';
          emoji = '📊';
        } else if (titleLower.includes('avocat') ||
                   titleLower.includes('juridique') ||
                   titleLower.includes('droit')) {
          emoji = '⚖️';
          category = 'guides';
        } else if (titleLower.includes('comptabilité') ||
                   titleLower.includes('comptable')) {
          emoji = '💰';
        } else if (titleLower.includes('prospection') ||
                   titleLower.includes('commercial') ||
                   titleLower.includes('vente')) {
          emoji = '📈';
          category = 'guides';
        } else if (titleLower.includes('réglementation') ||
                   titleLower.includes('conformité') ||
                   titleLower.includes('rgpd')) {
          emoji = '📋';
        } else if (titleLower.includes('comparatif') ||
                   titleLower.includes('versus') ||
                   titleLower.includes(' vs ')) {
          emoji = '⚔️';
        } else if (titleLower.includes('cybersécurité') ||
                   titleLower.includes('sécurité')) {
          emoji = '🔒';
          category = 'analyses';
        }
        
        // Générer une description basée sur le titre et la catégorie
        let description = '';
        if (category === 'guides') {
          description = `Guide pratique pour les PME et ETI : ${title.substring(0, 100)}`;
        } else if (category === 'analyses') {
          description = `Analyse approfondie : ${title.substring(0, 120)}`;
        } else {
          description = `Actualité IA pour les entreprises : ${title.substring(0, 110)}`;
        }
        
        // Si la description est trop longue, la tronquer proprement
        if (description.length > 155) {
          description = description.substring(0, 152) + '...';
        }
        
        // Calculer le temps de lecture (250 mots par minute)
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 250));
        
        // Créer le frontmatter au format exact attendu par Astro
        const frontmatter = `---
title: "${title}"
description: "${description}"
pubDate: 2025-08-16
author: "L'équipe Prizm AI"
emoji: "${emoji}"
category: "${category}"
featured: false
readingTime: "${readingTime} min"
---

`;
        
        // Assembler l'article final
        const finalContent = frontmatter + content;
        
        // Créer le nom de fichier pour le blog
        // Nettoyer le titre pour en faire un slug
        const slug = title.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
          .replace(/[^a-z0-9]+/g, '-')     // Remplacer les caractères spéciaux par -
          .replace(/^-+|-+$/g, '')         // Enlever les - au début et à la fin
          .substring(0, 60);                // Limiter la longueur
        
        const blogFilename = `2025-08-16-${slug}.md`;
        const blogPath = path.join(BLOG_DIR, blogFilename);
        
        // Vérifier si le fichier existe déjà
        try {
          await fs.access(blogPath);
          console.log(`   ⏭️  Fichier déjà existant, ignoré`);
          skipped++;
          continue;
        } catch {
          // Le fichier n'existe pas, on peut continuer
        }
        
        // Sauvegarder dans le blog
        await fs.writeFile(blogPath, finalContent, 'utf8');
        
        console.log(`   ✅ Publié : ${blogFilename}`);
        console.log(`      📂 Catégorie : ${category}`);
        console.log(`      ${emoji} Emoji : ${emoji}`);
        console.log(`      ⏱️  Temps de lecture : ${readingTime} min`);
        published++;
        
      } catch (error) {
        console.log(`   ❌ Erreur : ${error.message}`);
        skipped++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ :');
    console.log(`   ✅ Articles publiés : ${published}`);
    console.log(`   ⏭️  Articles ignorés : ${skipped}`);
    console.log(`   📚 Total sur le blog : ${published + 1} articles (avec le manifeste)`);
    
    if (published > 0) {
      console.log('\n🚀 PROCHAINES ÉTAPES :');
      console.log('\n1. Ouvrir les articles dans VS Code pour vérifier :');
      console.log(`   code ${BLOG_DIR}`);
      console.log('\n2. Tester localement :');
      console.log('   cd C:\\Users\\Samuel\\Documents\\prizmia');
      console.log('   npm run dev');
      console.log('   # Ouvrir http://localhost:4321/blog');
      console.log('\n3. Si tout est OK, déployer :');
      console.log('   git add .');
      console.log(`   git commit -m "Ajout de ${published} articles factuels sur l'IA"`);
      console.log('   git push');
      console.log('\n💡 Note : Les caractères spéciaux peuvent apparaître mal dans PowerShell');
      console.log('   mais seront corrects dans VS Code et sur le site.');
    } else {
      console.log('\n⚠️ Aucun nouvel article à publier.');
      console.log('   Vérifiez le dossier des articles factuels.');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur globale :', error.message);
  }
}

// Lancer le script
publishFactuels().catch(console.error);