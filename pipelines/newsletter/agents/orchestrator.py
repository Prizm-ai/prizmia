import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

from .agent_veille import AgentVeille
from .agent_redacteur import AgentRedacteur
from .agent_redacteur_chef import AgentRedacteurChef
from .agent_mailchimp import AgentMailchimp
from .agent_template import AgentTemplate

class Orchestrator:
    def __init__(self):
        """Initialise l'orchestrateur avec tous les agents"""
        # Chargement des variables d'environnement
        from dotenv import load_dotenv
        load_dotenv()
        
        # Récupération des clés API
        openai_api_key = os.getenv('OPENAI_API_KEY')
        mailchimp_api_key = os.getenv('MAILCHIMP_API_KEY')
        mailchimp_list_id = os.getenv('MAILCHIMP_LIST_ID')
        
        # Instanciation des agents
        self.agent_veille = AgentVeille()
        self.agent_redacteur = AgentRedacteur(openai_api_key=openai_api_key)
        self.agent_redacteur_chef = AgentRedacteurChef()
        self.agent_mailchimp = AgentMailchimp(api_key=mailchimp_api_key, list_id=mailchimp_list_id)
        self.agent_template = AgentTemplate()
        
        self.test_mode = os.getenv('TEST_MODE', 'True').lower() == 'true'

        # Configuration du logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
    
    def generer_newsletter_complete(self, limit_articles: int = 10) -> Dict:
        """Génère une newsletter complète avec le workflow multi-agents"""
        try:
            logging.info("🎼 Démarrage du workflow de génération de newsletter")
            
            # 1. Collecte des articles
            logging.info("1️⃣ Collecte des articles IA...")
            articles = self.agent_veille.collecter_articles(limit=limit_articles)

            if not articles:
                raise Exception("Aucun article collecté")
            
            logging.info(f"✅ {len(articles)} articles collectés")
            
            # 2. Analyse des tendances
            logging.info("2️⃣ Analyse des tendances...")
            tendances = self.agent_veille.analyser_tendances(articles)
            
            # 3. Rédaction du contenu
            logging.info("3️⃣ Rédaction du contenu...")
            contenu_brut = self.agent_redacteur.rediger_contenu(articles, tendances)
            
            if not contenu_brut:
                raise Exception("Échec de la rédaction du contenu")
            
            # 4. Édition et finalisation
            logging.info("4️⃣ Édition et finalisation...")
            contenu_final = self.agent_redacteur_chef.finaliser_newsletter(contenu_brut)
            
            if not contenu_final:
                raise Exception("Échec de la finalisation de la newsletter")
            
            print("✅ Newsletter finalisée avec succès")
            
            # 5. Application du template HTML
            logging.info("5️⃣ Application du template HTML...")
            contenu_html = self.agent_template.generer_html(contenu_final)
            
            if not contenu_html:
                raise Exception("Échec de la génération du template HTML")
            
            # 6. Diffusion via Mailchimp
            print("INFO: 6️⃣ Diffusion via Mailchimp...")
            
            # Préparation des données pour Mailchimp
            titre_final = f"Newsletter IA - {datetime.now().strftime('%d/%m/%Y')}"
            html_content = str(contenu_html) if contenu_html else ""
            
            # Debug
            print(f"INFO: 🔍 Debug: contenu_html type = {type(contenu_html)}")
            
            # Appel Mailchimp
            diffusion = self.agent_mailchimp.envoyer_newsletter(
                contenu_html=html_content,
                titre=titre_final
            )
            
            print(f"INFO: 🔍 Debug: diffusion type = {type(diffusion)}")
            print(f"🔍 Debug: contenu de diffusion = {diffusion}")
            
            # Traitement du résultat
            if isinstance(diffusion, dict):
                success = diffusion.get('statut') in ['test_success', 'success']
                message = diffusion.get('message', 'Aucun message')
                print(f"🔍 Debug: success = {success}")
                print(f"🔍 Debug: message = {message}")
            else:
                success = False
                message = "Format de réponse inattendu"
            
            print("🔍 Debug: Fin du traitement - tout OK")
            
            # Collecter les articles depuis le processus de veille
            articles_collectes = articles if 'articles' in locals() else []
            
            # Collecter les statistiques depuis la diffusion
            statistiques = {}
            if isinstance(diffusion, dict) and 'statistiques' in diffusion:
                statistiques = diffusion['statistiques']
            elif isinstance(diffusion, dict):
                statistiques = {
                    'diffusion_success': diffusion.get('success', False),
                    'message': diffusion.get('message', ''),
                    'timestamp': datetime.now().isoformat()
                }
            
            # Retour du résultat final - AVEC TOUTES LES CLÉS REQUISES
            return {
                'success': success,
                'newsletter_html': html_content,
                'diffusion': diffusion,
                'timestamp': datetime.now().isoformat(),
                'test_mode': self.test_mode,
                'articles_collectes': articles_collectes,  # ✅ CLÉ AJOUTÉE
                'statistiques': statistiques              # ✅ CLÉ AJOUTÉE
            }
            
        except Exception as e:
            logging.error(f"❌ Erreur dans le workflow: {e}")
            print(f"ERROR: ❌ Erreur dans le workflow: {e}")
            if hasattr(e, '__traceback__') and e.__traceback__:
                print(f"ERROR: 🔍 Debug: Erreur sur ligne {e.__traceback__.tb_lineno}")
            
            # Retour d'erreur - AVEC TOUTES LES CLÉS REQUISES
            return {
                'success': False,
                'newsletter_html': '',
                'diffusion': {'success': False, 'error': str(e)},
                'timestamp': datetime.now().isoformat(),
                'test_mode': self.test_mode,
                'articles_collectes': [],  # ✅ CLÉ AJOUTÉE
                'statistiques': {}         # ✅ CLÉ AJOUTÉE
            }
    
    def tester_agents_individuellement(self) -> Dict:
        """Teste chaque agent individuellement pour diagnostiquer les problèmes"""
        resultats = {
            'agent_veille': {'statut': 'non_teste', 'details': None},
            'agent_redacteur': {'statut': 'non_teste', 'details': None},
            'agent_redacteur_chef': {'statut': 'non_teste', 'details': None},
            'agent_template': {'statut': 'non_teste', 'details': None},
            'agent_mailchimp': {'statut': 'non_teste', 'details': None}
        }
        
        articles = None
        contenu = None
        contenu_final = None
        
        # Test Agent Veille
        try:
            logging.info("Test Agent Veille...")
            articles = self.agent_veille.collecter_articles(limit=3)
        
            resultats['agent_veille'] = {
                'statut': 'succès' if articles else 'échec',
                'details': f"{len(articles)} articles collectés" if articles else "Aucun article collecté"
            }
        except Exception as e:
            resultats['agent_veille'] = {'statut': 'erreur', 'details': str(e)}
        
        # Test Agent Rédacteur
        if resultats['agent_veille']['statut'] == 'succès' and articles:
            try:
                logging.info("Test Agent Rédacteur...")
                tendances = self.agent_veille.analyser_tendances(articles)
                contenu = self.agent_redacteur.rediger_contenu(articles[:2], tendances)
                resultats['agent_redacteur'] = {
                    'statut': 'succès' if contenu else 'échec',
                    'details': f"Contenu généré: {len(str(contenu))} caractères" if contenu else "Aucun contenu généré"
                }
            except Exception as e:
                resultats['agent_redacteur'] = {'statut': 'erreur', 'details': str(e)}
        
        # Test Agent Rédacteur Chef
        if resultats['agent_redacteur']['statut'] == 'succès' and contenu:
            try:
                logging.info("Test Agent Rédacteur Chef...")
                contenu_final = self.agent_redacteur_chef.finaliser_newsletter(contenu)
                resultats['agent_redacteur_chef'] = {
                    'statut': 'succès' if contenu_final else 'échec',
                    'details': f"Newsletter finalisée" if contenu_final else "Échec finalisation"
                }
            except Exception as e:
                resultats['agent_redacteur_chef'] = {'statut': 'erreur', 'details': str(e)}
        
        # Test Agent Template
        if resultats['agent_redacteur_chef']['statut'] == 'succès' and contenu_final:
            try:
                logging.info("Test Agent Template...")
                html = self.agent_template.generer_html(contenu_final)
                resultats['agent_template'] = {
                    'statut': 'succès' if html else 'échec',
                    'details': f"HTML généré: {len(str(html))} caractères" if html else "Aucun HTML généré"
                }
            except Exception as e:
                resultats['agent_template'] = {'statut': 'erreur', 'details': str(e)}
        
        # Test Agent Mailchimp
        try:
            logging.info("Test Agent Mailchimp...")
            test_result = self.agent_mailchimp.test_envoi()  # Utilise la nouvelle méthode
            resultats['agent_mailchimp'] = {
                'statut': 'succès' if test_result else 'échec',
                'details': f"Test envoi: {'Réussi' if test_result else 'Échec'}"
            }
        except Exception as e:
            resultats['agent_mailchimp'] = {'statut': 'erreur', 'details': str(e)}
        
        return resultats
    
    def generer_rapport_diagnostic(self) -> str:
        """Génère un rapport de diagnostic complet du système"""
        resultats = self.tester_agents_individuellement()
        
        rapport = [
            "🔍 RAPPORT DE DIAGNOSTIC - NEWSLETTER PRIZMAI",
            "=" * 50,
            f"📅 Généré le: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"🧪 Mode test: {'Activé' if self.test_mode else 'Désactivé'}",
            "",
            "📊 STATUT DES AGENTS:",
            "-" * 25
        ]
        
        for agent, result in resultats.items():
            statut_emoji = {
                'succès': '✅',
                'échec': '⚠️',
                'erreur': '❌',
                'non_teste': '⏸️'
            }
            emoji = statut_emoji.get(result['statut'], '❓')
            rapport.append(f"{emoji} {agent.replace('_', ' ').title()}: {result['statut'].upper()}")
            if result['details']:
                rapport.append(f"   └─ {result['details']}")
        
        # Statistiques globales
        total_agents = len(resultats)
        agents_ok = sum(1 for r in resultats.values() if r['statut'] == 'succès')
        
        rapport.extend([
            "",
            "📈 STATISTIQUES GLOBALES:",
            "-" * 25,
            f"📊 Agents fonctionnels: {agents_ok}/{total_agents}",
            f"📊 Taux de réussite: {(agents_ok/total_agents)*100:.1f}%",
            "",
            "🎯 RECOMMANDATIONS:",
            "-" * 20
        ])
        
        if agents_ok == total_agents:
            rapport.append("✅ Tous les agents sont fonctionnels - Le système est prêt")
        else:
            rapport.append("⚠️ Certains agents nécessitent une attention:")
            for agent, result in resultats.items():
                if result['statut'] != 'succès':
                    rapport.append(f"   • Corriger {agent.replace('_', ' ')}: {result['details']}")
        
        return "\n".join(rapport)
