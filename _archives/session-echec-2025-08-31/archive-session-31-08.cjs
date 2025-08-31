const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = false; // Mettre à true pour voir sans faire
const SESSION_DATE = '2025-08-31';
const ARCHIVE_DIR = `_archives/session-echec-${SESSION_DATE}`;

// Fichiers à archiver (tous les .cjs temporaires créés aujourd'hui)
const filesToArchive = [
  'add-specific-images.cjs',
  'add-visuals.cjs',
  'clean-all-heroimages.cjs',
  'fix-articles-metadata.cjs',
  'fix-blog-display-images.cjs',
  'fix-blog-images-correct.cjs',
  'fix-blog-page-images.cjs',
  'fix-descriptions-v2.cjs',
  'fix-final-issues.cjs',
  'fix-visuals-and-cleanup.cjs',
  'remove-broken-images.cjs',
  'restore-blog-page.cjs',
  'test-image-single-article.cjs',
  'test-simple-image.cjs',
  'test-with-existing-image.cjs',
  'use-local-images.cjs',
  'use-manifeste-image.cjs'
];

console.log(`🗄️ ARCHIVAGE SESSION ${SESSION_DATE}`);
console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (test)' : 'RÉEL'}\n`);

// Créer le dossier d'archive
if (!DRY_RUN && !fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  console.log(`✅ Dossier créé: ${ARCHIVE_DIR}\n`);
}

// Archiver chaque fichier
let archived = 0;
let notFound = 0;

filesToArchive.forEach(file => {
  if (fs.existsSync(file)) {
    const dest = path.join(ARCHIVE_DIR, file);
    if (DRY_RUN) {
      console.log(`[DRY-RUN] Archiverait: ${file} → ${dest}`);
    } else {
      fs.renameSync(file, dest);
      console.log(`📦 Archivé: ${file}`);
    }
    archived++;
  } else {
    notFound++;
  }
});

// Rapport final
console.log(`\n📊 RAPPORT D'ARCHIVAGE`);
console.log(`✅ Fichiers archivés: ${archived}`);
console.log(`⚠️ Fichiers non trouvés: ${notFound}`);
console.log(`📁 Destination: ${ARCHIVE_DIR}`);

if (!DRY_RUN) {
  // Créer un README dans le dossier d'archive
  const readme = `# Archives Session du ${SESSION_DATE}

## Contexte
Session de travail qui a mal tourné - tentative d'ajout d'images au blog Astro.

## Problème
- Modifications non contrôlées de BlogPost.astro
- Scripts qui modifiaient TOUS les articles
- Perte de contrôle sur les modifications
- 7 heures perdues, retour à la version Git

## Leçon apprise
- TOUJOURS tester sur UN élément avant de généraliser
- JAMAIS plus de 3 tentatives sur le même problème
- Git checkout > nouveau script

## Fichiers archivés
${filesToArchive.filter(f => fs.existsSync(path.join(ARCHIVE_DIR, f))).map(f => `- ${f}`).join('\n')}

---
*Ne pas réutiliser ces scripts - ils sont archivés comme exemple de ce qu'il ne faut PAS faire*
`;

  fs.writeFileSync(path.join(ARCHIVE_DIR, 'README.md'), readme);
  console.log(`\n📝 README créé dans le dossier d'archive`);
}

console.log(`\n✨ Archivage terminé!`);