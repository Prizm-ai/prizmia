import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class AgentTemplate:
    """Classe de base pour tous les agents"""
    
    def __init__(self, name: str = "DefaultAgent", config: Optional[Dict] = None):
        self.name = name
        self.config = config or {}
        self.is_active = False
        self.capabilities = []
    
    def process(self, input_data: Any) -> Dict[str, Any]:
        """Méthode de traitement par défaut"""
        return {
            'success': True,
            'data': str(input_data),
            'agent': self.name,
            'message': 'Traitement par défaut'
        }
    
    def activate(self):
        self.is_active = True
    
    def deactivate(self):
        self.is_active = False
    
    def get_status(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'active': self.is_active,
            'capabilities': self.capabilities
        }
    
    def generer_html(self, contenu: str, metadata: dict = None) -> str:
        """
        Génère le HTML de la newsletter avec design moderne
        """
        try:
            date_str = datetime.now().strftime("%d/%m/%Y")
            
            # Construction du HTML par parties pour éviter les échappements
            doctype = "<!DOCTYPE html>"
            html_open = '<html lang="fr">'
            head_section = '''<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter PrizmAI</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f0f2f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 32px; 
            font-weight: 700; 
        }
        .header .subtitle { 
            opacity: 0.9; 
            font-size: 16px; 
        }
        .content { 
            padding: 40px 30px; 
            line-height: 1.7; 
            color: #2c3e50; 
        }
        .intro { 
            background: #f8f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #667eea; 
            margin-bottom: 30px;
            font-weight: 500;
        }
        .article { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #667eea; 
        }
        .footer { 
            background: #2c3e50; 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .footer a { 
            color: #74b9ff; 
            text-decoration: none; 
        }
    </style>
</head>'''
            
            body_open = '<body>'
            container_open = '<div class="container">'
            
            header_section = f'''<div class="header">
    <h1>PrizmAI Newsletter</h1>
    <div class="subtitle">Intelligence Artificielle • {date_str}</div>
</div>'''
            
            content_open = '<div class="content">'
            intro_section = '''<div class="intro">
    Analyses techniques IA • Pas de bullshit marketing • ROI mesurable
</div>'''
            
            # Nettoyage simple du contenu
            contenu_clean = contenu.replace(chr(10), '<br>')
            if contenu_clean != contenu:
                contenu = contenu_clean
            
            content_close = '</div>'
            
            footer_section = '''<div class="footer">
    <p><strong>Newsletter PrizmAI</strong></p>
    <p><a href="https://prizm-ai.netlify.app/" target="_blank">Visitez notre blog Prizm AI</a></p>
    <p style="font-size: 14px; opacity: 0.8; margin-top: 15px;">
        Intelligence artificielle • Analyses techniques • ROI mesurable
    </p>
</div>'''
            
            container_close = '</div>'
            body_close = '</body>'
            html_close = '</html>'
            
            # Assemblage final
            html_parts = [
                doctype,
                html_open,
                head_section,
                body_open,
                container_open,
                header_section,
                content_open,
                intro_section,
                contenu,
                content_close,
                footer_section,
                container_close,
                body_close,
                html_close
            ]
            
            return ''.join(html_parts)
            
        except Exception as e:
            logger.error(f"Erreur génération HTML: {e}")
            error_html = '<html><body><h1>Erreur</h1><p>' + str(e) + '</p></body></html>'
            return error_html

class BasicAgent(AgentTemplate):
    def __init__(self, name: str = "BasicAgent", config: Optional[Dict] = None):
        super().__init__(name, config)
        self.add_capability("basic_processing")
    
    def add_capability(self, capability: str):
        if capability not in self.capabilities:
            self.capabilities.append(capability)
    
    def process(self, input_data: Any) -> Dict[str, Any]:
        if not self.is_active:
            return {'success': False, 'error': 'Agent non actif'}
        
        return {
            'success': True,
            'data': str(input_data),
            'agent': self.name
        }
