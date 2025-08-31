# agents/agent_redacteur.py
import logging
from openai import OpenAI
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class AgentRedacteur:
    def __init__(self, openai_api_key: str):
        """Initialise l'agent rédacteur avec l'API OpenAI"""
        self.client = OpenAI(api_key=openai_api_key)
        logger.info("Agent Rédacteur initialisé avec OpenAI")
    
    def rediger_contenu(self, articles: List[Dict[str, Any]], tendances: str = "") -> Dict[str, Any]:
        """
        Rédige le contenu de la newsletter à partir des articles collectés
        
        Args:
            articles: Liste des articles collectés
            tendances: Analyse des tendances (optionnel)
            
        Returns:
            Dict contenant le contenu rédigé
        """
        try:
            logger.info(f"🖋️ Début rédaction pour {len(articles)} articles")
            
            # Préparer le contexte pour l'IA
            articles_context = ""
            for i, article in enumerate(articles[:5], 1):  # Limite à 5 articles
                articles_context += f"""
Article {i}:
Titre: {article.get('title', 'Sans titre')}
Description: {article.get('description', 'Pas de description')}
URL: {article.get('link', '')}
Date: {article.get('published', '')}
---
"""
            
            prompt = f"""
Tu es un expert en rédaction de newsletters IA. Créé une newsletter engageante à partir de ces articles :

{articles_context}

{f"Tendances identifiées: {tendances}" if tendances else ""}

Structure souhaitée:
1. Un titre accrocheur pour la newsletter
2. Une introduction captivante (2-3 phrases)
3. Pour chaque article important:
   - Un titre reformulé
   - Un résumé de 2-3 phrases
   - Pourquoi c'est important
4. Une conclusion avec perspective future

Ton style: professionnel mais accessible, ton enthousiaste pour l'IA.
Longueur: 800-1200 mots maximum.
"""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un rédacteur expert en newsletters tech et IA."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            contenu = response.choices[0].message.content
            
            # Structure le résultat
            resultat = {
                "contenu_complet": contenu,
                "titre_newsletter": self._extraire_titre(contenu),
                "nb_articles_traites": len(articles),
                "statut": "success"
            }
            
            logger.info("✅ Contenu rédigé avec succès")
            return resultat
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la rédaction: {str(e)}")
            return {
                "contenu_complet": "",
                "titre_newsletter": "Newsletter IA - Erreur de génération",
                "nb_articles_traites": 0,
                "statut": "error",
                "erreur": str(e)
            }
    
    def _extraire_titre(self, contenu: str) -> str:
        """Extrait le titre de la newsletter du contenu généré"""
        lignes = contenu.split('\n')
        for ligne in lignes[:5]:  # Cherche dans les 5 premières lignes
            ligne = ligne.strip()
            if ligne and not ligne.startswith('##') and len(ligne) < 100:
                # Nettoie le titre
                titre = ligne.replace('#', '').replace('*', '').strip()
                if titre:
                    return titre
        
        return "Newsletter IA - " + str(len(lignes)) + " articles"

# Classes pour compatibilité avec les anciens imports
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

@dataclass
class ArticleRequest:
    """Représente une demande d'article"""
    titre: str = ""
    description: str = ""
    mots_cles: List[str] = None
    priorite: int = 1
    
    def __post_init__(self):
        if self.mots_cles is None:
            self.mots_cles = []

@dataclass  
class GeneratedContent:
    """Contenu généré par l'agent rédacteur"""
    contenu_complet: str = ""
    titre_newsletter: str = ""
    nb_articles_traites: int = 0
    statut: str = "success"
    mode: str = "openai"
    erreur: Optional[str] = None


# Alias pour compatibilité
class AINewsletterWriter(AgentRedacteur):
    """Alias de AgentRedacteur pour compatibilité"""
    pass
