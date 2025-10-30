# Karting Dashboard - Module Refactoring

## Current Status
The dashboard is being refactored from a monolithic `script.js` (8000+ lines) into modular components for better maintainability.

## New Module Structure

### Core Modules (in `/js` directory)
- **core.js** - Global state, constants, theme, loading, utilities
- **data.js** - Data loading, parsing, stats calculations (PLANNED)
- **filters.js** - Filter logic and UI (PLANNED)
- **ui.js** - Widgets, tables, leaderboards, date/time (PLANNED)

### Chart Modules (PLANNED)
- **charts-driver.js** - Driver performance charts
- **charts-session.js** - Lap/session charts
- **charts-track.js** - Track insights charts
- **charts-battles.js** - Driver battle charts
- **charts-financial.js** - Financial/cost charts
- **charts-temporal.js** - Time-based charts
- **charts-predictive.js** - Predictive analytics
- **charts-geo.js** - Geographical charts

### Main Entry
- **main.js** - Initialization orchestration (PLANNED)

## Migration Plan

1. ✅ Fix duplicate DOMContentLoaded listeners causing double-load
2. ✅ Create `js/core.js` with global state and utilities
3. ⏳ Extract chart initialization functions to separate modules
4. ⏳ Extract data/stats functions to `data.js`
5. ⏳ Extract filter logic to `filters.js`
6. ⏳ Extract UI components to `ui.js`
7. ⏳ Create `main.js` orchestrator
8. ⏳ Update `index.html` to load modules in order
9. ⏳ Test and verify all functionality works
10. ⏳ Remove original `script.js` (keep as backup)

## Load Order
Modules must be loaded in this specific order in `index.html`:
1. core.js (globals, theme, utilities)
2. data.js (data loading and stats)
3. filters.js (filtering logic)
4. ui.js (UI components)
5. charts-*.js (chart modules - order doesn't matter between these)
6. main.js (initialization - must be last)

## Benefits of Modular Structure
- **Maintainability**: Easier to find and fix bugs
- **Scalability**: Add new chart types without bloating a single file
- **Collaboration**: Multiple developers can work on different modules
- **Testing**: Easier to unit test individual modules
- **Performance**: Potential for lazy-loading non-critical charts
- **Reusability**: Core utilities can be shared across projects

## Notes
- All functions are attached to `window` object for global access (no ES6 modules yet)
- Original `script.js` remains as fallback during migration
- Backward compatibility maintained throughout refactoring
