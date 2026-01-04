"""
Gestionnaire de configuration pour Newsletter AI
Charge et valide les paramÃ¨tres depuis le fichier JSON
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging

class ConfigManager:
    """Gestionnaire centralisÃ© de la configuration"""
    
    def __init__(self, config_path: str = "config/settings.json"):
        self.config_path = Path(config_path)
        self.config = {}
        self.logger = logging.getLogger(__name__)
        
        self._load_config()
        self._validate_config()
    
    def _load_config(self):
        """Charge la configuration depuis le fichier JSON"""
        try:
            if not self.config_path.exists():
                raise FileNotFoundError(f"Fichier de configuration non trouvÃ©: {self.config_path}")
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            
            # Substitution des variables d'environnement
            self._substitute_env_vars(self.config)
            
            self.logger.info("Configuration chargÃ©e avec succÃ¨s")
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de format JSON dans {self.config_path}: {e}")
        except Exception as e:
            raise RuntimeError(f"Erreur lors du chargement de la configuration: {e}")
    
    def _substitute_env_vars(self, obj):
        """Remplace les variables d'environnement dans la configuration"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                    env_var = value[2:-1]  # EnlÃ¨ve ${ et }
                    default_value = None
                    
                    # Support pour les valeurs par dÃ©faut: ${VAR:default}
                    if ":" in env_var:
                        env_var, default_value = env_var.split(":", 1)
                    
                    obj[key] = os.getenv(env_var, default_value)
                elif isinstance(value, (dict, list)):
                    self._substitute_env_vars(value)
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, (dict, list)):
                    self._substitute_env_vars(item)
    
    def _validate_config(self):
        """Valide la configuration chargÃ©e"""
        required_sections = ['openai', 'mailchimp', 'rss_sources', 'newsletter']
        
        for section in required_sections:
            if section not in self.config:
                raise ValueError(f"Section manquante dans la configuration: {section}")
        
        # Validation OpenAI
        openai_config = self.config['openai']
        if not openai_config.get('api_key'):
            raise ValueError("ClÃ© API OpenAI manquante")
        
        # Validation Mailchimp
        mailchimp_config = self.config['mailchimp']
        if not mailchimp_config.get('api_key'):
            raise ValueError("ClÃ© API Mailchimp manquante")
        if not mailchimp_config.get('list_id'):
            raise ValueError("ID de liste Mailchimp manquant")
        
        # Validation sources RSS
        if not self.config['rss_sources']:
            raise ValueError("Aucune source RSS configurÃ©e")
        
        # Validation newsletter
        newsletter_config = self.config['newsletter']
        if not newsletter_config.get('sender_email'):
            raise ValueError("Email expÃ©diteur manquant")
        
        self.logger.info("Configuration validÃ©e avec succÃ¨s")
    
    def get(self, key: str, default: Any = None) -> Any:
        """RÃ©cupÃ¨re une valeur de configuration avec support des clÃ©s imbriquÃ©es"""
        keys = key.split('.')
        value = self.config
        
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def get_openai_config(self) -> Dict[str, Any]:
        """Retourne la configuration OpenAI"""
        return self.config.get('openai', {})
    
    def get_mailchimp_config(self) -> Dict[str, Any]:
        """Retourne la configuration Mailchimp"""
        return self.config.get('mailchimp', {})
    
    def get_rss_sources(self) -> Dict[str, str]:
        """Retourne les sources RSS configurÃ©es"""
        return self.config.get('rss_sources', {})
    
    def get_newsletter_config(self) -> Dict[str, Any]:
        """Retourne la configuration newsletter"""
        return self.config.get('newsletter', {})
    
    def get_logging_config(self) -> Dict[str, Any]:
        """Retourne la configuration logging"""
        return self.config.get('logging', {
            'level': 'INFO',
            'retention_days': 30
        })
    
    def update_config(self, updates: Dict[str, Any], save: bool = False):
        """Met Ã  jour la configuration"""
        def deep_update(base_dict, update_dict):
            for key, value in update_dict.items():
                if isinstance(value, dict) and key in base_dict and isinstance(base_dict[key], dict):
                    deep_update(base_dict[key], value)
                else:
                    base_dict[key] = value
        
        deep_update(self.config, updates)
        
        if save:
            self.save_config()
    
    def save_config(self):
        """Sauvegarde la configuration actuelle"""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
        
        self.logger.info("Configuration sauvegardÃ©e")
    
    def reload_config(self):
        """Recharge la configuration depuis le fichier"""
        self._load_config()
        self._validate_config()
    
    def get_all(self) -> Dict[str, Any]:
        """Retourne toute la configuration"""
        return self.config.copy()
    
    def has_section(self, section: str) -> bool:
        """VÃ©rifie si une section existe"""
        return section in self.config
    
    def get_section(self, section: str) -> Dict[str, Any]:
        """RÃ©cupÃ¨re une section complÃ¨te"""
        return self.config.get(section, {})
    
    @classmethod
    def create_default_config(cls, path: str = "config/settings.json"):
        """CrÃ©e un fichier de configuration par dÃ©faut"""
        default_config = {
            "openai": {
                "api_key": "${OPENAI_API_KEY}",
                "model": "gpt-4",
                "max_tokens": 2000,
                "temperature": 0.7
            },
            "mailchimp": {
                "api_key": "${MAILCHIMP_API_KEY}",
                "list_id": "${MAILCHIMP_LIST_ID}",
                "server_prefix": "us1"
            },
            "rss_sources": {
                "lemonde": "https://www.lemonde.fr/rss/une.xml",
                "figaro": "https://www.lefigaro.fr/rss/figaro_actualites.xml",
                "liberation": "https://www.liberation.fr/arc/outboundfeeds/rss-all/",
                "franceinfo": "https://www.francetvinfo.fr/titres.rss",
                "lci": "https://www.lci.fr/rss/france.xml"
            },
            "newsletter": {
                "sender_name": "Newsletter AI",
                "sender_email": "${SENDER_EMAIL:newsletter@example.com}",
                "subject_template": "Newsletter AI - {date}",
                "max_articles": 10,
                "categories": [
                    "Politique",
                    "Ã‰conomie", 
                    "Technologie",
                    "International",
                    "Culture"
                ]
            },
            "content_filtering": {
                "min_article_length": 200,
                "exclude_keywords": ["publicitÃ©", "sponsor"],
                "priority_keywords": ["innovation", "breaking", "exclusif"]
            },
            "logging": {
                "level": "INFO",
                "retention_days": 30,
                "max_file_size": "10MB"
            },
            "scheduling": {
                "daily_time": "08:00",
                "weekly_day": "monday",
                "weekly_time": "09:00",
                "timezone": "Europe/Paris"
            }
        }
        
        config_path = Path(path)
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, ensure_ascii=False, indent=2)
        
        return config_path

