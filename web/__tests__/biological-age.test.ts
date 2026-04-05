import { describe, it, expect } from 'vitest'
import {
  estimateBiologicalAge,
  assessBlueZone,
  getAgeColor,
  type BioAgeInputs,
  type BlueZoneInputs,
} from '../lib/biological-age'

describe('estimateBiologicalAge', () => {
  it('returns biological age younger than chronological for a healthy person', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 40,
      resting_hr: 55,
      hrv_ms: 60,
      sleep_hours: 8,
      sleep_quality: 9,
      vo2max_estimate: 52,
      bmi: 22,
      steps_per_day: 12000,
      smoking: false,
      alcohol_units_per_week: 0,
      stress_level: 2,
      social_connection: 9,
      sense_of_purpose: 9,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.biological_age).toBeLessThan(inputs.chronological_age)
    expect(result.age_difference).toBeLessThan(0)
    expect(result.pace_of_aging).toBeLessThan(1)
    expect(['Much Younger', 'Younger']).toContain(result.category)
  })

  it('returns biological age older than chronological for an unhealthy person', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 40,
      resting_hr: 85,
      hrv_ms: 15,
      sleep_hours: 5,
      sleep_quality: 3,
      vo2max_estimate: 18,
      bmi: 36,
      waist_cm: 110,
      steps_per_day: 2000,
      smoking: true,
      alcohol_units_per_week: 25,
      stress_level: 9,
      social_connection: 2,
      sense_of_purpose: 2,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.biological_age).toBeGreaterThan(inputs.chronological_age)
    expect(result.age_difference).toBeGreaterThan(0)
    expect(result.pace_of_aging).toBeGreaterThan(1)
    expect(['Older', 'Much Older']).toContain(result.category)
  })

  it('returns category "Same" when bio age ≈ chrono age', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 35,
      smoking: false,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.age_difference).toBeGreaterThanOrEqual(-1)
    expect(result.age_difference).toBeLessThanOrEqual(1)
    expect(result.category).toBe('Same')
  })

  it('handles missing optional fields gracefully', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 50,
      smoking: false,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.biological_age).toBe(50)
    expect(result.age_difference).toBe(0)
    expect(result.top_aging_factors).toHaveLength(0)
    expect(result.top_protective_factors).toHaveLength(0)
  })

  it('clamps biological age to minimum of 18', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 20,
      resting_hr: 45,
      hrv_ms: 80,
      sleep_hours: 8,
      sleep_quality: 10,
      vo2max_estimate: 55,
      bmi: 21,
      steps_per_day: 15000,
      smoking: false,
      alcohol_units_per_week: 0,
      stress_level: 1,
      social_connection: 10,
      sense_of_purpose: 10,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.biological_age).toBeGreaterThanOrEqual(18)
  })

  it('populates top_aging_factors for unhealthy inputs', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 40,
      resting_hr: 85,
      sleep_hours: 5,
      smoking: true,
      bmi: 36,
      vo2max_estimate: 18,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.top_aging_factors.length).toBeGreaterThan(0)
    result.top_aging_factors.forEach(f => {
      expect(f.impact_years).toBeGreaterThan(0)
    })
  })

  it('populates top_protective_factors for healthy inputs', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 40,
      resting_hr: 55,
      hrv_ms: 60,
      sleep_hours: 8,
      smoking: false,
      bmi: 22,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.top_protective_factors.length).toBeGreaterThan(0)
    result.top_protective_factors.forEach(f => {
      expect(f.benefit_years).toBeGreaterThan(0)
    })
  })

  it('calculates improvement_potential from improvable aging factors', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 45,
      resting_hr: 85,
      sleep_hours: 5,
      smoking: true,
      stress_level: 9,
    }
    const result = estimateBiologicalAge(inputs)
    expect(result.improvement_potential).toBeGreaterThan(0)
  })

  it('smoking adds +5 years to biological age', () => {
    const base: BioAgeInputs = { chronological_age: 40, smoking: false }
    const smoker: BioAgeInputs = { chronological_age: 40, smoking: true }
    const diff = estimateBiologicalAge(smoker).biological_age - estimateBiologicalAge(base).biological_age
    expect(diff).toBe(5)
  })

  it('pace_of_aging is ratio of bio/chrono age', () => {
    const inputs: BioAgeInputs = {
      chronological_age: 50,
      smoking: true,
      resting_hr: 85,
    }
    const result = estimateBiologicalAge(inputs)
    const expected = Math.round((result.biological_age / 50) * 100) / 100
    expect(result.pace_of_aging).toBe(expected)
  })
})

