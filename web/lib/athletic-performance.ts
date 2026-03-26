// Athletic Performance Tracker
// References: Banister 1991 (ATL/CTL/TSB), Seiler 2006 (80/20 rule),
// Foster 2001 (sRPE), Riegel 1977 (race predictor), Issurin 2010 (block periodization)

export interface TrainingSession {
  id?: string
  date: string // ISO date YYYY-MM-DD
  sport: string
  durationMin: number
  rpe: number // 1–10 Borg CR10
  sessionLoad?: number
  workoutType: 'easy' | 'moderate' | 'hard' | 'race' | 'recovery'
  heartRateAvg?: number
  heartRateMax?: number
  distanceKm?: number
  elevationM?: number
  notes?: string
}

export interface TrainingMetrics {
  atl: number // Acute Training Load (fatigue proxy) – 7-day EWMA
  ctl: number // Chronic Training Load (fitness proxy) – 42-day EWMA
  tsb: number // Training Stress Balance = CTL – ATL
  trainingStatus: 'fresh' | 'optimal' | 'tired' | 'overreached'
  atlHistory: { date: string; atl: number; ctl: number; tsb: number }[]
}

export interface Sport {
  id: string
  name: string
  icon: string
  category: 'endurance' | 'strength' | 'team' | 'combat' | 'flexibility'
  defaultZones?: { z1: number; z2: number; z3: number; z4: number; z5: number }
}

export interface MesocycleTemplate {
  id: string
  name: string
  sport: string
  weeks: number
  phases: {
    week: number
    focus: string
    intensityPct: number
    volumePct: number
  }[]
}

export interface PeriodizationPhase {
  id: string
  name: string
  description: string
  typicalDurationWeeks: string
  keyCharacteristics: string[]
}

export interface RacePrediction {
  distance: string
  distanceKm: number
  predictedSeconds: number
  predictedFormatted: string
  pace: string // min/km
}

