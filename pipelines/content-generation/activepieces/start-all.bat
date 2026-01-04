@echo off
echo ╔════════════════════════════════════════════╗
echo ║     DÉMARRAGE DU SYSTÈME PRIZM AI          ║
echo ║         ACTIVEPIECES + WEBHOOK             ║
echo ╚════════════════════════════════════════════╝
echo.

echo [1/4] Vérification de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker n'est pas installé ou non accessible
    echo Veuillez installer Docker Desktop depuis https://docker.com
    pause
    exit /b 1
)
echo ✓ Docker détecté

echo.
echo [2/4] Démarrage d'Activepieces...
cd /d C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\activepieces
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du démarrage d'Activepieces
    pause
    exit /b 1
)
echo ✓ Activepieces démarré

echo.
echo [3/4] Attente du démarrage complet (30 secondes)...
timeout /t 30 /nobreak >nul

echo.
echo [4/4] Démarrage du serveur Webhook...
start "PRIZM Webhook Server" cmd /k "cd /d C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\activepieces && node webhook-server.js"

echo.
echo ╔════════════════════════════════════════════╗
echo ║          SYSTÈME DÉMARRÉ AVEC SUCCÈS        ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📌 URLs importantes :
echo    - Activepieces : http://localhost:8080
echo    - Webhook API  : http://localhost:3000
echo    - Santé API    : http://localhost:3000/health
echo.
echo 🚀 Prochaines étapes :
echo    1. Ouvrir http://localhost:8080
echo    2. Se connecter avec votre compte
echo    3. Créer/modifier le workflow
echo    4. Tester avec le bouton "Run"
echo.
echo 💡 Pour arrêter le système :
echo    - Fermer la fenêtre du webhook
echo    - Exécuter : docker-compose down
echo.

timeout /t 5 /nobreak >nul
start http://localhost:8080

pause
