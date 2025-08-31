const fs = require('fs');

const blogPath = 'src/pages/blog/index.astro';
let content = fs.readFileSync(blogPath, 'utf-8');

// 1. Ajouter l'affichage de l'image après l'ouverture du lien <a>
content = content.replace(
    /<a href=\{`\/blog\/\$\{post\.id\.replace\('\.md', ''\)\}\/`\} class="article-item">\s*<div class="article-header">/g,
    `<a href={\`/blog/\${post.id.replace('.md', '')}/\`} class="article-item">
								{post.data.heroImage && (
									<div class="article-image-container">
										<img src={post.data.heroImage} alt={post.data.title} class="article-image" />
									</div>
								)}
								<div class="article-header">`
);

// 2. Ajouter les styles CSS pour l'image
content = content.replace(
    '.article-item {',
    `.article-image-container {
				width: 100%;
				height: 200px;
				overflow: hidden;
				border-radius: 8px;
				margin-bottom: 1rem;
			}
			
			.article-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
				transition: transform 0.3s ease;
			}
			
			.article-item:hover .article-image {
				transform: scale(1.05);
			}
			
			.article-item {`
);

fs.writeFileSync(blogPath, content);
console.log('✅ Images ajoutées dans la page blog avec succès!');