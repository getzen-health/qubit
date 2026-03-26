// Biological Age Estimation — PhenoAge-inspired wearable biomarker model
// Based on: Levine et al. (Aging 2018), Belsky et al. (PNAS 2015),
//           Buettner (2012), Kokkinos et al. (Circulation 2010),
//           Ferrucci et al. (J Gerontol 2020)

export interface BioAgeInputs {
  chronological_age: number
  resting_hr?: number           // bpm  (-2yr if <60, +2yr if >80)
  hrv_ms?: number               // RMSSD ms  (-2yr if >50ms)
  sleep_hours?: number          // hr/night  (-2yr if 7-9h)
  sleep_quality?: number        // 1-10
  vo2max_estimate?: number      // mL/kg/min  (Kokkinos strongest mortality predictor)
  bmi?: number
  waist_cm?: number
  steps_per_day?: number        // 7-day avg
  smoking: boolean              // +5yr
  alcohol_units_per_week?: number
  stress_level?: number         // 1-10 (10 = highest stress)
  social_connection?: number    // 1-10
  sense_of_purpose?: number     // 1-10
}

export interface BioAgeResult {
  biological_age: number
  pace_of_aging: number         // biological_age / chronological_age (1.0 = same)
  age_difference: number        // biological - chronological (negative = younger)
  category: 'Much Younger' | 'Younger' | 'Same' | 'Older' | 'Much Older'
  top_aging_factors: { factor: string; impact_years: number; improvable: boolean }[]
  top_protective_factors: { factor: string; benefit_years: number }[]
  improvement_potential: number // max years reducible with lifestyle changes
}

export interface BlueZoneInputs {
  natural_movement: number      // 1-10: daily non-exercise activity
  purpose: number               // 1-10: sense of ikigai/purpose
  stress_management: number     // 1-10: downshift routines
  mindful_eating: number        // 1-10: eat until 80% full
  plant_based: number           // 1-10: legume/plant diet proportion
  alcohol_moderation: number    // 1-10: moderate or abstain
  community: number             // 1-10: belong to faith/purpose community
  family_first: number          // 1-10: close family relationships
  social_tribe: number          // 1-10: healthy social circle
}

