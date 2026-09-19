@echo off
setlocal
set PORT=8763
cd /d "%~dp0"

where python >nul 2>nul
if %ERRORLEVEL%==0 (
    start "Serveur Automatismes 6e" cmd /c "python -m http.server %PORT%"
    goto :launch
)
where py >nul 2>nul
if %ERRORLEVEL%==0 (
    start "Serveur Automatismes 6e" cmd /c "py -m http.server %PORT%"
    goto :launch
)
where node >nul 2>nul
if %ERRORLEVEL%==0 (
    start "Serveur Automatismes 6e" cmd /c "npx --yes http-server -p %PORT%"
    goto :launch
)

echo Aucun serveur local n'a ete trouve sur cet ordinateur (ni Python ni Node.js).
echo Installe Python depuis https://www.python.org/downloads/
echo   ^(coche bien la case "Add python.exe to PATH" pendant l'installation^)
echo puis redouble-clique sur ce fichier.
echo.
pause
exit /b

:launch
timeout /t 2 >nul
start "" "http://localhost:%PORT%/6e-automatisme.html"
echo.
echo Le serveur local tourne dans cette fenetre - NE LA FERME PAS tant que tu utilises la page.
echo Ferme cette fenetre quand tu as termine.
echo.
pause
