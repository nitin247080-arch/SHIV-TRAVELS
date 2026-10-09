@echo off
title SHIV TRAVELS - Online Travel Booking Platform (Java 17)
echo ====================================================================
echo      SHIV TRAVELS - ONLINE TRAVEL BOOKING PLATFORM (B.Tech Sem 3)       
echo ====================================================================
echo.

if not exist bin mkdir bin

echo [*] Compiling Java classes with javac...
javac -encoding UTF-8 -cp "lib/*" -d bin src/com/travelbooking/*.java src/com/travelbooking/models/*.java src/com/travelbooking/storage/*.java src/com/travelbooking/handlers/*.java src/com/travelbooking/utils/*.java src/com/travelbooking/database/*.java

if %ERRORLEVEL% NEQ 0 (
    echo [!] Compilation failed! Please check if JDK 17 is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo [+] Compilation successful!
echo [*] Starting SHIV TRAVELS Server on http://localhost:8181 ...
echo [*] Opening default web browser...
start http://localhost:8181

java -cp "bin;lib/*" com.travelbooking.Main 8181
pause
