/**
 * Cognitive Performance Tests
 * Evidence-based scoring for reaction time, inhibitory control, and working memory.
 *
 * References:
 * - Diamond (2013): Core executive functions
 * - Oken et al. (2006): Processing speed norms
 * - Walker (2017): Sleep deprivation & prefrontal function
 * - Lezak (2004): Digit span norms (Miller 1956: 7±2)
 */

export interface ReactionTimeResult {
  trials: number[]
  mean_ms: number
  median_ms: number
  std_dev: number
  /** 0-25 pts */
  score: number
  /** Age-adjusted percentile */
  percentile: number
  category: 'Exceptional' | 'Above Average' | 'Average' | 'Below Average' | 'Poor'
}

export interface GoNoGoResult {
  total_trials: number
  correct_go: number
  correct_nogo: number
  /** False alarms: pressed on red stimulus */
  commission_errors: number
  /** Misses: did not press on green stimulus */
  omission_errors: number
  avg_rt_ms: number
  /** 0-25 pts based on accuracy % */
  score: number
  /** 0-100: commission accuracy × 100 */
  inhibition_score: number
}

export interface DigitSpanResult {
  max_forward_span: number
  max_backward_span: number
  /** 0-25 pts */
  score: number
  category: 'Superior' | 'High Average' | 'Average' | 'Low Average' | 'Borderline'
}

export interface CognitiveAssessment {
  date: string
  reaction_time?: ReactionTimeResult
  go_no_go?: GoNoGoResult
  digit_span?: DigitSpanResult
  /** 0-100 composite */
  total_score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  time_of_day: 'morning' | 'afternoon' | 'evening'
  notes?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

// ---------------------------------------------------------------------------
// Reaction Time
// ---------------------------------------------------------------------------

/** Age-adjusted average reaction times (ms) based on Oken et al. 2006 */
const RT_AGE_NORMS: { maxAge: number; avgMs: number }[] = [
  { maxAge: 29, avgMs: 250 },
  { maxAge: 39, avgMs: 270 },
  { maxAge: 49, avgMs: 290 },
  { maxAge: 59, avgMs: 310 },
  { maxAge: Infinity, avgMs: 330 },
]

function getAgeNorm(age?: number): number {
  if (!age) return 270 // default to 30s norm
  return RT_AGE_NORMS.find((n) => age <= n.maxAge)?.avgMs ?? 330
}

function rtPercentile(meanMs: number, age?: number): number {
  const norm = getAgeNorm(age)
  // Approximate with a ±80ms std deviation band
  const sd = 80
  const z = (norm - meanMs) / sd
  // Clamp to 1–99
  const p = Math.round(50 + z * 34.1)
  return Math.min(99, Math.max(1, p))
}

function rtCategory(percentile: number): ReactionTimeResult['category'] {
  if (percentile >= 90) return 'Exceptional'
  if (percentile >= 70) return 'Above Average'
  if (percentile >= 30) return 'Average'
  if (percentile >= 10) return 'Below Average'
  return 'Poor'
}

function rtScore(meanMs: number): number {
  if (meanMs < 200) return 25
  if (meanMs < 240) return 22
  if (meanMs < 280) return 18
  if (meanMs < 320) return 14
  if (meanMs < 360) return 10
  return 6
}

export function scoreReactionTime(trials: number[], age?: number): ReactionTimeResult {
  if (!trials.length) {
    return {
      trials: [],
      mean_ms: 0,
      median_ms: 0,
      std_dev: 0,
      score: 0,
      percentile: 1,
      category: 'Poor',
    }
  }
  const mean_ms = Math.round(trials.reduce((s, v) => s + v, 0) / trials.length)
  const median_ms = Math.round(median(trials))
  const std_dev = Math.round(stdDev(trials, mean_ms))
  const score = rtScore(mean_ms)
  const percentile = rtPercentile(mean_ms, age)
  const category = rtCategory(percentile)
  return { trials, mean_ms, median_ms, std_dev, score, percentile, category }
}

// ---------------------------------------------------------------------------
// Go / No-Go
// ---------------------------------------------------------------------------

export function scoreGoNoGo(
  results: { wasGo: boolean; responded: boolean; rt_ms?: number }[]
): GoNoGoResult {
  const total_trials = results.length
  const goTrials = results.filter((r) => r.wasGo)
  const nogoTrials = results.filter((r) => !r.wasGo)

  const correct_go = goTrials.filter((r) => r.responded).length
  const correct_nogo = nogoTrials.filter((r) => !r.responded).length
  const commission_errors = nogoTrials.filter((r) => r.responded).length
  const omission_errors = goTrials.filter((r) => !r.responded).length

  const rts = results.filter((r) => r.wasGo && r.responded && r.rt_ms != null).map((r) => r.rt_ms!)
  const avg_rt_ms = rts.length ? Math.round(rts.reduce((s, v) => s + v, 0) / rts.length) : 0

  const accuracy =
    total_trials > 0
      ? ((correct_go + correct_nogo) / total_trials) * 100
      : 0

  let score: number
  if (accuracy >= 97) score = 25
  else if (accuracy >= 93) score = 22
  else if (accuracy >= 87) score = 18
  else if (accuracy >= 80) score = 14
  else if (accuracy >= 70) score = 10
  else score = 6

  const nogoTotal = nogoTrials.length
  const inhibition_score = nogoTotal > 0 ? Math.round((correct_nogo / nogoTotal) * 100) : 0

  return {
    total_trials,
    correct_go,
    correct_nogo,
    commission_errors,
    omission_errors,
    avg_rt_ms,
    score,
    inhibition_score,
  }
}

// ---------------------------------------------------------------------------
// Digit Span
// ---------------------------------------------------------------------------

function digitSpanScore(span: number): number {
  if (span >= 9) return 25
  if (span === 8) return 22
  if (span === 7) return 19
  if (span === 6) return 15
  if (span === 5) return 11
  if (span === 4) return 7
  return 3
}

function digitSpanCategory(span: number): DigitSpanResult['category'] {
  if (span >= 9) return 'Superior'
  if (span >= 8) return 'High Average'
  if (span >= 6) return 'Average'
  if (span >= 5) return 'Low Average'
  return 'Borderline'
}

export function scoreDigitSpan(forwardSpan: number, backwardSpan: number): DigitSpanResult {
  // Use forward span as primary metric; backward provides richer context but is harder
  const effectiveSpan = Math.round((forwardSpan + backwardSpan) / 2)
  const score = digitSpanScore(effectiveSpan)
  const category = digitSpanCategory(effectiveSpan)
  return {
    max_forward_span: forwardSpan,
    max_backward_span: backwardSpan,
    score,
    category,
  }
}

// ---------------------------------------------------------------------------
// Composite
// ---------------------------------------------------------------------------

export function compositeScore(
  rt?: ReactionTimeResult,
  gng?: GoNoGoResult,
  ds?: DigitSpanResult
): number {
  const parts: number[] = []
  if (rt) parts.push(rt.score)
  if (gng) parts.push(gng.score)
  if (ds) parts.push(ds.score)
  if (!parts.length) return 0
  // Each sub-test max is 25; composite normalised to 0-100
  const sum = parts.reduce((a, b) => a + b, 0)
  const maxPossible = parts.length * 25
  return Math.round((sum / maxPossible) * 100)
}

export function compositeGrade(score: number): CognitiveAssessment['grade'] {
  if (score >= 88) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

export function timeOfDay(): CognitiveAssessment['time_of_day'] {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
