# 🛡️ Branch Protection & Workflow Strategy

## 📋 Overview

This project uses **strict branch protection** with a PR-based workflow to ensure code quality and prevent accidental deployments.

## 🌳 Branch Structure

```
develop (protected) ──► production (auto-deploy)
   ▲
   │
   └── feature branches (PRs required)
```

### Branch Roles

| Branch | Purpose | Protection | Deployment |
|--------|---------|------------|------------|
| `develop` | Main development branch | ✅ Protected | ✅ Auto-deploy to production |
| `feature/*` | Feature development | ❌ None | ❌ No deployment |
| `bugfix/*` | Bug fixes | ❌ None | ❌ No deployment |
| `hotfix/*` | Urgent production fixes | ❌ None | ❌ No deployment |

## 🔒 Branch Protection Rules

### For `develop` Branch

**Enable these settings in GitHub:**

1. **✅ Require a pull request before merging**
   - Require approvals: **1**
   - Dismiss stale pull request approvals when new commits are pushed
   - Require review from Code Owners (optional)

2. **✅ Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - Required status checks:
     - `🐘 PHP Lint`
     - `🔷 TypeScript Check`
     - `📦 ESLint`
     - `🐍 Python Lint`
     - `🧪 Backend Tests`
     - `🎨 Frontend Tests`
     - `🐍 Python Tests`
     - `📊 SonarCloud Quality Gate`
     - `🏗️ Frontend Build`
     - `✅ Quality Gate`

3. **✅ Require conversation resolution before merging**
   - All review comments must be resolved

4. **✅ Require linear history**
   - No merge commits (use squash or rebase)

5. **✅ Include administrators**
   - Enforce all rules for administrators

6. **❌ Allow force pushes**
   - Disabled (no force pushes allowed)

7. **❌ Allow deletions**
   - Disabled (branch cannot be deleted)

## 🔄 Workflow

### 1️⃣ Create Feature Branch

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-awesome-feature

# Work on your feature
git add .
git commit -m "feat: add awesome feature"
```

### 2️⃣ Push & Create PR

```bash
# Push to GitHub
git push origin feature/my-awesome-feature

# Then create PR on GitHub targeting 'develop'
```

### 3️⃣ CI/CD Pipeline Runs

The pipeline automatically runs:
1. **🔍 Lint Stage** - PHP Pint, TypeScript, ESLint, Python
2. **🧪 Test Stage** - Backend (554), Frontend (407), Python (29)
3. **🏗️ Build Stage** - Frontend build + SonarCloud analysis
4. **✅ Quality Gate** - All checks must pass

**If linting fails:** Auto-fix workflow runs and pushes fixes

### 4️⃣ Code Review

- Request review from team members
- Address all review comments
- Resolve all conversations
- Ensure CI/CD pipeline is green ✅

### 5️⃣ Merge to Develop

Once approved and all checks pass:
```bash
# Squash and merge (recommended)
# This creates a clean history
```

### 6️⃣ Automatic Deployment

After merge to `develop`:
1. Pipeline runs again on `develop`
2. All checks pass
3. **🚀 Automatic deployment to production**
4. **🎉 Closes linked issues** (e.g., "Closes #123")

## 🚫 What's Blocked

### ❌ Direct Pushes to Develop

```bash
# This will FAIL:
git checkout develop
git commit -m "fix: quick fix"
git push origin develop
# ❌ Error: protected branch hook declined
```

**✅ Correct way:**
```bash
git checkout -b hotfix/urgent-fix
git commit -m "fix: urgent fix"
git push origin hotfix/urgent-fix
# Create PR → Review → Merge
```

### ❌ Bypassing CI/CD Checks

- Cannot merge if any check fails
- Cannot merge without approval
- Cannot merge with unresolved conversations

### ❌ Force Pushes

```bash
# This will FAIL:
git push --force origin develop
# ❌ Error: protected branch
```

## 🔧 Setting Up Branch Protection

### Via GitHub Web Interface

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Enter branch name pattern: `develop`
4. Enable all protection rules (see list above)
5. Click **Create** or **Save changes**

### Via GitHub CLI

```bash
# Requires GitHub CLI (gh)
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["🐘 PHP Lint","🔷 TypeScript Check","📦 ESLint","🐍 Python Lint","🧪 Backend Tests","🎨 Frontend Tests","🐍 Python Tests","📊 SonarCloud Quality Gate","🏗️ Frontend Build","✅ Quality Gate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## 📊 Benefits

✅ **Quality Assurance** - Every change is tested  
✅ **Code Review** - Peer review catches issues early  
✅ **Safe Deployments** - Only tested code reaches production  
✅ **Audit Trail** - Clear history of who approved what  
✅ **Rollback Safety** - Easy to revert if needed  
✅ **Team Collaboration** - Structured review process  

## 🔥 Emergency Hotfix Process

For critical production issues:

```bash
# 1. Create hotfix branch from develop
git checkout develop
git pull origin develop
git checkout -b hotfix/critical-security-fix

# 2. Apply fix
git commit -m "fix: patch critical security vulnerability"

# 3. Push and create PR
git push origin hotfix/critical-security-fix

# 4. Mark as urgent, request immediate review
# 5. Once approved and CI passes, merge immediately
# 6. Auto-deploys to production
```

**Note:** Even hotfixes go through PR process for audit trail.

## 📚 Related Documentation

- [GitHub Rulesets](.github/rulesets/README.md) - Repository ruleset configurations
- [PR Template](.github/PULL_REQUEST_TEMPLATE.md)
- [CI/CD Pipeline](.github/workflows/pipeline.yml)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## 📋 GitHub Rulesets

This repository uses **GitHub Rulesets** for modern, flexible branch and tag protection. Rulesets provide more granular control and can be version-controlled.

### Available Rulesets

| Ruleset | Purpose |
|---------|---------|
| [Develop Branch Protection](.github/rulesets/develop-branch-protection.json) | Protects the develop branch |
| [Release Tags Protection](.github/rulesets/release-tags-protection.json) | Protects release tags (v*) |
| [Feature Branch Standards](.github/rulesets/feature-branch-standards.json) | Enforces standards on feature branches |

### Importing Rulesets

See [.github/rulesets/README.md](.github/rulesets/README.md) for detailed instructions on importing these rulesets via the GitHub UI, CLI, or API.

## 🎓 Training Resources

### For New Contributors

1. Read this document
2. Review [CONTRIBUTING.md](CONTRIBUTING.md)
3. Check [PR Template](.github/PULL_REQUEST_TEMPLATE.md)
4. Make a small test PR to practice

### For Reviewers

- Check all boxes in PR checklist
- Run tests locally if needed
- Verify CI/CD pipeline is green
- Check SonarCloud quality gate
- Ensure documentation is updated

---

**Questions?** Open a [discussion](../../discussions) or contact the maintainers.
