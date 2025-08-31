@echo off
echo ========================================
echo   PRIZM AI - GENERATION DE CONTENU
echo ========================================
echo.
cd /d "C:\Users\Samuel\Documents\prizmia\pipelines\content-generation"
node pipeline-v4-fixed.js %*
pause