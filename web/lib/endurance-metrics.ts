/**
 * Endurance Performance Metrics
 * - VDOT system (Daniels' Running Formula, 2005)
 * - Coggan Power Zones for cycling (Allen & Coggan, 2010)
 * - Injury ramp-rate monitor (Gabbett, BJSM 2016)
 */

// ─── Shared helpers ────────────────────────────────────────────────────────────

/** Format seconds-per-km as "m:ss /unit" */
export function formatPace(secondsPerKm: number, unit: 'km' | 'mile'): string {
  const secs = unit === 'mile' ? secondsPerKm * 1.60934 : secondsPerKm
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')} /${unit}`
}

/** Convert total seconds to "h:mm:ss" or "m:ss" */
export function secondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Parse "[[h:]m:]s" string into total seconds */
export function timeToSeconds(time: string): number {
  const parts = time.trim().split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0]
}

// ─── VDOT System ───────────────────────────────────────────────────────────────

export interface VDOTResult {
  vdot: number
  vo2max_estimate: number
  training_paces: {
    easy: { min_per_km: string; min_per_mile: string }
    marathon: { min_per_km: string; min_per_mile: string }
    threshold: { min_per_km: string; min_per_mile: string }
    interval: { min_per_km: string; min_per_mile: string }
    repetition: { min_per_km: string; min_per_mile: string }
  }
  race_predictions: { [distance: string]: string }
  fitness_level: 'Beginner' | 'Recreational' | 'Competitive' | 'Advanced' | 'Elite'
}

/**
 * VDOT table – columns:
 *  [vdot, 5K_sec, 10K_sec, HM_sec, Marathon_sec, easy_s_per_km, marathon_s_per_km,
 *   threshold_s_per_km, interval_s_per_km, repetition_s_per_km]
 *
 * Derived from Daniels (2005) Appendix tables, interpolated at whole VDOT values.
 * easy ≈ 59–74 %VO2max, marathon ≈ 75–84 %, threshold ≈ 83–88 %,
 * interval ≈ 95–100 %, repetition ≈ 105–120 %
 */
const VDOT_TABLE: readonly [number, number, number, number, number, number, number, number, number, number][] = [
  // vdot  5K     10K    HM      Marathon  easy  mara   T     I     R
  [30, 1694, 3523, 7593, 15767, 480, 432, 420, 384, 360],
  [32, 1595, 3314, 7134, 14819, 456, 408, 396, 360, 336],
  [34, 1507, 3131, 6735, 13983, 432, 390, 378, 342, 318],
  [36, 1430, 2972, 6390, 13253, 414, 372, 360, 324, 300],
  [38, 1360, 2826, 6082, 12607, 396, 354, 342, 312, 288],
  [40, 1297, 2696, 5813, 12037, 378, 336, 324, 300, 276],
  [42, 1240, 2574, 5533, 11487, 360, 324, 312, 288, 264],
  [44, 1188, 2467, 5299, 10993, 348, 312, 300, 276, 252],
  [46, 1140, 2365, 5079, 10546, 336, 300, 288, 264, 240],
  [48, 1097, 2272, 4876, 10138, 324, 288, 276, 252, 234],
  [50, 1057, 2194, 4690, 9764, 312, 276, 264, 246, 228],
  [52, 1021, 2118, 4516, 9413, 300, 270, 258, 237, 219],
  [54,  987, 2047, 4355, 9089, 294, 264, 252, 228, 210],
  [56,  956, 1980, 4205, 8784, 282, 252, 240, 222, 204],
  [58,  927, 1917, 4065, 8500, 276, 246, 234, 216, 198],
  [60,  900, 1858, 3933, 8228, 270, 240, 228, 210, 192],
  [62,  875, 1803, 3810, 7975, 264, 234, 222, 204, 186],
  [64,  852, 1750, 3694, 7734, 258, 228, 216, 198, 180],
  [66,  831, 1701, 3585, 7507, 252, 222, 210, 192, 174],
  [68,  810, 1654, 3482, 7292, 246, 216, 204, 186, 168],
  [70,  791, 1609, 3384, 7086, 240, 210, 198, 181, 163],
  [72,  773, 1567, 3292, 6893, 234, 204, 192, 176, 158],
  [74,  756, 1527, 3204, 6710, 228, 198, 186, 171, 153],
  [76,  740, 1489, 3120, 6535, 222, 192, 180, 166, 148],
  [78,  725, 1452, 3040, 6367, 216, 187, 175, 161, 143],
  [80,  710, 1418, 2964, 6209, 210, 182, 170, 156, 138],
  [82,  696, 1385, 2892, 6058, 204, 177, 165, 151, 133],
  [85,  675, 1335, 2784, 5823, 195, 168, 156, 144, 126],
]

