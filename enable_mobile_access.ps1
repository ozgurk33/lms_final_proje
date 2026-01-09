# LMS Mobile Access - Firewall Configuration Script
Write-Host "LMS Mobil Erişim Ayarları Yapılandırılıyor..." -ForegroundColor Cyan

# Yönetici izni kontrolü
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "UYARI: Bu script yönetici hakları gerektirir!" -ForegroundColor Red
    Write-Host "Lütfen sağ tıklayıp 'PowerShell ile Yönetici Olarak Çalıştır' seçeneğini kullanın." -ForegroundColor Yellow
    Read-Host "Devam etmek için Enter'a basın..."
    exit
}

try {
    # Node.js Backend Port
    New-NetFirewallRule -DisplayName "LMS Backend (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Private, Public -ErrorAction SilentlyContinue
    Write-Host "Port 3000 (Backend) açıldı." -ForegroundColor Green

    # Expo Metro Bundler Port
    New-NetFirewallRule -DisplayName "LMS Expo Metro (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -Profile Private, Public -ErrorAction SilentlyContinue
    Write-Host "Port 8081 (Metro) açıldı." -ForegroundColor Green

    # Expo Metro Bundler Alt Port (Tunnel/Alt)
    New-NetFirewallRule -DisplayName "LMS Expo Metro Alt (8084)" -Direction Inbound -LocalPort 8084 -Protocol TCP -Action Allow -Profile Private, Public -ErrorAction SilentlyContinue
    Write-Host "Port 8084 (Metro Alt) açıldı." -ForegroundColor Green

    # Expo Go Ports
    New-NetFirewallRule -DisplayName "LMS Expo Go (19000-19006)" -Direction Inbound -LocalPort 19000-19006 -Protocol TCP -Action Allow -Profile Private, Public -ErrorAction SilentlyContinue
    Write-Host "Port 19000-19006 (Expo Go) açıldı." -ForegroundColor Green
    
    # UDP Port for Service Discovery
    New-NetFirewallRule -DisplayName "LMS Expo Go UDP (19000)" -Direction Inbound -LocalPort 19000 -Protocol UDP -Action Allow -Profile Private, Public -ErrorAction SilentlyContinue
    Write-Host "Port 19000 (UDP) açıldı." -ForegroundColor Green

    Write-Host ""
    Write-Host "BAŞARILI! Tüm gerekli izinler verildi." -ForegroundColor Green
    Write-Host "Şimdi Expo Go uygulamasından QR kodu tekrar tarayabilirsiniz." -ForegroundColor Cyan
}
catch {
    Write-Host "HATA: İşlem sırasında bir sorun oluştu." -ForegroundColor Red
    Write-Error $_
}

Read-Host "Çıkmak için Enter'a basın..."
