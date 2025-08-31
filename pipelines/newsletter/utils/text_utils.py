"""
Utilitaires de traitement de texte pour Newsletter AI
Nettoyage, extraction et analyse de contenu
"""

import re
import html
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin, urlparse
from datetime import datetime
import hashlib
import unicodedata

def clean_html(text: str) -> str:
    """Supprime les balises HTML et nettoie le texte"""
    if not text:
        return ""
    
    # Suppression des balises HTML
    text = re.sub(r'<[^>]+>', '', text)
    
    # DÃ©codage des entitÃ©s HTML
    text = html.unescape(text)
    
    # Nettoyage des espaces multiples
    text = re.sub(r'\s+', ' ', text)
    
    # Suppression des espaces en dÃ©but/fin
    text = text.strip()
    
    return text

def extract_text_from_html(html_content: str, max_length: Optional[int] = None) -> str:
    """Extrait le texte principal d'un contenu HTML"""
    if not html_content:
        return ""
    
    # Suppression des scripts et styles
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Suppression des commentaires HTML
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
    
    # Extraction du contenu principal (balises p, div, article)
    main_content_pattern = r'<(?:p|div|article)[^>]*>(.*?)</(?:p|div|article)>'
    matches = re.findall(main_content_pattern, html_content, flags=re.DOTALL | re.IGNORECASE)
    
    if matches:
        text = ' '.join(matches)
    else:
        text = html_content
    
    # Nettoyage final
    text = clean_html(text)
    
    if max_length and len(text) > max_length:
        text = text[:max_length].rsplit(' ', 1)[0] + '...'
    
    return text

def normalize_text(text: str) -> str:
    """Normalise le texte (accents, casse, espaces)"""
    if not text:
        return ""
    
    # Normalisation Unicode
    text = unicodedata.normalize('NFKD', text)
    
    # Suppression des caractÃ¨res de contrÃ´le
    text = ''.join(char for char in text if not unicodedata.category(char).startswith('C'))
    
    # Nettoyage des espaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def extract_keywords(text: str, min_length: int = 3, max_keywords: int = 20) -> List[str]:
    """Extrait les mots-clÃ©s d'un texte"""
    if not text:
        return []
    
    # Mots vides franÃ§ais
    stopwords = {
        'le', 'de', 'un', 'Ã ', 'Ãªtre', 'et', 'en', 'avoir', 'que', 'pour',
        'dans', 'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout',
        'plus', 'par', 'grand', 'ou', 'si', 'les', 'des', 'ces', 'ses', 'mes',
        'tes', 'nos', 'vos', 'leur', 'leurs', 'du', 'au', 'aux', 'la', 'les',
        'cette', 'cet', 'son', 'sa', 'mon', 'ma', 'ton', 'ta', 'notre', 'votre'
    }
    
    # Extraction des mots
    words = re.findall(r'\b[a-zA-ZÃ€-Ã¿]+\b', text.lower())
    
    # Filtrage
    keywords = []
    word_counts = {}
    
    for word in words:
        if (len(word) >= min_length 
            and word not in stopwords 
            and not word.isdigit()):
            word_counts[word] = word_counts.get(word, 0) + 1
    
    # Tri par frÃ©quence
    sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    keywords = [word for word, count in sorted_words[:max_keywords]]
    
    return keywords

def calculate_readability_score(text: str) -> Dict[str, float]:
    """Calcule des scores de lisibilitÃ©"""
    if not text:
        return {"flesch": 0, "sentences": 0, "words": 0, "syllables": 0}
    
    # Comptage des phrases
    sentences = len(re.findall(r'[.!?]+', text))
    if sentences == 0:
        sentences = 1
    
    # Comptage des mots
    words = len(re.findall(r'\b\w+\b', text))
    if words == 0:
        return {"flesch": 0, "sentences": sentences, "words": 0, "syllables": 0}
    
    # Estimation des syllabes (approximative pour le franÃ§ais)
    syllables = estimate_syllables(text)
    
    # Score de Flesch adaptÃ© au franÃ§ais
    flesch_score = 207 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
    
    return {
        "flesch": max(0, min(100, flesch_score)),
        "sentences": sentences,
        "words": words,
        "syllables": syllables
    }

