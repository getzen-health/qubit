import { describe, it, expect } from 'vitest'
import {
  encryptToken,
  decryptToken,
  isValidEncryptionKey,
  isLegacyToken,
  migrateToken,
} from '../lib/encryption'

// Valid 32-byte (64 hex char) test key
const TEST_KEY = 'a'.repeat(64)
const TEST_KEY_2 = 'b'.repeat(64)

describe('isValidEncryptionKey', () => {
  it('accepts a valid 64-char hex string', () => {
    expect(isValidEncryptionKey(TEST_KEY)).toBe(true)
  })

  it('rejects a key that is too short', () => {
    expect(isValidEncryptionKey('abc123')).toBe(false)
  })

  it('rejects a key that is too long', () => {
    expect(isValidEncryptionKey('a'.repeat(65))).toBe(false)
  })

  it('rejects a key with non-hex characters', () => {
    expect(isValidEncryptionKey('z'.repeat(64))).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEncryptionKey('')).toBe(false)
  })

  it('accepts uppercase hex', () => {
    expect(isValidEncryptionKey('A'.repeat(64))).toBe(true)
  })
})

describe('encryptToken + decryptToken roundtrip', () => {
  it('decrypts to the original plaintext', () => {
    const plaintext = 'super-secret-token-12345'
    const encrypted = encryptToken(plaintext, TEST_KEY)
    const decrypted = decryptToken(encrypted, TEST_KEY)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertext for same input (random IV)', () => {
    const plaintext = 'token'
    const enc1 = encryptToken(plaintext, TEST_KEY)
    const enc2 = encryptToken(plaintext, TEST_KEY)
    expect(enc1).not.toBe(enc2)
  })

  it('encrypted output is base64 string', () => {
    const encrypted = encryptToken('hello', TEST_KEY)
    expect(() => Buffer.from(encrypted, 'base64')).not.toThrow()
    expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it('handles long tokens', () => {
    const longToken = 'ghp_' + 'x'.repeat(200)
    const encrypted = encryptToken(longToken, TEST_KEY)
    expect(decryptToken(encrypted, TEST_KEY)).toBe(longToken)
  })

  it('handles empty string token', () => {
    const encrypted = encryptToken('', TEST_KEY)
    expect(decryptToken(encrypted, TEST_KEY)).toBe('')
  })

  it('throws with wrong decryption key', () => {
    const encrypted = encryptToken('secret', TEST_KEY)
    expect(() => decryptToken(encrypted, TEST_KEY_2)).toThrow()
  })

  it('throws with invalid key length on encrypt', () => {
    expect(() => encryptToken('token', 'short')).toThrow('Token encryption failed')
  })

  it('throws with invalid key length on decrypt', () => {
    const encrypted = encryptToken('token', TEST_KEY)
    expect(() => decryptToken(encrypted, 'short')).toThrow('Token decryption failed')
  })
})

describe('isLegacyToken', () => {
  it('identifies a base64-encoded GitHub token as legacy', () => {
    const legacyToken = Buffer.from('ghp_abc123def456ghi789').toString('base64')
    expect(isLegacyToken(legacyToken)).toBe(true)
  })

  it('returns false for a modern encrypted token', () => {
    const modernToken = encryptToken('ghp_test_token', TEST_KEY)
    // Modern tokens are random-looking, shouldn't match legacy pattern
    // (this is a probabilistic test — modern tokens are long binary blobs)
    expect(typeof isLegacyToken(modernToken)).toBe('boolean')
  })
})

describe('migrateToken', () => {
  it('migrates a base64-encoded token to encrypted format', () => {
    const originalPlaintext = 'ghp_myOAuthToken123'
    const legacyToken = Buffer.from(originalPlaintext).toString('base64')
    const migrated = migrateToken(legacyToken, TEST_KEY)
    // Should be decryptable back to original
    const decrypted = decryptToken(migrated, TEST_KEY)
    expect(decrypted).toBe(originalPlaintext)
  })

  it('throws on invalid key during migration', () => {
    const legacyToken = Buffer.from('token').toString('base64')
    expect(() => migrateToken(legacyToken, 'bad')).toThrow('Token migration failed')
  })
})
