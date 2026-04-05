import { describe, it, expect } from 'vitest'
import {
  bmiCategory,
  whrRisk,
  waistRisk,
  whtrRisk,
  calculateRatios,
  getProgressSummary,
  type BodyMeasurement,
} from '../lib/body-measurements'

describe('bmiCategory', () => {
  it('returns Underweight for BMI < 18.5', () => {
    expect(bmiCategory(17)).toBe('Underweight')
  })

  it('returns Normal for BMI 18.5-24.9', () => {
    expect(bmiCategory(22)).toBe('Normal')
  })

  it('returns Overweight for BMI 25-29.9', () => {
    expect(bmiCategory(27)).toBe('Overweight')
  })

  it('returns Obese I for BMI 30-34.9', () => {
    expect(bmiCategory(32)).toBe('Obese I')
  })

  it('returns Obese II for BMI 35-39.9', () => {
    expect(bmiCategory(37)).toBe('Obese II')
  })

  it('returns Obese III for BMI >= 40', () => {
    expect(bmiCategory(42)).toBe('Obese III')
  })

  it('boundary: 18.5 is Normal', () => {
    expect(bmiCategory(18.5)).toBe('Normal')
  })

  it('boundary: 25 is Overweight', () => {
    expect(bmiCategory(25)).toBe('Overweight')
  })
})

describe('whrRisk', () => {
  it('male: Low for WHR <= 0.9', () => {
    expect(whrRisk(0.85, 'male')).toBe('Low')
  })

  it('male: Moderate for WHR 0.91-1.0', () => {
    expect(whrRisk(0.95, 'male')).toBe('Moderate')
  })

  it('male: High for WHR > 1.0', () => {
    expect(whrRisk(1.05, 'male')).toBe('High')
  })

  it('female: Low for WHR <= 0.8', () => {
    expect(whrRisk(0.75, 'female')).toBe('Low')
  })

  it('female: Moderate for WHR 0.81-0.85', () => {
    expect(whrRisk(0.83, 'female')).toBe('Moderate')
  })

  it('female: High for WHR > 0.85', () => {
    expect(whrRisk(0.9, 'female')).toBe('High')
  })
})

describe('waistRisk', () => {
  it('male: Normal for waist <= 94', () => {
    expect(waistRisk(90, 'male')).toBe('Normal')
  })

  it('male: Increased for waist 95-102', () => {
    expect(waistRisk(98, 'male')).toBe('Increased')
  })

  it('male: Substantially Increased for waist > 102', () => {
    expect(waistRisk(110, 'male')).toBe('Substantially Increased')
  })

  it('female: Normal for waist <= 80', () => {
    expect(waistRisk(75, 'female')).toBe('Normal')
  })

  it('female: Increased for waist 81-88', () => {
    expect(waistRisk(85, 'female')).toBe('Increased')
  })

  it('female: Substantially Increased for waist > 88', () => {
    expect(waistRisk(95, 'female')).toBe('Substantially Increased')
  })
})

describe('whtrRisk', () => {
  it('Low for WHtR < 0.5', () => {
    expect(whtrRisk(0.45)).toBe('Low')
  })

  it('Moderate for WHtR 0.5-0.59', () => {
    expect(whtrRisk(0.55)).toBe('Moderate')
  })

  it('High for WHtR >= 0.6', () => {
    expect(whtrRisk(0.65)).toBe('High')
  })
})

describe('calculateRatios', () => {
  it('computes BMI, WHR, WHtR and all risk categories', () => {
    const measurement: BodyMeasurement = {
      date: '2024-01-01',
      weight_kg: 80,
      height_cm: 180,
      waist_cm: 90,
      hips_cm: 100,
    }
    const result = calculateRatios(measurement, 'male')
    expect(result.bmi).toBeCloseTo(24.7, 1)
    expect(result.whr).toBeCloseTo(0.9, 2)
    expect(result.whtr).toBeCloseTo(0.5, 2)
    expect(result.bmi_category).toBe('Normal')
    expect(result.whr_risk).toBe('Low')
    expect(result.waist_risk).toBe('Normal')
  })

  it('returns Unknown when data is missing', () => {
    const measurement: BodyMeasurement = { date: '2024-01-01' }
    const result = calculateRatios(measurement, 'female')
    expect(result.bmi).toBeUndefined()
    expect(result.bmi_category).toBe('Unknown')
    expect(result.whr_risk).toBe('Unknown')
    expect(result.whtr_risk).toBe('Unknown')
    expect(result.waist_risk).toBe('Unknown')
  })

  it('computes BMI without waist/hips data', () => {
    const measurement: BodyMeasurement = {
      date: '2024-01-01',
      weight_kg: 70,
      height_cm: 170,
    }
    const result = calculateRatios(measurement, 'female')
    expect(result.bmi).toBeCloseTo(24.2, 1)
    expect(result.whr).toBeUndefined()
    expect(result.whr_risk).toBe('Unknown')
  })
})

describe('getProgressSummary', () => {
  it('returns trend string with weight and waist changes', () => {
    const measurements: BodyMeasurement[] = [
      { date: '2024-01-01', weight_kg: 85, waist_cm: 95 },
      { date: '2024-03-01', weight_kg: 80, waist_cm: 90 },
    ]
    const result = getProgressSummary(measurements)
    expect(result.change.weight_kg).toBe(-5)
    expect(result.change.waist_cm).toBe(-5)
    expect(result.trend).toContain('weight')
    expect(result.trend).toContain('waist')
  })

  it('returns "Not enough data" for single measurement', () => {
    const result = getProgressSummary([{ date: '2024-01-01', weight_kg: 80 }])
    expect(result.trend).toBe('Not enough data')
    expect(result.change).toEqual({})
  })

  it('returns "No changes recorded" when no weight/waist data', () => {
    const measurements: BodyMeasurement[] = [
      { date: '2024-01-01', chest_cm: 100 },
      { date: '2024-03-01', chest_cm: 102 },
    ]
    const result = getProgressSummary(measurements)
    expect(result.change.chest_cm).toBe(2)
    expect(result.trend).toBe('No changes recorded')
  })

  it('sorts by date regardless of input order', () => {
    const measurements: BodyMeasurement[] = [
      { date: '2024-06-01', weight_kg: 78 },
      { date: '2024-01-01', weight_kg: 85 },
    ]
    const result = getProgressSummary(measurements)
    expect(result.change.weight_kg).toBe(-7)
  })
})
