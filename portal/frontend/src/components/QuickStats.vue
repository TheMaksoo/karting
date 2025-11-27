<template>
  <div v-for="category in statCategories" :key="category.title" class="stat-category">
    <h2 class="category-title">{{ category.title }}</h2>
    <div class="stats-grid">
      <div
        v-for="(stat, index) in category.stats"
        :key="index"
        class="stat-card"
        :style="{ background: stat.color }"
        :title="stat.tooltip"
      >
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Stat {
  icon: string
  label: string
  value: string | number
  color: string
  tooltip: string
}

interface StatCategory {
  title: string
  stats: Stat[]
}

const props = defineProps<{
  statCategories: StatCategory[]
}>()
</script>

<style scoped>
.stat-category {
  margin-bottom: 2rem;
}

.category-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
  border-left: 4px solid var(--primary-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.stat-card {
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  transition: all var(--transition-normal);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  flex-direction: row;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent);
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 0;
}

.stat-card::after {
  content: attr(title);
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  color: #F9FAFB;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
  white-space: normal;
  max-width: 280px;
  min-width: 200px;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5),
              0 8px 10px -6px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
}

.stat-card:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.stat-card:hover {
  transform: translateY(-2px);
  z-index: 10;
  border-color: var(--border-light);
  box-shadow: var(--shadow-lg);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-2);
}

.stat-value {
  font-size: 2rem;
  font-weight: var(--font-bold);
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  font-family: var(--font-mono);
  line-height: var(--leading-tight);
}

.stat-label {
  font-size: 1rem;
  color: rgba(255,255,255,0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

/* Tablet */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .stat-icon {
    font-size: 3rem;
  }
  
  .stat-value {
    font-size: 1.75rem;
  }
  
  .stat-label {
    font-size: 0.95rem;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-3);
  }
  
  .stat-card {
    padding: var(--spacing-5);
  }
  
  .stat-icon {
    font-size: 2.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.85rem;
  }
  
  .category-title {
    font-size: 1.25rem;
  }
}

/* Small Mobile */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    flex-direction: column;
    padding: var(--spacing-4);
  }
  
  .stat-icon {
    font-size: 2.25rem;
  }
  
  .stat-value {
    font-size: 1.35rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
}
</style>
