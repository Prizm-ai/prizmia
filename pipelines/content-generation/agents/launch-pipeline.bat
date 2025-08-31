@echo off
cd /d "%~dp0"
echo ===============================================
echo     PIPELINE PRIZM AI V5 - GENERATION BATCH
echo ===============================================
echo.
node pipeline-v5-batch.cjs %*
pause