// ── Sports catalogue ──────────────────────────────────────────────────────────
export const SPORTS: Sport[] = [
  { id: 'running', name: 'Running', icon: '🏃', category: 'endurance', defaultZones: { z1: 60, z2: 70, z3: 80, z4: 87, z5: 95 } },
  { id: 'cycling', name: 'Cycling', icon: '🚴', category: 'endurance', defaultZones: { z1: 55, z2: 65, z3: 75, z4: 82, z5: 90 } },
  { id: 'swimming', name: 'Swimming', icon: '🏊', category: 'endurance', defaultZones: { z1: 60, z2: 70, z3: 80, z4: 88, z5: 95 } },
  { id: 'rowing', name: 'Rowing', icon: '🚣', category: 'endurance' },
  { id: 'triathlon', name: 'Triathlon', icon: '🏅', category: 'endurance' },
  { id: 'weightlifting', name: 'Weightlifting', icon: '🏋️', category: 'strength' },
  { id: 'powerlifting', name: 'Powerlifting', icon: '💪', category: 'strength' },
  { id: 'crossfit', name: 'CrossFit', icon: '⚡', category: 'strength' },
  { id: 'gymnastics', name: 'Gymnastics', icon: '🤸', category: 'flexibility' },
  { id: 'yoga', name: 'Yoga', icon: '🧘', category: 'flexibility' },
  { id: 'pilates', name: 'Pilates', icon: '🪷', category: 'flexibility' },
  { id: 'soccer', name: 'Soccer', icon: '⚽', category: 'team' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', category: 'team' },
  { id: 'tennis', name: 'Tennis', icon: '🎾', category: 'team' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', category: 'team' },
  { id: 'mma', name: 'MMA', icon: '🥊', category: 'combat' },
  { id: 'boxing', name: 'Boxing', icon: '🥋', category: 'combat' },
  { id: 'hiking', name: 'Hiking', icon: '🥾', category: 'endurance' },
  { id: 'skiing', name: 'Skiing / Snow', icon: '⛷️', category: 'endurance' },
  { id: 'climbing', name: 'Climbing', icon: '🧗', category: 'strength' },
  { id: 'paddling', name: 'Paddling / SUP', icon: '🏄', category: 'endurance' },
  { id: 'horse_riding', name: 'Horse Riding', icon: '🏇', category: 'team' },
]

// ── RPE / Borg CR10 labels ─────────────────────────────────────────────────────
export const RPE_LABELS: Record<number, string> = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Somewhat hard',
  5: 'Hard',
  6: 'Hard+',
  7: 'Very hard',
  8: 'Very hard+',
  9: 'Extremely hard',
  10: 'Max effort',
}

// ── Session load (Foster 2001 sRPE) ──────────────────────────────────────────
export function calculateSessionLoad(durationMin: number, rpe: number): number {
  return Math.round(durationMin * rpe)
}

// ── ATL / CTL / TSB (Banister 1991) ──────────────────────────────────────────
const ATL_DAYS = 7
const CTL_DAYS = 42
const ATL_LAMBDA = 2 / (ATL_DAYS + 1)
const CTL_LAMBDA = 2 / (CTL_DAYS + 1)

function ewma(prev: number, current: number, lambda: number): number {
  return lambda * current + (1 - lambda) * prev
}

export function calculateTrainingMetrics(sessions: TrainingSession[]): TrainingMetrics {
  if (sessions.length === 0) {
    return { atl: 0, ctl: 0, tsb: 0, trainingStatus: 'fresh', atlHistory: [] }
  }

  // Build a daily load map
  const loadByDay: Record<string, number> = {}
  for (const s of sessions) {
    const load = s.sessionLoad ?? calculateSessionLoad(s.durationMin, s.rpe)
    loadByDay[s.date] = (loadByDay[s.date] ?? 0) + load
  }

  // Fill every day from 90 days ago to today
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 90)

  let atl = 0
  let ctl = 0
  const atlHistory: { date: string; atl: number; ctl: number; tsb: number }[] = []

  const cursor = new Date(start)
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10)
    const dayLoad = loadByDay[key] ?? 0
    atl = ewma(atl, dayLoad, ATL_LAMBDA)
    ctl = ewma(ctl, dayLoad, CTL_LAMBDA)
    const tsb = ctl - atl
    atlHistory.push({ date: key, atl: +atl.toFixed(1), ctl: +ctl.toFixed(1), tsb: +tsb.toFixed(1) })
    cursor.setDate(cursor.getDate() + 1)
  }

  const finalTsb = ctl - atl

  let trainingStatus: TrainingMetrics['trainingStatus']
  if (finalTsb > 25) trainingStatus = 'fresh'
  else if (finalTsb >= 0) trainingStatus = 'optimal'
  else if (finalTsb >= -25) trainingStatus = 'tired'
  else trainingStatus = 'overreached'

  return {
    atl: +atl.toFixed(1),
    ctl: +ctl.toFixed(1),
    tsb: +finalTsb.toFixed(1),
    trainingStatus,
    atlHistory: atlHistory.slice(-30), // last 30 days for chart
  }
}

