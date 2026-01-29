<script setup lang="ts">
import SkeletonLoader from './SkeletonLoader.vue'

withDefaults(
  defineProps<{
    rows?: number
    columns?: number
    showHeader?: boolean
  }>(),
  {
    rows: 5,
    columns: 4,
    showHeader: true,
  }
)
</script>

<template>
  <div class="skeleton-table">
    <!-- Header row -->
    <div v-if="showHeader" class="skeleton-table__header">
      <SkeletonLoader
        v-for="col in columns"
        :key="`header-${col}`"
        :width="`${100 / columns - 2}%`"
        height="1rem"
      />
    </div>

    <!-- Body rows -->
    <div
      v-for="row in rows"
      :key="`row-${row}`"
      class="skeleton-table__row"
    >
      <SkeletonLoader
        v-for="col in columns"
        :key="`cell-${row}-${col}`"
        :width="`${100 / columns - 2}%`"
        height="0.875rem"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.skeleton-table {
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 8px;
  border: 1px solid var(--border-color, #2a2a4a);
  overflow: hidden;

  &__header {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-tertiary, #0f0f1a);
    border-bottom: 1px solid var(--border-color, #2a2a4a);
  }

  &__row {
    display: flex;
    gap: 1rem;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border-color, #2a2a4a);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
