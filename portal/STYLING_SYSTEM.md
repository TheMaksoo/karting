# Dynamic Styling System

This system allows admins to customize the entire dashboard appearance through a database-backed admin panel.

## Architecture

### Backend (Laravel)
- **Migration**: `2025_12_10_000001_create_style_variables_table.php`
- **Model**: `App\Models\StyleVariable`
- **Controller**: `App\Http\Controllers\StyleVariableController`
- **Routes**: `/api/style-variables/*` (admin protected)

### Frontend (Vue 3 + TypeScript)
- **Composable**: `useStyleVariables.ts` - Manages fetching/updating styles
- **View**: `AdminStylingView.vue` - Admin panel for editing styles
- **Global Styles**: `variables.scss` - CSS custom properties
- **Route**: `/admin/styling` (admin only)

## Features

### Style Categories
1. **Colors** 🎨
   - Primary, accent, background colors
   - Text colors (primary, secondary)
   - Border colors
   - State colors (error, success, warning)

2. **Spacing** 📏
   - Spacing scale (1-6)
   - Border radius (sm, md, lg, xl)
   - Card padding (desktop & mobile)

3. **Typography** 📝
   - Font families (sans, mono, display)
   - Font sizes (xs to 3xl)
   - All sizes minimum 1rem

4. **Effects** ✨
   - Transitions (fast, normal)
   - Box shadows (sm, md, lg)

### Admin Panel Features
- **Live Preview**: Changes apply immediately
- **Category Tabs**: Organized by style type
- **Color Picker**: Visual color selection
- **Save/Reset**: Bulk save or reset to defaults
- **Validation**: Type-safe inputs with constraints
- **Unsaved Changes Indicator**: Visual feedback

## Setup

### 1. Run Migration
```bash
cd backend
php artisan migrate
```

This creates the `style_variables` table and seeds it with current styling values.

### 2. Access Admin Panel
Navigate to: **Dashboard → Admin → Styling**

### 3. Customize Styles
- Select a category tab
- Modify values using color pickers, text inputs, or number fields
- Changes apply immediately for live preview
- Click "Save Changes" to persist to database

### 4. Reset Styles
Click "Reset to Defaults" to revert all styles to original values.

## How It Works

### Flow
1. **Page Load**: App.vue loads styles via `useStyleVariables` composable
2. **API Call**: Fetches all style variables from `/api/style-variables`
3. **CSS Injection**: Applies values as CSS custom properties to `:root`
4. **Component Usage**: Components reference variables via `var(--variable-name)`

### Example Usage in Components
```scss
.my-component {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  font-size: var(--text-base);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
}

.my-component:hover {
  border-color: var(--border-light);
  background: var(--bg-tertiary);
}
```

### Database Schema
```sql
CREATE TABLE style_variables (
  id BIGINT PRIMARY KEY,
  key VARCHAR UNIQUE,           -- e.g., 'primary-color'
  value VARCHAR,                -- e.g., '#FF6B35'
  category VARCHAR,             -- colors, spacing, typography, effects
  label VARCHAR,                -- Human-readable name
  description TEXT,             -- Optional description
  type VARCHAR,                 -- color, size, number, string
  metadata JSON,                -- min, max, unit constraints
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Endpoints

### GET /api/style-variables
Returns all style variables grouped by category.

**Response:**
```json
{
  "variables": {
    "colors": [
      {
        "id": 1,
        "key": "primary-color",
        "value": "#FF6B35",
        "category": "colors",
        "label": "Primary Color",
        "description": "Main brand color",
        "type": "color"
      }
    ],
    "spacing": [...],
    "typography": [...],
    "effects": [...]
  }
}
```

### PUT /api/style-variables/{id}
Update a single style variable.

**Body:**
```json
{
  "value": "#FF6B35"
}
```

### POST /api/style-variables/bulk
Update multiple variables at once.

**Body:**
```json
{
  "variables": [
    { "id": 1, "value": "#FF6B35" },
    { "id": 2, "value": "#E55A2B" }
  ]
}
```

### POST /api/style-variables/reset
Reset all variables to default values.

### GET /api/styles.css (Public)
Returns generated CSS file with all variables (cached for 1 hour).

## Benefits

### For Admins
- No code changes needed to update styling
- Live preview of changes
- Easy to experiment and revert
- Organized by category
- Type-safe inputs prevent errors

### For Developers
- Centralized style management
- CSS variables auto-update
- No hard-coded values
- Consistent styling across app
- Easy to add new variables

### For Performance
- CSS cached for 1 hour
- Bulk updates minimize API calls
- Variables loaded once on app init
- Efficient CSS custom properties

## Adding New Variables

### 1. Add to Migration
```php
['key' => 'my-new-color', 'value' => '#123456', 'category' => 'colors', 
 'label' => 'My New Color', 'type' => 'color', 'metadata' => null]
```

### 2. Add to variables.scss (Optional Fallback)
```scss
:root {
  --my-new-color: #123456;
}
```

### 3. Use in Components
```scss
.my-element {
  background: var(--my-new-color);
}
```

## Best Practices

1. **Always use CSS variables** instead of hardcoded values
2. **Respect minimum font size** of 1rem for accessibility
3. **Test changes** in live preview before saving
4. **Document custom variables** with clear labels/descriptions
5. **Use semantic naming** (e.g., `primary-color` not `blue`)
6. **Group related variables** in appropriate categories
7. **Provide fallbacks** in variables.scss for SSR/initial load

## Troubleshooting

### Styles not applying?
- Check browser console for API errors
- Verify migration ran successfully
- Clear browser cache
- Check auth/admin permissions

### Changes not saving?
- Verify admin role assigned to user
- Check network tab for 403/500 errors
- Ensure DB connection is active

### Variables not updating?
- Clear Laravel cache: `php artisan cache:clear`
- Hard refresh browser (Ctrl+Shift+R)
- Check CSS custom property in DevTools

## Future Enhancements
- Import/Export themes as JSON
- Theme presets (Dark, Light, High Contrast)
- Per-user theme preferences
- Color palette generator
- Accessibility checker (WCAG contrast ratios)
- Variable usage analyzer
- Version history/rollback
