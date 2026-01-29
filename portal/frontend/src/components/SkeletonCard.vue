<script setup lang="ts">
import SkeletonLoader from './SkeletonLoader.vue'

withDefaults(
  defineProps<{
    rows?: number
    showAvatar?: boolean
    showImage?: boolean
  }>(),
  {
    rows: 3,
    showAvatar: false,
    showImage: false,
  }
)
</script>

<template>
  <div class="skeleton-card">
    <!-- Optional image placeholder -->
    <SkeletonLoader
      v-if="showImage"
      class="skeleton-card__image"
      height="150px"
      border-radius="8px 8px 0 0"
    />

    <div class="skeleton-card__content">
      <!-- Header with optional avatar -->
      <div class="skeleton-card__header">
        <SkeletonLoader
          v-if="showAvatar"
          class="skeleton-card__avatar"
          width="40px"
          height="40px"
          border-radius="50%"
        />
        <div class="skeleton-card__header-text">
          <SkeletonLoader width="60%" height="1.25rem" />
          <SkeletonLoader width="40%" height="0.875rem" />
        </div>
      </div>

      <!-- Content rows -->
      <div class="skeleton-card__body">
        <SkeletonLoader
          v-for="i in rows"
          :key="i"
          :width="i === rows ? '70%' : '100%'"
          height="0.875rem"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.skeleton-card {
  background: var(--bg-secondary, #1a1a2e);
  border-radius: 8px;
  border: 1px solid var(--border-color, #2a2a4a);
  overflow: hidden;

  &__content {
    padding: 1rem;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  &__header-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
