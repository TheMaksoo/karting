# 📋 GitHub Repository Rulesets

This directory contains GitHub repository ruleset configurations that can be imported to protect branches and tags.

## 📁 Available Rulesets

| Ruleset File | Purpose | Target |
|--------------|---------|--------|
| `develop-branch-protection.json` | Protects the `develop` branch with PR requirements, status checks, and linear history | Branch |
| `release-tags-protection.json` | Protects release tags (v*) from deletion and updates | Tag |
| `feature-branch-standards.json` | Enforces linting standards on feature/bugfix/hotfix branches | Branch |

## 🔧 How to Import Rulesets

### Option 1: Via GitHub Web UI

1. Go to **Repository Settings** → **Rules** → **Rulesets**
2. Click **New ruleset** → **Import a ruleset**
3. Upload the desired JSON file
4. Review and save

### Option 2: Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Import a ruleset
gh api repos/{owner}/{repo}/rulesets \
  --method POST \
  --input .github/rulesets/develop-branch-protection.json

# List existing rulesets
gh api repos/{owner}/{repo}/rulesets
```

### Option 3: Via GitHub API (curl)

```bash
# Set your GitHub token
export GITHUB_TOKEN="your_personal_access_token"
export OWNER="your-username-or-org"
export REPO="your-repo"

# Import develop branch protection ruleset
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$OWNER/$REPO/rulesets" \
  -d @.github/rulesets/develop-branch-protection.json

# Import release tags protection ruleset
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$OWNER/$REPO/rulesets" \
  -d @.github/rulesets/release-tags-protection.json
```

## 📋 Ruleset Details

### Develop Branch Protection

**Target:** `refs/heads/develop`

**Rules Applied:**
- ✅ Require pull request before merging
  - 1 approval required
  - Dismiss stale reviews on push
  - Require conversation resolution
- ✅ Require status checks to pass
  - 🐘 PHP Lint
  - 🔷 TypeScript Check
  - 🟨 ESLint Check
  - 🧪 Backend Tests
  - 🧪 Frontend Tests
  - 🔨 Build Frontend
  - 📊 SonarCloud
  - ✅ Quality Gate
- ✅ Require linear history (squash/rebase only)
- ❌ Block force pushes
- ❌ Block branch deletion

### Release Tags Protection

**Target:** `refs/tags/v*`

**Rules Applied:**
- ❌ Block tag deletion
- ❌ Block tag updates
- ✅ Only administrators can create release tags

### Feature Branch Standards

**Target:** `refs/heads/feature/*`, `refs/heads/bugfix/*`, `refs/heads/hotfix/*`

**Rules Applied:**
- ❌ Block force pushes
- ✅ Require linting status checks to pass

## 🔄 Updating Rulesets

1. Modify the JSON file in this directory
2. Commit and push changes
3. Re-import the ruleset via the GitHub UI or API (existing rulesets with the same name will need to be deleted or updated)

## 📚 References

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub API - Rulesets](https://docs.github.com/en/rest/repos/rules)
- [Branch Protection Documentation](../../../BRANCH_PROTECTION.md)
