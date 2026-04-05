import { describe, it, expect } from 'vitest'
import {
  tgHdlRatio,
  metabolicFlexibilityScore,
  checkMetabolicSyndrome,
  calculateMetabolicScore,
  type MetabolicMarkers,
} from '../lib/metabolic-health'

describe('tgHdlRatio', () => {
  it('returns simple TG / HDL ratio rounded to 2 decimal places', () => {
    expect(tgHdlRatio(150, 50)).toBe(3.0)
    expect(tgHdlRatio(100, 60)).toBeCloseTo(1.67, 2)
  })

  it('higher TG → higher ratio', () => {
    expect(tgHdlRatio(200, 50)).toBeGreaterThan(tgHdlRatio(100, 50))
  })

  it('higher HDL → lower ratio', () => {
    expect(tgHdlRatio(150, 70)).toBeLessThan(tgHdlRatio(150, 40))
  })
})

describe('metabolicFlexibilityScore', () => {
  it('returns 100 for perfect scores (all 10s, cravings 1)', () => {
    const result = metabolicFlexibilityScore(10, 10, 10, 1)
    expect(result).toBe(100)
  })

  it('returns 0 for worst scores (all 1s, cravings 10)', () => {
    const result = metabolicFlexibilityScore(1, 1, 1, 10)
    expect(result).toBe(0)
  })

  it('cravings are inverted: high cravings = low score', () => {
    const lowCravings = metabolicFlexibilityScore(5, 5, 5, 2)
    const highCravings = metabolicFlexibilityScore(5, 5, 5, 9)
    expect(lowCravings).toBeGreaterThan(highCravings)
  })

  it('returns a value between 0 and 100', () => {
    const result = metabolicFlexibilityScore(5, 5, 5, 5)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })
})

describe('checkMetabolicSyndrome', () => {
  it('returns no syndrome when 0 criteria met', () => {
    const markers: MetabolicMarkers = {
      waist_cm: 80,
      triglycerides_mgdl: 100,
      hdl_mgdl: 55,
      systolic_bp: 120,
      diastolic_bp: 75,
      fasting_glucose_mgdl: 90,
    }
    const result = checkMetabolicSyndrome(markers, 'male')
    expect(result.criteria_met).toBe(0)
    expect(result.has_metabolic_syndrome).toBe(false)
    expect(result.risk_level).toBe('Low')
  })

  it('returns metabolic syndrome when >= 3 criteria met', () => {
    const markers: MetabolicMarkers = {
      waist_cm: 105, // >94 for male
      triglycerides_mgdl: 200, // >=150
      hdl_mgdl: 35, // <40 for male
      systolic_bp: 140, // >=130
      fasting_glucose_mgdl: 110, // >=100
    }
    const result = checkMetabolicSyndrome(markers, 'male')
    expect(result.criteria_met).toBe(5)
    expect(result.has_metabolic_syndrome).toBe(true)
    expect(result.risk_level).toBe('High')
  })

  it('borderline risk for 2 criteria', () => {
    const markers: MetabolicMarkers = {
      waist_cm: 100, // >94 for male
      triglycerides_mgdl: 160, // >=150
      hdl_mgdl: 55, // NOT <40
      systolic_bp: 120, // NOT >=130
      fasting_glucose_mgdl: 90, // NOT >=100
    }
    const result = checkMetabolicSyndrome(markers, 'male')
    expect(result.criteria_met).toBe(2)
    expect(result.has_metabolic_syndrome).toBe(false)
    expect(result.risk_level).toBe('Borderline')
  })

  it('female waist threshold is 80 cm', () => {
    const markers: MetabolicMarkers = { waist_cm: 85 }
    const result = checkMetabolicSyndrome(markers, 'female')
    expect(result.criteria.waist.met).toBe(true)
    expect(result.criteria.waist.threshold).toContain('80')
  })

  it('female HDL threshold is 50 mg/dL', () => {
    const markers: MetabolicMarkers = { hdl_mgdl: 45 }
    const result = checkMetabolicSyndrome(markers, 'female')
    expect(result.criteria.hdl.met).toBe(true)
  })

  it('diastolic BP >= 85 triggers BP criterion', () => {
    const markers: MetabolicMarkers = { systolic_bp: 120, diastolic_bp: 90 }
    const result = checkMetabolicSyndrome(markers, 'male')
    expect(result.criteria.blood_pressure.met).toBe(true)
  })

  it('handles missing markers gracefully (all false)', () => {
    const result = checkMetabolicSyndrome({}, 'male')
    expect(result.criteria_met).toBe(0)
    expect(result.has_metabolic_syndrome).toBe(false)
  })
})

