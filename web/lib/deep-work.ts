// Deep Work & Focus Tracker
// Based on: Newport 2016 (Deep Work), Csikszentmihalyi 1990 (Flow),
//           Mark et al. 2008 (23-min recovery), Baumeister & Tierney 2011 (decision fatigue)

export type PomodoroMode = 'classic' | 'extended' | 'deep' | 'custom'
export type TaskType = 'writing' | 'coding' | 'analysis' | 'learning' | 'creative' | 'planning' | 'reading' | 'other'
export type DistractionType = 'internal' | 'external'
export type DistractionCategory = 'phone' | 'email' | 'social_media' | 'colleague' | 'noise' | 'hunger' | 'random_thought' | 'other'

export interface DistractionEntry {
  time: string // HH:MM
  type: DistractionType
  category: DistractionCategory
  recovery_min: number // Mark et al. 2008: avg 23 min to fully refocus
}

export interface FocusSession {
  id?: string
  user_id?: string
  date: string
  start_time: string // HH:MM
  end_time: string // HH:MM
  duration_min: number
  task_type: TaskType
  task_description?: string
  mode: PomodoroMode
  quality_rating: number // 1–5
  flow_state: boolean
  flow_depth?: number // 1–5 if flow occurred
  distractions: DistractionEntry[]
  energy_level: number // 1–5 at session start
  notes?: string
  created_at?: string
}

export interface DeepWorkAnalysis {
  totalDeepWorkMin: number
  goalMin: number // Newport target: 240 min (4h)
  focusScore: number // 0–100
  grade: 'Elite' | 'Strong' | 'Moderate' | 'Scattered'
  flowSessions: number
  avgSessionQuality: number
  distractionsPerHour: number
  mostCommonDistraction: DistractionCategory | null
  bestFocusHour: number // 0–23
  recommendations: string[]
}

// Pomodoro modes — ultradian BRAC (Basic Rest-Activity Cycle) aligned for 90-min deep work
export const POMODORO_MODES: Record<PomodoroMode, { workMin: number; breakMin: number; label: string; description: string }> = {
  classic:  { workMin: 25,  breakMin: 5,  label: 'Classic (25/5)',       description: 'Standard Pomodoro' },
  extended: { workMin: 50,  breakMin: 10, label: 'Extended (50/10)',      description: 'Deeper focus blocks' },
  deep:     { workMin: 90,  breakMin: 20, label: 'Deep Work (90/20)',     description: 'Ultradian BRAC-aligned' },
  custom:   { workMin: 25,  breakMin: 5,  label: 'Custom',                description: 'Set your own intervals' },
}

export const TASK_TYPES: Record<TaskType, { label: string; icon: string; color: string }> = {
  writing:  { label: 'Writing',   icon: '✍️',  color: '#818cf8' },
  coding:   { label: 'Coding',    icon: '💻',  color: '#34d399' },
  analysis: { label: 'Analysis',  icon: '📊',  color: '#f59e0b' },
  learning: { label: 'Learning',  icon: '📚',  color: '#60a5fa' },
  creative: { label: 'Creative',  icon: '🎨',  color: '#f472b6' },
  planning: { label: 'Planning',  icon: '🗺️',  color: '#a78bfa' },
  reading:  { label: 'Reading',   icon: '📖',  color: '#4ade80' },
  other:    { label: 'Other',     icon: '⚡',  color: '#94a3b8' },
}

export const DISTRACTION_CATEGORIES: Record<DistractionCategory, { label: string; icon: string }> = {
  phone:         { label: 'Phone',         icon: '📱' },
  email:         { label: 'Email',         icon: '📧' },
  social_media:  { label: 'Social Media',  icon: '💬' },
  colleague:     { label: 'Colleague',     icon: '👥' },
  noise:         { label: 'Noise',         icon: '🔊' },
  hunger:        { label: 'Hunger',        icon: '🍽️' },
  random_thought:{ label: 'Random Thought',icon: '💭' },
  other:         { label: 'Other',         icon: '❓' },
}

// Focus Score Algorithm (0–100)
// Daily_Focus_Score = deep_work_component + quality_component + flow_component + distraction_component
// Grades: Elite ≥85, Strong 65–84, Moderate 45–64, Scattered <45
export function calculateFocusScore(sessions: FocusSession[]): number {
  if (!sessions.length) return 0

  const goalMin = 240 // Newport 4h/day target
  const totalMin = sessions.reduce((s, x) => s + x.duration_min, 0)
  const avgQuality = sessions.reduce((s, x) => s + x.quality_rating, 0) / sessions.length
  const flowSessions = sessions.filter(s => s.flow_state).length
  const allDistractions = sessions.flatMap(s => s.distractions)
  const distractionsPerHour = totalMin > 0 ? (allDistractions.length / totalMin) * 60 : 0

  const deepWorkComponent = Math.min(40, (totalMin / goalMin) * 40)
  const qualityComponent = ((avgQuality - 1) / 4) * 20 // normalize 1–5 to 0–20
  const flowComponent = flowSessions > 0 ? 20 : 0
  const distractionComponent = Math.max(0, 20 - distractionsPerHour * 5)

  return Math.min(100, Math.round(deepWorkComponent + qualityComponent + flowComponent + distractionComponent))
}

