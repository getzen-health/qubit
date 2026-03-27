import { describe, it, expect } from 'vitest'
import {
  getAgeGroup,
  cooperVO2Max,
  nonExerciseVO2Max,
  calculateFitnessAge,
  calculateLongevityScore,
  estimateEpigeneticAge,
  HALLMARKS_OF_AGING,
  LONGEVITY_INTERVENTIONS,
  VO2_MAX_NORMS,
  type PillarScores,
} from '../../lib/longevity'

describe('getAgeGroup', () => {
  it('age < 30 → 20-29', () => {
    expect(getAgeGroup(20)).toBe('20-29')
    expect(getAgeGroup(29)).toBe('20-29')
  })

  it('age 30–39 → 30-39', () => {
    expect(getAgeGroup(30)).toBe('30-39')
    expect(getAgeGroup(39)).toBe('30-39')
  })

  it('age 40–49 → 40-49', () => {
    expect(getAgeGroup(45)).toBe('40-49')
  })

  it('age 50–59 → 50-59', () => {
    expect(getAgeGroup(55)).toBe('50-59')
  })

  it('age ≥ 60 → 60-69', () => {
    expect(getAgeGroup(60)).toBe('60-69')
    expect(getAgeGroup(75)).toBe('60-69')
  })
})

describe('cooperVO2Max', () => {
  it('returns a positive number for a 12-minute run of 2000m+', () => {
    const result = cooperVO2Max(2000)
    expect(result).toBeGreaterThan(0)
  })

  it('longer distance returns higher VO2max estimate', () => {
    const slow = cooperVO2Max(2000)
    const fast = cooperVO2Max(3000)
    expect(fast).toBeGreaterThan(slow)
  })

  it('2800m → ~51.3 ml/kg/min', () => {
    // (2800 - 504.9) / 44.73 = 51.3
    const result = cooperVO2Max(2800)
    expect(result).toBeCloseTo(51.3, 0)
  })
})

describe('nonExerciseVO2Max', () => {
  it('male > female for same inputs (male base 56.4 vs female 44.9)', () => {
    const male = nonExerciseVO2Max(35, 'male', 24, 3)
    const female = nonExerciseVO2Max(35, 'female', 24, 3)
    expect(male).toBeGreaterThan(female)
  })

  it('younger age returns higher VO2max', () => {
    const young = nonExerciseVO2Max(25, 'male', 24, 3)
    const old = nonExerciseVO2Max(55, 'male', 24, 3)
    expect(young).toBeGreaterThan(old)
  })

  it('higher exercise rating returns higher VO2max', () => {
    const sedentary = nonExerciseVO2Max(35, 'male', 24, 1)
    const active = nonExerciseVO2Max(35, 'male', 24, 7)
    expect(active).toBeGreaterThan(sedentary)
  })
})

