/**
 * WASM Loader for kquarks Core
 *
 * Provides lazy loading and initialization of the Rust WASM module.
 * Falls back to JavaScript implementations when WASM is unavailable.
 */

import type * as QuarksCore from './wasm/quarks_core'

let wasmModule: typeof QuarksCore | null = null
let wasmInitPromise: Promise<typeof QuarksCore | null> | null = null
let wasmInitialized = false

/**
 * Initialize the WASM module
 * Safe to call multiple times - will only initialize once
 */
export async function initWasm(): Promise<typeof QuarksCore | null> {
  if (wasmInitialized) {
    return wasmModule
  }

  if (wasmInitPromise) {
    return wasmInitPromise
  }

  wasmInitPromise = (async () => {
    try {
      // Dynamic import for code splitting
      const wasm = await import('./wasm/quarks_core')
      await wasm.default()

      wasmModule = wasm
      wasmInitialized = true
      if (process.env.NODE_ENV === 'development') {
        console.log('[kquarks] WASM module initialized, version:', wasm.version())
      }
      return wasm
    } catch (error) {
      console.error('[kquarks] WASM initialization failed, using JS fallbacks:', error)
      wasmInitialized = true // Mark as initialized even on failure to prevent retries
      return null
    }
  })()

  return wasmInitPromise
}

/**
 * Get the WASM module if initialized
 */
export function getWasm(): typeof QuarksCore | null {
  return wasmModule
}

/**
 * Check if WASM is available and initialized
 */
export function isWasmAvailable(): boolean {
  return wasmModule !== null
}

// ============================================
// CRYPTO FUNCTIONS (with JS fallback)
// ============================================

/**
 * Generate an encryption key using Rust WASM or JS fallback
 */
export async function generateKey(): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.generate_key()
  }

  // JS fallback
  const key = new Uint8Array(32)
  crypto.getRandomValues(key)
  return btoa(String.fromCharCode.apply(null, Array.from(key)))
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  plaintext: string,
  keyBase64: string
): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.encrypt_data(plaintext, keyBase64)
  }

  // JS fallback using Web Crypto API
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    data
  )

  // Combine nonce + ciphertext
  const combined = new Uint8Array(nonce.length + encrypted.byteLength)
  combined.set(nonce)
  combined.set(new Uint8Array(encrypted), nonce.length)

  return btoa(String.fromCharCode.apply(null, Array.from(combined)))
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  encryptedBase64: string,
  keyBase64: string
): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.decrypt_data(encryptedBase64, keyBase64)
  }

  // JS fallback using Web Crypto API
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
  const nonce = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string, salt?: string): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.hash_data(data, salt ?? null)
  }

  // JS fallback
  const encoder = new TextEncoder()
  const dataToHash = salt ? data + salt : data
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataToHash))
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Mask a string for display (e.g., "John Smith" -> "J*** S****")
 */
export async function maskString(input: string): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.mask_string(input)
  }

  // JS fallback
  return input
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return '*'
      return word[0] + '*'.repeat(word.length - 1)
    })
    .join(' ')
}

/**
 * Mask an email for display
 */
export async function maskEmail(email: string): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.mask_email(email)
  }

  // JS fallback
  const [local, domain] = email.split('@')
  if (!domain) return '***@***.***'

  const [domainName, ...tld] = domain.split('.')
  const maskedLocal = local ? local[0] + '*'.repeat(Math.min(local.length, 5)) : '***'
  const maskedDomain = domainName ? domainName[0] + '*'.repeat(Math.min(domainName.length, 5)) : '***'

  return `${maskedLocal}@${maskedDomain}.${tld.join('.') || '***'}`
}

// ============================================
// VALIDATION FUNCTIONS (with JS fallback)
// ============================================

/**
 * Validate email format
 */
export async function validateEmail(email: string): Promise<boolean> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.validate_email(email)
  }

  // JS fallback
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate barcode format
 */
export async function validateBarcode(barcode: string): Promise<boolean> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.validate_barcode(barcode)
  }

  // JS fallback
  const validLengths = [8, 12, 13]
  if (!validLengths.includes(barcode.length)) return false
  if (!/^\d+$/.test(barcode)) return false
  return true
}

/**
 * Sanitize string input
 */
export async function sanitizeString(input: string): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.sanitize_string(input)
  }

  // JS fallback
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'\"&]/g, '') // Remove dangerous chars
    .trim()
}

/**
 * Validate UUID format
 */
