# Prizm AI - Hub Complet

## 🎯 Vision
"Démocratiser l'IA pour TOUTES les entreprises françaises - des professions libérales aux ETI"

## 🚀 Accès Rapide
- **Site Web Live** : https://prizm-ai.netlify.app
- **Dashboard** : [À venir]
- **Documentation** : [/docs](./docs)

## 🏗️ Architecture du Projet

### /src - Site Web Astro ⚠️ CRITIQUE
**NE JAMAIS MODIFIER SANS COORDINATION**
- Le site principal construit avec Astro
- Déployé automatiquement sur Netlify
- Toute modification ici impacte le site en production

### /business - Stratégie & Vision
- **strategy/** : Business Model Canvas, positionnement marché, roadmap
- **operations/** : Processus opérationnels, workflows, KPIs

### /core - Logique Métier Partagée
- **config/** : Configuration centrale pour tous les systèmes
- **utils/** : Code réutilisable entre les différents pipelines

### /pipelines - Automatisation IA
- **newsletter/** : Agents Python pour newsletter automatisée (Mailchimp, rédaction)
- **content-generation/** : Agents Node.js pour génération d'articles blog

### /operations - Monitoring & Production
- **dashboard/** : Métriques temps réel, KPIs, analytics
- **output/** : Fichiers générés par les différents pipelines

## 📊 Segments de Marché

### 1. TPE & Professions Libérales
- **Cible** : < 10 employés
- **Budget** : < 500€/mois
- **Focus** : ROI immédiat, simplicité absolue

### 2. PME (20-250 employés)
- **Cible** : Entreprises en croissance
- **Budget** : 500-5000€/mois
- **Focus** : Transformation progressive, formation équipes

### 3. ETI
- **Cible** : > 250 employés
- **Budget** : > 5000€/mois
- **Focus** : Stratégie IA globale, intégration systèmes

## 🚀 Quick Start

### Développement Site Web
```bash
npm install
npm run dev
# Site accessible sur http://localhost:4321
```

### Agents Newsletter (Python)
```bash
cd pipelines/newsletter
pip install -r requirements.txt
python main.py
```

### Agents Content Generation (Node.js)
```bash
cd pipelines/content-generation
npm install
node pipeline-v4.js
```

## 📝 Règles de Collaboration

1. **Branches Git** : Toujours créer une branche pour les changements majeurs
2. **Site Web** : Ne jamais supprimer ou déplacer /src sans coordination
3. **Tests** : Tester localement avant tout push
4. **Documentation** : Mettre à jour les README lors de changements structurels

## 👥 Équipe & Responsabilités

| Zone | Responsable | Contact |
|------|------------|---------|
| Site Web (/src) | Samuel | @Samuel |
| Agents Content | Samuel | @Samuel |
| Agents Newsletter | [Associée] | @[Associée] |
| Business Strategy | [Associée] | @[Associée] |

## 📅 Dernières Mises à Jour
- 12/08/2025 : Intégration structure unifiée
- Site restauré et fonctionnel
- Agents newsletter intégrés
- Documentation créée

---
Pour toute question, voir [/docs/STRUCTURE.md](./docs/STRUCTURE.md)