def estimate_syllables(text: str) -> int:
    """Estime le nombre de syllabes dans un texte franÃ§ais"""
    # Voyelles franÃ§aises
    vowels = 'aeiouÃ Ã¡Ã¢Ã¤Ã¨Ã©ÃªÃ«Ã¬Ã­Ã®Ã¯Ã²Ã³Ã´Ã¶Ã¹ÃºÃ»Ã¼Ã¿'
    
    syllable_count = 0
    words = re.findall(r'\b[a-zA-ZÃ€-Ã¿]+\b', text.lower())
    
    for word in words:
        word_syllables = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                word_syllables += 1
            prev_was_vowel = is_vowel
        
        # Minimum une syllabe par mot
        if word_syllables == 0:
            word_syllables = 1
        
        syllable_count += word_syllables
    
    return syllable_count

def extract_urls(text: str) -> List[str]:
    """Extrait les URLs d'un texte"""
    url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?'
    return re.findall(url_pattern, text)

def extract_emails(text: str) -> List[str]:
    """Extrait les adresses email d'un texte"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    return re.findall(email_pattern, text)

def generate_text_hash(text: str) -> str:
    """GÃ©nÃ¨re un hash unique pour un texte"""
    normalized = normalize_text(text)
    return hashlib.md5(normalized.encode('utf-8')).hexdigest()

def extract_sentences(text: str, max_sentences: Optional[int] = None) -> List[str]:
    """Extrait les phrases d'un texte"""
    if not text:
        return []
    
    # Pattern pour dÃ©tecter les fins de phrase
    sentence_pattern = r'[.!?]+\s*'
    sentences = re.split(sentence_pattern, text)
    
    # Nettoyage des phrases vides
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if max_sentences:
        sentences = sentences[:max_sentences]
    
    return sentences

def truncate_text(text: str, max_length: int, preserve_words: bool = True) -> str:
    """Tronque un texte Ã  une longueur maximale"""
    if not text or len(text) <= max_length:
        return text
    
    if preserve_words:
        # Tronque au dernier mot complet
        truncated = text[:max_length].rsplit(' ', 1)[0]
        return truncated + '...' if truncated != text else text
    else:
        return text[:max_length] + '...'

def detect_language(text: str) -> str:
    """DÃ©tecte la langue d'un texte (basique)"""
    if not text:
        return "unknown"
    
    # Mots indicateurs franÃ§ais
    french_indicators = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'avec', 'dans', 'sur', 'pour']
    english_indicators = ['the', 'and', 'or', 'with', 'in', 'on', 'for', 'to', 'of', 'a', 'an']
    
    words = re.findall(r'\b\w+\b', text.lower())
    
    french_count = sum(1 for word in words if word in french_indicators)
    english_count = sum(1 for word in words if word in english_indicators)
    
    if french_count > english_count:
        return "fr"
    elif english_count > french_count:
        return "en"
    else:
        return "unknown"

def clean_rss_content(content: str) -> str:
    """Nettoie le contenu spÃ©cifique aux flux RSS"""
    if not content:
        return ""
    
    # Suppression des balises CDATA
    content = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', content, flags=re.DOTALL)
    
    # Suppression des balises RSS spÃ©cifiques
    rss_tags = ['description', 'content:encoded', 'summary']
    for tag in rss_tags:
        content = re.sub(f'<{tag}[^>]*>(.*?)</{tag}>', r'\1', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Nettoyage HTML standard
    content = clean_html(content)
    
    return content

def extract_article_metadata(html_content: str) -> Dict[str, Any]:
    """Extrait les mÃ©tadonnÃ©es d'un article"""
    metadata = {
        'title': '',
        'description': '',
        'author': '',
        'published_date': '',
        'keywords': [],
        'image_url': ''
    }
    
    if not html_content:
        return metadata
    
    # Titre
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
    if title_match:
        metadata['title'] = clean_html(title_match.group(1))
    
    # Meta description
    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', html_content, re.IGNORECASE)
    if desc_match:
        metadata['description'] = desc_match.group(1)
    
    # Meta keywords
    keywords_match = re.search(r'<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"\']*)["\']', html_content, re.IGNORECASE)
    if keywords_match:
        metadata['keywords'] = [k.strip() for k in keywords_match.group(1).split(',')]
    
    # Open Graph title
    og_title_match = re.search(r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\']', html_content, re.IGNORECASE)
    if og_title_match and not metadata['title']:
        metadata['title'] = og_title_match.group(1)
    
    # Open Graph description
    og_desc_match = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\']', html_content, re.IGNORECASE)
    if og_desc_match and not metadata['description']:
        metadata['description'] = og_desc_match.group(1)
    
    # Open Graph image
    og_image_match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']*)["\']', html_content, re.IGNORECASE)
    if og_image_match:
        metadata['image_url'] = og_image_match.group(1)
    
    return metadata

