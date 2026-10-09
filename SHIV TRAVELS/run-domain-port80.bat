@echo off
title SHIV TRAVELS - Running on Custom Domain http://shivtravels.com
echo ====================================================================
echo      SHIV TRAVELS - ONLINE TRAVEL BOOKING PLATFORM
echo      Custom Domain: http://shivtravels.com (Standard Port 80)
echo ====================================================================
echo.

if not exist bin mkdir bin

echo [*] Compiling Java sources...
javac -encoding UTF-8 -cp "lib/*" -d bin src/com/travelbooking/*.java src/com/travelbooking/models/*.java src/com/travelbooking/storage/*.java src/com/travelbooking/handlers/*.java src/com/travelbooking/utils/*.java src/com/travelbooking/database/*.java

if %ERRORLEVEL% NEQ 0 (
    echo [!] Compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [+] Compilation successful!
echo [*] Starting SHIV TRAVELS on Standard Port 80...
echo [*] Opening default web browser at http://shivtravels.com ...
start http://shivtravels.com

java -cp "bin;lib/*" com.travelbooking.Main 80
pause