describe('calculateFitnessAge', () => {
  it('returns a positive integer', () => {
    const result = calculateFitnessAge(35, 'male', 45, 60, 4)
    expect(result).toBeGreaterThan(0)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('minimum fitness age is 18', () => {
    const result = calculateFitnessAge(20, 'male', 70, 40, 10)
    expect(result).toBeGreaterThanOrEqual(18)
  })

  it('high VO2max + low RHR + high exercise gives lower fitness age than sedentary', () => {
    const athlete = calculateFitnessAge(40, 'male', 55, 45, 8)
    const sedentary = calculateFitnessAge(40, 'male', 22, 85, 0)
    expect(athlete).toBeLessThan(sedentary)
  })

  it('large waist circumference increases fitness age', () => {
    const noWaist = calculateFitnessAge(40, 'male', 40, 65, 4)
    const highWaist = calculateFitnessAge(40, 'male', 40, 65, 4, 110) // > 94+10=104 → +4 years
    expect(highWaist).toBeGreaterThan(noWaist)
  })

  it('same chronological age: fit person can have fitness age < chronological age', () => {
    const result = calculateFitnessAge(40, 'male', 55, 48, 7)
    expect(result).toBeLessThan(40)
  })
})

describe('calculateLongevityScore', () => {
  it('all pillars at 100 → score = 100', () => {
    const pillars: PillarScores = {
      sleep: 100, exercise: 100, nutrition: 100, fasting: 100,
      stress: 100, supplements: 100, social: 100, purpose: 100,
    }
    expect(calculateLongevityScore(pillars)).toBe(100)
  })

  it('all pillars at 50 → score ≈ 50', () => {
    const pillars: PillarScores = {
      sleep: 50, exercise: 50, nutrition: 50, fasting: 50,
      stress: 50, supplements: 50, social: 50, purpose: 50,
    }
    expect(calculateLongevityScore(pillars)).toBe(50)
  })

  it('all pillars at 0 → score = 0', () => {
    const pillars: PillarScores = {
      sleep: 0, exercise: 0, nutrition: 0, fasting: 0,
      stress: 0, supplements: 0, social: 0, purpose: 0,
    }
    expect(calculateLongevityScore(pillars)).toBe(0)
  })

  it('exercise has the highest weight (25%)', () => {
    const base: PillarScores = { sleep: 0, exercise: 0, nutrition: 0, fasting: 0, stress: 0, supplements: 0, social: 0, purpose: 0 }
    const withExercise = calculateLongevityScore({ ...base, exercise: 100 })
    const withSleep = calculateLongevityScore({ ...base, sleep: 100 })
    // exercise weight = 0.25, sleep weight = 0.22
    expect(withExercise).toBeGreaterThan(withSleep)
  })
})

describe('estimateEpigeneticAge', () => {
  it('returns a number (delta in years)', () => {
    const result = estimateEpigeneticAge(35, 45, 80, 80, 24, 75)
    expect(typeof result).toBe('number')
  })

  it('excellent VO2max returns negative delta (biologically younger)', () => {
    const result = estimateEpigeneticAge(35, 55, 80, 80, 23, 80)
    expect(result).toBeLessThan(0)
  })

  it('poor VO2max returns positive delta (biologically older)', () => {
    const result = estimateEpigeneticAge(35, 18, 30, 30, 32, 20)
    expect(result).toBeGreaterThan(0)
  })

  it('null VO2max still returns a number', () => {
    const result = estimateEpigeneticAge(35, null, 80, 80, 24, 75)
    expect(typeof result).toBe('number')
  })

  it('optimal BMI (22–24) reduces delta vs high BMI', () => {
    const optimal = estimateEpigeneticAge(35, 40, 70, 70, 23, 70)
    const obese = estimateEpigeneticAge(35, 40, 70, 70, 35, 70)
    expect(optimal).toBeLessThan(obese)
  })
})

describe('HALLMARKS_OF_AGING', () => {
  it('has 12 hallmarks (López-Otín 2023)', () => {
    expect(HALLMARKS_OF_AGING).toHaveLength(12)
  })

  it('each hallmark has id, name, description, pillar, and behaviors', () => {
    HALLMARKS_OF_AGING.forEach(h => {
      expect(h.id).toBeTruthy()
      expect(h.name).toBeTruthy()
      expect(h.description).toBeTruthy()
      expect(h.pillar).toBeTruthy()
      expect(h.behaviors.length).toBeGreaterThan(0)
    })
  })

  it('includes genomic-instability and chronic-inflammation', () => {
    const ids = HALLMARKS_OF_AGING.map(h => h.id)
    expect(ids).toContain('genomic-instability')
    expect(ids).toContain('chronic-inflammation')
  })
})

describe('LONGEVITY_INTERVENTIONS', () => {
  it('has at least 20 interventions', () => {
    expect(LONGEVITY_INTERVENTIONS.length).toBeGreaterThanOrEqual(20)
  })

  it('each intervention has name, category, evidence_grade, mechanism, dose', () => {
    LONGEVITY_INTERVENTIONS.forEach(i => {
      expect(i.name).toBeTruthy()
      expect(i.category).toBeTruthy()
      expect(['A', 'B', 'C', 'D']).toContain(i.evidence_grade)
      expect(i.mechanism).toBeTruthy()
      expect(i.dose).toBeTruthy()
    })
  })

  it('has Grade A interventions including exercise', () => {
    const gradeA = LONGEVITY_INTERVENTIONS.filter(i => i.evidence_grade === 'A')
    expect(gradeA.length).toBeGreaterThan(0)
    expect(gradeA.some(i => i.category === 'Exercise')).toBe(true)
  })
})

describe('VO2_MAX_NORMS', () => {
  it('has norms for both male and female', () => {
    expect(VO2_MAX_NORMS.male).toBeTruthy()
    expect(VO2_MAX_NORMS.female).toBeTruthy()
  })

  it('male superior VO2max > female superior for same age group', () => {
    expect(VO2_MAX_NORMS.male['20-29'].superior).toBeGreaterThan(VO2_MAX_NORMS.female['20-29'].superior)
  })

  it('older age group has lower VO2max thresholds', () => {
    expect(VO2_MAX_NORMS.male['20-29'].good).toBeGreaterThan(VO2_MAX_NORMS.male['60-69'].good)
  })
})
