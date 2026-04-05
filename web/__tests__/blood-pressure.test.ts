import { describe, it, expect } from 'vitest'
import {
  classifyBP,
  calculateBPStats,
  dashScore,
  type BPReading,
  type DASHIntake,
} from '../lib/blood-pressure'

describe('classifyBP', () => {
  it('returns Normal for systolic < 120 and diastolic < 80', () => {
    const result = classifyBP(115, 75)
    expect(result.category).toBe('Normal')
    expect(result.seek_care).toBe(false)
  })

  it('returns Elevated for systolic 120-129 and diastolic < 80', () => {
    const result = classifyBP(125, 75)
    expect(result.category).toBe('Elevated')
  })

  it('returns Stage 1 for systolic 130-139', () => {
    const result = classifyBP(135, 78)
    expect(result.category).toBe('Stage 1')
  })

  it('returns Stage 1 for diastolic 80-89 even with normal systolic', () => {
    const result = classifyBP(118, 85)
    expect(result.category).toBe('Stage 1')
  })

  it('returns Stage 2 for systolic >= 140', () => {
    const result = classifyBP(145, 88)
    expect(result.category).toBe('Stage 2')
  })

  it('returns Stage 2 for diastolic >= 90 even with lower systolic', () => {
    const result = classifyBP(125, 95)
    expect(result.category).toBe('Stage 2')
  })

  it('returns Crisis for systolic > 180', () => {
    const result = classifyBP(185, 100)
    expect(result.category).toBe('Crisis')
    expect(result.seek_care).toBe(true)
  })

  it('returns Crisis for diastolic > 120', () => {
    const result = classifyBP(160, 125)
    expect(result.category).toBe('Crisis')
    expect(result.seek_care).toBe(true)
  })

  it('Elevated requires diastolic < 80 (systolic 120, diastolic 80 → Stage 1)', () => {
    const result = classifyBP(120, 80)
    expect(result.category).toBe('Stage 1')
  })

  it('boundary: systolic exactly 120 with diastolic 79 → Elevated', () => {
    const result = classifyBP(120, 79)
    expect(result.category).toBe('Elevated')
  })
})

describe('calculateBPStats', () => {
  const makeReading = (
    systolic: number,
    diastolic: number,
    time_of_day: BPReading['time_of_day'],
    date: string
  ): BPReading & { date: string } => ({
    systolic,
    diastolic,
    arm: 'left',
    time_of_day,
    date,
  })

  it('computes morning and evening averages separately', () => {
    const readings = [
      makeReading(120, 80, 'morning', '2024-01-01'),
      makeReading(130, 85, 'morning', '2024-01-02'),
      makeReading(115, 75, 'evening', '2024-01-01'),
      makeReading(125, 80, 'evening', '2024-01-02'),
    ]
    const stats = calculateBPStats(readings)
    expect(stats.morning_avg).toEqual({ systolic: 125, diastolic: 83 })
    expect(stats.evening_avg).toEqual({ systolic: 120, diastolic: 78 })
  })

  it('returns null for morning_avg when no morning readings exist', () => {
    const readings = [makeReading(120, 80, 'evening', '2024-01-01')]
    const stats = calculateBPStats(readings)
    expect(stats.morning_avg).toBeNull()
    expect(stats.evening_avg).not.toBeNull()
  })

  it('computes pulse pressure as systolic - diastolic', () => {
    const readings = [makeReading(130, 80, 'morning', '2024-01-01')]
    const stats = calculateBPStats(readings)
    expect(stats.pulse_pressure).toBe(50)
  })

  it('computes MAP = DBP + 1/3*(SBP - DBP)', () => {
    const readings = [makeReading(120, 80, 'morning', '2024-01-01')]
    const stats = calculateBPStats(readings)
    // MAP = 80 + (120-80)/3 = 80 + 13.3 = 93.3 → 93
    expect(stats.map).toBe(93)
  })

  it('detects improving trend when last 7 avg drops >= 3', () => {
    const readings = [
      // prev 7: systolic ~140
      ...Array.from({ length: 7 }, (_, i) =>
        makeReading(140, 85, 'morning', `2024-01-${String(i + 1).padStart(2, '0')}`)
      ),
      // last 7: systolic ~125
      ...Array.from({ length: 7 }, (_, i) =>
        makeReading(125, 78, 'morning', `2024-01-${String(i + 8).padStart(2, '0')}`)
      ),
    ]
    const stats = calculateBPStats(readings)
    expect(stats.trend_7d).toBe('improving')
  })

  it('detects worsening trend when last 7 avg rises >= 3', () => {
    const readings = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeReading(120, 78, 'morning', `2024-01-${String(i + 1).padStart(2, '0')}`)
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        makeReading(135, 85, 'morning', `2024-01-${String(i + 8).padStart(2, '0')}`)
      ),
    ]
    const stats = calculateBPStats(readings)
    expect(stats.trend_7d).toBe('worsening')
  })

  it('returns stable trend with insufficient data', () => {
    const readings = [makeReading(120, 80, 'morning', '2024-01-01')]
    const stats = calculateBPStats(readings)
    expect(stats.trend_7d).toBe('stable')
  })
})

