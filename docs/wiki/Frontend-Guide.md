# 🎨 Frontend Guide

Complete guide to the Vue 3 frontend application of the Karting Dashboard.

## 📦 Technology Stack

- **Framework**: Vue 3.5 (Composition API)
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 6
- **State Management**: Pinia 2.x
- **Routing**: Vue Router 4.x
- **HTTP Client**: Axios 1.x
- **Charts**: Chart.js 4.x + vue-chartjs
- **UI Notifications**: vue-toastification
- **Testing**: Vitest + Happy-DOM
- **Linting**: ESLint 9.x

## 📁 Directory Structure

```
portal/frontend/src/
├── assets/             # Static assets (CSS, images)
├── components/         # Vue components
│   ├── admin/         # Admin-specific components
│   ├── charts/        # Chart components (Chart.js)
│   ├── filters/       # Filter components
│   ├── home/          # Home view components
│   ├── icons/         # Icon components
│   └── layout/        # Layout components (header, footer, nav)
├── composables/        # Reusable composition functions
│   ├── useAuth.ts
│   ├── useDriver.ts
│   ├── useTrack.ts
│   └── ...
├── router/             # Vue Router configuration
│   └── index.ts
├── services/           # API services
│   ├── api/           # Type-safe API client
│   │   ├── auth.ts
│   │   ├── drivers.ts
│   │   ├── tracks.ts
│   │   └── ...
│   └── axios.ts       # Axios instance configuration
├── stores/             # Pinia state stores
│   ├── auth.ts
│   ├── driver.ts
│   └── track.ts
├── types/              # TypeScript type definitions
│   ├── api.types.ts
│   ├── models.ts
│   └── ...
├── utils/              # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── ...
├── views/              # Page components
│   ├── HomeView.vue
│   ├── DashboardView.vue
│   ├── DriverStatsView.vue
│   └── ...
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## 🏗️ Architecture Patterns

### Composition API

All components use Vue 3's Composition API:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDriverStore } from '@/stores/driver'

// Props
const props = defineProps<{
  driverId: number
}>()

// Emits
const emit = defineEmits<{
  updated: [driverId: number]
}>()

// State
const loading = ref(false)
const driverStore = useDriverStore()

// Computed
const driverName = computed(() => {
  return driverStore.currentDriver?.name ?? 'Unknown'
})

// Methods
const loadDriver = async () => {
  loading.value = true
  try {
    await driverStore.fetchDriver(props.driverId)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadDriver()
})
</script>
```

### Composables

Reusable logic is extracted into composables:

```typescript
// composables/useAuth.ts
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.user)
  const isAdmin = computed(() => authStore.isAdmin)

  const login = async (email: string, password: string) => {
    await authStore.login(email, password)
    router.push('/')
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/login')
  }

  return {
    isAuthenticated,
    currentUser,
    isAdmin,
    login,
    logout
  }
}
```

## 🗺️ Routing

### Route Structure

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/drivers/:id',
    name: 'driver-detail',
    component: () => import('@/views/DriverDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guest: true }
  }
]
```

### Navigation Guards

```typescript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check admin access
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
    return
  }

  // Prevent authenticated users from accessing guest routes
  if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})
```

## 📦 State Management (Pinia)

### Store Structure

```typescript
// stores/driver.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DriversApi } from '@/services/api/drivers'
import type { Driver } from '@/types/models'

