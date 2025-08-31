
# Script de publication des articles générés - Pipeline V5
# Session : batch-v5-20250816-212634
# Date : 16/08/2025 23:30:48

$source = "C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\agents\output\articles-batch-v5-ready"
$dest = "C:\Users\Samuel\Documents\prizmia\src\content\blog"

Write-Host ""
Write-Host "📚 PUBLICATION DES ARTICLES BATCH V5" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source : $source" -ForegroundColor Gray
Write-Host "Destination : $dest" -ForegroundColor Gray
Write-Host ""

$files = Get-ChildItem -Path $source -Filter "*.md"
$count = $files.Count

Write-Host "📊 $count articles à copier" -ForegroundColor Yellow
Write-Host ""

$copied = 0
foreach ($file in $files) {
    try {
        Copy-Item $file.FullName -Destination $dest -Force
        $copied++
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erreur avec $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Terminé ! $copied/$count articles copiés." -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. cd C:\Users\Samuel\Documents\prizmia" -ForegroundColor White
Write-Host "  2. npm run dev  # Pour tester localement" -ForegroundColor White
Write-Host "  3. git add ." -ForegroundColor White
Write-Host "  4. git commit -m 'Ajout de $copied articles - Batch V5'" -ForegroundColor White
Write-Host "  5. git push" -ForegroundColor White
Write-Host ""
