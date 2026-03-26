// Metabolic health scoring utilities
// References:
//   IDF/AHA (2009): Metabolic syndrome consensus criteria
//   Reaven (Diabetes 1988): Insulin resistance / Syndrome X
//   McLaughlin et al. (JCEM 2003): TG/HDL ratio >3.5 predicts insulin resistance
//   Bikman (2020): Hyperinsulinemia precedes hyperglycemia by 10-24 years
//   Volek & Phinney (2012): Metabolic flexibility

export interface MetabolicMarkers {
  fasting_glucose_mgdl?: number
  hba1c_pct?: number
  triglycerides_mgdl?: number
  hdl_mgdl?: number
  ldl_mgdl?: number
  waist_cm?: number
  height_cm?: number
  weight_kg?: number
  systolic_bp?: number
  diastolic_bp?: number
  fasting_ease?: number         // 1-10: ease of skipping breakfast
  postprandial_energy?: number  // 1-10: energy 2h after carb-rich meal
  morning_energy?: number       // 1-10: morning energy before eating
  sugar_cravings?: number       // 1-10: frequency (inverted — lower is better)
}

export interface MetabolicSyndromeCheck {
  criteria: {
    waist: { met: boolean; value?: number; threshold: string }
    triglycerides: { met: boolean; value?: number; threshold: string }
    hdl: { met: boolean; value?: number; threshold: string }
    blood_pressure: { met: boolean; value?: string; threshold: string }
    fasting_glucose: { met: boolean; value?: number; threshold: string }
  }
  criteria_met: number
  has_metabolic_syndrome: boolean
  risk_level: 'Low' | 'Borderline' | 'Moderate' | 'High'
}

export interface MetabolicHealthScore {
  overall: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  insulin_resistance_proxy: 'Low' | 'Moderate' | 'High' | 'Unknown'
  tg_hdl_ratio?: number
  metabolic_flexibility_score: number
  components: {
    glucose_control: number      // 0-25
    lipid_profile: number        // 0-25
    body_composition: number     // 0-25
    lifestyle_flexibility: number // 0-25
  }
  top_risks: string[]
  recommendations: { action: string; impact: string; evidence: string }[]
}

/** TG/HDL ratio (McLaughlin 2003: >3.5 = insulin resistance signal) */
export function tgHdlRatio(tg: number, hdl: number): number {
  return Math.round((tg / hdl) * 100) / 100
}

/** Metabolic flexibility score 0-100 from lifestyle proxies */
export function metabolicFlexibilityScore(
  ease: number,
  postprandial: number,
  morning: number,
  cravings: number
): number {
  // cravings is inverted (high cravings = low flexibility)
  const cravingsScore = 11 - cravings
  const raw = (ease + postprandial + morning + cravingsScore) / 4
  return Math.round(((raw - 1) / 9) * 100)
}

/** IDF/AHA 2009 metabolic syndrome screening */
export function checkMetabolicSyndrome(
  markers: MetabolicMarkers,
  sex: 'male' | 'female'
): MetabolicSyndromeCheck {
  const waistThreshold = sex === 'male' ? 94 : 80

  const waistMet = markers.waist_cm !== undefined && markers.waist_cm > waistThreshold
  const tgMet = markers.triglycerides_mgdl !== undefined && markers.triglycerides_mgdl >= 150
  const hdlThreshold = sex === 'male' ? 40 : 50
  const hdlMet = markers.hdl_mgdl !== undefined && markers.hdl_mgdl < hdlThreshold
  const bpMet =
    (markers.systolic_bp !== undefined && markers.systolic_bp >= 130) ||
    (markers.diastolic_bp !== undefined && markers.diastolic_bp >= 85)
  const fgMet = markers.fasting_glucose_mgdl !== undefined && markers.fasting_glucose_mgdl >= 100

  const bpValue =
    markers.systolic_bp !== undefined && markers.diastolic_bp !== undefined
      ? `${markers.systolic_bp}/${markers.diastolic_bp}`
      : undefined

  const criteria_met = [waistMet, tgMet, hdlMet, bpMet, fgMet].filter(Boolean).length

  let risk_level: MetabolicSyndromeCheck['risk_level'] = 'Low'
  if (criteria_met >= 4) risk_level = 'High'
  else if (criteria_met === 3) risk_level = 'Moderate'
  else if (criteria_met === 2) risk_level = 'Borderline'

  return {
    criteria: {
      waist: {
        met: waistMet,
        value: markers.waist_cm,
        threshold: `>${waistThreshold} cm (${sex === 'male' ? 'men' : 'women'})`,
      },
      triglycerides: {
        met: tgMet,
        value: markers.triglycerides_mgdl,
        threshold: '≥150 mg/dL',
      },
      hdl: {
        met: hdlMet,
        value: markers.hdl_mgdl,
        threshold: `<${hdlThreshold} mg/dL (${sex === 'male' ? 'men' : 'women'})`,
      },
      blood_pressure: {
        met: bpMet,
        value: bpValue,
        threshold: '≥130/85 mmHg',
      },
      fasting_glucose: {
        met: fgMet,
        value: markers.fasting_glucose_mgdl,
        threshold: '≥100 mg/dL',
      },
    },
    criteria_met,
    has_metabolic_syndrome: criteria_met >= 3,
    risk_level,
  }
}

