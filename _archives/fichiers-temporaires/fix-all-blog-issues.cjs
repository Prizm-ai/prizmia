// fix-all-blog-issues.cjs
// Version simplifiée - Corrige uniquement les dates pour faire fonctionner le site
const fs = require('fs').promises;
const path = require('path');

async function fixDates() {
  const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
  
  console.log('\n🔧 CORRECTION DES DATES DES ARTICLES');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Lire tous les fichiers markdown
    const files = await fs.readdir(BLOG_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    console.log(`Nombre d'articles trouvés : ${mdFiles.length}\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const file of mdFiles) {
      const filepath = path.join(BLOG_DIR, file);
      
      try {
        let content = await fs.readFile(filepath, 'utf8');
        let modified = false;
        
        // Extraire le frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          let frontmatter = frontmatterMatch[1];
          
          // Chercher la ligne pubDate
          const pubDateMatch = frontmatter.match(/^pubDate:\s*(.+)$/m);
          
          if (pubDateMatch) {
            const currentValue = pubDateMatch[1].trim();
            
            // Si la date n'a pas le format complet avec l'heure
            if (!currentValue.includes('T')) {
              // Extraire la date (format YYYY-MM-DD)
              const dateMatch = currentValue.match(/(\d{4}-\d{2}-\d{2})/);
              
              if (dateMatch) {
                const date = dateMatch[1];
                // Remplacer par le format ISO avec heure
                const newPubDate = `pubDate: "${date}T00:00:00.000Z"`;
                frontmatter = frontmatter.replace(pubDateMatch[0], newPubDate);
                modified = true;
                
                // Reconstruire le contenu
                content = content.replace(frontmatterMatch[0], `---\n${frontmatter}\n---`);
                
                // Sauvegarder le fichier
                await fs.writeFile(filepath, content, 'utf8');
                console.log(`✅ Corrigé : ${file}`);
                console.log(`   Date : ${date} -> ${date}T00:00:00.000Z`);
                fixed++;
              }
            } else {
              console.log(`⏭️  Déjà OK : ${file}`);
            }
          } else {
            // Pas de pubDate trouvé, on l'ajoute basé sur le nom de fichier
            const dateFromFilename = file.match(/^(\d{4}-\d{2}-\d{2})/);
            if (dateFromFilename) {
              const date = dateFromFilename[1];
              frontmatter += `\npubDate: "${date}T00:00:00.000Z"`;
              modified = true;
              
              content = content.replace(frontmatterMatch[0], `---\n${frontmatter}\n---`);
              await fs.writeFile(filepath, content, 'utf8');
              console.log(`✅ Date ajoutée : ${file}`);
              fixed++;
            }
          }
        } else {
          console.log(`⚠️  Pas de frontmatter : ${file}`);
        }
        
      } catch (error) {
        console.log(`❌ Erreur avec ${file}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ :');
    console.log(`   Articles corrigés : ${fixed}`);
    console.log(`   Déjà OK : ${mdFiles.length - fixed - errors}`);
    console.log(`   Erreurs : ${errors}`);
    
    if (fixed > 0) {
      console.log('\n✨ Les dates ont été corrigées !');
      console.log('\n🚀 PROCHAINES ÉTAPES :');
      console.log('1. Arrêter le serveur dev actuel (Ctrl+C)');
      console.log('2. Relancer : npm run dev');
      console.log('3. Vérifier sur http://localhost:4321/blog');
      console.log('\nNote : Les caractères spéciaux (é, è, à) restent à corriger');
      console.log('mais le site devrait maintenant fonctionner.');
    } else {
      console.log('\n✅ Toutes les dates sont déjà au bon format.');
    }
    
  } catch (error) {
    console.error('❌ Erreur globale :', error.message);
  }
}

// Lancer le script
fixDates().catch(console.error);