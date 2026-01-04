@echo off
chcp 65001 >nul
REM setup-workflow.bat - Installation Workflow Completed (Version simplifiee)

echo.
echo ========================================================
echo   PRIZM AI - INSTALLATION WORKFLOW COMPLETED
echo   Version simplifiee sans caracteres speciaux
echo ========================================================
echo.

REM Verification Node.js
echo [ETAPE 1/8] Verification Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe
    echo Telechargez-le sur : https://nodejs.org
    pause
    exit /b 1
)
echo OK - Node.js detecte : 
node --version
echo.

REM Verification npm
echo [ETAPE 1/8] Verification npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: npm n'est pas installe
    pause
    exit /b 1
)
echo OK - npm detecte :
npm --version
echo.

REM Verification dossier
echo [ETAPE 1/8] Verification dossier...
if not exist "agent-veille-v5.cjs" (
    echo.
    echo ERREUR: Ce script doit etre execute depuis :
    echo    C:\Users\Samuel\Documents\prizmia\pipelines\content-generation
    echo.
    echo Dossier actuel :
    cd
    echo.
    pause
    exit /b 1
)
echo OK - Dossier correct
echo.

REM Creation structure
echo.
echo ========================================================
echo [ETAPE 2/8] Creation de la structure
echo ========================================================
echo.

if exist "workflow-completed" (
    echo Le dossier workflow-completed existe deja
    echo Voulez-vous le supprimer et reinstaller? (O/N)
    set /p choix=Votre choix: 
    if /i "%choix%"=="O" (
        echo Suppression...
        rmdir /s /q workflow-completed
        echo OK - Supprime
    ) else (
        echo Installation annulee
        pause
        exit /b 1
    )
)

echo Creation du dossier principal...
mkdir workflow-completed
cd workflow-completed

echo Creation des sous-dossiers...
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

echo OK - Structure creee
echo.

REM Copie agents
echo.
echo ========================================================
echo [ETAPE 3/8] Copie des agents existants
echo ========================================================
echo.

echo Copie agent-veille...
copy ..\agent-veille-v5.cjs agents\agent-veille.cjs >nul 2>&1
if errorlevel 1 (
    echo ATTENTION: agent-veille-v5.cjs non trouve
) else (
    echo OK - agent-veille.cjs
)

echo Copie agent-redacteur...
copy ..\agent-redacteur-factuel.cjs agents\ >nul 2>&1
if errorlevel 1 (
    echo ATTENTION: agent-redacteur-factuel.cjs non trouve
) else (
    echo OK - agent-redacteur-factuel.cjs
)

echo Copie utils...
if exist "..\utils\date-helper.cjs" (
    copy ..\utils\date-helper.cjs utils\ >nul 2>&1
    echo OK - date-helper.cjs
)

if exist "..\utils\sujet-scorer.cjs" (
    copy ..\utils\sujet-scorer.cjs utils\ >nul 2>&1
    echo OK - sujet-scorer.cjs
)

echo.

REM Attente fichiers Claude
echo.
echo ========================================================
echo [ETAPE 4/8] Copie des fichiers de Claude
echo ========================================================
echo.
echo ACTION REQUISE :
echo.
echo Copiez TOUS les fichiers .cjs que Claude vous a fournis
echo dans le dossier workflow-completed\
echo.
echo Fichiers a copier dans temp-workflow-files :
echo   - config-workflow.cjs
echo   - agent-analyseur-visuel.cjs
echo   - agent-generateur-visuel.cjs
echo   - agent-integrateur-visuel.cjs
echo   - dalle.cjs
echo   - charts.cjs
echo   - mermaid.cjs
echo   - image-manager.cjs
echo   - moniteur.cjs
echo   - publisher.cjs
echo   - package.json
echo.
echo Quand c'est fait, appuyez sur une touche...
pause >nul

REM Copie fichiers Claude depuis temp
echo.
echo Copie des fichiers depuis temp-workflow-files...
if exist "..\temp-workflow-files\config-workflow.cjs" (
    copy ..\temp-workflow-files\config-workflow.cjs config\ >nul 2>&1
    echo OK - config-workflow.cjs
)

if exist "..\temp-workflow-files\package.json" (
    copy ..\temp-workflow-files\package.json . >nul 2>&1
    echo OK - package.json
)

if exist "..\temp-workflow-files\agent-analyseur-visuel.cjs" (
    copy ..\temp-workflow-files\agent-analyseur-visuel.cjs agents\ >nul 2>&1
    echo OK - agent-analyseur-visuel.cjs
)

if exist "..\temp-workflow-files\agent-generateur-visuel.cjs" (
    copy ..\temp-workflow-files\agent-generateur-visuel.cjs agents\ >nul 2>&1
    echo OK - agent-generateur-visuel.cjs
)

if exist "..\temp-workflow-files\agent-integrateur-visuel.cjs" (
    copy ..\temp-workflow-files\agent-integrateur-visuel.cjs agents\ >nul 2>&1
    echo OK - agent-integrateur-visuel.cjs
)

