const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const indexPath = path.join(__dirname, 'src', 'pages', 'index.astro');
const backupPath = path.join(__dirname, 'src', 'pages', 'index-backup-articlecard.astro');

console.log('🚀 Correction de l\'intégration ArticleCard dans index.astro...\n');

// 1. Lire le fichier actuel
let content;
try {
  content = fs.readFileSync(indexPath, 'utf8');
  console.log('✅ Fichier index.astro lu avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la lecture du fichier:', error.message);
  process.exit(1);
}

// 2. Créer une sauvegarde
try {
  fs.writeFileSync(backupPath, content);
  console.log('✅ Sauvegarde créée:', backupPath);
} catch (error) {
  console.error('❌ Erreur lors de la création de la sauvegarde:', error.message);
  process.exit(1);
}

console.log('\n📝 Correction des problèmes détectés...\n');

// 3. PROBLÈME 1: ArticleCard mal utilisé dans lessentielLimited
// Ligne 127: <ArticleCard class="article-card" style="..."> devrait être juste utilisé comme composant
// Ligne 148: </article> devrait être supprimé car ArticleCard est self-closing

// Remplacer la section lessentielLimited
const lessentielStart = content.indexOf('{lessentielLimited.length > 0 ? (');
const lessentielMap = content.indexOf('lessentielLimited.map((post) => (', lessentielStart);

if (lessentielMap !== -1) {
  // Trouver la fin du map
  const endOfFirstSection = content.indexOf(') : (', lessentielMap);
  
  if (endOfFirstSection !== -1) {
    // Nouveau code pour lessentielLimited avec ArticleCard correctement utilisé
    const newLessentielSection = `{lessentielLimited.length > 0 ? (
							lessentielLimited.map((post, index) => (
								<ArticleCard 
									title={post.data.title}
									description={post.data.description || "Découvrez les dernières actualités de l'IA pour les PME."}
									category="lessentiel"
									readingTime={post.data.readingTime || \`\${Math.ceil((post.body?.length || 1000) / 1500)} min\`}
									emoji={post.data.emoji || "📰"}
									image={post.data.heroImage}
									href={\`/blog/\${post.slug}/\`}
									featured={index === 0}
								/>
							))
						)`;
    
    // Remplacer la section
    const beforeSection = content.substring(0, lessentielStart);
    const afterSection = content.substring(endOfFirstSection);
    content = beforeSection + newLessentielSection + afterSection;
    console.log('✅ Section L\'Essentiel IA corrigée');
  }
}

// 4. Remplacer les articles fictifs dans L'Essentiel IA
// Remplacer les <article> par <ArticleCard> dans la partie else
let articlePattern = /<article class="article-card"[^>]*>[\s\S]*?<\/article>/g;
let replacementCount = 0;

// Remplacer RAG vs Fine-tuning
content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?RAG vs Fine-tuning[\s\S]*?<\/article>/,
  `<ArticleCard 
									title="RAG vs Fine-tuning : Le match définitif pour vos use cases"
									description="Analyse comparative avec benchmarks réels sur 5 cas d'usage entreprise."
									category="lessentiel"
									readingTime="15 min"
									emoji="🔬"
									href="/blog"
								/>`
);

// Remplacer Template Grille d'évaluation
content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?Template : Grille[\s\S]*?<\/article>/,
  `<ArticleCard 
									title="Template : Grille d'évaluation LLM pour votre entreprise"
									description="Notre framework testé pour comparer GPT-4, Claude, et Mistral."
									category="lessentiel"
									readingTime="5 min"
									emoji="⚡"
									href="/blog"
								/>`
);

// Remplacer Pourquoi 80% des POC
content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?Pourquoi 80%[\s\S]*?<\/article>/,
  `<ArticleCard 
									title="Pourquoi 80% des POC IA échouent"
									description="Les 5 patterns d'échec identifiés sur 100+ projets."
									category="lessentiel"
									readingTime="8 min"
									emoji="📊"
									href="/blog"
								/>`
);

console.log('✅ Articles fictifs L\'Essentiel IA remplacés');

// 5. Corriger la section Guides Pratiques
const guidesStart = content.indexOf('{guidesLimited.length > 0 ? (');
const guidesMap = content.indexOf('guidesLimited.map((post) => (', guidesStart);

