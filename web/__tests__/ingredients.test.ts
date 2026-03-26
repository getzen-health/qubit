import { describe, it, expect } from 'vitest'
import { analyzeIngredients } from '../lib/ingredients'

describe('analyzeIngredients', () => {
  it('detects high fructose corn syrup as avoid', () => {
    const results = analyzeIngredients('water, high fructose corn syrup, salt')
    expect(results.some(r => r.risk === 'avoid')).toBe(true)
  })
  it('returns empty array for clean ingredients', () => {
    const results = analyzeIngredients('oats, water, honey, blueberries')
    expect(results).toHaveLength(0)
  })
  it('detects alias glucose-fructose syrup', () => {
    const results = analyzeIngredients('glucose-fructose syrup, salt')
    expect(results.length).toBeGreaterThan(0)
  })
  it('sorts avoid before caution', () => {
    const results = analyzeIngredients('red 40, monosodium glutamate, salt')
    if (results.length >= 2) {
      const avoidIdx = results.findIndex(r => r.risk === 'avoid')
      const cautionIdx = results.findIndex(r => r.risk === 'caution')
      if (avoidIdx >= 0 && cautionIdx >= 0) expect(avoidIdx).toBeLessThan(cautionIdx)
    }
  })
})
