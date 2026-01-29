import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { type PluginOptions, POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

// Toast notification options
const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
}

const app = createApp(App)

// Global error handler for uncaught Vue errors
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err)
  console.error('[Vue Error] Component:', instance?.$options?.name || 'Unknown')
  console.error('[Vue Error] Info:', info)

  // Could send to error tracking service (Sentry, Bugsnag, etc.)
  // errorTrackingService.captureException(err, { extra: { component, info } })
}

// Global warning handler (development only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('[Vue Warning]', msg)
    if (trace) console.warn('[Vue Warning] Trace:', trace)
  }
}

app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions)

app.mount('#app')
