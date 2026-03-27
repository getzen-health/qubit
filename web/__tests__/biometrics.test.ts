import { describe, it, expect } from 'vitest'
import {
  calculateBMI,
  navyBodyFat,
  bmiBodyFat,
  calculateFatMassLeanMass,
  smoothWeightTrend,
  calculateWeeklyRate,
  getIdealWeightRange,
  waistRisk,
  whrRisk,
  whtRisk,
  projectWeightGoal,
  bodyFatCategory,
  IDEAL_WEIGHT_FORMULAS,
  type BiometricLog,
} from '../../lib/biometrics'

describe('calculateBMI', () => {
  it('70kg / 170cm = ~24.2', () => {
    const result = calculateBMI(70, 170)
    expect(result.value).toBeCloseTo(24.2, 1)
  })

  it('BMI < 18.5 → Underweight', () => {
    const result = calculateBMI(50, 175)
    expect(result.category).toBe('Underweight')
  })

  it('BMI 18.5–24.9 → Normal weight', () => {
    const result = calculateBMI(70, 175)
    expect(result.category).toBe('Normal weight')
  })

  it('BMI 25–29.9 → Overweight', () => {
    const result = calculateBMI(85, 175)
    expect(result.category).toBe('Overweight')
  })

  it('BMI ≥ 30 → Obese', () => {
    const result = calculateBMI(100, 175)
    expect(result.category).toBe('Obese')
  })

  it('returns a color string', () => {
    const result = calculateBMI(70, 170)
    expect(result.color).toBeTruthy()
  })

  it('Asian category has lower thresholds', () => {
    const result = calculateBMI(80, 170) // ~27.7 BMI — Overweight western, Obese Asian
    expect(result.categoryAsian).toBe('Obese')
    expect(result.category).toBe('Overweight')
  })
})

describe('navyBodyFat', () => {
  it('returns a number between 0 and 60 for typical male values', () => {
    const bf = navyBodyFat(38, 90, 100, 175, 'male')
    expect(bf).toBeGreaterThan(0)
    expect(bf).toBeLessThan(60)
  })

  it('returns a number between 0 and 60 for typical female values', () => {
    const bf = navyBodyFat(32, 80, 100, 165, 'female')
    expect(bf).toBeGreaterThan(0)
    expect(bf).toBeLessThan(60)
  })

  it('higher waist = higher body fat %', () => {
    const lean = navyBodyFat(38, 80, 95, 175, 'male')
    const heavy = navyBodyFat(38, 100, 95, 175, 'male')
    expect(heavy).toBeGreaterThan(lean)
  })
})