if exist "..\temp-workflow-files\dalle.cjs" (
    copy ..\temp-workflow-files\dalle.cjs generateurs\ >nul 2>&1
    echo OK - dalle.cjs
)

if exist "..\temp-workflow-files\charts.cjs" (
    copy ..\temp-workflow-files\charts.cjs generateurs\ >nul 2>&1
    echo OK - charts.cjs
)

if exist "..\temp-workflow-files\mermaid.cjs" (
    copy ..\temp-workflow-files\mermaid.cjs generateurs\ >nul 2>&1
    echo OK - mermaid.cjs
)

if exist "..\temp-workflow-files\image-manager.cjs" (
    copy ..\temp-workflow-files\image-manager.cjs utils\ >nul 2>&1
    echo OK - image-manager.cjs
)

if exist "..\temp-workflow-files\moniteur.cjs" (
    copy ..\temp-workflow-files\moniteur.cjs utils\ >nul 2>&1
    echo OK - moniteur.cjs
)

if exist "..\temp-workflow-files\publisher.cjs" (
    copy ..\temp-workflow-files\publisher.cjs utils\ >nul 2>&1
    echo OK - publisher.cjs
)

echo.

REM Creation .env
echo.
echo ========================================================
echo [ETAPE 5/8] Configuration .env
echo ========================================================
echo.

if not exist "config\.env" (
    echo Creation du template .env...
    echo # WORKFLOW COMPLETED - Configuration > config\.env
    echo # Copiez vos cles API depuis l'ancien .env >> config\.env
    echo. >> config\.env
    echo ANTHROPIC_API_KEY=sk-ant-... >> config\.env
    echo PERPLEXITY_API_KEY=pplx-... >> config\.env
    echo OPENAI_API_KEY=sk-... >> config\.env
    echo. >> config\.env
    echo EMAIL_FROM=votre-email@gmail.com >> config\.env
    echo EMAIL_TO=samuel@prizm-ai.fr >> config\.env
    echo EMAIL_APP_PASSWORD=xxxxxxxxxxxx >> config\.env
    echo. >> config\.env
    echo VALIDATION_SERVER_PORT=3001 >> config\.env
    echo VALIDATION_BASE_URL=http://localhost:3001 >> config\.env
    echo. >> config\.env
    echo GIT_AUTO_PUSH=true >> config\.env
    
    echo OK - Fichier .env cree
    echo ATTENTION: Remplir config\.env avec vos vraies cles
) else (
    echo OK - Fichier .env existant
)

echo.

REM Verification package.json
echo.
echo ========================================================
echo [ETAPE 6/8] Configuration npm
echo ========================================================
echo.

if not exist "package.json" (
    echo ATTENTION: package.json manquant
    echo Creation d'un package.json minimal...
    
    echo { > package.json
    echo   "name": "prizm-ai-workflow-completed", >> package.json
    echo   "version": "1.0.0", >> package.json
    echo   "description": "Workflow Completed" >> package.json
    echo } >> package.json
)

echo OK - package.json present
echo.

REM Installation npm
echo.
echo ========================================================
echo [ETAPE 7/8] Installation des dependances npm
echo ========================================================
echo.
echo Cela peut prendre 2-3 minutes...
echo.

call npm install

if errorlevel 1 (
    echo ERREUR lors de l'installation
    pause
    exit /b 1
)

echo OK - Dependances installees
echo.

REM Verification finale
echo.
echo ========================================================
echo [ETAPE 8/8] Verification de l'installation
echo ========================================================
echo.

echo Verification structure :
if exist "config" (echo OK - config\) else (echo ERREUR - config\)
if exist "agents" (echo OK - agents\) else (echo ERREUR - agents\)
if exist "generateurs" (echo OK - generateurs\) else (echo ERREUR - generateurs\)
if exist "utils" (echo OK - utils\) else (echo ERREUR - utils\)
if exist "output" (echo OK - output\) else (echo ERREUR - output\)

echo.
echo Verification fichiers critiques :
if exist "config\config-workflow.cjs" (echo OK - config-workflow.cjs) else (echo ATTENTION - config-workflow.cjs manquant)
if exist "agents\agent-veille.cjs" (echo OK - agent-veille.cjs) else (echo ERREUR - agent-veille.cjs manquant)
if exist "utils\image-manager.cjs" (echo OK - image-manager.cjs) else (echo ATTENTION - image-manager.cjs manquant)
if exist "package.json" (echo OK - package.json) else (echo ERREUR - package.json)
if exist "node_modules" (echo OK - node_modules\) else (echo ERREUR - node_modules\)

echo.

REM Resultat final
echo.
echo ========================================================
echo   INSTALLATION TERMINEE
echo ========================================================
echo.
echo Localisation : 
echo    %cd%
echo.
echo PROCHAINES ACTIONS :
echo.
echo    1. Completez config\.env avec vos cles API
echo.
echo    2. Testez la configuration :
echo       node config\config-workflow.cjs
echo.
echo    3. Testez un agent :
echo       node agents\agent-veille.cjs --help
echo.
echo Workflow Completed est pret!
echo.
pause