export async function validateUuid(uuid: string): Promise<boolean> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.validate_uuid(uuid)
  }

  // JS fallback
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  return uuidRegex.test(uuid)
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export async function validateDate(date: string): Promise<boolean> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.validate_date(date)
  }

  // JS fallback
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = new Date(date)
  return !isNaN(d.getTime())
}

// ============================================
// HEALTH CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate BMI
 */
export async function calculateBmi(weightKg: number, heightCm: number): Promise<number> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.calculate_bmi(weightKg, heightCm)
  }

  // JS fallback
  if (heightCm <= 0 || weightKg <= 0) return 0
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

/**
 * Get BMI category
 */
export async function getBmiCategory(bmi: number): Promise<string> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.bmi_category(bmi)
  }

  // JS fallback
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25.0) return 'Normal'
  if (bmi < 30.0) return 'Overweight'
  return 'Obese'
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export async function calculateBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  isMale: boolean
): Promise<number> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.calculate_bmr(weightKg, heightCm, ageYears, isMale)
  }

  // JS fallback
  if (weightKg <= 0 || heightCm <= 0) return 0
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return isMale ? base + 5 : base - 161
}

/**
 * Calculate TDEE
 */
export async function calculateTdee(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  isMale: boolean,
  activityLevel: number
): Promise<number> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.calculate_tdee(weightKg, heightCm, ageYears, isMale, activityLevel)
  }

  // JS fallback
  const bmr = await calculateBmr(weightKg, heightCm, ageYears, isMale)
  return bmr * Math.min(Math.max(activityLevel, 1.0), 2.5)
}

/**
 * Calculate recommended water intake in ml
 */
export async function recommendedWaterIntake(weightKg: number): Promise<number> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.recommended_water_intake(weightKg)
  }

  // JS fallback
  if (weightKg <= 0) return 2000
  return Math.round(weightKg * 33)
}

// ============================================
// NUTRITION FUNCTIONS
// ============================================

export interface MacroBreakdown {
  proteinG: number
  carbsG: number
  fatG: number
  proteinPct: number
  carbsPct: number
  fatPct: number
  totalCalories: number
}

/**
 * Calculate macro percentages from grams
 */
export async function calculateMacroPercentages(
  proteinG: number,
  carbsG: number,
  fatG: number
): Promise<MacroBreakdown> {
  const wasm = await initWasm()
  if (wasm) {
    const result = wasm.calculate_macro_percentages(proteinG, carbsG, fatG)
    return {
      proteinG: result.protein_g,
      carbsG: result.carbs_g,
      fatG: result.fat_g,
      proteinPct: result.protein_pct,
      carbsPct: result.carbs_pct,
      fatPct: result.fat_pct,
      totalCalories: result.total_calories,
    }
  }

  // JS fallback
  const proteinCal = proteinG * 4
  const carbsCal = carbsG * 4
  const fatCal = fatG * 9
  const total = proteinCal + carbsCal + fatCal

  if (total === 0) {
    return {
      proteinG,
      carbsG,
      fatG,
      proteinPct: 0,
      carbsPct: 0,
      fatPct: 0,
      totalCalories: 0,
    }
  }

  return {
    proteinG,
    carbsG,
    fatG,
    proteinPct: Math.round((proteinCal / total) * 100),
    carbsPct: Math.round((carbsCal / total) * 100),
    fatPct: Math.round((fatCal / total) * 100),
    totalCalories: total,
  }
}

/**
 * Calculate calories from macros
 */
export async function calculateCaloriesFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number
): Promise<number> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.calculate_calories_from_macros(proteinG, carbsG, fatG)
  }

  // JS fallback
  return proteinG * 4 + carbsG * 4 + fatG * 9
}

/**
 * Estimate max heart rate based on age
 */
export async function estimateMaxHeartRate(ageYears: number): Promise<number> {
  const wasm = await initWasm()
  if (wasm) {
    return wasm.estimate_max_heart_rate(ageYears)
  }

  // JS fallback (Tanaka formula)
  return Math.round(208 - 0.7 * ageYears)
}

/**
 * Calculate heart rate zones
 */
export async function heartRateZones(maxHr: number): Promise<number[]> {
  const wasm = await initWasm()
  if (wasm) {
    return Array.from(wasm.heart_rate_zones(maxHr))
  }

  // JS fallback
  return [
    Math.floor(maxHr * 0.5),
    Math.floor(maxHr * 0.6),
    Math.floor(maxHr * 0.7),
    Math.floor(maxHr * 0.8),
    Math.floor(maxHr * 0.9),
    maxHr,
  ]
}
