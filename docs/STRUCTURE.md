# Structure Détaillée - Prizm AI

## Vue d'Ensemble des Dossiers

```
prizmia/
│
├── 📁 src/                      # SITE WEB (Astro)
│   ├── pages/                   # Pages du site
│   ├── components/              # Composants réutilisables
│   ├── layouts/                 # Templates de pages
│   ├── content/blog/            # Articles du blog
│   └── styles/                  # CSS global
│
├── 📁 business/                 # VISION & STRATÉGIE
│   ├── strategy/               
│   │   └── business-model.md    # Business Model Canvas complet
│   └── operations/
│       └── processes.md         # Workflows opérationnels
│
├── 📁 core/                     # LOGIQUE PARTAGÉE
│   ├── config.js                # Configuration centrale
│   ├── production.js            # Helpers de production
│   └── utils/                   # Fonctions utilitaires
│
├── 📁 pipelines/                # AUTOMATISATION
│   ├── newsletter/              
│   │   ├── agents/              # Agents Python
│   │   │   ├── agent_mailchimp.py
│   │   │   └── agent_redacteur.py
│   │   └── README.md
│   │
│   └── content-generation/      
│       ├── agent-veille.js      # Veille IA
│       ├── agent-redacteur.js   # Rédaction articles
│       └── pipeline-v4.js       # Orchestration
│
├── 📁 operations/               # MONITORING
│   ├── dashboard/               # Tableaux de bord
│   └── output/                  # Résultats des pipelines
│
└── 📁 docs/                     # DOCUMENTATION
    ├── STRUCTURE.md             # Ce fichier
    └── guides/                  # Guides d'utilisation

```

## Flux de Travail

### 1. Génération de Contenu
```
Veille (agent-veille.js) 
    → Rédaction (agent-redacteur.js) 
    → Publication (src/content/blog/)
```

### 2. Newsletter Automatisée
```
Sources RSS/API 
    → Agent Python (analyse) 
    → Rédaction 
    → Mailchimp
```

### 3. Site Web
```
Développement local (npm run dev)
    → Push GitHub
    → Build Netlify automatique
    → Site en production
```

## Commandes Essentielles

### Général
```bash
# Voir la structure
tree -L 2 -I node_modules

# État Git
git status
```

### Site Web
```bash
# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

### Pipelines
```bash
# Content Generation
cd pipelines/content-generation
node pipeline-v4.js

# Newsletter
cd pipelines/newsletter
python main.py
```

## Points d'Attention ⚠️

1. **Ne JAMAIS** supprimer /src sans backup
2. **Toujours** tester le site après modifications structurelles
3. **Coordonner** les changements majeurs entre équipes
4. **Documenter** tout nouveau pipeline ou agent

## Support

- Problème site : @Samuel
- Problème agents : Voir responsable du pipeline
- Problème déploiement : Vérifier Netlify + GitHub

Dernière mise à jour : 12/08/2025
