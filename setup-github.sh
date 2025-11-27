#!/bin/bash
# First-time GitHub Setup Script
# This script helps you push your code to GitHub for the first time

echo "🚀 GitHub Setup for Karting Portal"
echo "===================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Get GitHub username and repo name
echo ""
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter repository name (default: karting-portal): " REPO_NAME
REPO_NAME=${REPO_NAME:-karting-portal}

# Add remote
echo ""
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
echo "✅ Remote added: https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Create .gitignore if needed
if [ ! -f ".gitignore" ]; then
    echo "⚠️  No .gitignore found. Creating one..."
    cat > .gitignore << 'EOF'
# See existing .gitignore in project
EOF
fi

# Stage all files
echo ""
echo "📝 Staging files..."
git add .
echo "✅ Files staged"

# Commit
echo ""
read -p "Enter commit message (default: Initial commit): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-Initial commit - Karting Portal}
git commit -m "$COMMIT_MSG"
echo "✅ Commit created"

# Set branch to main
echo ""
echo "🌿 Setting branch to main..."
git branch -M main
echo "✅ Branch set to main"

# Push
echo ""
echo "⬆️  Pushing to GitHub..."
echo "You may be prompted for your GitHub credentials."
echo ""
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Code pushed to GitHub"
    echo ""
    echo "Next steps:"
    echo "1. Go to: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "2. Go to Settings → Secrets and variables → Actions"
    echo "3. Run: ./generate-secrets.ps1 (or pwsh generate-secrets.ps1)"
    echo "4. Add all the secrets from step 3 to GitHub"
    echo "5. Update portal/frontend/.env.production with your domain"
    echo "6. Push again: git push origin main"
    echo "7. Watch GitHub Actions deploy automatically!"
    echo ""
    echo "📚 Full guide: DEPLOYMENT_GUIDE.md"
else
    echo ""
    echo "❌ Push failed. Check your credentials and try again."
    echo "You can manually push with: git push -u origin main"
fi