def format_text_for_email(text: str, line_length: int = 72) -> str:
    """Formate le texte pour l'email (ligne de longueur fixe)"""
    if not text:
        return ""
    
    paragraphs = text.split('\n\n')
    formatted_paragraphs = []
    
    for paragraph in paragraphs:
        if not paragraph.strip():
            formatted_paragraphs.append('')
            continue
        
        words = paragraph.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= line_length:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        formatted_paragraphs.append('\n'.join(lines))
    
    return '\n\n'.join(formatted_paragraphs)

def create_text_summary(text: str, max_sentences: int = 3) -> str:
    """CrÃ©e un rÃ©sumÃ© automatique basique"""
    if not text:
        return ""
    
    sentences = extract_sentences(text)
    
    if len(sentences) <= max_sentences:
        return text
    
    # Score simple basÃ© sur la longueur et la position
    scored_sentences = []
    
    for i, sentence in enumerate(sentences):
        score = len(sentence.split())  # Score basÃ© sur le nombre de mots
        
        # Bonus pour les premiÃ¨res phrases
        if i < 3:
            score *= 1.5
        
        # Bonus pour les phrases avec des mots-clÃ©s importants
        keywords = ['important', 'principal', 'essentiel', 'majeur', 'critique']
        for keyword in keywords:
            if keyword in sentence.lower():
                score *= 1.2
        
        scored_sentences.append((score, sentence))
    
    # Tri par score et sÃ©lection des meilleures
    scored_sentences.sort(reverse=True)
    best_sentences = [sent for score, sent in scored_sentences[:max_sentences]]
    
    return ' '.join(best_sentences)

class TextProcessor:
    """Processeur de texte avec configuration"""
    
    def __init__(self, 
                 min_word_length: int = 3,
                 max_keywords: int = 20,
                 default_encoding: str = 'utf-8'):
        self.min_word_length = min_word_length
        self.max_keywords = max_keywords
        self.default_encoding = default_encoding
    
    def process_article(self, raw_content: str, url: str = "") -> Dict[str, Any]:
        """Traite un article complet"""
        processed = {
            'raw_content': raw_content,
            'cleaned_content': '',
            'title': '',
            'summary': '',
            'keywords': [],
            'readability': {},
            'metadata': {},
            'word_count': 0,
            'language': 'unknown',
            'hash': ''
        }
        
        if not raw_content:
            return processed
        
        # Extraction des mÃ©tadonnÃ©es
        processed['metadata'] = extract_article_metadata(raw_content)
        processed['title'] = processed['metadata'].get('title', '')
        
        # Nettoyage du contenu
        processed['cleaned_content'] = extract_text_from_html(raw_content)
        
        if processed['cleaned_content']:
            # Analyse du texte
            processed['keywords'] = extract_keywords(
                processed['cleaned_content'], 
                self.min_word_length, 
                self.max_keywords
            )
            processed['readability'] = calculate_readability_score(processed['cleaned_content'])
            processed['word_count'] = len(processed['cleaned_content'].split())
            processed['language'] = detect_language(processed['cleaned_content'])
            processed['hash'] = generate_text_hash(processed['cleaned_content'])
            
            # CrÃ©ation du rÃ©sumÃ©
            processed['summary'] = create_text_summary(processed['cleaned_content'])
        
        return processed