/** Composite metabolic health score 0-100 */
export function calculateMetabolicScore(
  markers: MetabolicMarkers,
  sex: 'male' | 'female'
): MetabolicHealthScore {
  const risks: string[] = []
  const recs: MetabolicHealthScore['recommendations'] = []

  // ── Glucose control (0-25) ──
  let glucoseScore = 12 // default neutral
  if (markers.fasting_glucose_mgdl !== undefined) {
    const fg = markers.fasting_glucose_mgdl
    if (fg < 90) glucoseScore = 25
    else if (fg < 100) glucoseScore = 20
    else if (fg < 110) { glucoseScore = 14; risks.push('Borderline fasting glucose') }
    else if (fg < 126) { glucoseScore = 8; risks.push('Impaired fasting glucose (pre-diabetes range)') }
    else { glucoseScore = 3; risks.push('Elevated fasting glucose (diabetes range)') }
  } else if (markers.hba1c_pct !== undefined) {
    const h = markers.hba1c_pct
    if (h < 5.4) glucoseScore = 25
    else if (h < 5.7) glucoseScore = 20
    else if (h < 6.0) { glucoseScore = 14; risks.push('Borderline HbA1c') }
    else if (h < 6.5) { glucoseScore = 8; risks.push('Pre-diabetic HbA1c') }
    else { glucoseScore = 3; risks.push('Diabetic HbA1c range') }
  }
  if (glucoseScore < 20) {
    recs.push({
      action: 'Reduce refined carbohydrate intake & add post-meal walks',
      impact: 'Lowers fasting glucose 10-15%',
      evidence: 'Colberg et al. (Diabetes Care 2016)',
    })
  }

  // ── Lipid profile (0-25) ──
  let lipidScore = 12
  const ratio =
    markers.triglycerides_mgdl !== undefined && markers.hdl_mgdl !== undefined
      ? tgHdlRatio(markers.triglycerides_mgdl, markers.hdl_mgdl)
      : undefined

  if (ratio !== undefined) {
    if (ratio < 1.5) lipidScore = 25
    else if (ratio < 2.0) lipidScore = 20
    else if (ratio < 3.5) { lipidScore = 13; risks.push('Elevated TG/HDL ratio (insulin resistance risk)') }
    else { lipidScore = 5; risks.push('High TG/HDL ratio — strong insulin resistance signal') }
  } else if (markers.triglycerides_mgdl !== undefined) {
    const tg = markers.triglycerides_mgdl
    if (tg < 100) lipidScore = 23
    else if (tg < 150) lipidScore = 18
    else if (tg < 200) { lipidScore = 11; risks.push('Borderline high triglycerides') }
    else { lipidScore = 5; risks.push('High triglycerides') }
  }
  if (lipidScore < 15 && ratio !== undefined) {
    recs.push({
      action: 'Increase omega-3 rich foods (fatty fish, flaxseed) & reduce sugar',
      impact: 'Lowers TG by 20-30%, raises HDL 5-10%',
      evidence: 'Skulas-Ray et al. (Circulation 2019)',
    })
  }

  // ── Body composition (0-25) ──
  let bodyScore = 12
  const waistThreshold = sex === 'male' ? 94 : 80
  if (markers.waist_cm !== undefined) {
    const w = markers.waist_cm
    const t = waistThreshold
    if (w < t - 10) bodyScore = 25
    else if (w < t) bodyScore = 20
    else if (w < t + 10) { bodyScore = 12; risks.push('Waist circumference above threshold') }
    else { bodyScore = 5; risks.push('Significant abdominal obesity') }
  } else if (markers.weight_kg !== undefined && markers.height_cm !== undefined) {
    const bmi = markers.weight_kg / Math.pow(markers.height_cm / 100, 2)
    if (bmi < 25) bodyScore = 22
    else if (bmi < 27) bodyScore = 18
    else if (bmi < 30) { bodyScore = 12; risks.push('Overweight BMI') }
    else { bodyScore = 6; risks.push('Obese BMI — metabolic risk') }
  }
  if (bodyScore < 15) {
    recs.push({
      action: 'Prioritise resistance training 2-3×/week to build metabolic muscle',
      impact: 'Improves insulin sensitivity 20-40%',
      evidence: 'Strasser & Schobersberger (J Obes 2011)',
    })
  }

  // ── Lifestyle / metabolic flexibility (0-25) ──
  let flexScore = 12
  const hasLifestyle =
    markers.fasting_ease !== undefined ||
    markers.postprandial_energy !== undefined ||
    markers.morning_energy !== undefined ||
    markers.sugar_cravings !== undefined

  if (hasLifestyle) {
    const raw = metabolicFlexibilityScore(
      markers.fasting_ease ?? 5,
      markers.postprandial_energy ?? 5,
      markers.morning_energy ?? 5,
      markers.sugar_cravings ?? 5
    )
    flexScore = Math.round((raw / 100) * 25)
    if (flexScore < 10) risks.push('Poor metabolic flexibility — difficulty switching fuel sources')
  }
  if (flexScore < 13) {
    recs.push({
      action: 'Try time-restricted eating (16:8) or low-carb periods to train fat oxidation',
      impact: 'Improves metabolic flexibility within 4-12 weeks',
      evidence: 'Volek & Phinney (2012); Sutton et al. Cell Metab 2018',
    })
  }

  const overall = Math.min(100, glucoseScore + lipidScore + bodyScore + flexScore)

  let grade: MetabolicHealthScore['grade'] = 'F'
  if (overall >= 90) grade = 'A'
  else if (overall >= 75) grade = 'B'
  else if (overall >= 60) grade = 'C'
  else if (overall >= 45) grade = 'D'

  // Insulin resistance proxy
  let ir: MetabolicHealthScore['insulin_resistance_proxy'] = 'Unknown'
  if (ratio !== undefined) {
    if (ratio < 2.0) ir = 'Low'
    else if (ratio < 3.5) ir = 'Moderate'
    else ir = 'High'
  } else if (markers.fasting_glucose_mgdl !== undefined) {
    if (markers.fasting_glucose_mgdl >= 110) ir = 'High'
    else if (markers.fasting_glucose_mgdl >= 100) ir = 'Moderate'
    else ir = 'Low'
  }

  const flexScoreDisplay = hasLifestyle
    ? metabolicFlexibilityScore(
        markers.fasting_ease ?? 5,
        markers.postprandial_energy ?? 5,
        markers.morning_energy ?? 5,
        markers.sugar_cravings ?? 5
      )
    : 50

  // Add a general recommendation if score is high
  if (overall >= 75 && recs.length === 0) {
    recs.push({
      action: 'Maintain current lifestyle — consider annual metabolic panel to track trends',
      impact: 'Early detection prevents progression to metabolic syndrome',
      evidence: 'AHA Prevention Guidelines 2023',
    })
  }

  return {
    overall,
    grade,
    insulin_resistance_proxy: ir,
    tg_hdl_ratio: ratio,
    metabolic_flexibility_score: flexScoreDisplay,
    components: {
      glucose_control: glucoseScore,
      lipid_profile: lipidScore,
      body_composition: bodyScore,
      lifestyle_flexibility: flexScore,
    },
    top_risks: risks.slice(0, 3),
    recommendations: recs.slice(0, 3),
  }
}
