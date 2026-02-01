# Setup GitHub labels for the repository
# Run this script once to create all necessary labels

$REPO = "TheMaksoo/karting"

Write-Host "🏷️  Creating GitHub labels for $REPO..." -ForegroundColor Cyan

# Function to create label (suppress errors if already exists)
function New-Label {
    param($Name, $Color, $Description)
    gh label create $Name --color $Color --description $Description --force 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $Name" -ForegroundColor Green
    }
}

# Auto-generated PR label
New-Label "auto-created" "0E8A16" "Automatically created by GitHub Actions"

# Type labels
New-Label "enhancement" "A2EEEF" "New feature or request"
New-Label "feature" "0075CA" "New feature implementation"
New-Label "bug" "D73A4A" "Something isn't working"
New-Label "fix" "D93F0B" "Bug fix"
New-Label "hotfix" "B60205" "Critical fix requiring immediate attention"

# Priority labels
New-Label "priority: high" "E11D21" "High priority"
New-Label "priority: medium" "FBCA04" "Medium priority"
New-Label "priority: low" "0E8A16" "Low priority"

# Status labels
New-Label "in progress" "FBCA04" "Work in progress"
New-Label "ready for review" "0E8A16" "Ready for code review"
New-Label "changes requested" "E99695" "Changes requested by reviewer"
New-Label "approved" "0E8A16" "Approved by reviewers"

# Category labels
New-Label "backend" "1D76DB" "Backend/Laravel changes"
New-Label "frontend" "5319E7" "Frontend/Vue changes"
New-Label "database" "C5DEF5" "Database schema or migrations"
New-Label "testing" "BFD4F2" "Testing related changes"
New-Label "documentation" "0075CA" "Documentation improvements"
New-Label "dependencies" "0366D6" "Dependency updates"
New-Label "ci/cd" "F9D0C4" "CI/CD pipeline changes"

# Size labels
New-Label "size: XS" "C2E0C6" "Extra small PR (1-10 lines)"
New-Label "size: S" "7FE096" "Small PR (11-50 lines)"
New-Label "size: M" "FEF2C0" "Medium PR (51-200 lines)"
New-Label "size: L" "FBCA04" "Large PR (201-500 lines)"
New-Label "size: XL" "E99695" "Extra large PR (501+ lines)"

Write-Host ""
Write-Host "✅ Labels created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure repository variables (optional):"
Write-Host "   - PROJECT_NUMBER: GitHub Project ID to auto-add PRs"
Write-Host "   - DEFAULT_MILESTONE: Default milestone name"
Write-Host "   - DEFAULT_REVIEWERS: Comma-separated list of reviewer usernames"
Write-Host ""
Write-Host "2. Go to GitHub repo Settings > Secrets and variables > Actions > Variables to set these"
