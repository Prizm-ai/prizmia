"""
Parseur RSS spÃ©cialisÃ© pour les sources franÃ§aises
Support pour RSS 2.0, Atom et formats spÃ©cifiques
"""

import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import dateutil.parser
from typing import List, Dict, Any, Optional
import re
import logging
from urllib.parse import urljoin, urlparse

from .text_utils import clean_html, clean_rss_content
from .http_client import RSSClient

class RSSItem:
    """ReprÃ©sente un article RSS"""
    
    def __init__(self):
        self.title: str = ""
        self.description: str = ""
        self.content: str = ""
        self.link: str = ""
        self.guid: str = ""
        self.published_date: Optional[datetime] = None
        self.author: str = ""
        self.categories: List[str] = []
        self.image_url: str = ""
        self.source: str = ""
        self.language: str = "fr"
        self.is_breaking: bool = False
        self.importance_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit l'item en dictionnaire"""
        return {
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'link': self.link,
            'guid': self.guid,
            'published_date': self.published_date.isoformat() if self.published_date else None,
            'author': self.author,
            'categories': self.categories,
            'image_url': self.image_url,
            'source': self.source,
            'language': self.language,
            'is_breaking': self.is_breaking,
            'importance_score': self.importance_score
        }
    
    def __repr__(self):
        return f"RSSItem(title='{self.title[:50]}...', source='{self.source}')"

