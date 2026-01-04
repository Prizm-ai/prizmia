# deploy-structure-v3.ps1
# Script de déploiement de la structure v3.0 avec backups automatiques
# EXÉCUTER DEPUIS : C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   DÉPLOIEMENT STRUCTURE V3.0" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "📅 Timestamp : $timestamp`n" -ForegroundColor Yellow

# ========================================
# ÉTAPE 1 : BACKUPS AUTOMATIQUES
# ========================================

Write-Host "📦 ÉTAPE 1 : Backups automatiques`n" -ForegroundColor Green

$backups = @(
    @{src="generateurs\dalle.cjs"; dest="generateurs\dalle.cjs.backup-$timestamp"},
    @{src="generateurs\charts.cjs"; dest="generateurs\charts.cjs.backup-$timestamp"},
    @{src="generateurs\mermaid.cjs"; dest="generateurs\mermaid.cjs.backup-$timestamp"},
    @{src="agents\agent-generateur-visuel.cjs"; dest="agents\agent-generateur-visuel.cjs.backup-$timestamp"},
    @{src="publish-article.cjs"; dest="publish-article.cjs.backup-$timestamp"}
)

foreach ($backup in $backups) {
    if (Test-Path $backup.src) {
        Copy-Item $backup.src $backup.dest
        Write-Host "✅ Backup : $($backup.src) → $($backup.dest)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Fichier introuvable : $($backup.src)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Backups terminés !`n" -ForegroundColor Green

# ========================================
# ÉTAPE 2 : TÉLÉCHARGER LES FICHIERS V3
# ========================================

Write-Host "📥 ÉTAPE 2 : Téléchargement des fichiers v3.0`n" -ForegroundColor Green
Write-Host "⚠️  IMPORTANT : Télécharge les 5 fichiers depuis Claude :`n" -ForegroundColor Yellow

$files = @(
    "dalle-v3-structure.cjs",
    "charts-v3-structure.cjs",
    "mermaid-v3-structure.cjs",
    "agent-generateur-visuel-v3-structure.cjs",
    "publish-article-v3-structure.cjs"
)

foreach ($file in $files) {
    Write-Host "   📄 $file" -ForegroundColor Cyan
}

Write-Host "`n💡 Une fois téléchargés dans ce dossier, presse ENTRÉE..." -ForegroundColor Yellow
$null = Read-Host

# ========================================
# ÉTAPE 3 : COPIER LES FICHIERS V3
# ========================================

Write-Host "`n📋 ÉTAPE 3 : Installation des fichiers v3.0`n" -ForegroundColor Green

$deployments = @(
    @{src="dalle-v3-structure.cjs"; dest="generateurs\dalle.cjs"},
    @{src="charts-v3-structure.cjs"; dest="generateurs\charts.cjs"},
    @{src="mermaid-v3-structure.cjs"; dest="generateurs\mermaid.cjs"},
    @{src="agent-generateur-visuel-v3-structure.cjs"; dest="agents\agent-generateur-visuel.cjs"},
    @{src="publish-article-v3-structure.cjs"; dest="publish-article.cjs"}
)

foreach ($deploy in $deployments) {
    if (Test-Path $deploy.src) {
        Copy-Item $deploy.src $deploy.dest -Force
        Write-Host "✅ Installé : $($deploy.dest)" -ForegroundColor Green
    } else {
        Write-Host "❌ Fichier manquant : $($deploy.src)" -ForegroundColor Red
        Write-Host "   Télécharge-le depuis Claude et relance le script" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n✅ Installation terminée !`n" -ForegroundColor Green

# ========================================
# ÉTAPE 4 : NETTOYAGE OPTIONNEL
# ========================================

Write-Host "🧹 ÉTAPE 4 : Nettoyage (optionnel)`n" -ForegroundColor Green
Write-Host "Veux-tu supprimer les fichiers *-v3-structure.cjs ? (O/N)" -ForegroundColor Yellow
$cleanup = Read-Host

if ($cleanup -eq "O" -or $cleanup -eq "o") {
    foreach ($deploy in $deployments) {
        if (Test-Path $deploy.src) {
            Remove-Item $deploy.src
            Write-Host "🗑️  Supprimé : $($deploy.src)" -ForegroundColor Gray
        }
    }
    Write-Host "`n✅ Nettoyage terminé !" -ForegroundColor Green
}

# ========================================
# RÉSUMÉ
# ========================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   ✅ DÉPLOIEMENT V3.0 TERMINÉ" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📦 Backups sauvegardés avec timestamp : $timestamp" -ForegroundColor Gray
Write-Host "✅ 5 fichiers v3.0 installés" -ForegroundColor Green
Write-Host "`n🧪 Prochaine étape : Tester avec 1 article`n" -ForegroundColor Yellow
Write-Host "   node pipeline-workflow.cjs --dirige --titre `"Test structure v3`"`n" -ForegroundColor Cyan
