/**
 * Posture & Ergonomics Tracker
 *
 * Research basis:
 * - Hoy et al. 2012 — global prevalence of neck pain (desk workers)
 * - Dempsey et al. 2010 — ergonomic risk assessment frameworks (REBA/RULA)
 * - Callaghan & McGill 2001 — lumbar spine load in seated postures
 * - Hendrick 1991 — macroergonomics and sit-stand ratio guidelines
 * - Coenen et al. 2017 — sit-stand desks and musculoskeletal outcomes
 * - OSHA 3171 — Computer Workstations eTool guidelines
 */

// ─── Sit/Stand Tracking ───────────────────────────────────────────────────────

export type PostureMode = 'sitting' | 'standing' | 'walking' | 'unknown'

export interface PostureInterval {
  startTime: string         // ISO timestamp
  endTime: string
  mode: PostureMode
  durationMinutes: number
}

export interface SitStandSummary {
  totalSittingMinutes: number
  totalStandingMinutes: number
  totalWalkingMinutes: number
  longestSittingStreakMinutes: number
  sitStandSwitches: number           // number of posture changes
  sitStandRatio: number              // sitting / (sitting + standing)
  score: number                      // 0–100
  recommendation: string
}

/**
 * Score the sit/stand balance for a day.
 * Target: sit ≤ 50% of work hours, standing ≥ 25%, ≥1 switch per hour
 * Based on Coenen et al. 2017 recommendations
 */
export function scoreSitStandBalance(intervals: PostureInterval[]): SitStandSummary {
  const sitting = intervals.filter(i => i.mode === 'sitting').reduce((s, i) => s + i.durationMinutes, 0)
  const standing = intervals.filter(i => i.mode === 'standing').reduce((s, i) => s + i.durationMinutes, 0)
  const walking = intervals.filter(i => i.mode === 'walking').reduce((s, i) => s + i.durationMinutes, 0)

  // Longest sitting streak
  let longest = 0, current = 0
  for (const i of intervals) {
    if (i.mode === 'sitting') { current += i.durationMinutes; longest = Math.max(longest, current) }
    else current = 0
  }

  // Count posture switches
  const switches = intervals.slice(1).filter((iv, idx) => iv.mode !== intervals[idx].mode).length

  const total = sitting + standing + walking
  const ratio = total > 0 ? sitting / total : 0.8

  // Score: penalise high sit ratio + long streaks + few switches
  let score = 100
  if (ratio > 0.8) score -= 30
  else if (ratio > 0.6) score -= 15
  else if (ratio > 0.5) score -= 5

  if (longest > 90) score -= 25   // > 90 min unbroken sitting is high risk
  else if (longest > 60) score -= 15
  else if (longest > 45) score -= 5

  const workHours = total / 60
  const switchesPerHour = workHours > 0 ? switches / workHours : 0
  if (switchesPerHour < 0.5) score -= 20
  else if (switchesPerHour < 1) score -= 10

  score = Math.max(0, Math.min(100, score))

  let recommendation = ''
  if (longest > 60) recommendation = `You sat for ${Math.round(longest)}min without a break. Stand up every 45–50 min (Coenen 2017).`
  else if (ratio > 0.7) recommendation = `${Math.round(ratio * 100)}% of your day was seated. Aim for ≤50% sitting with regular standing intervals.`
  else if (score >= 80) recommendation = `Good posture balance today! Keep switching every 45 min.`
  else recommendation = `Try the 20-8-2 rule: 20 min sitting, 8 min standing, 2 min moving.`

  return {
    totalSittingMinutes: sitting,
    totalStandingMinutes: standing,
    totalWalkingMinutes: walking,
    longestSittingStreakMinutes: longest,
    sitStandSwitches: switches,
    sitStandRatio: ratio,
    score,
    recommendation,
  }
}

// ─── Ergonomic Desk Checklist (OSHA 3171) ────────────────────────────────────

export interface ErgonomicCheckItem {
  id: string
  category: 'monitor' | 'chair' | 'desk' | 'keyboard' | 'lighting' | 'habits'
  question: string
  tip: string
  passed: boolean
}

