# Configuration Activepieces pour PRIZM AI

## 📋 Vue d'ensemble

Ce guide explique comment configurer Activepieces pour automatiser la génération d'articles avec validation humaine.

## 🚀 Démarrage rapide

### 1. Lancer les services

```bash
# Terminal 1 : Lancer Activepieces
cd activepieces
docker-compose up -d

# Terminal 2 : Lancer le webhook server
node webhook-server.js

# Terminal 3 : Tester
node test-webhook.js
```

### 2. Accéder à Activepieces

Ouvrir http://localhost:8080 dans votre navigateur

- **Premier accès** : Créer un compte administrateur
- **Email** : samuel@prizmia.com (ou votre email)
- **Mot de passe** : Choisir un mot de passe sécurisé

## 🔧 Configuration du Workflow dans Activepieces

### Étape 1 : Créer un nouveau Flow

1. Cliquer sur "New Flow"
2. Nom : "PRIZM AI - Génération Article"
3. Description : "Pipeline complet avec validation humaine"

### Étape 2 : Configurer le Trigger

**Trigger : Schedule**
- Type : Daily
- Heure : 09:00
- Timezone : Europe/Paris

### Étape 3 : Ajouter les Actions

#### Action 1 : Générer la veille
- **Pièce** : HTTP Request
- **Method** : POST
- **URL** : http://host.docker.internal:3000/api/veille
- **Headers** : Content-Type: application/json
- **Body** : {}

#### Action 2 : Sélectionner le meilleur sujet
- **Pièce** : HTTP Request
- **Method** : POST
- **URL** : http://host.docker.internal:3000/api/select-subject
- **Body** :
```json
{
  "veilleFile": "${steps.action_1.body.data.file}"
}
```

#### Action 3 : Générer le corpus enrichi
- **Pièce** : HTTP Request
- **Method** : POST
- **URL** : http://host.docker.internal:3000/api/corpus
- **Body** :
```json
{
  "subject": "${steps.action_2.body.subject}"
}
```

#### Action 4 : Générer l'article factuel
- **Pièce** : HTTP Request
- **Method** : POST
- **URL** : http://host.docker.internal:3000/api/article-factuel
- **Body** :
```json
{
  "subject": "${steps.action_2.body.subject.title}",
  "corpusFile": "${steps.action_3.body.data.file}"
}
```

#### Action 5 : Optimiser le style conversationnel
- **Pièce** : HTTP Request
- **Method** : POST
- **URL** : http://host.docker.internal:3000/api/article-conversationnel
- **Body** :
```json
{
  "articleFile": "${steps.action_4.body.data.file}"
}
```

#### Action 6 : Envoyer email de validation
- **Pièce** : Gmail (ou SMTP)
- **To** : samuel@prizmia.com
- **Subject** : 🔍 Nouvel article PRIZM AI à valider : ${steps.action_2.body.subject.title}
- **Body** : 
```html
<h2>Nouvel article généré</h2>
<p><strong>Sujet :</strong> ${steps.action_2.body.subject.title}</p>
<p><strong>Catégorie :</strong> ${steps.action_2.body.subject.category}</p>
<p><strong>Longueur :</strong> ${steps.action_5.body.data.wordCount} mots</p>

<h3>Aperçu :</h3>
<div style="border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
${steps.action_5.body.data.preview}
</div>

<h3>Actions :</h3>
<a href="http://localhost:8080/flows/${flow.id}/runs/${run.id}" 
   style="background: green; color: white; padding: 10px 20px; text-decoration: none;">
   ✅ APPROUVER ET PUBLIER
</a>

<a href="http://localhost:8080/flows/${flow.id}/runs/${run.id}?reject=true" 
   style="background: red; color: white; padding: 10px 20px; text-decoration: none; margin-left: 10px;">
   ❌ REJETER
</a>
```

#### Action 7 : Attendre validation humaine
- **Pièce** : Approval
- **Title** : Validation de l'article
- **Message** : Article en attente de validation
- **Assign To** : samuel@prizmia.com

