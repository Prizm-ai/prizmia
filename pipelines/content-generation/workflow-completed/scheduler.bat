@echo off
REM ============================================================
REM SCHEDULER PRIZM AI - Génération quotidienne automatique
REM ============================================================
REM 
REM Ce script est exécuté quotidiennement par le planificateur
REM de tâches Windows à 8h00 du matin.
REM 
REM Il lance le pipeline en mode production et log les résultats.
REM 
REM Date : 02 novembre 2025
REM ============================================================

REM Aller dans le dossier du workflow
cd /d C:\Users\Samuel\Documents\prizmia\pipelines\content-generation\workflow-completed

REM Créer le nom du fichier de log
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOGFILE=output\06-rapports\scheduler-%TIMESTAMP%.log

REM Header du log
echo ================================================================ >> %LOGFILE%
echo   PRIZM AI - Generation Quotidienne Automatique >> %LOGFILE%
echo   Date : %date% %time% >> %LOGFILE%
echo ================================================================ >> %LOGFILE%
echo. >> %LOGFILE%

REM Lancer le pipeline en mode production
echo [%time%] Demarrage du pipeline... >> %LOGFILE%
node pipeline-workflow.cjs >> %LOGFILE% 2>&1

REM Vérifier le code de sortie
if %ERRORLEVEL% EQU 0 (
    echo [%time%] Pipeline termine avec succes >> %LOGFILE%
) else (
    echo [%time%] ERREUR : Pipeline termine avec erreur %ERRORLEVEL% >> %LOGFILE%
)

echo. >> %LOGFILE%
echo ================================================================ >> %LOGFILE%
echo   Fin de l'execution >> %LOGFILE%
echo ================================================================ >> %LOGFILE%

REM Fin
exit /b %ERRORLEVEL%
