import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatCompact,
  formatDuration,
  formatTime,
  percentage,
  clamp,
} from '../lib/utils'

describe('formatNumber', () => {
  it('formats thousands with commas', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('handles numbers below 1000 without comma', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000')
  })
})

describe('formatCompact', () => {
  it('formats thousands as K', () => {
    expect(formatCompact(1200)).toBe('1.2K')
  })

  it('formats millions as M', () => {
    expect(formatCompact(1500000)).toBe('1.5M')
  })

  it('leaves small numbers unchanged', () => {
    expect(formatCompact(999)).toBe('999')
  })
})

describe('formatDuration', () => {
  it('shows minutes for durations under 1 hour', () => {
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(0)).toBe('0m')
  })

  it('shows hours and minutes for durations >= 1 hour', () => {
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(125)).toBe('2h 5m')
  })

  it('omits minutes when duration is exact hours', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })
})

describe('formatTime', () => {
  it('converts midnight (00:00) to 12:00 AM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('converts noon (12:00) to 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('converts afternoon hours correctly', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
    expect(formatTime('23:59')).toBe('11:59 PM')
  })

  it('converts morning hours correctly', () => {
    expect(formatTime('09:05')).toBe('9:05 AM')
  })
})

describe('percentage', () => {
  it('calculates percent correctly', () => {
    expect(percentage(50, 100)).toBe(50)
    expect(percentage(1, 3)).toBe(33)
  })

  it('returns 0 when total is 0', () => {
    expect(percentage(10, 0)).toBe(0)
  })

  it('returns 100 when value equals total', () => {
    expect(percentage(5, 5)).toBe(100)
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 1, 10)).toBe(5)
  })

  it('clamps to min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles equal min and max', () => {
    expect(clamp(5, 7, 7)).toBe(7)
  })
})