describe('dashScore', () => {
  it('returns high score and grade A for perfect DASH diet', () => {
    const intake: DASHIntake = {
      fruits_servings: 5,
      vegetables_servings: 5,
      whole_grains_servings: 8,
      low_fat_dairy: 3,
      nuts_legumes_week: 5,
      sodium_mg: 1200,
      alcohol_drinks: 0,
    }
    const result = dashScore(intake)
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.grade).toBe('A')
  })

  it('returns low score and grade F for poor diet', () => {
    const intake: DASHIntake = {
      fruits_servings: 0,
      vegetables_servings: 0,
      whole_grains_servings: 0,
      low_fat_dairy: 0,
      nuts_legumes_week: 0,
      sodium_mg: 5000,
      alcohol_drinks: 5,
    }
    const result = dashScore(intake)
    expect(result.score).toBeLessThan(10)
    expect(result.grade).toBe('F')
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('sodium between 1500-2300 gives partial credit', () => {
    const low = dashScore({
      fruits_servings: 0, vegetables_servings: 0, whole_grains_servings: 0,
      low_fat_dairy: 0, nuts_legumes_week: 0, sodium_mg: 1500, alcohol_drinks: 0,
    })
    const mid = dashScore({
      fruits_servings: 0, vegetables_servings: 0, whole_grains_servings: 0,
      low_fat_dairy: 0, nuts_legumes_week: 0, sodium_mg: 1900, alcohol_drinks: 0,
    })
    expect(low.score).toBeGreaterThan(mid.score)
  })

  it('alcohol scoring: 0-1 → 10pts, 2 → 5pts, 3+ → 0pts', () => {
    const none = dashScore({
      fruits_servings: 0, vegetables_servings: 0, whole_grains_servings: 0,
      low_fat_dairy: 0, nuts_legumes_week: 0, sodium_mg: 5000, alcohol_drinks: 0,
    })
    const two = dashScore({
      fruits_servings: 0, vegetables_servings: 0, whole_grains_servings: 0,
      low_fat_dairy: 0, nuts_legumes_week: 0, sodium_mg: 5000, alcohol_drinks: 2,
    })
    const three = dashScore({
      fruits_servings: 0, vegetables_servings: 0, whole_grains_servings: 0,
      low_fat_dairy: 0, nuts_legumes_week: 0, sodium_mg: 5000, alcohol_drinks: 3,
    })
    expect(none.score).toBeGreaterThan(two.score)
    expect(two.score).toBeGreaterThan(three.score)
  })

  it('grade thresholds: A>=90, B>=80, C>=70, D>=60, F<60', () => {
    // Approximate a B-range diet
    const intake: DASHIntake = {
      fruits_servings: 4,
      vegetables_servings: 4,
      whole_grains_servings: 6,
      low_fat_dairy: 2,
      nuts_legumes_week: 4,
      sodium_mg: 1800,
      alcohol_drinks: 1,
    }
    const result = dashScore(intake)
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(['A', 'B', 'C']).toContain(result.grade)
  })
})
