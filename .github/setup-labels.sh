#!/bin/bash
# Setup GitHub labels for the repository
# Run this script once to create all necessary labels

REPO="TheMaksoo/karting"

echo "🏷️  Creating GitHub labels for $REPO..."

# Auto-generated PR label
gh label create "auto-created" --color "0E8A16" --description "Automatically created by GitHub Actions" --force || true

# Type labels
gh label create "enhancement" --color "A2EEEF" --description "New feature or request" --force || true
gh label create "feature" --color "0075CA" --description "New feature implementation" --force || true
gh label create "bug" --color "D73A4A" --description "Something isn't working" --force || true
gh label create "fix" --color "D93F0B" --description "Bug fix" --force || true
gh label create "hotfix" --color "B60205" --description "Critical fix requiring immediate attention" --force || true

# Priority labels
gh label create "priority: high" --color "E11D21" --description "High priority" --force || true
gh label create "priority: medium" --color "FBCA04" --description "Medium priority" --force || true
gh label create "priority: low" --color "0E8A16" --description "Low priority" --force || true

# Status labels
gh label create "in progress" --color "FBCA04" --description "Work in progress" --force || true
gh label create "ready for review" --color "0E8A16" --description "Ready for code review" --force || true
gh label create "changes requested" --color "E99695" --description "Changes requested by reviewer" --force || true
gh label create "approved" --color "0E8A16" --description "Approved by reviewers" --force || true

# Category labels
gh label create "backend" --color "1D76DB" --description "Backend/Laravel changes" --force || true
gh label create "frontend" --color "5319E7" --description "Frontend/Vue changes" --force || true
gh label create "database" --color "C5DEF5" --description "Database schema or migrations" --force || true
gh label create "testing" --color "BFD4F2" --description "Testing related changes" --force || true
gh label create "documentation" --color "0075CA" --description "Documentation improvements" --force || true
gh label create "dependencies" --color "0366D6" --description "Dependency updates" --force || true
gh label create "ci/cd" --color "F9D0C4" --description "CI/CD pipeline changes" --force || true

# Size labels
gh label create "size: XS" --color "C2E0C6" --description "Extra small PR (1-10 lines)" --force || true
gh label create "size: S" --color "7FE096" --description "Small PR (11-50 lines)" --force || true
gh label create "size: M" --color "FEF2C0" --description "Medium PR (51-200 lines)" --force || true
gh label create "size: L" --color "FBCA04" --description "Large PR (201-500 lines)" --force || true
gh label create "size: XL" --color "E99695" --description "Extra large PR (501+ lines)" --force || true

echo "✅ Labels created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Configure repository variables (optional):"
echo "   - PROJECT_NUMBER: GitHub Project ID to auto-add PRs"
echo "   - DEFAULT_MILESTONE: Default milestone name"
echo "   - DEFAULT_REVIEWERS: Comma-separated list of reviewer usernames"
echo ""
echo "2. Go to Settings > Actions > Variables to set these"