// ── Race Time Predictor (Riegel 1977) ────────────────────────────────────────
// t2 = t1 × (d2 / d1) ^ 1.06
const RUNNING_DISTANCES = [
  { distance: '5K', distanceKm: 5 },
  { distance: '10K', distanceKm: 10 },
  { distance: 'Half Marathon', distanceKm: 21.0975 },
  { distance: 'Marathon', distanceKm: 42.195 },
  { distance: '50K', distanceKm: 50 },
]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatPace(seconds: number, distanceKm: number): string {
  const secPerKm = seconds / distanceKm
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

export function predictRaceTime(
  knownDistanceKm: number,
  knownTimeSeconds: number,
  targetDistanceKm: number
): number {
  return knownTimeSeconds * Math.pow(targetDistanceKm / knownDistanceKm, 1.06)
}

export function getRacePredictions(
  knownDistanceKm: number,
  knownTimeSeconds: number
): RacePrediction[] {
  return RUNNING_DISTANCES.map(({ distance, distanceKm }) => {
    const predicted = predictRaceTime(knownDistanceKm, knownTimeSeconds, distanceKm)
    return {
      distance,
      distanceKm,
      predictedSeconds: Math.round(predicted),
      predictedFormatted: formatTime(predicted),
      pace: formatPace(predicted, distanceKm),
    }
  })
}

// ── Mesocycle Templates (Issurin 2010) ───────────────────────────────────────
export const MESOCYCLE_TEMPLATES: MesocycleTemplate[] = [
  {
    id: 'hypertrophy',
    name: 'Hypertrophy',
    sport: 'weightlifting',
    weeks: 4,
    phases: [
      { week: 1, focus: 'Accumulation', intensityPct: 65, volumePct: 75 },
      { week: 2, focus: 'Accumulation+', intensityPct: 70, volumePct: 85 },
      { week: 3, focus: 'Intensification', intensityPct: 75, volumePct: 90 },
      { week: 4, focus: 'Deload', intensityPct: 55, volumePct: 50 },
    ],
  },
  {
    id: 'strength',
    name: 'Strength',
    sport: 'powerlifting',
    weeks: 4,
    phases: [
      { week: 1, focus: 'Base Strength', intensityPct: 75, volumePct: 80 },
      { week: 2, focus: 'Build Strength', intensityPct: 82, volumePct: 75 },
      { week: 3, focus: 'Peak Strength', intensityPct: 88, volumePct: 65 },
      { week: 4, focus: 'Deload', intensityPct: 60, volumePct: 45 },
    ],
  },
  {
    id: 'power',
    name: 'Power & Speed',
    sport: 'crossfit',
    weeks: 3,
    phases: [
      { week: 1, focus: 'Velocity Focus', intensityPct: 70, volumePct: 70 },
      { week: 2, focus: 'Max Power', intensityPct: 80, volumePct: 60 },
      { week: 3, focus: 'Taper', intensityPct: 65, volumePct: 40 },
    ],
  },
  {
    id: 'base_endurance',
    name: 'Base Endurance',
    sport: 'running',
    weeks: 6,
    phases: [
      { week: 1, focus: 'Aerobic Base', intensityPct: 60, volumePct: 60 },
      { week: 2, focus: 'Aerobic Base+', intensityPct: 62, volumePct: 70 },
      { week: 3, focus: 'Aerobic Base++', intensityPct: 65, volumePct: 80 },
      { week: 4, focus: 'Aerobic Build', intensityPct: 68, volumePct: 85 },
      { week: 5, focus: 'Aerobic Build+', intensityPct: 70, volumePct: 90 },
      { week: 6, focus: 'Recovery', intensityPct: 55, volumePct: 55 },
    ],
  },
  {
    id: 'build',
    name: 'Build Phase',
    sport: 'running',
    weeks: 4,
    phases: [
      { week: 1, focus: 'Threshold Intro', intensityPct: 72, volumePct: 80 },
      { week: 2, focus: 'Threshold Build', intensityPct: 78, volumePct: 85 },
      { week: 3, focus: 'VO2max Work', intensityPct: 85, volumePct: 80 },
      { week: 4, focus: 'Mini Deload', intensityPct: 65, volumePct: 55 },
    ],
  },
  {
    id: 'peak_taper',
    name: 'Peak & Taper',
    sport: 'running',
    weeks: 2,
    phases: [
      { week: 1, focus: 'Race Sharpening', intensityPct: 88, volumePct: 65 },
      { week: 2, focus: 'Race Taper', intensityPct: 70, volumePct: 40 },
    ],
  },
]

// ── Periodization phases ──────────────────────────────────────────────────────
export const PERIODIZATION_PHASES: PeriodizationPhase[] = [
  {
    id: 'preparation',
    name: 'Preparation',
    description: 'General conditioning and movement skill development before sport-specific training begins.',
    typicalDurationWeeks: '4–8 weeks',
    keyCharacteristics: ['High volume, low intensity', 'GPP (General Physical Preparation)', 'Technique & mobility work', 'Aerobic base building'],
  },
  {
    id: 'base',
    name: 'Base / Accumulation',
    description: 'Building aerobic capacity, strength foundation, and training tolerance.',
    typicalDurationWeeks: '6–12 weeks',
    keyCharacteristics: ['Highest volume phase', '80% of sessions at easy intensity (Seiler 80/20)', 'Progressive overload', 'Sport-specific skill refinement'],
  },
  {
    id: 'build',
    name: 'Build / Transmutation',
    description: 'Converting base fitness into sport-specific performance through threshold and interval work.',
    typicalDurationWeeks: '4–8 weeks',
    keyCharacteristics: ['Reduced volume, increased intensity', 'Lactate threshold sessions', 'VO2max intervals', 'Race-pace simulation'],
  },
  {
    id: 'peak',
    name: 'Peak / Realization',
    description: 'Maximising performance readiness through high-intensity, low-volume training.',
    typicalDurationWeeks: '2–4 weeks',
    keyCharacteristics: ['Low volume, race-specific intensity', 'Speed & power work', 'Simulate race conditions', 'TSB rises (fresh)'],
  },
  {
    id: 'competition',
    name: 'Competition',
    description: 'Race period — maintain fitness with minimal disruption to performance.',
    typicalDurationWeeks: 'Variable',
    keyCharacteristics: ['Maintenance volume', 'Quality over quantity', 'Race-specific warm-ups', 'Recovery between events'],
  },
  {
    id: 'transition',
    name: 'Transition / Off-season',
    description: 'Active recovery after the competitive season to allow physical and mental recuperation.',
    typicalDurationWeeks: '2–4 weeks',
    keyCharacteristics: ['Unstructured activity', 'Cross-training / recreation', 'Mental refresh', 'Address imbalances / injuries'],
  },
  {
    id: 'deload',
    name: 'Deload',
    description: 'Planned reduction in training load to supercompensate and prevent overtraining.',
    typicalDurationWeeks: '1 week (every 3–4 weeks)',
    keyCharacteristics: ['~40–60% normal volume', 'Keep intensity moderate', 'Prioritise sleep & nutrition', 'Monitor HRV / mood'],
  },
]

// ── Deload detection ──────────────────────────────────────────────────────────
export function detectDeloadNeed(sessions: TrainingSession[]): { needed: boolean; reason: string } {
  if (sessions.length === 0) return { needed: false, reason: '' }

  const metrics = calculateTrainingMetrics(sessions)

  if (metrics.tsb < -30) {
    return { needed: true, reason: `TSB is ${metrics.tsb} — significant overreach detected. Schedule a deload week.` }
  }

  // Check consecutive hard days (last 7 days)
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  const recentSessions = sessions.filter(s => new Date(s.date) >= sevenDaysAgo)
  const hardSessions = recentSessions.filter(s => s.workoutType === 'hard' || s.rpe >= 8)
  if (hardSessions.length >= 4) {
    return { needed: true, reason: `${hardSessions.length} hard sessions in the last 7 days. Consider a deload.` }
  }

  // Check 4-week cycle
  const sessionsLast28Days = sessions.filter(s => {
    const d = new Date(s.date)
    const cutoff = new Date(today)
    cutoff.setDate(today.getDate() - 28)
    return d >= cutoff
  })
  const weeksWithHighLoad = [0, 1, 2, 3].filter(w => {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (w + 1) * 7)
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() - w * 7)
    const weekSessions = sessionsLast28Days.filter(s => {
      const d = new Date(s.date)
      return d >= weekStart && d < weekEnd
    })
    const weekLoad = weekSessions.reduce((sum, s) => sum + (s.sessionLoad ?? calculateSessionLoad(s.durationMin, s.rpe)), 0)
    return weekLoad > 1500
  })
  if (weeksWithHighLoad.length >= 3) {
    return { needed: true, reason: '3+ consecutive high-load weeks detected. A deload week is recommended.' }
  }

  return { needed: false, reason: '' }
}

