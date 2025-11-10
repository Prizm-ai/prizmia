#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de configuration et déploiement GitHub pour PrizmAI Newsletter
"""

import os
import sys
import subprocess
import json
from pathlib import Path

class GitHubSetup:
    """Configuration et déploiement sur GitHub"""
    
    def __init__(self):
        self.project_path = Path.cwd()
        self.repo_name = "prizm-newsletter"
        self.branch = "main"
        
    def check_git_installed(self):
        """Vérifie que Git est installé"""
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True)
            print(f"✅ Git installé: {result.stdout.strip()}")
            return True
        except FileNotFoundError:
            print("❌ Git n'est pas installé. Installez Git depuis https://git-scm.com/")
            return False
    
    def init_repository(self):
        """Initialise le repository Git"""
        print("\n📁 Initialisation du repository Git...")
        
        # Vérifier si c'est déjà un repo
        if (self.project_path / '.git').exists():
            print("✅ Repository Git déjà initialisé")
            return True
            
        try:
            subprocess.run(['git', 'init'], check=True)
            print("✅ Repository initialisé")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors de l'initialisation: {e}")
            return False
    
    def create_gitignore(self):
        """Crée le fichier .gitignore"""
        gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Environment variables
.env
.env.local
.env.*.local

# Logs
*.log
logs/
newsletter_prizm.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Newsletter outputs (local copies)
output/
temp/
cache/

# Secrets
credentials.json
token.json
*.key
*.pem
"""
        
        gitignore_path = self.project_path / '.gitignore'
        with open(gitignore_path, 'w', encoding='utf-8') as f:
            f.write(gitignore_content)
        
        print("✅ Fichier .gitignore créé")
    
    def create_readme(self):
        """Crée le fichier README.md"""
        readme_content = """# 🚀 PrizmAI Newsletter System

## 📝 Description
Système automatisé de génération et d'envoi de newsletters sur l'IA et la tech, utilisant une architecture multi-agents avec GPT-4 et Mailchimp.

## ✨ Fonctionnalités
- 🔍 **Collecte automatique** depuis 10+ sources RSS premium
- 🤖 **Génération de contenu** avec GPT-4 (2000+ mots)
- 📊 **Analyses approfondies** avec métriques et insights
- 📧 **Intégration Mailchimp** pour envoi automatique
- 📤 **Sauvegarde GitHub** de toutes les newsletters
- ⏰ **Automatisation** via Windows Task Scheduler

## 🛠️ Installation

### Prérequis
- Python 3.8+
- Git
- Compte OpenAI avec accès GPT-4
- Compte Mailchimp
- Token GitHub (optionnel)

### Setup
```bash
# Cloner le repository
git clone https://github.com/YOUR_USERNAME/prizm-newsletter.git
cd prizm-newsletter

# Installer les dépendances
pip install -r requirements.txt

# Copier et configurer l'environnement
cp .env.template .env
# Éditer .env avec vos clés API
```

## 🚀 Utilisation

### Mode Test
```bash
python orchestrator.py
```

### Mode Production
```bash
python orchestrator.py --production
```

### Automatisation (Windows)
```bash
python setup_scheduler.py
```

## 📊 Structure du Contenu

### Newsletter Premium inclut:
1. **Édito percutant** - Analyse de la tendance majeure
2. **Deep Dives** - 3 analyses techniques approfondies
3. **Tech Radar** - 5 actualités essentielles avec score d'impact
4. **Metrics & Insights** - Chiffres clés et visualisations
5. **Action Items** - Recommandations concrètes

## 🔧 Configuration

### Variables d'environnement (.env)
- `OPENAI_API_KEY` - Clé API OpenAI
- `MAILCHIMP_API_KEY` - Clé API Mailchimp
- `MAILCHIMP_LIST_ID` - ID de la liste Mailchimp
- `GITHUB_TOKEN` - Token GitHub (optionnel)
- `TEST_EMAIL` - Email pour les tests

## 📁 Structure du Projet
```
prizm-newsletter/
├── orchestrator.py          # Orchestrateur principal
├── setup_github.py          # Configuration GitHub
├── setup_scheduler.py       # Automatisation Windows
├── requirements.txt         # Dépendances Python
├── .env.template           # Template de configuration
├── .gitignore              # Fichiers ignorés
├── README.md               # Documentation
└── newsletters/            # Archives des newsletters générées
```

## 🤝 Contribution
Les contributions sont bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

## 📄 Licence
MIT

## 🔗 Liens
- [Site Web PrizmAI](https://prizm-ai.netlify.app/)
- [Documentation API](docs/API.md)
- [Exemples de Newsletters](newsletters/)

---
*Développé avec ❤️ pour PrizmAI*
"""
        
        readme_path = self.project_path / 'README.md'
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print("✅ Fichier README.md créé")
    
    def setup_remote(self, remote_url=None):
        """Configure le remote GitHub"""
        print("\n🌐 Configuration du remote GitHub...")
        
        if not remote_url:
            print("\n📝 Pour connecter à GitHub:")
            print("1. Créez un nouveau repository sur GitHub")
            print("2. Ne pas initialiser avec README")
            print("3. Copiez l'URL du repository")
            
            remote_url = input("\nCollez l'URL de votre repository GitHub (ou appuyez sur Entrée pour ignorer): ").strip()
            
        if remote_url:
            try:
                # Vérifier si un remote existe déjà
                result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"⚠️ Remote existant: {result.stdout.strip()}")
                    update = input("Voulez-vous le remplacer? (o/n): ").lower() == 'o'
                    if update:
                        subprocess.run(['git', 'remote', 'set-url', 'origin', remote_url], check=True)
                        print("✅ Remote mis à jour")
                else:
                    subprocess.run(['git', 'remote', 'add', 'origin', remote_url], check=True)
                    print("✅ Remote ajouté")
                    
                return True
            except subprocess.CalledProcessError as e:
                print(f"❌ Erreur lors de la configuration du remote: {e}")
                return False
        
        print("⏭️ Configuration du remote ignorée")
        return False
    
    def initial_commit(self):
        """Effectue le premier commit"""
        print("\n📝 Création du commit initial...")
        
        try:
            # Ajouter tous les fichiers
            subprocess.run(['git', 'add', '.'], check=True)
            
            # Vérifier s'il y a des changements
            result = subprocess.run(['git', 'status', '--porcelain'], 
                                  capture_output=True, text=True)
            
            if result.stdout:
                # Commit
                subprocess.run(['git', 'commit', '-m', 'Initial commit: PrizmAI Newsletter System'], 
                             check=True)
                print("✅ Commit initial créé")
                return True
            else:
                print("ℹ️ Aucun changement à commiter")
                return True
                
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors du commit: {e}")
            return False
    
    def push_to_github(self):
        """Push vers GitHub"""
        print("\n📤 Push vers GitHub...")
        
        try:
            # Vérifier qu'un remote existe
            result = subprocess.run(['git', 'remote'], capture_output=True, text=True)
            if not result.stdout.strip():
                print("⚠️ Aucun remote configuré. Configurez d'abord le remote GitHub.")
                return False
            
            # Push
            print("Envoi en cours...")
            subprocess.run(['git', 'push', '-u', 'origin', self.branch], check=True)
            print("✅ Code poussé sur GitHub avec succès!")
            
            # Afficher l'URL
            result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                url = result.stdout.strip()
                if url.endswith('.git'):
                    url = url[:-4]
                print(f"\n🔗 Votre projet est disponible sur: {url}")
                
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors du push: {e}")
            print("\nℹ️ Solutions possibles:")
            print("- Vérifiez votre connexion internet")
            print("- Assurez-vous d'être authentifié (git config)")
            print("- Vérifiez les permissions sur le repository")
            return False
    
    def run(self):
        """Lance le processus complet de setup"""
        print("🚀 Configuration GitHub pour PrizmAI Newsletter")
        print("=" * 50)
        
        # Vérifications préliminaires
        if not self.check_git_installed():
            return False
        
        # Création des fichiers
        self.create_gitignore()
        self.create_readme()
        
        # Initialisation Git
        if not self.init_repository():
            return False
        
        # Configuration utilisateur Git (si nécessaire)
        self.configure_git_user()
        
        # Commit initial
        if not self.initial_commit():
            return False
        
        # Configuration du remote
        self.setup_remote()
        
        # Push optionnel
        push = input("\n📤 Voulez-vous pusher maintenant sur GitHub? (o/n): ").lower() == 'o'
        if push:
            self.push_to_github()
        
        print("\n✅ Configuration terminée!")
        print("\n📋 Prochaines étapes:")
        print("1. Configurez votre fichier .env avec vos clés API")
        print("2. Testez avec: python orchestrator.py")
        print("3. Automatisez avec: python setup_scheduler.py")
        
        return True
    
    def configure_git_user(self):
        """Configure l'utilisateur Git si nécessaire"""
        try:
            # Vérifier la configuration existante
            name_result = subprocess.run(['git', 'config', 'user.name'], 
                                        capture_output=True, text=True)
            email_result = subprocess.run(['git', 'config', 'user.email'], 
                                         capture_output=True, text=True)
            
            if not name_result.stdout.strip() or not email_result.stdout.strip():
                print("\n⚠️ Configuration Git incomplète")
                name = input("Votre nom pour Git: ").strip()
                email = input("Votre email pour Git: ").strip()
                
                if name:
                    subprocess.run(['git', 'config', 'user.name', name], check=True)
                if email:
                    subprocess.run(['git', 'config', 'user.email', email], check=True)
                    
                print("✅ Configuration Git mise à jour")
                
        except subprocess.CalledProcessError:
            pass

if __name__ == "__main__":
    setup = GitHubSetup()
    setup.run()
