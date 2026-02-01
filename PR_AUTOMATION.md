# GitHub PR Automation Setup Guide

## ✅ What's Already Configured

The auto-PR workflow is now active and will automatically:
- ✅ Create PRs when you push to `feature/*`, `bugfix/*`, or `hotfix/*` branches
- ✅ Generate formatted PR titles based on branch type
- ✅ Add commit history to PR description
- ✅ Add a checklist for reviewers
- ✅ Attempt to add labels, projects, milestones, and reviewers (if configured)

## 🏷️ Step 1: Create Labels

### Option A: Using GitHub Web UI (Recommended)
1. Go to https://github.com/TheMaksoo/karting/labels
2. Click "New label" button
3. Create these labels:

**Type Labels:**
- `auto-created` (color: 0E8A16) - Automatically created by GitHub Actions
- `enhancement` (color: A2EEEF) - New feature or request
- `feature` (color: 0075CA) - New feature implementation
- `bug` (color: D73A4A) - Something isn't working
- `fix` (color: D93F0B) - Bug fix
- `hotfix` (color: B60205) - Critical fix requiring immediate attention

**Priority Labels:**
- `priority: high` (color: E11D21) - High priority
- `priority: medium` (color: FBCA04) - Medium priority
- `priority: low` (color: 0E8A16) - Low priority

**Status Labels:**
- `in progress` (color: FBCA04) - Work in progress
- `ready for review` (color: 0E8A16) - Ready for code review
- `changes requested` (color: E99695) - Changes requested by reviewer
- `approved` (color: 0E8A16) - Approved by reviewers

**Category Labels:**
- `backend` (color: 1D76DB) - Backend/Laravel changes
- `frontend` (color: 5319E7) - Frontend/Vue changes
- `database` (color: C5DEF5) - Database schema or migrations
- `testing` (color: BFD4F2) - Testing related changes
- `documentation` (color: 0075CA) - Documentation improvements
- `dependencies` (color: 0366D6) - Dependency updates

**Size Labels:**
- `size: XS` (color: C2E0C6) - Extra small PR (1-10 lines)
- `size: S` (color: 7FE096) - Small PR (11-50 lines)
- `size: M` (color: FEF2C0) - Medium PR (51-200 lines)
- `size: L` (color: FBCA04) - Large PR (201-500 lines)
- `size: XL` (color: E99695) - Extra large PR (501+ lines)

### Option B: Using GitHub CLI
If you have `gh` CLI installed, run:
```powershell
.\.github\setup-labels.ps1
```

## 📊 Step 2: Configure Repository Variables (Optional)

Go to https://github.com/TheMaksoo/karting/settings/variables/actions

Create these variables to enable additional features:

### `PROJECT_NUMBER`
- **Purpose**: Auto-add PRs to a GitHub Project
- **Value**: The project number (e.g., "1", "2", etc.)
- **How to find**: Go to your project URL - the number is in the URL after `/projects/`
- **Example**: If your project URL is `https://github.com/users/TheMaksoo/projects/3`, use `3`

### `DEFAULT_MILESTONE`
- **Purpose**: Auto-assign PRs to a milestone
- **Value**: The exact milestone name (e.g., "v1.0", "Q1 2026", "Sprint 1")
- **Note**: The milestone must already exist in your repository

### `DEFAULT_REVIEWERS`
- **Purpose**: Auto-request reviews from specific users
- **Value**: Comma-separated GitHub usernames (e.g., "user1,user2,user3")
- **Example**: "TheMaksoo,reviewer2"
- **Note**: Users must have repository access

## 🎯 Step 3: Create a Milestone (Optional)

1. Go to https://github.com/TheMaksoo/karting/milestones
2. Click "New milestone"
3. Set title (e.g., "v1.0", "Coverage Improvement")
4. Add description and due date
5. Click "Create milestone"

## 📋 Step 4: Create a Project (Optional)

1. Go to https://github.com/users/TheMaksoo/projects
2. Click "New project"
3. Choose a template or start from scratch
4. Add columns (e.g., "To Do", "In Progress", "Review", "Done")
5. Note the project number from the URL

## 🚀 How It Works

### When you push a feature branch:
```bash
git checkout -b feature/add-user-authentication
# Make changes
git commit -m "feat: add JWT authentication"
git push origin feature/add-user-authentication
```

**The workflow automatically:**
1. Creates a PR from `feature/add-user-authentication` → `develop`
2. Title: "feat: add user authentication"
3. Adds labels: `enhancement`, `feature`, `auto-created`
4. Adds to project (if configured)
5. Sets milestone (if configured)
6. Requests reviewers (if configured)

### When you push a bugfix:
```bash
git checkout -b bugfix/fix-login-error
git commit -m "fix: resolve login timeout issue"
git push origin bugfix/fix-login-error
```

**Labels added:** `bug`, `fix`, `auto-created`

### When you push a hotfix:
```bash
git checkout -b hotfix/critical-security-patch
git commit -m "hotfix: patch SQL injection vulnerability"
git push origin hotfix/critical-security-patch
```

**Labels added:** `hotfix`, `priority: high`, `auto-created`

## 📝 Manual Label Assignment

You can still manually add labels to PRs:
- **Size labels**: Add based on PR size (XS, S, M, L, XL)
- **Category labels**: Add `backend`, `frontend`, `database`, or `testing`
- **Status labels**: Update as PR progresses (`in progress` → `ready for review` → `approved`)

## 🔧 Troubleshooting

### Labels not being added
- **Cause**: Labels don't exist in the repository
- **Solution**: Create labels manually via GitHub web UI (Step 1)
- **Note**: The workflow continues even if labels fail - PR is still created

### Project not being assigned
- **Cause**: `PROJECT_NUMBER` variable not set or incorrect
- **Solution**: Check variable in repository settings, verify project number

### Reviewers not being added
- **Cause**: `DEFAULT_REVIEWERS` variable not set or users don't have access
- **Solution**: Verify usernames and ensure users have repository permissions

## 🎉 Current Status

✅ Workflow is active and will handle all future PRs automatically!

For existing branches, create PRs manually:
- [Create PR for feature/improve-test-coverage](https://github.com/TheMaksoo/karting/compare/develop...feature/improve-test-coverage?expand=1)
- [Create PR for feature/api-pagination-and-improvements](https://github.com/TheMaksoo/karting/compare/develop...feature/api-pagination-and-improvements?expand=1)
- [Create PR for feature/todo-improvements](https://github.com/TheMaksoo/karting/compare/develop...feature/todo-improvements?expand=1)