// ── Swim pace predictor ───────────────────────────────────────────────────────
export interface SwimPrediction {
  distance: string
  distanceM: number
  predictedSeconds: number
  predictedFormatted: string
  pacePer100m: string
}

const SWIM_DISTANCES = [
  { distance: '100m', distanceM: 100 },
  { distance: '200m', distanceM: 200 },
  { distance: '400m', distanceM: 400 },
  { distance: '800m', distanceM: 800 },
  { distance: '1500m', distanceM: 1500 },
  { distance: '3.8km (Ironman)', distanceM: 3800 },
]

export function getSwimPredictions(
  knownDistanceM: number,
  knownTimeSeconds: number
): SwimPrediction[] {
  return SWIM_DISTANCES.map(({ distance, distanceM }) => {
    const predicted = knownTimeSeconds * Math.pow(distanceM / knownDistanceM, 1.06)
    const secPer100m = (predicted / distanceM) * 100
    const m = Math.floor(secPer100m / 60)
    const s = Math.round(secPer100m % 60)
    return {
      distance,
      distanceM,
      predictedSeconds: Math.round(predicted),
      predictedFormatted: formatTime(predicted),
      pacePer100m: `${m}:${String(s).padStart(2, '0')} /100m`,
    }
  })
}

export { RUNNING_DISTANCES }
