import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { useFormValidation } from '../useFormValidation'

// Test schemas
const simpleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

const complexSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  age: z.number().min(18, 'Must be at least 18'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})

describe('useFormValidation', () => {
  describe('initialization', () => {
    it('should return expected properties', () => {
      const validation = useFormValidation(simpleSchema)

      expect(validation).toHaveProperty('formData')
      expect(validation).toHaveProperty('errors')
      expect(validation).toHaveProperty('touched')
      expect(validation).toHaveProperty('isValid')
      expect(validation).toHaveProperty('validate')
      expect(validation).toHaveProperty('validateField')
      expect(validation).toHaveProperty('reset')
      expect(validation).toHaveProperty('clearErrors')
      expect(validation).toHaveProperty('setFormData')
      expect(validation).toHaveProperty('getValidatedData')
    })

    it('should start with empty form data', () => {
      const { formData } = useFormValidation(simpleSchema)
      expect(formData).toEqual({})
    })

    it('should start with no errors', () => {
      const { errors } = useFormValidation(simpleSchema)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should start as untouched', () => {
      const { touched } = useFormValidation(simpleSchema)
      expect(touched.value).toBe(false)
    })

    it('should be valid when untouched', () => {
      const { isValid } = useFormValidation(simpleSchema)
      expect(isValid.value).toBe(true)
    })
  })

  describe('validate', () => {
    it('should return true for valid data', () => {
      const { formData, validate } = useFormValidation(simpleSchema)

      formData.name = 'John'
      formData.email = 'john@example.com'

      expect(validate()).toBe(true)
    })

    it('should return false for invalid data', () => {
      const { formData, validate } = useFormValidation(simpleSchema)

      formData.name = ''
      formData.email = 'invalid'

      expect(validate()).toBe(false)
    })

    it('should set touched to true after validation', () => {
      const { touched, validate } = useFormValidation(simpleSchema)

      expect(touched.value).toBe(false)
      validate()
      expect(touched.value).toBe(true)
    })

    it('should populate errors for invalid fields', () => {
      const { formData, errors, validate } = useFormValidation(simpleSchema)

      formData.name = ''
      formData.email = 'not-an-email'

      validate()

      expect(errors.name).toBe('Name is required')
      expect(errors.email).toBe('Invalid email')
    })

    it('should clear errors before validation', () => {
      const { formData, errors, validate } = useFormValidation(simpleSchema)

      // First validation with errors
      formData.name = ''
      formData.email = 'invalid'
      validate()
      expect(errors.name).toBeDefined()
      expect(errors.email).toBeDefined()

      // Second validation with fixed data
      formData.name = 'John'
      formData.email = 'john@example.com'
      validate()

      expect(errors.name).toBeUndefined()
      expect(errors.email).toBeUndefined()
    })
  })

  describe('validateField', () => {
    it('should return true for valid field', () => {
      const { formData, validateField } = useFormValidation(simpleSchema)

      formData.name = 'John'
      formData.email = 'john@example.com'

      expect(validateField('email')).toBe(true)
    })

    it('should return false for invalid field', () => {
      const { formData, validateField } = useFormValidation(simpleSchema)

      formData.email = 'invalid-email'

      expect(validateField('email')).toBe(false)
    })

    it('should set error for invalid field', () => {
      const { formData, errors, validateField } = useFormValidation(simpleSchema)

      formData.email = 'invalid'

      validateField('email')

      expect(errors.email).toBe('Invalid email')
    })

    it('should clear error for valid field', () => {
      const { formData, errors, validateField } = useFormValidation(simpleSchema)

      // First make it invalid
      formData.email = 'invalid'
      validateField('email')
      expect(errors.email).toBeDefined()

      // Then fix it
      formData.email = 'valid@example.com'
      formData.name = 'Test' // Need all required fields
      validateField('email')
      expect(errors.email).toBeUndefined()
    })
  })

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      const { formData, errors, validate, clearErrors } = useFormValidation(simpleSchema)

      formData.name = ''
      formData.email = 'invalid'
      validate()

      expect(errors.name).toBeDefined()
      expect(errors.email).toBeDefined()

      clearErrors()

      expect(errors.name).toBeUndefined()
      expect(errors.email).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('should clear all form data', () => {
      const { formData, reset } = useFormValidation(simpleSchema)

      formData.name = 'John'
      formData.email = 'john@example.com'

      reset()

      expect(formData.name).toBeUndefined()
      expect(formData.email).toBeUndefined()
    })

    it('should clear all errors', () => {
      const { formData, errors, validate, reset } = useFormValidation(simpleSchema)

      formData.name = ''
      validate()
      expect(errors.name).toBeDefined()

      reset()

      expect(errors.name).toBeUndefined()
    })

    it('should reset touched to false', () => {
      const { touched, validate, reset } = useFormValidation(simpleSchema)

      validate()
      expect(touched.value).toBe(true)

      reset()
      expect(touched.value).toBe(false)
    })

    it('should accept initial data', () => {
      const { formData, reset } = useFormValidation(simpleSchema)

      reset({ name: 'Initial', email: 'initial@example.com' })

      expect(formData.name).toBe('Initial')
      expect(formData.email).toBe('initial@example.com')
    })
  })

  describe('setFormData', () => {
    it('should set form data', () => {
      const { formData, setFormData } = useFormValidation(simpleSchema)

      setFormData({
        name: 'John',
        email: 'john@example.com',
      })

      expect(formData.name).toBe('John')
      expect(formData.email).toBe('john@example.com')
    })

    it('should merge with existing data', () => {
      const { formData, setFormData } = useFormValidation(simpleSchema)

      formData.name = 'John'
      setFormData({ email: 'john@example.com' })

      expect(formData.name).toBe('John')
      expect(formData.email).toBe('john@example.com')
    })
  })

  describe('getValidatedData', () => {
    it('should return validated data for valid form', () => {
      const { formData, getValidatedData } = useFormValidation(simpleSchema)

      formData.name = 'John'
      formData.email = 'john@example.com'

      const data = getValidatedData()

      expect(data).toEqual({
        name: 'John',
        email: 'john@example.com',
      })
    })

    it('should throw for invalid form', () => {
      const { formData, getValidatedData } = useFormValidation(simpleSchema)

      formData.name = ''
      formData.email = 'invalid'

      expect(() => getValidatedData()).toThrow()
    })
  })

  describe('isValid computed', () => {
    it('should be true when form is valid after validation', () => {
      const { formData, validate, isValid } = useFormValidation(simpleSchema)

      formData.name = 'John'
      formData.email = 'john@example.com'
      validate()

      expect(isValid.value).toBe(true)
    })

    it('should be false when form has errors', () => {
      const { formData, validate, isValid } = useFormValidation(simpleSchema)

      formData.name = ''
      validate()

      expect(isValid.value).toBe(false)
    })

    it('should update when errors change', () => {
      const { formData, validate, isValid, clearErrors } = useFormValidation(simpleSchema)

      formData.name = ''
      validate()
      expect(isValid.value).toBe(false)

      clearErrors()
      expect(isValid.value).toBe(true)
    })
  })

  describe('complex schema validation', () => {
    it('should handle refine validations', () => {
      const { formData, errors, validate } = useFormValidation(complexSchema)

      formData.username = 'john'
      formData.password = 'password123'
      formData.confirmPassword = 'different'
      formData.age = 25

      validate()

      expect(errors.confirmPassword).toBe('Passwords must match')
    })

    it('should handle number validations', () => {
      const { formData, errors, validate } = useFormValidation(complexSchema)

      formData.username = 'john'
      formData.password = 'password123'
      formData.confirmPassword = 'password123'
      formData.age = 16

      validate()

      expect(errors.age).toBe('Must be at least 18')
    })

    it('should pass all validations when correct', () => {
      const { formData, validate } = useFormValidation(complexSchema)

      formData.username = 'john'
      formData.password = 'password123'
      formData.confirmPassword = 'password123'
      formData.age = 25

      expect(validate()).toBe(true)
    })
  })
})
