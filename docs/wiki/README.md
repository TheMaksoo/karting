# Wiki Documentation

This directory contains the documentation for the Karting Dashboard project that is automatically synchronized to the [GitHub Wiki](https://github.com/TheMaksoo/karting/wiki).

## 📚 How It Works

The wiki files in this directory are **automatically synced** to the GitHub Wiki through a GitHub Actions workflow.

### Automatic Sync Process

1. **When**: On every push to `main` branch that modifies files in `docs/wiki/`
2. **What**: All files from `docs/wiki/` are copied to the GitHub Wiki repository
3. **How**: The `.github/workflows/wiki-sync.yml` workflow handles synchronization

### Manual Sync

You can manually trigger the wiki sync:
1. Go to [Actions](https://github.com/TheMaksoo/karting/actions)
2. Select "Sync Wiki" workflow
3. Click "Run workflow"

## 📝 Editing Wiki Pages

### Option 1: Edit in Repository (Recommended)

1. Edit markdown files in `docs/wiki/` directory
2. Commit and push to `main` branch
3. Wiki is automatically synced via GitHub Actions

### Option 2: Edit in GitHub Wiki UI

⚠️ **Warning**: Direct edits in GitHub Wiki will be **overwritten** on next sync from repository.

Always edit files in the `docs/wiki/` directory to ensure changes persist.

## 📄 File Structure

```
docs/wiki/
├── Home.md                    # Wiki home page
├── Getting-Started.md         # Installation and setup
├── Architecture.md            # System design
├── Frontend-Guide.md          # Vue 3 development
├── Backend-Guide.md           # Laravel development
├── Database-Schema.md         # Database documentation
├── API-Reference.md           # API endpoints
├── Development-Workflow.md    # Testing and CI/CD
├── Deployment-Guide.md        # Production deployment
├── Contributing.md            # Contribution guidelines
├── Security.md                # Security best practices
├── Troubleshooting.md         # Common issues
└── Features-Roadmap.md        # Features and roadmap
```

## 🔍 Why This Approach?

### Benefits

✅ **Version Control**: Wiki content is version controlled with the codebase  
✅ **Pull Requests**: Wiki changes can be reviewed via PRs  
✅ **Offline Access**: Documentation available without internet  
✅ **IDE Integration**: Edit with your favorite editor  
✅ **Search**: Full-text search in repository  
✅ **Backup**: Wiki backed up with repository  

### Trade-offs

⚠️ Cannot edit wiki directly through GitHub Wiki UI (changes will be overwritten)  
⚠️ Requires push access to repository to update wiki  

## 🚀 First-Time Setup

The wiki sync workflow will automatically create the wiki repository on first run. If the wiki doesn't exist:

1. Enable wiki in repository settings (Settings → Features → Wikis)
2. Push a change to `docs/wiki/` directory
3. The workflow will create and populate the wiki

## 📖 Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - How to contribute to the project
- [README.md](../../README.md) - Project overview and quick start
- [PROJECT_OVERVIEW.md](../../PROJECT_OVERVIEW.md) - Comprehensive project documentation

## 🤝 Contributing to Documentation

1. Fork the repository
2. Create a feature branch
3. Edit files in `docs/wiki/`
4. Test locally (preview markdown)
5. Submit a pull request
6. After merge, wiki is automatically updated

---

*For more information, see the [Wiki Sync Workflow](../../.github/workflows/wiki-sync.yml)*
