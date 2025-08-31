import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict
import logging

class AgentVeille:
    def __init__(self):
        self.rss_feeds = [
            "https://feeds.feedburner.com/venturebeat/SZYF",  # VentureBeat AI
            "https://techcrunch.com/feed/",  # TechCrunch
            "https://www.theverge.com/rss/index.xml",  # The Verge
            "https://feeds.feedburner.com/TheHackernews",  # Hacker News
            "https://rss.cnn.com/rss/edition.rss",  # CNN Tech
            "https://feeds.arstechnica.com/arstechnica/technology-lab",  # Ars Technica
            "https://www.wired.com/feed/rss",  # Wired
            "https://feeds.feedburner.com/mit/news",  # MIT News
        ]
        
        self.keywords_ia = [
            'artificial intelligence', 'ai', 'machine learning', 'ml',
            'deep learning', 'neural network', 'chatgpt', 'openai',
            'automation', 'robotics', 'nlp', 'computer vision',
            'generative ai', 'llm', 'large language model'
        ]
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def _get_timestamp(self, entry) -> datetime:
        """Extrait le timestamp d'un article RSS"""
        try:
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                return datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                return datetime(*entry.updated_parsed[:6])
            else:
                return datetime.now()
        except (TypeError, ValueError):
            return datetime.now()
    
    def _is_recent(self, timestamp: datetime, days: int = 7) -> bool:
        """Vérifie si un article est récent"""
        cutoff = datetime.now() - timedelta(days=days)
        return timestamp > cutoff
    
    def _contains_ia_keywords(self, text: str) -> bool:
        """Vérifie si le texte contient des mots-clés IA"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.keywords_ia)
    
    def _fetch_rss_feed(self, url: str) -> List[Dict]:
        """Récupère et parse un flux RSS"""
        articles = []
        try:
            logging.info(f"Récupération du flux: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            if not feed.entries:
                logging.warning(f"Aucun article dans le flux: {url}")
                return articles
            
            for entry in feed.entries:
                # Vérification des mots-clés IA
                title = getattr(entry, 'title', '')
                description = getattr(entry, 'description', '') or getattr(entry, 'summary', '')
                
                if self._contains_ia_keywords(f"{title} {description}"):
                    timestamp = self._get_timestamp(entry)
                    
                    if self._is_recent(timestamp):
                        article = {
                            'titre': title,
                            'description': description,
                            'lien': getattr(entry, 'link', ''),
                            'date': timestamp,
                            'source': url
                        }
                        articles.append(article)
                        
            logging.info(f"✅ {url}: {len(articles)} articles IA récents trouvés")
            
        except requests.exceptions.RequestException as e:
            logging.error(f"Erreur requête {url}: {e}")
        except Exception as e:
            logging.error(f"Erreur parsing {url}: {e}")
            
        return articles
    
    def collecter_articles(self, limit: int = 10) -> List[Dict]:
        """Collecte les articles IA récents depuis tous les flux RSS"""
        try:
            tous_articles = []
            
            for feed_url in self.rss_feeds:
                articles = self._fetch_rss_feed(feed_url)
                tous_articles.extend(articles)
            
            if not tous_articles:
                logging.warning("Aucun article collecté depuis tous les flux RSS")
                return []
            
            # Tri par date (plus récent en premier)
            tous_articles.sort(key=lambda x: x['date'], reverse=True)
            
            # Limitation du nombre d'articles
            articles_limites = tous_articles[:limit] if limit else tous_articles
            
            logging.info(f"📰 {len(articles_limites)} articles IA collectés au total")
            return articles_limites
            
        except Exception as e:
            logging.error(f"Erreur globale collecte RSS: {e}")
            raise Exception(f"Erreur collecte articles: {e}")
    
    def analyser_tendances(self, articles: List[Dict]) -> Dict:
        """Analyse les tendances dans les articles collectés"""
        if not articles:
            return {'tendances': [], 'themes_principaux': [], 'sources_actives': []}
        
        # Comptage des mots-clés
        keyword_count = {}
        themes = {}
        sources = {}
        
        for article in articles:
            # Analyse des mots-clés
            text = f"{article['titre']} {article['description']}".lower()
            for keyword in self.keywords_ia:
                if keyword in text:
                    keyword_count[keyword] = keyword_count.get(keyword, 0) + 1
            
            # Comptage des sources
            source = article.get('source', 'Inconnu')
            sources[source] = sources.get(source, 0) + 1
            
            # Extraction de thèmes (mots fréquents)
            mots = text.split()
            for mot in mots:
                if len(mot) > 4:  # Mots significatifs
                    themes[mot] = themes.get(mot, 0) + 1
        
        # Top tendances
        top_keywords = sorted(keyword_count.items(), key=lambda x: x[1], reverse=True)[:5]
        top_themes = sorted(themes.items(), key=lambda x: x[1], reverse=True)[:5]
        top_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'tendances': [{'keyword': k, 'count': v} for k, v in top_keywords],
            'themes_principaux': [{'theme': k, 'count': v} for k, v in top_themes],
            'sources_actives': [{'source': k, 'count': v} for k, v in top_sources],
            'total_articles': len(articles)
        }