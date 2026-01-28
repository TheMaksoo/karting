declare module 'vue-toastification' {
  import { Plugin } from 'vue'

  export interface ToastOptions {
    type?: TYPE
    timeout?: number | false
    closeOnClick?: boolean
    pauseOnFocusLoss?: boolean
    pauseOnHover?: boolean
    draggable?: boolean
    draggablePercent?: number
    showCloseButtonOnHover?: boolean
    hideProgressBar?: boolean
    closeButton?: 'button' | boolean
    icon?: boolean | string | Record<string, unknown>
    rtl?: boolean
    id?: string | number
    onClose?: () => void
    onClick?: () => void
  }

  export interface PluginOptions extends ToastOptions {
    position?: POSITION
    container?: HTMLElement | (() => HTMLElement)
    newestOnTop?: boolean
    maxToasts?: number
    transition?: string
    toastDefaults?: Partial<ToastOptions>
    filterBeforeCreate?: (
      toast: ToastOptions,
      toasts: ToastOptions[]
    ) => ToastOptions | false
    filterToasts?: (toasts: ToastOptions[]) => ToastOptions[]
  }

  export enum POSITION {
    TOP_LEFT = 'top-left',
    TOP_CENTER = 'top-center',
    TOP_RIGHT = 'top-right',
    BOTTOM_LEFT = 'bottom-left',
    BOTTOM_CENTER = 'bottom-center',
    BOTTOM_RIGHT = 'bottom-right',
  }

  export enum TYPE {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
    DEFAULT = 'default',
  }

  export interface ToastInterface {
    (content: string, options?: ToastOptions): string | number
    success(content: string, options?: ToastOptions): string | number
    error(content: string, options?: ToastOptions): string | number
    warning(content: string, options?: ToastOptions): string | number
    info(content: string, options?: ToastOptions): string | number
    dismiss(id: string | number): void
    clear(): void
    update(id: string | number, options: ToastOptions): void
  }

  export function useToast(): ToastInterface

  const Toast: Plugin
  export default Toast
}