#### Action 8 : Si approuvé → Publier
- **Pièce** : Branch
- **Condition** : If approval.status == "approved"
- **True Branch** :

##### Action 8.1 : Copier vers le blog
- **Pièce** : Code
- **Language** : JavaScript
- **Code** :
```javascript
const fs = require('fs');
const path = require('path');

const sourceFile = inputs.articleFile;
const fileName = path.basename(sourceFile);
const targetFile = `C:\\Users\\Samuel\\Documents\\prizmia\\src\\content\\blog\\${fileName}`;

// Copier le fichier
fs.copyFileSync(sourceFile, targetFile);

return { 
  success: true, 
  published: targetFile 
};
```

##### Action 8.2 : Git commit et push
- **Pièce** : Code
- **Code** :
```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const repoPath = 'C:\\Users\\Samuel\\Documents\\prizmia';
const fileName = inputs.fileName;

await execPromise(`git add src/content/blog/${fileName}`, { cwd: repoPath });
await execPromise(`git commit -m "feat: nouvel article publié - ${inputs.subject}"`, { cwd: repoPath });
await execPromise('git push', { cwd: repoPath });

return { success: true };
```

##### Action 8.3 : Notification de succès
- **Pièce** : Gmail
- **Subject** : ✅ Article publié avec succès
- **Body** : L'article "${subject}" a été publié sur le blog

#### Action 9 : Si rejeté → Archiver
- **False Branch** :
- **Pièce** : Code
- **Code** : Déplacer l'article dans 07-archives/rejected/

## 📊 Dashboard de monitoring

### Métriques à suivre

1. **Production**
   - Articles générés par jour
   - Taux d'approbation
   - Temps moyen de génération

2. **Qualité**
   - Longueur moyenne
   - Score de qualité
   - Catégories couvertes

3. **Performance**
   - Temps de réponse API
   - Erreurs par agent
   - Utilisation mémoire

## 🔍 Troubleshooting

### Le webhook ne répond pas
```bash
# Vérifier que le serveur est lancé
ps aux | grep node

# Relancer si nécessaire
node webhook-server.js
```

### Activepieces ne peut pas contacter le webhook
- Utiliser `host.docker.internal` au lieu de `localhost`
- Vérifier les ports : webhook sur 3000, Activepieces sur 8080

### Les agents ne se lancent pas
- Vérifier les chemins dans webhook-server.js
- Vérifier que les fichiers .cjs existent
- Consulter les logs : `docker logs prizm-activepieces`

## 🚀 Workflow alternatif : Mode Batch

Pour générer plusieurs articles d'un coup :

1. Dupliquer le Flow
2. Remplacer le trigger Schedule par Manual
3. Ajouter une boucle sur les Actions 4-5-6
4. Limiter à 3 articles par batch

## 📝 Checklist de mise en production

- [ ] Docker Desktop installé et fonctionnel
- [ ] Activepieces accessible sur http://localhost:8080
- [ ] Webhook server lancé sur port 3000
- [ ] Test webhook passé avec succès
- [ ] Flow créé dans Activepieces
- [ ] Email de notification configuré
- [ ] Premier article test généré
- [ ] Validation manuelle testée
- [ ] Git configuré pour auto-push
- [ ] Documentation mise à jour

## 💡 Optimisations futures

1. **Cache Redis** pour les corpus récurrents
2. **Webhook sécurisé** avec API key
3. **Retry automatique** en cas d'échec
4. **Génération d'images** avec DALL-E
5. **SEO automatique** avec méta-descriptions
6. **A/B testing** des titres
7. **Analytics** intégrées
8. **Newsletter** automatique

## 📞 Support

En cas de problème :
1. Consulter les logs : `docker logs -f prizm-activepieces`
2. Vérifier le webhook : `node test-webhook.js`
3. Redémarrer les services : `docker-compose restart`

---

*Documentation créée le 25 octobre 2025 pour PRIZM AI*
