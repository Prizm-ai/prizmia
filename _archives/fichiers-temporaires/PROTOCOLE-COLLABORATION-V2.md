# 🎯 PROTOCOLE DE COLLABORATION PRIZM AI V2.0
## Document de Référence Opérationnel

---

## 🔴 SECTION URGENCE - CONSULTER EN PREMIER

### ⚡ RÉFLEXES IMMÉDIATS
SI erreur encodage → Vérifier dans VS CODE, pas PowerShell
SI "undefined" ou "not found" → Demander structure complète
SI plus de 2 tentatives → STOP, diagnostic complet
SI modification système → Backup d'abord

### 🚫 PIÈGES MORTELS (Vécu & Documenté)

| Piège | Symptôme | Vraie cause | Action |
|-------|----------|-------------|---------|
| "Fantôme UTF-8" | `Ã©` dans PowerShell | Affichage seulement | Vérifier VS Code |
| "Double frontmatter" | Articles cassés | Script qui ajoute sans supprimer | Nettoyer, pas ajouter |
| "Path not found" | Fichier "inexistant" | Mauvais dossier de travail | `pwd` + structure complète |
| "Module not found" | Import échoue | .js vs .cjs | Vérifier package.json type |

---

## 📋 CHECKLIST OPÉRATIONNELLE

### 🟦 PHASE 1: DIAGNOSTIC (Obligatoire)
```checklist
□ J'ai demandé : "Depuis quel dossier travaillez-vous ?"
□ J'ai vu : Le fichier EXACT à modifier (pas supposé)
□ J'ai vérifié : L'erreur est dans VS Code ou juste PowerShell ?
□ J'ai identifié : Cause racine vs symptôme
□ J'ai proposé : Au moins 2 solutions différentes
🟨 PHASE 2: VALIDATION (Avant code)
checklist□ User a validé : Le diagnostic est correct
□ User a choisi : La solution préférée
□ Backup existe : Ou user confirme pas nécessaire
□ Impacts listés : "Cela va aussi modifier..."
🟩 PHASE 3: EXÉCUTION (Avec garde-fous)
checklist□ Code testé : "D'abord essayons sur UN fichier"
□ Rollback prêt : "Si problème: [commande rollback]"
□ Validation progressive : "Vérifiez après cette étape"

🗂️ CONTEXTE SYSTÈME PRIZM AI
Structure Projet
C:\Users\Samuel\Documents\
├── prizmia\                    # Site Astro
│   ├── src\content\blog\       # Articles publiés
│   └── package.json            # type: "module" → .js = ESM
│
└── prizmia\pipelines\content-generation\
    ├── config\prizm-config.cjs # Config centrale
    ├── output\                  # Articles générés
    │   ├── 01-veille\
    │   ├── 02-corpus\
    │   ├── 03-articles-factuels\
    │   └── articles-batch-v5-ready\
    └── *.cjs                    # Agents (CommonJS)
Commandes Fréquentes
bash# Navigation
cd C:\Users\Samuel\Documents\prizmia\pipelines\content-generation

# Génération article
node pipeline-v5-batch.cjs --single --titre "Sujet"

# Vérification encodage (VS Code, pas PowerShell!)
code output\articles-batch-v5-ready\*.md

# Blog local
cd C:\Users\Samuel\Documents\prizmia
npm run dev

💬 TEMPLATES DE COMMUNICATION
Pour demander des informations
"Avant de proposer une solution, puis-je voir :
1. Le contenu exact de [fichier]
2. La structure du dossier avec : dir [chemin]
3. L'erreur apparaît où : Terminal ou VS Code ?"
Pour proposer des solutions
"J'ai identifié le problème : [cause racine]

3 solutions possibles :
1. [Rapide] : [description] (Impact: X)
2. [Propre] : [description] (Impact: Y)  
3. [Complète] : [description] (Impact: Z)

Laquelle préférez-vous ?"
Si échec après 2 tentatives
"Je constate que mes solutions ne fonctionnent pas.
Reprenons avec un diagnostic complet :
1. [Questions spécifiques]
2. Pouvez-vous faire : [commande diagnostic]
3. Y a-t-il eu des changements récents dans [zone] ?"

📊 PATTERNS DE SUCCÈS PROUVÉS
✅ Sessions réussies (à répliquer)

16/08 - Génération 5 articles : Diagnostic → Test sur 1 → Batch complet
12/08 - Migration réussie : Backup → Test partiel → Migration → Validation
30/07 - Pipeline V5 : Analyse besoins → Architecture → Implémentation progressive

❌ Échecs documentés (à éviter)

16/08 - 3h fantômes UTF-8 : Pas vérifié VS Code, corrigé problème inexistant
15/08 - Articles dupliqués : Script ajoutait sans nettoyer l'ancien
14/08 - Navigation cassée : Modifié sans comprendre architecture Astro


🔄 JOURNAL D'APPRENTISSAGE
Leçons apprises
DateProblèmeErreur commiseLeçon16/08EncodageCru PowerShellTOUJOURS vérifier VS Code16/08FrontmatterAjouté au lieu de remplacerNettoyer avant d'ajouter15/08Structure blogSupposé au lieu de voirDemander fichiers exacts
Règles évolutives

v1.0 : Règles de base
v1.1 : +Spécificités Windows/PowerShell
v2.0 : +Templates communication, patterns succès
v2.1 : [Prochains ajouts après sessions]


⚙️ CONFIGURATION IDE RECOMMANDÉE
VS Code Settings
json{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": true,
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "editor.formatOnSave": true
}
Extensions utiles

EditorConfig for VS Code
Prettier
Path Intellisense
GitLens