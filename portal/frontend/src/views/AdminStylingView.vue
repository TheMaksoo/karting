<template>
  <div class="styling-admin">
    <div class="header">
      <h1>🎨 Style Editor</h1>
      <p class="subtitle">Customize the appearance of your dashboard</p>
      <div class="header-actions">
        <button @click="handleReset" class="btn-reset" :disabled="loading">
          <span class="icon">↺</span> Reset to Defaults
        </button>
        <button @click="handleSave" class="btn-save" :disabled="loading || !hasChanges">
          <span class="icon">✓</span> Save Changes
        </button>
      </div>
    </div>

    <div v-if="loading && Object.keys(variables).length === 0" class="loading">
      <div class="spinner"></div>
      <p>Loading style variables...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <span class="icon">⚠️</span>
      {{ error }}
    </div>

    <div v-else class="content">
      <div class="tabs">
        <button
          v-for="category in categories"
          :key="category"
          @click="activeCategory = category"
          :class="['tab', { active: activeCategory === category }]"
        >
          {{ getCategoryIcon(category) }} {{ formatCategory(category) }}
        </button>
      </div>

      <div class="category-content">
        <div v-if="activeCategory && variables[activeCategory]" class="variables-grid">
          <div
            v-for="variable in variables[activeCategory]"
            :key="variable.id"
            class="variable-card"
          >
            <div class="variable-header">
              <label :for="`var-${variable.id}`" class="variable-label">
                {{ variable.label }}
              </label>
              <span v-if="variable.description" class="variable-description">
                {{ variable.description }}
              </span>
            </div>

            <div class="variable-input">
              <!-- Color Picker -->
              <div v-if="variable.type === 'color'" class="input-group color-group">
                <input
                  :id="`var-${variable.id}`"
                  type="color"
                  :value="getVariableValue(variable.id)"
                  @input="(e) => updateLocalValue(variable.id, (e.target as HTMLInputElement).value)"
                  class="color-picker"
                />
                <input
                  type="text"
                  :value="getVariableValue(variable.id)"
                  @input="(e) => updateLocalValue(variable.id, (e.target as HTMLInputElement).value)"
                  class="text-input"
                  placeholder="#000000"
                />
                <div
                  class="color-preview"
                  :style="{ backgroundColor: getVariableValue(variable.id) }"
                ></div>
              </div>

              <!-- Size Input -->
              <div v-else-if="variable.type === 'size'" class="input-group size-group">
                <input
                  :id="`var-${variable.id}`"
                  type="text"
                  :value="getVariableValue(variable.id)"
                  @input="(e) => updateLocalValue(variable.id, (e.target as HTMLInputElement).value)"
                  class="text-input"
                  :placeholder="variable.metadata?.unit || 'rem'"
                />
                <span class="input-hint">{{ variable.metadata?.unit || '' }}</span>
              </div>

              <!-- Number Input -->
              <div v-else-if="variable.type === 'number'" class="input-group">
                <input
                  :id="`var-${variable.id}`"
                  type="number"
                  :value="getVariableValue(variable.id)"
                  @input="(e) => updateLocalValue(variable.id, (e.target as HTMLInputElement).value)"
                  :min="variable.metadata?.min"
                  :max="variable.metadata?.max"
                  class="text-input"
                />
              </div>

              <!-- String/Font Input -->
              <div v-else class="input-group">
                <input
                  :id="`var-${variable.id}`"
                  type="text"
                  :value="getVariableValue(variable.id)"
                  @input="(e) => updateLocalValue(variable.id, (e.target as HTMLInputElement).value)"
                  class="text-input"
                />
              </div>
            </div>

            <div class="variable-key">
              <code>--{{ variable.key }}</code>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasChanges" class="changes-indicator">
        <span class="icon">●</span> You have unsaved changes
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStyleVariables } from '@/composables/useStyleVariables'

const { variables, loading, error, bulkUpdate, reset, applyStyles } = useStyleVariables()

const activeCategory = ref('colors')
const localChanges = ref<Record<number, string>>({})

