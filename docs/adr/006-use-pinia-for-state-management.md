# ADR-006: Use Pinia for State Management

## Status

**Accepted**

## Date

2024-01-20

## Context

The Karting Dashboard SPA needs centralized state management for:

- User authentication state
- Driver list and selected driver
- Track data
- Session history
- UI state (theme, notifications)
- Caching API responses

Vue 3's Composition API provides reactive state, but a dedicated solution helps with complex state.

## Decision

We chose **Pinia** as the state management solution.

### Store Structure

```
stores/
├── auth.ts          # User authentication, login/logout
├── drivers.ts       # Driver CRUD, selection
├── tracks.ts        # Track data
├── sessions.ts      # Session history
├── friends.ts       # Friend management
├── notifications.ts # Toast notifications
└── theme.ts         # Dark/light mode
```

### Example Store

```typescript
// stores/drivers.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { driversApi } from '@/api/drivers'
import type { Driver } from '@/types'

export const useDriversStore = defineStore('drivers', () => {
  // State
  const drivers = ref<Driver[]>([])
  const selectedDriver = ref<Driver | null>(null)
  const loading = ref(false)

  // Getters
  const activeDrivers = computed(() => 
    drivers.value.filter(d => d.is_active)
  )

  // Actions
  async function fetchDrivers() {
    loading.value = true
    try {
      drivers.value = await driversApi.getAll()
    } finally {
      loading.value = false
    }
  }

  async function createDriver(data: Partial<Driver>) {
    const driver = await driversApi.create(data)
    drivers.value.push(driver)
    return driver
  }

  return {
    drivers,
    selectedDriver,
    loading,
    activeDrivers,
    fetchDrivers,
    createDriver,
  }
})
```

### Reasons

1. **Vue 3 Native**: Built for Vue 3 Composition API, first-class TypeScript support.

2. **Simpler than Vuex**: No mutations, no modules complexity, just state/getters/actions.

3. **DevTools Integration**: Excellent Vue DevTools support with time-travel debugging.

4. **Type Safety**: Full TypeScript inference without extra type definitions.

5. **Composition API Style**: Uses `ref()`, `computed()` - consistent with component code.

6. **Official Recommendation**: Pinia is now the official Vue state management library.

## Alternatives Considered

### Option 1: Vuex 4
- **Pros**: Battle-tested, large community
- **Cons**: Verbose mutations, complex modules, being deprecated

### Option 2: Composition API Only
- **Pros**: No extra dependency, simple for small apps
- **Cons**: No DevTools, harder to share state, no persistence

### Option 3: Zustand
- **Pros**: Minimal, React-compatible if needed
- **Cons**: Not Vue-specific, less integration

## Consequences

### Positive
- Clean, simple store syntax
- Full TypeScript support
- Hot module replacement works perfectly
- Easy testing with `setActivePinia()`
- DevTools time-travel debugging

### Negative
- Another library to learn (though simpler than Vuex)
- Migration effort if coming from Vuex

### Neutral
- Stores are composable (can use other stores)
- SSR support available if needed

## Testing Stores

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useDriversStore } from '@/stores/drivers'

describe('Drivers Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetches drivers', async () => {
    const store = useDriversStore()
    await store.fetchDrivers()
    expect(store.drivers.length).toBeGreaterThan(0)
  })
})
```

## References

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Pinia vs Vuex](https://pinia.vuejs.org/introduction.html#comparison-with-vuex)
- [Vue State Management](https://vuejs.org/guide/scaling-up/state-management.html)
