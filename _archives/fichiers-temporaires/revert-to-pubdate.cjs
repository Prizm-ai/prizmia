// revert-to-pubdate.cjs
const fs = require('fs');
const path = require('path');

const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';

console.log('🔄 RETOUR À pubDate');
console.log('='.repeat(60));

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer date: par pubDate:
  content = content.replace(/^date:/m, 'pubDate:');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ ${file} - date → pubDate`);
});

console.log('='.repeat(60));
console.log('✅ Terminé !');