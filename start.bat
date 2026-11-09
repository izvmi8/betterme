@echo off
title betterme dev server
cd /d "%~dp0"
echo ==============================================
echo   Uruchamianie betterme (BeReal Fitness App)
echo ==============================================
echo.
call npm.cmd run dev -- --host
pause
