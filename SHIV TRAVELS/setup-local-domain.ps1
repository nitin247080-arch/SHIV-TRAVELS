# =====================================================================
# SHIV TRAVELS - Local Custom Domain Setup Script (PowerShell)
# Binds 'shivtravels.com' and 'www.shivtravels.com' to 127.0.0.1
# =====================================================================

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[*] Requesting Administrator Privileges to configure Windows hosts file..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$domainEntry = "127.0.0.1    shivtravels.com www.shivtravels.com"

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "    SHIV TRAVELS - CUSTOM DOMAIN CONFIGURATION (shivtravels.com)    " -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$content = Get-Content $hostsPath -Raw
if ($content -match "shivtravels\.com") {
    Write-Host "[+] Domain 'shivtravels.com' is already configured in Windows hosts file!" -ForegroundColor Green
} else {
    Write-Host "[*] Adding 'shivtravels.com' to $hostsPath..." -ForegroundColor Cyan
    Add-Content -Path $hostsPath -Value "`n# SHIV TRAVELS Custom Domain Mapping`n$domainEntry`n"
    Write-Host "[+] Successfully mapped 'shivtravels.com' and 'www.shivtravels.com' to 127.0.0.1!" -ForegroundColor Green
}

# Flush DNS Cache
Write-Host "[*] Flushing Windows DNS Cache..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null
Write-Host "[+] DNS Cache flushed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "You can now access SHIV TRAVELS at:" -ForegroundColor White
Write-Host "  -> http://shivtravels.com:8181" -ForegroundColor Cyan
Write-Host "  -> http://www.shivtravels.com:8181" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
