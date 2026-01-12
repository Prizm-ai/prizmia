"""
Agent Publish - Publie l'article sur le blog Astro.

Génère le frontmatter, copie les images et effectue le commit Git.
"""

import re
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional

from git import Repo

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState
from prizm_ai.config import settings


class PublishAgent(BaseAgent):
    """
    Agent de publication.
    
    Publie l'article sur le blog Astro :
    - Génère le frontmatter
    - Copie les images
    - Commit et push Git
    """
    
    name = "PublishAgent"
    
    def __init__(self):
        super().__init__()
        self.blog_path = settings.blog_path
        self.images_path = settings.images_path
        self.site_path = settings.site_path
    
    async def run(self, state: GraphState) -> GraphState:
        """
        Publie l'article.
        
        Args:
            state: État avec article et visuels
            
        Returns:
            État avec URL de publication
        """
        state = self.log(state, "Publication de l'article...")
        
        article = state.get("article_revise") or state.get("article_brut", "")
        sujet = state.get("sujet_selectionne", {})
        visuels = state.get("visuels", {})
        
        if not article:
            state = self.error(state, "Aucun article à publier")
            return state
        
        try:
            # 1. Générer le slug
            titre = sujet.get("titre", "article")
            slug = self._slugify(titre)
            date = datetime.now().strftime("%Y-%m-%d")
            filename = f"{date}-{slug}.md"
            
            # 2. Copier les images et obtenir les chemins relatifs
            hero_path = None
            if visuels.get("hero"):
                hero_path = await self._copy_image(
                    visuels["hero"]["path"],
                    f"{slug}-hero.png"
                )
            
            # 4. Assembler le fichier final
            # Vérifier si l'article a déjà un frontmatter
            if article.strip().startswith('---'):
                # L'article a déjà un frontmatter, ne pas en ajouter un autre
                # Mais mettre à jour heroImage si nécessaire
                if hero_path:
                    article = self._update_hero_in_frontmatter(article, hero_path)
                final_content = article
            else:
                # Pas de frontmatter, en générer un
                frontmatter = self._generate_frontmatter(
                    titre=titre,
                    description=sujet.get("resume", ""),
                    hero_image=hero_path,
                    type_article=state.get("type_article", "actualite")
                )
                final_content = f"---\n{frontmatter}---\n\n{article}"
            
            # 5. Écrire le fichier
            filepath = self.blog_path / filename
            filepath.write_text(final_content, encoding="utf-8")
            
            state = self.log(state, f"✓ Fichier créé: {filename}")
            
            # 6. Git commit + push
            await self._git_publish(filename, titre)
            
            # Mettre à jour l'état
            state["published"] = True
            state["filepath"] = str(filepath)
            state["url"] = f"https://prizm-ai.com/blog/{slug}"
            
            state = self.log(state, f"✓ Article publié: {state['url']}")
            
        except Exception as e:
            state = self.error(state, f"Erreur publication: {str(e)}")
            state["published"] = False
        
        return state
    
    def _slugify(self, text: str) -> str:
        """Convertit un titre en slug URL-friendly."""
        # Minuscules
        slug = text.lower()
        
        # Remplacer les accents
        replacements = {
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'à': 'a', 'â': 'a', 'ä': 'a',
            'î': 'i', 'ï': 'i',
            'ô': 'o', 'ö': 'o',
            'ù': 'u', 'û': 'u', 'ü': 'u',
            'ç': 'c', 'œ': 'oe', 'æ': 'ae'
        }
        for old, new in replacements.items():
            slug = slug.replace(old, new)
        
        # Garder uniquement alphanum et tirets
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        
        # Limiter la longueur
        return slug[:60]
    
    def _generate_frontmatter(
        self,
        titre: str,
        description: str,
        hero_image: Optional[str],
        type_article: str
    ) -> str:
        """Génère le frontmatter YAML pour Astro."""
        date = datetime.now().strftime("%Y-%m-%d")
        
        lines = [
            f'title: "{titre}"',
            f'description: "{description[:160]}"',
            f'pubDate: "{date}"',
            f'type: "{type_article}"',
            f'author: "Prizm AI"',
        ]
        
        if hero_image:
            lines.append(f'heroImage: "{hero_image}"')
        
        # Tags basés sur le type
        tags_map = {
            "actualite": ["actualité", "ia", "pme"],
            "analyse": ["analyse", "étude", "ia"],
            "guide": ["guide", "tutoriel", "pratique"],
            "opinion": ["opinion", "édito", "réflexion"]
        }
        tags = tags_map.get(type_article, ["ia"])
        lines.append(f'tags: {tags}')
        
        return "\n".join(lines) + "\n"
    
    def _update_hero_in_frontmatter(self, article: str, hero_path: str) -> str:
        """
        Met à jour le heroImage dans un frontmatter existant.
        
        Args:
            article: Article avec frontmatter
            hero_path: Chemin de l'image hero
            
        Returns:
            Article avec heroImage mis à jour
        """
        # Trouver le frontmatter
        if not article.strip().startswith('---'):
            return article
        
        # Séparer frontmatter et contenu
        parts = article.split('---', 2)
        if len(parts) < 3:
            return article
        
        frontmatter = parts[1]
        content = parts[2]
        
        # Vérifier si heroImage existe déjà
        if 'heroImage:' in frontmatter:
            # Remplacer la valeur existante
            frontmatter = re.sub(
                r'heroImage:\s*["\']?[^"\n]*["\']?',
                f'heroImage: "{hero_path}"',
                frontmatter
            )
        else:
            # Ajouter heroImage avant le dernier ---
            frontmatter = frontmatter.rstrip() + f'\nheroImage: "{hero_path}"\n'
        
        return f'---{frontmatter}---{content}'
    
    async def _copy_image(self, source_path: str, dest_name: str) -> str:
        """
        Copie une image vers le dossier public du blog.
        
        Args:
            source_path: Chemin source
            dest_name: Nom de destination
            
        Returns:
            Chemin relatif pour le frontmatter
        """
        source = Path(source_path)
        if not source.exists():
            return None
        
        # Créer le dossier de destination si nécessaire
        dest_dir = self.images_path
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        dest = dest_dir / dest_name
        shutil.copy2(source, dest)
        
        # Retourner le chemin relatif pour le blog
        return f"/images/blog/{dest_name}"
    
    async def _git_publish(self, filename: str, titre: str):
        """
        Commit et push les changements.
        
        Args:
            filename: Nom du fichier ajouté
            titre: Titre pour le message de commit
        """
        try:
            repo = Repo(self.site_path)
            
            # Ajouter les fichiers
            repo.index.add([
                str(self.blog_path / filename),
            ])
            
            # Ajouter les images si présentes
            if self.images_path.exists():
                for img in self.images_path.glob("*.png"):
                    try:
                        repo.index.add([str(img)])
                    except:
                        pass
            
            # Commit
            commit_message = f"📝 Nouvel article: {titre}"
            repo.index.commit(commit_message)
            
            # Push
            origin = repo.remote("origin")
            origin.push()
            
        except Exception as e:
            print(f"⚠️ Git push échoué (publication locale OK): {e}")


# Test
if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("🚀 Test PublishAgent")
        print("=" * 40)
        
        agent = PublishAgent()
        
        # Test slugify
        tests = [
            "L'IA révolutionne les PME françaises",
            "Guide : 5 étapes pour adopter l'IA",
            "Pourquoi 73% des ETI échouent"
        ]
        
        for t in tests:
            print(f"'{t}' → '{agent._slugify(t)}'")
        
        print("✓ Agent initialisé")
    
    asyncio.run(test())
