export interface SleepEnvironmentLog {
  id?: string
  user_id?: string
  date: string
  // Temperature
  room_temp_f: number
  use_celsius: boolean
  // Darkness
  blackout_curtains: boolean
  eye_mask: boolean
  no_electronics_light: boolean
  // Noise
  noise_level: number // 0-10
  white_noise_used: boolean
  earplugs_used: boolean
  // Pre-sleep routine
  no_screens_30min: boolean
  last_meal_hours_before: number
  wind_down_activities: string[]
  consistent_bedtime: boolean
  screen_time_before_bed_min: number
  // Comfort
  mattress_age_years: number
  pillow_comfortable: boolean
  // Outcome (next morning)
  sleep_onset_min: number
  perceived_sleep_quality: number // 1-5
  notes?: string
  created_at?: string
}

export interface SleepEnvironmentScore {
  total: number
  grade: 'Optimal' | 'Good' | 'Fair' | 'Poor'
  pillars: {
    temperature: number
    darkness: number
    noise: number
    preSleep: number
    comfort: number
  }
  tempStatus: 'too_cold' | 'optimal' | 'too_warm'
  tempF: number
  recommendations: string[]
  quickWins: string[]
}

export const WIND_DOWN_ACTIVITIES = [
  { id: 'reading', label: 'Reading (physical book)', benefit: 'Reduces stress 68%' },
  { id: 'stretching', label: 'Light stretching / yoga', benefit: 'Activates parasympathetic' },
  { id: 'warm_bath', label: 'Warm bath/shower', benefit: 'Aids core temp drop' },
  { id: 'meditation', label: 'Meditation / breathing', benefit: 'Reduces cortisol' },
  { id: 'journaling', label: 'Journaling / gratitude', benefit: 'Quiets mental chatter' },
  { id: 'herbal_tea', label: 'Herbal tea', benefit: 'Chamomile reduces anxiety' },
  { id: 'dim_lights', label: 'Dimmed lights 1h before', benefit: 'Triggers melatonin' },
]

export function celsiusToFahrenheit(c: number): number {
  return c * 9 / 5 + 32
}

export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5 / 9
}

function calcTemperatureScore(tempF: number): { score: number; status: 'too_cold' | 'optimal' | 'too_warm' } {
  if (tempF >= 65 && tempF <= 68) return { score: 100, status: 'optimal' }
  if (tempF === 64 || tempF === 69) return { score: 85, status: tempF < 65 ? 'too_cold' : 'too_warm' }
  if ((tempF >= 60 && tempF <= 63) || (tempF >= 70 && tempF <= 72)) return { score: 60, status: tempF < 65 ? 'too_cold' : 'too_warm' }
  return { score: 30, status: tempF < 65 ? 'too_cold' : 'too_warm' }
}

function calcDarknessScore(log: SleepEnvironmentLog): number {
  let score = 0
  if (log.blackout_curtains) score += 40
  if (log.eye_mask) score += 30
  if (log.no_electronics_light) score += 30
  return score
}

function calcNoiseScore(log: SleepEnvironmentLog): number {
  let score = 100 - log.noise_level * 10
  if (log.white_noise_used) score += 20
  return Math.min(100, Math.max(0, score))
}

function calcPreSleepScore(log: SleepEnvironmentLog): number {
  let score = 0
  if (log.no_screens_30min) score += 25
  if (log.last_meal_hours_before >= 3) score += 25
  if (log.wind_down_activities.length > 0) score += 25
  if (log.consistent_bedtime) score += 25
  return score
}

function calcComfortScore(log: SleepEnvironmentLog): number {
  let score = 0
  if (log.mattress_age_years < 7) score = 100
  else if (log.mattress_age_years < 10) score = 70
  else score = 40
  if (log.pillow_comfortable) score += 20
  return Math.min(100, score)
}

