import { describe, it, expect } from 'vitest'
import { getEcoGrade, getEcoColor, getEcoLabel } from '../lib/eco-score'

describe('getEcoGrade', () => {
  it('returns A for "a"', () => { expect(getEcoGrade('a')).toBe('A') })
  it('returns B for "B"', () => { expect(getEcoGrade('B')).toBe('B') })
  it('returns unknown for empty string', () => { expect(getEcoGrade('')).toBe('unknown') })
  it('returns unknown for undefined', () => { expect(getEcoGrade(undefined)).toBe('unknown') })
  it('returns unknown for invalid grade', () => { expect(getEcoGrade('x')).toBe('unknown') })
})

describe('getEcoColor', () => {
  it('returns green for A', () => { expect(getEcoColor('A')).toBe('#1a9850') })
  it('returns red for E', () => { expect(getEcoColor('E')).toBe('#d73027') })
  it('returns grey for unknown', () => { expect(getEcoColor('unknown')).toBe('#999') })
})

describe('getEcoLabel', () => {
  it('returns label for A', () => { expect(getEcoLabel('A')).toContain('low') })
  it('returns label for unknown', () => { expect(getEcoLabel('unknown')).toBeTruthy() })
})
