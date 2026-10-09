# SHIV TRAVELS - PowerShell Launch Script
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "    SHIV TRAVELS - ONLINE TRAVEL BOOKING PLATFORM (Java 17)         " -ForegroundColor Yellow
Write-Host "     B.Tech Computer Science & Engineering - Semester 3            " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan

if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

Write-Host "[*] Compiling Java classes..." -ForegroundColor Cyan
javac -encoding UTF-8 -cp "lib/*" -d bin (Get-ChildItem -Recurse -Filter *.java src | Select-Object -ExpandProperty FullName)

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Compilation failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[+] Compilation successful!" -ForegroundColor Green
Write-Host "[*] Starting server on http://localhost:8181 ..." -ForegroundColor Cyan

Start-Process "http://localhost:8181"
java -cp "bin;lib/*" com.travelbooking.Main 8181
