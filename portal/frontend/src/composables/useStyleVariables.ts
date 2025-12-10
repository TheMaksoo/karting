import { ref, onMounted } from 'vue'

export interface StyleVariable {
  id: number
  key: string
  value: string
  category: string
  label: string
  description?: string
  type: 'color' | 'size' | 'number' | 'string'
  metadata?: {
    min?: string
    max?: string
    unit?: string
  }
}

export interface GroupedStyleVariables {
  [category: string]: StyleVariable[]
}

export function useStyleVariables() {
  const variables = ref<GroupedStyleVariables>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchVariables = async () => {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('api_token')
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${API_BASE}/style-variables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      variables.value = data.variables || {}
      applyStyles()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch style variables'
      console.error('Error fetching style variables:', err)
    } finally {
      loading.value = false
    }
  }

  const updateVariable = async (id: number, value: string) => {
    try {
      const token = localStorage.getItem('api_token')
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${API_BASE}/style-variables/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ value })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      await fetchVariables()
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to update variable'
      console.error('Error updating variable:', err)
      return false
    }
  }

  const bulkUpdate = async (updates: { id: number; value: string }[]) => {
    try {
      const token = localStorage.getItem('api_token')
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${API_BASE}/style-variables/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ variables: updates })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      await fetchVariables()
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to bulk update variables'
      console.error('Error bulk updating variables:', err)
      return false
    }
  }

  const reset = async () => {
    try {
      const token = localStorage.getItem('api_token')
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const response = await fetch(`${API_BASE}/style-variables/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      await fetchVariables()
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to reset variables'
      console.error('Error resetting variables:', err)
      return false
    }
  }

  const applyStyles = () => {
    const root = document.documentElement
    Object.values(variables.value).flat().forEach((variable: StyleVariable) => {
      root.style.setProperty(`--${variable.key}`, variable.value)
    })
  }

  onMounted(() => {
    fetchVariables()
  })

  return {
    variables,
    loading,
    error,
    fetchVariables,
    updateVariable,
    bulkUpdate,
    reset,
    applyStyles
  }
}
