import { describe, it, expect } from 'vitest'
import { calculateProductScore } from '../product-scoring'

describe('calculateProductScore', () => {
  it('perfect product scores ≥ 80', () => {
    const result = calculateProductScore({
      nutriscoreGrade: 'a',
      additivesTags: [],
      isOrganic: true,
      fiberPer100g: 8,
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 2,
    })
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.hasCompleteData).toBe(true)
  })

  it('NOVA 4 product incurs a 10pt penalty', () => {
    // NOVA 4 is triggered by specific additive codes
    const withoutNova4 = calculateProductScore({
      nutriscoreGrade: 'b',
      additivesTags: [],
      calories: 200,
      protein: 5,
      carbs: 20,
      fat: 5,
    })
    const withNova4 = calculateProductScore({
      nutriscoreGrade: 'b',
      additivesTags: ['en:e471'], // mono- and diglycerides → NOVA 4 marker
      calories: 200,
      protein: 5,
      carbs: 20,
      fat: 5,
    })
    // NOVA 4 product should score lower due to 10pt penalty
    expect(withNova4.novaGroup).toBe(4)
    expect(withNova4.score).toBeLessThan(withoutNova4.score)
    expect(withoutNova4.score - withNova4.score).toBeGreaterThanOrEqual(10)
  })

  it('missing nutrients returns hasCompleteData: false', () => {
    const result = calculateProductScore({
      nutriscoreGrade: null,
      additivesTags: [],
    })
    expect(result.hasCompleteData).toBe(false)
  })

  it('missing some macros (but not all) returns hasCompleteData: false', () => {
    const result = calculateProductScore({
      nutriscoreGrade: null,
      calories: 100,
      protein: null,
      carbs: 20,
      fat: null,
    })
    expect(result.hasCompleteData).toBe(false)
  })

  it('nutriscore E scores significantly lower than nutriscore A', () => {
    const scoreE = calculateProductScore({
      nutriscoreGrade: 'e',
      additivesTags: [],
      calories: 200,
      protein: 5,
      carbs: 30,
      fat: 10,
    })
    const scoreA = calculateProductScore({
      nutriscoreGrade: 'a',
      additivesTags: [],
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 2,
    })
    // Nutriscore E: nutriContrib=0, additiveContrib=30 → score=30 (mediocre)
    // Nutriscore A: nutriContrib=60 → score much higher
    expect(scoreE.score).toBeLessThan(scoreA.score)
    expect(scoreE.nutriScore).toBe('e')
    expect(['mediocre', 'poor']).toContain(scoreE.grade)
  })

  it('nutriscore A gives higher score than nutriscore E', () => {
    const a = calculateProductScore({ nutriscoreGrade: 'a' })
    const e = calculateProductScore({ nutriscoreGrade: 'e' })
    expect(a.score).toBeGreaterThan(e.score)
  })

  it('avoid additive caps score at ≤ 24', () => {
    const result = calculateProductScore({
      nutriscoreGrade: 'a',
      additivesTags: ['en:e250'], // sodium nitrite — risk: avoid
    })
    expect(result.score).toBeLessThanOrEqual(24)
    expect(result.grade).toBe('poor')
  })

  it('high fiber adds bonus points', () => {
    const noFiber = calculateProductScore({ nutriscoreGrade: 'b', fiberPer100g: 0 })
    const highFiber = calculateProductScore({ nutriscoreGrade: 'b', fiberPer100g: 8 })
    expect(highFiber.score).toBeGreaterThan(noFiber.score)
    expect(highFiber.fiberBonus).toBe(5)
  })
})
