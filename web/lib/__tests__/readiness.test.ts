import { describe, it, expect } from 'vitest'
import { calculateReadinessScore, toHrvScore, toRhrScore, toSleepScore } from '../readiness'

describe('calculateReadinessScore', () => {
  it('good HRV + good sleep + low RHR → score ≥ 80', () => {
    // HRV 70ms → toHrvScore = min(100, 70/65*100) ≈ 100 → contributes 35
    // sleep 8h  → toSleepScore = min(100, 8/9*100) ≈ 89 → contributes 30% * 89
    // RHR 55bpm → toRhrScore = (80-55)/40*100 = 62.5 → contributes 25%
    const score = calculateReadinessScore(70, 55, 8)
    expect(score).not.toBeNull()
    expect(score!).toBeGreaterThanOrEqual(80)
  })

  it('all zeros → score = 0', () => {
    // HRV 0 → score 0, sleep 0 → score 0, RHR 80 → score 0 (max penalised)
    const score = calculateReadinessScore(0, 80, 0)
    expect(score).toBe(0)
  })

  it('returns null when all inputs are absent', () => {
    const score = calculateReadinessScore(null, null, null)
    expect(score).toBeNull()
  })

  it('weights sum to ~100% (35+30+25+10)', () => {
    // With all four components at score 100, result should be 100
    const score = calculateReadinessScore(65, 40, 9, 100) // all maxed
    expect(score).toBe(100)
  })

  it('missing inputs are re-normalised correctly', () => {
    // Only HRV provided — weight is 35%, but re-normalised to 100%
    const hrOnly = calculateReadinessScore(65, null, null)
    // HRV = 65ms → score = 100 → result should be 100
    expect(hrOnly).toBe(100)
  })

  it('strain score contributes 10% of total weight', () => {
    // Same HRV+sleep+RHR, but different strain scores — difference should be small
    const noStrain = calculateReadinessScore(50, 60, 7, null)
    const highStrain = calculateReadinessScore(50, 60, 7, 100)
    expect(highStrain!).toBeGreaterThan(noStrain!)
  })
})

describe('readiness normalisers', () => {
  it('toHrvScore: 65ms → 100', () => {
    expect(toHrvScore(65)).toBe(100)
  })

  it('toHrvScore: 0ms → 0', () => {
    expect(toHrvScore(0)).toBe(0)
  })

  it('toHrvScore: above ceiling is clamped to 100', () => {
    expect(toHrvScore(130)).toBe(100)
  })

  it('toRhrScore: 40bpm (elite) → 100', () => {
    expect(toRhrScore(40)).toBe(100)
  })

  it('toRhrScore: 80bpm → 0', () => {
    expect(toRhrScore(80)).toBe(0)
  })

  it('toSleepScore: 9h → 100', () => {
    expect(toSleepScore(9)).toBe(100)
  })

  it('toSleepScore: 0h → 0', () => {
    expect(toSleepScore(0)).toBe(0)
  })
})
