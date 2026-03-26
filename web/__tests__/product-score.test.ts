import { describe, it, expect } from 'vitest'
import { calculateProductScore } from '../lib/product-score'

describe('calculateProductScore', () => {
  it('returns excellent score for nutriscore-a with no additives', () => {
    const result = calculateProductScore({ nutriscore_grade: 'a', additives_tags: [], labels_tags: [] })
    expect(result.total).toBeGreaterThanOrEqual(75)
    expect(result.grade).toBe('excellent')
    expect(result.nutritionScore).toBe(60)
  })
  it('adds organic bonus', () => {
    const with_ = calculateProductScore({ nutriscore_grade: 'b', additives_tags: [], labels_tags: ['en:organic'] })
    const without = calculateProductScore({ nutriscore_grade: 'b', additives_tags: [], labels_tags: [] })
    expect(with_.organicBonus).toBe(10)
    expect(without.organicBonus).toBe(0)
  })
  it('reduces score for high-risk additives', () => {
    const with_ = calculateProductScore({ nutriscore_grade: 'c', additives_tags: ['en:e102'], labels_tags: [] })
    const without = calculateProductScore({ nutriscore_grade: 'c', additives_tags: [], labels_tags: [] })
    expect(with_.additivesScore).toBeLessThan(without.additivesScore)
  })
  it('handles empty product gracefully', () => {
    const result = calculateProductScore({})
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
  it('score never exceeds 100', () => {
    const result = calculateProductScore({ nutriscore_grade: 'a', additives_tags: [], labels_tags: ['en:organic'] })
    expect(result.total).toBeLessThanOrEqual(100)
  })
})