export function getErgonomicChecklist(): Omit<ErgonomicCheckItem, 'passed'>[] {
  return [
    // Monitor
    { id: 'monitor_height',    category: 'monitor',   question: 'Is your monitor top at or just below eye level?', tip: 'Position so eyes naturally fall 2–3 inches below top of screen. Reduces neck flexion by ~15°.' },
    { id: 'monitor_distance',  category: 'monitor',   question: 'Is your monitor 50–70 cm from your eyes?',         tip: 'Arm\'s length away. Prevents eye strain and excessive forward head posture.' },
    { id: 'monitor_tilt',      category: 'monitor',   question: 'Is your monitor tilted back 10–20°?',               tip: 'Slight backward tilt matches natural downward gaze angle.' },
    { id: 'no_glare',          category: 'monitor',   question: 'No glare or reflections on your screen?',           tip: 'Position screen perpendicular to windows. Use a matte screen filter if needed.' },
    // Chair
    { id: 'chair_height',      category: 'chair',     question: 'Are your feet flat on floor with knees at 90°?',    tip: 'Adjust chair height so thighs are parallel to floor. Use a footrest if needed.' },
    { id: 'lumbar_support',    category: 'chair',     question: 'Does your chair support your lower back curve?',     tip: 'Lumbar support should fill the inward curve of your lower back (L3–L5 region).' },
    { id: 'armrest_height',    category: 'chair',     question: 'Do armrests support forearms with relaxed shoulders?', tip: 'Elbows at ~90°. Raised shoulders = trapezius tension and neck pain.' },
    { id: 'seat_depth',        category: 'chair',     question: 'Is there 2–3 finger gaps between seat edge and back of knees?', tip: 'Prevents popliteal pressure that can restrict blood flow.' },
    // Desk
    { id: 'desk_height',       category: 'desk',      question: 'Is desk at elbow height when seated?',              tip: 'Elbows at 90–110° when hands on keyboard. Reduces wrist extension.' },
    { id: 'clear_legroom',     category: 'desk',      question: 'Do you have clear legroom under the desk?',          tip: 'Avoid items that force awkward seating positions.' },
    // Keyboard & Mouse
    { id: 'keyboard_position', category: 'keyboard',  question: 'Is keyboard directly in front of you, close to body?', tip: 'Avoids shoulder abduction and reaching. Keep mouse next to keyboard.' },
    { id: 'wrist_neutral',     category: 'keyboard',  question: 'Are your wrists in a neutral, straight position?',   tip: 'Avoid wrist extension or ulnar deviation. A wrist rest helps during pauses, not while typing.' },
    // Lighting
    { id: 'ambient_lighting',  category: 'lighting',  question: 'Is room lighting comfortable (not too bright/dark)?', tip: 'Aim for 300–500 lux for computer work. Use task lighting to avoid squinting.' },
    { id: '20_20_20',          category: 'habits',    question: 'Do you follow the 20-20-20 rule for eye breaks?',    tip: 'Every 20 min, look at something 20 feet away for 20 seconds. Reduces digital eye strain.' },
    { id: 'micro_breaks',      category: 'habits',    question: 'Do you take 1–2 min micro-breaks every 30–45 min?', tip: 'Stand, stretch neck/shoulders. Reduces cumulative lumbar disc compression by 40%.' },
  ]
}

export function scoreErgonomicChecklist(items: ErgonomicCheckItem[]): {
  score: number
  passed: number
  total: number
  worstCategory: string
  priority: ErgonomicCheckItem[]
} {
  const passed = items.filter(i => i.passed).length
  const score = Math.round((passed / items.length) * 100)

  // Find worst category
  const categories = ['monitor','chair','desk','keyboard','lighting','habits'] as const
  const catScores = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat)
    const catPassed = catItems.filter(i => i.passed).length
    return { cat, ratio: catItems.length ? catPassed / catItems.length : 1 }
  })
  const worstCategory = catScores.sort((a, b) => a.ratio - b.ratio)[0].cat

  // Priority = failed items sorted by category importance (chair > monitor > desk > keyboard > habits > lighting)
  const categoryOrder = ['chair','monitor','desk','keyboard','habits','lighting']
  const priority = items
    .filter(i => !i.passed)
    .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
    .slice(0, 3)

  return { score, passed, total: items.length, worstCategory, priority }
}

// ─── Pain Map ─────────────────────────────────────────────────────────────────

export type BodyRegion =
  | 'neck' | 'left_shoulder' | 'right_shoulder' | 'upper_back'
  | 'lower_back' | 'left_wrist' | 'right_wrist' | 'left_hip' | 'right_hip'
  | 'left_knee' | 'right_knee' | 'eyes' | 'head'

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  neck: 'Neck', left_shoulder: 'Left Shoulder', right_shoulder: 'Right Shoulder',
  upper_back: 'Upper Back', lower_back: 'Lower Back',
  left_wrist: 'Left Wrist', right_wrist: 'Right Wrist',
  left_hip: 'Left Hip', right_hip: 'Right Hip',
  left_knee: 'Left Knee', right_knee: 'Right Knee',
  eyes: 'Eyes / Eye Strain', head: 'Headache',
}

