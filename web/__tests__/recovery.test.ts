import { describe, it, expect } from 'vitest'
import {
  hrvStatus,
  acwrZone,
  calculateRecovery,
  type RecoveryInput,
} from '../lib/recovery'

describe('hrvStatus', () => {
  it('returns High when ratio > 1.05', () => {
    expect(hrvStatus(55, 50)).toBe('High') // 55/50 = 1.1
  })

  it('returns Normal when ratio is between 0.95 and 1.05', () => {
    expect(hrvStatus(50, 50)).toBe('Normal') // 1.0
    expect(hrvStatus(52, 50)).toBe('Normal') // 1.04
  })

  it('returns Low when ratio < 0.95', () => {
    expect(hrvStatus(45, 50)).toBe('Low') // 0.9
  })

  it('boundary: exactly 1.05 ratio is Normal', () => {
    expect(hrvStatus(105, 100)).toBe('Normal') // exactly 1.05
  })

  it('boundary: exactly 0.95 ratio is Normal', () => {
    expect(hrvStatus(95, 100)).toBe('Normal') // exactly 0.95
  })
})

describe('acwrZone', () => {
  it('returns Undertraining for ACWR < 0.6', () => {
    expect(acwrZone(0.4)).toBe('Undertraining')
  })

  it('returns Caution for ACWR 0.6-0.79', () => {
    expect(acwrZone(0.7)).toBe('Caution')
  })

  it('returns Optimal for ACWR 0.8-1.3', () => {
    expect(acwrZone(1.0)).toBe('Optimal')
    expect(acwrZone(0.8)).toBe('Optimal')
    expect(acwrZone(1.3)).toBe('Optimal')
  })

  it('returns Caution for ACWR 1.31-1.5', () => {
    expect(acwrZone(1.4)).toBe('Caution')
    expect(acwrZone(1.5)).toBe('Caution')
  })

  it('returns Overreach for ACWR > 1.5', () => {
    expect(acwrZone(1.6)).toBe('Overreach')
    expect(acwrZone(2.0)).toBe('Overreach')
  })
})

describe('calculateRecovery', () => {
  it('returns Excellent grade for ideal recovery conditions', () => {
    const input: RecoveryInput = {
      hrv_ms: 60,
      resting_hr: 55,
      sleep_hours: 8.5,
      sleep_quality: 9,
      soreness: 1,
      mood: 9,
      acute_load: 500,
      chronic_load: 500,
    }
    const result = calculateRecovery(input, { hrv: 55, hr: 58 })
    expect(result.grade).toBe('Excellent')
    expect(result.score).toBeGreaterThanOrEqual(85)
  })

  it('returns Poor or Very Poor grade for terrible recovery', () => {
    const input: RecoveryInput = {
      hrv_ms: 20,
      resting_hr: 75,
      sleep_hours: 4,
      soreness: 9,
      mood: 2,
      acute_load: 1000,
      chronic_load: 500,
    }
    const result = calculateRecovery(input, { hrv: 55, hr: 58 })
    expect(['Poor', 'Very Poor']).toContain(result.grade)
    expect(result.score).toBeLessThan(50)
  })

  it('components sum to total score', () => {
    const input: RecoveryInput = {
      hrv_ms: 50,
      sleep_hours: 7,
      soreness: 3,
      mood: 7,
      acute_load: 400,
      chronic_load: 450,
    }
    const result = calculateRecovery(input, { hrv: 50, hr: 60 })
    const componentSum =
      result.components.hrv_score +
      result.components.sleep_score +
      result.components.subjective_score +
      result.components.load_score
    expect(result.score).toBe(Math.min(100, componentSum))
  })

  it('HRV high + optimal ACWR → recommends high-intensity', () => {
    const input: RecoveryInput = {
      hrv_ms: 60,
      sleep_hours: 8,
      acute_load: 500,
      chronic_load: 500,
    }
    const result = calculateRecovery(input, { hrv: 50, hr: 60 })
    expect(result.hrv_status).toBe('High')
    expect(result.acwr_zone).toBe('Optimal')
    expect(result.recommendations.some(r => r.includes('high-intensity'))).toBe(true)
  })

  it('Low HRV → recommends reduce training intensity', () => {
    const input: RecoveryInput = {
      hrv_ms: 30,
      sleep_hours: 7,
    }
    const result = calculateRecovery(input, { hrv: 55, hr: 60 })
    expect(result.hrv_status).toBe('Low')
    expect(result.recommendations.some(r => r.includes('reduce training'))).toBe(true)
  })

  it('sleep < 7 hours generates sleep recommendation', () => {
    const input: RecoveryInput = { sleep_hours: 5 }
    const result = calculateRecovery(input)
    expect(result.recommendations.some(r => r.includes('7–9 hours'))).toBe(true)
  })

  it('ACWR > 1.5 generates overreach warning', () => {
    const input: RecoveryInput = {
      sleep_hours: 7,
      acute_load: 800,
      chronic_load: 400,
    }
    const result = calculateRecovery(input)
    expect(result.acwr_zone).toBe('Overreach')
    expect(result.recommendations.some(r => r.includes('1.5'))).toBe(true)
  })

  it('handles minimal input with defaults', () => {
    const result = calculateRecovery({})
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.grade).toBeTruthy()
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('without baseline, hrv_status is Unknown', () => {
    const input: RecoveryInput = { hrv_ms: 50, sleep_hours: 7 }
    const result = calculateRecovery(input)
    expect(result.hrv_status).toBe('Unknown')
  })

  it('high soreness generates recovery recommendation', () => {
    const input: RecoveryInput = { soreness: 8, sleep_hours: 7 }
    const result = calculateRecovery(input)
    expect(result.recommendations.some(r => r.toLowerCase().includes('soreness'))).toBe(true)
  })
})
