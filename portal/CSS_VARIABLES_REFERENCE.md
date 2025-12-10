# 🎨 Quick Reference: CSS Variables

## Usage in Components

Replace hardcoded values with CSS variables:

### ❌ Before (Hardcoded)
```scss
.my-component {
  background: #1A1F2E;
  color: #F9FAFB;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1rem;
  transition: all 0.2s ease;
}
```

### ✅ After (Dynamic)
```scss
.my-component {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  font-size: var(--text-base);
  transition: all var(--transition-normal);
}
```

## Available Variables

### Colors
```scss
// Brand
var(--primary-color)     // #FF6B35
var(--primary-dark)      // #E55A2B
var(--accent)           // #4ECDC4

// Backgrounds
var(--bg-primary)       // #0F1419
var(--bg-secondary)     // #1A1F2E
var(--bg-tertiary)      // #252B3A
var(--card-bg)          // rgba(26, 31, 46, 0.8)

// Text
var(--text-primary)     // #F9FAFB
var(--text-secondary)   // #9CA3AF

// Borders
var(--border-color)     // rgba(255, 255, 255, 0.1)
var(--border-light)     // rgba(255, 255, 255, 0.2)

// States
var(--error-color)      // #EF4444
var(--success-color)    // #10B981
var(--warning-color)    // #F59E0B
```

### Spacing
```scss
var(--spacing-1)        // 0.25rem
var(--spacing-2)        // 0.5rem
var(--spacing-3)        // 0.75rem
var(--spacing-4)        // 1rem
var(--spacing-5)        // 1.5rem
var(--spacing-6)        // 2rem

var(--radius-sm)        // 0.25rem
var(--radius-md)        // 0.5rem
var(--radius-lg)        // 0.75rem
var(--radius-xl)        // 1rem

var(--card-padding)           // 1rem
var(--card-padding-mobile)    // 0.75rem
```

### Typography
```scss
// Fonts
var(--font-sans)        // 'Inter', sans-serif
var(--font-mono)        // 'Courier New', monospace
var(--font-display)     // 'Inter', 'Helvetica Neue'

// Sizes
var(--text-xs)          // 1rem
var(--text-sm)          // 1rem
var(--text-base)        // 1rem
var(--text-lg)          // 1.125rem
var(--text-xl)          // 1.25rem
var(--text-2xl)         // 1.5rem
var(--text-3xl)         // 1.875rem
```

### Effects
```scss
// Transitions
var(--transition-fast)      // 0.15s ease
var(--transition-normal)    // 0.2s cubic-bezier(0.4, 0, 0.2, 1)

// Shadows
var(--shadow-sm)           // 0 1px 3px rgba(0, 0, 0, 0.1)
var(--shadow-md)           // 0 4px 12px rgba(0, 0, 0, 0.15)
var(--shadow-lg)           // 0 8px 20px rgba(0, 0, 0, 0.2)
```

## Common Patterns

### Card Component
```scss
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  
  &:hover {
    border-color: var(--border-light);
    box-shadow: var(--shadow-lg);
  }
}
```

### Button Component
```scss
.button {
  background: var(--primary-color);
  color: white;
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
  }
}
```

### Input Component
```scss
.input {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
}
```

### Heading Component
```scss
.heading {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  margin-bottom: var(--spacing-4);
}

.subheading {
  color: var(--text-secondary);
  font-size: var(--text-lg);
  margin-bottom: var(--spacing-3);
}
```

### Container Component
```scss
.container {
  background: var(--bg-secondary);
  padding: var(--spacing-6);
  border-radius: var(--radius-xl);
  
  @media (max-width: 768px) {
    padding: var(--card-padding-mobile);
  }
}
```

## Utility Classes

Available globally (defined in `variables.scss`):

```html
<!-- Backgrounds -->
<div class="bg-primary">...</div>
<div class="bg-secondary">...</div>
<div class="bg-card">...</div>

<!-- Text -->
<p class="text-primary">...</p>
<p class="text-secondary">...</p>

<!-- Borders -->
<div class="border-standard rounded-md">...</div>
<div class="rounded-lg">...</div>

<!-- Shadows -->
<div class="shadow-card">...</div>

<!-- Transitions -->
<button class="transition-fast">...</button>
```

## Migration Checklist

When updating existing components:

1. **Find hardcoded colors**
   ```scss
   // Search for: #[0-9A-Fa-f]{6}
   // Replace with: var(--...-color)
   ```

2. **Find hardcoded spacing**
   ```scss
   // Search for: padding: 1rem
   // Replace with: padding: var(--spacing-4)
   ```

3. **Find hardcoded font sizes**
   ```scss
   // Search for: font-size: 1.5rem
   // Replace with: font-size: var(--text-2xl)
   ```

4. **Find hardcoded transitions**
   ```scss
   // Search for: transition: all 0.2s
   // Replace with: transition: all var(--transition-normal)
   ```

5. **Find hardcoded shadows**
   ```scss
   // Search for: box-shadow: 0 4px
   // Replace with: box-shadow: var(--shadow-md)
   ```

## Adding New Variables

1. **Add to database** (via admin panel or migration)
2. **Add fallback** to `variables.scss`
3. **Use in components**

Example:
```scss
// In migration
['key' => 'highlight-color', 'value' => '#FFD700', ...]

// In variables.scss (fallback)
:root {
  --highlight-color: #FFD700;
}

// In component
.highlighted {
  background: var(--highlight-color);
}
```

## Best Practices

✅ **DO**
- Use semantic variable names
- Group related styles
- Provide fallback values
- Use CSS variables consistently
- Test changes in admin panel

❌ **DON'T**
- Hardcode values
- Skip fallbacks
- Use non-standard units
- Ignore accessibility (min 1rem fonts)
- Mix hardcoded and dynamic values

---

**Pro Tip**: Use browser DevTools to inspect `:root` and see all active CSS variables!
