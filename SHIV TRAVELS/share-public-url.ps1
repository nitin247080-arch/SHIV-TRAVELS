# =====================================================================
# SHIV TRAVELS - Share Live Public URL for Mobile & Teachers
# =====================================================================

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "    SHIV TRAVELS - LIVE PUBLIC ACCESS & MOBILE SHARING              " -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Find Local Network IP (for teachers on the same Wi-Fi / Hotspot)
$wifiIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
           Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | 
           Select-Object -ExpandProperty IPAddress

Write-Host "[*] LOCAL WI-FI / HOTSPOT ACCESS (Same College Network):" -ForegroundColor Green
foreach ($ip in $wifiIps) {
    Write-Host "    -> http://$($ip):8181" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[*] GENERATING INSTANT GLOBAL PUBLIC HTTPS URL (4G/5G & Any Network)..." -ForegroundColor Cyan
Write-Host "    Starting Localtunnel proxy to port 8181..." -ForegroundColor Gray
Write-Host "    (Teachers can open this link from ANY phone or computer worldwide!)" -ForegroundColor Gray
Write-Host "--------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Launch localtunnel with custom subdomain fallback
npx -y localtunnel --port 8181 --subdomain "shivtravels"