describe('calculateMetabolicScore', () => {
  it('returns high score for excellent markers', () => {
    const markers: MetabolicMarkers = {
      fasting_glucose_mgdl: 85,
      triglycerides_mgdl: 80,
      hdl_mgdl: 65,
      waist_cm: 78,
      fasting_ease: 9,
      postprandial_energy: 9,
      morning_energy: 9,
      sugar_cravings: 1,
    }
    const result = calculateMetabolicScore(markers, 'male')
    expect(result.overall).toBeGreaterThanOrEqual(85)
    expect(['A', 'B']).toContain(result.grade)
    expect(result.insulin_resistance_proxy).toBe('Low')
  })

  it('returns low score for poor markers', () => {
    const markers: MetabolicMarkers = {
      fasting_glucose_mgdl: 130,
      triglycerides_mgdl: 300,
      hdl_mgdl: 30,
      waist_cm: 120,
      fasting_ease: 1,
      postprandial_energy: 1,
      morning_energy: 1,
      sugar_cravings: 10,
    }
    const result = calculateMetabolicScore(markers, 'male')
    expect(result.overall).toBeLessThan(30)
    expect(result.grade).toBe('F')
    expect(result.insulin_resistance_proxy).toBe('High')
    expect(result.top_risks.length).toBeGreaterThan(0)
  })

  it('component scores are each 0-25', () => {
    const markers: MetabolicMarkers = {
      fasting_glucose_mgdl: 95,
      triglycerides_mgdl: 120,
      hdl_mgdl: 55,
      waist_cm: 85,
    }
    const result = calculateMetabolicScore(markers, 'male')
    expect(result.components.glucose_control).toBeGreaterThanOrEqual(0)
    expect(result.components.glucose_control).toBeLessThanOrEqual(25)
    expect(result.components.lipid_profile).toBeGreaterThanOrEqual(0)
    expect(result.components.lipid_profile).toBeLessThanOrEqual(25)
    expect(result.components.body_composition).toBeGreaterThanOrEqual(0)
    expect(result.components.body_composition).toBeLessThanOrEqual(25)
    expect(result.components.lifestyle_flexibility).toBeGreaterThanOrEqual(0)
    expect(result.components.lifestyle_flexibility).toBeLessThanOrEqual(25)
  })

  it('TG/HDL ratio is computed when both provided', () => {
    const markers: MetabolicMarkers = {
      triglycerides_mgdl: 150,
      hdl_mgdl: 50,
    }
    const result = calculateMetabolicScore(markers, 'male')
    expect(result.tg_hdl_ratio).toBe(3.0)
  })

  it('grade thresholds: A>=90, B>=75, C>=60, D>=45, F<45', () => {
    const markers: MetabolicMarkers = { fasting_glucose_mgdl: 85 }
    const result = calculateMetabolicScore(markers, 'male')
    if (result.overall >= 90) expect(result.grade).toBe('A')
    else if (result.overall >= 75) expect(result.grade).toBe('B')
    else if (result.overall >= 60) expect(result.grade).toBe('C')
    else if (result.overall >= 45) expect(result.grade).toBe('D')
    else expect(result.grade).toBe('F')
  })

  it('HbA1c is used when fasting glucose is absent', () => {
    const markers: MetabolicMarkers = { hba1c_pct: 5.2 }
    const result = calculateMetabolicScore(markers, 'female')
    expect(result.components.glucose_control).toBe(25)
  })

  it('provides recommendations when score is low', () => {
    const markers: MetabolicMarkers = {
      fasting_glucose_mgdl: 130,
      triglycerides_mgdl: 250,
      hdl_mgdl: 30,
      waist_cm: 110,
      fasting_ease: 2,
    }
    const result = calculateMetabolicScore(markers, 'male')
    expect(result.recommendations.length).toBeGreaterThan(0)
  })
})