/** Find the two bracketing VDOT rows for a race result and interpolate. */
function lookupVDOT(distanceMeters: number, timeSeconds: number): number {
  // Convert race to an equivalent 5-K time for uniform comparison
  const velocity = distanceMeters / timeSeconds // m/s
  // VO2 at race velocity (Daniels formula): VO2 = -4.6 + 0.182258*v*60 + 0.000104*(v*60)^2
  const vMin = velocity * 60 // m/min
  const vo2 = -4.6 + 0.182258 * vMin + 0.000104 * vMin ** 2
  // %VO2max used at race (Daniels): %VO2max = 0.8 + 0.1894393*e^(-0.012778*t) + 0.2989558*e^(-0.1932605*t/60)
  const t = timeSeconds
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * (t / 60))
  const vdotRaw = vo2 / pct

  // Clamp to table range
  const lo = VDOT_TABLE[0][0]
  const hi = VDOT_TABLE[VDOT_TABLE.length - 1][0]
  return Math.min(hi, Math.max(lo, Math.round(vdotRaw)))
}

/** Linear interpolation of pace columns from the VDOT table */
function interpolatePaces(vdot: number): {
  easy: number; marathon: number; threshold: number; interval: number; repetition: number
  fiveK: number; tenK: number; hm: number; marathon_race: number
} {
  // Find bounding rows
  let lower = VDOT_TABLE[0]
  let upper = VDOT_TABLE[VDOT_TABLE.length - 1]
  for (let i = 0; i < VDOT_TABLE.length - 1; i++) {
    if (VDOT_TABLE[i][0] <= vdot && VDOT_TABLE[i + 1][0] >= vdot) {
      lower = VDOT_TABLE[i]
      upper = VDOT_TABLE[i + 1]
      break
    }
  }
  const span = upper[0] - lower[0]
  const t = span === 0 ? 0 : (vdot - lower[0]) / span
  const lerp = (a: number, b: number) => a + t * (b - a)

  return {
    fiveK: lerp(lower[1], upper[1]),
    tenK: lerp(lower[2], upper[2]),
    hm: lerp(lower[3], upper[3]),
    marathon_race: lerp(lower[4], upper[4]),
    easy: lerp(lower[5], upper[5]),
    marathon: lerp(lower[6], upper[6]),
    threshold: lerp(lower[7], upper[7]),
    interval: lerp(lower[8], upper[8]),
    repetition: lerp(lower[9], upper[9]),
  }
}

function fitnessLevel(vdot: number): VDOTResult['fitness_level'] {
  if (vdot < 35) return 'Beginner'
  if (vdot < 45) return 'Recreational'
  if (vdot < 55) return 'Competitive'
  if (vdot < 65) return 'Advanced'
  return 'Elite'
}

