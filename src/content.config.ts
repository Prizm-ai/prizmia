import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			
			// ⭐ IMAGES : Toutes les variantes
			heroImage: image().optional(),
			image: z.string().optional(),         // ⭐ AJOUTÉ
			imageUrl: z.string().optional(),      // ⭐ AJOUTÉ : Pour articles générés
			
			// ⭐ Autres métadonnées des articles générés
			author: z.string().optional(),
			emoji: z.string().optional(),
			category: z.string().optional(),
			featured: z.boolean().optional(),
			readingTime: z.string().optional(),
		}),
});

export const collections = { blog };
