/**
 * Form Validation Schemas - Zod schemas for frontend validation.
 *
 * @module validation/schemas
 */

import { z } from 'zod'

/**
 * Email validation schema.
 */
export const emailSchema = z.string().email('Please enter a valid email address').min(1, 'Email is required')

/**
 * Password validation schema with strength requirements.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Simple password schema (for login, not registration).
 */
export const loginPasswordSchema = z.string().min(1, 'Password is required')

/**
 * Login form schema.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
})

/**
 * Registration form schema.
 */
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    email: emailSchema,
    password: passwordSchema,
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

/**
 * Change password form schema.
 */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    new_password_confirmation: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Passwords do not match',
    path: ['new_password_confirmation'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  })

/**
 * Driver form schema.
 */
export const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  nickname: z.string().max(50, 'Nickname must be less than 50 characters').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
    .optional(),
})

/**
 * Track form schema.
 */
export const trackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City must be less than 100 characters'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must be less than 100 characters'),
  distance: z.number().min(100, 'Distance must be at least 100 meters').max(10000, 'Distance must be less than 10km'),
  corners: z.number().int().min(1).max(50).optional(),
  width: z.number().min(3).max(20).optional(),
  elevation_change: z.number().min(-100).max(100).optional(),
})

/**
 * Session form schema.
 */
export const sessionSchema = z.object({
  track_id: z.number().int().positive('Please select a track'),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  session_type: z.enum(['race', 'practice', 'qualifying', 'endurance']).optional(),
  weather_conditions: z.string().max(100).optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
})

/**
 * Lap entry form schema.
 */
export const lapSchema = z.object({
  driver_id: z.number().int().positive('Please select a driver'),
  lap_number: z.number().int().min(1, 'Lap number must be at least 1'),
  lap_time: z
    .number()
    .min(1, 'Lap time must be at least 1 second')
    .max(600, 'Lap time must be less than 10 minutes'),
  kart_number: z.string().max(10).optional(),
  position: z.number().int().min(1).optional(),
})

/**
 * Manual lap entry form schema.
 */
export const manualLapEntrySchema = z.object({
  track_id: z.number().int().positive('Please select a track'),
  driver_id: z.number().int().positive('Please select a driver'),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  lap_time: z
    .number()
    .min(1, 'Lap time must be at least 1 second')
    .max(600, 'Lap time must be less than 10 minutes'),
  lap_number: z.number().int().min(1).optional(),
  kart_number: z.string().max(10).optional(),
  session_type: z.enum(['race', 'practice', 'qualifying', 'endurance']).optional(),
  notes: z.string().max(500).optional(),
})

/**
 * User settings form schema.
 */
export const userSettingsSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
})

/**
 * Track nickname form schema.
 */
export const trackNicknameSchema = z.object({
  track_id: z.number().int().positive('Please select a track'),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname must be less than 50 characters'),
})

/**
 * Helper type to infer schema types.
 */
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type DriverFormData = z.infer<typeof driverSchema>
export type TrackFormData = z.infer<typeof trackSchema>
export type SessionFormData = z.infer<typeof sessionSchema>
export type LapFormData = z.infer<typeof lapSchema>
export type ManualLapEntryFormData = z.infer<typeof manualLapEntrySchema>
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>
export type TrackNicknameFormData = z.infer<typeof trackNicknameSchema>
