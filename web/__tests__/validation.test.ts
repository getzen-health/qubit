import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  validateInput,
  sanitizeInput,
  uuidSchema,
  dateSchema,
  positiveNumberSchema,
  barcodeSchema,
  foodImageSchema,
  paginationSchema,
  dateRangeSchema,
} from '../lib/security/validation'

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    // sanitizeString strips tags first, then removes <>"'& chars
    // <script>alert("xss")</script>Hello → alert("xss")Hello → alert(xss)Hello
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert(xss)Hello')
  })

  it('removes dangerous characters (<, >, \', ", &)', () => {
    expect(sanitizeString('test<>"\' &end')).toBe('test end')
  })

  it('trims whitespace', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('')
  })

  it('passes through safe strings unchanged', () => {
    expect(sanitizeString('Hello World 123')).toBe('Hello World 123')
  })
})

describe('sanitizeInput', () => {
  it('sanitizes and limits length to 1000 chars', () => {
    const long = 'a'.repeat(2000)
    const result = sanitizeInput(long)
    expect(result.length).toBe(1000)
  })

  it('strips HTML before truncating', () => {
    const result = sanitizeInput('<b>bold</b>')
    expect(result).toBe('bold')
  })
})

describe('validateInput', () => {
  it('returns success:true for valid data', () => {
    const result = validateInput(uuidSchema, '550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('returns success:false with error message for invalid data', () => {
    const result = validateInput(uuidSchema, 'not-a-uuid')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })
})

describe('uuidSchema', () => {
  it('accepts valid UUID', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('rejects invalid UUID', () => {
    expect(uuidSchema.safeParse('not-uuid').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(uuidSchema.safeParse('').success).toBe(false)
  })
})

describe('dateSchema', () => {
  it('accepts YYYY-MM-DD format', () => {
    expect(dateSchema.safeParse('2024-01-15').success).toBe(true)
  })

  it('rejects MM/DD/YYYY format', () => {
    expect(dateSchema.safeParse('01/15/2024').success).toBe(false)
  })

  it('rejects datetime strings', () => {
    expect(dateSchema.safeParse('2024-01-15T12:00:00').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(dateSchema.safeParse('').success).toBe(false)
  })
})

describe('positiveNumberSchema', () => {
  it('accepts 0', () => {
    expect(positiveNumberSchema.safeParse(0).success).toBe(true)
  })

  it('accepts positive numbers', () => {
    expect(positiveNumberSchema.safeParse(42).success).toBe(true)
  })

  it('rejects negative numbers', () => {
    expect(positiveNumberSchema.safeParse(-1).success).toBe(false)
  })
})

describe('barcodeSchema', () => {
  it('accepts valid 13-digit barcode', () => {
    expect(barcodeSchema.safeParse({ barcode: '4006381333931' }).success).toBe(true)
  })

  it('accepts valid 8-digit barcode', () => {
    expect(barcodeSchema.safeParse({ barcode: '12345678' }).success).toBe(true)
  })

  it('rejects barcode shorter than 8 digits', () => {
    expect(barcodeSchema.safeParse({ barcode: '1234' }).success).toBe(false)
  })

  it('rejects barcode longer than 14 digits', () => {
    expect(barcodeSchema.safeParse({ barcode: '123456789012345' }).success).toBe(false)
  })

  it('rejects barcode with non-numeric characters', () => {
    expect(barcodeSchema.safeParse({ barcode: '12345ABC' }).success).toBe(false)
  })
})

describe('foodImageSchema', () => {
  it('accepts valid base64 image data', () => {
    const img = 'data:image/' + 'A'.repeat(200)
    expect(foodImageSchema.safeParse({ image: img }).success).toBe(true)
  })

  it('rejects non-image data URIs', () => {
    const data = 'data:text/plain,' + 'A'.repeat(200)
    expect(foodImageSchema.safeParse({ image: data }).success).toBe(false)
  })

  it('rejects image data too small', () => {
    expect(foodImageSchema.safeParse({ image: 'data:image/png,x' }).success).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('accepts valid pagination params', () => {
    const result = paginationSchema.safeParse({ limit: 10, offset: 0 })
    expect(result.success).toBe(true)
  })

  it('applies defaults for missing fields', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.offset).toBe(0)
    }
  })

  it('rejects limit > 100', () => {
    expect(paginationSchema.safeParse({ limit: 200 }).success).toBe(false)
  })

  it('rejects negative offset', () => {
    expect(paginationSchema.safeParse({ offset: -1 }).success).toBe(false)
  })
})

describe('dateRangeSchema', () => {
  it('accepts valid date range', () => {
    expect(dateRangeSchema.safeParse({ start_date: '2024-01-01', end_date: '2024-01-31' }).success).toBe(true)
  })

  it('accepts empty range (both optional)', () => {
    expect(dateRangeSchema.safeParse({}).success).toBe(true)
  })

  it('rejects start_date after end_date', () => {
    expect(dateRangeSchema.safeParse({ start_date: '2024-02-01', end_date: '2024-01-01' }).success).toBe(false)
  })

  it('rejects invalid date format', () => {
    expect(dateRangeSchema.safeParse({ start_date: 'not-a-date' }).success).toBe(false)
  })
})

describe('XSS and injection prevention', () => {
  it('sanitizeString strips script injection', () => {
    const result = sanitizeString('<img src=x onerror=alert(1)>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('onerror')
  })

  it('sanitizeString strips SQL injection attempts', () => {
    const result = sanitizeString("Robert'; DROP TABLE users;--")
    expect(result).not.toContain("'")
  })
})