export const useDriverStore = defineStore('driver', () => {
  // State
  const drivers = ref<Driver[]>([])
  const currentDriver = ref<Driver | null>(null)
  const loading = ref(false)

  // Getters
  const activeDrivers = computed(() => {
    return drivers.value.filter(d => d.is_active)
  })

  const getDriverById = computed(() => {
    return (id: number) => drivers.value.find(d => d.id === id)
  })

  // Actions
  const fetchDrivers = async () => {
    loading.value = true
    try {
      const response = await DriversApi.getAll()
      drivers.value = response.data
    } finally {
      loading.value = false
    }
  }

  const fetchDriver = async (id: number) => {
    loading.value = true
    try {
      const response = await DriversApi.getOne(id)
      currentDriver.value = response
    } finally {
      loading.value = false
    }
  }

  const createDriver = async (data: Partial<Driver>) => {
    const response = await DriversApi.create(data)
    drivers.value.push(response)
    return response
  }

  const updateDriver = async (id: number, data: Partial<Driver>) => {
    const response = await DriversApi.update(id, data)
    const index = drivers.value.findIndex(d => d.id === id)
    if (index !== -1) {
      drivers.value[index] = response
    }
    return response
  }

  const deleteDriver = async (id: number) => {
    await DriversApi.delete(id)
    drivers.value = drivers.value.filter(d => d.id !== id)
  }

  return {
    // State
    drivers,
    currentDriver,
    loading,
    // Getters
    activeDrivers,
    getDriverById,
    // Actions
    fetchDrivers,
    fetchDriver,
    createDriver,
    updateDriver,
    deleteDriver
  }
})
```

### Using Stores in Components

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useDriverStore } from '@/stores/driver'

const driverStore = useDriverStore()

onMounted(() => {
  driverStore.fetchDrivers()
})
</script>

<template>
  <div v-if="driverStore.loading">Loading...</div>
  <div v-else>
    <div v-for="driver in driverStore.activeDrivers" :key="driver.id">
      {{ driver.name }}
    </div>
  </div>
</template>
```

## 🌐 API Client

### Type-Safe API Services

```typescript
// services/api/drivers.ts
import { apiClient } from '../axios'
import type { Driver, ApiResponse } from '@/types/api.types'

export const DriversApi = {
  async getAll(): Promise<ApiResponse<Driver[]>> {
    const response = await apiClient.get<ApiResponse<Driver[]>>('/drivers')
    return response.data
  },

  async getOne(id: number): Promise<Driver> {
    const response = await apiClient.get<Driver>(`/drivers/${id}`)
    return response.data
  },

  async create(data: Partial<Driver>): Promise<Driver> {
    const response = await apiClient.post<Driver>('/drivers', data)
    return response.data
  },

  async update(id: number, data: Partial<Driver>): Promise<Driver> {
    const response = await apiClient.put<Driver>(`/drivers/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/drivers/${id}`)
  },

  async getStats(id?: number): Promise<any> {
    const params = id ? { driver_id: id } : {}
    const response = await apiClient.get('/stats/drivers', { params })
    return response.data
  }
}
```

### Axios Configuration

```typescript
// services/axios.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const toast = useToast()

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }

    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.')
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    return Promise.reject(error)
  }
)
```

## 📊 Charts & Visualizations

### Using Chart.js with Vue

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  lapTimes: number[]
  labels: string[]
}

const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Lap Times',
      backgroundColor: '#3498DB',
      borderColor: '#3498DB',
      data: props.lapTimes
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    },
    title: {
      display: true,
      text: 'Lap Time Progression'
    }
  }
}
</script>

<template>
  <div class="chart-container">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
}
</style>
```

## 🎯 Key Components

### Layout Components

#### MainLayout.vue
- **Purpose**: Application shell with header, navigation, and content area
- **Features**: Responsive sidebar, user menu, notifications

#### AppHeader.vue
- **Purpose**: Top navigation bar
- **Features**: Logo, search, user dropdown, admin link

#### AppSidebar.vue
- **Purpose**: Side navigation menu
- **Features**: Collapsible, active route highlighting

### Feature Components

#### DriverCard.vue
- **Purpose**: Display driver summary card
- **Props**: `driver: Driver`
- **Events**: `@click`, `@edit`, `@delete`

#### LapTimeTable.vue
- **Purpose**: Display lap times in table format
- **Props**: `laps: Lap[]`, `showDriver: boolean`
- **Features**: Sorting, filtering, highlighting best laps

#### SessionChart.vue
- **Purpose**: Visualize session lap times
- **Props**: `sessionId: number`
- **Features**: Line chart with hover details

#### DriverStatistics.vue
- **Purpose**: Display detailed driver statistics
- **Props**: `driverId: number`
- **Features**: Best lap, average, sessions count, charts

### Admin Components

#### UserManagement.vue
- **Purpose**: Manage users
- **Features**: Create, edit, delete users, assign roles

#### DataUpload.vue
- **Purpose**: Upload EML/CSV files
- **Features**: Drag & drop, batch upload, progress tracking

#### StyleEditor.vue
- **Purpose**: Customize application styling
- **Features**: Color picker, live preview, reset to defaults

## 🎨 Styling

### CSS Variables

The application uses CSS variables for theming:

```css
:root {
  --primary-color: #3498DB;
  --secondary-color: #2ECC71;
  --danger-color: #E74C3C;
  --warning-color: #F39C12;
  --text-color: #2C3E50;
  --background-color: #ECF0F1;
  --card-background: #FFFFFF;
  --border-color: #BDC3C7;
}
```

### Component Styling

Components use scoped styles:

```vue
<style scoped>
.driver-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.2s;
}

