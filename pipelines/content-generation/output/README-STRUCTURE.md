# STRUCTURE DÉFINITIVE PRIZM AI

## 📁 Organisation des dossiers

```
output/
├── 01-veille/              # Veilles quotidiennes
│   └── YYYY-MM-DD/
├── 02-corpus/              # Corpus enrichis  
│   └── YYYY-MM-DD/
├── 03-articles-factuels/   # Articles factuels générés
├── 04-articles-conversationnels/  # Articles avec style
├── 05-articles-finaux/     # Articles validés prêts à publier
├── 06-rapports/            # Rapports de session
└── 07-archives/            # Archives par session
```

## ⚠️ RÈGLES ABSOLUES

1. **JAMAIS** créer de dossiers avec numérotation dupliquée
2. **TOUJOURS** utiliser structure-config.cjs comme référence
3. **NE PAS** hardcoder les chemins dans les agents

## 🔧 Agents et leurs dossiers

| Agent | Dossier de sortie |
|-------|-------------------|
| agent-veille-v4 | 01-veille + 02-corpus |
| agent-redacteur-factuel | 03-articles-factuels |
| agent-style-conversationnel | 04-articles-conversationnels |
| pipeline-v4 | 05-articles-finaux |

## 📋 Maintenance

Si un nouveau dossier apparaît avec un numéro dupliqué :
1. Identifier l'agent responsable
2. Corriger le chemin dans l'agent
3. Migrer les fichiers
4. Supprimer le dossier incorrect

---
*Dernière mise à jour : 2025-08-15*