# ADR-002: Use Vue 3 for Frontend

## Status

**Accepted**

## Date

2024-01-15

## Context

We needed a frontend framework for the Karting Dashboard SPA (Single Page Application). Requirements:

- Reactive UI for real-time data updates
- Component-based architecture
- TypeScript support
- Good developer tooling
- Chart/visualization support
- State management for complex data flows
- Testing capabilities

## Decision

We chose **Vue 3** with the **Composition API** and **TypeScript**.

### Stack Details

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.5 | UI Framework |
| TypeScript | 5.9 | Type Safety |
| Vite | 6 | Build Tool |
| Pinia | 2 | State Management |
| Vue Router | 4 | Routing |
| Chart.js | 4 | Visualizations |
| Vitest | 2 | Testing |

### Reasons

1. **Composition API**: Better code organization, reusable composables, improved TypeScript integration.

2. **Performance**: Vue 3's reactivity system is more efficient, smaller bundle size with tree-shaking.

3. **TypeScript First**: Excellent TypeScript support with proper type inference.

4. **Vite**: Lightning-fast HMR (Hot Module Replacement), optimized builds.

5. **Ecosystem**: Rich ecosystem with official libraries (Router, Pinia, DevTools).

6. **Learning Curve**: Easier to learn than React for new developers, more explicit than Angular.

## Alternatives Considered

### Option 1: React
- **Pros**: Larger ecosystem, more job market demand
- **Cons**: JSX can be less intuitive, more boilerplate for state management

### Option 2: Angular
- **Pros**: Full framework, enterprise-ready, dependency injection
- **Cons**: Steeper learning curve, more opinionated, larger bundle size

### Option 3: Svelte
- **Pros**: Smallest bundle size, no virtual DOM, simple syntax
- **Cons**: Smaller ecosystem, fewer developers, less mature

## Consequences

### Positive
- Clean component architecture with SFC (Single File Components)
- Excellent DevTools for debugging
- Strong TypeScript integration
- Fast development with Vite
- Easy testing with Vitest

### Negative
- Smaller talent pool than React
- Some libraries React-only
- Composition API learning curve for Options API developers

### Neutral
- Need to choose between Options API and Composition API (we chose Composition)
- Pinia replaces Vuex for state management

## References

- [Vue 3 Documentation](https://vuejs.org/)
- [Vue 3 Composition API RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0013-composition-api.md)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
