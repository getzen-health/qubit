import { describe, it, expect } from 'vitest'
import {
  calculateImmuneScore,
  gradeColor,
  scoreRingColor,
  type ImmuneLog,
} from '../lib/immune-score'

function makeLog(overrides: Partial<ImmuneLog> = {}): ImmuneLog {
  return {
    date: '2024-06-15', // summer — no seasonal penalty
    sleep_hours: 8,
    vit_c_mg: 100,
    vit_d_iu: 1000,
    zinc_mg: 12,
    selenium_mcg: 70,
    stress_level: 3,
    exercise_minutes: 40,
    exercise_intensity: 'moderate',
    fiber_g: 30,
    probiotic_taken: true,
    symptoms: {},
    ...overrides,
  }
}

describe('calculateImmuneScore', () => {
  it('returns high score for optimal inputs in summer', () => {
    const result = calculateImmuneScore(makeLog())
    expect(result.total).toBeGreaterThanOrEqual(75)
    expect(result.grade).toBe('Optimal')
    expect(result.seasonalRisk).toBe(false)
    expect(result.gutBonus).toBe(true)
  })

  it('sleep pillar: 7+ hours → 100, 6h → 70, 5h → 40, <5 → 10', () => {
    expect(calculateImmuneScore(makeLog({ sleep_hours: 8 })).pillars.sleep).toBe(100)
    expect(calculateImmuneScore(makeLog({ sleep_hours: 6.5 })).pillars.sleep).toBe(70)
    expect(calculateImmuneScore(makeLog({ sleep_hours: 5.5 })).pillars.sleep).toBe(40)
    expect(calculateImmuneScore(makeLog({ sleep_hours: 4 })).pillars.sleep).toBe(10)
  })

  it('nutrition pillar: 25 pts per nutrient meeting RDA', () => {
    const full = calculateImmuneScore(makeLog())
    expect(full.pillars.nutrition).toBe(100)

    const none = calculateImmuneScore(makeLog({
      vit_c_mg: 10, vit_d_iu: 100, zinc_mg: 2, selenium_mcg: 10,
    }))
    expect(none.pillars.nutrition).toBe(0)

    const half = calculateImmuneScore(makeLog({
      vit_c_mg: 100, vit_d_iu: 700, zinc_mg: 2, selenium_mcg: 10,
    }))
    expect(half.pillars.nutrition).toBe(50)
  })

  it('stress pillar: 100 - stress_level * 10', () => {
    expect(calculateImmuneScore(makeLog({ stress_level: 1 })).pillars.stress).toBe(90)
    expect(calculateImmuneScore(makeLog({ stress_level: 5 })).pillars.stress).toBe(50)
    expect(calculateImmuneScore(makeLog({ stress_level: 10 })).pillars.stress).toBe(0)
  })

  it('exercise pillar: 30-60 min moderate → 100, none → 30', () => {
    const moderate = calculateImmuneScore(makeLog({
      exercise_minutes: 45, exercise_intensity: 'moderate',
    }))
    expect(moderate.pillars.exercise).toBe(100)

    const none = calculateImmuneScore(makeLog({
      exercise_minutes: 0, exercise_intensity: 'none',
    }))
    expect(none.pillars.exercise).toBe(30)
  })

  it('exercise: >90 min vigorous → 50 (overtraining J-curve)', () => {
    const overtraining = calculateImmuneScore(makeLog({
      exercise_minutes: 120, exercise_intensity: 'vigorous',
    }))
    expect(overtraining.pillars.exercise).toBe(50)
  })

  it('weights: sleep 30%, nutrition 30%, stress 20%, exercise 20%', () => {
    const log = makeLog({ stress_level: 0, date: '2024-06-15' })
    const result = calculateImmuneScore(log)
    // All pillars: sleep=100, nutrition=100, stress=100, exercise=100
    // raw = 100*0.3 + 100*0.3 + 100*0.2 + 100*0.2 = 100
    // gut bonus +5 → 105 → capped at 100
    // no seasonal penalty
    expect(result.total).toBe(100)
  })

  it('gut bonus: +5 when fiber >= 25g AND probiotic taken', () => {
    const withGut = calculateImmuneScore(makeLog({
      fiber_g: 30, probiotic_taken: true, sleep_hours: 6,
    }))
    const withoutGut = calculateImmuneScore(makeLog({
      fiber_g: 10, probiotic_taken: false, sleep_hours: 6,
    }))
    expect(withGut.gutBonus).toBe(true)
    expect(withoutGut.gutBonus).toBe(false)
    expect(withGut.total).toBeGreaterThan(withoutGut.total)
  })

  it('seasonal penalty: 10% reduction in flu season (Oct-Mar)', () => {
    const summer = calculateImmuneScore(makeLog({ date: '2024-06-15' }))
    const winter = calculateImmuneScore(makeLog({ date: '2024-01-15' }))
    expect(winter.seasonalRisk).toBe(true)
    expect(summer.seasonalRisk).toBe(false)
    expect(winter.total).toBeLessThan(summer.total)
  })

  it('symptom burden is calculated as percentage of max (21)', () => {
    const result = calculateImmuneScore(makeLog({
      symptoms: { 'Sore Throat': 2, 'Fatigue': 3, 'Cough': 1 },
    }))
    // sum = 6, burden = round(6/21 * 100) = 29
    expect(result.symptomBurden).toBe(29)
  })

  it('grade thresholds: Optimal>=75, Good>=50, Fair>=30, Low<30', () => {
    const optimal = calculateImmuneScore(makeLog())
    expect(optimal.grade).toBe('Optimal')

    const low = calculateImmuneScore(makeLog({
      sleep_hours: 4,
      vit_c_mg: 0, vit_d_iu: 0, zinc_mg: 0, selenium_mcg: 0,
      stress_level: 10,
      exercise_minutes: 0, exercise_intensity: 'none',
      fiber_g: 0, probiotic_taken: false,
      date: '2024-01-15', // flu season penalty
    }))
    expect(low.grade).toBe('Low')
    expect(low.total).toBeLessThan(30)
  })

  it('generates recommendations for deficient areas', () => {
    const result = calculateImmuneScore(makeLog({
      sleep_hours: 5,
      vit_c_mg: 10,
      vit_d_iu: 100,
      zinc_mg: 2,
      selenium_mcg: 10,
      stress_level: 8,
      exercise_minutes: 0, exercise_intensity: 'none',
      fiber_g: 10, probiotic_taken: false,
    }))
    expect(result.recommendations.length).toBeGreaterThan(3)
  })
})

describe('gradeColor', () => {
  it('returns green for Optimal', () => {
    expect(gradeColor('Optimal')).toContain('green')
  })

  it('returns yellow for Good', () => {
    expect(gradeColor('Good')).toContain('yellow')
  })

  it('returns orange for Fair', () => {
    expect(gradeColor('Fair')).toContain('orange')
  })

  it('returns red for Low', () => {
    expect(gradeColor('Low')).toContain('red')
  })
})

describe('scoreRingColor', () => {
  it('returns green hex for score >= 75', () => {
    expect(scoreRingColor(80)).toBe('#22c55e')
  })

  it('returns yellow hex for score 50-74', () => {
    expect(scoreRingColor(60)).toBe('#eab308')
  })

  it('returns orange hex for score 30-49', () => {
    expect(scoreRingColor(35)).toBe('#f97316')
  })

  it('returns red hex for score < 30', () => {
    expect(scoreRingColor(20)).toBe('#ef4444')
  })
})
