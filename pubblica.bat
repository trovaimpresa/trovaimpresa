@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === PUBBLICA TROVAIMPRESA ===
echo.

echo 1. Controllo prima di pubblicare...
node tools/controllo-push.js
if errorlevel 1 goto errore

echo.
echo 2. File cambiati:
echo.
git status --short
echo.
git diff --quiet HEAD
if not errorlevel 1 (
  git ls-files --others --exclude-standard > "%TEMP%\ti_nuovi.txt"
  for %%A in ("%TEMP%\ti_nuovi.txt") do if %%~zA==0 (
    echo Non c'e' niente da pubblicare.
    goto fine
  )
)

set /p OK=Pubblico questi file? Scrivi S e premi Invio: 
if /i not "%OK%"=="S" goto annullato

echo.
set "MSG="
set /p MSG=Scrivi una riga che dice cosa hai cambiato (Invio per la frase standard): 
if "%MSG%"=="" set "MSG=Aggiornamento del %DATE%"

echo.
echo 3. Pubblico...
git add -A
git commit -m "%MSG%" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
if errorlevel 1 goto errore
git push
if errorlevel 1 goto errore

echo.
echo === FATTO. Fra 1 o 2 minuti e' online. ===
goto fine

:annullato
echo.
echo Annullato. Non ho pubblicato niente.
goto fine

:errore
echo.
echo === SI E' FERMATO: leggi il messaggio qui sopra. Non e' stato pubblicato. ===

:fine
echo.
pause
