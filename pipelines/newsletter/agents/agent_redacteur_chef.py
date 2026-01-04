#!/usr/bin/env python3
"""
Agent Rédacteur Chef - Coordination éditoriale et supervision
Newsletter PrizmAI
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import openai
from utils.logger import Logger

@dataclass
class NewsletterStructure:
    """Structure complète d'une newsletter"""
    title: str
    intro: str
    featured_articles: List[dict]
    secondary_articles: List[dict] 
    outro: str
    generated_at: datetime
    total_word_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'intro': self.intro,
            'featured_articles': [a.to_dict() for a in self.featured_articles],
            'secondary_articles': [a.to_dict() for a in self.secondary_articles],
            'outro': self.outro,
            'generated_at': self.generated_at.isoformat(),
            'total_word_count': self.total_word_count
        }

class EditorialCoordinator:
    """Coordinateur éditorial utilisant OpenAI"""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.logger = Logger("EditorialCoordinator")
        
    def create_newsletter_structure(self, articles: List[dict]) -> NewsletterStructure:
        """Crée la structure complète de la newsletter"""
        
        if not articles:
            return self._create_empty_newsletter()
            
        try:
            # Classifier et prioriser les articles
            featured, secondary = self._classify_articles(articles)
            
            # Générer intro et outro avec l'IA
            intro = self._generate_newsletter_intro(featured + secondary)
            outro = self._generate_newsletter_outro()
            title = self._generate_newsletter_title(featured)
            
            total_words = sum(article.word_count for article in articles)
            
            return NewsletterStructure(
                title=title,
                intro=intro,
                featured_articles=featured,
                secondary_articles=secondary,
                outro=outro,
                generated_at=datetime.now(),
                total_word_count=total_words
            )
            
        except Exception as e:
            self.logger.error(f"Erreur création structure newsletter: {e}")
            return self._create_fallback_newsletter(articles)
    
    def _classify_articles(self, articles: List[dict]) -> tuple:
        """Classe les articles en featured et secondary"""
        
        # Trier par nombre de mots (plus long = plus important)
        sorted_articles = sorted(articles, key=lambda x: x.word_count, reverse=True)
        
        # 2-3 articles featured, le reste en secondary
        featured_count = min(3, max(1, len(sorted_articles) // 2))
        
        featured = sorted_articles[:featured_count]
        secondary = sorted_articles[featured_count:]
        
        return featured, secondary
    
    def _generate_newsletter_intro(self, articles: List[dict]) -> str:
        """Génère l'intro de la newsletter avec l'IA"""
        
        try:
            # Créer un résumé des sujets
            topics = [f"- {article.title}" for article in articles[:5]]
            topics_text = "\n".join(topics)
            
            prompt = f"""
            Écris une introduction engageante pour la newsletter PrizmAI de cette semaine.
            
            Sujets abordés:
            {topics_text}
            
            Style:
            - Professionnel mais accessible
            - 2-3 phrases maximum
            - Ton dynamique et informatif
            - Mentionne l'innovation et l'impact business
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Tu es le rédacteur en chef de PrizmAI, newsletter tech de référence."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.8
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            self.logger.error(f"Erreur génération intro: {e}")
            return self._get_default_intro()
    
    def _generate_newsletter_outro(self) -> str:
        """Génère l'outro de la newsletter"""
        
        try:
            prompt = """
            Écris une conclusion courte et engageante pour la newsletter PrizmAI.
            
            Éléments à inclure:
            - Remerciement aux lecteurs
            - Invitation à partager/commenter
            - Rappel de notre mission (démocratiser l'IA)
            - Ton professionnel mais chaleureux
            - 2-3 phrases maximum
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Tu es le rédacteur en chef de PrizmAI."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.8
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            self.logger.error(f"Erreur génération outro: {e}")
            return self._get_default_outro()
    
    def _generate_newsletter_title(self, featured_articles: List[dict]) -> str:
        """Génère le titre de la newsletter"""
        
        if not featured_articles:
            return f"PrizmAI Newsletter - {datetime.now().strftime('%d/%m/%Y')}"
        
        try:
            main_topics = [article.title for article in featured_articles[:2]]
            topics_text = " | ".join(main_topics)
            
            prompt = f"""
            Crée un titre accrocheur pour la newsletter PrizmAI basé sur ces sujets principaux:
            {topics_text}
            
            Contraintes:
            - Maximum 60 caractères
            - Inclure "PrizmAI" 
            - Ton professionnel et dynamique
            - Mettre en avant l'innovation
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Tu es expert en titres newsletter tech."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.9
            )
            
            title = response.choices[0].message.content.strip()
            
            # Fallback si trop long
            if len(title) > 60:
                return f"PrizmAI - Actualités IA du {datetime.now().strftime('%d/%m')}"
                
            return title
            
        except Exception as e:
            self.logger.error(f"Erreur génération titre: {e}")
            return f"PrizmAI Newsletter - {datetime.now().strftime('%d/%m/%Y')}"
    
    def _get_default_intro(self) -> str:
        """Intro par défaut"""
        return ("Bonjour ! Cette semaine, PrizmAI vous présente les dernières innovations "
                "en intelligence artificielle qui transforment le business. "
                "Découvrez les tendances qui façonnent l'avenir de la tech.")
    
    def _get_default_outro(self) -> str:
        """Outro par défaut""" 
        return ("Merci de votre lecture ! Partagez cette newsletter avec vos collègues "
                "et rejoignez la communauté PrizmAI pour démocratiser l'IA ensemble. "
                "À bientôt pour de nouvelles innovations !")
    
    def _create_empty_newsletter(self) -> NewsletterStructure:
        """Newsletter vide"""
        return NewsletterStructure(
            title=f"PrizmAI Newsletter - {datetime.now().strftime('%d/%m/%Y')}",
            intro="Aucun article disponible cette semaine.",
            featured_articles=[],
            secondary_articles=[],
            outro=self._get_default_outro(),
            generated_at=datetime.now(),
            total_word_count=0
        )
    
    def _create_fallback_newsletter(self, articles: List[dict]) -> NewsletterStructure:
        """Newsletter de fallback en cas d'erreur"""
        return NewsletterStructure(
            title=f"PrizmAI Newsletter - {datetime.now().strftime('%d/%m/%Y')}",
            intro=self._get_default_intro(),
            featured_articles=articles[:2] if len(articles) >= 2 else articles,
            secondary_articles=articles[2:] if len(articles) > 2 else [],
            outro=self._get_default_outro(),
            generated_at=datetime.now(),
            total_word_count=sum(a.word_count for a in articles)
        )

class AgentRedacteurChef:
    """Agent Rédacteur Chef - Supervision éditoriale complète"""
    
    def __init__(self):
        self.logger = Logger("AgentRedacteurChef")
        self.coordinator = None
        self._setup_openai()
        
    def _setup_openai(self):
        """Configure l'accès à OpenAI"""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            self.logger.error("OPENAI_API_KEY manquante dans .env")
            raise ValueError("OPENAI_API_KEY requise")
        
        self.coordinator = EditorialCoordinator(api_key)
        self.logger.info("Agent Rédacteur Chef initialisé")
    
    def supervise_newsletter_creation(self, articles: List[dict]) -> NewsletterStructure:
        """Supervise la création complète de la newsletter"""
        
        if not self.coordinator:
            self.logger.error("Coordinator non initialisé")
            return None
        
        self.logger.info(f"Supervision création newsletter avec {len(articles)} articles")
        
        try:
            # Créer la structure de newsletter
            newsletter = self.coordinator.create_newsletter_structure(articles)
            
            # Valider la qualité
            if self._validate_newsletter_quality(newsletter):
                self.logger.info("Newsletter validée avec succès")
                return newsletter
            else:
                self.logger.warning("Newsletter ne respecte pas les standards qualité")
                return self._improve_newsletter_quality(newsletter)
                
        except Exception as e:
            self.logger.error(f"Erreur supervision newsletter: {e}")
            return None
    
    def _validate_newsletter_quality(self, newsletter: NewsletterStructure) -> bool:
        """Valide la qualité de la newsletter"""
        
        # Critères de validation
        checks = [
            len(newsletter.title) > 10,  # Titre suffisant
            len(newsletter.intro) > 50,  # Intro substantielle
            len(newsletter.featured_articles) > 0,  # Au moins 1 article featured
            newsletter.total_word_count > 200,  # Contenu minimum
            len(newsletter.outro) > 30,  # Outro présente
        ]
        
        passed_checks = sum(checks)
        total_checks = len(checks)
        
        quality_score = passed_checks / total_checks
        
        self.logger.info(f"Score qualité newsletter: {quality_score:.2%} ({passed_checks}/{total_checks})")
        
        return quality_score >= 0.8  # 80% minimum
    
    def _improve_newsletter_quality(self, newsletter: NewsletterStructure) -> NewsletterStructure:
        """Améliore la qualité de la newsletter"""
        
        self.logger.info("Amélioration qualité newsletter en cours...")
        
        # Corrections basiques
        if len(newsletter.title) <= 10:
            newsletter.title = f"PrizmAI - Innovations IA du {datetime.now().strftime('%d/%m')}"
        
        if len(newsletter.intro) <= 50:
            newsletter.intro = self.coordinator._get_default_intro()
        
        if len(newsletter.outro) <= 30:
            newsletter.outro = self.coordinator._get_default_outro()
        
        return newsletter
    
    def get_newsletter_stats(self, newsletter: NewsletterStructure) -> Dict[str, Any]:
        """Obtient les statistiques de la newsletter"""
        
        return {
            'total_articles': len(newsletter.featured_articles) + len(newsletter.secondary_articles),
            'featured_count': len(newsletter.featured_articles),
            'secondary_count': len(newsletter.secondary_articles),
            'total_words': newsletter.total_word_count,
            'avg_words_per_article': (newsletter.total_word_count / 
                                    max(1, len(newsletter.featured_articles) + len(newsletter.secondary_articles))),
            'title_length': len(newsletter.title),
            'intro_length': len(newsletter.intro),
            'outro_length': len(newsletter.outro),
            'generated_at': newsletter.generated_at.isoformat()
        }
    
    def health_check(self) -> bool:
        """Vérifie le bon fonctionnement de l'agent"""
        try:
            if not self.coordinator:
                return False
                
            # Test avec un article factice
            test_article = dict(
                title="Test Article",
                intro="Test intro",
                content="Test content for health check",
                summary="Test summary",
                category="test",
                source_url="https://test.com",
                generated_at=datetime.now(),
                word_count=5
            )
            
            newsletter = self.coordinator.create_newsletter_structure([test_article])
            return newsletter is not None and len(newsletter.title) > 0
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    def _appliquer_corrections(self, contenu: str) -> str:
        """Applique les corrections orthographiques et grammaticales"""
        # Pour l'instant, retourne le contenu tel quel
        # Vous pouvez ajouter ici vos règles de correction
        return contenu
    
    def _appliquer_mise_en_forme(self, contenu: str) -> str:
        """Applique la mise en forme finale"""
        # Assurer un formatage cohérent
        lines = contenu.split('\n')
        formatted_lines = []
        
        for line in lines:
            if line.strip():
                formatted_lines.append(line.strip())
        
        return '\n'.join(formatted_lines)

    def finaliser_newsletter(self, contenu_redige, metadata=None):
        """
        Finalise la newsletter après rédaction
        
        Args:
            contenu_redige: Contenu de la newsletter (string ou dict)
            metadata: Métadonnées additionnelles
            
        Returns:
            str: Newsletter finalisée
        """
        try:
            self.logger.info("🔧 Finalisation de la newsletter...")
            
            # Gérer les différents types d'entrée
            if isinstance(contenu_redige, dict):
                # Si c'est un dictionnaire, extraire le contenu
                if 'content' in contenu_redige:
                    contenu_final = contenu_redige['content']
                elif 'contenu' in contenu_redige:
                    contenu_final = contenu_redige['contenu']
                elif 'text' in contenu_redige:
                    contenu_final = contenu_redige['text']
                else:
                    # Prendre la première valeur disponible
                    contenu_final = str(list(contenu_redige.values())[0]) if contenu_redige else ""
            else:
                # Si c'est déjà une string
                contenu_final = str(contenu_redige)
            
            # Validation basique
            if not contenu_final or len(contenu_final.strip()) < 10:
                self.logger.warning("⚠️ Contenu très court détecté")
                
            # Application des métadonnées si fournies
            if metadata:
                self.logger.info(f"📋 Application des métadonnées: {list(metadata.keys())}")
            
            self.logger.info("✅ Newsletter finalisée avec succès")
            return contenu_final
            
        except Exception as e:
            self.logger.error(f"❌ Erreur lors de la finalisation: {e}")
            # Retourner un contenu par défaut en cas d'erreur
            return "Erreur lors de la finalisation de la newsletter"