describe('assessBlueZone', () => {
  it('returns grade A for perfect scores (all 10)', () => {
    const inputs: BlueZoneInputs = {
      natural_movement: 10, purpose: 10, stress_management: 10,
      mindful_eating: 10, plant_based: 10, alcohol_moderation: 10,
      community: 10, family_first: 10, social_tribe: 10,
    }
    const result = assessBlueZone(inputs)
    expect(result.total_score).toBe(100)
    expect(result.grade).toBe('A')
    expect(result.longevity_bonus_years).toBe(10)
  })

  it('returns grade F for very low scores (all 1)', () => {
    const inputs: BlueZoneInputs = {
      natural_movement: 1, purpose: 1, stress_management: 1,
      mindful_eating: 1, plant_based: 1, alcohol_moderation: 1,
      community: 1, family_first: 1, social_tribe: 1,
    }
    const result = assessBlueZone(inputs)
    expect(result.total_score).toBeLessThan(40)
    expect(result.grade).toBe('F')
  })

  it('returns grade D for mid-range scores (all 5s = 50%)', () => {
    const inputs: BlueZoneInputs = {
      natural_movement: 5, purpose: 5, stress_management: 5,
      mindful_eating: 5, plant_based: 5, alcohol_moderation: 5,
      community: 5, family_first: 5, social_tribe: 5,
    }
    const result = assessBlueZone(inputs)
    expect(result.total_score).toBe(50)
    expect(result.grade).toBe('D')
  })

  it('identifies weakest and strongest pillars correctly', () => {
    const inputs: BlueZoneInputs = {
      natural_movement: 2, purpose: 9, stress_management: 3,
      mindful_eating: 8, plant_based: 4, alcohol_moderation: 7,
      community: 1, family_first: 10, social_tribe: 6,
    }
    const result = assessBlueZone(inputs)
    expect(result.weakest_pillars).toContain('Community')
    expect(result.strongest_pillars).toContain('Family First')
  })

  it('generates recommendations for weakest pillars', () => {
    const inputs: BlueZoneInputs = {
      natural_movement: 2, purpose: 2, stress_management: 2,
      mindful_eating: 8, plant_based: 8, alcohol_moderation: 8,
      community: 8, family_first: 8, social_tribe: 8,
    }
    const result = assessBlueZone(inputs)
    expect(result.recommendations.length).toBe(3)
    result.recommendations.forEach(r => {
      expect(r.action).toBeTruthy()
      expect(r.research).toBeTruthy()
    })
  })

  it('longevity_bonus_years is proportional to total_score', () => {
    const inputs: BlueZoneInputs = {
      natural_movement: 5, purpose: 5, stress_management: 5,
      mindful_eating: 5, plant_based: 5, alcohol_moderation: 5,
      community: 5, family_first: 5, social_tribe: 5,
    }
    const result = assessBlueZone(inputs)
    expect(result.longevity_bonus_years).toBe(Math.round((result.total_score / 100) * 10 * 10) / 10)
  })
})

describe('getAgeColor', () => {
  it('returns emerald for much younger (diff < -5)', () => {
    expect(getAgeColor(-7)).toBe('text-emerald-400')
  })

  it('returns green for younger (diff between -5 and -1)', () => {
    expect(getAgeColor(-3)).toBe('text-green-400')
  })

  it('returns yellow for same age (diff between -1 and 1)', () => {
    expect(getAgeColor(0)).toBe('text-yellow-400')
  })

  it('returns orange for older (diff between 1 and 5)', () => {
    expect(getAgeColor(3)).toBe('text-orange-400')
  })

  it('returns red for much older (diff > 5)', () => {
    expect(getAgeColor(8)).toBe('text-red-400')
  })

  it('handles boundary values correctly', () => {
    expect(getAgeColor(-5)).toBe('text-green-400')
    expect(getAgeColor(-1)).toBe('text-yellow-400')
    expect(getAgeColor(1)).toBe('text-yellow-400')
    expect(getAgeColor(5)).toBe('text-orange-400')
  })
})
