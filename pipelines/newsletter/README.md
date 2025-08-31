# Newsletter AI PRIZM

Systeme automatise de generation de newsletters avec Intelligence Artificielle.

## Prerequis

- Python 3.8+
- Cle API OpenAI
- Configuration email (Gmail recommande)

## Installation

### 1. Configuration des cles API

Editez le fichier .env avec vos vraies informations :

`env
OPENAI_API_KEY=sk-proj-votre-vraie-cle-ici
EMAIL_FROM=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
`

### 2. Installation des dependances

`ash
pip install -r requirements.txt
`

### 3. Test de l'installation

`ash
python test_setup.py
`

## Utilisation

`ash
# Test de configuration
python -c "from config.api_keys import validate_api_keys; print(validate_api_keys())"

# Lancement (quand main.py sera cree)
python main.py
`

## Structure du Projet

`
Newsletter_AI/
â”œâ”€â”€ config/         # Configuration
â”œâ”€â”€ agents/         # Agents IA
â”œâ”€â”€ utils/          # Utilitaires
â”œâ”€â”€ data/           # Donnees et templates
â”œâ”€â”€ tests/          # Tests
â”œâ”€â”€ logs/           # Logs
â””â”€â”€ main.py         # Point d'entree
`

## Developpement

Le projet utilise une architecture basee sur des agents IA specialises :

- **Agent Veille** : Collecte d'articles
- **Agent Redacteur** : Generation de contenu
- **Agent Email** : Envoi des newsletters

## Support

En cas de probleme :
1. Verifiez les logs dans le dossier logs/
2. Lancez python test_setup.py pour diagnostiquer
3. Verifiez votre configuration .env

---
Genere automatiquement par le script d'installation Newsletter AI PRIZM