export function calculateVDOT(distanceMeters: number, timeSeconds: number): VDOTResult {
  const vdot = lookupVDOT(distanceMeters, timeSeconds)
  const paces = interpolatePaces(vdot)

  const pace = (sPerKm: number) => ({
    min_per_km: formatPace(sPerKm, 'km'),
    min_per_mile: formatPace(sPerKm, 'mile'),
  })

  // Race predictions (approximate distance → pace per km × distance)
  const racePred = (distM: number, paceSecPerKm: number) =>
    secondsToTime(Math.round((distM / 1000) * paceSecPerKm))

  // 1500m pace ≈ interval pace
  const pace1500 = paces.interval * 0.97
  // 1 mile pace ≈ interval pace * 0.98
  const pace1mi = paces.interval * 0.98
  // 3K pace ≈ interval pace * 1.00
  const pace3k = paces.interval * 1.01
  // 5K predicted from table
  const pace5k = paces.fiveK / 5
  // 10K from table
  const pace10k = paces.tenK / 10
  // 15K ≈ threshold-ish
  const pace15k = paces.threshold * 1.02

  return {
    vdot,
    vo2max_estimate: vdot, // VDOT ≈ VO2max in ml/kg/min by definition
    training_paces: {
      easy: pace(paces.easy),
      marathon: pace(paces.marathon),
      threshold: pace(paces.threshold),
      interval: pace(paces.interval),
      repetition: pace(paces.repetition),
    },
    race_predictions: {
      '1500m': racePred(1500, pace1500),
      '1 mile': racePred(1609, pace1mi),
      '3K': racePred(3000, pace3k),
      '5K': secondsToTime(Math.round(paces.fiveK)),
      '10K': secondsToTime(Math.round(paces.tenK)),
      '15K': racePred(15000, pace15k),
      'Half Marathon': secondsToTime(Math.round(paces.hm)),
      'Marathon': secondsToTime(Math.round(paces.marathon_race)),
    },
    fitness_level: fitnessLevel(vdot),
  }
}

// ─── Coggan Power Zones ────────────────────────────────────────────────────────

export interface PowerZone {
  zone: number
  name: string
  description: string
  ftp_percentage_low: number
  ftp_percentage_high: number
  watts_low: number
  watts_high: number
  typical_duration: string
  physiological_adaptation: string
}

export interface CyclingResult {
  ftp_watts: number
  watts_per_kg: number
  category: string
  zones: PowerZone[]
  tss_per_hour: number
}

const COGGAN_ZONES: readonly {
  zone: number
  name: string
  description: string
  pctLow: number
  pctHigh: number
  duration: string
  adaptation: string
}[] = [
  {
    zone: 1, name: 'Active Recovery', description: 'Easy spinning, recovery rides',
    pctLow: 0, pctHigh: 55,
    duration: '30–90 min',
    adaptation: 'Active recovery, blood-flow promotion',
  },
  {
    zone: 2, name: 'Endurance', description: 'All-day pace, aerobic base building',
    pctLow: 56, pctHigh: 75,
    duration: '1–6 hours',
    adaptation: 'Fat oxidation, mitochondrial density, aerobic efficiency',
  },
  {
    zone: 3, name: 'Tempo', description: 'Brisk sustained effort, "comfortably hard"',
    pctLow: 76, pctHigh: 90,
    duration: '20–90 min',
    adaptation: 'Lactate clearance, glycogen utilisation',
  },
  {
    zone: 4, name: 'Lactate Threshold', description: 'Threshold/sweetspot work',
    pctLow: 91, pctHigh: 105,
    duration: '8–30 min',
    adaptation: 'Raises lactate threshold, increases FTP',
  },
  {
    zone: 5, name: 'VO₂max', description: 'Hard intervals, race pace efforts',
    pctLow: 106, pctHigh: 120,
    duration: '3–8 min',
    adaptation: 'Maximises VO₂max, cardiac output',
  },
  {
    zone: 6, name: 'Anaerobic Capacity', description: 'Short maximal intervals',
    pctLow: 121, pctHigh: 150,
    duration: '30 s – 3 min',
    adaptation: 'Anaerobic capacity, neuromuscular power',
  },
  {
    zone: 7, name: 'Neuromuscular Power', description: 'Maximal sprints, short efforts',
    pctLow: 151, pctHigh: 999,
    duration: '<30 s',
    adaptation: 'Peak power, fast-twitch recruitment',
  },
]

