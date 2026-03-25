import { describe, it, expect } from 'vitest'
import { calculateACWR, acwrToStrainScore, acwrZone } from '../acwr'
import type { DailyLoad } from '../acwr'

// Helper: generate N days of equal load ending today
function buildLoads(days: number, load: number): DailyLoad[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(2024, 0, i + 1)
    return { date: d.toISOString().slice(0, 10), load }
  })
}

describe('calculateACWR', () => {
  it('returns null for empty data', () => {
    expect(calculateACWR([])).toBeNull()
  })

  it('returns null when chronic load is zero', () => {
    const loads = buildLoads(28, 0)
    expect(calculateACWR(loads)).toBeNull()
  })

  it('ACWR ≈ 1.0 when acute equals chronic load', () => {
    const loads = buildLoads(28, 100)
    const acwr = calculateACWR(loads)
    expect(acwr).not.toBeNull()
    expect(acwr!).toBeCloseTo(1.0, 2)
  })

  it('ACWR > 1 when recent load spikes above baseline', () => {
    // 21 days of load 50, then 7 days of load 150 → acute > chronic
    const base = buildLoads(21, 50)
    const spike = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(2024, 0, 22 + i).toISOString().slice(0, 10),
      load: 150,
    }))
    const acwr = calculateACWR([...base, ...spike])
    expect(acwr).not.toBeNull()
    expect(acwr!).toBeGreaterThan(1)
  })

  it('ACWR < 1 when recent load drops below baseline', () => {
    const base = buildLoads(21, 100)
    const taper = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(2024, 0, 22 + i).toISOString().slice(0, 10),
      load: 30,
    }))
    const acwr = calculateACWR([...base, ...taper])
    expect(acwr).not.toBeNull()
    expect(acwr!).toBeLessThan(1)
  })
})

describe('acwrToStrainScore', () => {
  it('null ACWR returns neutral score of 50', () => {
    expect(acwrToStrainScore(null)).toBe(50)
  })

  it('ACWR 1.0 → optimal strain score of 100', () => {
    expect(acwrToStrainScore(1.0)).toBe(100)
  })

  it('ACWR 0.95 (within perfect band) → 100', () => {
    expect(acwrToStrainScore(0.95)).toBe(100)
  })

  it('ACWR 1.5 (overtraining zone) → lower score', () => {
    const score = acwrToStrainScore(1.5)
    expect(score).toBeLessThan(80)
  })

  it('ACWR 2.0 (extreme overtraining) → near 0', () => {
    const score = acwrToStrainScore(2.0)
    expect(score).toBeLessThanOrEqual(10)
  })

  it('ACWR 0.0 → 0', () => {
    expect(acwrToStrainScore(0.0)).toBe(0)
  })

  it('ACWR 0.85 (sweet spot fringe) → between 80 and 100', () => {
    const score = acwrToStrainScore(0.85)
    expect(score).toBeGreaterThanOrEqual(80)
    expect(score).toBeLessThan(100)
  })

  it('ACWR 1.2 (sweet spot fringe) → between 80 and 100', () => {
    const score = acwrToStrainScore(1.2)
    expect(score).toBeGreaterThanOrEqual(80)
    expect(score).toBeLessThan(100)
  })
})

describe('acwrZone', () => {
  it('null → unknown', () => {
    expect(acwrZone(null)).toBe('unknown')
  })

  it('ACWR 1.0 → optimal', () => {
    expect(acwrZone(1.0)).toBe('optimal')
  })

  it('ACWR 1.5 → over-training', () => {
    expect(acwrZone(1.5)).toBe('over-training')
  })

  it('ACWR 0.5 → under-training', () => {
    expect(acwrZone(0.5)).toBe('under-training')
  })
})
