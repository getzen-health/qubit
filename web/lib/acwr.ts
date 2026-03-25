/**
 * Acute:Chronic Workload Ratio (ACWR)
 *
 * Developed by Blanch & Gabbett (2016) and widely validated in sports science.
 * acuteLoad  = average daily load over last 7 days
 * chronicLoad = average daily load over last 28 days
 * ACWR = acute / chronic  →  sweet spot: 0.8 – 1.3
 */

export interface DailyLoad {
  date: string
  load: number
}

/**
 * Calculate ACWR from an array of daily loads sorted ascending by date.
 * Requires at least 28 days to produce a meaningful result.
 * Returns null when chronic load is zero (no prior training data).
 */
export function calculateACWR(dailyLoads: DailyLoad[]): number | null {
  if (dailyLoads.length === 0) return null

  // Sort ascending so last entries = most recent
  const sorted = [...dailyLoads].sort((a, b) => a.date.localeCompare(b.date))

  const chronic28 = sorted.slice(-28)
  const acute7    = sorted.slice(-7)

  if (chronic28.length === 0) return null

  const chronicLoad = chronic28.reduce((sum, d) => sum + d.load, 0) / 28
  if (chronicLoad === 0) return null

  const acuteLoad = acute7.length > 0
    ? acute7.reduce((sum, d) => sum + d.load, 0) / 7
    : 0

  return acuteLoad / chronicLoad
}

/**
 * Convert ACWR to a 0-100 strain score.
 * 100 = perfect (0.9 – 1.1), penalty outside the 0.8 – 1.3 sweet spot.
 */
export function acwrToStrainScore(acwr: number | null): number {
  if (acwr === null) return 50 // neutral when no data

  // Perfect band: 0.9 – 1.1 → 100
  if (acwr >= 0.9 && acwr <= 1.1) return 100

  // Sweet spot fringe: 0.8 – 0.9 or 1.1 – 1.3 → 80-99
  if (acwr >= 0.8 && acwr < 0.9) {
    return Math.round(80 + ((acwr - 0.8) / 0.1) * 20)
  }
  if (acwr > 1.1 && acwr <= 1.3) {
    return Math.round(80 + ((1.3 - acwr) / 0.2) * 20)
  }

  // Under-training: < 0.8 → linear drop from 80 toward 0
  if (acwr < 0.8) {
    return Math.max(0, Math.round((acwr / 0.8) * 80))
  }

  // Over-training: > 1.3 → linear drop from 80 toward 0
  return Math.max(0, Math.round(((2.0 - acwr) / 0.7) * 80))
}

export type ACWRZone = 'optimal' | 'under-training' | 'over-training' | 'unknown'

export function acwrZone(acwr: number | null): ACWRZone {
  if (acwr === null) return 'unknown'
  if (acwr >= 0.8 && acwr <= 1.3) return 'optimal'
  if (acwr < 0.8) return 'under-training'
  return 'over-training'
}

export function acwrLabel(acwr: number | null): string {
  const zone = acwrZone(acwr)
  if (zone === 'unknown') return 'No data'
  if (zone === 'optimal') return 'Optimal'
  if (zone === 'under-training') return 'Under-training'
  return 'Over-training'
}
