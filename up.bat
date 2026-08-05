@echo off
cd /d "%~dp0"
git add -A
git commit -m "update %date% %time:~0,5%"

git pull --rebase origin main
if errorlevel 1 (
    echo.
    echo Το git pull --rebase απετυχε ^(πιθανο conflict^). ΔΕΝ εγινε push.
    echo Λυσε το conflict χειροκινητα και μετα τρεξε: git push origin main
    exit /b 1
)

git push origin main
