# GitHub Secrets Generator
# Run this script to generate the secrets you need for GitHub Actions deployment

Write-Host "🔐 GitHub Secrets Generator for Namecheap Deployment" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Laravel App Key
Write-Host "1️⃣ Generating LARAVEL_APP_KEY..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\portal\backend"
try {
    $appKey = php artisan key:generate --show 2>$null
    if ($appKey) {
        Write-Host "   LARAVEL_APP_KEY=" -NoNewline
        Write-Host $appKey -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Could not generate APP_KEY. Run manually:" -ForegroundColor Red
        Write-Host "   cd portal/backend && php artisan key:generate --show" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Error generating APP_KEY: $_" -ForegroundColor Red
}
Pop-Location
Write-Host ""

# JWT Secret
Write-Host "2️⃣ Generating JWT_SECRET..." -ForegroundColor Yellow
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "   JWT_SECRET=" -NoNewline
Write-Host $jwtSecret -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=" * 60
Write-Host "📋 Copy these secrets to GitHub:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions" -ForegroundColor Gray
Write-Host "Click 'New repository secret' and add each of these:" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔑 Laravel Configuration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
if ($appKey) {
    Write-Host "LARAVEL_APP_KEY = " -NoNewline; Write-Host $appKey -ForegroundColor Green
}
Write-Host "JWT_SECRET = " -NoNewline; Write-Host $jwtSecret -ForegroundColor Green
Write-Host "APP_URL = " -NoNewline; Write-Host "https://yourdomain.com/karting" -ForegroundColor Cyan
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🌐 FTP Configuration (Required)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "FTP_SERVER = " -NoNewline; Write-Host "ftp.yourdomain.com" -ForegroundColor Cyan
Write-Host "FTP_USERNAME = " -NoNewline; Write-Host "your_cpanel_username" -ForegroundColor Cyan
Write-Host "FTP_PASSWORD = " -NoNewline; Write-Host "your_cpanel_password" -ForegroundColor Cyan
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔐 SSH Configuration (Optional but Recommended)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "SSH_HOST = " -NoNewline; Write-Host "server123.web-hosting.com" -ForegroundColor Cyan
Write-Host "SSH_USERNAME = " -NoNewline; Write-Host "your_cpanel_username" -ForegroundColor Cyan
Write-Host "SSH_PASSWORD = " -NoNewline; Write-Host "your_cpanel_password" -ForegroundColor Cyan
Write-Host "SSH_PORT = " -NoNewline; Write-Host "22 or 21098" -ForegroundColor Cyan
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🗄️ Database Configuration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "DB_HOST = " -NoNewline; Write-Host "localhost" -ForegroundColor Cyan
Write-Host "DB_PORT = " -NoNewline; Write-Host "3306" -ForegroundColor Cyan
Write-Host "DB_DATABASE = " -NoNewline; Write-Host "your_database_name" -ForegroundColor Cyan
Write-Host "DB_USERNAME = " -NoNewline; Write-Host "your_database_user" -ForegroundColor Cyan
Write-Host "DB_PASSWORD = " -NoNewline; Write-Host "your_database_password" -ForegroundColor Cyan
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ Next Steps:" -ForegroundColor Green
Write-Host "1. Add all these secrets to GitHub" -ForegroundColor White
Write-Host "2. Update .env.production with your domain" -ForegroundColor White
Write-Host "3. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "4. Watch GitHub Actions deploy automatically" -ForegroundColor White
Write-Host ""
Write-Host "📚 Full guide: DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host ""
