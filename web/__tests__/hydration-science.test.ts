import { describe, it, expect } from 'vitest'
import {
  calculateHydrationGoal,
  calculateSweatRate,
  analyzeHydration,
  type HydrationLog,
} from '../lib/hydration-science'

describe('calculateHydrationGoal', () => {
  it('calculates base goal as weight_kg × 35 (no exercise, mild temp)', () => {
    const goal = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    // 70*35 = 2450, rounded to nearest 50 = 2450
    expect(goal).toBe(2450)
  })

  it('adds exercise adjustment for moderate intensity', () => {
    const base = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    const withExercise = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 60, intensity: 'moderate',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    // 60min / 30 = 2 blocks × 500 = 1000ml extra
    expect(withExercise).toBe(base + 1000)
  })

  it('adds exercise adjustment for vigorous intensity', () => {
    const base = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    const withExercise = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 30, intensity: 'vigorous',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    // 30min / 30 = 1 block × 750 = 750ml extra, rounded to nearest 50
    expect(withExercise).toBe(base + 750)
  })

  it('adds +300ml for hot climate (>85°F)', () => {
    const cool = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 80, altitude_ft: 0, caffeine_drinks: 0,
    })
    const hot = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 90, altitude_ft: 0, caffeine_drinks: 0,
    })
    expect(hot - cool).toBe(300)
  })

  it('adds +150ml per caffeine drink', () => {
    const noCaffeine = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    const twoCoffees = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 2,
    })
    expect(twoCoffees - noCaffeine).toBe(300)
  })

  it('adds +300ml for pregnancy', () => {
    const normal = calculateHydrationGoal({
      weight_kg: 60, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    const pregnant = calculateHydrationGoal({
      weight_kg: 60, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0, pregnant: true,
    })
    expect(pregnant - normal).toBe(300)
  })

  it('adds +700ml for breastfeeding', () => {
    const normal = calculateHydrationGoal({
      weight_kg: 60, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0,
    })
    const bf = calculateHydrationGoal({
      weight_kg: 60, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 0, caffeine_drinks: 0, breastfeeding: true,
    })
    expect(bf - normal).toBe(700)
  })

  it('adds +500ml for altitude above 8000ft', () => {
    const sea = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 100, caffeine_drinks: 0,
    })
    const high = calculateHydrationGoal({
      weight_kg: 70, exercise_min: 0, intensity: 'none',
      temp_f: 72, altitude_ft: 9000, caffeine_drinks: 0,
    })
    expect(high - sea).toBe(500)
  })

  it('enforces minimum goal of 1500ml', () => {
    const goal = calculateHydrationGoal({
      weight_kg: 30, exercise_min: 0, intensity: 'none',
      temp_f: 60, altitude_ft: 0, caffeine_drinks: 0,
    })
    expect(goal).toBe(1500)
  })
})

describe('calculateSweatRate', () => {
  it('calculates sweat rate correctly from weight diff, fluid, and duration', () => {
    const log: HydrationLog = {
      date: '2024-01-01', water_ml: 2000, beverages: [],
      urine_color: 2, urine_frequency: 6, sodium_mg: 500,
      potassium_mg: 300, magnesium_mg: 100, electrolyte_drink: false,
      exercise_minutes: 60, exercise_intensity: 'vigorous',
      ambient_temp_f: 75, altitude_ft: 0, is_pregnant: false,
      is_breastfeeding: false, caffeine_drinks: 0,
      pre_exercise_weight_kg: 70, post_exercise_weight_kg: 69.5,
      exercise_fluid_ml: 500, exercise_duration_min: 60,
    }
    // (70-69.5)*1000 + 500 = 1000ml in 1hr
    expect(calculateSweatRate(log)).toBe(1000)
  })

  it('returns null when pre-exercise weight is missing', () => {
    const log: HydrationLog = {
      date: '2024-01-01', water_ml: 2000, beverages: [],
      urine_color: 2, urine_frequency: 6, sodium_mg: 500,
      potassium_mg: 300, magnesium_mg: 100, electrolyte_drink: false,
      exercise_minutes: 60, exercise_intensity: 'vigorous',
      ambient_temp_f: 75, altitude_ft: 0, is_pregnant: false,
      is_breastfeeding: false, caffeine_drinks: 0,
      post_exercise_weight_kg: 69.5, exercise_duration_min: 60,
    }
    expect(calculateSweatRate(log)).toBeNull()
  })

  it('returns null when exercise duration is 0', () => {
    const log: HydrationLog = {
      date: '2024-01-01', water_ml: 2000, beverages: [],
      urine_color: 2, urine_frequency: 6, sodium_mg: 500,
      potassium_mg: 300, magnesium_mg: 100, electrolyte_drink: false,
      exercise_minutes: 60, exercise_intensity: 'vigorous',
      ambient_temp_f: 75, altitude_ft: 0, is_pregnant: false,
      is_breastfeeding: false, caffeine_drinks: 0,
      pre_exercise_weight_kg: 70, post_exercise_weight_kg: 69.5,
      exercise_fluid_ml: 500, exercise_duration_min: 0,
    }
    expect(calculateSweatRate(log)).toBeNull()
  })

  it('defaults exercise_fluid_ml to 0 when undefined', () => {
    const log: HydrationLog = {
      date: '2024-01-01', water_ml: 2000, beverages: [],
      urine_color: 2, urine_frequency: 6, sodium_mg: 500,
      potassium_mg: 300, magnesium_mg: 100, electrolyte_drink: false,
      exercise_minutes: 60, exercise_intensity: 'vigorous',
      ambient_temp_f: 75, altitude_ft: 0, is_pregnant: false,
      is_breastfeeding: false, caffeine_drinks: 0,
      pre_exercise_weight_kg: 70, post_exercise_weight_kg: 69.5,
      exercise_duration_min: 60,
    }
    // (70-69.5)*1000 + 0 = 500ml in 1hr
    expect(calculateSweatRate(log)).toBe(500)
  })
})

