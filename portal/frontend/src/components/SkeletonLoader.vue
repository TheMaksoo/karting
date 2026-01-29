<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    borderRadius?: string
    animate?: boolean
  }>(),
  {
    width: '100%',
    height: '1rem',
    borderRadius: '4px',
    animate: true,
  }
)
</script>

<template>
  <div
    class="skeleton"
    :class="{ 'skeleton--animated': animate }"
    :style="{
      width,
      height,
      borderRadius,
    }"
  />
</template>

<style scoped lang="scss">
.skeleton {
  background: var(--bg-tertiary, #2a2a4a);
  position: relative;
  overflow: hidden;

  &--animated {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
