/**
 * Server-side encryption for user-provided API keys.
 * Uses AES-256-GCM via the Node.js `crypto` module.
 * Import ONLY from server-side code (API routes / Server Components).
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

/** Derive a 256-bit key from an arbitrary passphrase via SHA-256. */
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

/**
 * Encrypt a plaintext API key with AES-256-GCM.
 * Returns a colon-delimited string: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function encryptApiKey(plaintext: string, secret: string): string {
  const key = deriveKey(secret)
  const iv = randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt a value produced by `encryptApiKey`.
 * Throws if the ciphertext is malformed or the auth tag verification fails.
 */
export function decryptApiKey(ciphertext: string, secret: string): string {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted key format')
  const [ivHex, tagHex, encHex] = parts
  const key = deriveKey(secret)
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
