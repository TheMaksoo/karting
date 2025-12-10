<!-- Example Component Using Dynamic Styles -->
<template>
  <div class="example-card">
    <h2 class="card-title">Dynamic Styling Example</h2>
    <p class="card-text">
      This component automatically uses styles from the database.
      Change them in the admin panel and see them update instantly!
    </p>
    
    <div class="color-showcase">
      <div class="color-box primary">Primary</div>
      <div class="color-box accent">Accent</div>
      <div class="color-box success">Success</div>
    </div>
    
    <button class="styled-button">Styled Button</button>
  </div>
</template>

<style scoped lang="scss">
.example-card {
  // Using dynamic CSS variables
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  
  &:hover {
    border-color: var(--border-light);
    box-shadow: var(--shadow-lg);
  }
}

.card-title {
  color: var(--text-primary);
  font-size: var(--text-2xl);
  font-family: var(--font-display);
  margin-bottom: var(--spacing-3);
}

.card-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: 1.6;
  margin-bottom: var(--spacing-4);
}

.color-showcase {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.color-box {
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  color: white;
  text-align: center;
  flex: 1;
  
  &.primary {
    background: var(--primary-color);
  }
  
  &.accent {
    background: var(--accent);
  }
  
  &.success {
    background: var(--success-color);
  }
}

.styled-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  
  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style>
