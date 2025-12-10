# Global Styling System Guide

## Overview
The karting portal now uses a comprehensive global styling system with CSS custom properties (variables) stored in a database and dynamically loaded.

## Architecture

### 1. **CSS Variables** (`src/styles/variables.scss`)
All global design tokens are defined as CSS custom properties in the `:root` selector:

```scss
:root {
  // Colors (14 variables)
  --primary-color: #FF6B35;
  --primary-dark: #E55A2B;
  --accent: #4FACFE;
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #1A1F26;
  --text-primary: #F0F6FC;
  --text-secondary: #8B949E;
  --border-color: rgba(255, 255, 255, 0.1);
  --success-color: #10B981;
  --warning-color: #FCD34D;
  --error-color: #F87171;
  
  // Spacing (10 variables)
  --spacing-1: 0.25rem;  // 4px
  --spacing-2: 0.5rem;   // 8px
  --spacing-3: 0.75rem;  // 12px
  --spacing-4: 1rem;     // 16px
  --spacing-5: 1.5rem;   // 24px
  --spacing-6: 2rem;     // 32px
  // ... up to spacing-10
  
  // Border Radius (3 variables)
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  
  // Typography (10 variables)
  --font-sans: 'Inter', sans-serif;
  --font-display: 'Orbitron', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  // Effects (7 variables)
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 20px rgba(0, 0, 0, 0.2);
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
  --card-padding: 1.5rem;
}
```

### 2. **Database Storage** (Backend)
- **Migration**: `database/migrations/2025_12_10_000001_create_style_variables_table.php`
- **Model**: `app/Models/StyleVariable.php`
- **Controller**: `app/Http/Controllers/API/StyleVariableController.php`
- **Table**: `style_variables` with columns:
  - `key` (e.g., 'primary-color')
  - `value` (e.g., '#FF6B35')
  - `category` (colors, spacing, typography, effects)
  - `description`

### 3. **Frontend Loading** (`src/composables/useStyleVariables.ts`)
```typescript
export function useStyleVariables() {
  const variables = ref<StyleVariable[]>([])
  const loading = ref(true)
  
  const fetchVariables = async () => {
    const response = await apiService.get('/style-variables')
    variables.value = response.data
    applyStyles()
  }
  
  const applyStyles = () => {
    const root = document.documentElement
    variables.value.forEach(v => {
      root.style.setProperty(`--${v.key}`, v.value)
    })
  }
}
```

### 4. **Admin Panel** (`src/views/AdminStylingView.vue`)
- Live style editor with color pickers
- Organized by category tabs
- Real-time preview
- Bulk save/reset functionality
- Accessible at `/admin/styling`

## Usage Guidelines

### ✅ DO Use Variables For:

**Colors:**
```scss
// ✅ Good
background: var(--bg-primary);
color: var(--text-primary);
border-color: var(--primary-color);

// ❌ Bad
background: #0D1117;
color: #F0F6FC;
border-color: #FF6B35;
```

**Spacing:**
```scss
// ✅ Good
padding: var(--spacing-4);
margin: var(--spacing-2) var(--spacing-3);
gap: var(--spacing-4);

// ❌ Bad
padding: 1rem;
margin: 0.5rem 0.75rem;
gap: 16px;
```

**Typography:**
```scss
// ✅ Good
font-family: var(--font-sans);
font-size: var(--text-base);

// ❌ Bad
font-family: 'Inter', sans-serif;
font-size: 16px;
```

**Effects:**
```scss
// ✅ Good
box-shadow: var(--shadow-md);
transition: all var(--transition-normal);
border-radius: var(--radius-lg);

// ❌ Bad
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
transition: all 0.2s ease;
border-radius: 0.75rem;
```

### 🎯 When to Use Hardcoded Values

**Component-specific decorative effects:**
```scss
// OK - Specific gradient unique to trophy cards
.trophy-gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

// OK - Specific shadow with custom color
.trophy-card:hover {
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

// OK - Specific rgba overlay
.tab:hover {
  background: rgba(255, 107, 53, 0.1);
}
```