export function calculateSleepEnvironmentScore(log: SleepEnvironmentLog): SleepEnvironmentScore {
  const { score: tempScore, status: tempStatus } = calcTemperatureScore(log.room_temp_f)
  const darknessScore = calcDarknessScore(log)
  const noiseScore = calcNoiseScore(log)
  const preSleepScore = calcPreSleepScore(log)
  const comfortScore = calcComfortScore(log)

  const total = Math.round(
    tempScore * 0.25 +
    darknessScore * 0.25 +
    noiseScore * 0.20 +
    preSleepScore * 0.20 +
    comfortScore * 0.10
  )

  let grade: SleepEnvironmentScore['grade']
  if (total >= 85) grade = 'Optimal'
  else if (total >= 65) grade = 'Good'
  else if (total >= 45) grade = 'Fair'
  else grade = 'Poor'

  const recommendations: string[] = []
  const quickWins: { label: string; gain: number }[] = []

  // Temperature recommendations
  if (tempStatus === 'too_warm') {
    recommendations.push('Lower room temperature to 65–68°F (18–20°C) — elevated temps increase wakefulness and reduce deep sleep.')
    quickWins.push({ label: 'Lower thermostat to 66°F', gain: (100 - tempScore) * 0.25 })
  } else if (tempStatus === 'too_cold') {
    recommendations.push('Raise room temperature slightly to 65–68°F — too cold also disrupts sleep continuity.')
    quickWins.push({ label: 'Raise thermostat to 66°F', gain: (100 - tempScore) * 0.25 })
  }

  // Darkness recommendations
  if (!log.blackout_curtains && !log.eye_mask) {
    recommendations.push('Even 10 lux during sleep suppresses melatonin 50% (Halperin 2014). Use blackout curtains or an eye mask.')
    quickWins.push({ label: 'Use an eye mask tonight', gain: 30 * 0.25 })
  } else if (!log.blackout_curtains) {
    recommendations.push('Blackout curtains eliminate streetlight intrusion — adds 40 points to your darkness pillar.')
    quickWins.push({ label: 'Install blackout curtains', gain: 40 * 0.25 })
  }
  if (!log.no_electronics_light) {
    recommendations.push('Cover or remove standby LED indicators — even tiny red/blue lights can interrupt melatonin production.')
    quickWins.push({ label: 'Cover standby LEDs', gain: 30 * 0.25 })
  }

  // Noise recommendations
  if (log.noise_level > 5) {
    recommendations.push('Noise above 55 dB disrupts sleep architecture (Basner 2011). Consider earplugs or white noise.')
  }
  if (!log.white_noise_used && log.noise_level > 3) {
    recommendations.push('White noise masks environmental sounds and adds 20 pts to your noise pillar.')
    quickWins.push({ label: 'Play white noise', gain: 20 * 0.20 })
  }

  // Pre-sleep recommendations
  if (!log.no_screens_30min) {
    recommendations.push('Blue light (480nm) delays melatonin onset by 1.5h (Gooley 2011). No screens 30+ min before bed.')
    quickWins.push({ label: 'No screens 30min before bed', gain: 25 * 0.20 })
  }
  if (log.last_meal_hours_before < 3) {
    recommendations.push('Eating within 3h of bedtime raises core temperature and delays sleep onset.')
    quickWins.push({ label: 'Finish dinner 3h before bed', gain: 25 * 0.20 })
  }
  if (log.wind_down_activities.length === 0) {
    recommendations.push('Add a wind-down activity (reading, stretching, warm bath) to reduce cortisol before sleep.')
    quickWins.push({ label: 'Try a 10min wind-down routine', gain: 25 * 0.20 })
  }
  if (!log.consistent_bedtime) {
    recommendations.push('Irregular bedtimes disrupt circadian rhythm. A consistent schedule is one of the highest-impact sleep habits.')
    quickWins.push({ label: 'Set a consistent bedtime', gain: 25 * 0.20 })
  }

  // Comfort recommendations
  if (log.mattress_age_years >= 10) {
    recommendations.push('Mattresses older than 10 years significantly correlate with reduced sleep quality (Ohayon 2001). Consider replacing.')
  } else if (log.mattress_age_years >= 7) {
    recommendations.push('Your mattress is approaching end-of-life (7–10yr range). Monitor comfort and start researching replacements.')
  }
  if (!log.pillow_comfortable) {
    recommendations.push('Pillow discomfort creates micro-arousals. Consider a contour pillow sized to your sleep position.')
    quickWins.push({ label: 'Replace uncomfortable pillow', gain: 20 * 0.10 })
  }

  // Sort quick wins by impact, take top 3
  quickWins.sort((a, b) => b.gain - a.gain)
  const topQuickWins = quickWins.slice(0, 3).map(q => q.label)

  return {
    total,
    grade,
    pillars: {
      temperature: tempScore,
      darkness: darknessScore,
      noise: noiseScore,
      preSleep: preSleepScore,
      comfort: comfortScore,
    },
    tempStatus,
    tempF: log.room_temp_f,
    recommendations,
    quickWins: topQuickWins,
  }
}
