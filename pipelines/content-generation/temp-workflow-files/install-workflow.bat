@echo off
REM install-workflow.bat - Installation automatique du Workflow Completed
REM À placer et exécuter depuis : C:\Users\Samuel\Documents\prizmia\pipelines\content-generation

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  PRIZM AI - INSTALLATION WORKFLOW COMPLETED              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Vérifier qu'on est dans le bon dossier
if not exist "agent-veille-v5.cjs" (
    echo ❌ ERREUR: Ce script doit être exécuté depuis :
    echo    C:\Users\Samuel\Documents\prizmia\pipelines\content-generation
    echo.
    pause
    exit /b 1
)

echo ✅ Dossier de base détecté
echo.

REM ============================================================
REM ÉTAPE 1 : Créer la structure de base
REM ============================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ÉTAPE 1/6 : Création de la structure de dossiers
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if exist "workflow-completed" (
    echo ⚠️  Le dossier workflow-completed existe déjà.
    echo    Voulez-vous le supprimer et réinstaller? (O/N)
    set /p choix=Votre choix: 
    if /i "%choix%"=="O" (
        echo    Suppression de l'ancien dossier...
        rmdir /s /q workflow-completed
        echo    ✅ Ancien dossier supprimé
    ) else (
        echo    ❌ Installation annulée
        pause
        exit /b 1
    )
)

echo Creating main folder...
mkdir workflow-completed
cd workflow-completed

echo Creating subfolders...
mkdir config
mkdir agents
mkdir generateurs
mkdir utils
mkdir templates
mkdir server
mkdir output

cd output
mkdir 01-veille
mkdir 02-corpus
mkdir 03-articles-factuels
mkdir 05-articles-finaux
mkdir 05b-visuels
mkdir 06-rapports
mkdir 07-archives
cd ..

echo ✅ Structure créée avec succès
echo.

REM ============================================================
REM ÉTAPE 2 : Copier les agents existants
REM ============================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ÉTAPE 2/6 : Copie des agents depuis l'ancien système
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Copie agent-veille...
copy ..\agent-veille-v5.cjs agents\agent-veille.cjs >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur lors de la copie de agent-veille-v5.cjs
) else (
    echo ✅ agent-veille.cjs copié
)

echo Copie agent-redacteur-factuel...
copy ..\agent-redacteur-factuel.cjs agents\ >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur lors de la copie de agent-redacteur-factuel.cjs
) else (
    echo ✅ agent-redacteur-factuel.cjs copié
)

echo Copie des utilitaires...
if exist "..\utils\date-helper.cjs" (
    copy ..\utils\date-helper.cjs utils\ >nul 2>&1
    echo ✅ date-helper.cjs copié
) else (
    echo ⚠️  date-helper.cjs non trouvé ^(optionnel^)
)

if exist "..\utils\sujet-scorer.cjs" (
    copy ..\utils\sujet-scorer.cjs utils\ >nul 2>&1
    echo ✅ sujet-scorer.cjs copié
) else (
    echo ⚠️  sujet-scorer.cjs non trouvé ^(optionnel^)
)

echo.

REM ============================================================
REM ÉTAPE 3 : Créer le fichier .env template
REM ============================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ÉTAPE 3/6 : Création du template .env
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo # PRIZM AI - WORKFLOW COMPLETED > config\.env.template
echo # Configuration indépendante >> config\.env.template
echo. >> config\.env.template
echo # APIs ^(copiez vos clés depuis l'ancien .env^) >> config\.env.template
echo ANTHROPIC_API_KEY=sk-ant-... >> config\.env.template
echo PERPLEXITY_API_KEY=pplx-... >> config\.env.template
echo OPENAI_API_KEY=sk-... >> config\.env.template
echo. >> config\.env.template
echo # Email de notification ^(NOUVEAU^) >> config\.env.template
echo EMAIL_FROM=votre-email@gmail.com >> config\.env.template
echo EMAIL_TO=samuel@prizm-ai.fr >> config\.env.template
echo EMAIL_APP_PASSWORD=xxxxxxxxxxxx >> config\.env.template
echo. >> config\.env.template
echo # Serveur de validation ^(NOUVEAU^) >> config\.env.template
echo VALIDATION_SERVER_PORT=3001 >> config\.env.template
echo VALIDATION_BASE_URL=http://localhost:3001 >> config\.env.template
echo. >> config\.env.template
echo # Publication automatique ^(NOUVEAU^) >> config\.env.template
echo GIT_AUTO_PUSH=true >> config\.env.template

