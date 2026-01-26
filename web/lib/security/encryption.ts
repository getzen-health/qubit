/**
 * Data Encryption for Sensitive Health Information
 * Provides field-level encryption for extra-sensitive health data
 *
 * Note: Supabase already provides encryption at rest and in transit.
 * This provides an additional layer for highly sensitive fields like
 * medical notes, diagnoses, or personal health information.
 */

// Use Web Crypto API for encryption (available in Node.js 18+ and browsers)
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 128 // bits

/**
 * Generate a random encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
  const exported = await crypto.subtle.exportKey('raw', key)
  return Buffer.from(exported).toString('base64')
}

/**
 * Import a key from base64 string
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = Buffer.from(keyBase64, 'base64')
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt sensitive data
 * @param plaintext - The data to encrypt
 * @param keyBase64 - Base64 encoded encryption key
 * @returns Base64 encoded encrypted data (IV + ciphertext + tag)
 */
export async function encrypt(plaintext: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    data
  )

  // Combine IV + ciphertext for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return Buffer.from(combined).toString('base64')
}

/**
 * Decrypt sensitive data
 * @param encryptedBase64 - Base64 encoded encrypted data
 * @param keyBase64 - Base64 encoded encryption key
 * @returns Decrypted plaintext
 */
export async function decrypt(encryptedBase64: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64)
  const combined = Buffer.from(encryptedBase64, 'base64')

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Hash sensitive data for comparison without storing plaintext
 * Uses SHA-256 with a salt
 */
export async function hashSensitiveData(data: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataWithSalt = encoder.encode(data + salt)

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataWithSalt)
  return Buffer.from(hashBuffer).toString('hex')
}

/**
 * Mask sensitive data for display (e.g., "John Smith" -> "J*** S****")
 */
export function maskSensitiveString(str: string): string {
  if (!str || str.length < 2) return '***'

  const words = str.split(' ')
  return words
    .map((word) => {
      if (word.length <= 1) return '*'
      return word[0] + '*'.repeat(word.length - 1)
    })
    .join(' ')
}

/**
 * Mask email for display (e.g., "john@example.com" -> "j***@e******.com")
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***@***.***'

  const [domainName, ...tld] = domain.split('.')
  const maskedLocal = local[0] + '*'.repeat(Math.min(local.length - 1, 5))
  const maskedDomain = domainName[0] + '*'.repeat(Math.min(domainName.length - 1, 5))

  return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`
}

/**
 * Redact health data for logging (prevents PII in logs)
 */
export function redactForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'name',
    'email',
    'phone',
    'address',
    'notes',
    'medical_notes',
    'diagnosis',
    'medications',
    'conditions',
  ]

  const redacted = { ...data }

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]'
    }
  }

  return redacted
}

/**
 * Check if encryption key is valid
 */
export async function validateEncryptionKey(keyBase64: string): Promise<boolean> {
  try {
    const key = await importKey(keyBase64)
    return key !== null
  } catch {
    return false
  }
}
