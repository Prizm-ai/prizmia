#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Newsletter PrizmAI - Version Finale Optimisée
Corrige tous les problèmes de formatage et de liens
"""

import os
import json
import logging
import datetime
from typing import Dict, List, Any
import feedparser
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from mailchimp3 import MailChimp
from dotenv import load_dotenv
import hashlib
import time
import re

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('newsletter_prizm.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

class NewsletterOrchestrator:
    """Orchestrateur principal pour la génération de newsletter"""
    
    def __init__(self):
        self.openai_key = os.getenv('OPENAI_API_KEY')
        self.mailchimp_key = os.getenv('MAILCHIMP_API_KEY')
        self.mailchimp_list = os.getenv('MAILCHIMP_LIST_ID')
        
        # Initialiser le client OpenAI
        if self.openai_key:
            self.openai_client = OpenAI(api_key=self.openai_key)
            logger.info("✅ Client OpenAI initialisé")
        else:
            self.openai_client = None
            logger.warning("⚠️ Pas de clé OpenAI")
            
        # Sources RSS premium françaises et internationales
        self.rss_sources = [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml',
            'https://feeds.feedburner.com/venturebeat/SZYF',
            'https://www.artificialintelligence-news.com/feed/',
            'https://www.lemonde.fr/pixels/rss_full.xml',
            'https://www.01net.com/rss/actualites/',
            'https://siecledigital.fr/feed/',
            'https://www.usine-digitale.fr/rss'
        ]
        
        self.collected_articles = []
        self.newsletter_content = {}
        
    def collect_articles(self) -> List[Dict]:
        """Collecte les articles depuis les sources RSS"""
        logger.info("🔍 Collecte des articles depuis les flux RSS...")
        articles = []
        
        for source_url in self.rss_sources:
            try:
                feed = feedparser.parse(source_url)
                feed_title = feed.feed.get('title', source_url)
                logger.info(f"  ✓ {feed_title}: {len(feed.entries)} articles")
                
                for entry in feed.entries[:3]:  # 3 articles par source
                    article = {
                        'title': entry.get('title', ''),
                        'link': entry.get('link', ''),
                        'summary': self._clean_summary(entry.get('summary', '')),
                        'published': entry.get('published', ''),
                        'source': feed_title
                    }
                    articles.append(article)
                    
            except Exception as e:
                logger.error(f"  ✗ Erreur sur {source_url}: {e}")
                
        # Déduplication et tri
        articles = self._deduplicate_articles(articles)
        self.collected_articles = articles[:20]  # Garder 20 articles
        
        logger.info(f"📚 Total: {len(self.collected_articles)} articles collectés")
        return self.collected_articles
    
    def _clean_summary(self, summary: str) -> str:
        """Nettoie le résumé HTML"""
        if not summary:
            return ""
        soup = BeautifulSoup(summary, 'html.parser')
        text = soup.get_text().strip()
        # Enlever les doubles espaces
        text = ' '.join(text.split())
        return text[:400] if text else ""
    
    def _deduplicate_articles(self, articles: List[Dict]) -> List[Dict]:
        """Supprime les doublons"""
        unique = {}
        for article in articles:
            if article['title']:
                title_hash = hashlib.md5(article['title'].lower().encode()).hexdigest()[:8]
                if title_hash not in unique:
                    unique[title_hash] = article
        return list(unique.values())
    
    def _clean_ai_text(self, text: str) -> str:
        """Nettoie le texte généré par l'IA"""
        # Remplacer les doubles étoiles par du bold HTML
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        # Remplacer les simples étoiles par de l'italique
        text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
        # Nettoyer les espaces multiples
        text = ' '.join(text.split())
        return text
    
    def generate_premium_content(self) -> Dict[str, Any]:
        """Génère le contenu avec GPT de manière robuste"""
        logger.info("🤖 Génération du contenu avec IA...")
        
        if not self.openai_client or not self.collected_articles:
            logger.warning("⚠️ Mode démo activé")
            return self._generate_demo_content()
        
        try:
            # Préparer le contexte avec les vrais articles
            articles_summary = self._prepare_article_context()
            
            # Prompt optimisé en français
            prompt = f"""Tu es le rédacteur en chef de PrizmAI, une newsletter premium tech en français.

Voici les actualités tech de la semaine à analyser:

{articles_summary}

Génère une newsletter structurée ENTIÈREMENT EN FRANÇAIS avec:

1. TITRE ACCROCHEUR: Un titre percutant pour la newsletter (sans étoiles)

2. ÉDITO (150 mots): Une analyse de LA tendance majeure de la semaine

3. TROIS ANALYSES APPROFONDIES (300 mots chacune):
   - Choisir les 3 sujets les plus importants
   - Titre clair et informatif (sans étoiles)
   - Analyse technique mais accessible
   - Implications business concrètes
   
4. CINQ NEWS RAPIDES:
   - Titre court et précis
   - Résumé de 50 mots maximum
   - Score d'impact de 1 à 10

5. TROIS ACTIONS CONCRÈTES pour les lecteurs

Important: 
- Tout en français, y compris les titres
- Pas d'astérisques pour la mise en forme
- Contenu professionnel et factuel
- Analyses basées sur les articles fournis"""

            # Appel à l'API
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un expert tech qui rédige une newsletter premium en français. Pas d'astérisques dans tes réponses."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3500
            )
            
            # Récupérer et nettoyer la réponse
            ai_content = response.choices[0].message.content
            ai_content = self._clean_ai_text(ai_content)
            
            logger.info("✅ Contenu IA généré avec succès")
            
            # Parser le contenu
            return self._parse_ai_content_enhanced(ai_content)
            
        except Exception as e:
            logger.error(f"❌ Erreur génération IA: {e}")
            return self._generate_demo_content()
    
    def _prepare_article_context(self) -> str:
        """Prépare le contexte des articles pour l'IA"""
        context = []
        for i, article in enumerate(self.collected_articles[:12], 1):
            if article['title'] and article['summary']:
                # Traduire les titres anglais si nécessaire
                title = article['title']
                summary = article['summary'][:200]
                
                context.append(
                    f"Article {i}:\n"
                    f"Titre: {title}\n"
                    f"Source: {article['source']}\n"
                    f"Résumé: {summary}\n"
                    f"URL: {article['link']}\n"
                )
        
        return "\n".join(context)
    
    def _parse_ai_content_enhanced(self, ai_content: str) -> Dict[str, Any]:
        """Parse le contenu IA de manière plus robuste"""
        
        # Structure de base avec les vrais liens des articles
        newsletter = {
            'title': f'PrizmAI Newsletter - {datetime.datetime.now().strftime("%d %B %Y")}',
            'edito': '',
            'deep_dives': [],
            'tech_radar': [],
            'metrics': {
                str(len(self.collected_articles)): 'Articles analysés',
                '8': 'Sources RSS',
                '100%': 'Contenu IA'
            },
            'action_items': [],
            'generated_at': datetime.datetime.now().isoformat()
        }
        
        # Diviser le contenu en lignes
        lines = ai_content.split('\n')
        current_section = None
        current_content = []
        deep_dive_count = 0
        radar_count = 0
        
        for line in lines:
            line = line.strip()
            
            # Détecter les sections par mots-clés
            if not line:
                continue
                
            # Titre de la newsletter
            if 'newsletter' in line.lower() or 'titre' in line.lower() and not newsletter['title']:
                if i + 1 < len(lines):
                    potential_title = lines[i + 1].strip()
                    if potential_title and not any(x in potential_title.lower() for x in ['édito', 'analyse', 'news']):
                        newsletter['title'] = self._clean_ai_text(potential_title)
                        
            # Édito
            elif 'édito' in line.lower() or 'edito' in line.lower():
                if current_section == 'deep_dive' and current_content:
                    self._add_deep_dive_with_link(newsletter, current_content, deep_dive_count)
                    deep_dive_count += 1
                current_section = 'edito'
                current_content = []
                
            # Analyses approfondies
            elif any(x in line.lower() for x in ['analyse', 'deep dive', 'approfond']) or (line and line[0].isdigit() and '.' in line[:3]):
                if current_section == 'edito' and current_content:
                    newsletter['edito'] = '<p>' + '</p><p>'.join(current_content) + '</p>'
                elif current_section == 'deep_dive' and current_content:
                    self._add_deep_dive_with_link(newsletter, current_content, deep_dive_count)
                    deep_dive_count += 1
                current_section = 'deep_dive'
                current_content = [line] if not line[0].isdigit() else [line[2:].strip()]
                
            # Tech Radar
            elif any(x in line.lower() for x in ['news', 'radar', 'actualité', 'bref']):
                if current_section == 'deep_dive' and current_content:
                    self._add_deep_dive_with_link(newsletter, current_content, deep_dive_count)
                    deep_dive_count += 1
                current_section = 'radar'
                current_content = []
                
            # Actions
            elif any(x in line.lower() for x in ['action', 'recommand', 'conseil']):
                if current_section == 'radar' and current_content:
                    self._add_radar_items_with_links(newsletter, current_content)
                current_section = 'actions'
                current_content = []
                
            # Contenu normal
            elif line and current_section:
                current_content.append(line)
        
        # Traiter la dernière section
        if current_section == 'actions' and current_content:
            newsletter['action_items'] = [self._clean_ai_text(item) for item in current_content[:3]]
        elif current_section == 'radar' and current_content:
            self._add_radar_items_with_links(newsletter, current_content)
        elif current_section == 'deep_dive' and current_content:
            self._add_deep_dive_with_link(newsletter, current_content, deep_dive_count)
        
        # Compléter avec du contenu par défaut si nécessaire
        self._ensure_complete_content(newsletter)
        
        self.newsletter_content = newsletter
        return newsletter
    
    def _add_deep_dive_with_link(self, newsletter: Dict, content: List[str], index: int):
        """Ajoute un deep dive avec le bon lien de l'article source"""
        if not content:
            return
            
        # Nettoyer le titre
        title = self._clean_ai_text(content[0])
        # Enlever les numéros au début si présents
        title = re.sub(r'^\d+\.\s*', '', title)
        
        # Contenu
        body = ' '.join(content[1:]) if len(content) > 1 else ''
        body = self._clean_ai_text(body)
        
        # Trouver l'article correspondant
        article_link = '#'
        if index < len(self.collected_articles):
            article_link = self.collected_articles[index].get('link', '#')
        
        newsletter['deep_dives'].append({
            'title': title,
            'content_html': f'<p>{body}</p>',
            'source_links': [article_link] if article_link != '#' else []
        })
    
    def _add_radar_items_with_links(self, newsletter: Dict, content: List[str]):
        """Ajoute les items radar avec les bons liens"""
        start_index = len(newsletter['deep_dives'])
        
        for i, item in enumerate(content[:5]):
            if item:
                # Nettoyer le texte
                item_clean = self._clean_ai_text(item)
                # Enlever les numéros et tirets au début
                item_clean = re.sub(r'^[-\d]+\.\s*', '', item_clean)
                
                # Trouver le lien correspondant
                article_index = start_index + i
                article_link = '#'
                if article_index < len(self.collected_articles):
                    article = self.collected_articles[article_index]
                    article_link = article.get('link', '#')
                
                # Séparer titre et résumé si possible
                parts = item_clean.split(':', 1)
                if len(parts) == 2:
                    title = parts[0].strip()
                    summary = parts[1].strip()
                else:
                    title = item_clean[:100]
                    summary = item_clean
                
                newsletter['tech_radar'].append({
                    'title': title,
                    'summary': summary[:200],
                    'link': article_link,
                    'impact_score': 7 + (i % 3)  # Score variable 7-9
                })
    
    def _ensure_complete_content(self, newsletter: Dict):
        """S'assure que la newsletter a tout le contenu nécessaire"""
        
        # Édito par défaut
        if not newsletter['edito']:
            newsletter['edito'] = """<p><strong>L'intelligence artificielle transforme notre quotidien.</strong></p>
                                    <p>Cette semaine, l'actualité tech nous montre l'accélération de l'innovation 
                                    dans tous les secteurs. Des avancées majeures en IA générative aux nouvelles 
                                    applications concrètes en entreprise, découvrez les tendances qui façonnent notre futur.</p>"""
        
        # Compléter les deep dives avec les vrais articles
        while len(newsletter['deep_dives']) < 3:
            index = len(newsletter['deep_dives'])
            if index < len(self.collected_articles):
                article = self.collected_articles[index]
                newsletter['deep_dives'].append({
                    'title': article['title'],
                    'content_html': f"""<p><strong>Source: {article['source']}</strong></p>
                                       <p>{article['summary']}</p>
                                       <p>Cette actualité illustre les transformations en cours dans le secteur tech. 
                                       Les implications pour les entreprises sont nombreuses et méritent une attention particulière.</p>""",
                    'source_links': [article['link']]
                })
        
        # Compléter le tech radar
        start_index = 3
        while len(newsletter['tech_radar']) < 5 and start_index < len(self.collected_articles):
            article = self.collected_articles[start_index]
            newsletter['tech_radar'].append({
                'title': article['title'],
                'summary': article['summary'][:150] + '...' if article['summary'] else 'Actualité tech importante',
                'link': article['link'],
                'impact_score': 7 + (start_index % 3)
            })
            start_index += 1
        
        # Actions par défaut
        if not newsletter['action_items']:
            newsletter['action_items'] = [
                "<strong>Veille technologique:</strong> Identifiez les innovations IA applicables à votre secteur",
                "<strong>Formation continue:</strong> Initiez vos équipes aux outils d'IA générative",
                "<strong>Stratégie 2025:</strong> Intégrez l'IA dans votre roadmap produit"
            ]
    
    def _generate_demo_content(self) -> Dict[str, Any]:
        """Génère un contenu de démonstration avec les vrais articles"""
        logger.info("📝 Génération du contenu de démonstration enrichi")
        
        content = {
            'title': f'PrizmAI Newsletter - {datetime.datetime.now().strftime("%d %B %Y")}',
            'edito': """<p><strong>L'IA générative redéfinit les standards de l'industrie tech.</strong></p>
                       <p>Cette semaine confirme l'accélération sans précédent de l'innovation en intelligence artificielle. 
                       Les annonces s'enchaînent, les investissements explosent, et les cas d'usage se multiplient.</p>
                       <p>Pour les entreprises, le message est clair : l'adoption de l'IA n'est plus une option, 
                       c'est une nécessité stratégique pour rester compétitif.</p>""",
            'deep_dives': [],
            'tech_radar': [],
            'metrics': {
                str(len(self.collected_articles)): 'Articles analysés',
                '8': 'Sources premium',
                '24/7': 'Veille automatisée'
            },
            'action_items': [
                '<strong>Audit IA:</strong> Cartographiez vos processus automatisables avec l\'IA générative',
                '<strong>POC rapide:</strong> Lancez un projet pilote avec ChatGPT ou Claude dans votre équipe',
                '<strong>Veille active:</strong> Abonnez-vous aux sources tech essentielles de cette newsletter'
            ],
            'generated_at': datetime.datetime.now().isoformat()
        }
        
        # Utiliser les vrais articles pour les deep dives
        for i, article in enumerate(self.collected_articles[:3]):
            if article['title'] and article['summary']:
                content['deep_dives'].append({
                    'title': article['title'],
                    'content_html': f"""<p><strong>{article['source']}</strong></p>
                                       <p>{article['summary']}</p>
                                       <p>Cette actualité souligne l'importance croissante de l'innovation technologique 
                                       dans la transformation digitale des entreprises. Les leaders du marché investissent 
                                       massivement pour maintenir leur avantage concurrentiel.</p>""",
                    'source_links': [article['link']]
                })
        
        # Tech radar avec les articles suivants
        for article in self.collected_articles[3:8]:
            if article['title']:
                content['tech_radar'].append({
                    'title': article['title'],
                    'summary': article.get('summary', '')[:150] + '...' if article.get('summary') else 'Actualité tech majeure de la semaine',
                    'link': article.get('link', '#'),
                    'impact_score': 8
                })
        
        self.newsletter_content = content
        return content
    
    def generate_html_template(self) -> str:
        """Génère le template HTML final"""
        content = self.newsletter_content
        
        html_template = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{content.get('title', 'PrizmAI Newsletter')}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
        }}
        
        .logo {{
            font-size: 3em;
            font-weight: 800;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: -2px;
        }}
        
        .tagline {{
            font-size: 1.2em;
            opacity: 0.9;
            font-weight: 400;
        }}
        
        .date-badge {{
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 25px;
            margin-top: 20px;
            font-weight: 600;
        }}
        
        .content {{
            padding: 40px;
        }}
        
        .edito {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 30px;
            margin-bottom: 40px;
            border-radius: 10px;
        }}
        
        .edito h2 {{
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.8em;
        }}
        
        .edito p {{
            margin-bottom: 12px;
        }}
        
        .deep-dive {{
            margin-bottom: 40px;
            padding-bottom: 40px;
            border-bottom: 2px solid #e0e0e0;
        }}
        
        .deep-dive:last-child {{
            border-bottom: none;
        }}
        
        .deep-dive h3 {{
            color: #333;
            font-size: 1.5em;
            margin-bottom: 15px;
            font-weight: 700;
        }}
        
        .deep-dive p {{
            margin-bottom: 15px;
            line-height: 1.8;
            color: #555;
        }}
        
        .source-links {{
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }}
        
        .source-links a {{
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            margin-right: 15px;
        }}
        
        .source-links a:hover {{
            text-decoration: underline;
        }}
        
        .tech-radar {{
            background: #fafafa;
            padding: 30px;
            border-radius: 15px;
            margin: 40px 0;
        }}
        
        .tech-radar h2 {{
            color: #764ba2;
            margin-bottom: 25px;
            font-size: 1.8em;
        }}
        
        .radar-item {{
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            transition: transform 0.2s;
        }}
        
        .radar-item:hover {{
            transform: translateX(5px);
            border-color: #667eea;
        }}
        
        .radar-item h4 {{
            color: #333;
            margin-bottom: 8px;
            font-weight: 600;
        }}
        
        .radar-item p {{
            color: #666;
            font-size: 0.95em;
            margin-bottom: 10px;
        }}
        
        .impact-score {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        .radar-link {{
            float: right;
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }}
        
        .radar-link:hover {{
            text-decoration: underline;
        }}
        
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }}
        
        .metric-card {{
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
        }}
        
        .metric-value {{
            font-size: 2.5em;
            font-weight: 800;
            color: #667eea;
        }}
        
        .metric-label {{
            color: #666;
            margin-top: 5px;
            font-weight: 600;
        }}
        
        .action-items {{
            background: #2c3e50;
            color: white;
            padding: 40px;
            margin: 40px -40px -40px -40px;
        }}
        
        .action-items h2 {{
            margin-bottom: 25px;
            font-size: 1.8em;
        }}
        
        .action-item {{
            background: rgba(255,255,255,0.1);
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }}
        
        .action-item strong {{
            color: #94b4ff;
        }}
        
        .footer {{
            background: #1a1a1a;
            color: white;
            text-align: center;
            padding: 30px;
        }}
        
        .social-links {{
            margin-top: 20px;
        }}
        
        .social-links a {{
            color: white;
            text-decoration: none;
            margin: 0 10px;
            font-weight: 600;
        }}
        
        @media (max-width: 600px) {{
            .header {{
                padding: 40px 20px;
            }}
            .logo {{
                font-size: 2em;
            }}
            .content {{
                padding: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PRIZM AI</div>
            <div class="tagline">Newsletter Premium • Intelligence Artificielle</div>
            <div class="date-badge">{datetime.datetime.now().strftime('%d %B %Y')}</div>
        </div>
        
        <div class="content">
            <div class="edito">
                <h2>📝 L'Édito</h2>
                {content.get('edito', '<p>Contenu éditorial...</p>')}
            </div>
            
            <h2 style="color: #667eea; margin: 40px 0 30px 0; font-size: 2em;">🔍 Deep Dives</h2>
            {''.join([self._format_deep_dive(dd, i) for i, dd in enumerate(content.get('deep_dives', []))])}
            
            <div class="tech-radar">
                <h2>📡 Tech Radar</h2>
                {''.join([self._format_radar_item(item) for item in content.get('tech_radar', [])])}
            </div>
            
            {self._format_metrics(content.get('metrics', {}))}
            
            <div class="action-items">
                <h2>🎯 Action Items</h2>
                {''.join([f'<div class="action-item">{item}</div>' for item in content.get('action_items', [])])}
            </div>
        </div>
        
        <div class="footer">
            <p>© 2024 PrizmAI • Newsletter Premium</p>
            <div class="social-links">
                <a href="https://prizm-ai.netlify.app/">Site Web</a>
            </div>
        </div>
    </div>
</body>
</html>"""
        
        return html_template
    
    def _format_deep_dive(self, dive: Dict, index: int) -> str:
        """Formate un deep dive avec numérotation"""
        source_links = dive.get('source_links', [])
        links_html = ''
        if source_links:
            links_html = '<div class="source-links">' + ''.join([f'<a href="{link}" target="_blank">Lire l\'article complet →</a>' for link in source_links if link and link != '#']) + '</div>'
        
        return f"""
        <div class="deep-dive">
            <h3>{index + 1}. {dive.get('title', 'Analyse')}</h3>
            {dive.get('content_html', '<p>...</p>')}
            {links_html}
        </div>
        """
    
    def _format_radar_item(self, item: Dict) -> str:
        """Formate un item radar avec le bon lien"""
        link = item.get('link', '#')
        has_link = link and link != '#'
        
        return f"""
        <div class="radar-item">
            <h4>{item.get('title', '')}</h4>
            <p>{item.get('summary', '')}</p>
            <span class="impact-score">Impact: {item.get('impact_score', 7)}/10</span>
            {f'<a href="{link}" class="radar-link" target="_blank">Lire →</a>' if has_link else ''}
        </div>
        """
    
    def _format_metrics(self, metrics: Dict) -> str:
        """Formate les métriques"""
        if not metrics:
            return ""
            
        metric_cards = ''.join([
            f"""<div class="metric-card">
                <div class="metric-value">{value}</div>
                <div class="metric-label">{key}</div>
            </div>"""
            for key, value in metrics.items()
        ])
        
        return f"""
        <h2 style="color: #764ba2; margin: 40px 0 20px 0; font-size: 1.8em;">📊 Metrics & Insights</h2>
        <div class="metrics">{metric_cards}</div>
        """
    
    def send_via_mailchimp(self, test_mode: bool = True) -> bool:
        """Envoie la newsletter via Mailchimp"""
        logger.info("📧 Envoi via Mailchimp...")
        
        if not self.mailchimp_key or not self.mailchimp_list:
            logger.error("❌ Configuration Mailchimp manquante")
            return False
            
        try:
            # Initialisation du client
            client = MailChimp(mc_api=self.mailchimp_key, mc_user='PrizmAI')
            
            # Création de la campagne
            campaign_data = {
                'type': 'regular',
                'recipients': {
                    'list_id': self.mailchimp_list
                },
                'settings': {
                    'subject_line': self.newsletter_content.get('title', 'PrizmAI Newsletter'),
                    'preview_text': 'Votre dose hebdomadaire d\'intelligence artificielle',
                    'title': f"PrizmAI_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}",
                    'from_name': 'PrizmAI',
                    'reply_to': os.getenv('EMAIL_FROM', 'newsletter@prizm-ai.com')
                }
            }
            
            campaign = client.campaigns.create(data=campaign_data)
            campaign_id = campaign['id']
            logger.info(f"✅ Campagne créée: {campaign_id}")
            
            # Ajout du contenu HTML
            content_data = {
                'html': self.generate_html_template()
            }
            
            client.campaigns.content.update(campaign_id=campaign_id, data=content_data)
            logger.info("✅ Contenu HTML ajouté")
            
            if test_mode:
                # Envoi de test
                test_email = os.getenv('TEST_EMAIL')
                if test_email:
                    test_data = {
                        'test_emails': [test_email],
                        'send_type': 'html'
                    }
                    client.campaigns.actions.test(campaign_id=campaign_id, data=test_data)
                    logger.info(f"✅ Newsletter de test envoyée à {test_email}")
            else:
                # Envoi réel
                client.campaigns.actions.send(campaign_id=campaign_id)
                logger.info("✅ Newsletter envoyée aux abonnés")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur Mailchimp: {e}")
            return False
    
    def run(self, test_mode: bool = True):
        """Lance le processus complet"""
        logger.info("🚀 Démarrage de PrizmAI Newsletter")
        logger.info(f"📅 Date: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}")
        
        # Collecte des articles
        self.collect_articles()
        
        # Génération du contenu
        self.generate_premium_content()
        
        # Sauvegarde locale pour preview
        html_content = self.generate_html_template()
        preview_path = 'newsletter_preview.html'
        with open(preview_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logger.info(f"✅ Preview sauvegardée: {preview_path}")
        
        # Envoi via Mailchimp
        self.send_via_mailchimp(test_mode=test_mode)
        
        logger.info("✅ Processus terminé!")
        return True

if __name__ == "__main__":
    orchestrator = NewsletterOrchestrator()
    orchestrator.run(test_mode=True)