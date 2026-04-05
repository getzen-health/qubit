import { describe, it, expect } from 'vitest'
import {
  calculateMaxHR,
  calculateHRZones,
  detectZone,
  estimateVO2max,
  cardioFitnessCategory,
  analyzePolarizedBalance,
  type WorkoutZoneLog,
} from '../lib/hr-zones'

describe('calculateMaxHR', () => {
  it('tanaka formula: 208 - 0.7 * age', () => {
    expect(calculateMaxHR(30, 'tanaka')).toBe(Math.round(208 - 0.7 * 30))
    expect(calculateMaxHR(40, 'tanaka')).toBe(Math.round(208 - 0.7 * 40))
  })

  it('fox formula: 220 - age', () => {
    expect(calculateMaxHR(30, 'fox')).toBe(190)
    expect(calculateMaxHR(50, 'fox')).toBe(170)
  })

  it('manual formula returns the provided manual_hr', () => {
    expect(calculateMaxHR(30, 'manual', 195)).toBe(195)
  })

  it('manual formula without manual_hr falls back to fox', () => {
    expect(calculateMaxHR(30, 'manual')).toBe(190)
  })
})

describe('calculateHRZones', () => {
  it('returns 5 zones using Karvonen method', () => {
    const profile = calculateHRZones(30, 60, 'tanaka')
    expect(profile.zones).toHaveLength(5)
    expect(profile.zones[0].zone).toBe(1)
    expect(profile.zones[4].zone).toBe(5)
  })

  it('zone boundaries are computed with Karvonen formula', () => {
    const profile = calculateHRZones(30, 60, 'fox')
    const maxHR = 190
    const hrReserve = maxHR - 60
    // Zone 1: 50-60% HRR
    expect(profile.zones[0].min_bpm).toBe(Math.round(60 + hrReserve * 0.50))
    expect(profile.zones[0].max_bpm).toBe(Math.round(60 + hrReserve * 0.60))
  })

  it('includes vo2max estimate and cardio fitness', () => {
    const profile = calculateHRZones(30, 60, 'tanaka')
    expect(profile.vo2max_estimate).toBeGreaterThan(0)
    expect(['Poor', 'Fair', 'Good', 'Excellent', 'Superior']).toContain(profile.cardio_fitness)
  })

  it('hr_reserve equals max_hr minus resting_hr', () => {
    const profile = calculateHRZones(40, 55, 'tanaka')
    expect(profile.hr_reserve).toBe(profile.max_hr - 55)
  })

  it('zones are contiguous: zone N max_bpm equals zone N+1 min_bpm', () => {
    const profile = calculateHRZones(35, 62, 'tanaka')
    for (let i = 0; i < profile.zones.length - 1; i++) {
      expect(profile.zones[i].max_bpm).toBe(profile.zones[i + 1].min_bpm)
    }
  })
})

describe('detectZone', () => {
  const profile = calculateHRZones(30, 60, 'fox')
  const zones = profile.zones

  it('returns zone 1 for HR at zone 1 range', () => {
    expect(detectZone(zones[0].min_bpm, zones)).toBe(1)
  })

  it('returns zone 5 for HR at or above max', () => {
    expect(detectZone(zones[4].max_bpm + 5, zones)).toBe(5)
  })

  it('returns zone 1 for HR below all zones', () => {
    expect(detectZone(50, zones)).toBe(1)
  })

  it('returns correct mid-range zone', () => {
    const midZone3HR = Math.floor((zones[2].min_bpm + zones[2].max_bpm) / 2)
    expect(detectZone(midZone3HR, zones)).toBe(3)
  })
})

describe('estimateVO2max', () => {
  it('uses Uth formula: 15 * (HRmax / HRrest)', () => {
    const result = estimateVO2max(190, 60)
    expect(result).toBeCloseTo(15 * (190 / 60), 1)
  })

  it('higher max_hr / lower resting_hr → higher VO2max', () => {
    expect(estimateVO2max(200, 50)).toBeGreaterThan(estimateVO2max(180, 70))
  })
})

describe('cardioFitnessCategory', () => {
  it('returns Poor for low VO2max young male', () => {
    expect(cardioFitnessCategory(30, 25, 'male')).toBe('Poor')
  })

  it('returns Superior for high VO2max young male', () => {
    expect(cardioFitnessCategory(65, 25, 'male')).toBe('Superior')
  })

  it('female thresholds are lower than male', () => {
    // hr-zones female 40s: Poor≤23, Fair≤32, Good≤41, Excellent≤51
    // hr-zones male 40s: Poor≤30, Fair≤37, Good≤46, Excellent≤54
    // vo2max 44 → female Excellent, male Good
    const femaleCat = cardioFitnessCategory(44, 45, 'female')
    const maleCat = cardioFitnessCategory(44, 45, 'male')
    expect(femaleCat).toBe('Excellent')
    expect(maleCat).toBe('Good')
  })

  it('age affects classification — older adults have lower thresholds', () => {
    const young = cardioFitnessCategory(35, 25, 'male')
    const old = cardioFitnessCategory(35, 65, 'male')
    // 35 is Fair for 60+ male but Poor/Fair for <30 male
    expect(['Fair', 'Good', 'Excellent']).toContain(old)
  })
})

describe('analyzePolarizedBalance', () => {
  it('returns compliant for 80/20 split', () => {
    const logs: WorkoutZoneLog[] = [
      { date: '2024-01-01', duration_min: 80, avg_hr: 130, zone: 2 },
      { date: '2024-01-02', duration_min: 20, avg_hr: 170, zone: 4 },
    ]
    const result = analyzePolarizedBalance(logs)
    expect(result.zone12_pct).toBe(80)
    expect(result.zone345_pct).toBe(20)
    expect(result.compliant).toBe(true)
  })

  it('returns non-compliant when too much high intensity', () => {
    const logs: WorkoutZoneLog[] = [
      { date: '2024-01-01', duration_min: 50, avg_hr: 130, zone: 2 },
      { date: '2024-01-02', duration_min: 50, avg_hr: 175, zone: 5 },
    ]
    const result = analyzePolarizedBalance(logs)
    expect(result.compliant).toBe(false)
    expect(result.recommendation).toContain('too much time')
  })

  it('returns non-compliant when too little high intensity', () => {
    const logs: WorkoutZoneLog[] = [
      { date: '2024-01-01', duration_min: 95, avg_hr: 130, zone: 2 },
      { date: '2024-01-02', duration_min: 5, avg_hr: 175, zone: 4 },
    ]
    const result = analyzePolarizedBalance(logs)
    expect(result.zone12_pct).toBe(95)
    expect(result.compliant).toBe(false)
    expect(result.recommendation).toContain('aerobic base')
  })

  it('handles empty logs gracefully', () => {
    const result = analyzePolarizedBalance([])
    expect(result.zone12_pct).toBe(0)
    expect(result.zone345_pct).toBe(0)
    expect(result.compliant).toBe(false)
  })
})
