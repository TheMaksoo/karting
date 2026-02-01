<template>
  <div
    role="listbox"
    :aria-label="ariaLabel"
    :aria-activedescendant="activeDescendant"
    :tabindex="disabled ? -1 : 0"
    class="accessible-dropdown"
    :class="{ open: isOpen, disabled }"
    @keydown="handleKeydown"
    @click="toggle"
    @blur="handleBlur"
  >
    <!-- Selected value display -->
    <div class="dropdown-trigger" :aria-expanded="isOpen">
      <span class="dropdown-value">{{ displayValue }}</span>
      <svg
        class="dropdown-arrow"
        :class="{ rotated: isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>

    <!-- Options list -->
    <Transition name="dropdown">
      <ul
        v-if="isOpen"
        ref="listRef"
        role="listbox"
        class="dropdown-list"
      >
        <li
          v-for="(option, index) in options"
          :id="`option-${index}`"
          :key="String(getOptionValue(option))"
          role="option"
          :aria-selected="isSelected(option)"
          class="dropdown-option"
          :class="{
            active: activeIndex === index,
            selected: isSelected(option),
          }"
          @click.stop="selectOption(option)"
          @mouseenter="activeIndex = index"
        >
          <slot name="option" :option="option" :index="index">
            {{ getOptionLabel(option) }}
          </slot>
          <svg
            v-if="isSelected(option)"
            class="check-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * AccessibleDropdown Component - Keyboard-navigable dropdown.
 *
 * @component
 * @example
 * ```vue
 * <AccessibleDropdown
 *   v-model="selectedTrack"
 *   :options="tracks"
 *   label-key="name"
 *   value-key="id"
 *   aria-label="Select a track"
 * />
 * ```
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'

interface Props {
  /** Currently selected value */
  modelValue?: unknown
  /** Options to display */
  options: unknown[]
  /** Key to use for option labels (for object options) */
  labelKey?: string
  /** Key to use for option values (for object options) */
  valueKey?: string
  /** Placeholder text when no option is selected */
  placeholder?: string
  /** ARIA label for the dropdown */
  ariaLabel?: string
  /** Whether the dropdown is disabled */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  labelKey: 'label',
  valueKey: 'value',
  placeholder: 'Select an option',
  ariaLabel: 'Dropdown',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  change: [value: unknown]
}>()

const isOpen = ref(false)
const listRef = ref<HTMLUListElement | null>(null)

const { activeIndex, handleKeydown: navKeydown, reset } = useKeyboardNavigation({
  items: computed(() => props.options),
  onSelect: (index) => selectOption(props.options[index]),
  loop: true,
  typeAhead: true,
})

/**
 * Get the label for an option.
 */
function getOptionLabel(option: unknown): string {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option)
  }
  return String((option as Record<string, unknown>)[props.labelKey] ?? option)
}

/**
 * Get the value for an option.
 */
function getOptionValue(option: unknown): unknown {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return (option as Record<string, unknown>)[props.valueKey]
}

/**
 * Check if an option is selected.
 */
function isSelected(option: unknown): boolean {
  return getOptionValue(option) === props.modelValue
}

/**
 * Display value for the trigger.
 */
const displayValue = computed(() => {
  const selected = props.options.find((opt) => getOptionValue(opt) === props.modelValue)
  return selected ? getOptionLabel(selected) : props.placeholder
})

/**
 * Active descendant ID for ARIA.
 */
const activeDescendant = computed(() => (activeIndex.value >= 0 ? `option-${activeIndex.value}` : undefined))

/**
 * Toggle dropdown open state.
 */
function toggle(): void {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // Set active index to selected item
    const selectedIndex = props.options.findIndex((opt) => isSelected(opt))
    activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0
  }
}

/**
 * Select an option and close.
 */
function selectOption(option: unknown): void {
  const value = getOptionValue(option)
  emit('update:modelValue', value)
  emit('change', value)
  isOpen.value = false
  reset()
}

/**
 * Handle blur - close dropdown.
 */
function handleBlur(event: FocusEvent): void {
  // Don't close if focus moves within the dropdown
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget?.closest('.accessible-dropdown')) return
  isOpen.value = false
  reset()
}

/**
 * Handle keyboard events.
 */
function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled) return

  switch (event.key) {
    case 'Enter':
    case ' ':
      if (!isOpen.value) {
        event.preventDefault()
        toggle()
      } else {
        navKeydown(event)
      }
      break
    case 'Escape':
      isOpen.value = false
      reset()
      break
    case 'ArrowDown':
    case 'ArrowUp':
      if (!isOpen.value) {
        event.preventDefault()
        isOpen.value = true
      } else {
        navKeydown(event)
      }
      break
    default:
      if (isOpen.value) {
        navKeydown(event)
      }
  }
}

// Scroll active option into view
watch(activeIndex, async (index) => {
  if (index >= 0 && listRef.value) {
    await nextTick()
    const activeOption = listRef.value.querySelector(`#option-${index}`)
    activeOption?.scrollIntoView({ block: 'nearest' })
  }
})
</script>

<style scoped>
.accessible-dropdown {
  position: relative;
  width: 100%;
  min-width: 200px;
  cursor: pointer;
}

.accessible-dropdown.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--color-bg, white);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.accessible-dropdown:focus {
  outline: none;
}

.accessible-dropdown:focus .dropdown-trigger {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.accessible-dropdown.open .dropdown-trigger {
  border-color: var(--color-primary, #3b82f6);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.dropdown-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  transition: transform 0.2s;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--color-bg, white);
  border: 1px solid var(--color-primary, #3b82f6);
  border-top: none;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-option:hover,
.dropdown-option.active {
  background-color: var(--color-bg-hover, #f3f4f6);
}

.dropdown-option.selected {
  font-weight: 600;
  color: var(--color-primary, #3b82f6);
}

.check-icon {
  color: var(--color-primary, #3b82f6);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Dark mode */
:root.dark .dropdown-trigger {
  background: var(--color-bg-dark, #1f2937);
  border-color: var(--color-border-dark, #374151);
  color: var(--color-text-dark, #e5e7eb);
}

:root.dark .dropdown-list {
  background: var(--color-bg-dark, #1f2937);
  border-color: var(--color-primary, #3b82f6);
}

:root.dark .dropdown-option:hover,
:root.dark .dropdown-option.active {
  background-color: var(--color-bg-hover-dark, #374151);
}
</style>
