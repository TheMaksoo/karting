<template>
  <div class="register-container">
    <div class="racing-lines"></div>
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
    
    <div class="register-card">
      <div class="logo-section">
        <div class="logo-icon">🏎️</div>
        <h1>Join Karting Dashboard</h1>
        <p>Create an account to track your performance</p>
      </div>

      <!-- Success Message -->
      <div v-if="registrationComplete" class="success-message">
        <div class="success-icon">✅</div>
        <h2>Registration Submitted!</h2>
        <p>Your account is pending approval. An administrator will review your request shortly.</p>
        <router-link to="/karting/login" class="back-to-login">
          <span>← Back to Login</span>
        </router-link>
      </div>

      <!-- Registration Form -->
      <form v-else @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name">
            <i class="icon">👤</i>
            Full Name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="John Doe"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="display_name">
            <i class="icon">🏷️</i>
            Display Name (optional)
          </label>
          <input
            id="display_name"
            v-model="form.display_name"
            type="text"
            placeholder="JohnnyRacer"
            autocomplete="nickname"
          />
          <span class="field-hint">How you want to appear on leaderboards</span>
        </div>

        <div class="form-group">
          <label for="email">
            <i class="icon">📧</i>
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <i class="icon">🔒</i>
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            minlength="8"
            autocomplete="new-password"
          />
          <span class="field-hint">Minimum 8 characters</span>
        </div>

        <div class="form-group">
          <label for="password_confirmation">
            <i class="icon">🔐</i>
            Confirm Password
          </label>
          <input
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="new-password"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="register-button" :disabled="loading">
          <span class="button-text">{{ loading ? 'Registering...' : 'Create Account' }}</span>
          <span class="button-icon">→</span>
        </button>
      </form>

      <div v-if="!registrationComplete" class="help-text">
        <p>Already have an account? <router-link to="/karting/login">Login here</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import apiService from '@/services/api'

const loading = ref(false)
const error = ref('')
const registrationComplete = ref(false)

