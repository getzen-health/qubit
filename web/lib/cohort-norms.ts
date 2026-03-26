type AgeGroup = '18-29' | '30-49' | '50-64' | '65+'
type Sex = 'male' | 'female'

interface Percentiles {
  p10?: number
  p25: number
  p50: number
  p75: number
  p90: number
}

// All norm data keyed by metric → age group → sex (or 'all')
const NORMS: Record<string, Record<AgeGroup, Record<'male' | 'female' | 'all', Percentiles>>> = {
  steps: {
    '18-29': { all: { p25: 5200, p50: 7800, p75: 10200, p90: 13500 }, male: { p25: 5500, p50: 8200, p75: 10800, p90: 14000 }, female: { p25: 4900, p50: 7400, p75: 9800, p90: 13000 } },
    '30-49': { all: { p25: 4800, p50: 7000, p75: 9500, p90: 12000 }, male: { p25: 5000, p50: 7400, p75: 9900, p90: 12500 }, female: { p25: 4600, p50: 6700, p75: 9100, p90: 11500 } },
    '50-64': { all: { p25: 3800, p50: 5800, p75: 8000, p90: 10500 }, male: { p25: 4000, p50: 6100, p75: 8400, p90: 11000 }, female: { p25: 3600, p50: 5600, p75: 7700, p90: 10000 } },
    '65+':   { all: { p25: 2800, p50: 4500, p75: 6500, p90: 8500 }, male: { p25: 3000, p50: 4800, p75: 6800, p90: 8800 }, female: { p25: 2600, p50: 4200, p75: 6200, p90: 8200 } },
  },
  resting_heart_rate: {
    '18-29': { all: { p10: 52, p25: 58, p50: 66, p75: 74, p90: 82 }, male: { p10: 50, p25: 56, p50: 64, p75: 72, p90: 80 }, female: { p10: 54, p25: 60, p50: 68, p75: 76, p90: 84 } },
    '30-49': { all: { p10: 54, p25: 60, p50: 68, p75: 76, p90: 84 }, male: { p10: 52, p25: 58, p50: 66, p75: 74, p90: 82 }, female: { p10: 56, p25: 62, p50: 70, p75: 78, p90: 86 } },
    '50-64': { all: { p10: 56, p25: 62, p50: 70, p75: 78, p90: 86 }, male: { p10: 54, p25: 60, p50: 68, p75: 76, p90: 84 }, female: { p10: 58, p25: 64, p50: 72, p75: 80, p90: 88 } },
    '65+':   { all: { p10: 58, p25: 64, p50: 72, p75: 80, p90: 88 }, male: { p10: 56, p25: 62, p50: 70, p75: 78, p90: 86 }, female: { p10: 60, p25: 66, p50: 74, p75: 82, p90: 90 } },
  },
  hrv: {
    '18-29': { all: { p25: 35, p50: 55, p75: 75, p90: 95 }, male: { p25: 38, p50: 58, p75: 78, p90: 98 }, female: { p25: 32, p50: 52, p75: 72, p90: 92 } },
    '30-49': { all: { p25: 28, p50: 45, p75: 65, p90: 85 }, male: { p25: 30, p50: 48, p75: 68, p90: 88 }, female: { p25: 26, p50: 42, p75: 62, p90: 82 } },
    '50-64': { all: { p25: 22, p50: 35, p75: 52, p90: 70 }, male: { p25: 24, p50: 37, p75: 55, p90: 73 }, female: { p25: 20, p50: 33, p75: 50, p90: 67 } },
    '65+':   { all: { p25: 18, p50: 28, p75: 42, p90: 58 }, male: { p25: 19, p50: 30, p75: 44, p90: 60 }, female: { p25: 17, p50: 26, p75: 40, p90: 56 } },
  },
  sleep_duration_minutes: {
    '18-29': { all: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, male: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, female: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 } },
    '30-49': { all: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, male: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, female: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 } },
    '50-64': { all: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, male: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, female: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 } },
    '65+':   { all: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, male: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 }, female: { p10: 330, p25: 390, p50: 420, p75: 480, p90: 540 } },
  },
}

export function getAgeGroup(age: number): AgeGroup {
  if (age < 30) return '18-29'
  if (age < 50) return '30-49'
  if (age < 65) return '50-64'
  return '65+'
}

// Returns percentile (0-100) of value within cohort norms using linear interpolation
export function getPercentile(metric: string, value: number, age: number, sex: 'male' | 'female' | 'all' = 'all', lowerIsBetter = false): number | null {
  const ageGroup = getAgeGroup(age)
  const norms = NORMS[metric]?.[ageGroup]?.[sex] ?? NORMS[metric]?.[ageGroup]?.['all']
  if (!norms) return null

  const points: [number, number][] = [] // [value, percentile]
  if (norms.p10 !== undefined) points.push([norms.p10, 10])
  points.push([norms.p25, 25], [norms.p50, 50], [norms.p75, 75], [norms.p90, 90])

  // Extrapolate below p10 and above p90
  if (value <= points[0][0]) return lowerIsBetter ? 90 : 10
  if (value >= points[points.length - 1][0]) return lowerIsBetter ? 10 : 90

  for (let i = 0; i < points.length - 1; i++) {
    const [v1, p1] = points[i]
    const [v2, p2] = points[i + 1]
    if (value >= v1 && value <= v2) {
      const pct = p1 + ((value - v1) / (v2 - v1)) * (p2 - p1)
      return lowerIsBetter ? Math.round(100 - pct) : Math.round(pct)
    }
  }
  return 50
}

export function getInsight(metric: string, percentile: number): string {
  if (percentile >= 80) return 'Excellent — top 20% of your age group'
  if (percentile >= 60) return 'Above average for your age group'
  if (percentile >= 40) return 'Average for your age group'
  if (percentile >= 20) return 'Below average — room to improve'
  return 'Low — consider focusing here'
}

export const METRIC_CONFIG: Record<string, { label: string; unit: string; icon: string; lowerIsBetter: boolean }> = {
  steps: { label: 'Daily Steps', unit: 'steps', icon: '👟', lowerIsBetter: false },
  resting_heart_rate: { label: 'Resting Heart Rate', unit: 'bpm', icon: '❤️', lowerIsBetter: true },
  hrv: { label: 'HRV', unit: 'ms', icon: '💓', lowerIsBetter: false },
  sleep_duration_minutes: { label: 'Sleep Duration', unit: 'h', icon: '😴', lowerIsBetter: false },
}
