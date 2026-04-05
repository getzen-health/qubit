import { describe, it, expect } from 'vitest'
import {
  estimateCooper,
  estimateRestingHR,
  getCRFCategory,
  getPercentile,
  predictDecline,
  analyzeVO2Max,
  type VO2MaxTest,
} from '../lib/vo2max'

describe('estimateCooper', () => {
  it('applies Cooper formula: (distance - 504.9) / 44.73', () => {
    const result = estimateCooper(2400)
    const expected = Math.round(((2400 - 504.9) / 44.73) * 10) / 10
    expect(result).toBeCloseTo(expected, 1)
  })

  it('higher distance → higher VO2max', () => {
    expect(estimateCooper(3000)).toBeGreaterThan(estimateCooper(2000))
  })

  it('handles low distance', () => {
    const result = estimateCooper(600)
    expect(result).toBeGreaterThan(0)
  })
})

describe('estimateRestingHR', () => {
  it('uses Uth formula: 15 * (maxHR / restingHR)', () => {
    const result = estimateRestingHR(60, 190)
    const expected = Math.round((15 * (190 / 60)) * 10) / 10
    expect(result).toBeCloseTo(expected, 1)
  })

  it('lower resting HR → higher VO2max', () => {
    expect(estimateRestingHR(50, 190)).toBeGreaterThan(estimateRestingHR(70, 190))
  })
})

describe('getCRFCategory', () => {
  it('returns correct category for 25-year-old male with VO2max 45', () => {
    const cat = getCRFCategory(45, 25, 'male')
    expect(cat).toBe('Good') // male 20-29: Good=[42,45]
  })

  it('returns Very Poor for very low VO2max', () => {
    const cat = getCRFCategory(10, 30, 'male')
    expect(cat).toBe('Very Poor')
  })

  it('returns Superior for very high VO2max', () => {
    const cat = getCRFCategory(60, 35, 'male')
    expect(cat).toBe('Superior')
  })

  it('female thresholds differ from male', () => {
    // 38 is Good for female 20-29, but Fair for male 20-29
    const femaleCat = getCRFCategory(38, 25, 'female')
    const maleCat = getCRFCategory(38, 25, 'male')
    expect(femaleCat).toBe('Good')
    expect(maleCat).toBe('Fair')
  })

  it('age groups: 50-59 has lower thresholds than 20-29', () => {
    // 35 is Good for male 50-59 but Poor for male 20-29
    const older = getCRFCategory(35, 55, 'male')
    const younger = getCRFCategory(35, 25, 'male')
    expect(older).not.toBe(younger)
  })

  it('handles 60+ age group', () => {
    const cat = getCRFCategory(40, 65, 'male')
    expect(cat).toBe('Excellent')
  })
})

describe('getPercentile', () => {
  it('returns low percentile for Very Poor category', () => {
    const pct = getPercentile(10, 25, 'male')
    expect(pct).toBeLessThan(20)
  })

  it('returns high percentile for Superior category', () => {
    const pct = getPercentile(55, 25, 'male')
    expect(pct).toBeGreaterThan(80)
  })

  it('returns a value between 1 and 99', () => {
    const pct = getPercentile(40, 35, 'female')
    expect(pct).toBeGreaterThanOrEqual(1)
    expect(pct).toBeLessThanOrEqual(99)
  })

  it('higher VO2max → higher percentile within same age/sex', () => {
    const low = getPercentile(30, 30, 'male')
    const high = getPercentile(50, 30, 'male')
    expect(high).toBeGreaterThan(low)
  })
})

describe('predictDecline', () => {
  it('active decline rate is 0.5% per year', () => {
    const result = predictDecline(50, 30, 10, true)
    const expected = 50 * Math.pow(0.995, 10)
    expect(result).toBeCloseTo(expected, 1)
  })

  it('sedentary decline rate is 1% per year', () => {
    const result = predictDecline(50, 30, 10, false)
    const expected = 50 * Math.pow(0.99, 10)
    expect(result).toBeCloseTo(expected, 1)
  })

  it('active declines slower than sedentary', () => {
    const active = predictDecline(50, 30, 20, true)
    const sedentary = predictDecline(50, 30, 20, false)
    expect(active).toBeGreaterThan(sedentary)
  })

  it('never drops below 10', () => {
    const result = predictDecline(15, 70, 100, false)
    expect(result).toBeGreaterThanOrEqual(10)
  })
})

describe('analyzeVO2Max', () => {
  it('returns full analysis with all fields', () => {
    const test: VO2MaxTest = {
      date: '2024-01-01',
      method: 'cooper_12min',
      distance_meters: 2800,
      vo2max_estimated: 51.3,
      crf_category: 'Excellent',
      met_capacity: 14.7,
      age: 30,
      sex: 'male',
    }
    const analysis = analyzeVO2Max(test)
    expect(analysis.vo2max).toBe(51.3)
    expect(analysis.category).toBe('Excellent')
    expect(analysis.metCapacity).toBe(14.7)
    expect(analysis.mortalityBenefit).toBeTruthy()
    expect(analysis.trainingRecommendation.zone2Minutes).toBeGreaterThan(0)
    expect(analysis.trainingRecommendation.hiitSessions).toBeGreaterThan(0)
    expect(analysis.improvementPotential).toBeGreaterThan(0)
  })

  it('ageAdjustedDecline has 11 data points (years 0-10)', () => {
    const test: VO2MaxTest = {
      date: '2024-01-01',
      method: 'resting_hr',
      resting_hr: 60,
      max_hr: 190,
      vo2max_estimated: 47.5,
      crf_category: 'Good',
      met_capacity: 13.6,
      age: 35,
      sex: 'male',
    }
    const analysis = analyzeVO2Max(test)
    expect(analysis.ageAdjustedDecline.sedentary).toHaveLength(11)
    expect(analysis.ageAdjustedDecline.active).toHaveLength(11)
    expect(analysis.ageAdjustedDecline.yours).toHaveLength(11)
  })

  it('Very Poor category gets highest improvement potential', () => {
    const test: VO2MaxTest = {
      date: '2024-01-01',
      method: 'cooper_12min',
      vo2max_estimated: 25,
      crf_category: 'Very Poor',
      met_capacity: 7,
      age: 40,
      sex: 'male',
    }
    const analysis = analyzeVO2Max(test)
    expect(analysis.improvementPotential).toBe(7.0)
  })

  it('Superior category gets lowest improvement potential', () => {
    const test: VO2MaxTest = {
      date: '2024-01-01',
      method: 'cooper_12min',
      vo2max_estimated: 60,
      crf_category: 'Superior',
      met_capacity: 17,
      age: 25,
      sex: 'male',
    }
    const analysis = analyzeVO2Max(test)
    expect(analysis.improvementPotential).toBe(1.5)
  })
})