const form = reactive({
  name: '',
  display_name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

async function handleRegister() {
  error.value = ''
  
  if (form.password !== form.password_confirmation) {
    error.value = 'Passwords do not match'
    return
  }

  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true
  
  try {
    await apiService.post('/auth/register', {
      name: form.name,
      display_name: form.display_name || null,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation
    })
    
    registrationComplete.value = true
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response: { data: { message?: string; errors?: Record<string, string[]> } } }).response
      if (response.data?.errors) {
        const firstError = Object.values(response.data.errors)[0]
        error.value = Array.isArray(firstError) && firstError[0] ? firstError[0] : 'Validation failed'
      } else {
        error.value = response.data?.message || 'Registration failed. Please try again.'
      }
    } else {
      error.value = 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:root {
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #1C2128;
  --card-bg: linear-gradient(135deg, #1C2128, #21262D);
  --border-color: rgba(48, 54, 61, 0.8);
  --border-light: rgba(56, 139, 253, 0.4);
  --text-primary: #F0F6FC;
  --text-secondary: #8B949E;
  --primary-color: #58A6FF;
  --accent-color: #F97316;
  --success-color: #10B981;
  --error-bg: rgba(239, 68, 68, 0.1);
  --error-border: rgba(239, 68, 68, 0.3);
  --error-text: #FCA5A5;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}

.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0D1117 0%, #1a1f2e 50%, #0f1419 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

/* Animated racing lines */
.racing-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(88, 166, 255, 0.03) 50px,
      rgba(88, 166, 255, 0.03) 52px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(249, 115, 22, 0.03) 50px,
      rgba(249, 115, 22, 0.03) 52px
    );
  animation: racingLines 20s linear infinite;
  pointer-events: none;
}

@keyframes racingLines {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

/* Floating shapes */
.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  animation: float 15s ease-in-out infinite;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #10B981, transparent);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #F97316, transparent);
  bottom: -100px;
  right: -100px;
  animation-delay: 5s;
}

.shape-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #58A6FF, transparent);
  top: 50%;
  left: 50%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.register-card {
  background: rgba(28, 33, 40, 0.85);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 
    var(--shadow-lg),
    0 0 80px rgba(16, 185, 129, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 1.875rem;
  width: 100%;
  max-width: 380px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px) saturate(180%);
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: bounce 2s ease-in-out infinite;
  display: inline-block;
  filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-section h1 {
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  background: linear-gradient(135deg, #10B981 0%, #58A6FF 50%, #F97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.logo-section p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  animation: fadeIn 0.6s ease-out backwards;
}

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.15s; }
.form-group:nth-child(3) { animation-delay: 0.2s; }
.form-group:nth-child(4) { animation-delay: 0.25s; }
.form-group:nth-child(5) { animation-delay: 0.3s; }

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group label .icon {
  font-size: 0.9rem;
  opacity: 0.7;
}

.form-group input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  background: rgba(22, 27, 34, 0.5);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  font-family: inherit;
}

.form-group input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.form-group input:focus {
  outline: none;
  border-color: var(--success-color);
  box-shadow: 
    0 0 0 3px rgba(16, 185, 129, 0.15),
    0 0 20px rgba(16, 185, 129, 0.1);
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.field-hint {
  font-size: 0.65rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.error-message {
  background: var(--error-bg);
  color: var(--error-text);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  border: 1px solid var(--error-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-message::before {
  content: '⚠️';
  font-size: 1rem;
}

.success-message {
  text-align: center;
  padding: 1.5rem 0;
  animation: fadeIn 0.6s ease-out;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-message h2 {
  color: var(--success-color);
  font-size: 1.25rem;
  margin: 0 0 0.75rem 0;
}

.success-message p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.back-to-login {
  display: inline-block;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-color);
  transition: all var(--transition-fast);
}

.back-to-login:hover {
  background: rgba(88, 166, 255, 0.1);
  transform: translateY(-2px);
}

.register-button {
  background: linear-gradient(135deg, #10B981, #58A6FF);
  color: white;
  border: none;
  padding: 0.65625rem 0.9375rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 
    var(--shadow-sm),
    0 0 20px rgba(16, 185, 129, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  animation: fadeIn 0.6s ease-out 0.35s backwards;
}

.register-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.register-button:hover::before {
  left: 100%;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    var(--shadow-md),
    0 0 30px rgba(16, 185, 129, 0.4);
  filter: brightness(1.1);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-text {
  position: relative;
  z-index: 1;
}

.button-icon {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
}

.register-button:hover:not(:disabled) .button-icon {
  transform: translateX(5px);
}

.help-text {
  margin-top: 0.875rem;
  text-align: center;
  padding-top: 0.875rem;
  border-top: 1px solid var(--border-color);
  animation: fadeIn 0.6s ease-out 0.4s backwards;
}

.help-text p {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin: 0;
  font-weight: 500;
}

.help-text a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.help-text a:hover {
  color: var(--success-color);
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .register-container {
    padding: 1rem 0.75rem;
  }
  
  .register-card {
    padding: 1.5rem 1.125rem;
    max-width: 100%;
  }
  
  .logo-icon {
    font-size: 2.25rem;
  }
  
  .logo-section h1 {
    font-size: 1.2rem;
  }
  
  .logo-section p {
    font-size: 0.75rem;
  }
  
  .register-form {
    gap: 0.7rem;
  }
  
  .form-group input {
    padding: 0.5rem 0.65rem;
    font-size: 0.7rem;
  }
  
  .register-button {
    padding: 0.6rem 0.75rem;
    font-size: 0.7rem;
  }
  
  .shape {
    filter: blur(40px);
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 1.125rem 0.75rem;
    border-radius: var(--radius-md);
  }
  
  .logo-section {
    margin-bottom: 1rem;
  }
  
  .logo-icon {
    font-size: 1.875rem;
  }
  
  .logo-section h1 {
    font-size: 1.1rem;
  }
  
  .logo-section p {
    font-size: 0.65rem;
  }
  
  .form-group label {
    font-size: 0.7rem;
  }
  
  .form-group input {
    padding: 0.45rem 0.6rem;
    font-size: 0.65rem;
  }
  
  .register-button {
    padding: 0.55rem 0.75rem;
    font-size: 0.65rem;
  }
  
  .error-message {
    padding: 0.5rem 0.65rem;
    font-size: 0.65rem;
  }
  
  .help-text p {
    font-size: 0.6rem;
  }
  
  .shape {
    filter: blur(30px);
  }
}
</style>
