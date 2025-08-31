// fix-date-field.cjs
const fs = require('fs');
const path = require('path');

const BLOG_DIR = 'C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog';

console.log('🔄 RENOMMAGE pubDate → date');
console.log('='.repeat(60));

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer pubDate: par date: dans le frontmatter
  if (content.includes('pubDate:')) {
    content = content.replace(/^pubDate:/m, 'date:');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} - pubDate → date`);
  } else {
    console.log(`⏭️  ${file} - déjà OK`);
  }
});

console.log('='.repeat(60));
console.log('🎉 Terminé ! Relancez npm run dev');