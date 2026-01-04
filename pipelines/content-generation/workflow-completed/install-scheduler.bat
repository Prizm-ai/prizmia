@echo off
REM ============================================================
REM INSTALLATION SCHEDULER PRIZM AI
REM ============================================================
REM 
REM Ce script installe une tâche planifiée Windows qui lance
REM le pipeline quotidiennement à 8h00 du matin.
REM 
REM IMPORTANT : Doit être exécuté en tant qu'Administrateur
REM 
REM Date : 02 novembre 2025
REM ============================================================

echo.
echo ================================================================
echo   INSTALLATION SCHEDULER PRIZM AI
echo ================================================================
echo.

REM Vérifier les privilèges admin
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR : Ce script doit etre execute en tant qu'Administrateur
    echo.
    echo Clic droit sur le fichier ^> Executer en tant qu'administrateur
    echo.
    pause
    exit /b 1
)

echo [1/3] Verification des privileges admin... OK
echo.

REM Supprimer la tâche si elle existe déjà
schtasks /query /tn "Prizm AI - Generation Quotidienne" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [2/3] Suppression de la tache existante...
    schtasks /delete /tn "Prizm AI - Generation Quotidienne" /f >nul
    echo       Tache existante supprimee
) else (
    echo [2/3] Aucune tache existante trouvee
)
echo.

REM Créer la nouvelle tâche
echo [3/3] Creation de la tache planifiee...
schtasks /create ^
    /tn "Prizm AI - Generation Quotidienne" ^
    /tr "C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed\scheduler.bat" ^
    /sc daily ^
    /st 08:00 ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f

if %ERRORLEVEL% EQU 0 (
    echo       Tache creee avec succes !
) else (
    echo       ERREUR lors de la creation de la tache
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   INSTALLATION TERMINEE
echo ================================================================
echo.
echo La tache planifiee a ete installee avec succes.
echo.
echo PARAMETRES :
echo   - Nom : Prizm AI - Generation Quotidienne
echo   - Frequence : Tous les jours
echo   - Heure : 08:00
echo   - Utilisateur : SYSTEM
echo.
echo VERIFICATION :
echo   Ouvrir le Planificateur de taches Windows
echo   ^> Bibliotheque du Planificateur de taches
echo   ^> Chercher "Prizm AI - Generation Quotidienne"
echo.
echo LOGS :
echo   Les logs sont sauvegardes dans :
echo   output\06-rapports\scheduler-YYYYMMDD-HHMMSS.log
echo.
echo TEST MANUEL :
echo   Pour tester maintenant sans attendre 8h :
echo   schtasks /run /tn "Prizm AI - Generation Quotidienne"
echo.
echo DESINSTALLATION :
echo   schtasks /delete /tn "Prizm AI - Generation Quotidienne" /f
echo.
echo ================================================================
echo.
pause
