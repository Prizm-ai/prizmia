const fs = require('fs');

const blogPath = 'src/pages/blog/index.astro';
let content = fs.readFileSync(blogPath, 'utf-8');

// Chercher la div qui contient l'emoji et la remplacer par une image conditionnelle
// On doit chercher où categoryEmojis[category] est utilisé et le remplacer par une image

// Trouver et remplacer la section qui affiche l'emoji
content = content.replace(
    /<a[^>]*href=\{`\/blog\/\$\{post\.slug\}\/`\}[^>]*>[\s\S]*?<\/a>/g,
    (match) => {
        // Si l'image n'est pas déjà présente
        if (!match.includes('post.data.heroImage')) {
            // Ajouter l'affichage conditionnel de l'image
            return match.replace(
                /<div[^>]*class="article-card"[^>]*>/,
                `<div class="article-card">
                    {post.data.heroImage && (
                        <div class="article-image-container">
                            <img src={post.data.heroImage} alt={post.data.title} class="article-image" />
                        </div>
                    )}`
            );
        }
        return match;
    }
);

// Alternative : ajouter un style pour les images
if (!content.includes('.article-image')) {
    content = content.replace(
        '</style>',
        `
        .article-image-container {
            width: 100%;
            height: 200px;
            overflow: hidden;
            border-radius: 12px;
            margin-bottom: 1rem;
        }
        
        .article-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        </style>`
    );
}

fs.writeFileSync(blogPath, content);
console.log('✅ Page blog modifiée pour afficher les images');