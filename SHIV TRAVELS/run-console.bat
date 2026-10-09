@echo off
title SHIV TRAVELS - Console Mode (B.Tech OOP Viva Demo)
echo ====================================================================
echo     SHIV TRAVELS CONSOLE MODE - B.Tech 3rd Semester Java Demo       
echo ====================================================================
echo.

if not exist bin mkdir bin

echo [*] Compiling Java classes with javac...
javac -encoding UTF-8 -d bin src/com/travelbooking/*.java src/com/travelbooking/models/*.java src/com/travelbooking/storage/*.java src/com/travelbooking/handlers/*.java src/com/travelbooking/utils/*.java

if %ERRORLEVEL% NEQ 0 (
    echo [!] Compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [+] Compilation successful! Starting Console App...
echo.
java -cp bin com.travelbooking.ConsoleApp
pause
