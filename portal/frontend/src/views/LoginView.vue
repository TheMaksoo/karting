<template>
  <div class="login-container">
    <div class="racing-lines"></div>
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
    
    <div class="login-card">
      <div class="logo-section">
        <div class="logo-icon">🏎️</div>
        <h1>Karting Dashboard</h1>
        <p>Track your performance, beat your records</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">
            <i class="icon">📧</i>
            Email
          </label>
          <input
            id="email"
            v-model="email"
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
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button type="submit" class="login-button" :disabled="authStore.loading">
          <span class="button-text">{{ authStore.loading ? 'Logging in...' : 'Login' }}</span>
          <span class="button-icon">→</span>
        </button>
      </form>

      <div class="help-text">
        <p>💡 Contact your administrator for login credentials</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  try {
    await authStore.login(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (error) {
    console.error('Login failed:', error)
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

.login-container {
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
  background: radial-gradient(circle, #58A6FF, transparent);
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
  background: radial-gradient(circle, #10B981, transparent);
  top: 50%;
  left: 50%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.login-card {
  background: rgba(28, 33, 40, 0.85);
  border: 1px solid rgba(88, 166, 255, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 
    var(--shadow-lg),
    0 0 80px rgba(88, 166, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 1.875rem;
  width: 100%;
  max-width: 315px;
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
  filter: drop-shadow(0 4px 12px rgba(88, 166, 255, 0.3));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-section h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  background: linear-gradient(135deg, #58A6FF 0%, #F97316 50%, #10B981 100%);
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

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.9375rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: fadeIn 0.6s ease-out backwards;
}

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }

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
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group label .icon {
  font-size: 1rem;
  opacity: 0.7;
}

.form-group input {
  padding: 0.5625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.703125rem;
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
  border-color: var(--primary-color);
  box-shadow: 
    0 0 0 3px rgba(88, 166, 255, 0.15),
    0 0 20px rgba(88, 166, 255, 0.1);
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.error-message {
  background: var(--error-bg);
  color: var(--error-text);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
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

.login-button {
  background: linear-gradient(135deg, #58A6FF, #F97316);
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
    0 0 20px rgba(88, 166, 255, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  animation: fadeIn 0.6s ease-out 0.3s backwards;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-button:hover::before {
  left: 100%;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    var(--shadow-md),
    0 0 30px rgba(88, 166, 255, 0.4);
  filter: brightness(1.1);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
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

.login-button:hover:not(:disabled) .button-icon {
  transform: translateX(5px);
}

.help-text {
  margin-top: 0.9375rem;
  text-align: center;
  padding-top: 0.9375rem;
  border-top: 1px solid var(--border-color);
  animation: fadeIn 0.6s ease-out 0.4s backwards;
}

.help-text p {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin: 0;
  font-weight: 500;
  opacity: 0.7;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem 0.75rem;
  }
  
  .login-card {
    padding: 1.5rem 1.125rem;
    max-width: 100%;
  }
  
  .logo-icon {
    font-size: 2.25rem;
  }
  
  .logo-section h1 {
    font-size: 1.3125rem;
  }
  
  .logo-section p {
    font-size: 0.609375rem;
  }
  
  .login-form {
    gap: 0.75rem;
  }
  
  .form-group input {
    padding: 0.525rem 0.675rem;
    font-size: 0.703125rem;
  }
  
  .login-button {
    padding: 0.6rem 0.75rem;
    font-size: 0.703125rem;
  }
  
  .shape {
    filter: blur(40px);
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.125rem 0.75rem;
    border-radius: var(--radius-md);
  }
  
  .logo-section {
    margin-bottom: 1.125rem;
  }
  
  .logo-icon {
    font-size: 1.875rem;
  }
  
  .logo-section h1 {
    font-size: 1.125rem;
  }
  
  .logo-section p {
    font-size: 0.5625rem;
  }
  
  .form-group label {
    font-size: 0.609375rem;
  }
  
  .form-group input {
    padding: 0.4875rem 0.6375rem;
    font-size: 0.609375rem;
  }
  
  .login-button {
    padding: 0.5625rem 0.75rem;
    font-size: 0.65625rem;
  }
  
  .error-message {
    padding: 0.4875rem 0.6375rem;
    font-size: 0.65625rem;
  }
  
  .help-text p {
    font-size: 0.515625rem;
  }
  
  .shape {
    filter: blur(30px);
  }
}

@media (max-width: 374px) {
  .login-card {
    padding: 0.9375rem 0.6375rem;
  }
  
  .logo-icon {
    font-size: 1.5rem;
  }
  
  .logo-section h1 {
    font-size: 1.03125rem;
  }
  
  .form-group input {
    padding: 0.45rem 0.5625rem;
    font-size: 0.5625rem;
  }
  
  .login-button {
    padding: 0.525rem 0.675rem;
    font-size: 0.609375rem;
  }
}
</style>