// Maps common ergonomic issues to pain regions
export const PAIN_CAUSES: Record<BodyRegion, string[]> = {
  neck:            ['Monitor too high or too low', 'Forward head posture', 'Phone use without stand'],
  left_shoulder:   ['Mouse too far from keyboard', 'Armrest too high/low', 'Poor chair height'],
  right_shoulder:  ['Mouse too far from keyboard', 'Armrest too high/low', 'Poor chair height'],
  upper_back:      ['Poor lumbar support', 'Slouching', 'Monitor too low'],
  lower_back:      ['No lumbar support', 'Prolonged sitting', 'Chair too high'],
  left_wrist:      ['Wrist extension while typing', 'Mouse grip', 'No wrist rest'],
  right_wrist:     ['Wrist extension while typing', 'Mouse grip', 'No wrist rest'],
  left_hip:        ['Prolonged sitting', 'Seat too hard', 'Poor seat depth'],
  right_hip:       ['Prolonged sitting', 'Seat too hard', 'Poor seat depth'],
  left_knee:       ['Chair too high', 'Feet not supported', 'Prolonged sitting'],
  right_knee:      ['Chair too high', 'Feet not supported', 'Prolonged sitting'],
  eyes:            ['Screen glare', 'Monitor too close', 'No 20-20-20 breaks', 'Poor lighting'],
  head:            ['Eye strain', 'Neck tension', 'Dehydration', 'Screen brightness'],
}

export interface PainEntry {
  date: string
  region: BodyRegion
  intensity: 1 | 2 | 3 | 4 | 5    // NRS scale
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  notes?: string
}

export function getPainInsights(entries: PainEntry[]): {
  mostAffected: BodyRegion | null
  trend: 'improving' | 'worsening' | 'stable'
  likelyCauses: string[]
} {
  if (!entries.length) return { mostAffected: null, trend: 'stable', likelyCauses: [] }

  // Most affected region
  const regionCounts = new Map<BodyRegion, number>()
  for (const e of entries) {
    regionCounts.set(e.region, (regionCounts.get(e.region) ?? 0) + e.intensity)
  }
  const mostAffected = [...regionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Trend (last 7 days vs prior 7)
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const mid = Math.floor(sorted.length / 2)
  const firstAvg = sorted.slice(0, mid).reduce((s, e) => s + e.intensity, 0) / Math.max(1, mid)
  const secondAvg = sorted.slice(mid).reduce((s, e) => s + e.intensity, 0) / Math.max(1, sorted.length - mid)
  const trend = secondAvg - firstAvg > 0.5 ? 'worsening'
              : firstAvg - secondAvg > 0.5 ? 'improving'
              : 'stable'

  const likelyCauses = mostAffected ? PAIN_CAUSES[mostAffected] : []

  return { mostAffected, trend, likelyCauses }
}

// ─── Stretching recommendations ───────────────────────────────────────────────

export interface Stretch {
  name: string
  targetRegions: BodyRegion[]
  durationSeconds: number
  instructions: string
  frequency: string
}

export const DESK_STRETCHES: Stretch[] = [
  {
    name: 'Chin Tuck',
    targetRegions: ['neck'],
    durationSeconds: 10,
    instructions: 'Gently pull chin straight back (like making a double chin). Hold 10s. Repeat 10x.',
    frequency: 'Every 30 min'
  },
  {
    name: 'Shoulder Blade Squeeze',
    targetRegions: ['upper_back', 'left_shoulder', 'right_shoulder'],
    durationSeconds: 5,
    instructions: 'Sit tall. Squeeze shoulder blades together for 5s. Release. Repeat 10x.',
    frequency: 'Every hour'
  },
  {
    name: 'Wrist Extension Stretch',
    targetRegions: ['left_wrist', 'right_wrist'],
    durationSeconds: 30,
    instructions: 'Extend arm, palm up. Gently pull fingers down with other hand. Hold 30s each side.',
    frequency: 'Every 2 hours'
  },
  {
    name: 'Hip Flexor Stretch',
    targetRegions: ['left_hip', 'right_hip', 'lower_back'],
    durationSeconds: 60,
    instructions: 'Sit on edge of chair. Slide one foot back. Sit tall. Feel stretch in front of hip. Hold 60s each side.',
    frequency: 'Twice daily'
  },
  {
    name: 'Thoracic Extension',
    targetRegions: ['upper_back', 'lower_back'],
    durationSeconds: 30,
    instructions: 'Place hands behind head. Gently lean back over your chair back. Hold 30s.',
    frequency: 'Every 2 hours'
  },
  {
    name: '20-20-20 Eye Rest',
    targetRegions: ['eyes'],
    durationSeconds: 20,
    instructions: 'Every 20 min: look at something 20 feet away for 20 seconds. Blink slowly 10 times.',
    frequency: 'Every 20 min'
  },
]

export function getRecommendedStretches(painRegions: BodyRegion[]): Stretch[] {
  if (!painRegions.length) return DESK_STRETCHES.slice(0, 3)
  return DESK_STRETCHES.filter(s =>
    s.targetRegions.some(r => painRegions.includes(r))
  )
}
