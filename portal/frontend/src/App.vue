<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useStyleVariables } from '@/composables/useStyleVariables'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

// Load dynamic styles from database
useStyleVariables()

function handleGlobalError(error: Error, info: { message: string; component?: string }) {
  // Could send to error tracking service (Sentry, etc.)
  console.error('[App] Global error:', error.message, 'in', info.component)
}
</script>

<template>
  <div class="solyx-shell">
    <!-- Solyx top nav -->
    <nav class="solyx-nav">
      <a class="solyx-logo" href="https://solyx.gg">
        <img src="https://solyx.gg/assets/SolyxIcon.png" alt="Solyx" />
        <span>SOLYX</span>
      </a>
      <div class="solyx-nav-links">
        <a href="https://solyx.gg/solyx-discord-bot/">Discord Bot</a>
        <a href="https://solyx.gg/SolyxWebGame/">Web Game</a>
        <a href="https://solyx.gg/mods/train-station-monitor/">Factorio Mod</a>
        <a href="https://solyx.gg/karting/" class="solyx-active">Karting</a>
      </div>
    </nav>

    <!-- App content -->
    <div class="solyx-content">
      <ErrorBoundary
        fallback-message="The application encountered an error. Please try refreshing the page."
        :show-details="true"
        :on-error="handleGlobalError"
      >
        <RouterView />
      </ErrorBoundary>
    </div>

    <!-- Solyx footer -->
    <footer class="solyx-footer">
      <div class="solyx-footer-logo">
        <img src="https://solyx.gg/assets/SolyxIcon.png" alt="Solyx" />
        <span>SOLYX</span>
      </div>
      <div class="solyx-footer-links">
        <a href="https://solyx.gg">Home</a>
        <a href="https://solyx.gg/solyx-discord-bot/">Discord Bot</a>
        <a href="https://solyx.gg/SolyxWebGame/">Web Game</a>
        <a href="https://solyx.gg/mods/train-station-monitor/">Factorio Mod</a>
        <a href="https://solyx.gg/karting/" class="solyx-active">Karting</a>
        <a href="https://solyx.gg/contact.php">Contact</a>
      </div>
      <div class="solyx-footer-copy">&copy; 2026 Solyx IT Solutions</div>
    </footer>
  </div>
</template>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/home-sections.scss';

/* Global full-screen dark mode styling */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

/* Solyx shell */
.solyx-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.solyx-nav {
  flex-shrink: 0;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 32px;
  background: rgba(11,11,13,.95);
  border-bottom: 1px solid #26262e;
  z-index: 1000;
}
.solyx-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  color: #ecebef;
}
.solyx-logo img {
  height: 26px;
  filter: drop-shadow(0 2px 6px rgba(232,69,42,.45));
}
.solyx-logo span {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 3px;
  color: #ecebef;
}
.solyx-nav-links {
  display: flex;
  gap: 22px;
  margin-left: 8px;
}
.solyx-nav-links a {
  font-size: 13px;
  font-weight: 500;
  color: #9a99a3;
  text-decoration: none;
  transition: color .15s;
}
.solyx-nav-links a:hover { color: #ecebef; }
.solyx-nav-links a.solyx-active { color: #ecebef; }

.solyx-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.solyx-footer {
  flex-shrink: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: #121216;
  border-top: 1px solid #26262e;
  gap: 16px;
}
.solyx-footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.solyx-footer-logo img {
  height: 20px;
  filter: drop-shadow(0 1px 4px rgba(232,69,42,.4));
}
.solyx-footer-logo span {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 3px;
  color: #ecebef;
}
.solyx-footer-links {
  display: flex;
  gap: 16px;
}
.solyx-footer-links a {
  font-size: 12px;
  color: #5c5b64;
  text-decoration: none;
  transition: color .15s;
}
.solyx-footer-links a:hover { color: #e8452a; }
.solyx-footer-links a.solyx-active { color: #9a99a3; }
.solyx-footer-copy {
  font-size: 11px;
  color: #3a3840;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .solyx-nav-links { display: none; }
  .solyx-footer-links { display: none; }
  .solyx-footer-copy { display: none; }
}
</style>