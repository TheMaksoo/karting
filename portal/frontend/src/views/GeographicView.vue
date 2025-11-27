<template>
  <div class="geographic-view">
    <header class="page-header">
      <h1>🗺️ Geographic Analysis</h1>
      <p>Track locations and regional performance</p>
    </header>

    <div class="coming-soon">
      <h2>🚧 Under Construction</h2>
      <p>Interactive map with track locations, performance by region, and distance analytics coming soon!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Geographic view implementation coming next
</script>

<style scoped>
.geographic-view {
  max-width: 1400px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  color: #F0F6FC;
}

.page-header p {
  margin: 0;
  color: #8B949E;
  font-size: 16px;
}

.coming-soon {
  background: #1A1F26;
  border: 1px solid #30363D;
  border-radius: 12px;
  padding: 80px 40px;
  text-align: center;
}

.coming-soon h2 {
  margin: 0 0 16px 0;
  color: #F0F6FC;
  font-size: 28px;
}

.coming-soon p {
  margin: 0;
  color: #8B949E;
  font-size: 18px;
  max-width: 600px;
  margin: 0 auto;
}
</style>