**Fixed structural values:**
```scss
// OK - Grid layout specific to component
.trophy-grid {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

// OK - Component-specific sizing
.trophy-icon {
  font-size: 3rem;
  min-width: 280px;
}
```

## File Organization

### SCSS Files
```
styles/
├── variables.scss       # Global CSS custom properties (imported first)
├── HomeView.scss        # Main dashboard styles (~750 lines)
├── heatmap.scss         # Heatmap table styles (~600 lines)
├── trophy.scss          # Trophy case styles (~900 lines)
├── driver-activity.scss # Driver selection chips (~130 lines)
└── gauge.scss          # Consistency gauge (~60 lines)
```

### Importing Order (in `main.ts` or `App.vue`)
```typescript
import '@/styles/variables.scss'  // Must be first!
import '@/styles/HomeView.scss'
import '@/styles/heatmap.scss'
import '@/styles/trophy.scss'
import '@/styles/driver-activity.scss'
import '@/styles/gauge.scss'
```

## Component Styles

All Vue components use scoped styles with CSS variables:

```vue
<style scoped>
.component {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
</style>
```

### Components Using Global Styles:
- ✅ `AdminDataView.vue` - Fully variable-based
- ✅ `TrackManagementView.vue` - Uses variables for main colors
- ✅ `GeographicView.vue` - Uses variables
- ✅ `DriverStatsView.vue` - Uses variables
- ✅ `TrackPerformanceView.vue` - Uses variables
- ✅ All other views - Using CSS variables

## API Endpoints

### GET `/api/style-variables`
Returns all style variables (requires authentication)
```json
[
  {
    "id": 1,
    "key": "primary-color",
    "value": "#FF6B35",
    "category": "colors",
    "description": "Main brand color"
  }
]
```

### PUT `/api/style-variables/{id}`
Update single variable (requires admin)
```json
{
  "value": "#FF8855"
}
```

### POST `/api/style-variables/bulk-update`
Update multiple variables (requires admin)
```json
{
  "variables": [
    { "id": 1, "value": "#FF8855" },
    { "id": 2, "value": "#E66A3C" }
  ]
}
```

### POST `/api/style-variables/reset`
Reset all to defaults (requires admin)

### GET `/api/style-variables/css`
Get CSS string for injection
```css
:root {
  --primary-color: #FF6B35;
  --spacing-4: 1rem;
  /* ... */
}
```

## Benefits

✅ **Centralized theming** - Change colors globally from admin panel
✅ **Consistent design** - All components use same tokens
✅ **Easy maintenance** - Update once, applies everywhere
✅ **Live updates** - Changes apply immediately without rebuild
✅ **Database-backed** - Styles persist across deployments
✅ **Type-safe** - TypeScript interfaces for all variables
✅ **Performance** - Cached CSS generation

## Migration Checklist

When adding new components:
- [ ] Use `var(--*)` for all colors
- [ ] Use `var(--spacing-*)` for padding/margin/gap
- [ ] Use `var(--text-*)` for font-sizes
- [ ] Use `var(--font-*)` for font-families
- [ ] Use `var(--radius-*)` for border-radius
- [ ] Use `var(--shadow-*)` for box-shadow
- [ ] Use `var(--transition-*)` for animations
- [ ] Only use hardcoded values for component-specific decorative effects

## Examples

### Before (Hardcoded)
```scss
.card {
  background: #161B22;
  color: #F0F6FC;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.card:hover {
  background: #1A1F26;
  border-color: #FF6B35;
}
```

### After (Global Variables)
```scss
.card {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.card:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary-color);
}
```

## Notes

- **41 total CSS variables** defined in database
- **All main views** converted to use variables
- **Fallback values** provided in `variables.scss` for SSR/initial load
- **Category organization**: colors (14), spacing (10), typography (10), effects (7)
- **Admin access required** for editing (regular users can only view)
- **CSS caching** on backend (1 hour TTL) for performance
