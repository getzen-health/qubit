import { describe, it, expect } from 'vitest'
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacroTargets } from '../lib/nutrition/bmr'

const male = { weightKg: 80, heightCm: 180, ageYears: 30, sex: 'male' as const, activityLevel: 'moderate' as const, goal: 'maintain' as const }
const female = { ...male, sex: 'female' as const, weightKg: 65, heightCm: 165 }

describe('calculateBMR', () => {
  it('calculates male BMR (Mifflin-St Jeor)', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calculateBMR(male)).toBe(1780)
  })
  it('calculates female BMR', () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(calculateBMR(female)).toBeCloseTo(1370, 0)
  })
  it('returns positive value', () => {
    expect(calculateBMR(male)).toBeGreaterThan(0)
  })
})

describe('calculateTDEE', () => {
  it('multiplies BMR by moderate activity factor (1.55)', () => {
    const bmr = calculateBMR(male)
    expect(calculateTDEE(male)).toBe(Math.round(bmr * 1.55))
  })
})

describe('calculateTargetCalories', () => {
  it('subtracts 500 for weight loss', () => {
    const maintain = calculateTargetCalories(male)
    const lose = calculateTargetCalories({ ...male, goal: 'lose' })
    expect(maintain - lose).toBe(500)
  })
  it('adds 300 for muscle gain', () => {
    const maintain = calculateTargetCalories(male)
    const gain = calculateTargetCalories({ ...male, goal: 'gain' })
    expect(gain - maintain).toBe(300)
  })
})

describe('calculateMacroTargets', () => {
  it('returns positive macros', () => {
    const macros = calculateMacroTargets(2000, 'maintain')
    expect(macros.proteinG).toBeGreaterThan(0)
    expect(macros.carbsG).toBeGreaterThan(0)
    expect(macros.fatG).toBeGreaterThan(0)
  })
})
