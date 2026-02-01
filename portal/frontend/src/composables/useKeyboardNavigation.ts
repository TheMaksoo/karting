/**
 * Keyboard Navigation Composable - Accessible keyboard navigation for lists.
 *
 * @module composables/useKeyboardNavigation
 */

import { ref, onUnmounted, type Ref } from 'vue'

/**
 * Options for keyboard navigation.
 */
export interface KeyboardNavigationOptions {
  /** Items to navigate through */
  items: Ref<unknown[]>
  /** Callback when an item is selected (Enter key) */
  onSelect?: (index: number) => void
  /** Callback when navigation changes */
  onNavigate?: (index: number) => void
  /** Whether to loop around when reaching the end */
  loop?: boolean
  /** Whether to enable type-ahead search */
  typeAhead?: boolean
}

/**
 * Keyboard navigation composable for lists and dropdowns.
 *
 * @param options - Navigation options
 * @returns Navigation state and handlers
 *
 * @example
 * ```vue
 * <script setup>
 * import { useKeyboardNavigation } from '@/composables/useKeyboardNavigation'
 *
 * const items = ref(['Item 1', 'Item 2', 'Item 3'])
 * const { activeIndex, handleKeydown } = useKeyboardNavigation({
 *   items,
 *   onSelect: (index) => console.log('Selected:', items.value[index])
 * })
 * </script>
 * ```
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const { items, onSelect, onNavigate, loop = true, typeAhead = false } = options

  /**
   * Currently focused item index.
   */
  const activeIndex = ref(-1)

  /**
   * Type-ahead search buffer.
   */
  const searchBuffer = ref('')

  /**
   * Type-ahead timeout handle.
   */
  let searchTimeout: number | null = null

  /**
   * Move to the next item.
   */
  function moveNext(): void {
    if (items.value.length === 0) return

    if (activeIndex.value < items.value.length - 1) {
      activeIndex.value++
    } else if (loop) {
      activeIndex.value = 0
    }

    onNavigate?.(activeIndex.value)
  }

  /**
   * Move to the previous item.
   */
  function movePrev(): void {
    if (items.value.length === 0) return

    if (activeIndex.value > 0) {
      activeIndex.value--
    } else if (loop) {
      activeIndex.value = items.value.length - 1
    }

    onNavigate?.(activeIndex.value)
  }

  /**
   * Move to the first item.
   */
  function moveFirst(): void {
    if (items.value.length === 0) return
    activeIndex.value = 0
    onNavigate?.(activeIndex.value)
  }

  /**
   * Move to the last item.
   */
  function moveLast(): void {
    if (items.value.length === 0) return
    activeIndex.value = items.value.length - 1
    onNavigate?.(activeIndex.value)
  }

  /**
   * Select the current item.
   */
  function selectCurrent(): void {
    if (activeIndex.value >= 0 && activeIndex.value < items.value.length) {
      onSelect?.(activeIndex.value)
    }
  }

  /**
   * Handle type-ahead search.
   *
   * @param char - Character typed
   */
  function handleTypeAhead(char: string): void {
    if (!typeAhead) return

    // Clear existing timeout
    if (searchTimeout) {
      window.clearTimeout(searchTimeout)
    }

    // Add to search buffer
    searchBuffer.value += char.toLowerCase()

    // Find matching item
    const matchIndex = items.value.findIndex((item) => {
      const text = typeof item === 'string' ? item : (item as { name?: string }).name ?? ''
      return text.toLowerCase().startsWith(searchBuffer.value)
    })

    if (matchIndex >= 0) {
      activeIndex.value = matchIndex
      onNavigate?.(activeIndex.value)
    }

    // Clear buffer after delay
    searchTimeout = window.setTimeout(() => {
      searchBuffer.value = ''
    }, 500)
  }

  /**
   * Handle keydown events.
   *
   * @param event - Keyboard event
   */
  function handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveNext()
        break
      case 'ArrowUp':
        event.preventDefault()
        movePrev()
        break
      case 'Home':
        event.preventDefault()
        moveFirst()
        break
      case 'End':
        event.preventDefault()
        moveLast()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectCurrent()
        break
      case 'Escape':
        activeIndex.value = -1
        break
      default:
        // Handle type-ahead for printable characters
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          handleTypeAhead(event.key)
        }
    }
  }

  /**
   * Reset navigation state.
   */
  function reset(): void {
    activeIndex.value = -1
    searchBuffer.value = ''
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (searchTimeout) {
      window.clearTimeout(searchTimeout)
    }
  })

  return {
    /** Currently active/focused item index */
    activeIndex,
    /** Handle keydown events - attach to container element */
    handleKeydown,
    /** Move to next item */
    moveNext,
    /** Move to previous item */
    movePrev,
    /** Move to first item */
    moveFirst,
    /** Move to last item */
    moveLast,
    /** Select current item */
    selectCurrent,
    /** Reset navigation state */
    reset,
  }
}

export default useKeyboardNavigation
