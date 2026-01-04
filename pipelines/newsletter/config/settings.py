import os
import json
from pathlib import Path

class Config:
    """Configuration principale de l'application"""
    
    # Chemins de base
    BASE_DIR = Path(__file__).parent.parent
    CONFIG_DIR = BASE_DIR / "config"
    LOGS_DIR = BASE_DIR / "logs"
    DATA_DIR = BASE_DIR / "data"

    
    # Chargement de la configuration JSON
    @classmethod
    def load_json_config(cls):
        config_path = cls.CONFIG_DIR / "settings.json"
        if config_path.exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    # Configuration des agents
    AGENT_CONFIG = {
        "veille": {
            "name": "AgentVeille",
            "description": "Agent de veille technologique",
            "max_articles": 10,
            "sources": ["techcrunch", "theverge", "hacker_news"]
        },
        "redaction": {
            "name": "AgentRedaction", 
            "description": "Agent de rédaction de newsletter",
            "template": "newsletter_template.html"
        },
        "curation": {
            "name": "AgentCuration",
            "description": "Agent de curation de contenu",
            "max_items": 5
        }
    }
    
    def get_agent_config(self, agent_name):
        """Récupère la configuration d'un agent spécifique"""
        return self.AGENT_CONFIG.get(agent_name, {})
    
    @property
    def config(self):
        """Propriété pour accéder à la configuration JSON"""
        if not hasattr(self, '_config'):
            self._config = self.load_json_config()
        return self._config
    
    def get_rss_sources(self):
        """Retourne la liste des sources RSS configurées"""
        try:
            # D'abord essayer depuis le JSON
            json_config = self.config
            rss_sources = json_config.get('rss_sources', [])
            
            if rss_sources:
                print(f"[OK] {len(rss_sources)} sources RSS trouvées dans settings.json")
                return rss_sources
            
            # Fallback sur la configuration statique RSS_SOURCES
            print("[INFO] Utilisation des sources RSS par défaut")
            all_sources = []
            for category, sources in RSS_SOURCES.items():
                for source in sources:
                    all_sources.append({
                        "url": source,
                        "category": category,
                        "name": f"Source {category}"
                    })
            
            print(f"[OK] {len(all_sources)} sources RSS par défaut")
            return all_sources
            
        except Exception as e:
            print(f"[ERROR] Erreur lors de la récupération des sources RSS: {e}")
            return []

# Configuration OpenAI
OPENAI_CONFIG = {
    "api_key": os.getenv("OPENAI_API_KEY"),
    "model": "gpt-4",
    "max_tokens": 2000,
    "temperature": 0.7
}

# Configuration des prompts pour les agents
PROMPTS = {
    "veille": {
        "system": "Tu es un expert en veille technologique. Analyse les articles et extrait les informations les plus pertinentes.",
        "user_template": "Analyse cet article et résume les points clés: {content}"
    },
    "redaction": {
        "system": "Tu es un rédacteur spécialisé dans les newsletters tech. Crée du contenu engageant et professionnel.",
        "user_template": "Rédige une section de newsletter basée sur: {content}"
    },
    "curation": {
        "system": "Tu es un curateur de contenu expert. Sélectionne et organise les informations les plus pertinentes.",
        "user_template": "Organise et priorise ce contenu: {content}"
    }
}

# Configuration Newsletter
NEWSLETTER_CONFIG = {
    "title": "Newsletter PrizmAI",
    "description": "Newsletter technologique générée par IA",
    "frequency": "weekly",
    "template": "newsletter_template.html",
    "max_articles": 5,
    "categories": ["IA", "Tech", "Startups", "Innovation"]
}

# Configuration Email
EMAIL_CONFIG = {
    "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
    "smtp_port": int(os.getenv("SMTP_PORT", "587")),
    "sender_email": os.getenv("SENDER_EMAIL"),
    "sender_password": os.getenv("SENDER_PASSWORD"),
    "use_tls": True
}

# Configuration Mailchimp
MAILCHIMP_CONFIG = {
    "api_key": os.getenv("MAILCHIMP_API_KEY"),
    "server_prefix": os.getenv("MAILCHIMP_SERVER_PREFIX"),
    "list_id": os.getenv("MAILCHIMP_LIST_ID")
}

# Configuration des sources RSS
RSS_SOURCES = {
    "tech": [
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml",
        "https://feeds.feedburner.com/oreilly/radar",
    ],
    "ai": [
        "https://ai.googleblog.com/feeds/posts/default",
        "https://openai.com/blog/rss.xml",
    ]
}

# Configuration de logging
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "logs/newsletter.log",
            "formatter": "standard",
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "loggers": {
        "": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": False
        }
    }
}
