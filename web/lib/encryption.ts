/**
 * AES-256-GCM Token Encryption
 * Encrypts sensitive OAuth tokens at rest using Node.js crypto module
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits for GCM
const TAG_LENGTH = 16 // 128 bits for authentication tag
const SALT_LENGTH = 16

/**
 * Encrypt a token using AES-256-GCM
 * @param plaintext - The token to encrypt
 * @param encryptionKey - 32-byte hex key (from ENCRYPTION_KEY env var)
 * @returns Encrypted token as: salt + iv + ciphertext + tag (all base64 encoded)
 */
export function encryptToken(plaintext: string, encryptionKey: string): string {
  try {
    // Convert hex key to buffer
    const key = Buffer.from(encryptionKey, 'hex')
    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)')
    }

    // Generate IV and salt
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf-8')
    encrypted = Buffer.concat([encrypted, cipher.final()])

    // Get auth tag
    const tag = cipher.getAuthTag()

    // Combine all parts: salt + iv + ciphertext + tag
    const combined = Buffer.concat([salt, iv, encrypted, tag])

    // Return as base64
    return combined.toString('base64')
  } catch (error) {
    throw new Error(`Token encryption failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * @param encryptedToken - The encrypted token (base64 encoded)
 * @param encryptionKey - 32-byte hex key (from ENCRYPTION_KEY env var)
 * @returns Decrypted plaintext token
 */
export function decryptToken(encryptedToken: string, encryptionKey: string): string {
  try {
    // Convert hex key to buffer
    const key = Buffer.from(encryptionKey, 'hex')
    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)')
    }

    // Decode from base64
    const combined = Buffer.from(encryptedToken, 'base64')

    // Extract parts
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.slice(-TAG_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH, -TAG_LENGTH)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    // Set auth tag
    decipher.setAuthTag(tag)

    // Decrypt
    let decrypted = decipher.update(ciphertext)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf-8')
  } catch (error) {
    throw new Error(`Token decryption failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Check if a token is in the old base64 format (needs migration)
 * @param token - The token to check
 * @returns true if token appears to be base64-encoded plaintext (old format)
 */
export function isLegacyToken(token: string): boolean {
  try {
    // Try to decode as base64
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    // If it decodes to valid UTF-8 and contains common OAuth token patterns, it's likely legacy
    return /^[a-z0-9._-]+$/i.test(decoded) && (decoded.includes('gho_') || decoded.includes('ghp_') || token.length > 20)
  } catch {
    return false
  }
}

/**
 * Migrate a legacy base64-encoded token to encrypted format
 * @param legacyToken - The base64-encoded token
 * @param encryptionKey - 32-byte hex key
 * @returns Encrypted token in new format
 */
export function migrateToken(legacyToken: string, encryptionKey: string): string {
  try {
    // Decode the legacy base64 token
    const plaintext = Buffer.from(legacyToken, 'base64').toString('utf-8')
    // Encrypt with new format
    return encryptToken(plaintext, encryptionKey)
  } catch (error) {
    throw new Error(`Token migration failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Validate encryption key format
 * @param key - Hex string key
 * @returns true if key is valid 32-byte hex string
 */
export function isValidEncryptionKey(key: string): boolean {
  if (typeof key !== 'string') return false
  if (key.length !== 64) return false // 32 bytes = 64 hex chars
  return /^[0-9a-f]{64}$/i.test(key)
}

/**
 * Health Data Encryption
 * Encrypts/decrypts sensitive health notes using Supabase pgp_sym_encrypt
 */

export interface HealthAnnotationInput {
  date: string
  category: string
  note: string
  user_id?: string
}

export interface HealthAnnotationOutput {
  id: string
  date: string
  category: string
  note: string
  encrypted_note?: Uint8Array
  is_encrypted: boolean
  user_id: string
  created_at: string
}

/**
 * Encrypt a health annotation note using the Supabase encryption key
 * Called before inserting into the database
 */
export async function encryptHealthAnnotation(
  supabase: any,
  annotation: HealthAnnotationInput,
  encryptionKey: string
): Promise<any> {
  if (!annotation.note || !encryptionKey) {
    return annotation
  }

  // Use Supabase RPC to encrypt via database function
  const { data, error } = await supabase.rpc('encrypt_health_note', {
    note_text: annotation.note,
    encryption_key: encryptionKey,
  })

  if (error) {
    console.error('Health note encryption failed:', error)
    // Fall back to plaintext if encryption fails
    return annotation
  }

  return {
    ...annotation,
    encrypted_note: data,
    is_encrypted: true,
    note: '', // Clear plaintext note
  }
}

/**
 * Decrypt health annotation notes after fetching from database
 * Called when retrieving annotations to display
 */
export async function decryptHealthAnnotation(
  supabase: any,
  annotation: HealthAnnotationOutput,
  encryptionKey: string
): Promise<HealthAnnotationOutput> {
  if (!annotation.is_encrypted || !annotation.encrypted_note || !encryptionKey) {
    return annotation
  }

  try {
    // Use Supabase RPC to decrypt via database function
    const { data, error } = await supabase.rpc('decrypt_health_note', {
      encrypted_data: annotation.encrypted_note,
      encryption_key: encryptionKey,
    })

    if (error) {
      console.error('Health note decryption failed:', error)
      return annotation
    }

    return {
      ...annotation,
      note: data || '',
    }
  } catch (err) {
    console.error('Decryption error:', err)
    return annotation
  }
}

/**
 * Batch decrypt health annotations
 */
export async function decryptHealthAnnotations(
  supabase: any,
  annotations: HealthAnnotationOutput[],
  encryptionKey: string
): Promise<HealthAnnotationOutput[]> {
  if (!encryptionKey) {
    return annotations
  }

  return Promise.all(
    annotations.map((ann) => decryptHealthAnnotation(supabase, ann, encryptionKey))
  )
}