export function getFocusGrade(score: number): DeepWorkAnalysis['grade'] {
  if (score >= 85) return 'Elite'
  if (score >= 65) return 'Strong'
  if (score >= 45) return 'Moderate'
  return 'Scattered'
}

export function getBestFocusHour(sessions: FocusSession[]): number {
  if (!sessions.length) return 9 // default: 9 AM
  const hourQuality: Record<number, { sum: number; count: number }> = {}
  for (const s of sessions) {
    const [h] = s.start_time.split(':').map(Number)
    if (!hourQuality[h]) hourQuality[h] = { sum: 0, count: 0 }
    hourQuality[h].sum += s.quality_rating
    hourQuality[h].count++
  }
  let bestHour = 9, bestAvg = 0
  for (const [h, { sum, count }] of Object.entries(hourQuality)) {
    const avg = sum / count
    if (avg > bestAvg) { bestAvg = avg; bestHour = Number(h) }
  }
  return bestHour
}

function getMostCommonDistraction(sessions: FocusSession[]): DistractionCategory | null {
  const counts: Partial<Record<DistractionCategory, number>> = {}
  for (const s of sessions) {
    for (const d of s.distractions) {
      counts[d.category] = (counts[d.category] ?? 0) + 1
    }
  }
  const entries = Object.entries(counts) as [DistractionCategory, number][]
  if (!entries.length) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function buildRecommendations(analysis: Omit<DeepWorkAnalysis, 'recommendations'>): string[] {
  const recs: string[] = []
  const { totalDeepWorkMin, goalMin, focusScore, flowSessions, avgSessionQuality, distractionsPerHour, bestFocusHour } = analysis

  if (totalDeepWorkMin < goalMin * 0.5) {
    recs.push(`Target ${Math.round(goalMin / 60)}h of deep work daily — Newport's professional minimum for elite output.`)
  }
  if (distractionsPerHour > 4) {
    recs.push('High distraction rate detected. Try "monk mode": phone in another room, website blocker, notification silence.')
  }
  if (flowSessions === 0) {
    recs.push('No flow sessions today. Calibrate challenge to be ~10–15% above your current skill level (Csikszentmihalyi).')
  }
  if (avgSessionQuality < 3) {
    recs.push('Low average quality. Protect morning hours — decision fatigue builds throughout the day (Baumeister 2011).')
  }
  const fmtHour = (h: number) => `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`
  recs.push(`Your peak focus hour is ${fmtHour(bestFocusHour)}. Schedule your most demanding work then.`)
  if (focusScore < 65) {
    recs.push('Newport ritual: same time, same place, same pre-work cue. Consistent ritual reduces startup resistance.')
  }
  return recs.slice(0, 4)
}

export function analyzeDeepWork(sessions: FocusSession[], goalHours = 4): DeepWorkAnalysis {
  const goalMin = goalHours * 60
  const totalDeepWorkMin = sessions.reduce((s, x) => s + x.duration_min, 0)
  const focusScore = calculateFocusScore(sessions)
  const grade = getFocusGrade(focusScore)
  const flowSessions = sessions.filter(s => s.flow_state).length
  const avgSessionQuality = sessions.length
    ? sessions.reduce((s, x) => s + x.quality_rating, 0) / sessions.length
    : 0
  const allDistractions = sessions.flatMap(s => s.distractions)
  const distractionsPerHour = totalDeepWorkMin > 0
    ? (allDistractions.length / totalDeepWorkMin) * 60
    : 0
  const mostCommonDistraction = getMostCommonDistraction(sessions)
  const bestFocusHour = getBestFocusHour(sessions)

  const partial = {
    totalDeepWorkMin, goalMin, focusScore, grade, flowSessions,
    avgSessionQuality, distractionsPerHour, mostCommonDistraction, bestFocusHour,
  }
  const recommendations = buildRecommendations(partial)

  return { ...partial, recommendations }
}

// Hourly quality heatmap — returns array[24] of { hour, avgQuality, sessionCount }
export function buildHourlyHeatmap(sessions: FocusSession[]): { hour: number; avgQuality: number; sessionCount: number }[] {
  const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, sum: 0, count: 0 }))
  for (const s of sessions) {
    const h = parseInt(s.start_time.split(':')[0], 10)
    if (h >= 0 && h < 24) {
      buckets[h].sum += s.quality_rating
      buckets[h].count++
    }
  }
  return buckets.map(b => ({
    hour: b.hour,
    avgQuality: b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : 0,
    sessionCount: b.count,
  }))
}

// Distraction category breakdown for donut chart
export function buildDistractionBreakdown(sessions: FocusSession[]): { category: DistractionCategory; label: string; icon: string; count: number; pct: number }[] {
  const counts: Partial<Record<DistractionCategory, number>> = {}
  let total = 0
  for (const s of sessions) {
    for (const d of s.distractions) {
      counts[d.category] = (counts[d.category] ?? 0) + 1
      total++
    }
  }
  if (!total) return []
  return (Object.entries(counts) as [DistractionCategory, number][])
    .map(([cat, count]) => ({
      category: cat,
      ...DISTRACTION_CATEGORIES[cat],
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}
