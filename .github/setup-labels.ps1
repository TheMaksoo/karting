# Setup GitHub labels for the repository
$REPO = "TheMaksoo/karting"

Write-Host "Creating GitHub labels for $REPO..." -ForegroundColor Cyan

# Auto-generated PR label
gh label create "auto-created" --color "0E8A16" --description "Automatically created by GitHub Actions" --force 2>$null

# Type labels
gh label create "enhancement" --color "A2EEEF" --description "New feature or request" --force 2>$null
gh label create "feature" --color "0075CA" --description "New feature implementation" --force 2>$null
gh label create "bug" --color "D73A4A" --description "Something is not working" --force 2>$null
gh label create "fix" --color "D93F0B" --description "Bug fix" --force 2>$null
gh label create "hotfix" --color "B60205" --description "Critical fix" --force 2>$null

# Priority labels
gh label create "priority: high" --color "E11D21" --description "High priority" --force 2>$null
gh label create "priority: medium" --color "FBCA04" --description "Medium priority" --force 2>$null
gh label create "priority: low" --color "0E8A16" --description "Low priority" --force 2>$null

# Status labels
gh label create "in progress" --color "FBCA04" --description "Work in progress" --force 2>$null
gh label create "ready for review" --color "0E8A16" --description "Ready for review" --force 2>$null
gh label create "changes requested" --color "E99695" --description "Changes requested" --force 2>$null
gh label create "approved" --color "0E8A16" --description "Approved" --force 2>$null

# Category labels
gh label create "backend" --color "1D76DB" --description "Backend changes" --force 2>$null
gh label create "frontend" --color "5319E7" --description "Frontend changes" --force 2>$null
gh label create "database" --color "C5DEF5" --description "Database changes" --force 2>$null
gh label create "testing" --color "BFD4F2" --description "Testing changes" --force 2>$null
gh label create "documentation" --color "0075CA" --description "Documentation" --force 2>$null
gh label create "dependencies" --color "0366D6" --description "Dependencies" --force 2>$null

# Size labels
gh label create "size: XS" --color "C2E0C6" --description "Extra small" --force 2>$null
gh label create "size: S" --color "7FE096" --description "Small" --force 2>$null
gh label create "size: M" --color "FEF2C0" --description "Medium" --force 2>$null
gh label create "size: L" --color "FBCA04" --description "Large" --force 2>$null
gh label create "size: XL" --color "E99695" --description "Extra large" --force 2>$null

Write-Host ""
Write-Host "Labels created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Optional: Configure repository variables in GitHub Settings" -ForegroundColor Yellow
Write-Host "- PROJECT_NUMBER: Project ID for auto-assignment"
Write-Host "- DEFAULT_MILESTONE: Milestone name"
Write-Host "- DEFAULT_REVIEWERS: Comma-separated usernames"
