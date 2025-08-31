# utils/template_engine.py

import re
from datetime import datetime
from typing import Dict, List, Any
import html

class TemplateEngine:
    """
    Moteur de template pour générer les newsletters HTML
    Compatible avec le système multi-agents de Newsletter PrizmAI
    """
    
    def __init__(self, template_path: str = None):
        """
        Initialise le moteur de template
        
        Args:
            template_path: Chemin vers le fichier template HTML (optionnel)
        """
        self.template_content = self._get_default_template()
        if template_path:
            with open(template_path, 'r', encoding='utf-8') as f:
                self.template_content = f.read()
    
    def generate_newsletter(self, data: Dict[str, Any]) -> str:
        """
        Génère le HTML final de la newsletter
        
        Args:
            data: Dictionnaire contenant toutes les données pour la newsletter
                {
                    'issue_number': int,
                    'intro_title': str,
                    'intro_text': str,
                    'articles': List[Dict],
                    'prizm_insight': str,
                    'unsubscribe_url': str,
                    'update_preferences_url': str
                }
        
        Returns:
            str: HTML complet de la newsletter
        """
        html_content = self.template_content
        
        # Remplacer les variables simples
        replacements = {
            '{{ISSUE_NUMBER}}': str(data.get('issue_number', 1)),
            '{{INTRO_TITLE}}': self._escape_html(data.get('intro_title', 'Newsletter Prizm AI')),
            '{{INTRO_TEXT}}': self._escape_html(data.get('intro_text', '')),
            '{{PRIZM_INSIGHT}}': self._escape_html(data.get('prizm_insight', '')),
            '{{UNSUBSCRIBE_URL}}': data.get('unsubscribe_url', '#'),
            '{{UPDATE_PREFERENCES_URL}}': data.get('update_preferences_url', '#')
        }
        
        for placeholder, value in replacements.items():
            html_content = html_content.replace(placeholder, value)
        
        # Traiter la section articles (plus complexe)
        articles_html = self._generate_articles_html(data.get('articles', []))
        html_content = self._replace_articles_section(html_content, articles_html)
        
        return html_content
    
    def _generate_articles_html(self, articles: List[Dict]) -> str:
        """
        Génère le HTML pour tous les articles
        
        Args:
            articles: Liste des articles avec leurs métadonnées
        
        Returns:
            str: HTML des articles
        """
        if not articles:
            return '<div class="article"><h3>Aucun article disponible cette semaine</h3></div>'
        
        articles_html = []
        
        for article in articles:
            article_html = f"""
            <div class="article">
                <div class="article-category">{self._escape_html(article.get('category', 'Tech'))}</div>
                <h3><a href="{article.get('url', '#')}">{self._escape_html(article.get('title', 'Sans titre'))}</a></h3>
                <div class="article-meta">
                    <span class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {self._format_date(article.get('date', ''))}
                    </span>
                    <span class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        {self._escape_html(article.get('source', 'Source inconnue'))}
                    </span>
                    <span class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        {article.get('read_time', 5)} min
                    </span>
                </div>
                <div class="article-summary">{self._escape_html(article.get('summary', ''))}</div>
                <a href="{article.get('url', '#')}" class="read-more">Lire l'article complet</a>
            </div>
            """
            articles_html.append(article_html.strip())
        
        return '\n'.join(articles_html)
    
    def _replace_articles_section(self, html_content: str, articles_html: str) -> str:
        """
        Remplace la section template des articles par le HTML généré
        """
        # Pattern pour trouver la section articles template
        pattern = r'{{#ARTICLES}}.*?{{/ARTICLES}}'
        return re.sub(pattern, articles_html, html_content, flags=re.DOTALL)
    
    def _format_date(self, date_str: str) -> str:
        """
        Formate une date pour l'affichage
        
        Args:
            date_str: Date au format string
            
        Returns:
            str: Date formatée
        """
        if not date_str:
            return datetime.now().strftime('%d %b %Y')
        
        # Si c'est déjà formaté, on retourne tel quel
        if any(month in date_str.lower() for month in ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']):
            return date_str
        
        try:
            # Tenter de parser différents formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y']:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime('%d %b %Y')
                except ValueError:
                    continue
            return date_str
        except:
            return date_str
    
    def _escape_html(self, text: str) -> str:
        """
        Échappe les caractères HTML pour éviter les injections
        """
        if not isinstance(text, str):
            return str(text)
        return html.escape(text)
    
    def _get_default_template(self) -> str:
        """
        Retourne le template HTML par défaut
        """
        return '''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter Prizm AI</title>
    <style>
        /* Reset et base */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background-color: #0a0a0a;
            color: #ffffff;
        }
        
        /* Container principal */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            text-decoration: none;
            position: relative;
            z-index: 2;
            letter-spacing: -0.5px;
        }
        
        .tagline {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-top: 8px;
            position: relative;
            z-index: 2;
        }
        
        .issue-number {
            background: rgba(255,255,255,0.15);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 15px;
            display: inline-block;
            position: relative;
            z-index: 2;
        }
        
        /* Introduction */
        .intro {
            padding: 30px 40px;
            background: rgba(255,255,255,0.02);
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .intro h2 {
            color: #667eea;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .intro p {
            color: rgba(255,255,255,0.8);
            font-size: 16px;
            line-height: 1.7;
        }
        
        /* Articles */
        .articles-section {
            padding: 40px;
        }
        
        .section-title {
            color: #667eea;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 30px;
            text-align: center;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .article {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .article::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        .article:hover {
            background: rgba(255,255,255,0.05);
            border-color: rgba(102,126,234,0.3);
            transform: translateY(-2px);
        }
        
        .article-category {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        .article h3 {
            color: #ffffff;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .article h3 a {
            color: inherit;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .article h3 a:hover {
            color: #667eea;
        }
        
        .article-meta {
            color: rgba(255,255,255,0.5);
            font-size: 13px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .meta-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .meta-item svg {
            opacity: 0.7;
            flex-shrink: 0;
        }
        
        .social-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
        }
        
        .article-summary {
            color: rgba(255,255,255,0.8);
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        
        .read-more {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.3s ease;
        }
        
        .read-more:hover {
            color: #764ba2;
            transform: translateX(3px);
        }
        
        .read-more::after {
            content: '→';
            transition: transform 0.3s ease;
        }
        
        .read-more:hover::after {
            transform: translateX(3px);
        }
        
        /* Insights section */
        .insights {
            background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1));
            margin: 30px 0;
            padding: 25px;
            border-radius: 12px;
            border: 1px solid rgba(102,126,234,0.2);
        }
        
        .insights h4 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .insights h4::before {
            content: '';
            width: 20px;
            height: 20px;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 2.063A8.012 8.012 0 0121 12a8.25 8.25 0 00-16.5 0 8.012 8.012 0 007.5 7.931m1.5 0V9M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>') no-repeat center;
            background-size: contain;
            display: inline-block;
        }
        
        .insights p {
            color: rgba(255,255,255,0.9);
            font-size: 15px;
            line-height: 1.6;
        }
        
        /* Footer */
        .footer {
            background: rgba(0,0,0,0.3);
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .social-links {
            margin-bottom: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .social-links a:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
        }
        
        .footer-text {
            color: rgba(255,255,255,0.6);
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer-text a {
            color: #667eea;
            text-decoration: none;
        }
        
        .unsubscribe {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .unsubscribe a {
            color: rgba(255,255,255,0.5);
            text-decoration: none;
            font-size: 12px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .intro, .articles-section, .footer {
                padding: 20px;
            }
            
            .article {
                padding: 20px;
            }
            
            .logo {
                font-size: 28px;
            }
            
            .section-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <a href="https://prizm-ai.netlify.app/" class="logo">Prizm AI</a>
            <div class="tagline">L'IA appliquée sans le bullshit marketing</div>
            <div class="issue-number">Newsletter #{{ISSUE_NUMBER}}</div>
        </div>
        
        <!-- Introduction -->
        <div class="intro">
            <h2>{{INTRO_TITLE}}</h2>
            <p>{{INTRO_TEXT}}</p>
        </div>
        
        <!-- Articles Section -->
        <div class="articles-section">
            <h2 class="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; margin-right: 10px; vertical-align: middle;">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                Actualités Tech & IA
            </h2>
            
            <!-- Articles générés dynamiquement -->
            {{#ARTICLES}}
            <!-- Template remplacé par generate_articles_html() -->
            {{/ARTICLES}}
            
            <!-- Insight Prizm AI -->
            <div class="insights">
                <h4>Insight Prizm AI</h4>
                <p>{{PRIZM_INSIGHT}}</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="social-links">
                <a href="#" title="LinkedIn" class="social-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                </a>
                <a href="#" title="Twitter" class="social-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                </a>
                <a href="https://prizm-ai.netlify.app/" title="Website" class="social-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                </a>
            </div>
            
            <div class="footer-text">
                <strong>Prizm AI Newsletter</strong><br>
                Analyses techniques basées sur des tests réels.<br>
                Pas de hype, que du concret business.<br><br>
                
                <a href="https://prizm-ai.netlify.app/">Visitez notre blog</a> • 
                <a href="#">Recommander à un ami</a>
            </div>
            
            <div class="unsubscribe">
                <a href="{{UNSUBSCRIBE_URL}}">Se désabonner</a> • 
                <a href="{{UPDATE_PREFERENCES_URL}}">Modifier mes préférences</a>
            </div>
        </div>
    </div>
</body>
</html>'''

# Exemple d'utilisation
if __name__ == "__main__":
    # Test du moteur de template
    template_engine = TemplateEngine()
    
    # Données de test
    test_data = {
        'issue_number': 42,
        'intro_title': 'Cette semaine dans l\'IA',
        'intro_text': 'Les 3 annonces qui vont changer la donne en 2025. GPT-5, les nouvelles réglementations européennes et l\'arrivée des agents autonomes en entreprise.',
        'articles': [
            {
                'category': 'IA Générative',
                'title': 'GPT-5 : les premiers benchmarks dévoilés',
                'url': 'https://example.com/gpt5-benchmarks',
                'date': '2025-01-30',
                'source': 'TechCrunch',
                'read_time': 8,
                'summary': 'OpenAI a publié les premiers résultats de GPT-5 sur des tâches de raisonnement complexe. Les performances sont 40% supérieures à GPT-4, notamment sur les mathématiques et la programmation.'
            },
            {
                'category': 'Réglementation',
                'title': 'L\'AI Act européen entre en vigueur',
                'url': 'https://example.com/ai-act-europe',
                'date': '2025-01-29',
                'source': 'Reuters',
                'read_time': 6,
                'summary': 'Première réglementation mondiale sur l\'IA, l\'AI Act impose de nouvelles obligations aux entreprises utilisant des systèmes d\'IA à haut risque.'
            }
        ],
        'prizm_insight': 'Notre analyse : GPT-5 va accélérer l\'adoption des agents IA en entreprise, mais attention aux coûts. Nos tests montrent qu\'une stratégie hybride GPT-4/GPT-5 peut réduire les coûts de 60% tout en gardant 90% des performances.',
        'unsubscribe_url': 'https://example.com/unsubscribe',
        'update_preferences_url': 'https://example.com/preferences'
    }
    
    # Générer la newsletter
    newsletter_html = template_engine.generate_newsletter(test_data)
    
    # Sauvegarder pour test
    with open('test_newsletter.html', 'w', encoding='utf-8') as f:
        f.write(newsletter_html)
    
    print("✅ Newsletter générée avec succès!")
    print(f"📄 Taille: {len(newsletter_html)} caractères")
    print("💾 Sauvegardée dans: test_newsletter.html")