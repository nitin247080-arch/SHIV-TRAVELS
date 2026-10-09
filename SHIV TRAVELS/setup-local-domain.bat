@echo off
title SHIV TRAVELS - Setup Custom Domain (shivtravels.com)
echo ====================================================================
echo      SHIV TRAVELS - BIND CUSTOM DOMAIN (shivtravels.com)
echo ====================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-local-domain.ps1"
