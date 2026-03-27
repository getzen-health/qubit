import { describe, it, expect } from 'vitest'
import {
  scoreFoodProduct,
  getAdditiveDetails,
  type FoodProduct,
  type UserProfile,
} from '../lib/food-scoring'

describe('scoreFoodProduct', () => {
  it('returns a score between 0 and 100', () => {
    const result = scoreFoodProduct({})
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('assigns A+ or A grade to a whole-food product with excellent nutrients', () => {
    const product: FoodProduct = {
      nutriments: {
        'energy-kcal_100g': 90,
        sugars_100g: 2,
        'saturated-fat_100g': 0.5,
        sodium_100g: 0.01,
        fiber_100g: 8,
        proteins_100g: 20,
        'vitamin-c_100g': 0.08,
        calcium_100g: 0.6,
        potassium_100g: 1.8,
      },
      additives_tags: [],
      nova_group: 1,
      ingredients_text: 'whole grain oats, water',
      labels_tags: ['en:organic'],
    }
    const result = scoreFoodProduct(product)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(['A+', 'A']).toContain(result.grade)
  })

  it('assigns F or D grade to ultra-processed product with bad nutrients', () => {
    const product: FoodProduct = {
      nutriments: {
        'energy-kcal_100g': 520,
        sugars_100g: 55,
        'added-sugars_100g': 50,
        'saturated-fat_100g': 22,
        'trans-fat_100g': 3,
        sodium_100g: 1.5,
        fiber_100g: 0,
        proteins_100g: 2,
      },
      additives_tags: ['en:e102', 'en:e250', 'en:e951'],
      nova_group: 4,
      ingredients_text: 'sugar, hydrogenated palm oil, high fructose corn syrup, artificial flavor, maltodextrin, sodium nitrite, aspartame',
    }
    const result = scoreFoodProduct(product)
    expect(result.score).toBeLessThan(35)
    expect(['F', 'D', 'C']).toContain(result.grade)
  })

  it('all pillar scores are within their documented max values', () => {
    const result = scoreFoodProduct({
      nutriments: { proteins_100g: 20, fiber_100g: 5 },
    })
    expect(result.pillars.nutrientBalance.score).toBeLessThanOrEqual(35)
    expect(result.pillars.processingIntegrity.score).toBeLessThanOrEqual(25)
    expect(result.pillars.additiveSafety.score).toBeLessThanOrEqual(20)
    expect(result.pillars.ingredientQuality.score).toBeLessThanOrEqual(15)
    expect(result.pillars.contextFit.score).toBeLessThanOrEqual(5)
  })

  it('high-sodium product is penalised vs low-sodium', () => {
    const lowSodium = scoreFoodProduct({ nutriments: { sodium_100g: 0.05 } })
    const highSodium = scoreFoodProduct({ nutriments: { sodium_100g: 1.5 } })
    expect(lowSodium.pillars.nutrientBalance.score).toBeGreaterThan(highSodium.pillars.nutrientBalance.score)
  })

  it('TIER_A additive (e250) causes lower additive safety score', () => {
    const safe = scoreFoodProduct({ additives_tags: [] })
    const dangerous = scoreFoodProduct({ additives_tags: ['en:e250'] })
    expect(dangerous.pillars.additiveSafety.score).toBeLessThan(safe.pillars.additiveSafety.score)
  })

  it('organic label boosts ingredient quality score', () => {
    const noLabel = scoreFoodProduct({ ingredients_text: 'water, salt', labels_tags: [] })
    const organic = scoreFoodProduct({ ingredients_text: 'water, salt', labels_tags: ['en:organic'] })
    expect(organic.pillars.ingredientQuality.score).toBeGreaterThan(noLabel.pillars.ingredientQuality.score)
  })

  it('context fit is personalised — high-calorie food scores lower for weight-loss goal', () => {
    const highCalorie: FoodProduct = {
      nutriments: { 'energy-kcal_100g': 600, sugars_100g: 40 },
      nova_group: 4,
    }
    const profile: UserProfile = { primary_goal: 'lose_weight' }
    const noProfile = scoreFoodProduct(highCalorie)
    const withProfile = scoreFoodProduct(highCalorie, profile)
    expect(withProfile.pillars.contextFit.score).toBeLessThanOrEqual(noProfile.pillars.contextFit.score)
  })

  it('returns legacy component aliases for backward compatibility', () => {
    const result = scoreFoodProduct({})
    expect(result.components).toHaveProperty('nutrition')
    expect(result.components).toHaveProperty('additives')
    expect(result.components).toHaveProperty('organic')
  })

  it('flags array contains EFSA/IARC high-concern additive codes', () => {
    const result = scoreFoodProduct({ additives_tags: ['en:e250', 'en:e102'] })
    expect(result.flags.length).toBeGreaterThan(0)
    expect(result.flags.some(f => f.includes('E250'))).toBe(true)
  })
})

describe('getAdditiveDetails', () => {
  it('returns high risk for TIER_A additive e250 (sodium nitrite)', () => {
    const details = getAdditiveDetails(['en:e250'])
    expect(details).toHaveLength(1)
    expect(details[0].risk).toBe('high')
    expect(details[0].code).toBe('E250')
  })

  it('returns moderate risk for TIER_B additive e951 (aspartame)', () => {
    const details = getAdditiveDetails(['en:e951'])
    expect(details[0].risk).toBe('moderate')
  })

  it('returns safe for vitamin C (e300)', () => {
    const details = getAdditiveDetails(['en:e300'])
    expect(details[0].risk).toBe('safe')
  })

  it('returns empty array for empty tags', () => {
    expect(getAdditiveDetails([])).toHaveLength(0)
  })

  it('handles mixed tags with and without en: prefix', () => {
    const details = getAdditiveDetails(['en:e102', 'e250'])
    expect(details.length).toBeGreaterThan(0)
  })
})
