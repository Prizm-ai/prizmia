# MIGRATION VERS ACTIVEPIECES - 25 octobre 2025

## OBJECTIF
Automatiser la publication avec validation humaine via Activepieces

## ÉTAT ACTUEL
- Pipeline fonctionnel : génère articles en 2 min
- Articles : ~1150 mots (OK, pas à changer)
- Problème : Pas d'interface, tout manuel
- Solution choisie : Activepieces (plus simple que n8n)

## STRUCTURE
```
prizmia/pipelines/content-generation/
├── agents/
│   ├── pipeline-v5-batch.cjs (29KB)
│   ├── agent-veille-v5.cjs (23KB)
│   ├── agent-redacteur-factuel.cjs (22KB)
│   └── agent-style-conversationnel.cjs (18KB)
├── output/
│   └── [structure 01-07]
└── config/
    └── .env (contient les API keys)
```

## AGENTS À ADAPTER
1. agent-veille-v5.cjs : génère corpus
2. agent-redacteur-factuel.cjs : crée article factuel
3. agent-style-conversationnel.cjs : version optimisée

## WORKFLOW CIBLE
1. Trigger quotidien (9h)
2. Génération corpus (agent-veille)
3. Rédaction article (agent-redacteur)
4. Style conversationnel (agent-style)
5. Email preview à Samuel
6. Bouton validation
7. Si OK → Git commit → Push → Deploy Netlify

## POINTS D'ATTENTION
- NE PAS modifier les agents existants directement
- Créer des wrappers webhook
- Garder structure output/ intacte
- Tester d'abord sur 1 article

## CREDENTIALS NÉCESSAIRES
- GitHub : pour push automatique
- Email : pour notifications
- Netlify : deploy hook (optionnel)