function cyclingCategory(wkg: number): string {
  if (wkg < 2.0) return 'Untrained'
  if (wkg < 2.5) return 'Cat 5'
  if (wkg < 3.0) return 'Cat 4'
  if (wkg < 3.5) return 'Cat 4+'
  if (wkg < 4.0) return 'Cat 3'
  if (wkg < 4.5) return 'Cat 2'
  if (wkg < 5.0) return 'Cat 1'
  return 'Pro / Elite'
}

export function calculateCyclingZones(ftp_watts: number, weight_kg: number): CyclingResult {
  const wkg = weight_kg > 0 ? ftp_watts / weight_kg : 0

  const zones: PowerZone[] = COGGAN_ZONES.map((z) => {
    const wLow = Math.round(ftp_watts * z.pctLow / 100)
    const wHigh = z.pctHigh === 999 ? 9999 : Math.round(ftp_watts * z.pctHigh / 100)
    return {
      zone: z.zone,
      name: z.name,
      description: z.description,
      ftp_percentage_low: z.pctLow,
      ftp_percentage_high: z.pctHigh === 999 ? 999 : z.pctHigh,
      watts_low: wLow,
      watts_high: wHigh,
      typical_duration: z.duration,
      physiological_adaptation: z.adaptation,
    }
  })

  // TSS at FTP for 1 hour = IF² × duration_hours × 100 = 1² × 1 × 100 = 100
  const tss_per_hour = 100

  return {
    ftp_watts,
    watts_per_kg: Math.round(wkg * 100) / 100,
    category: cyclingCategory(wkg),
    zones,
    tss_per_hour,
  }
}

/**
 * Training Stress Score for a single workout.
 * TSS = (duration_sec × avg_watts × IF) / (FTP × 3600) × 100
 * where IF = avg_watts / FTP (simplified; use normalizedPower for accuracy)
 */
export function calculateTSS(duration_min: number, avg_watts: number, ftp: number): number {
  if (ftp <= 0) return 0
  const durationSec = duration_min * 60
  const intensityFactor = avg_watts / ftp
  return Math.round((durationSec * avg_watts * intensityFactor) / (ftp * 3600) * 100)
}

/**
 * Normalized Power (NP): 30-second rolling average raised to the 4th power,
 * then averaged, then 4th root. Requires power samples at 1-second resolution.
 */
export function normalizedPower(power_samples: number[]): number {
  if (power_samples.length < 30) return 0
  const rolling: number[] = []
  for (let i = 29; i < power_samples.length; i++) {
    const window = power_samples.slice(i - 29, i + 1)
    const avg = window.reduce((a, b) => a + b, 0) / 30
    rolling.push(avg ** 4)
  }
  const mean4th = rolling.reduce((a, b) => a + b, 0) / rolling.length
  return Math.round(mean4th ** 0.25)
}

// ─── Ramp Rate (Gabbett 10 % Rule) ────────────────────────────────────────────

export interface WeeklyMileage {
  week: string
  distance_km: number
  change_percent: number
  risk_level: 'Safe' | 'Caution' | 'High Risk'
}

export function checkRampRate(weeks: { week?: string; distance_km: number }[]): WeeklyMileage[] {
  return weeks.map((w, i) => {
    const prev = i > 0 ? weeks[i - 1].distance_km : w.distance_km
    const change = prev > 0 ? ((w.distance_km - prev) / prev) * 100 : 0
    let risk_level: WeeklyMileage['risk_level'] = 'Safe'
    if (change > 20) risk_level = 'High Risk'
    else if (change > 10) risk_level = 'Caution'
    return {
      week: w.week ?? `Week ${i + 1}`,
      distance_km: w.distance_km,
      change_percent: Math.round(change * 10) / 10,
      risk_level,
    }
  })
}
