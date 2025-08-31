const fs = require('fs');
const path = require('path');

// Dossiers à parcourir
const directories = [
  'src/components',
  'src/layouts',
  'src/pages'
];

// Remplacements à effectuer
const replacements = [
  // Couleurs
  { from: /#667eea/gi, to: 'var(--color-primary)' },
  { from: /#764ba2/gi, to: 'var(--color-primary-dark)' },
  { from: /#818cf8/gi, to: 'var(--color-primary-light)' },
  
  // Couleurs catégories
  { from: /#3b82f6/gi, to: 'var(--color-lessentiel)' },
  { from: /#10b981/gi, to: 'var(--color-guides)' },
  { from: /#8b5cf6/gi, to: 'var(--color-analyses)' },
  { from: /#f59e0b/gi, to: 'var(--color-outils)' },
  
  // Espacements exacts
  { from: /padding:\s*1rem/gi, to: 'padding: var(--space-4)' },
  { from: /padding:\s*0\.5rem/gi, to: 'padding: var(--space-2)' },
  { from: /padding:\s*1\.5rem/gi, to: 'padding: var(--space-6)' },
  { from: /padding:\s*2rem/gi, to: 'padding: var(--space-8)' },
  { from: /margin:\s*1rem/gi, to: 'margin: var(--space-4)' },
  { from: /margin:\s*0\.5rem/gi, to: 'margin: var(--space-2)' },
  { from: /margin:\s*1\.5rem/gi, to: 'margin: var(--space-6)' },
  { from: /margin:\s*2rem/gi, to: 'margin: var(--space-8)' },
  
  // Tailles de police
  { from: /font-size:\s*0\.75rem/gi, to: 'font-size: var(--text-xs)' },
  { from: /font-size:\s*0\.875rem/gi, to: 'font-size: var(--text-sm)' },
  { from: /font-size:\s*1rem/gi, to: 'font-size: var(--text-base)' },
  { from: /font-size:\s*1\.125rem/gi, to: 'font-size: var(--text-lg)' },
  { from: /font-size:\s*1\.25rem/gi, to: 'font-size: var(--text-xl)' },
  { from: /font-size:\s*1\.5rem/gi, to: 'font-size: var(--text-2xl)' },
  { from: /font-size:\s*1\.875rem/gi, to: 'font-size: var(--text-3xl)' },
  { from: /font-size:\s*2\.25rem/gi, to: 'font-size: var(--text-4xl)' },
  
  // Border radius
  { from: /border-radius:\s*0\.5rem/gi, to: 'border-radius: var(--radius-lg)' },
  { from: /border-radius:\s*0\.75rem/gi, to: 'border-radius: var(--radius-xl)' },
  { from: /border-radius:\s*1rem/gi, to: 'border-radius: var(--radius-2xl)' },
  { from: /border-radius:\s*1\.5rem/gi, to: 'border-radius: var(--radius-3xl)' },
  
  // Font weights
  { from: /font-weight:\s*400/gi, to: 'font-weight: var(--font-normal)' },
  { from: /font-weight:\s*500/gi, to: 'font-weight: var(--font-medium)' },
  { from: /font-weight:\s*600/gi, to: 'font-weight: var(--font-semibold)' },
  { from: /font-weight:\s*700/gi, to: 'font-weight: var(--font-bold)' },
  { from: /font-weight:\s*800/gi, to: 'font-weight: var(--font-extrabold)' },
];

// Fonction pour traiter un fichier
function processFile(filePath) {
  if (!filePath.endsWith('.astro') && !filePath.endsWith('.css')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Mis à jour: ${filePath}`);
  }
}

// Fonction pour parcourir un dossier
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Dossier non trouvé: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  });
}

// Créer une sauvegarde
console.log('📦 Création de sauvegardes...');
const backupDir = 'backup-before-css-variables';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Exécuter les remplacements
console.log('🔄 Application des variables CSS...\n');
directories.forEach(dir => {
  console.log(`📂 Traitement de ${dir}...`);
  processDirectory(dir);
});

console.log('\n✨ Terminé ! Vérifiez votre site.');
console.log('💡 Pour annuler, restaurez depuis le dossier backup-before-css-variables');