class RSSParser:
    """Parseur RSS avec support multi-format"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.http_client = RSSClient()
    
    async def parse_feed(self, url: str) -> List[RSSItem]:
        """Parse un flux RSS depuis une URL"""
        try:
            xml_content = await self.http_client.fetch_rss(url)
            return self.parse_xml(xml_content, url)
        except Exception as e:
            self.logger.error(f"Erreur parsing feed {url}: {e}")
            return []
    
    def parse_xml(self, xml_content: str, source_url: str = "") -> List[RSSItem]:
        """Parse le contenu XML d'un flux RSS"""
        try:
            # Nettoyage du XML (problÃ¨mes d'encodage frÃ©quents)
            xml_content = self._clean_xml(xml_content)
            
            root = ET.fromstring(xml_content)
            
            # DÃ©tection du format
            if root.tag == 'rss':
                return self._parse_rss2(root, source_url)
            elif root.tag.endswith('feed'):  # Atom
                return self._parse_atom(root, source_url)
            else:
                self.logger.warning(f"Format RSS non reconnu: {root.tag}")
                return []
                
        except ET.XMLSyntaxError as e:
            self.logger.error(f"Erreur XML: {e}")
            return []
        except Exception as e:
            self.logger.error(f"Erreur parsing: {e}")
            return []
    
    def _clean_xml(self, xml_content: str) -> str:
        """Nettoie le contenu XML"""
        # Suppression du BOM
        if xml_content.startswith('\ufeff'):
            xml_content = xml_content[1:]
        
        # Correction des caractÃ¨res problÃ©matiques
        xml_content = xml_content.replace('&nbsp;', ' ')
        xml_content = xml_content.replace('&hellip;', '...')
        
        # Suppression des caractÃ¨res de contrÃ´le invalides
        xml_content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', xml_content)
        
        return xml_content
    
    def _parse_rss2(self, root: ET.Element, source_url: str) -> List[RSSItem]:
        """Parse un flux RSS 2.0"""
        items = []
        
        # Informations du canal
        channel = root.find('.//channel')
        if channel is None:
            return items
        
        channel_title = self._get_text(channel.find('title'), '')
        
        # Parse des items
        for item_elem in channel.findall('item'):
            item = RSSItem()
            item.source = channel_title or self._extract_domain(source_url)
            
            # Titre
            item.title = clean_html(self._get_text(item_elem.find('title'), ''))
            
            # Description
            desc_elem = item_elem.find('description')
            if desc_elem is not None:
                item.description = clean_rss_content(self._get_text(desc_elem, ''))
            
            # Contenu (content:encoded ou autre)
            content_elem = item_elem.find('.//{http://purl.org/rss/1.0/modules/content/}encoded')
            if content_elem is not None:
                item.content = clean_rss_content(self._get_text(content_elem, ''))
            else:
                item.content = item.description
            
            # Lien
            item.link = self._get_text(item_elem.find('link'), '')
            
            # GUID
            guid_elem = item_elem.find('guid')
            if guid_elem is not None:
                item.guid = self._get_text(guid_elem, '')
            else:
                item.guid = item.link
            
            # Date de publication
            pub_date = self._get_text(item_elem.find('pubDate'), '')
            item.published_date = self._parse_date(pub_date)
            
            # Auteur
            author_elem = item_elem.find('author') or item_elem.find('.//{http://purl.org/dc/elements/1.1/}creator')
            if author_elem is not None:
                item.author = self._get_text(author_elem, '')
            
            # CatÃ©gories
            for cat_elem in item_elem.findall('category'):
                category = self._get_text(cat_elem, '').strip()
                if category:
                    item.categories.append(category)
            
            # Image
            enclosure = item_elem.find('enclosure')
            if enclosure is not None and enclosure.get('type', '').startswith('image/'):
                item.image_url = enclosure.get('url', '')
            
            # Media RSS
            if not item.image_url:
                media_content = item_elem.find('.//{http://search.yahoo.com/mrss/}content')
                if media_content is not None and media_content.get('medium') == 'image':
                    item.image_url = media_content.get('url', '')
            
            if item.title and (item.content or item.description):
                items.append(item)
        
        return items
    
    def _parse_atom(self, root: ET.Element, source_url: str) -> List[RSSItem]:
        """Parse un flux Atom"""
        items = []
        
        # Namespace Atom
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        # Titre du feed
        feed_title_elem = root.find('atom:title', ns)
        feed_title = self._get_text(feed_title_elem, '') if feed_title_elem is not None else self._extract_domain(source_url)
        
        # Parse des entrÃ©es
        for entry_elem in root.findall('atom:entry', ns):
            item = RSSItem()
            item.source = feed_title
            
            # Titre
            title_elem = entry_elem.find('atom:title', ns)
            if title_elem is not None:
                item.title = clean_html(self._get_text(title_elem, ''))
            
            # Contenu/Summary
            content_elem = entry_elem.find('atom:content', ns)
            summary_elem = entry_elem.find('atom:summary', ns)
            
            if content_elem is not None:
                item.content = clean_rss_content(self._get_text(content_elem, ''))
                item.description = item.content[:200] + '...' if len(item.content) > 200 else item.content
            elif summary_elem is not None:
                item.description = clean_rss_content(self._get_text(summary_elem, ''))
                item.content = item.description
            
            # Lien
            link_elem = entry_elem.find('atom:link[@rel="alternate"]', ns)
            if link_elem is None:
                link_elem = entry_elem.find('atom:link', ns)
            if link_elem is not None:
                item.link = link_elem.get('href', '')
            
            # ID
            id_elem = entry_elem.find('atom:id', ns)
            if id_elem is not None:
                item.guid = self._get_text(id_elem, '')
            else:
                item.guid = item.link
            
            # Date
            published_elem = entry_elem.find('atom:published', ns)
            updated_elem = entry_elem.find('atom:updated', ns)
            
            date_text = ''
            if published_elem is not None:
                date_text = self._get_text(published_elem, '')
            elif updated_elem is not None:
                date_text = self._get_text(updated_elem, '')
            
            item.published_date = self._parse_date(date_text)
            
            # Auteur
            author_elem = entry_elem.find('atom:author/atom:name', ns)
            if author_elem is not None:
                item.author = self._get_text(author_elem, '')
            
            # CatÃ©gories
            for cat_elem in entry_elem.findall('atom:category', ns):
                term = cat_elem.get('term', '').strip()
                if term:
                    item.categories.append(term)
            
            if item.title and (item.content or item.description):
                items.append(item)
        
        return items
    
    def _get_text(self, element: Optional[ET.Element], default: str = "") -> str:
        """RÃ©cupÃ¨re le texte d'un Ã©lÃ©ment XML"""
        if element is None:
            return default
        return element.text or default
    
    def _parse_date(self, date_string: str) -> Optional[datetime]:
        """Parse une date depuis diffÃ©rents formats"""
        if not date_string:
            return None
        
        try:
            # Tentative avec dateutil (supporte la plupart des formats)
            parsed_date = dateutil.parser.parse(date_string, ignoretz=False)
            
            # Conversion en UTC si pas de timezone
            if parsed_date.tzinfo is None:
                parsed_date = parsed_date.replace(tzinfo=timezone.utc)
            
            return parsed_date
            
        except Exception as e:
            self.logger.warning(f"Impossible de parser la date '{date_string}': {e}")
            return None
    
    def _extract_domain(self, url: str) -> str:
        """Extrait le domaine d'une URL"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            # Suppression du www.
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except:
            return "unknown"

class FrenchRSSParser(RSSParser):
    """Parseur RSS spÃ©cialisÃ© pour les sources franÃ§aises"""
    
    def __init__(self):
        super().__init__()
        
        # Patterns spÃ©cifiques aux sources franÃ§aises
        self.french_date_patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # DD/MM/YYYY
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # DD-MM-YYYY
            r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD
        ]
        
        # Mots-clÃ©s pour identifier le contenu important
        self.importance_keywords = [
            'breaking', 'urgent', 'exclusif', 'derniÃ¨re minute',
            'alerte', 'flash', 'info', 'important', 'actualitÃ©',
            'en direct', 'live', 'mise Ã  jour'
        ]
        
        # Sources franÃ§aises prioritaires
        self.priority_sources = [
            'lemonde.fr', 'lefigaro.fr', 'liberation.fr',
            'franceinfo.fr', 'europe1.fr', 'rfi.fr',
            'france24.com', 'bfmtv.com', 'lci.fr'
        ]
    
    def parse_xml(self, xml_content: str, source_url: str = "") -> List[RSSItem]:
        """Parse avec amÃ©liorations franÃ§aises"""
        items = super().parse_xml(xml_content, source_url)
        
        # AmÃ©lioration du contenu franÃ§ais
        enhanced_items = []
        for item in items:
            enhanced_item = self._enhance_french_content(item)
            enhanced_items.append(enhanced_item)
        
        return enhanced_items
    
    def _enhance_french_content(self, item: RSSItem) -> RSSItem:
        """AmÃ©liore le contenu pour les sources franÃ§aises"""
        
        # DÃ©tection de l'importance
        title_lower = item.title.lower()
        content_lower = (item.content or item.description).lower()
        
        # Score d'importance basÃ© sur les mots-clÃ©s
        importance_score = 0.0
        for keyword in self.importance_keywords:
            if keyword in title_lower:
                importance_score += 2.0
            if keyword in content_lower:
                importance_score += 1.0
        
        # Bonus pour les sources prioritaires
        domain = self._extract_domain(item.link)
        if domain in self.priority_sources:
            importance_score += 1.0
        
        item.importance_score = importance_score
        item.is_breaking = importance_score >= 3.0
        
        # Nettoyage spÃ©cifique au franÃ§ais
        if item.content:
            item.content = self._clean_french_content(item.content)
        if item.description:
            item.description = self._clean_french_content(item.description)
        
        # AmÃ©lioration du titre
        item.title = self._enhance_french_title(item.title)
        
        return item
    
    def _clean_french_content(self, content: str) -> str:
        """Nettoie le contenu franÃ§ais"""
        if not content:
            return content
        
        # Suppression des mentions de cookies/RGPD frÃ©quentes
        content = re.sub(r'.*cookies.*rgpd.*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'.*accepter.*cookies.*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'.*politique.*confidentialitÃ©.*', '', content, flags=re.IGNORECASE)
        
        # Suppression des mentions publicitaires
        content = re.sub(r'.*publicitÃ©.*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'.*pub\s.*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'.*sponsor.*', '', content, flags=re.IGNORECASE)
        
        # Suppression des mentions de partage social
        content = re.sub(r'.*partager sur.*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'.*suivez-nous.*', '', content, flags=re.IGNORECASE)
        content = re.sub(r'.*abonnez-vous.*', '', content, flags=re.IGNORECASE)
        
        # Suppression des mentions de newsletter/email
        content = re.sub(r'.*newsletter.*email.*', '', content, flags=re.IGNORECASE)
        
        # Nettoyage des espaces multiples
        content = re.sub(r'\s+', ' ', content).strip()
        
        return content
    
    def _enhance_french_title(self, title: str) -> str:
        """AmÃ©liore les titres franÃ§ais"""
        if not title:
            return title
        
        # Capitalisation correcte aprÃ¨s les deux-points
        title = re.sub(r':\s*([a-z])', lambda m: f': {m.group(1).upper()}', title)
        
        # Suppression des mentions de source redondantes
        title = re.sub(r'\s*-\s*(Le Monde|Le Figaro|LibÃ©ration).*$', '', title)
        
        return title.strip()
    
    def get_trending_topics(self, items: List[RSSItem], limit: int = 10) -> List[Dict[str, Any]]:
        """Identifie les sujets tendance dans les articles franÃ§ais"""
        topic_counts = {}
        
        for item in items:
            # Extraction des mots-clÃ©s depuis le titre et les catÃ©gories
            words = item.title.lower().split()
            words.extend([cat.lower() for cat in item.categories])
            
            # Filtrage des mots communs
            filtered_words = [w for w in words if len(w) > 3 and w not in self._get_stop_words()]
            
            for word in filtered_words:
                if word not in topic_counts:
                    topic_counts[word] = {
                        'count': 0,
                        'importance': 0.0,
                        'sources': set()
                    }
                
                topic_counts[word]['count'] += 1
                topic_counts[word]['importance'] += item.importance_score
                topic_counts[word]['sources'].add(item.source)
        
        # Tri par popularitÃ© et importance
        sorted_topics = sorted(
            topic_counts.items(),
            key=lambda x: (x[1]['count'] * x[1]['importance']),
            reverse=True
        )
        
        return [
            {
                'topic': topic,
                'count': data['count'],
                'importance': data['importance'],
                'sources': list(data['sources'])
            }
            for topic, data in sorted_topics[:limit]
        ]
    
    def _get_stop_words(self) -> set:
        """Mots vides franÃ§ais Ã  ignorer"""
        return {
            'dans', 'avec', 'pour', 'une', 'sur', 'sont', 'ses', 'comme',
            'par', 'plus', 'pas', 'tout', 'leur', 'nous', 'vous', 'ils',
            'elle', 'ces', 'aux', 'son', 'cette', 'mÃªme', 'tous', 'aprÃ¨s',
            'sans', 'sous', 'entre', 'encore', 'aussi', 'alors', 'trÃ¨s',
            'bien', 'oÃ¹', 'comment', 'quand', 'pourquoi', 'avant', 'depuis'
        }

