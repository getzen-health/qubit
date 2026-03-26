// Thermoregulation & Thermal Exposure Tracker
// Based on:
//   Laukkanen et al. 2018 (JAMA Internal Medicine) — sauna 4×/week: CVD mortality -50%
//   Tipton et al. 2017 — cold water immersion: norepinephrine +300%, dopamine +250%
//   Søberg et al. 2021 (Cell Reports Medicine) — 11 min cold/week activates BAT
//   Peake et al. 2017 — cold water immersion for recovery (avoid post-strength training)
//   Huberman Lab 2022 — 11 min/week total cold for metabolic benefit

// ─── Weekly targets ─────────────────────────────────────────────────────────
export const COLD_WEEKLY_TARGET_MIN = 11 // Søberg / Huberman
export const SAUNA_WEEKLY_TARGET_MIN = 57 // Laukkanen: 4 × 15 min ≈ 57 min/wk

// ─── Types ──────────────────────────────────────────────────────────────────
export type ThermalSessionType = 'cold' | 'sauna' | 'contrast'

export interface ThermalLog {
  id?: string
  user_id?: string
  date: string                        // YYYY-MM-DD
  session_type: ThermalSessionType
  method: string                      // e.g. "cold_plunge", "dry_sauna"
  temp_f: number                      // temperature in °F
  duration_min: number
  protocol: string                    // e.g. "metabolism", "cardiovascular"
  time_of_day: string                 // e.g. "morning", "afternoon", "evening"
  alertness_after: number             // 1-5
  mood_after: number                  // 1-5
  recovery_rating: number             // 1-5
  sleep_quality_that_night: number    // 1-5 (filled in later)
  notes: string
  created_at?: string
}

export interface ThermalAnalysis {
  weekly_cold_min: number
  weekly_sauna_min: number
  cold_target_pct: number             // 0-100
  sauna_target_pct: number            // 0-100
  weekly_score: number                // 0-100 composite
  streak: number                      // days with at least one session
  hormetic_dose: number               // total thermal stress minutes (weighted)
  recommendations: string[]
}

export interface ProtocolCard {
  id: string
  title: string
  type: ThermalSessionType
  method: string
  description: string
  target_temp_f: [number, number]
  target_duration_min: [number, number]
  best_use_case: string
  citation: string
  caveats?: string
}

// ─── Cold protocols ──────────────────────────────────────────────────────────
export const COLD_PROTOCOLS: ProtocolCard[] = [
  {
    id: 'metabolism',
    title: 'Metabolism Protocol',
    type: 'cold',
    method: 'cold_plunge',
    description: '2-3 sessions/week at 50-59°F (10-15°C). Activates brown adipose tissue (BAT), raising resting metabolic rate by 5-8%. Keep sessions short but consistent.',
    target_temp_f: [50, 59],
    target_duration_min: [2, 4],
    best_use_case: 'Metabolic health, fat loss, BAT activation',
    citation: 'Søberg et al. Cell Rep Med 2021 — 11 min/week at 10-15°C activates BAT',
  },
  {
    id: 'recovery',
    title: 'Recovery Protocol',
    type: 'cold',
    method: 'ice_bath',
    description: 'Post-endurance training: 10-15 min at 50-59°F. Reduces DOMS and inflammation. ⚠️ Avoid immediately after strength training — may blunt hypertrophy signaling.',
    target_temp_f: [50, 59],
    target_duration_min: [10, 15],
    best_use_case: 'Post-endurance training recovery, DOMS reduction',
    citation: 'Peake et al. J Physiol 2017 — reduces DOMS; blunts hypertrophy if post-strength',
    caveats: 'Avoid after strength training if muscle growth is the goal.',
  },
  {
    id: 'mental_resilience',
    title: 'Mental Resilience Protocol',
    type: 'cold',
    method: 'cold_shower',
    description: 'Deliberate cold discomfort with controlled breathing. Stay calm, resist the urge to exit. Norepinephrine +300%, dopamine +250% sustained for hours. Builds stress tolerance.',
    target_temp_f: [50, 60],
    target_duration_min: [2, 5],
    best_use_case: 'Mood elevation, stress resilience, focus, dopamine',
    citation: 'Tipton et al. Eur J Appl Physiol 2017 — NE +300%, dopamine +250%',
  },
  {
    id: 'contrast',
    title: 'Contrast Therapy',
    type: 'contrast',
    method: 'contrast',
    description: '3-4 min hot → 1-2 min cold × 3-4 rounds. End on cold for alertness & energy. End on warm for relaxation & sleep. Vasodilation/vasoconstriction "pump" enhances recovery.',
    target_temp_f: [50, 104],
    target_duration_min: [12, 24],
    best_use_case: 'Recovery, circulation, versatile (adjust final temp to goal)',
    citation: 'Bieuzen et al. PLoS ONE 2013 — contrast superior to passive recovery',
  },
]

