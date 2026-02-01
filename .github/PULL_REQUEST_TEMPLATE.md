## 📝 Description
<!-- Clearly describe what this PR does and why. -->

## 🌿 Branch Strategy
<!-- This project uses a PR-based workflow with branch protection. -->
**Base Branch**: `develop` (all PRs should target this branch)  
**Protected**: Direct pushes to `develop` are blocked - all changes via PR  
**Deployment**: Merges to `develop` auto-deploy to production after passing all checks

## 🔗 Related Issues
<!-- Link to related issues (e.g., Closes #123, Fixes #456) -->
Closes #

## 🎯 Type of Change
<!-- Mark the relevant option with an 'x'. -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition or update
- [ ] 🔧 Configuration change

## 🧪 Testing
<!-- Describe the tests you ran and how to reproduce. -->

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

### Test Results
```bash
# Backend Tests
composer test
✅ All tests passing

# Frontend Tests
npm test
✅ All tests passing

# Linting
vendor/bin/pint
npm run lint
✅ No issues
```

## 📸 Screenshots
<!-- If applicable, add screenshots to demonstrate the change. -->

## ✅ Checklist
<!-- Mark completed items with an 'x'. -->

### Code Quality
- [ ] My code follows the project's coding standards
- [ ] I have run Laravel Pint (`vendor/bin/pint`)
- [ ] I have run ESLint (`npm run lint`)
- [ ] I have run type checking (`npm run type-check`)
- [ ] I have removed all console.log statements
- [ ] I have added PHPDoc/JSDoc comments where needed

### Testing
- [ ] I have added/updated tests that prove my fix/feature works
- [ ] All new and existing tests pass locally
- [ ] I have tested on multiple browsers (if frontend change)

### Documentation
- [ ] I have updated the documentation (README, SETUP, etc.)
- [ ] I have added/updated API documentation (if applicable)
- [ ] I have updated CHANGELOG.md
- [ ] I have added inline code comments for complex logic

### Security
- [ ] I have checked for security vulnerabilities
- [ ] I have validated all user inputs
- [ ] I have avoided introducing XSS/SQL injection risks
- [ ] I have not committed sensitive data (API keys, passwords)

### Performance
- [ ] I have considered performance implications
- [ ] I have avoided N+1 query problems
- [ ] I have added appropriate database indexes (if needed)

### Breaking Changes
- [ ] This PR introduces breaking changes
- [ ] I have documented migration steps (if breaking)
- [ ] I have updated version numbers appropriately

### CI/CD Pipeline
- [ ] All CI/CD checks are passing
- [ ] No auto-fix commits were needed
- [ ] SonarCloud quality gate passed
- [ ] Code coverage is maintained or improved

## 📋 Additional Notes
<!-- Any additional information that reviewers should know. -->

## 🔍 Review Checklist for Maintainers
- [ ] Code quality is acceptable
- [ ] Tests are comprehensive
- [ ] Documentation is complete
- [ ] No security concerns
- [ ] Performance is acceptable
- [ ] CI/CD pipeline passes
