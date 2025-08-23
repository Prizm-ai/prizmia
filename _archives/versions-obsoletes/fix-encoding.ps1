# fix-encoding.ps1
# Script PowerShell pour corriger l'encodage de TOUS les fichiers

Write-Host "`n🔧 CORRECTION DE L'ENCODAGE AVEC POWERSHELL" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Liste des fichiers à corriger
$files = @(
    "config\prizm-config.cjs",
    "agent-redacteur-factuel.cjs",
    "agent-veille-v5.cjs",
    "agent-style-conversationnel.cjs",
    "pipeline-v5-batch.cjs"
)

# Dictionnaire de corrections
$corrections = @{
    "Ã©" = "é"
    "Ã¨" = "è"
    "Ã " = "à"
    "Ã¢" = "â"
    "Ãª" = "ê"
    "Ã´" = "ô"
    "Ã¹" = "ù"
    "Ã»" = "û"
    "Ã§" = "ç"
    "Ã®" = "î"
    "Ã¯" = "ï"
    "Ã‰" = "É"
    "Ãˆ" = "È"
    "Ã€" = "À"
    "Ã‡" = "Ç"
    "ÃŠ" = "Ê"
    "Ã"" = "Ô"
    "Ã‚" = "Â"
}

$totalFixed = 0

foreach ($file in $files) {
    Write-Host "`n📄 Traitement de $file..." -ForegroundColor Yellow
    
    if (Test-Path $file) {
        # Lire le fichier
        $content = Get-Content $file -Raw -Encoding Default
        $originalContent = $content
        $fixCount = 0
        
        # Appliquer toutes les corrections
        foreach ($bad in $corrections.Keys) {
            if ($content -match [regex]::Escape($bad)) {
                $occurrences = ([regex]::Matches($content, [regex]::Escape($bad))).Count
                $content = $content -replace [regex]::Escape($bad), $corrections[$bad]
                $fixCount += $occurrences
            }
        }
        
        # Si des modifications ont été faites
        if ($content -ne $originalContent) {
            # Créer une sauvegarde
            $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
            $backupName = "$file.backup-ps-$timestamp"
            Copy-Item $file $backupName
            Write-Host "   Sauvegarde : $backupName" -ForegroundColor Gray
            
            # Écrire le fichier corrigé en UTF8
            Set-Content -Path $file -Value $content -Encoding UTF8
            Write-Host "   ✅ $fixCount corrections appliquées" -ForegroundColor Green
            $totalFixed += $fixCount
            
            # Afficher quelques exemples
            $examples = @()
            foreach ($bad in $corrections.Keys) {
                if ($originalContent -match [regex]::Escape($bad)) {
                    $good = $corrections[$bad]
                    $examples += "$bad → $good"
                    if ($examples.Count -ge 3) { break }
                }
            }
            if ($examples.Count -gt 0) {
                $exampleText = $examples -join ', '
                Write-Host "   Exemples : $exampleText" -ForegroundColor Cyan
            }
        }
        else {
            Write-Host "   Pas de corrections nécessaires" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "   ❌ Fichier non trouvé" -ForegroundColor Red
    }
}

Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "`n📊 TOTAL : $totalFixed corrections appliquées" -ForegroundColor Yellow

if ($totalFixed -gt 0) {
    Write-Host "`n✅ Les fichiers sont maintenant correctement encodés !" -ForegroundColor Green
    Write-Host "`n🧪 TEST RECOMMANDÉ :" -ForegroundColor Cyan
    Write-Host "1. Générer un article de test :" -ForegroundColor White
    Write-Host "   node pipeline-v5-batch.cjs --single --titre 'Test encodage corrigé'" -ForegroundColor Gray
    Write-Host "`n2. Vérifier l'article :" -ForegroundColor White
    Write-Host "   type output\articles-batch-v5-ready\*.md | Select-Object -First 20" -ForegroundColor Gray
}
else {
    Write-Host "`n✅ Tous les fichiers étaient déjà OK." -ForegroundColor Green
}