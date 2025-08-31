import os
import requests
import json
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class AgentMailchimp:
    """Agent responsable de l'envoi via Mailchimp - VERSION COMPLÈTE"""
    
    def __init__(self, api_key=None, list_id=None):
        """Initialisation compatible avec l'orchestrator"""
        
        # Utiliser les paramètres fournis ou les variables d'environnement
        self.api_key = api_key or os.getenv('MAILCHIMP_API_KEY')
        self.list_id = list_id or os.getenv('MAILCHIMP_LIST_ID')
        self.test_mode = False
        
        if not self.api_key:
            raise ValueError("MAILCHIMP_API_KEY manquant")
        if not self.list_id:
            raise ValueError("MAILCHIMP_LIST_ID manquant")
        
        # Extraire le datacenter de la clé API
        self.datacenter = self.api_key.split('-')[-1]
        self.base_url = f"https://{self.datacenter}.api.mailchimp.com/3.0"
        
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        logger.info("Agent Mailchimp initialisé - VERSION COMPLÈTE")
    
    def envoyer_newsletter(self, contenu_html: str, newsletter_data: Dict[str, Any] = None, **kwargs) -> Dict[str, Any]:
        """Méthode principale appelée par l'orchestrator"""
        
# Log des paramètres reçus pour debugging
        if kwargs:
            print(f"INFO: 📝 Paramètres supplémentaires reçus: {list(kwargs.keys())}")
            for key, value in kwargs.items():
                print(f"INFO: 📋 {key}: {str(value)[:100]}...")
        print("INFO: 📧 envoyer_newsletter() appelée")
        print(f"INFO: 📝 Contenu HTML reçu: {len(contenu_html) if contenu_html else 0} caractères")
        
        if self.test_mode:
            logger.info("Mode test - Newsletter non envoyée")
            print("INFO: ⚠️ Mode test actif - Newsletter non envoyée")
            return {
                'statut': 'test',
                'message': 'Mode test activé - Newsletter non envoyée'
            }
        
        return self._envoyer_via_mailchimp(contenu_html, newsletter_data)
    
    def diffuser(self, contenu_html: str, newsletter_data: Dict[str, Any] = None, **kwargs) -> Dict[str, Any]:
        """Alias pour envoyer_newsletter (compatibilité)"""
        print("INFO: 📧 diffuser() appelée - redirection vers envoyer_newsletter()")
        return self.envoyer_newsletter(contenu_html, newsletter_data)
    
    def _envoyer_via_mailchimp(self, contenu_html: str, newsletter_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Implémentation réelle de l'envoi Mailchimp"""
        
        try:
            logger.info("📧 Démarrage envoi Mailchimp...")
            print("INFO: 🚀 Démarrage processus envoi Mailchimp")
            
            # Vérifier que le contenu HTML n'est pas vide
            if not contenu_html or len(contenu_html.strip()) < 10:
                error_msg = "Contenu HTML vide ou trop court"
                logger.error(error_msg)
                print(f"INFO: ❌ {error_msg}")
                return {
                    'statut': 'error',
                    'erreur': error_msg
                }
            
            print(f"INFO: ✅ Contenu HTML valide: {len(contenu_html)} caractères")
            
            # 1. CRÉER LA CAMPAGNE
            campaign_data = {
                "type": "regular",
                "recipients": {
                    "list_id": self.list_id
                },
                "settings": {
                    "subject_line": f"Newsletter IA - {datetime.now().strftime('%d/%m/%Y')}",
                    "from_name": "Newsletter IA",
                    "from_email": "sarahgimenez@live.fr",
                    "reply_to": "sarahgimenez@live.fr",
                    "to_name": "*|FNAME|*",
                    "folder_id": "",
                    "authenticate": True,
                    "auto_footer": False,
                    "inline_css": True
                }
            }
            
            logger.info("🚀 Création de la campagne...")
            print("INFO: 🚀 Étape 1/3: Création campagne Mailchimp")
            
            create_response = requests.post(
                f"{self.base_url}/campaigns",
                headers=self.headers,
                json=campaign_data
            )
            
            if create_response.status_code != 200:
                error_msg = f"Erreur création campagne: {create_response.status_code} - {create_response.text}"
                logger.error(error_msg)
                print(f"INFO: ❌ {error_msg}")
                return {
                    'statut': 'error',
                    'erreur': error_msg
                }
            
            campaign = create_response.json()
            campaign_id = campaign['id']
            logger.info(f"✅ Campagne créée: {campaign_id}")
            print(f"INFO: ✅ Campagne créée avec ID: {campaign_id}")
            
            # 2. AJOUTER LE CONTENU HTML
            logger.info("📝 Ajout du contenu HTML...")
            print("INFO: 📝 Étape 2/3: Ajout contenu HTML à la campagne")
            
            content_data = {
                "html": contenu_html
            }
            
            content_response = requests.put(
                f"{self.base_url}/campaigns/{campaign_id}/content",
                headers=self.headers,
                json=content_data
            )
            
            if content_response.status_code != 200:
                error_msg = f"Erreur ajout contenu: {content_response.status_code} - {content_response.text}"
                logger.error(error_msg)
                print(f"INFO: ❌ {error_msg}")
                return {
                    'statut': 'error',
                    'erreur': error_msg
                }
            
            logger.info("✅ Contenu HTML ajouté avec succès")
            print("INFO: ✅ Contenu HTML ajouté à la campagne")
            
            # 3. ENVOYER LA CAMPAGNE
            logger.info("🚀 Envoi de la campagne...")
            print("INFO: 🚀 Étape 3/3: Envoi de la campagne")
            
            send_response = requests.post(
                f"{self.base_url}/campaigns/{campaign_id}/actions/send",
                headers=self.headers
            )
            
            print(f"INFO: 📊 Statut réponse envoi: {send_response.status_code}")
            
            if send_response.status_code == 204:
                logger.info("🎉 Newsletter envoyée avec succès !")
                print("INFO: 🎉 NEWSLETTER ENVOYÉE AVEC SUCCÈS !")
                print("INFO: 📧 La newsletter est maintenant en cours de livraison")
                return {
                    'statut': 'success',
                    'message': 'Newsletter envoyée avec succès',
                    'campaign_id': campaign_id
                }
            else:
                error_msg = f"Erreur envoi: {send_response.status_code} - {send_response.text}"
                logger.error(error_msg)
                print(f"INFO: ❌ {error_msg}")
                return {
                    'statut': 'error',
                    'erreur': error_msg
                }
                
        except Exception as e:
            error_msg = f"Erreur inattendue: {str(e)}"
            logger.error(error_msg)
            print(f"INFO: ❌ {error_msg}")
            import traceback
            traceback.print_exc()
            return {
                'statut': 'error',
                'erreur': error_msg
            }
    
    def tester_connexion(self) -> bool:
        """Test la connexion à l'API Mailchimp"""
        try:
            response = requests.get(f"{self.base_url}/lists", headers=self.headers)
            return response.status_code == 200
        except:
            return False