.driver-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.driver-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-color);
}
</style>
```

## 🔔 Notifications

### Using Toast Notifications

```typescript
import { useToast } from 'vue-toastification'

const toast = useToast()

// Success
toast.success('Driver created successfully!')

// Error
toast.error('Failed to load data')

// Warning
toast.warning('This action cannot be undone')

// Info
toast.info('Loading data...')
```

## ✅ Form Validation

### Using Composable for Validation

```typescript
// composables/useFormValidation.ts
import { ref, computed } from 'vue'
import { z } from 'zod'

export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const errors = ref<Record<string, string>>({})

  const validate = (data: unknown): data is T => {
    try {
      schema.parse(data)
      errors.value = {}
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.value = error.errors.reduce((acc, err) => {
          const path = err.path.join('.')
          acc[path] = err.message
          return acc
        }, {} as Record<string, string>)
      }
      return false
    }
  }

  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  return {
    errors,
    hasErrors,
    validate
  }
}
```

### Using in Components

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { z } from 'zod'

const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  is_active: z.boolean()
})

const form = ref({
  name: '',
  color: '#3498DB',
  is_active: true
})

const { errors, validate } = useFormValidation(driverSchema)

const submit = () => {
  if (validate(form.value)) {
    // Submit form
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <div>
      <input v-model="form.name" />
      <span v-if="errors.name">{{ errors.name }}</span>
    </div>
    <button type="submit">Submit</button>
  </form>
</template>
```

## 🧪 Testing

### Component Testing

```typescript
// __tests__/DriverCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DriverCard from '@/components/DriverCard.vue'

describe('DriverCard', () => {
  it('renders driver name', () => {
    const wrapper = mount(DriverCard, {
      props: {
        driver: {
          id: 1,
          name: 'John Doe',
          color: '#FF5733',
          is_active: true
        }
      }
    })

    expect(wrapper.text()).toContain('John Doe')
  })

  it('emits click event', async () => {
    const wrapper = mount(DriverCard, {
      props: {
        driver: {
          id: 1,
          name: 'John Doe',
          color: '#FF5733',
          is_active: true
        }
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### Store Testing

```typescript
// stores/__tests__/driver.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDriverStore } from '../driver'

describe('Driver Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds driver to state', () => {
    const store = useDriverStore()
    
    store.drivers.push({
      id: 1,
      name: 'John Doe',
      color: '#FF5733',
      is_active: true
    })

    expect(store.drivers).toHaveLength(1)
    expect(store.drivers[0].name).toBe('John Doe')
  })

  it('filters active drivers', () => {
    const store = useDriverStore()
    
    store.drivers = [
      { id: 1, name: 'Active', color: '#FF5733', is_active: true },
      { id: 2, name: 'Inactive', color: '#3498DB', is_active: false }
    ]

    expect(store.activeDrivers).toHaveLength(1)
    expect(store.activeDrivers[0].name).toBe('Active')
  })
})
```

## 🚀 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Outputs to `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 🎯 Best Practices

### Component Design

1. **Single Responsibility**: Each component should do one thing well
2. **Props Down, Events Up**: Data flows down via props, changes flow up via events
3. **Composition over Inheritance**: Use composables for shared logic
4. **Type Safety**: Use TypeScript for all components

### Performance

1. **Lazy Loading**: Use dynamic imports for routes
2. **Computed Properties**: Use for derived state
3. **Virtual Scrolling**: For long lists
4. **Debouncing**: For search inputs

### Code Organization

1. **Folder Structure**: Group related files together
2. **Naming Conventions**: Use PascalCase for components, camelCase for functions
3. **File Size**: Keep components under 300 lines
4. **Reusability**: Extract common logic to composables

## 📚 Further Reading

- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

*Last Updated: February 2026*
