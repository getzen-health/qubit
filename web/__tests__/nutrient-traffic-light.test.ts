import { describe, it, expect } from 'vitest'
import { analyzeNutrients } from '../lib/nutrient-traffic-light'

describe('analyzeNutrients', () => {
  it('marks high sugar as red', () => {
    const results = analyzeNutrients({ 'sugars_100g': 20 })
    const sugar = results.find(r => r.name === 'Sugars')
    expect(sugar?.light).toBe('red')
  })
  it('marks low sugar as green', () => {
    const results = analyzeNutrients({ 'sugars_100g': 2 })
    const sugar = results.find(r => r.name === 'Sugars')
    expect(sugar?.light).toBe('green')
  })
  it('marks high protein as green (inverted)', () => {
    const results = analyzeNutrients({ 'proteins_100g': 20 })
    const protein = results.find(r => r.name === 'Protein')
    expect(protein?.light).toBe('green')
  })
  it('marks low fiber as red (inverted)', () => {
    const results = analyzeNutrients({ 'fiber_100g': 0.5 })
    const fiber = results.find(r => r.name === 'Fiber')
    expect(fiber?.light).toBe('red')
  })
  it('returns empty array for empty nutriments', () => {
    expect(analyzeNutrients({})).toHaveLength(0)
  })
  it('skips null/undefined values', () => {
    const results = analyzeNutrients({ 'sugars_100g': null, 'fat_100g': 5 })
    expect(results.every(r => r.value !== null)).toBe(true)
  })
})
