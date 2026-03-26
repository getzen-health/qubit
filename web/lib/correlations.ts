// Pearson correlation coefficient
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0
  const n = x.length
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)
  const denX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0))
  const denY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0))
  if (denX === 0 || denY === 0) return 0
  return Math.round((num / (denX * denY)) * 100) / 100
}

// Spearman rank correlation (more robust for health data)
export function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0
  const rank = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b)
    return arr.map(v => sorted.indexOf(v) + 1)
  }
  const rx = rank(x)
  const ry = rank(y)
  return pearsonCorrelation(rx, ry)
}

export function interpretCorrelation(r: number): { strength: string; direction: string; color: string; emoji: string; plain: string } {
  const abs = Math.abs(r)
  const direction = r >= 0 ? 'positive' : 'negative'
  const dirWord = r >= 0 ? 'higher' : 'lower'
  const dirWord2 = r >= 0 ? 'tends to increase' : 'tends to decrease'

  if (abs >= 0.7) return { strength: 'Strong', direction, color: r >= 0 ? 'green' : 'red', emoji: r >= 0 ? '🔥' : '❄️', plain: `Strong connection — when X is ${dirWord}, Y ${dirWord2}` }
  if (abs >= 0.4) return { strength: 'Moderate', direction, color: r >= 0 ? 'blue' : 'orange', emoji: '📊', plain: `Moderate connection found` }
  if (abs >= 0.2) return { strength: 'Weak', direction, color: 'gray', emoji: '〰️', plain: `Weak or possible connection` }
  return { strength: 'None', direction, color: 'gray', emoji: '➖', plain: `No clear connection` }
}

export interface CorrelationPair {
  id: string
  xLabel: string
  yLabel: string
  xMetric: string // health_metrics metric_type or special: 'mood', 'steps_lag1d'
  yMetric: string
  xTable: 'health_metrics' | 'mood_logs'
  yTable: 'health_metrics' | 'mood_logs'
  xLag: number // days lag (0 = same day, 1 = x today vs y tomorrow)
  description: string
  emoji: string
}

export const CORRELATION_PAIRS: CorrelationPair[] = [
  {
    id: 'sleep-mood',
    xLabel: 'Sleep Duration',
    yLabel: 'Next Day Mood',
    xMetric: 'sleep_duration_minutes',
    yMetric: 'mood',
    xTable: 'health_metrics',
    yTable: 'mood_logs',
    xLag: 1,
    description: 'Does sleeping more lead to better mood the next day?',
    emoji: '😴→😊',
  },
  {
    id: 'steps-rhr',
    xLabel: 'Daily Steps',
    yLabel: 'Resting Heart Rate',
    xMetric: 'steps',
    yMetric: 'resting_heart_rate',
    xTable: 'health_metrics',
    yTable: 'health_metrics',
    xLag: 0,
    description: 'Do active days correlate with lower resting heart rate?',
    emoji: '👟→❤️',
  },
  {
    id: 'sleep-hrv',
    xLabel: 'Sleep Hours',
    yLabel: 'HRV (RMSSD)',
    xMetric: 'sleep_duration_minutes',
    yMetric: 'hrv_rmssd',
    xTable: 'health_metrics',
    yTable: 'health_metrics',
    xLag: 0,
    description: 'Does more sleep lead to higher HRV?',
    emoji: '😴→💓',
  },
  {
    id: 'steps-mood',
    xLabel: 'Daily Steps',
    yLabel: 'Mood Score',
    xMetric: 'steps',
    yMetric: 'mood',
    xTable: 'health_metrics',
    yTable: 'mood_logs',
    xLag: 0,
    description: 'Do more active days coincide with better mood?',
    emoji: '👟→😊',
  },
  {
    id: 'sleep-weight',
    xLabel: 'Sleep Duration',
    yLabel: 'Body Weight',
    xMetric: 'sleep_duration_minutes',
    yMetric: 'weight',
    xTable: 'health_metrics',
    yTable: 'health_metrics',
    xLag: 0,
    description: 'Is there a relationship between sleep and your weight?',
    emoji: '😴→⚖️',
  },
  {
    id: 'hrv-mood',
    xLabel: 'HRV Score',
    yLabel: 'Mood Score',
    xMetric: 'hrv_rmssd',
    yMetric: 'mood',
    xTable: 'health_metrics',
    yTable: 'mood_logs',
    xLag: 0,
    description: 'Does high HRV correlate with feeling better?',
    emoji: '💓→😊',
  },
]
