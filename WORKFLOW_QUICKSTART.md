# 🚀 Quick Start: Branch Protection Workflow

## 🎯 TL;DR

**All changes go through PRs to `develop` → Auto-deploys to production**

## ⚡ Quick Commands

### Start New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Create PR on GitHub → develop
```

### Start Bug Fix
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/fix-issue-123
# ... fix bug ...
git add .
git commit -m "fix: resolve issue #123"
git push origin bugfix/fix-issue-123
# Create PR on GitHub → develop
```

### Emergency Hotfix
```bash
git checkout develop
git pull origin develop
git checkout -b hotfix/critical-fix
# ... apply fix ...
git add .
git commit -m "fix: critical security patch"
git push origin hotfix/critical-fix
# Create PR → Mark urgent → Request review → Merge ASAP
```

## ✅ PR Checklist

Before creating PR:
- [ ] Run `cd portal/backend && vendor/bin/pint` (PHP)
- [ ] Run `cd portal/frontend && npm run lint` (TypeScript/ESLint)
- [ ] Run `cd portal/backend && composer test` (Backend tests)
- [ ] Run `cd portal/frontend && npm test` (Frontend tests)
- [ ] Update CHANGELOG.md
- [ ] Update documentation if needed

## 🔄 Workflow Steps

```
1. Create branch from develop
        ↓
2. Make changes & commit
        ↓
3. Push to GitHub
        ↓
4. Create PR → develop
        ↓
5. CI/CD runs (lint, test, build)
        ↓
6. Code review & approval
        ↓
7. Merge (squash recommended)
        ↓
8. 🚀 Auto-deploy to production
        ↓
9. 🎉 Closes linked issues
```

## 🚫 Common Mistakes

### ❌ Don't Do This
```bash
# Pushing directly to develop (BLOCKED)
git checkout develop
git commit -m "fix"
git push origin develop  # ❌ FAILS
```

### ✅ Do This Instead
```bash
# Always use feature branches
git checkout -b hotfix/quick-fix
git commit -m "fix"
git push origin hotfix/quick-fix
# Create PR → develop
```

## 📊 CI/CD Status

Your PR must pass:
- ✅ PHP Lint (Pint)
- ✅ TypeScript Check
- ✅ ESLint
- ✅ Python Lint
- ✅ Backend Tests (554 tests)
- ✅ Frontend Tests (407 tests)
- ✅ Python Tests (29 tests)
- ✅ SonarCloud Quality Gate
- ✅ Frontend Build
- ✅ 1 Approval

## 🔧 Local Testing

### Backend
```bash
cd portal/backend
composer install
vendor/bin/pint        # Fix style
composer test          # Run tests
php artisan serve      # Test locally
```

### Frontend
```bash
cd portal/frontend
npm install
npm run lint           # Lint
npm run type-check     # TypeScript
npm test              # Tests
npm run dev           # Dev server
```

## 📱 Quick Links

- **Create PR**: [New Pull Request](../../compare)
- **View PRs**: [Pull Requests](../../pulls)
- **Branch Protection**: [Full Guide](BRANCH_PROTECTION.md)
- **Contributing**: [Contributing Guide](CONTRIBUTING.md)

## 🆘 Need Help?

1. Check [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) for detailed guide
2. Open a [discussion](../../discussions)
3. Ask in PR review comments

---

**Remember**: `develop` is protected. Always use PRs! 🛡️
