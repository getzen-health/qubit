import { describe, it, expect } from 'vitest'
import { calculateAllostaticLoad, type StressLog } from '../lib/stress'

function makeStressLog(overrides: Partial<StressLog> = {}): StressLog {
  return {
    date: '2024-01-01',
    perceived_stress: 3,
    ans_state: 'thriving',
    stressors: [],
    stressor_intensity: 2,
    physical_symptoms: [],
    coping_used: ['exercise'],
    ...overrides,
  }
}

describe('calculateAllostaticLoad', () => {
  it('returns low score for healthy recovery and low perceived stress', () => {
    const logs = Array.from({ length: 7 }, (_, i) =>
      makeStressLog({ date: `2024-01-0${i + 1}`, perceived_stress: 2 })
    )
    const result = calculateAllostaticLoad(logs, {
      hrv_ms: 60, resting_hr: 55, sleep_hours: 8, mood: 9,
    })
    expect(result.score).toBeLessThan(25)
    expect(result.level).toBe('Low')
  })

  it('returns high/critical score for poor recovery and high perceived stress', () => {
    const logs = Array.from({ length: 7 }, (_, i) =>
      makeStressLog({ date: `2024-01-0${i + 1}`, perceived_stress: 9 })
    )
    const result = calculateAllostaticLoad(logs, {
      hrv_ms: 15, resting_hr: 95, sleep_hours: 4.5, mood: 2,
    })
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.level).toBe('Critical')
  })

  it('adds consecutive high-stress days penalty for 3+ days at perceived >= 7', () => {
    const logs = [
      makeStressLog({ date: '2024-01-05', perceived_stress: 8 }),
      makeStressLog({ date: '2024-01-06', perceived_stress: 8 }),
      makeStressLog({ date: '2024-01-07', perceived_stress: 8 }),
    ]
    const result = calculateAllostaticLoad(logs, { hrv_ms: 50 })
    const consecutiveFactor = result.contributors.find(c => c.factor === 'Consecutive High-Stress Days')
    expect(consecutiveFactor).toBeDefined()
    expect(consecutiveFactor!.contribution).toBeGreaterThan(0)
  })

  it('does not add consecutive penalty for fewer than 3 high-stress days', () => {
    const logs = [
      makeStressLog({ date: '2024-01-06', perceived_stress: 8 }),
      makeStressLog({ date: '2024-01-07', perceived_stress: 8 }),
    ]
    const result = calculateAllostaticLoad(logs)
    const consecutiveFactor = result.contributors.find(c => c.factor === 'Consecutive High-Stress Days')
    expect(consecutiveFactor).toBeUndefined()
  })

  it('handles missing optional recovery data gracefully', () => {
    const logs = [makeStressLog({ perceived_stress: 5 })]
    const result = calculateAllostaticLoad(logs)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.level).toBeDefined()
  })

  it('handles empty stress logs with recovery data', () => {
    const result = calculateAllostaticLoad([], {
      hrv_ms: 40, resting_hr: 65, sleep_hours: 7, mood: 7,
    })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.trend).toBe('stable')
  })

  it('detects improving trend when first half has higher stress than second', () => {
    const logs = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeStressLog({ date: `2024-01-0${i + 1}`, perceived_stress: 8 })
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeStressLog({ date: `2024-01-0${i + 5}`, perceived_stress: 3 })
      ),
    ]
    const result = calculateAllostaticLoad(logs)
    expect(result.trend).toBe('improving')
  })

  it('detects worsening trend when second half has higher stress', () => {
    const logs = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeStressLog({ date: `2024-01-0${i + 1}`, perceived_stress: 3 })
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeStressLog({ date: `2024-01-0${i + 5}`, perceived_stress: 8 })
      ),
    ]
    const result = calculateAllostaticLoad(logs)
    expect(result.trend).toBe('worsening')
  })

  it('trend is stable when fewer than 6 logs', () => {
    const logs = Array.from({ length: 4 }, (_, i) =>
      makeStressLog({ date: `2024-01-0${i + 1}`, perceived_stress: 5 })
    )
    const result = calculateAllostaticLoad(logs)
    expect(result.trend).toBe('stable')
  })

  it('score is capped at 100', () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeStressLog({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, perceived_stress: 10 })
    )
    const result = calculateAllostaticLoad(logs, {
      hrv_ms: 10, resting_hr: 100, sleep_hours: 3, mood: 1,
    })
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('generates recommendations for poor HRV', () => {
    const result = calculateAllostaticLoad([], { hrv_ms: 20 })
    expect(result.recommendations.some(r => r.includes('breathing'))).toBe(true)
  })

  it('HRV contributes up to 25 points for very low HRV', () => {
    const result = calculateAllostaticLoad([], { hrv_ms: 15 })
    const hrvFactor = result.contributors.find(c => c.factor === 'Heart Rate Variability')
    expect(hrvFactor).toBeDefined()
    expect(hrvFactor!.contribution).toBe(25)
  })

  it('assigns Moderate level for scores between 25-49', () => {
    const logs = Array.from({ length: 7 }, (_, i) =>
      makeStressLog({ date: `2024-01-0${i + 1}`, perceived_stress: 5 })
    )
    const result = calculateAllostaticLoad(logs, {
      hrv_ms: 45, resting_hr: 72, sleep_hours: 6.5, mood: 5,
    })
    expect(result.score).toBeGreaterThanOrEqual(25)
    expect(result.score).toBeLessThan(50)
    expect(result.level).toBe('Moderate')
  })
})
