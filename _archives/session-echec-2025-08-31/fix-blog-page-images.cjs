const fs = require('fs');

const blogIndexPath = 'src/pages/blog/index.astro';
let content = fs.readFileSync(blogIndexPath, 'utf-8');

// Chercher où ArticleCard est utilisé et ajouter l'image
content = content.replace(
    /<ArticleCard([^>]*?)\/>/g,
    (match) => {
        // Si image n'est pas déjà passée, l'ajouter
        if (!match.includes('image=')) {
            // Ajouter image={post.data.heroImage} avant la fermeture
            return match.replace('/>', '\n\t\t\t\t\t\t\t\timage={post.data.heroImage}\n\t\t\t\t\t\t\t/>');
        }
        return match;
    }
);

// Alternative : si la structure est différente
if (!content.includes('image={post.data.heroImage}')) {
    // Chercher le pattern où les props sont passées
    content = content.replace(
        /href={[^}]+}\s*title={[^}]+}/g,
        (match) => match + '\n\t\t\t\t\t\t\t\timage={post.data.heroImage}'
    );
}

fs.writeFileSync(blogIndexPath, content);
console.log('✅ Page blog modifiée pour passer heroImage aux cartes');