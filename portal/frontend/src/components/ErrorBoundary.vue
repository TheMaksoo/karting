<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

interface ErrorInfo {
  message: string
  stack?: string
  component?: string
  timestamp: Date
}

const props = withDefaults(
  defineProps<{
    fallbackMessage?: string
    showDetails?: boolean
    onError?: (error: Error, info: ErrorInfo) => void
  }>(),
  {
    fallbackMessage: 'Something went wrong. Please try again.',
    showDetails: false,
  }
)

const hasError = ref(false)
const errorInfo = ref<ErrorInfo | null>(null)

onErrorCaptured((error: Error, instance, info: string) => {
  hasError.value = true
  errorInfo.value = {
    message: error.message,
    stack: error.stack,
    component: instance?.$options?.name || 'Unknown',
    timestamp: new Date(),
  }

  // Call custom error handler if provided
  props.onError?.(error, errorInfo.value)

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component:', instance)
    console.error('[ErrorBoundary] Info:', info)
  }

  // Prevent error from propagating
  return false
})

function reset() {
  hasError.value = false
  errorInfo.value = null
}

function reload() {
  window.location.reload()
}

// Expose for parent components
defineExpose({ reset, hasError })
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 class="error-title">Oops! Something went wrong</h2>
      <p class="error-message">{{ fallbackMessage }}</p>

      <div v-if="showDetails && errorInfo" class="error-details">
        <details>
          <summary>Error Details</summary>
          <div class="error-info">
            <p><strong>Message:</strong> {{ errorInfo.message }}</p>
            <p><strong>Component:</strong> {{ errorInfo.component }}</p>
            <p><strong>Time:</strong> {{ errorInfo.timestamp.toLocaleString() }}</p>
            <pre v-if="errorInfo.stack" class="error-stack">{{ errorInfo.stack }}</pre>
          </div>
        </details>
      </div>

      <div class="error-actions">
        <button class="btn btn-primary" @click="reset">
          Try Again
        </button>
        <button class="btn btn-secondary" @click="reload">
          Reload Page
        </button>
      </div>
    </div>
  </div>

  <!-- Render slot content when no error -->
  <slot v-else />
</template>

<style scoped lang="scss">
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
}

.error-container {
  max-width: 500px;
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 12px;
  border: 1px solid var(--border-color, #2a2a4a);
}

.error-icon {
  color: var(--color-danger, #ef4444);
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--text-secondary, #a0a0b0);
  margin-bottom: 1.5rem;
}

.error-details {
  text-align: left;
  margin-bottom: 1.5rem;

  details {
    background: var(--bg-tertiary, #0f0f1a);
    border-radius: 8px;
    padding: 0.75rem 1rem;

    summary {
      cursor: pointer;
      color: var(--text-secondary, #a0a0b0);
      font-size: 0.875rem;

      &:hover {
        color: var(--text-primary, #ffffff);
      }
    }
  }
}

.error-info {
  margin-top: 1rem;
  font-size: 0.875rem;

  p {
    margin: 0.25rem 0;
    color: var(--text-secondary, #a0a0b0);

    strong {
      color: var(--text-primary, #ffffff);
    }
  }
}

.error-stack {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-primary, #0a0a14);
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-danger, #ef4444);
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &-primary {
    background: var(--color-primary, #6366f1);
    color: white;

    &:hover {
      background: var(--color-primary-hover, #5558e3);
    }
  }

  &-secondary {
    background: var(--bg-tertiary, #2a2a4a);
    color: var(--text-primary, #ffffff);
    border: 1px solid var(--border-color, #3a3a5a);

    &:hover {
      background: var(--bg-secondary, #3a3a5a);
    }
  }
}
</style>
