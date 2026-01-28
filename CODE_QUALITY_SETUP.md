# 📊 Code Quality & Coverage Setup Guide

This project uses **SonarCloud** for code quality analysis and **Codecov** for code coverage visualization. Both are free for open-source projects and integrate automatically with GitHub.

## 🚀 Quick Setup (5 minutes)

### Step 1: Set Up Codecov

1. Go to [codecov.io](https://codecov.io) and sign in with GitHub
2. Click **"Add Repository"** and select your karting repo
3. Copy the **CODECOV_TOKEN** from the repository settings
4. Add it to GitHub Secrets:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click **"New repository secret"**
   - Name: `CODECOV_TOKEN`
   - Value: (paste the token)

### Step 2: Set Up SonarCloud

1. Go to [sonarcloud.io](https://sonarcloud.io) and sign in with GitHub
2. Click **"+"** → **"Analyze new project"**
3. Select your karting repository
4. Choose **"With GitHub Actions"** as the analysis method
5. Copy the **SONAR_TOKEN** from the setup page
6. Add it to GitHub Secrets:
   - Name: `SONAR_TOKEN`
   - Value: (paste the token)

### Step 3: Update Configuration

Edit `sonar-project.properties` and replace `YOUR_GITHUB_USERNAME`:

```properties
sonar.organization=your-actual-username
sonar.projectKey=your-actual-username_karting-dashboard
```

Edit `README.md` and replace `YOUR_GITHUB_USERNAME` in all badge URLs.

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Add SonarCloud and Codecov integration"
git push
```

## ✅ What You Get

### Codecov Features
- 📈 **Coverage reports** on every PR
- 📊 **Coverage trends** over time
- 🔍 **Line-by-line coverage** visualization
- 💬 **PR comments** showing coverage changes
- 🚦 **Status checks** that block PRs with low coverage

### SonarCloud Features
- 🐛 **Bug detection** (null pointers, resource leaks, etc.)
- 🔒 **Security vulnerabilities** (SQL injection, XSS, etc.)
- 🧹 **Code smells** (duplicates, complexity, naming)
- 📏 **Maintainability rating** (A-F scale)
- 📊 **Quality Gate** - pass/fail status on PRs
- 📈 **Technical debt** tracking

## 🎯 Quality Gates

The default SonarCloud quality gate requires:
- ✅ No new bugs
- ✅ No new vulnerabilities  
- ✅ Code coverage ≥ 80% on new code
- ✅ Duplicated lines < 3%
- ✅ Maintainability rating ≥ A

## 📁 Files Created

| File | Purpose |
|------|---------|
| `codecov.yml` | Codecov configuration (flags, thresholds) |
| `sonar-project.properties` | SonarCloud configuration |
| `.github/workflows/ci.yml` | CI pipeline with coverage uploads |

## 🔧 GitHub Secrets Required

| Secret | Source | Purpose |
|--------|--------|---------|
| `CODECOV_TOKEN` | codecov.io | Upload coverage reports |
| `SONAR_TOKEN` | sonarcloud.io | Run SonarCloud analysis |

## 📊 Viewing Results

### Codecov
- **Dashboard**: `https://codecov.io/gh/YOUR_USERNAME/karting`
- **PR Comments**: Automatic on every pull request
- **Badge**: Shows current coverage percentage

### SonarCloud
- **Dashboard**: `https://sonarcloud.io/project/overview?id=YOUR_USERNAME_karting-dashboard`
- **Issues**: Click "Issues" tab to see all code quality issues
- **PR Decoration**: Automatic comments on pull requests

## 🔍 Local Analysis

### Run Coverage Locally

```bash
# Backend (PHP)
cd portal/backend
composer test:coverage

# Frontend (TypeScript)
cd portal/frontend
npm run test:coverage

# Python
cd data-importer/scripts
pytest --cov=. --cov-report=html
```

### Run SonarScanner Locally (Optional)

```bash
# Install SonarScanner
# macOS: brew install sonar-scanner
# Windows: choco install sonarscanner

# Run analysis
sonar-scanner \
  -Dsonar.login=YOUR_SONAR_TOKEN
```

## 🚨 Troubleshooting

### Codecov not showing coverage
1. Check that tests are actually running in CI
2. Verify coverage files are being generated
3. Check the Codecov dashboard for upload errors

### SonarCloud analysis failing
1. Verify SONAR_TOKEN is set correctly
2. Check that organization name matches your GitHub username
3. Review the CI logs for specific errors

### Coverage not appearing in SonarCloud
1. Ensure coverage files are downloaded before SonarCloud scan
2. Check file paths in `sonar-project.properties` match actual locations
3. Verify coverage files are in correct format (clover.xml, lcov.info)

## 📚 Resources

- [Codecov Documentation](https://docs.codecov.com/)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