export interface BlueZoneResult {
  total_score: number           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  longevity_bonus_years: number // estimated extra years from lifestyle (max +10)
  weakest_pillars: string[]
  strongest_pillars: string[]
  recommendations: { pillar: string; action: string; research: string }[]
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface AdjustmentFactor {
  factor: string
  impact_years: number   // positive = ages faster, negative = ages slower
  improvable: boolean
}

// ─── Biological Age ───────────────────────────────────────────────────────────

export function estimateBiologicalAge(inputs: BioAgeInputs): BioAgeResult {
  const { chronological_age } = inputs
  const adjustments: AdjustmentFactor[] = []

  // Resting heart rate (autonomic nervous system fitness)
  if (inputs.resting_hr !== undefined) {
    if (inputs.resting_hr < 50) {
      adjustments.push({ factor: 'Excellent resting HR (<50 bpm)', impact_years: -2, improvable: false })
    } else if (inputs.resting_hr < 60) {
      adjustments.push({ factor: 'Good resting HR (50-60 bpm)', impact_years: -1, improvable: false })
    } else if (inputs.resting_hr >= 80) {
      adjustments.push({ factor: 'Elevated resting HR (≥80 bpm)', impact_years: 2, improvable: true })
    } else if (inputs.resting_hr >= 70) {
      adjustments.push({ factor: 'Slightly elevated resting HR', impact_years: 1, improvable: true })
    }
  }

  // HRV — RMSSD (autonomic recovery, Belsky et al.)
  if (inputs.hrv_ms !== undefined) {
    if (inputs.hrv_ms > 70) {
      adjustments.push({ factor: 'High HRV — excellent autonomic tone', impact_years: -2, improvable: false })
    } else if (inputs.hrv_ms > 50) {
      adjustments.push({ factor: 'Good HRV (>50 ms)', impact_years: -1, improvable: false })
    } else if (inputs.hrv_ms < 20) {
      adjustments.push({ factor: 'Very low HRV — poor recovery (<20 ms)', impact_years: 2, improvable: true })
    } else if (inputs.hrv_ms < 30) {
      adjustments.push({ factor: 'Below-average HRV (<30 ms)', impact_years: 1, improvable: true })
    }
  }

  // Sleep duration (Walker 2017 — sleep is the single most effective anti-aging intervention)
  if (inputs.sleep_hours !== undefined) {
    if (inputs.sleep_hours >= 7 && inputs.sleep_hours <= 9) {
      adjustments.push({ factor: 'Optimal sleep duration (7-9 h)', impact_years: -2, improvable: false })
    } else if (inputs.sleep_hours < 6) {
      adjustments.push({ factor: 'Chronic sleep deprivation (<6 h)', impact_years: 3, improvable: true })
    } else if (inputs.sleep_hours < 7) {
      adjustments.push({ factor: 'Short sleep (<7 h)', impact_years: 1, improvable: true })
    } else if (inputs.sleep_hours > 9.5) {
      adjustments.push({ factor: 'Excess sleep (may indicate fatigue)', impact_years: 1, improvable: true })
    }
  }

  // Sleep quality
  if (inputs.sleep_quality !== undefined) {
    if (inputs.sleep_quality >= 8) {
      adjustments.push({ factor: 'High sleep quality', impact_years: -1, improvable: false })
    } else if (inputs.sleep_quality <= 4) {
      adjustments.push({ factor: 'Poor sleep quality', impact_years: 2, improvable: true })
    } else if (inputs.sleep_quality <= 5) {
      adjustments.push({ factor: 'Below-average sleep quality', impact_years: 1, improvable: true })
    }
  }

  // VO2 max — strongest single mortality predictor (Kokkinos Circulation 2010)
  if (inputs.vo2max_estimate !== undefined) {
    if (inputs.vo2max_estimate >= 50) {
      adjustments.push({ factor: 'Excellent VO₂max (≥50) — elite cardiorespiratory fitness', impact_years: -4, improvable: false })
    } else if (inputs.vo2max_estimate >= 40) {
      adjustments.push({ factor: 'Good VO₂max (40-50 mL/kg/min)', impact_years: -2, improvable: false })
    } else if (inputs.vo2max_estimate < 20) {
      adjustments.push({ factor: 'Very low VO₂max (<20) — high mortality risk', impact_years: 5, improvable: true })
    } else if (inputs.vo2max_estimate < 25) {
      adjustments.push({ factor: 'Low cardiorespiratory fitness', impact_years: 3, improvable: true })
    }
  }

  // BMI
  if (inputs.bmi !== undefined) {
    if (inputs.bmi >= 18.5 && inputs.bmi < 25) {
      adjustments.push({ factor: 'Healthy BMI (18.5-25)', impact_years: -1, improvable: false })
    } else if (inputs.bmi >= 35) {
      adjustments.push({ factor: 'Obesity class II+ (BMI ≥35)', impact_years: 5, improvable: true })
    } else if (inputs.bmi >= 30) {
      adjustments.push({ factor: 'Obesity class I (BMI 30-35)', impact_years: 3, improvable: true })
    } else if (inputs.bmi >= 25) {
      adjustments.push({ factor: 'Overweight (BMI 25-30)', impact_years: 1, improvable: true })
    } else if (inputs.bmi < 18.5) {
      adjustments.push({ factor: 'Underweight (BMI <18.5)', impact_years: 2, improvable: true })
    }
  }

  // Waist circumference (visceral adiposity proxy)
  if (inputs.waist_cm !== undefined) {
    if (inputs.waist_cm > 102) {
      adjustments.push({ factor: 'High abdominal adiposity (waist >102 cm)', impact_years: 3, improvable: true })
    } else if (inputs.waist_cm > 88) {
      adjustments.push({ factor: 'Elevated waist circumference (>88 cm)', impact_years: 1, improvable: true })
    }
  }

  // Daily steps (dose-response mortality reduction, Paluch et al. 2022)
  if (inputs.steps_per_day !== undefined) {
    if (inputs.steps_per_day >= 10000) {
      adjustments.push({ factor: 'Highly active (≥10 k steps/day)', impact_years: -2, improvable: false })
    } else if (inputs.steps_per_day >= 7500) {
      adjustments.push({ factor: 'Active lifestyle (7.5 k+ steps/day)', impact_years: -1, improvable: false })
    } else if (inputs.steps_per_day < 3000) {
      adjustments.push({ factor: 'Sedentary (<3 k steps/day)', impact_years: 3, improvable: true })
    } else if (inputs.steps_per_day < 5000) {
      adjustments.push({ factor: 'Low physical activity (<5 k steps)', impact_years: 2, improvable: true })
    }
  }

  // Smoking (accelerates telomere shortening — Epel et al. 2004)
  if (inputs.smoking) {
    adjustments.push({ factor: 'Smoking — accelerates cellular aging', impact_years: 5, improvable: true })
  }

  // Alcohol
  if (inputs.alcohol_units_per_week !== undefined) {
    if (inputs.alcohol_units_per_week > 21) {
      adjustments.push({ factor: 'Heavy alcohol use (>21 units/wk)', impact_years: 4, improvable: true })
    } else if (inputs.alcohol_units_per_week > 14) {
      adjustments.push({ factor: 'Moderate-heavy alcohol use', impact_years: 2, improvable: true })
    } else if (inputs.alcohol_units_per_week > 7) {
      adjustments.push({ factor: 'Above-recommended alcohol intake', impact_years: 1, improvable: true })
    } else if (inputs.alcohol_units_per_week === 0) {
      adjustments.push({ factor: 'Alcohol-free lifestyle', impact_years: -1, improvable: false })
    }
  }

  // Chronic stress (Epel 2004 — cortisol-driven telomere attrition)
  if (inputs.stress_level !== undefined) {
    if (inputs.stress_level <= 3) {
      adjustments.push({ factor: 'Low chronic stress', impact_years: -1, improvable: false })
    } else if (inputs.stress_level >= 8) {
      adjustments.push({ factor: 'High chronic stress', impact_years: 3, improvable: true })
    } else if (inputs.stress_level >= 6) {
      adjustments.push({ factor: 'Elevated chronic stress', impact_years: 1, improvable: true })
    }
  }

  // Social connection (Holt-Lunstad meta-analysis 2015 — equivalent to smoking 15 cig/day)
  if (inputs.social_connection !== undefined) {
    if (inputs.social_connection >= 8) {
      adjustments.push({ factor: 'Strong social connections', impact_years: -2, improvable: false })
    } else if (inputs.social_connection <= 3) {
      adjustments.push({ factor: 'Social isolation — high mortality risk', impact_years: 3, improvable: true })
    } else if (inputs.social_connection <= 5) {
      adjustments.push({ factor: 'Limited social connection', impact_years: 1, improvable: true })
    }
  }

  // Purpose / ikigai (Sone et al. 2008 — 57% reduced mortality in Tohoku cohort)
  if (inputs.sense_of_purpose !== undefined) {
    if (inputs.sense_of_purpose >= 8) {
      adjustments.push({ factor: 'Strong sense of purpose (ikigai)', impact_years: -2, improvable: false })
    } else if (inputs.sense_of_purpose <= 3) {
      adjustments.push({ factor: 'Low sense of purpose', impact_years: 2, improvable: true })
    }
  }

  const totalAdj = adjustments.reduce((sum, a) => sum + a.impact_years, 0)
  const biological_age = Math.max(18, Math.round(chronological_age + totalAdj))
  const age_difference = biological_age - chronological_age
  const pace_of_aging =
    chronological_age > 0
      ? Math.round((biological_age / chronological_age) * 100) / 100
      : 1.0

  let category: BioAgeResult['category']
  if (age_difference < -5) category = 'Much Younger'
  else if (age_difference < -1) category = 'Younger'
  else if (age_difference <= 1) category = 'Same'
  else if (age_difference <= 5) category = 'Older'
  else category = 'Much Older'

  const top_aging_factors = adjustments
    .filter((a) => a.impact_years > 0)
    .sort((a, b) => b.impact_years - a.impact_years)
    .slice(0, 5)
    .map(({ factor, impact_years, improvable }) => ({ factor, impact_years, improvable }))

  const top_protective_factors = adjustments
    .filter((a) => a.impact_years < 0)
    .sort((a, b) => a.impact_years - b.impact_years)
    .slice(0, 5)
    .map(({ factor, impact_years }) => ({ factor, benefit_years: Math.abs(impact_years) }))

  const improvement_potential = adjustments
    .filter((a) => a.impact_years > 0 && a.improvable)
    .reduce((sum, a) => sum + a.impact_years, 0)

  return {
    biological_age,
    pace_of_aging,
    age_difference,
    category,
    top_aging_factors,
    top_protective_factors,
    improvement_potential,
  }
}

// ─── Blue Zone Power 9 ────────────────────────────────────────────────────────

const BLUE_ZONE_RECS: Record<string, { action: string; research: string }> = {
  'Natural Movement': {
    action:
      'Walk or cycle instead of driving. Take stairs. Garden, do yard work, or housework daily without sitting long.',
    research:
      'Paffenbarger et al. (1986): 2+ hours of daily moderate activity reduces all-cause mortality by 28%.',
  },
  Purpose: {
    action:
      'Identify your ikigai — the reason you get up in the morning. Write a personal mission statement and revisit it monthly.',
    research:
      'Sone et al. (2008): strong sense of purpose reduces all-cause mortality by 57% (9-year Tohoku cohort, n=43,391).',
  },
  'Stress Management': {
    action:
      'Schedule daily downshift rituals: prayer, nap, meditation, or a 10-min walk. Limit news consumption to 20 min/day.',
    research:
      'Epel et al. (2004): chronic psychological stress is linked to accelerated telomere shortening — a biomarker of cellular aging.',
  },
  'Mindful Eating': {
    action:
      "Practice hara hachi bu — stop eating when 80% full. Eat slowly and put utensils down between bites. No screens at meals.",
    research:
      "Okinawan 20% calorie restriction contributes to 25% lower cardiovascular disease risk (Willcox et al. 2014).",
  },
  'Plant-Based Diet': {
    action:
      'Eat at least ½ cup legumes daily. Make vegetables, whole grains, and beans the foundation. Limit meat to 2×/week.',
    research:
      'Buettner (2012): Blue Zone centenarians ate 95% plant-based diets; plant-based patterns reduce CVD mortality by 30%.',
  },
  'Alcohol Moderation': {
    action:
      'If you drink: 1-2 glasses of red wine/day with food in social settings. Avoid binge drinking and daily habit-drinking.',
    research:
      "Sardinian Cannonau wine has 2-3× the polyphenols of other wines. Ronksley et al. (2011): moderate drinkers have lower CVD risk than abstainers.",
  },
  Community: {
    action:
      'Join a faith, purpose, or interest community. Commit to regular attendance. Even secular clubs provide equivalent benefit.',
    research:
      'Hummer et al. (1999): weekly religious/community attendance linked to 7 extra years of life expectancy (US national sample).',
  },
  'Family First': {
    action:
      'Invest meaningful time in aging parents, committed partnership, and children. Prioritize shared family rituals over convenience.',
    research:
      'Cole et al. (2013): strong family bonds reduce pro-inflammatory gene expression — a direct cellular longevity mechanism.',
  },
  'Social Tribe': {
    action:
      "Actively cultivate relationships with health-conscious people. Join or create a 'moai' — a committed social circle with shared values.",
    research:
      "Christakis & Fowler (2007): health behaviors spread through social networks — your friends' habits directly influence your longevity.",
  },
}

export function assessBlueZone(inputs: BlueZoneInputs): BlueZoneResult {
  const pillars = [
    { name: 'Natural Movement', value: inputs.natural_movement },
    { name: 'Purpose', value: inputs.purpose },
    { name: 'Stress Management', value: inputs.stress_management },
    { name: 'Mindful Eating', value: inputs.mindful_eating },
    { name: 'Plant-Based Diet', value: inputs.plant_based },
    { name: 'Alcohol Moderation', value: inputs.alcohol_moderation },
    { name: 'Community', value: inputs.community },
    { name: 'Family First', value: inputs.family_first },
    { name: 'Social Tribe', value: inputs.social_tribe },
  ]

  const totalRaw = pillars.reduce((sum, p) => sum + p.value, 0)
  const total_score = Math.round((totalRaw / 90) * 100)

  let grade: BlueZoneResult['grade']
  if (total_score >= 85) grade = 'A'
  else if (total_score >= 70) grade = 'B'
  else if (total_score >= 55) grade = 'C'
  else if (total_score >= 40) grade = 'D'
  else grade = 'F'

  const longevity_bonus_years = Math.round((total_score / 100) * 10 * 10) / 10

  const sorted = [...pillars].sort((a, b) => a.value - b.value)
  const weakest_pillars = sorted.slice(0, 3).map((p) => p.name)
  const strongest_pillars = sorted
    .slice(-3)
    .reverse()
    .map((p) => p.name)

  const recommendations = weakest_pillars.map((pillar) => {
    const rec = BLUE_ZONE_RECS[pillar] ?? { action: '', research: '' }
    return { pillar, action: rec.action, research: rec.research }
  })

  return {
    total_score,
    grade,
    longevity_bonus_years,
    weakest_pillars,
    strongest_pillars,
    recommendations,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAgeColor(diff: number): string {
  if (diff < -5) return 'text-emerald-400'
  if (diff < -1) return 'text-green-400'
  if (diff <= 1) return 'text-yellow-400'
  if (diff <= 5) return 'text-orange-400'
  return 'text-red-400'
}