const categories = computed(() => {
  if (!variables.value || typeof variables.value !== 'object') return []
  return Object.keys(variables.value)
})
const hasChanges = computed(() => Object.keys(localChanges.value).length > 0)

const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    colors: '🎨',
    spacing: '📏',
    typography: '📝',
    effects: '✨'
  }
  return icons[category] || '⚙️'
}

const getVariableValue = (id: number) => {
  if (localChanges.value[id] !== undefined) {
    return localChanges.value[id]
  }
  
  for (const categoryVars of Object.values(variables.value)) {
    if (!Array.isArray(categoryVars)) continue
    const variable = categoryVars.find((v: any) => v.id === id)
    if (variable) return variable.value
  }
  
  return ''
}

const updateLocalValue = (id: number, value: string) => {
  localChanges.value[id] = value
  
  // Apply immediately for live preview
  let variable: any = null
  for (const categoryVars of Object.values(variables.value)) {
    if (!Array.isArray(categoryVars)) continue
    variable = categoryVars.find((v: any) => v.id === id)
    if (variable) break
  }
  
  if (variable) {
    document.documentElement.style.setProperty(`--${variable.key}`, value)
  }
}

const handleSave = async () => {
  const updates = Object.entries(localChanges.value).map(([id, value]) => ({
    id: Number(id),
    value
  }))

  const success = await bulkUpdate(updates)
  if (success) {
    localChanges.value = {}
    applyStyles()
  }
}

const handleReset = async () => {
  if (confirm('Are you sure you want to reset all styles to defaults?')) {
    const success = await reset()
    if (success) {
      localChanges.value = {}
    }
  }
}
</script>

<style scoped lang="scss">
.styling-admin {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
  color: #f9fafb;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #ff6b35 0%, #4ecdc4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #9ca3af;
    margin: 0 0 1.5rem 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;

    button {
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 1rem;

      .icon {
        font-size: 1.25rem;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-reset {
      background: rgba(255, 255, 255, 0.1);
      color: #f9fafb;
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }

    .btn-save {
      background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
      }
    }
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #9ca3af;

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1rem;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
}

.content {
  background: rgba(26, 31, 46, 0.5);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 20, 25, 0.5);

  .tab {
    flex: 1;
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    color: #9ca3af;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 3px solid transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #f9fafb;
    }

    &.active {
      color: #ff6b35;
      border-bottom-color: #ff6b35;
      background: rgba(255, 107, 53, 0.1);
    }
  }
}

.category-content {
  padding: 1.5rem;
  overflow-x: hidden;
}

.variables-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 1400px) {
  .variables-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .variables-grid {
    grid-template-columns: 1fr;
  }
}

.variable-card {
  background: rgba(37, 43, 58, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
}

.variable-header {
  margin-bottom: 0.75rem;

  .variable-label {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
    margin-bottom: 0.5rem;
  }

  .variable-description {
    display: block;
    font-size: 0.875rem;
    color: #9ca3af;
  }
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0;

  &.color-group {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
  }

  .color-picker {
    width: 4rem;
    height: 4rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: transparent;
  }

  .color-preview {
    width: 4rem;
    height: 4rem;
    border-radius: 0.5rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .text-input {
    flex: 1;
    padding: 1rem;
    background: rgba(15, 20, 25, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: #f9fafb;
    font-size: 1rem;
    font-family: 'Courier New', monospace;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #ff6b35;
      background: rgba(15, 20, 25, 0.8);
    }
  }

  .input-hint {
    color: #9ca3af;
    font-size: 1rem;
    min-width: 3rem;
  }
}

.variable-key {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  code {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    color: #4ecdc4;
    background: rgba(78, 205, 196, 0.1);
    padding: 1rem 1rem;
    border-radius: 0.25rem;
  }
}

.changes-indicator {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: rgba(255, 107, 53, 0.9);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
  font-size: 1rem;
  animation: pulse 2s infinite;

  .icon {
    font-size: 1rem;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