echo ✅ Template .env créé : config\.env.template
echo ⚠️  À FAIRE : Renommer en .env et compléter avec vos vraies clés
echo.

REM ============================================================
REM ÉTAPE 4 : Copier les fichiers de configuration
REM ============================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ÉTAPE 4/6 : Fichiers de configuration
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ⚠️  Les fichiers suivants doivent être copiés manuellement :
echo.
echo    Depuis votre dossier de téléchargement vers workflow-completed\ :
echo    • config-workflow.cjs     → config\
echo    • image-manager.cjs       → utils\
echo    • moniteur.cjs            → utils\
echo    • package.json            → racine
echo.
echo Appuyez sur une touche quand c'est fait...
pause >nul

if not exist "package.json" (
    echo ❌ package.json non trouvé
    echo    L'installation ne peut pas continuer sans ce fichier
    pause
    exit /b 1
) else (
    echo ✅ package.json détecté
)

if not exist "config\config-workflow.cjs" (
    echo ⚠️  config-workflow.cjs non trouvé ^(sera fourni en PHASE 2^)
) else (
    echo ✅ config-workflow.cjs détecté
)

echo.

REM ============================================================
REM ÉTAPE 5 : Installation des dépendances
REM ============================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ÉTAPE 5/6 : Installation des dépendances npm
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Cela peut prendre 2-3 minutes...
echo.

call npm install

if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances
    echo    Vérifiez votre connexion internet et réessayez
    pause
    exit /b 1
) else (
    echo ✅ Dépendances installées avec succès
)

echo.

REM ============================================================
REM ÉTAPE 6 : Vérification finale
REM ============================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ÉTAPE 6/6 : Vérification de l'installation
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Vérification de la structure...
if exist "agents\agent-veille.cjs" (echo ✅ Agent veille) else (echo ❌ Agent veille manquant)
if exist "agents\agent-redacteur-factuel.cjs" (echo ✅ Agent rédacteur) else (echo ❌ Agent rédacteur manquant)
if exist "utils\image-manager.cjs" (echo ✅ Image manager) else (echo ⚠️  Image manager manquant ^(PHASE 2^))
if exist "utils\moniteur.cjs" (echo ✅ Moniteur) else (echo ⚠️  Moniteur manquant ^(PHASE 2^))
if exist "config\config-workflow.cjs" (echo ✅ Configuration) else (echo ⚠️  Configuration manquante ^(PHASE 2^))
if exist "package.json" (echo ✅ Package.json) else (echo ❌ Package.json manquant)
if exist "node_modules" (echo ✅ Node modules) else (echo ❌ Node modules manquants)

echo.

REM ============================================================
REM RÉSUMÉ FINAL
REM ============================================================
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✅ INSTALLATION TERMINÉE                                ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📍 Localisation : 
echo    %cd%
echo.
echo 📋 PROCHAINES ÉTAPES :
echo.
echo    1. Configurez config\.env avec vos clés API
echo       ^(renommez config\.env.template en config\.env^)
echo.
echo    2. Copiez les fichiers de PHASE 1 reçus de Claude :
echo       • config-workflow.cjs     → config\
echo       • image-manager.cjs       → utils\
echo       • moniteur.cjs            → utils\
echo.
echo    3. Adaptez les chemins dans les agents copiés :
echo       • agents\agent-veille.cjs
echo       • agents\agent-redacteur-factuel.cjs
echo.
echo    4. Informez Claude : "Installation phase 1 terminée"
echo.
echo 🎯 Workflow Completed est prêt pour la PHASE 2 !
echo.
pause
