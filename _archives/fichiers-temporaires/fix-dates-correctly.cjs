// fix-dates-correctly.cjs
// Cette fois on met le BON format : pubDate: 2025-08-16 (sans guillemets ni heure)
const fs = require('fs').promises;
const path = require('path');

async function fixDatesCorrectly() {
  const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
  
  console.log('\n🔧 CORRECTION DÉFINITIVE DES DATES');
  console.log('='.repeat(60) + '\n');
  console.log('Format cible : pubDate: YYYY-MM-DD (sans guillemets ni heure)\n');
  
  try {
    // Lire tous les fichiers markdown
    const files = await fs.readdir(BLOG_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    console.log(`Articles à vérifier : ${mdFiles.length}\n`);
    
    let fixed = 0;
    
    for (const file of mdFiles) {
      // Ignorer le manifeste qui fonctionne déjà
      if (file === '2025-08-12-manifeste-prizm-ai.md') {
        console.log(`⏭️  Ignoré (déjà OK) : ${file}`);
        continue;
      }
      
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
            
            // Extraire juste la date YYYY-MM-DD
            const dateMatch = currentValue.match(/(\d{4}-\d{2}-\d{2})/);
            
            if (dateMatch) {
              const date = dateMatch[1];
              // Format simple sans guillemets ni heure (comme le manifeste)
              const newPubDate = `pubDate: ${date}`;
              
              // Ne modifier que si nécessaire
              if (pubDateMatch[0] !== newPubDate) {
                frontmatter = frontmatter.replace(pubDateMatch[0], newPubDate);
                modified = true;
                
                // Reconstruire le contenu
                content = content.replace(frontmatterMatch[0], `---\n${frontmatter}\n---`);
                
                // Sauvegarder
                await fs.writeFile(filepath, content, 'utf8');
                console.log(`✅ Corrigé : ${file}`);
                console.log(`   Avant : ${currentValue}`);
                console.log(`   Après : ${date}`);
                fixed++;
              } else {
                console.log(`⏭️  Déjà OK : ${file}`);
              }
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ Erreur avec ${file}: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ :');
    console.log(`   Articles corrigés : ${fixed}`);
    console.log(`   Articles ignorés/OK : ${mdFiles.length - fixed}`);
    
    if (fixed > 0) {
      console.log('\n✨ Les dates sont maintenant au BON format !');
      console.log('\n🚀 ACTIONS :');
      console.log('1. Arrêter le serveur (Ctrl+C)');
      console.log('2. Relancer : npm run dev');
      console.log('3. Vérifier : http://localhost:4321/blog');
      console.log('\nLes 5 articles devraient maintenant s\'afficher !');
    } else {
      console.log('\n✅ Tous les articles ont déjà le bon format.');
    }
    
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

// Lancer
fixDatesCorrectly().catch(console.error);