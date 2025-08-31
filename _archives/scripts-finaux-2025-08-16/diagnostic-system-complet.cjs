const fs = require('fs').promises;
const path = require('path');

/**
 * DIAGNOSTIC COMPLET DU SYSTÈME PRIZM AI
 * Analyse l'état actuel avant production batch
 * 
 * UTILISATION :
 * Sauvegarder ce fichier comme : diagnostic-system-complet.cjs
 * Lancer avec : node diagnostic-system-complet.cjs
 */

async function diagnosticComplet() {
  const BASE_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\pipelines\\content-generation';
  const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';
  
  console.log('\n🔍 DIAGNOSTIC COMPLET DU SYSTÈME PRIZM AI');
  console.log('═'.repeat(60));
  console.log(`Date : ${new Date().toLocaleString('fr-FR')}\n`);
  
  const rapport = {
    date: new Date().toISOString(),
    directories: {},
    corpus: { total: 0, recent: 0, list: [] },
    articles: {
      factuels: { total: 0, list: [] },
      conversationnels: { total: 0, list: [] },
      finaux: { total: 0, list: [] }
    },
    blog: { total: 0, categories: {}, list: [] },
    pipeline: { status: '', lastRun: null },
    recommendations: []
  };

  try {
    // 1. VÉRIFIER LA STRUCTURE DES DOSSIERS
    console.log('📁 ANALYSE DE LA STRUCTURE\n');
    
    const dirs = [
      '01-veille',
      '02-corpus', 
      '03-articles-factuels',
      '04-articles-conversationnels',
      '05-articles-finaux',
      '06-rapports',
      '07-archives'
    ];
    
    for (const dir of dirs) {
      const fullPath = path.join(BASE_DIR, 'output', dir);
      try {
        const files = await fs.readdir(fullPath);
        const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.json'));
        
        rapport.directories[dir] = {
          exists: true,
          files: mdFiles.length,
          list: mdFiles.slice(0, 5) // Premiers fichiers seulement
        };
        
        console.log(`   ✅ ${dir}/ : ${mdFiles.length} fichiers`);
        
        // Analyser spécifiquement les corpus
        if (dir === '02-corpus') {
          rapport.corpus.total = mdFiles.length;
          
          // Vérifier les corpus récents (moins de 7 jours)
          for (const file of mdFiles) {
            const stats = await fs.stat(path.join(fullPath, file));
            const age = (Date.now() - stats.mtime) / (1000 * 60 * 60 * 24);
            
            if (age < 7) rapport.corpus.recent++;
            
            // Extraire le sujet du nom du fichier
            const sujet = file.replace(/corpus-enrichi-|\.json/g, '').replace(/-/g, ' ');
            rapport.corpus.list.push({
              file: file,
              sujet: sujet,
              age: Math.round(age),
              date: stats.mtime.toLocaleDateString('fr-FR')
            });
          }
        }
        
        // Analyser les articles
        if (dir === '03-articles-factuels') {
          rapport.articles.factuels.total = mdFiles.length;
          rapport.articles.factuels.list = mdFiles.slice(-5); // 5 derniers
        }
        
        if (dir === '04-articles-conversationnels') {
          rapport.articles.conversationnels.total = mdFiles.length;
          rapport.articles.conversationnels.list = mdFiles.slice(-5);
        }
        
        if (dir === '05-articles-finaux') {
          rapport.articles.finaux.total = mdFiles.length;
          rapport.articles.finaux.list = mdFiles.slice(-5);
        }
        
      } catch (error) {
        rapport.directories[dir] = { exists: false, error: error.message };
        console.log(`   ❌ ${dir}/ : INACCESSIBLE`);
      }
    }
    
    // 2. ANALYSER LES CORPUS DISPONIBLES
    console.log('\n📚 CORPUS DISPONIBLES\n');
    
    if (rapport.corpus.total > 0) {
      console.log(`   Total : ${rapport.corpus.total} corpus`);
      console.log(`   Récents (< 7 jours) : ${rapport.corpus.recent}`);
      console.log('\n   Liste des corpus :');
      
      rapport.corpus.list.slice(0, 10).forEach(c => {
        console.log(`   - ${c.sujet} (${c.date}, ${c.age}j)`);
      });
      
      if (rapport.corpus.total > 10) {
        console.log(`   ... et ${rapport.corpus.total - 10} autres`);
      }
    } else {
      console.log('   ⚠️  Aucun corpus trouvé');
      rapport.recommendations.push('Créer des corpus avant de lancer la production');
    }
    
    // 3. ANALYSER LES ARTICLES EXISTANTS
    console.log('\n📝 ARTICLES GÉNÉRÉS\n');
    
    console.log(`   Factuels : ${rapport.articles.factuels.total}`);
    console.log(`   Conversationnels : ${rapport.articles.conversationnels.total}`);
    console.log(`   Finaux : ${rapport.articles.finaux.total}`);
    
    if (rapport.articles.finaux.total > 0) {
      console.log('\n   Derniers articles finaux :');
      rapport.articles.finaux.list.forEach(a => {
        console.log(`   - ${a}`);
      });
    }
    
    // 4. VÉRIFIER LE BLOG
    console.log('\n🌐 ÉTAT DU BLOG\n');
    
    try {
      const blogFiles = await fs.readdir(BLOG_DIR);
      const blogArticles = blogFiles.filter(f => f.endsWith('.md'));
      rapport.blog.total = blogArticles.length;
      
      console.log(`   Articles publiés : ${blogArticles.length}`);
      
      // Analyser les catégories
      for (const file of blogArticles) {
        try {
          const content = await fs.readFile(path.join(BLOG_DIR, file), 'utf8');
          const categoryMatch = content.match(/category:\s*["']?([^"'\n]+)["']?/);
          
          if (categoryMatch) {
            const cat = categoryMatch[1];
            rapport.blog.categories[cat] = (rapport.blog.categories[cat] || 0) + 1;
          }
          
          rapport.blog.list.push(file);
        } catch (e) {
          // Ignorer les erreurs de lecture
        }
      }
      
      console.log('\n   Répartition par catégorie :');
      for (const [cat, count] of Object.entries(rapport.blog.categories)) {
        console.log(`   - ${cat} : ${count} articles`);
      }
      
    } catch (error) {
      console.log(`   ❌ Impossible d'accéder au blog : ${error.message}`);
    }
    
    // 5. VÉRIFIER LE PIPELINE
    console.log('\n⚙️  ÉTAT DU PIPELINE\n');
    
    try {
      // Vérifier si le pipeline existe
      await fs.access(path.join(BASE_DIR, 'pipeline-v4-fixed.cjs'));
      console.log('   ✅ Pipeline v4 trouvé');
      rapport.pipeline.status = 'ready';
      
      // Vérifier le dernier rapport
      const rapportsDir = path.join(BASE_DIR, 'output', '06-rapports');
      const rapports = await fs.readdir(rapportsDir);
      const dernierRapport = rapports.filter(f => f.includes('pipeline')).sort().pop();
      
      if (dernierRapport) {
        const stats = await fs.stat(path.join(rapportsDir, dernierRapport));
        rapport.pipeline.lastRun = stats.mtime.toLocaleString('fr-FR');
        console.log(`   Dernière exécution : ${rapport.pipeline.lastRun}`);
      }
      
    } catch (error) {
      console.log('   ❌ Pipeline non trouvé ou inaccessible');
      rapport.pipeline.status = 'error';
      rapport.recommendations.push('Vérifier que pipeline-v4-fixed.cjs existe');
    }
    
    // 6. RECOMMANDATIONS
    console.log('\n💡 RECOMMANDATIONS POUR LA PRODUCTION BATCH\n');
    
    // Analyser et générer des recommandations
    if (rapport.corpus.total < 10) {
      rapport.recommendations.push(`Seulement ${rapport.corpus.total} corpus disponibles - envisager de créer plus de veilles`);
    }
    
    if (rapport.corpus.recent < 5) {
      rapport.recommendations.push('Peu de corpus récents - privilégier la création de nouvelles veilles');
    }
    
    if (rapport.articles.finaux.total > 5) {
      rapport.recommendations.push(`${rapport.articles.finaux.total} articles en attente de publication dans 05-articles-finaux/`);
    }
    
    const articlesManquants = {
      'essentiel-ia': 4 - (rapport.blog.categories['essentiel-ia'] || rapport.blog.categories['actualites'] || 0),
      'guides-pratiques': 4 - (rapport.blog.categories['guides-pratiques'] || rapport.blog.categories['guides'] || 0),
      'analyses': 2 - (rapport.blog.categories['analyses'] || rapport.blog.categories['analyses-decryptages'] || 0)
    };
    
    console.log('   Répartition recommandée pour atteindre 10 articles :');
    for (const [cat, needed] of Object.entries(articlesManquants)) {
      if (needed > 0) {
        console.log(`   - ${cat} : ${needed} articles à créer`);
        rapport.recommendations.push(`Créer ${needed} articles dans ${cat}`);
      }
    }
    
    // 7. DÉCISION FINALE
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 SYNTHÈSE ET DÉCISION\n');
    
    const peutProduire = rapport.pipeline.status === 'ready' && 
                         (rapport.corpus.total > 0 || true); // On peut toujours créer de nouvelles veilles
    
    if (peutProduire) {
      console.log('✅ SYSTÈME PRÊT POUR LA PRODUCTION BATCH');
      
      if (rapport.corpus.total >= 10) {
        console.log('\n   Stratégie : UTILISER LES CORPUS EXISTANTS');
        console.log('   → Génération rapide possible avec les corpus disponibles');
      } else {
        console.log('\n   Stratégie : CRÉER DE NOUVELLES VEILLES');
        console.log('   → Le pipeline créera automatiquement les corpus nécessaires');
      }
      
      console.log('\n   Actions recommandées :');
      console.log('   1. Lancer la production batch de 10 articles');
      console.log('   2. Vérifier la qualité après 2-3 articles');
      console.log('   3. Publier sur le blog une fois validés');
      
    } else {
      console.log('⚠️  CORRECTIONS NÉCESSAIRES AVANT PRODUCTION');
      rapport.recommendations.forEach(r => console.log(`   - ${r}`));
    }
    
    // 8. SAUVEGARDER LE RAPPORT
    const rapportPath = path.join(
      BASE_DIR, 
      'output', 
      '06-rapports',
      `diagnostic-${new Date().toISOString().split('T')[0]}.json`
    );
    
    await fs.writeFile(rapportPath, JSON.stringify(rapport, null, 2), 'utf8');
    console.log(`\n💾 Rapport complet sauvegardé : ${rapportPath}`);
    
    return rapport;
    
  } catch (error) {
    console.error('\n❌ ERREUR DURANT LE DIAGNOSTIC :', error.message);
    return null;
  }
}

// Exécuter
if (require.main === module) {
  diagnosticComplet()
    .then(() => {
      console.log('\n✨ Diagnostic terminé !');
      console.log('\nPour lancer la production batch :');
      console.log('node batch-production-optimized.js');
    })
    .catch(console.error);
}

module.exports = { diagnosticComplet };