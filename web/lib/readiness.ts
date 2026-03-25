/**
 * Readiness / Body Battery utilities
 * Canonical weighting (Bevel-style): HRV 40 % · Sleep 35 % · Resting HR 25 %
 * Research: Flatt et al. (Int J Sports Physiol Perform 2022), Merrigan et al. (NSCA 2023)
 */

// ─── Raw → 0-100 normalisers ─────────────────────────────────────────────────

/** Normalise raw HRV (ms) to 0-100. Ceiling: 65 ms ≈ elite baseline. */
export function toHrvScore(hrv: number): number {
  return Math.min(100, (hrv / 65) * 100)
}

/** Normalise resting HR (bpm) to 0-100. 80 bpm = 0, 40 bpm = 100. */
export function toRhrScore(rhr: number): number {
  return Math.max(0, Math.min(100, ((80 - rhr) / 40) * 100))
}

/** Normalise sleep duration (hours) to 0-100. Ceiling: 9 h = 100. */
export function toSleepScore(sleepHours: number): number {
  return Math.min(100, (sleepHours / 9) * 100)
}

// ─── Canonical readiness score ────────────────────────────────────────────────

/**
 * Canonical readiness score: HRV 40 % · Sleep 35 % · Resting HR 25 %.
 *
 * Inputs:
 *   hrv        – HRV in milliseconds          (null = missing)
 *   rhr        – Resting heart rate in bpm    (null = missing)
 *   sleepHours – Total sleep in hours         (null = missing)
 *
 * Returns a 0-100 integer, or null when all inputs are absent.
 * Missing inputs are excluded and the remaining weights are re-normalised.
 */
export function calculateReadinessScore(
  hrv: number | null,
  rhr: number | null,
  sleepHours: number | null,
): number | null {
  const components: Array<{ score: number; weight: number }> = []
  if (hrv != null)        components.push({ score: toHrvScore(hrv),         weight: 0.40 })
  if (sleepHours != null) components.push({ score: toSleepScore(sleepHours), weight: 0.35 })
  if (rhr != null)        components.push({ score: toRhrScore(rhr),          weight: 0.25 })
  if (components.length === 0) return null

  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  const weighted    = components.reduce((s, c) => s + c.score * c.weight, 0)
  return Math.round(weighted / totalWeight)
}

export type ReadinessZone = 'peak' | 'optimal' | 'moderate' | 'low' | 'unknown'

export interface ReadinessContext {
  score: number | null
  zone: ReadinessZone
  /** Short label like "Peak · 85" */
  label: string
  /** Color class: green / yellow / orange / red */
  colorClass: string
  /** Contextual nutrition recommendation based on readiness */
  nutritionAdvice: string
  /** Suggested macro ratio (carb-heavy after high load, fat-adapted at rest) */
  macroShift: { carbMultiplier: number; proteinMultiplier: number; fatMultiplier: number }
  /** Hydration target multiplier (1.0 = normal, 1.2 = high training day) */
  hydrationMultiplier: number
}

export function getReadinessContext(score: number | null): ReadinessContext {
  if (score == null) {
    return {
      score: null,
      zone: 'unknown',
      label: 'No data',
      colorClass: 'text-text-secondary',
      nutritionAdvice: 'Sync health data to get personalized nutrition guidance.',
      macroShift: { carbMultiplier: 1, proteinMultiplier: 1, fatMultiplier: 1 },
      hydrationMultiplier: 1.0,
    }
  }

  if (score >= 75) {
    return {
      score,
      zone: 'peak',
      label: `Peak · ${score}`,
      colorClass: 'text-green-400',
      nutritionAdvice:
        'High readiness day. Prioritize carbohydrates to fuel performance. Good time for training + higher calorie targets.',
      // Increase carbs for high-intensity fuel (periodization principle)
      macroShift: { carbMultiplier: 1.2, proteinMultiplier: 1.1, fatMultiplier: 0.9 },
      hydrationMultiplier: 1.2,
    }
  }

  if (score >= 50) {
    return {
      score,
      zone: 'optimal',
      label: `Good · ${score}`,
      colorClass: 'text-lime-400',
      nutritionAdvice: 'Good recovery. Balanced macros recommended. Stay hydrated.',
      macroShift: { carbMultiplier: 1.0, proteinMultiplier: 1.0, fatMultiplier: 1.0 },
      hydrationMultiplier: 1.0,
    }
  }

  if (score >= 30) {
    return {
      score,
      zone: 'moderate',
      label: `Moderate · ${score}`,
      colorClass: 'text-yellow-400',
      nutritionAdvice:
        'Moderate recovery. Emphasize anti-inflammatory foods (omega-3, leafy greens). Reduce ultra-processed foods.',
      macroShift: { carbMultiplier: 0.9, proteinMultiplier: 1.1, fatMultiplier: 1.0 },
      hydrationMultiplier: 1.1,
    }
  }

  return {
    score,
    zone: 'low',
    label: `Low · ${score}`,
    colorClass: 'text-red-400',
    nutritionAdvice:
      'Low readiness. Focus on easily digestible, anti-inflammatory foods. Avoid NOVA 4 ultra-processed foods and high-sugar snacks.',
    macroShift: { carbMultiplier: 0.8, proteinMultiplier: 1.2, fatMultiplier: 1.0 },
    hydrationMultiplier: 1.15,
  }
}

/** Returns true if a food scan result warrants a readiness-aware warning */
export function getFoodReadinessWarning(
  productScore: number,
  novaGroup: number | null,
  readinessScore: number | null
): string | null {
  if (readinessScore == null) return null

  // Ultra-processed food on low-readiness day = strong warning
  if (novaGroup === 4 && readinessScore < 50) {
    return `Low recovery day (${readinessScore}) + ultra-processed food. Your body needs whole foods to rebuild.`
  }

  // Any poor food on very low readiness
  if (productScore < 40 && readinessScore < 40) {
    return `Critical: Low readiness (${readinessScore}) combined with a poor-quality food choice. Opt for whole, nutrient-dense foods.`
  }

  // Good food on peak day = positive reinforcement
  if (productScore >= 75 && readinessScore >= 75) {
    return null // no warning needed, all good
  }

  return null
}