if (guidesMap !== -1) {
  const endOfGuidesSection = content.indexOf(') : (', guidesMap);
  
  if (endOfGuidesSection !== -1) {
    const newGuidesSection = `{guidesLimited.length > 0 ? (
							guidesLimited.map((post) => (
								<ArticleCard 
									title={post.data.title}
									description={post.data.description || "Guide pratique pour implémenter l'IA dans votre entreprise."}
									category="guides"
									readingTime={post.data.readingTime || \`\${Math.ceil((post.body?.length || 1500) / 1500)} min\`}
									emoji={post.data.emoji || "🎯"}
									image={post.data.heroImage}
									href={\`/blog/\${post.slug}/\`}
								/>
							))
						)`;
    
    const beforeSection = content.substring(0, guidesStart);
    const afterSection = content.substring(endOfGuidesSection);
    content = beforeSection + newGuidesSection + afterSection;
    console.log('✅ Section Guides Pratiques corrigée');
  }
}

// Remplacer les articles fictifs des Guides
content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?Le guide complet du RAG[\s\S]*?<\/article>/,
  `<ArticleCard 
									title="Le guide complet du RAG en production"
									description="De la théorie à l'implémentation : chunking optimal et patterns éprouvés."
									category="guides"
									readingTime="25 min"
									emoji="🎯"
									href="/blog"
								/>`
);

content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?La matrice Build vs Buy[\s\S]*?<\/article>/,
  `<ArticleCard 
									title="La matrice Build vs Buy pour l'IA"
									description="Critères objectifs pour choisir entre développement interne et solutions tierces."
									category="guides"
									readingTime="12 min"
									emoji="🛠️"
									href="/blog"
								/>`
);

content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?Prompt Engineering[\s\S]*?<\/article>/,
  `<ArticleCard 
									title="Prompt Engineering : Au-delà des bases"
									description="Techniques avancées pour maximiser la performance des LLMs."
									category="guides"
									readingTime="18 min"
									emoji="🚀"
									href="/blog"
								/>`
);

console.log('✅ Articles fictifs Guides remplacés');

// 6. Corriger la section Analyses & Décryptages
const analysesStart = content.indexOf('{analysesLimited.length > 0 ? (');
const analysesMap = content.indexOf('analysesLimited.map((post) => (', analysesStart);

if (analysesMap !== -1) {
  const endOfAnalysesSection = content.indexOf(') : (', analysesMap);
  
  if (endOfAnalysesSection !== -1) {
    const newAnalysesSection = `{analysesLimited.length > 0 ? (
							analysesLimited.map((post) => (
								<ArticleCard 
									title={post.data.title}
									description={post.data.description || "Analyse approfondie des enjeux de l'IA pour les entreprises."}
									category="analyses"
									readingTime={post.data.readingTime || \`\${Math.ceil((post.body?.length || 1200) / 1500)} min\`}
									emoji={post.data.emoji || "🔍"}
									image={post.data.heroImage}
									href={\`/blog/\${post.slug}/\`}
								/>
							))
						)`;
    
    const beforeSection = content.substring(0, analysesStart);
    const afterSection = content.substring(endOfAnalysesSection);
    content = beforeSection + newAnalysesSection + afterSection;
    console.log('✅ Section Analyses & Décryptages corrigée');
  }
}

// Remplacer l'article fictif dans Analyses
content = content.replace(
  /<article class="article-card"[^>]*>[\s\S]*?De spectateurs[\s\S]*?<\/article>/,
  `<ArticleCard 
								title="De spectateurs à acteurs : transformer les PME avec l'IA"
								description="Notre vision pour démocratiser l'IA générative auprès des PME françaises."
								category="analyses"
								readingTime="3 min"
								emoji="🎯"
								href="/blog/2025-08-12-manifeste-prizm-ai"
							/>`
);

console.log('✅ Article fictif Analyses remplacé');

// 7. Sauvegarder le fichier modifié
try {
  fs.writeFileSync(indexPath, content);
  console.log('\n✅ Fichier index.astro corrigé avec succès !');
  console.log('\n📌 Pour annuler les changements :');
  console.log(`   copy "${backupPath}" "${indexPath}"`);
} catch (error) {
  console.error('❌ Erreur lors de la sauvegarde:', error.message);
  process.exit(1);
}

console.log('\n🎉 Correction terminée !');
console.log('👀 Vérifiez votre site sur http://localhost:4321');
console.log('\n⚠️  Si vous voyez des erreurs, exécutez :');
console.log(`   copy "${backupPath}" "${indexPath}"`);
console.log('   pour restaurer la version précédente.');