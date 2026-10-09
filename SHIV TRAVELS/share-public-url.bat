@echo off
title SHIV TRAVELS - Share Live Public HTTPS URL
echo ====================================================================
echo      SHIV TRAVELS - LIVE PUBLIC ACCESS FOR TEACHERS & MOBILE
echo ====================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0share-public-url.ps1"
pause