describe('analyzeHydration', () => {
  const makeLog = (overrides: Partial<HydrationLog> = {}): HydrationLog => ({
    date: '2024-01-01',
    water_ml: 2500,
    beverages: [],
    urine_color: 2,
    urine_frequency: 6,
    sodium_mg: 500,
    potassium_mg: 300,
    magnesium_mg: 100,
    electrolyte_drink: false,
    exercise_minutes: 0,
    exercise_intensity: 'none',
    ambient_temp_f: 72,
    altitude_ft: 0,
    is_pregnant: false,
    is_breastfeeding: false,
    weight_kg: 70,
    caffeine_drinks: 0,
    ...overrides,
  })

  it('detects optimal hydration when fluid intake >= goal and urine color <= 3', () => {
    const result = analyzeHydration(makeLog({ water_ml: 3000, urine_color: 2 }))
    expect(result.hydrationStatus).toBe('optimal')
    expect(result.percentOfGoal).toBeGreaterThanOrEqual(100)
  })

  it('detects dehydration with high urine color and low intake', () => {
    const result = analyzeHydration(makeLog({ water_ml: 500, urine_color: 6 }))
    expect(result.hydrationStatus).toBe('dehydration')
  })

  it('detects severe dehydration with very high urine color', () => {
    const result = analyzeHydration(makeLog({ water_ml: 200, urine_color: 7 }))
    expect(result.hydrationStatus).toBe('severe_dehydration')
  })

  it('electrolytes are adequate when exercise <= 60min', () => {
    const result = analyzeHydration(makeLog({ exercise_minutes: 30, sodium_mg: 0, electrolyte_drink: false }))
    expect(result.electrolytesAdequate).toBe(true)
  })

  it('electrolytes are inadequate for >60min exercise without supplementation', () => {
    const result = analyzeHydration(makeLog({
      exercise_minutes: 90, exercise_intensity: 'vigorous',
      sodium_mg: 100, electrolyte_drink: false,
    }))
    expect(result.electrolytesAdequate).toBe(false)
  })

  it('accounts for BHI-adjusted effective hydration from beverages', () => {
    const result = analyzeHydration(makeLog({
      water_ml: 1000,
      beverages: [{ type: 'milk', volume_ml: 500, bhi: 1.5 }],
    }))
    // effective = 1000 + 500*1.5 = 1750
    expect(result.effectiveHydrationMl).toBe(1750)
    expect(result.totalFluidMl).toBe(1500) // 1000 + 500
  })

  it('calculates deficit when below goal', () => {
    const result = analyzeHydration(makeLog({ water_ml: 1000 }))
    expect(result.deficit).toBeGreaterThan(0)
    expect(result.deficit).toBe(result.goalMl - result.effectiveHydrationMl)
  })

  it('includes caffeine recommendation when caffeine drinks > 0', () => {
    const result = analyzeHydration(makeLog({ caffeine_drinks: 3 }))
    expect(result.recommendations.some(r => r.includes('Caffeine'))).toBe(true)
  })
})
