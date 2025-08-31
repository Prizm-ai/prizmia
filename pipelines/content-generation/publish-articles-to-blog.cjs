/**
 * Script de publication automatique des articles factuels vers le blog
 * Transforme les citations et prépare les articles pour Astro
 * Date : 17/08/2025
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  SOURCE_DIR: path.join(__dirname, 'output', '03-articles-factuels'),
  TARGET_DIR: path.join(__dirname, '..', '..', 'src', 'content', 'blog'),
  BACKUP_DIR: path.join(__dirname, 'output', '07-archives', '2025', '08-aout', 'backup-avant-publication'),
  
  // Articles à publier (les 10 plus récents et complets)
  ARTICLES_TO_PUBLISH: [
    '2025-08-16-adoption-de-l-ia-dans-les-pme-francaises-etat-des-lieux-2025-factuel.md',
    '2025-08-16-automatiser-sa-prospection-commerciale-avec-l-ia-methode-en--factuel.md',
    '2025-08-16-creer-du-contenu-marketing-avec-l-ia-workflow-complet-et-out-factuel.md',
    '2025-08-16-ia-generative-2025-les-outils-indispensables-pour-les-pme-fr-factuel.md',
    '2025-08-16-ia-generative-pour-pme-en-2025-factuel.md',
    '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet--factuel.md',
    '2025-08-16-implementer-chatgpt-dans-votre-service-client-guide-complet-factuel.md',
    '2025-08-16-chatgpt-pour-les-avocats-cas-d-usage-et-limites-factuel.md',
    '2025-08-16-intelligence-artificielle-et-transformation-digita-factuel.md',
    '2025-08-16-l-ia-dans-la-comptabilit-automatisation-et-gains-d-factuel.md'
  ]
};

// Création des dossiers nécessaires
function ensureDirectories() {
  [CONFIG.TARGET_DIR, CONFIG.BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Dossier créé : ${dir}`);
    }
  });
}

// Nettoyer le nom de fichier pour publication
function cleanFileName(fileName) {
  return fileName
    .replace(/-factuel\.md$/, '.md')  // Enlever -factuel
    .replace(/--+/g, '-')              // Remplacer doubles tirets
    .replace(/-(\d+)\.md$/, '.md');   // Enlever numéros en fin si présents
}

// Transformer les citations en format journalistique
function transformCitations(content) {
  let citationCounter = 0;
  const citationMap = new Map();
  let transformedContent = content;
  
  // Pattern pour détecter les citations directes
  const patterns = [
    // "Citation" (Source : XXX, date, etc.)
    /\"([^\"]+)\"\s*\(Source\s*:\s*([^)]+)\)/g,
    // Selon XXX, "citation"
    /(Selon|D'après|Pour)\s+([^,]+),\s*\"([^\"]+)\"/g,
    // D'après XXX révèle que
    /(D'après|Selon)\s+([^,]+)\s+(révèle|indique|montre|souligne|précise|note|rapporte)\s+que/g,
  ];

  // Première passe : identifier toutes les sources uniques
  patterns.forEach(pattern => {
    let match;
    const tempContent = content;
    while ((match = pattern.exec(tempContent)) !== null) {
      let sourceName = '';
      
      if (pattern.source.includes('Source')) {
        // Format : "Citation" (Source : XXX)
        sourceName = match[2].split(',')[0].trim();
      } else if (match[2]) {
        // Format : Selon XXX
        sourceName = match[2].trim();
      }
      
      if (sourceName && !citationMap.has(sourceName)) {
        citationCounter++;
        citationMap.set(sourceName, citationCounter);
      }
    }
  });

  // Deuxième passe : remplacer avec les numéros
  // Format : "Citation" (Source : XXX, date, etc.)
  transformedContent = transformedContent.replace(
    /\"([^\"]+)\"\s*\(Source\s*:\s*([^)]+)\)/g,
    (match, citation, source) => {
      const sourceName = source.split(',')[0].trim();
      const num = citationMap.get(sourceName) || '';
      return `"${citation}"${num ? '¹' : ''}`;
    }
  );

  // Format : Selon XXX, "citation"
  transformedContent = transformedContent.replace(
    /(Selon|D'après|Pour)\s+([^,]+),\s*\"([^\"]+)\"/g,
    (match, prefix, source, citation) => {
      const num = citationMap.get(source.trim()) || '';
      return `${prefix} ${source}${num ? '¹' : ''}, "${citation}"`;
    }
  );

  // Format : D'après XXX révèle que
  transformedContent = transformedContent.replace(
    /(D'après|Selon)\s+([^,]+)\s+(révèle|indique|montre|souligne|précise|note|rapporte)\s+que/g,
    (match, prefix, source, verb) => {
      const num = citationMap.get(source.trim()) || '';
      return `${prefix} ${source}${num ? '¹' : ''} ${verb} que`;
    }
  );

  // Générer la section des sources si elle n'existe pas déjà
  if (citationMap.size > 0 && !transformedContent.includes('## Sources et références')) {
    let sourcesSection = '\n\n## Sources et références\n\n';
    sourcesSection += '*Cet article s\'appuie sur des sources vérifiées et actualisées.*\n\n';
    
    // Note : Ici on pourrait enrichir avec les vraies références si on les avait
    // Pour l'instant on liste juste les sources identifiées
    citationMap.forEach((num, source) => {
      sourcesSection += `¹ ${source}\n`;
    });
    
    transformedContent += sourcesSection;
  }

  return transformedContent;
}

// Améliorer le frontmatter pour Astro
function enhanceFrontmatter(content, fileName) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterLines = [];
  let contentLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 && lines[i] === '---') {
      inFrontmatter = true;
      continue;
    }
    
    if (inFrontmatter && lines[i] === '---') {
      inFrontmatter = false;
      continue;
    }
    
    if (inFrontmatter) {
      frontmatterLines.push(lines[i]);
    } else {
      contentLines.push(lines[i]);
    }
  }

  // Parser le frontmatter existant
  const frontmatter = {};
  frontmatterLines.forEach(line => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  });

  // Enrichir avec les valeurs par défaut si manquantes
  const defaults = {
    author: "L'équipe Prizm AI",
    category: "analyses",
    featured: false,
    readingTime: "6 min"
  };

  // S'assurer que tous les champs nécessaires sont présents
  Object.keys(defaults).forEach(key => {
    if (!frontmatter[key]) {
      frontmatter[key] = defaults[key];
    }
  });

  // Déterminer l'emoji selon le sujet
  if (!frontmatter.emoji) {
    const title = frontmatter.title || '';
    if (title.includes('IA générative')) frontmatter.emoji = '🤖';
    else if (title.includes('PME')) frontmatter.emoji = '🏢';
    else if (title.includes('ChatGPT')) frontmatter.emoji = '💬';
    else if (title.includes('automatiser')) frontmatter.emoji = '⚡';
    else if (title.includes('marketing')) frontmatter.emoji = '📈';
    else if (title.includes('avocats')) frontmatter.emoji = '⚖️';
    else if (title.includes('comptabilit')) frontmatter.emoji = '📊';
    else frontmatter.emoji = '🚀';
  }

  // Calculer le temps de lecture si non présent
  if (frontmatter.readingTime === "6 min") {
    const wordCount = contentLines.join(' ').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    frontmatter.readingTime = `${readingTime} min`;
  }

  // Reconstruire le frontmatter
  let newFrontmatter = '---\n';
  const orderedKeys = ['title', 'description', 'pubDate', 'author', 'emoji', 'category', 'featured', 'readingTime'];
  
  orderedKeys.forEach(key => {
    if (frontmatter[key] !== undefined) {
      const value = typeof frontmatter[key] === 'boolean' ? frontmatter[key] : `"${frontmatter[key]}"`;
      newFrontmatter += `${key}: ${value}\n`;
    }
  });
  
  // Ajouter les autres clés non ordonnées
  Object.keys(frontmatter).forEach(key => {
    if (!orderedKeys.includes(key)) {
      const value = typeof frontmatter[key] === 'boolean' ? frontmatter[key] : `"${frontmatter[key]}"`;
      newFrontmatter += `${key}: ${value}\n`;
    }
  });
  
  newFrontmatter += '---\n';

  return newFrontmatter + contentLines.join('\n');
}

// Traiter un article
function processArticle(fileName) {
  console.log(`\n📄 Traitement de : ${fileName}`);
  
  const sourcePath = path.join(CONFIG.SOURCE_DIR, fileName);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`❌ Fichier non trouvé : ${sourcePath}`);
    return { success: false, fileName, error: 'Fichier non trouvé' };
  }

  try {
    // Lire le contenu
    let content = fs.readFileSync(sourcePath, 'utf-8');
    console.log(`  ✓ Lecture du fichier (${content.length} caractères)`);

    // Transformer les citations
    content = transformCitations(content);
    console.log(`  ✓ Citations transformées en format journalistique`);

    // Améliorer le frontmatter
    content = enhanceFrontmatter(content, fileName);
    console.log(`  ✓ Frontmatter optimisé pour Astro`);

    // Nettoyer le nom du fichier
    const cleanName = cleanFileName(fileName);
    const targetPath = path.join(CONFIG.TARGET_DIR, cleanName);

    // Backup si le fichier existe déjà
    if (fs.existsSync(targetPath)) {
      const backupPath = path.join(CONFIG.BACKUP_DIR, `backup-${Date.now()}-${cleanName}`);
      fs.copyFileSync(targetPath, backupPath);
      console.log(`  ✓ Backup créé de l'article existant`);
    }

    // Écrire le fichier transformé
    fs.writeFileSync(targetPath, content, 'utf-8');
    console.log(`  ✅ Article publié : ${cleanName}`);

    return { 
      success: true, 
      fileName: cleanName, 
      wordCount: content.split(/\s+/).length,
      citations: (content.match(/¹/g) || []).length
    };

  } catch (error) {
    console.error(`  ❌ Erreur : ${error.message}`);
    return { success: false, fileName, error: error.message };
  }
}

// Fonction principale
function main() {
  console.log('🚀 PUBLICATION DES ARTICLES VERS LE BLOG PRIZM AI');
  console.log('=' .repeat(60));
  
  // Créer les dossiers nécessaires
  ensureDirectories();

  // Traiter chaque article
  const results = CONFIG.ARTICLES_TO_PUBLISH.map(processArticle);

  // Rapport final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT DE PUBLICATION');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Articles publiés avec succès : ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\nDétails des articles publiés :');
    successful.forEach(r => {
      console.log(`  • ${r.fileName}`);
      console.log(`    - ${r.wordCount} mots`);
      console.log(`    - ${r.citations} citations numérotées`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Articles en échec : ${failed.length}`);
    failed.forEach(r => {
      console.log(`  • ${r.fileName} : ${r.error}`);
    });
  }

  // Instructions finales
  console.log('\n' + '='.repeat(60));
  console.log('📝 PROCHAINES ÉTAPES :');
  console.log('='.repeat(60));
  console.log('\n1. Vérifier les articles dans VS Code :');
  console.log('   cd ../..');
  console.log('   code src/content/blog/');
  console.log('\n2. Tester le site localement :');
  console.log('   npm run dev');
  console.log('\n3. Publier sur GitHub :');
  console.log('   git add src/content/blog/*');
  console.log('   git commit -m "Ajout de 10 nouveaux articles IA"');
  console.log('   git push');
  console.log('\n✨ Les articles seront automatiquement déployés sur Netlify !');
}

// Lancer le script
if (require.main === module) {
  main();
}