// ─── Sauna protocols ─────────────────────────────────────────────────────────
export const SAUNA_PROTOCOLS: ProtocolCard[] = [
  {
    id: 'cardiovascular',
    title: 'Laukkanen Cardiovascular',
    type: 'sauna',
    method: 'dry_sauna',
    description: '15-20 min at 176-212°F (80-100°C), 4×/week. Associated with 50% lower CVD mortality and 40% lower all-cause mortality vs once per week. Drink 1L water per 30 min.',
    target_temp_f: [176, 212],
    target_duration_min: [15, 20],
    best_use_case: 'Cardiovascular health, longevity, all-cause mortality reduction',
    citation: 'Laukkanen et al. JAMA Intern Med 2018 — 4×/week: CVD -50%, all-cause -40%',
    caveats: 'Drink 1L water per 30 min. Never combine with alcohol.',
  },
  {
    id: 'post_workout',
    title: 'Post-Workout Recovery',
    type: 'sauna',
    method: 'dry_sauna',
    description: '10-15 min within 1 hour of training. Heat shock proteins (HSPs) induced after 30+ min promote muscle repair and neuroprotection. Aids relaxation and next-day readiness.',
    target_temp_f: [176, 212],
    target_duration_min: [10, 15],
    best_use_case: 'Post-workout recovery, muscle repair, heat shock proteins',
    citation: 'Kobayashi et al. J Physiol Sci 2020 — HSP induction aids muscle repair',
  },
  {
    id: 'infrared',
    title: 'Infrared Sauna',
    type: 'sauna',
    method: 'infrared_sauna',
    description: 'Lower temperature (122-140°F / 50-60°C), longer duration 20-30 min. Infrared penetrates deeper tissues. Effective for pain relief, detoxification, and relaxation.',
    target_temp_f: [122, 140],
    target_duration_min: [20, 30],
    best_use_case: 'Pain relief, detox, relaxation, those who find traditional sauna too intense',
    citation: 'Masuda et al. J Card Fail 2005 — IR sauna improves heart failure outcomes',
  },
]

// ─── Safety guidelines ───────────────────────────────────────────────────────
export const SAFETY_GUIDELINES = [
  { icon: '🩺', text: 'Cardiovascular conditions, pregnancy, or any serious health condition: consult your doctor before sauna or cold plunge.' },
  { icon: '🚫', text: 'Never combine alcohol and sauna — risk of dangerous hypotension and heat stroke.' },
  { icon: '💧', text: 'Stay hydrated: drink at least 1L of water for every 30 min of sauna.' },
  { icon: '👥', text: 'Avoid cold plunging alone if you are new to the practice.' },
  { icon: '🛑', text: 'Stop immediately if you experience dizziness, chest pain, shortness of breath, or confusion.' },
  { icon: '⏱️', text: 'Build up gradually — start with shorter durations and milder temperatures.' },
]

// ─── Calculation helpers ─────────────────────────────────────────────────────
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9)
}

/** Sum minutes for cold or contrast sessions in a week */
export function weeklyColdMin(logs: ThermalLog[], weekStart: string): number {
  return logs
    .filter(l => l.date >= weekStart && (l.session_type === 'cold' || l.session_type === 'contrast'))
    .reduce((sum, l) => sum + l.duration_min, 0)
}

/** Sum minutes for sauna or contrast sessions in a week */
export function weeklySaunaMin(logs: ThermalLog[], weekStart: string): number {
  return logs
    .filter(l => l.date >= weekStart && (l.session_type === 'sauna' || l.session_type === 'contrast'))
    .reduce((sum, l) => sum + l.duration_min, 0)
}

/** Weighted "hormetic dose" — cold is 1.2×, sauna 0.8× per minute */
export function calculateHormeticDose(logs: ThermalLog[]): number {
  return logs.reduce((total, l) => {
    const multiplier = l.session_type === 'cold' ? 1.2 : l.session_type === 'contrast' ? 1.0 : 0.8
    return total + l.duration_min * multiplier
  }, 0)
}

/** Returns how many consecutive days ending today had at least one session */
export function calculateStreak(logs: ThermalLog[]): number {
  if (!logs.length) return 0
  const dates = new Set(logs.map(l => l.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export function analyzeThermal(logs: ThermalLog[]): ThermalAnalysis {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const wCold = weeklyColdMin(logs, weekStartStr)
  const wSauna = weeklySaunaMin(logs, weekStartStr)
  const coldPct = Math.min(100, Math.round((wCold / COLD_WEEKLY_TARGET_MIN) * 100))
  const saunaPct = Math.min(100, Math.round((wSauna / SAUNA_WEEKLY_TARGET_MIN) * 100))
  const weeklyScore = Math.round((coldPct + saunaPct) / 2)
  const streak = calculateStreak(logs)
  const hormeticDose = calculateHormeticDose(logs)

  const recommendations: string[] = []
  if (coldPct < 100) {
    const remaining = COLD_WEEKLY_TARGET_MIN - wCold
    recommendations.push(`Add ${remaining} more min of cold exposure this week to hit the Søberg 11 min/week target.`)
  } else {
    recommendations.push('✅ Cold target met this week! Great job activating brown adipose tissue.')
  }
  if (saunaPct < 100) {
    const remaining = SAUNA_WEEKLY_TARGET_MIN - wSauna
    recommendations.push(`Need ${remaining} more min of sauna to reach the Laukkanen 57 min/week cardiovascular target.`)
  } else {
    recommendations.push('✅ Sauna target met this week! Optimal cardiovascular benefit range.')
  }
  if (streak >= 4) {
    recommendations.push('🔥 4+ day streak — consistent thermal practice accelerates adaptation.')
  }

  return { weekly_cold_min: wCold, weekly_sauna_min: wSauna, cold_target_pct: coldPct, sauna_target_pct: saunaPct, weekly_score: weeklyScore, streak, hormetic_dose: hormeticDose, recommendations }
}
