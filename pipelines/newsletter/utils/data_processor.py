"""
Processeur de donnÃ©es pour la Newsletter AI PRIZM
GÃ¨re le nettoyage, la structuration et la validation des donnÃ©es RSS
"""

import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import logging
from urllib.parse import urlparse
import html

logger = logging.getLogger(__name__)

@dataclass
class ArticleData:
    """Structure de donnÃ©es pour un article"""
    title: str
    content: str
    url: str
    source: str
    published_date: datetime
    author: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = None
    summary: Optional[str] = None
    relevance_score: float = 0.0
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []

@dataclass 
class ProcessedData:
    """Structure pour les donnÃ©es traitÃ©es"""
    articles: List[ArticleData]
    total_articles: int
    sources_count: Dict[str, int]
    categories: List[str]
    processing_timestamp: datetime
    
class DataProcessor:
    """Processeur principal pour les donnÃ©es RSS et articles"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.min_content_length = self.config.get('min_content_length', 100)
        self.max_content_length = self.config.get('max_content_length', 10000)
        self.excluded_domains = self.config.get('excluded_domains', [])
        self.keyword_filters = self.config.get('keyword_filters', [])
        
    def clean_text(self, text: str) -> str:
        """Nettoie et normalise le texte"""
        if not text:
            return ""
            
        # DÃ©codage HTML
        text = html.unescape(text)
        
        # Suppression des balises HTML
        text = re.sub(r'<[^>]+>', '', text)
        
        # Nettoyage des espaces multiples
        text = re.sub(r'\s+', ' ', text)
        
        # Suppression des caractÃ¨res de contrÃ´le
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        return text.strip()
    
    def extract_summary(self, content: str, max_length: int = 200) -> str:
        """Extrait un rÃ©sumÃ© du contenu"""
        if not content:
            return ""
            
        # Prend les premiers mots jusqu'Ã  la limite
        words = content.split()
        if len(words) <= 30:
            return content
            
        summary = ' '.join(words[:30])
        if len(summary) > max_length:
            summary = summary[:max_length-3] + "..."
            
        return summary
    
    def validate_article(self, article_data: Dict[str, Any]) -> bool:
        """Valide qu'un article respecte les critÃ¨res de qualitÃ©"""
        
        # VÃ©rifications de base
        if not article_data.get('title') or not article_data.get('content'):
            return False
            
        # VÃ©rification de la longueur du contenu
        content_length = len(article_data.get('content', ''))
        if content_length < self.min_content_length or content_length > self.max_content_length:
            return False
            
        # VÃ©rification du domaine exclu
        url = article_data.get('url', '')
        if url:
            domain = urlparse(url).netloc
            if domain in self.excluded_domains:
                return False
                
        # VÃ©rification des mots-clÃ©s filtrÃ©s
        title_lower = article_data.get('title', '').lower()
        content_lower = article_data.get('content', '').lower()
        
        for keyword in self.keyword_filters:
            if keyword.lower() in title_lower or keyword.lower() in content_lower:
                return False
                
        return True
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse diffÃ©rents formats de dates"""
        if not date_str:
            return None
            
        # Formats de date courants
        date_formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%a, %d %b %Y %H:%M:%S %Z',
            '%a, %d %b %Y %H:%M:%S %z',
            '%Y-%m-%d',
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
                
        logger.warning(f"Format de date non reconnu: {date_str}")
        return datetime.now()
    
    def categorize_article(self, title: str, content: str) -> str:
        """CatÃ©gorise automatiquement un article"""
        
        categories_keywords = {
            'technologie': ['tech', 'numÃ©rique', 'ia', 'intelligence artificielle', 'startup', 'innovation'],
            'economie': ['Ã©conomie', 'finance', 'marchÃ©', 'entreprise', 'business', 'bourse'],
            'politique': ['politique', 'gouvernement', 'Ã©lection', 'dÃ©putÃ©', 'ministre', 'parlement'],
            'culture': ['culture', 'art', 'musique', 'cinÃ©ma', 'livre', 'spectacle'],
            'sport': ['sport', 'football', 'tennis', 'olympique', 'match', 'Ã©quipe'],
            'santÃ©': ['santÃ©', 'mÃ©decine', 'hÃ´pital', 'traitement', 'maladie', 'recherche mÃ©dicale'],
            'environnement': ['environnement', 'climat', 'Ã©cologie', 'pollution', 'Ã©nergie', 'dÃ©veloppement durable']
        }
        
        text_lower = f"{title} {content}".lower()
        
        for category, keywords in categories_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return category
                    
        return 'gÃ©nÃ©ral'
    
    def extract_tags(self, title: str, content: str) -> List[str]:
        """Extrait des tags pertinents du contenu"""
        
        # Mots-clÃ©s frÃ©quents Ã  exclure
        stop_words = {
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 
            'donc', 'car', 'ni', 'or', 'avec', 'sans', 'pour', 'par', 'sur', 'sous',
            'dans', 'vers', 'chez', 'depuis', 'jusqu', 'pendant', 'aprÃ¨s', 'avant'
        }
        
        text = f"{title} {content}".lower()
        
        # Extraction des mots significatifs
        words = re.findall(r'\b[a-zA-ZÃ Ã¢Ã¤Ã©Ã¨ÃªÃ«Ã¯Ã®Ã´Ã¶Ã¹Ã»Ã¼Ã¿Ã§Ã€Ã‚Ã„Ã‰ÃˆÃŠÃ‹ÃÃŽÃ”Ã–Ã™Ã›ÃœÅ¸Ã‡]{4,}\b', text)
        
        # Comptage et filtrage
        word_count = {}
        for word in words:
            if word not in stop_words:
                word_count[word] = word_count.get(word, 0) + 1
        
        # Retourne les mots les plus frÃ©quents
        tags = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:5]
        return [tag[0] for tag in tags]
    
    def process_raw_article(self, raw_data: Dict[str, Any]) -> Optional[ArticleData]:
        """Traite un article brut en ArticleData structurÃ©"""
        
        try:
            # Validation initiale
            if not self.validate_article(raw_data):
                return None
                
            # Nettoyage des donnÃ©es
            title = self.clean_text(raw_data.get('title', ''))
            content = self.clean_text(raw_data.get('content', ''))
            url = raw_data.get('url', '')
            source = raw_data.get('source', urlparse(url).netloc if url else 'Unknown')
            
            # Traitement de la date
            published_date = self.parse_date(raw_data.get('published', ''))
            
            # GÃ©nÃ©ration des mÃ©tadonnÃ©es
            summary = self.extract_summary(content)
            category = self.categorize_article(title, content)
            tags = self.extract_tags(title, content)
            
            return ArticleData(
                title=title,
                content=content,
                url=url,
                source=source,
                published_date=published_date,
                author=raw_data.get('author'),
                category=category,
                tags=tags,
                summary=summary
            )
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement de l'article: {e}")
            return None
    
    def process_batch(self, raw_articles: List[Dict[str, Any]]) -> ProcessedData:
        """Traite un lot d'articles"""
        
        processed_articles = []
        sources_count = {}
        categories = set()
        
        for raw_article in raw_articles:
            article = self.process_raw_article(raw_article)
            if article:
                processed_articles.append(article)
                
                # Comptage des sources
                sources_count[article.source] = sources_count.get(article.source, 0) + 1
                
                # Collecte des catÃ©gories
                categories.add(article.category)
        
        return ProcessedData(
            articles=processed_articles,
            total_articles=len(processed_articles),
            sources_count=sources_count,
            categories=list(categories),
            processing_timestamp=datetime.now()
        )
    
    def filter_by_date_range(self, articles: List[ArticleData], 
                           start_date: datetime, end_date: datetime) -> List[ArticleData]:
        """Filtre les articles par plage de dates"""
        
        return [
            article for article in articles
            if start_date <= article.published_date <= end_date
        ]
    
    def filter_by_category(self, articles: List[ArticleData], 
                          categories: List[str]) -> List[ArticleData]:
        """Filtre les articles par catÃ©gories"""
        
        return [
            article for article in articles
            if article.category in categories
        ]
    
    def sort_by_relevance(self, articles: List[ArticleData]) -> List[ArticleData]:
        """Trie les articles par score de pertinence"""
        
        return sorted(articles, key=lambda x: x.relevance_score, reverse=True)
    
    def get_statistics(self, processed_data: ProcessedData) -> Dict[str, Any]:
        """GÃ©nÃ¨re des statistiques sur les donnÃ©es traitÃ©es"""
        
        if not processed_data.articles:
            return {}
            
        # Statistiques temporelles
        dates = [article.published_date for article in processed_data.articles]
        latest_date = max(dates)
        oldest_date = min(dates)
        
        # Statistiques de contenu
        avg_content_length = sum(len(article.content) for article in processed_data.articles) / len(processed_data.articles)
        
        return {
            'total_articles': processed_data.total_articles,
            'sources_count': processed_data.sources_count,
            'categories_distribution': {
                cat: sum(1 for a in processed_data.articles if a.category == cat)
                for cat in processed_data.categories
            },
            'date_range': {
                'oldest': oldest_date.isoformat(),
                'latest': latest_date.isoformat(),
                'span_days': (latest_date - oldest_date).days
            },
            'content_stats': {
                'avg_length': int(avg_content_length),
                'total_words': sum(len(article.content.split()) for article in processed_data.articles)
            },
            'processing_timestamp': processed_data.processing_timestamp.isoformat()
        }
    
    def export_to_json(self, processed_data: ProcessedData, filepath: str) -> bool:
        """Exporte les donnÃ©es traitÃ©es en JSON"""
        
        try:
            data = {
                'articles': [
                    {
                        'title': article.title,
                        'content': article.content,
                        'url': article.url,
                        'source': article.source,
                        'published_date': article.published_date.isoformat(),
                        'author': article.author,
                        'category': article.category,
                        'tags': article.tags,
                        'summary': article.summary,
                        'relevance_score': article.relevance_score
                    }
                    for article in processed_data.articles
                ],
                'metadata': {
                    'total_articles': processed_data.total_articles,
                    'sources_count': processed_data.sources_count,
                    'categories': processed_data.categories,
                    'processing_timestamp': processed_data.processing_timestamp.isoformat()
                }
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'export JSON: {e}")
            return False

