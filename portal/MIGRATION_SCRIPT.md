# Migration Script: Convert Hardcoded Values to CSS Variables

This PowerShell script helps convert hardcoded values in your SCSS files to use the new CSS variables.

## Usage

```powershell
# Navigate to frontend styles directory
cd "C:\Users\TheMaksoo\Downloads\karting\portal\frontend\src\styles"

# Run the conversion script below
```

## Conversion Script

```powershell
# Get all SCSS files
$scssFiles = Get-ChildItem -Path . -Filter "*.scss" -Recurse

foreach ($file in $scssFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Colors - Primary/Accent
    $content = $content -replace '#FF6B35', 'var(--primary-color)'
    $content = $content -replace '#E55A2B', 'var(--primary-dark)'
    $content = $content -replace '#4ECDC4', 'var(--accent)'
    
    # Colors - Backgrounds
    $content = $content -replace '#0F1419', 'var(--bg-primary)'
    $content = $content -replace '#1A1F2E', 'var(--bg-secondary)'
    $content = $content -replace '#252B3A', 'var(--bg-tertiary)'
    $content = $content -replace 'rgba\(26,\s*31,\s*46,\s*0\.8\)', 'var(--card-bg)'
    
    # Colors - Text
    $content = $content -replace '#F9FAFB', 'var(--text-primary)'
    $content = $content -replace '#9CA3AF', 'var(--text-secondary)'
    
    # Colors - Borders
    $content = $content -replace 'rgba\(255,\s*255,\s*255,\s*0\.1\)', 'var(--border-color)'
    $content = $content -replace 'rgba\(255,\s*255,\s*255,\s*0\.2\)', 'var(--border-light)'
    
    # Colors - States
    $content = $content -replace '#EF4444', 'var(--error-color)'
    $content = $content -replace '#10B981', 'var(--success-color)'
    $content = $content -replace '#F59E0B', 'var(--warning-color)'
    
    # Spacing
    $content = $content -replace ':\s*0\.25rem(?![0-9])', ': var(--spacing-1)'
    $content = $content -replace ':\s*0\.5rem(?![0-9])', ': var(--spacing-2)'
    $content = $content -replace ':\s*0\.75rem(?![0-9])', ': var(--spacing-3)'
    # Note: 1rem is ambiguous (could be text-base or spacing-4)
    $content = $content -replace ':\s*1\.5rem(?![0-9])', ': var(--spacing-5)'
    $content = $content -replace ':\s*2rem(?![0-9])', ': var(--spacing-6)'
    
    # Border Radius (when used as border-radius specifically)
    $content = $content -replace 'border-radius:\s*0\.25rem', 'border-radius: var(--radius-sm)'
    $content = $content -replace 'border-radius:\s*0\.5rem', 'border-radius: var(--radius-md)'
    $content = $content -replace 'border-radius:\s*0\.75rem', 'border-radius: var(--radius-lg)'
    $content = $content -replace 'border-radius:\s*1rem', 'border-radius: var(--radius-xl)'
    
    # Font Sizes
    $content = $content -replace 'font-size:\s*1\.125rem', 'font-size: var(--text-lg)'
    $content = $content -replace 'font-size:\s*1\.25rem', 'font-size: var(--text-xl)'
    $content = $content -replace 'font-size:\s*1\.5rem', 'font-size: var(--text-2xl)'
    $content = $content -replace 'font-size:\s*1\.875rem', 'font-size: var(--text-3xl)'
    $content = $content -replace 'font-size:\s*2\.25rem', 'font-size: var(--text-3xl)' # Map to closest
    
    # Transitions
    $content = $content -replace 'transition:\s*all\s+0\.15s\s+ease', 'transition: all var(--transition-fast)'
    $content = $content -replace 'transition:\s*all\s+0\.2s(?:\s+cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\))?', 'transition: all var(--transition-normal)'
    
    # Shadows
    $content = $content -replace 'box-shadow:\s*0\s+1px\s+3px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)', 'box-shadow: var(--shadow-sm)'
    $content = $content -replace 'box-shadow:\s*0\s+4px\s+12px\s+rgba\(0,\s*0,\s*0,\s*0\.15\)', 'box-shadow: var(--shadow-md)'
    $content = $content -replace 'box-shadow:\s*0\s+8px\s+20px\s+rgba\(0,\s*0,\s*0,\s*0\.2\)', 'box-shadow: var(--shadow-lg)'
    
    # Font Families
    $content = $content -replace "font-family:\s*'Inter',\s*-apple-system.*?sans-serif", "font-family: var(--font-sans)"
    $content = $content -replace "font-family:\s*'Courier New'.*?monospace", "font-family: var(--font-mono)"
    
    # Only update if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        Write-Host "  - No changes" -ForegroundColor Gray
    }
}

Write-Host "`nConversion complete!" -ForegroundColor Green
```

## Manual Review Needed

After running the script, manually check:

### 1. Ambiguous 1rem values
The script can't distinguish between:
- `padding: 1rem` → Should be `var(--spacing-4)`
- `font-size: 1rem` → Should be `var(--text-base)`

**Fix manually:**
```scss
// Check padding/margin contexts
padding: var(--spacing-4);
margin: var(--spacing-4);

// Check font-size contexts
font-size: var(--text-base);
```

### 2. Custom Colors
Any colors not in the default set need manual mapping:
```scss
// Example: Custom purple
#A855F7 → Consider adding to database or mapping to closest variable
```

### 3. Complex Transitions
```scss
// May need manual review
transition: transform 0.3s ease-out;
// Consider: Should this use a variable or stay custom?
```

### 4. Gradients
```scss
// These should stay as-is or be converted to new variables
background: linear-gradient(135deg, #FF6B35 0%, #4ECDC4 100%);
// Could become:
background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent) 100%);
```

## Verification

After conversion, verify:

```powershell
# Search for remaining hardcoded colors
Get-ChildItem -Filter "*.scss" -Recurse | Select-String -Pattern "#[0-9A-Fa-f]{6}" | Select-Object Filename, LineNumber, Line

# Search for remaining hardcoded rem values
Get-ChildItem -Filter "*.scss" -Recurse | Select-String -Pattern "\d+\.?\d*rem" | Where-Object { $_.Line -notmatch "var\(--" }
```

## Rollback

If needed, use Git to rollback:
```powershell
git checkout -- *.scss
```

## Best Practices

1. **Run on a test file first** to verify behavior
2. **Commit before running** so you can easily rollback
3. **Review changes** in Git diff before committing
4. **Test in browser** to ensure visual parity
5. **Update one category at a time** (colors, then spacing, then typography)

## One-File Test

Test on a single file first:

```powershell
# Test on HomeView.scss only
$file = Get-Item "HomeView.scss"
$content = Get-Content $file -Raw

# Apply conversions...
$content = $content -replace '#FF6B35', 'var(--primary-color)'
# ... (rest of replacements)

# Review changes without saving
$content | Out-File "HomeView.scss.preview" -NoNewline

# Compare
code --diff HomeView.scss HomeView.scss.preview
```

---

**⚠️ Warning**: Always backup before running bulk find/replace operations!
