# First-time GitHub Setup Script (PowerShell)
# This script helps you push your code to GitHub for the first time

Write-Host "🚀 GitHub Setup for Karting Portal" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git already initialized" -ForegroundColor Green
}

# Get GitHub username and repo name
Write-Host ""
$GITHUB_USER = Read-Host "Enter your GitHub username"
$REPO_NAME = Read-Host "Enter repository name (default: karting-portal)"
if ([string]::IsNullOrWhiteSpace($REPO_NAME)) {
    $REPO_NAME = "karting-portal"
}

# Add remote
Write-Host ""
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
Write-Host "✅ Remote added: https://github.com/$GITHUB_USER/$REPO_NAME.git" -ForegroundColor Green

# Stage all files
Write-Host ""
Write-Host "📝 Staging files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files staged" -ForegroundColor Green

# Commit
Write-Host ""
$COMMIT_MSG = Read-Host "Enter commit message (press Enter for default)"
if ([string]::IsNullOrWhiteSpace($COMMIT_MSG)) {
    $COMMIT_MSG = "Initial commit - Karting Portal with auto-deployment"
}
git commit -m $COMMIT_MSG
Write-Host "✅ Commit created" -ForegroundColor Green

# Set branch to main
Write-Host ""
Write-Host "🌿 Setting branch to main..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Branch set to main" -ForegroundColor Green

# Push
Write-Host ""
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "You may be prompted for your GitHub credentials." -ForegroundColor Gray
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Code pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "=" * 50 -ForegroundColor DarkGray
    Write-Host "🎯 PLUG & PLAY DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "⚡ ONLY 2 STEPS LEFT:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1️⃣  Add 2 secrets to GitHub (2 minutes):" -ForegroundColor Yellow
    Write-Host "   https://github.com/$GITHUB_USER/$REPO_NAME/settings/secrets/actions" -ForegroundColor White
    Write-Host ""
    Write-Host "   Click 'New repository secret' and add:" -ForegroundColor Gray
    Write-Host "   • FTP_PASSWORD   = Your cPanel password" -ForegroundColor White
    Write-Host "   • DB_PASSWORD    = Your MySQL password" -ForegroundColor White
    Write-Host ""
    Write-Host "   Everything else auto-generates! ✨" -ForegroundColor Green
    Write-Host ""
    Write-Host "2️⃣  Deploy! (1 minute):" -ForegroundColor Yellow
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 That's it! Live in ~5 minutes." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=" * 50 -ForegroundColor DarkGray
    Write-Host "📚 Quick guide: EASY_DEPLOY.md" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "• Repository doesn't exist on GitHub - create it first" -ForegroundColor White
    Write-Host "• Authentication failed - check your credentials" -ForegroundColor White
    Write-Host "• Repository URL wrong - verify username and repo name" -ForegroundColor White
    Write-Host ""
    Write-Host "Create repository:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: $REPO_NAME" -ForegroundColor White
    Write-Host "3. Visibility: Public" -ForegroundColor White
    Write-Host "4. Don't initialize with README" -ForegroundColor White
    Write-Host "5. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again or manually push:" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor White
    Write-Host ""
}
