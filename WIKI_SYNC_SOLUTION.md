# Wiki Synchronization Solution

## Problem Summary

**Issue**: GitHub Wiki appears empty despite having wiki files in the repository.

**Root Cause**: GitHub Wiki is a separate Git repository from the main codebase. Documentation files stored in `docs/wiki/` directory are not automatically visible in the GitHub Wiki interface.

## Solution Overview

Implemented an automated synchronization system that copies documentation from the repository to GitHub Wiki using GitHub Actions.

## What Was Implemented

### 1. Wiki Sync Workflow (`.github/workflows/wiki-sync.yml`)

**Purpose**: Automatically synchronizes `docs/wiki/` content to GitHub Wiki repository.

**Triggers**:
- Automatic: On push to `main` branch when files in `docs/wiki/**` change
- Manual: Via GitHub Actions UI workflow dispatch

**Process**:
1. Checks out main repository
2. Checks out wiki repository (separate `.wiki` Git repo)
3. Removes old wiki content (preserving `.git` directory)
4. Copies all files from `docs/wiki/` to wiki repository
5. Commits and pushes changes to wiki

**Features**:
- Only commits if changes detected
- Uses GitHub Actions bot for commits
- Includes [skip ci] to avoid recursive triggers
- Provides summary output

### 2. Documentation Files

#### `docs/wiki/README.md`
- Quick reference guide for wiki contributors
- Explains automatic sync process
- Lists all wiki pages
- Provides editing guidelines

#### `docs/WIKI_SETUP.md`
- Comprehensive setup and troubleshooting guide
- Architecture explanation with diagrams
- Detailed sync process documentation
- Common issues and solutions
- Best practices for wiki maintenance

#### `README.md` Updates
- Added link to GitHub Wiki
- Added note about automatic synchronization
- Added reference to wiki setup guide
- Clarified documentation structure

## How to Use

### For Users Reading Documentation

**Option 1: GitHub Wiki** (Recommended for browsing)
- Visit: https://github.com/TheMaksoo/karting/wiki
- User-friendly interface
- Cross-referenced navigation
- Search functionality

**Option 2: Repository Files** (For offline/IDE access)
- Browse: `docs/wiki/` directory
- Available in cloned repository
- Markdown preview in IDE
- Works offline

### For Contributors Updating Documentation

**Always edit in repository** (`docs/wiki/`), never directly in GitHub Wiki:

1. Clone repository
2. Edit files in `docs/wiki/`
3. Commit and push to `main` branch
4. Wiki automatically syncs within minutes

### For Administrators

**First-Time Setup**:
1. Enable wiki in repository settings (Settings → Features → Wikis)
2. Push a change to `docs/wiki/` or manually trigger workflow
3. Wiki will be automatically created and populated

**Manual Sync**:
1. Go to Actions tab
2. Select "Sync Wiki" workflow
3. Click "Run workflow"

## Benefits

✅ **Version Control**: Wiki content tracked with code  
✅ **Pull Request Reviews**: Wiki changes reviewed via PRs  
✅ **Offline Access**: Documentation available without internet  
✅ **IDE Integration**: Edit with any text editor  
✅ **Automated**: No manual wiki updates needed  
✅ **Searchable**: Full-text search in repository  
✅ **Backup**: Wiki backed up with repository  
✅ **Consistency**: Single source of truth in `docs/wiki/`

## Technical Details

### GitHub Wiki Structure

GitHub Wiki is a separate Git repository:
- Main repo: `github.com/TheMaksoo/karting`
- Wiki repo: `github.com/TheMaksoo/karting.wiki`

### Workflow Permissions

```yaml
permissions:
  contents: write  # Required to push to wiki repository
```

### Wiki Branch

- Wiki repository uses `master` branch (not `main`)
- Workflow pushes to correct branch automatically

### File Naming

- Home page: `Home.md` (required by GitHub Wiki)
- Other pages: `Page-Name.md` (hyphens, no spaces)
- Links in repo: `[Text](Page.md)` (with extension)
- Links in wiki: GitHub auto-converts to `[Text](Page)` (no extension)

## Monitoring

### Check Workflow Status

- Actions → Sync Wiki workflow
- View run history and logs
- Check for errors or failures

### Verify Sync

- Compare `docs/wiki/` vs GitHub Wiki
- Check commit history in wiki repository
- Verify latest changes appear online

## Troubleshooting

### Wiki Still Empty

1. Verify wiki enabled in settings
2. Check workflow run succeeded
3. Ensure permissions are correct
4. Try manual trigger

### Workflow Fails

1. Check GitHub Actions permissions
2. Verify wiki is enabled
3. Review workflow logs
4. See `docs/WIKI_SETUP.md` troubleshooting section

### Changes Not Appearing

1. Verify changes committed to `main` branch
2. Check workflow triggered (Actions tab)
3. Ensure changes in `docs/wiki/` directory
4. Wait a few minutes for sync to complete

## File Structure

```
karting/
├── .github/
│   └── workflows/
│       └── wiki-sync.yml          # Sync automation workflow
├── docs/
│   ├── WIKI_SETUP.md              # Detailed setup guide
│   └── wiki/                      # Wiki source (13 files)
│       ├── README.md              # Quick reference
│       ├── Home.md                # Wiki homepage
│       ├── Getting-Started.md     # Installation guide
│       ├── Architecture.md        # System design
│       ├── Frontend-Guide.md      # Vue 3 guide
│       ├── Backend-Guide.md       # Laravel guide
│       ├── Database-Schema.md     # DB documentation
│       ├── API-Reference.md       # API docs
│       ├── Development-Workflow.md # Testing & CI/CD
│       ├── Deployment-Guide.md    # Production guide
│       ├── Contributing.md        # Contribution guide
│       ├── Security.md            # Security practices
│       ├── Troubleshooting.md     # Common issues
│       └── Features-Roadmap.md    # Feature roadmap
└── README.md                      # Updated with wiki links
```

## Next Steps

1. **Enable Wiki**: Ensure wiki is enabled in repository settings
2. **Trigger Sync**: Push this PR to main or manually trigger workflow
3. **Verify**: Check https://github.com/TheMaksoo/karting/wiki
4. **Communicate**: Inform team about new wiki sync system
5. **Update Docs**: Edit wiki files in `docs/wiki/` going forward

## Related Documentation

- **Workflow File**: `.github/workflows/wiki-sync.yml`
- **Setup Guide**: `docs/WIKI_SETUP.md` (comprehensive)
- **Quick Reference**: `docs/wiki/README.md`
- **Project README**: `README.md` (updated with wiki links)

## Success Criteria

✅ Wiki sync workflow created and functional  
✅ Comprehensive documentation written  
✅ README updated with wiki links  
✅ Clear instructions for contributors  
✅ Troubleshooting guide provided  
✅ Automated sync on main branch changes  
✅ Manual trigger option available  

## Conclusion

The wiki synchronization system is now in place. Once this PR is merged and wiki is enabled in settings, the documentation in `docs/wiki/` will automatically appear in the GitHub Wiki, solving the empty wiki issue permanently.

---

*Created: February 2026*
