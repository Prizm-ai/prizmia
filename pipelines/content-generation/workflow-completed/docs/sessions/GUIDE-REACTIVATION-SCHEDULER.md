# 🚀 GUIDE RÉACTIVATION SCHEDULER PRIZM AI

**Pour quand le site sera prêt à recevoir les articles**

---

## ✅ PRÉ-REQUIS

Avant de réactiver, vérifier que :
- [ ] Le site Prizm AI est déployé et accessible
- [ ] La structure `/images/articles/` est en place
- [ ] Les articles peuvent être publiés automatiquement
- [ ] Tu as 10 minutes devant toi pour valider

---

## 📋 ÉTAPE 1 : RÉACTIVER LE SCHEDULER (2 min)

### Action

1. Ouvrir l'explorateur Windows
2. Aller dans :
   ```
   C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed
   ```
3. Localiser le fichier : `install-scheduler.bat`
4. **Clic droit** → **"Exécuter en tant qu'administrateur"**
5. Attendre le message : `Installation terminée avec succès`
6. Appuyer sur une touche pour fermer

### Résultat attendu

```
✅ Installation terminée avec succès
Tâche créée : "Prizm AI - Generation Quotidienne"
Fréquence : Quotidien à 08:00
```

---

## 🔍 ÉTAPE 2 : VÉRIFIER LA TÂCHE (2 min)

### Action

1. Appuyer sur **Windows + R**
2. Taper : `taskschd.msc`
3. Appuyer sur **Entrée**
4. Dans le panneau de gauche : **Bibliothèque du Planificateur de tâches**
5. Chercher dans la liste : **"Prizm AI - Generation Quotidienne"**

### Vérifications

- [ ] **Nom** : "Prizm AI - Generation Quotidienne"
- [ ] **Statut** : "Prêt"
- [ ] **Déclencheur** : "À 08:00 tous les jours"
- [ ] **Dernière exécution** : (vide pour l'instant)
- [ ] **Prochaine exécution** : Demain à 08:00

✅ Si tout est OK, la tâche est active !

---

## 🧪 ÉTAPE 3 : TEST MANUEL (OPTIONNEL, 5 min)

### Uniquement si tu veux valider immédiatement

**Commande** :
```powershell
schtasks /run /tn "Prizm AI - Generation Quotidienne"
```

**Ce qui se passe** :
1. Le pipeline se lance en arrière-plan
2. Durée : ~2-3 minutes
3. 1 article est généré

**Vérifications après 3 minutes** :
```powershell
# Voir le dernier article
dir output\03-articles-factuels\*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Voir le dernier log scheduler
dir output\06-rapports\scheduler-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Voir le dernier rapport
dir output\06-rapports\rapport-session-*.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

✅ Si 1 article apparaît : **Parfait !**

---

## 📊 SURVEILLANCE LES PREMIERS JOURS

### Jours 1-3

**Chaque matin après 08:10** :

1. Vérifier qu'un nouvel article est apparu :
   ```powershell
   dir output\03-articles-factuels\*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 3
   ```

2. Consulter le rapport :
   ```powershell
   $lastReport = (dir output\06-rapports\rapport-session-*.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
   Get-Content $lastReport
   ```

3. Vérifier qu'il n'y a pas d'erreur

### Ce qui est normal

- ✅ 1 article généré/jour
- ✅ ~2200 mots/article
- ✅ Visuels intégrés (hero + charts)
- ✅ Durée ~2-3 minutes

### Signaux d'alerte

- ❌ Aucun article généré
- ❌ Erreurs dans le log scheduler
- ❌ Articles sans visuels
- ❌ Durée > 10 minutes

**Si problème** : Consulter `PASSATION-SESSION-N9-FINAL.md`

---

## ⏸️ POUR DÉSACTIVER (SI BESOIN)

**Commande** :
```powershell
schtasks /delete /tn "Prizm AI - Generation Quotidienne" /f
```

**Résultat** :
```
SUCCÈS : la tâche planifiée "Prizm AI - Generation Quotidienne" a bien été supprimée.
```

---

## 🔧 CONFIGURATION ACTUELLE

**Quand** : Tous les jours à 08:00  
**Quoi** : 1 article généré automatiquement  
**Durée** : ~2-3 minutes  
**Visuels** : Hero image + graphiques intégrés  
**Logs** : `output/06-rapports/scheduler-*.log`  
**Rapports** : `output/06-rapports/rapport-session-*.txt`

---

## 📞 EN CAS DE PROBLÈME

### Problème 1 : Aucun article généré

**Diagnostic** :
```powershell
# Voir le dernier log scheduler
$lastLog = (dir output\06-rapports\scheduler-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Get-Content $lastLog
```

**Rechercher** : Ligne avec "ERREUR"

### Problème 2 : Articles générés mais pas sur le site

**Cause probable** : Intégration site pas encore faite  
**Solution** : Voir documentation déploiement Astro

### Problème 3 : Trop d'articles générés

**Diagnostic** : Vérifier `scheduler.bat` ligne 31

**Doit être** :
```batch
node pipeline-workflow.cjs >> %LOGFILE% 2>&1
```

**Ne doit PAS être** :
```batch
node pipeline-workflow.cjs --mode=production >> %LOGFILE% 2>&1
```

---

## ✅ CHECK-LIST FINALE

Avant de considérer la réactivation comme réussie :

- [ ] Tâche installée et visible dans Planificateur
- [ ] Test manuel réussi (optionnel)
- [ ] 3 premiers jours surveillés
- [ ] Articles générés correctement
- [ ] Aucune erreur dans les logs
- [ ] Visuels bien intégrés

**Si tout est ✅ : Le système est en production ! 🎉**

---

## 💡 CONSEILS

1. **Réactiver un vendredi matin** : Pour surveiller le week-end
2. **Tester manuellement d'abord** : Valider avant le premier 08:00
3. **Surveiller 1 semaine** : S'assurer de la stabilité
4. **Garder les logs** : Historique de performance

---

**Le système est prêt, il n'attend que toi ! 🚀**