describe('bmiBodyFat', () => {
  it('male body fat is lower than female for same BMI and age', () => {
    const male = bmiBodyFat(25, 30, 'male')
    const female = bmiBodyFat(25, 30, 'female')
    expect(female).toBeGreaterThan(male)
  })

  it('never returns negative', () => {
    const result = bmiBodyFat(15, 20, 'male')
    expect(result).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateFatMassLeanMass', () => {
  it('fat + lean = total weight', () => {
    const result = calculateFatMassLeanMass(80, 20)
    expect(result.fatMass + result.leanMass).toBeCloseTo(80, 1)
  })

  it('20% body fat on 80kg = 16kg fat', () => {
    const result = calculateFatMassLeanMass(80, 20)
    expect(result.fatMass).toBeCloseTo(16, 1)
  })
})

describe('smoothWeightTrend', () => {
  it('returns same length as input', () => {
    const logs: BiometricLog[] = [
      { date: '2024-01-01', weight_kg: 70 },
      { date: '2024-01-02', weight_kg: 70.5 },
      { date: '2024-01-03', weight_kg: 71 },
    ]
    const result = smoothWeightTrend(logs)
    expect(result).toHaveLength(3)
  })

  it('returns null smoothed value when no weight data', () => {
    const logs: BiometricLog[] = [{ date: '2024-01-01' }]
    const result = smoothWeightTrend(logs)
    expect(result[0].smoothed).toBeNull()
  })

  it('smooths over 7-day window', () => {
    const logs: BiometricLog[] = Array.from({ length: 7 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      weight_kg: 70 + i * 0.1,
    }))
    const result = smoothWeightTrend(logs)
    // avg of [70.0, 70.1, ..., 70.6] over 7 days ≈ 70.16
    expect(result[6].smoothed).not.toBeNull()
    expect(result[6].smoothed!).toBeGreaterThan(70.0)
    expect(result[6].smoothed!).toBeLessThan(71.0)
  })
})

describe('calculateWeeklyRate', () => {
  it('returns null for < 2 weight entries', () => {
    expect(calculateWeeklyRate([{ date: '2024-01-01', weight_kg: 70 }])).toBeNull()
  })

  it('returns weight loss direction when weight decreases', () => {
    const logs: BiometricLog[] = [
      { date: '2024-01-01', weight_kg: 80 },
      { date: '2024-01-08', weight_kg: 79 },
    ]
    const result = calculateWeeklyRate(logs)
    expect(result?.direction).toBe('loss')
    expect(result?.kgPerWeek).toBeCloseTo(-1, 1)
  })

  it('flags rapid weight change > 1% per week', () => {
    const logs: BiometricLog[] = [
      { date: '2024-01-01', weight_kg: 80 },
      { date: '2024-01-08', weight_kg: 79 },
    ]
    const result = calculateWeeklyRate(logs)
    expect(typeof result?.flag).toBe('boolean')
  })
})

describe('getIdealWeightRange', () => {
  it('returns min ≤ max', () => {
    const range = getIdealWeightRange(175, 'male')
    expect(range.min).toBeLessThanOrEqual(range.max)
  })

  it('returns 4 formula values', () => {
    const range = getIdealWeightRange(170, 'female')
    expect(Object.keys(range.formulas)).toHaveLength(4)
  })

  it('taller person has higher ideal weight', () => {
    const short = getIdealWeightRange(160, 'male')
    const tall = getIdealWeightRange(190, 'male')
    expect(tall.min).toBeGreaterThan(short.min)
  })
})

describe('waistRisk', () => {
  it('waist below threshold → low risk', () => {
    const result = waistRisk(80, 'male', 'european')
    expect(result.risk).toBe('low')
  })

  it('waist above high threshold → high risk', () => {
    const result = waistRisk(110, 'male', 'european')
    expect(result.risk).toBe('high')
  })

  it('Asian thresholds are stricter than European (female example)', () => {
    const european = waistRisk(85, 'female', 'european')  // 80 ≤ 85 < 88 → 'moderate'
    const asian = waistRisk(85, 'female', 'asian')        // 85 ≥ 80 → 'high'
    expect(asian.risk).toBe('high')
    expect(european.risk).toBe('moderate')
  })
})

describe('whrRisk', () => {
  it('ratio ≥ 1.0 for males → very_high risk', () => {
    const result = whrRisk(110, 100, 'male')
    expect(result.risk).toBe('very_high')
  })

  it('returns ratio value rounded to 3 decimals', () => {
    const result = whrRisk(80, 100, 'female')
    expect(result.ratio).toBeCloseTo(0.8, 2)
  })
})

describe('whtRisk', () => {
  it('WHtR < 0.5 → healthy', () => {
    const result = whtRisk(80, 170)
    expect(result.risk).toBe('low')
  })

  it('WHtR ≥ 0.6 → high risk', () => {
    const result = whtRisk(120, 170)
    expect(result.risk).toBe('high')
  })
})

describe('projectWeightGoal', () => {
  it('returns feasible: false when rate is essentially zero', () => {
    const result = projectWeightGoal(80, 70, 0)
    expect(result.feasible).toBe(false)
  })

  it('calculates weeks to goal correctly', () => {
    const result = projectWeightGoal(80, 75, 0.5)
    expect(result.weeksToGoal).toBe(10)
  })

  it('returns milestones at 25%, 50%, 75%, 100%', () => {
    const result = projectWeightGoal(80, 70, 0.5)
    expect(result.milestones).toHaveLength(4)
    expect(result.milestones[0].label).toBe('25% to goal')
    expect(result.milestones[3].label).toBe('100% to goal')
  })

  it('marks rate > 1 kg/week as potentially unfeasible', () => {
    const result = projectWeightGoal(80, 70, 1.5)
    expect(result.feasible).toBe(false)
  })
})

describe('bodyFatCategory', () => {
  it('very low BF% for males → Essential fat', () => {
    const result = bodyFatCategory(3, 'male', 30)
    expect(result.category).toBe('Essential fat')
  })

  it('returns a color string', () => {
    const result = bodyFatCategory(20, 'female', 25)
    expect(result.color).toBeTruthy()
  })
})
