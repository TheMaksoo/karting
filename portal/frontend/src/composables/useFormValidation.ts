/**
 * Form Validation Composable - Form validation with Zod.
 *
 * @module composables/useFormValidation
 */

import { ref, reactive, computed } from 'vue'
import { z, type ZodSchema, type ZodError } from 'zod'

/**
 * Form field error state.
 */
export interface FieldErrors {
  [key: string]: string | undefined
}

/**
 * Form validation composable.
 *
 * @param schema - Zod schema for validation
 * @returns Validation utilities and state
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFormValidation } from '@/composables/useFormValidation'
 * import { loginSchema } from '@/validation/schemas'
 *
 * const { formData, errors, validate, isValid, validateField } = useFormValidation(loginSchema)
 * </script>
 *
 * <template>
 *   <form @submit.prevent="validate() && submit()">
 *     <input v-model="formData.email" @blur="validateField('email')" />
 *     <span v-if="errors.email" class="error">{{ errors.email }}</span>
 *   </form>
 * </template>
 * ```
 */
export function useFormValidation<T extends ZodSchema>(schema: T) {
  type FormData = z.infer<T>

  /**
   * Form data - reactive object matching the schema shape.
   */
  const formData = reactive<Partial<FormData>>({}) as FormData

  /**
   * Field-level errors.
   */
  const errors = reactive<FieldErrors>({})

  /**
   * Whether the form has been submitted/validated at least once.
   */
  const touched = ref(false)

  /**
   * Whether the form is currently valid.
   */
  const isValid = computed(() => {
    if (!touched.value) return true
    return Object.keys(errors).length === 0 || Object.values(errors).every((e) => !e)
  })

  /**
   * Clear all errors.
   */
  function clearErrors(): void {
    Object.keys(errors).forEach((key) => {
      delete errors[key]
    })
  }

  /**
   * Parse Zod errors into field errors.
   *
   * @param zodError - Zod error object
   */
  function parseZodErrors(zodError: ZodError<FormData>): void {
    clearErrors()
    zodError.issues.forEach((issue) => {
      const path = issue.path.join('.')
      if (path && !errors[path]) {
        errors[path] = issue.message
      }
    })
  }

  /**
   * Validate the entire form.
   *
   * @returns True if valid, false otherwise
   */
  function validate(): boolean {
    touched.value = true
    clearErrors()

    try {
      schema.parse(formData)
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        parseZodErrors(err as ZodError<FormData>)
      }
      return false
    }
  }

  /**
   * Validate a single field.
   *
   * @param field - Field name to validate
   * @returns True if valid, false otherwise
   */
  function validateField(field: keyof FormData): boolean {
    // Clear existing error for this field
    delete errors[field as string]

    try {
      // Create a partial schema for just this field if possible
      const result = schema.safeParse(formData)
      if (!result.success) {
        const fieldError = result.error.issues.find((e) => e.path[0] === field)
        if (fieldError) {
          errors[field as string] = fieldError.message
          return false
        }
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Reset form to initial state.
   *
   * @param initialData - Optional initial data to reset to
   */
  function reset(initialData?: Partial<FormData>): void {
    clearErrors()
    touched.value = false
    const formRecord = formData as Record<string, unknown>
    Object.keys(formRecord).forEach((key) => {
      delete formRecord[key]
    })
    if (initialData) {
      Object.assign(formRecord, initialData)
    }
  }

  /**
   * Set form data from an object.
   *
   * @param data - Data to set
   */
  function setFormData(data: Partial<FormData>): void {
    Object.assign(formData as Record<string, unknown>, data)
  }

  /**
   * Get validated data (throws if invalid).
   *
   * @returns Validated form data
   */
  function getValidatedData(): FormData {
    return schema.parse(formData)
  }

  return {
    /** Reactive form data */
    formData,
    /** Field errors */
    errors,
    /** Whether form has been touched */
    touched,
    /** Whether form is currently valid */
    isValid,
    /** Validate entire form */
    validate,
    /** Validate single field */
    validateField,
    /** Clear all errors */
    clearErrors,
    /** Reset form */
    reset,
    /** Set form data */
    setFormData,
    /** Get validated data */
    getValidatedData,
  }
}

export default useFormValidation
