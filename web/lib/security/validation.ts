/**
 * Input Validation Schemas for Health Data
 * Uses Zod for runtime validation to prevent injection attacks
 */

import { z } from 'zod'

// ============================================
// COMMON VALIDATORS
// ============================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format')

// Date validation
export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
)

// Positive number validation
export const positiveNumberSchema = z.number().min(0, 'Value must be positive')

// Sanitize a string (prevents XSS)
export function sanitizeString(val: string): string {
  return val
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
}

// Sanitized string schema - prevents XSS
export const sanitizedStringSchema = z.string().max(1000, 'Text too long')

// ============================================
// MEAL VALIDATION
// ============================================

export const mealItemSchema = z.object({
  name: sanitizedStringSchema.min(1, 'Name is required').max(200),
  brand: sanitizedStringSchema.max(100).optional(),
  barcode: z.string().max(50).regex(/^[0-9]*$/, 'Invalid barcode').optional(),
  serving_size: sanitizedStringSchema.max(50).default('1 serving'),
  servings: z.number().min(0.1).max(100).default(1),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  fiber: z.number().min(0).max(200).optional(),
  sugar: z.number().min(0).max(500).optional(),
  sodium: z.number().min(0).max(50000).optional(), // in mg
  source: z.enum(['barcode', 'ai_recognition', 'manual', 'search']),
  confidence: z.number().min(0).max(1).optional(),
})

export const createMealSchema = z.object({
  name: sanitizedStringSchema.min(1).max(100),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']),
  logged_at: z.string().datetime().optional(),
  notes: sanitizedStringSchema.max(500).optional(),
  image_url: z.string().url().max(500).optional(),
  items: z.array(mealItemSchema).min(1, 'At least one item required').max(50),
})

// ============================================
// WATER VALIDATION
// ============================================

export const waterLogSchema = z.object({
  amount_ml: z.number().int().min(1, 'Amount must be positive').max(5000, 'Amount too large'),
  logged_at: z.string().datetime().optional(),
  source: z.enum(['manual', 'quick_add', 'smart_bottle']).default('manual'),
})

// ============================================
// FASTING VALIDATION
// ============================================

export const startFastingSchema = z.object({
  protocol: z.string().regex(/^\d{1,2}:\d{1,2}$/, 'Protocol must be in format HH:MM').default('16:8'),
  target_hours: z.number().int().min(1).max(72, 'Fasting period too long'),
  started_at: z.string().datetime().optional(),
  notes: sanitizedStringSchema.max(500).optional(),
})

export const endFastingSchema = z.object({
  id: uuidSchema,
  ended_at: z.string().datetime().optional(),
  notes: sanitizedStringSchema.max(500).optional(),
})

// ============================================
// FOOD RECOGNITION VALIDATION
// ============================================

export const barcodeSchema = z.object({
  barcode: z.string()
    .min(8, 'Barcode too short')
    .max(14, 'Barcode too long')
    .regex(/^[0-9]+$/, 'Barcode must contain only numbers'),
})

export const foodImageSchema = z.object({
  image: z.string()
    .min(100, 'Image data too small')
    .max(10 * 1024 * 1024, 'Image too large (max 10MB)')
    .refine(
      (val) => val.startsWith('data:image/'),
      'Must be a valid base64 image'
    ),
})

// ============================================
// QUERY PARAMETER VALIDATION
// ============================================

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const dateRangeSchema = z.object({
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date)
    }
    return true
  },
  { message: 'Start date must be before end date' }
)

// ============================================
// VALIDATION HELPER
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Validate input data against a schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format error message
  const errorMessages = result.error.issues
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ')

  return { success: false, error: errorMessages }
}

/**
 * Sanitize user input string
 */
export function sanitizeInput(input: string): string {
  return sanitizeString(input).slice(0, 1000) // Limit length
}
