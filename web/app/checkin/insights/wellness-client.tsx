'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts'

interface DayRecord {
  date: string
  energy: number | null
  mood: number | null
  stress: number | null
  notes: string | null
  hrv: number | null
  rhr: number | null
  sleep: number | null
  steps: number | null
  calories: number | null
}

interface WellnessInsightsClientProps {
  records: DayRecord[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const ENERGY_EMOJIS = ['', '😴', '😑', '😐', '🙂', '😄']
const MOOD_EMOJIS   = ['', '😞', '😕', '😐', '🙂', '😁']
const STRESS_EMOJIS = ['', '😌', '🙂', '😐', '😟', '😰']

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtSleep(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Pearson correlation coefficient
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 5) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const denX = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0))
  const denY = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  if (denX === 0 || denY === 0) return 0
  return num / (denX * denY)
}

function corrColor(r: number): string {
  const abs = Math.abs(r)
  if (abs >= 0.5) return r > 0 ? '#4ade80' : '#f87171'
  if (abs >= 0.25) return r > 0 ? '#a3e635' : '#fb923c'
  return '#94a3b8'
}

function corrLabel(r: number): string {
  const abs = Math.abs(r)
  const dir = r >= 0 ? 'positive' : 'negative'
  if (abs >= 0.6) return `Strong ${dir}`
  if (abs >= 0.35) return `Moderate ${dir}`
  if (abs >= 0.15) return `Weak ${dir}`
  return 'No clear relationship'
}

function avg(vals: (number | null)[]): number | null {
  const valid = vals.filter((v): v is number => v !== null && v > 0)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// Group by wellness score bins and compute average health metric
function groupBySub(
  records: DayRecord[],
  wellnessKey: 'energy' | 'mood' | 'stress',
  healthKey: keyof DayRecord
): Array<{ bin: number; label: string; avg: number; count: number }> {
  const bins = [1, 2, 3, 4, 5]
  return bins.map((bin) => {
    const filtered = records.filter((r) => r[wellnessKey] === bin)
    const vals = filtered.map((r) => r[healthKey] as number | null).filter((v): v is number => v !== null && v > 0)
    return { bin, label: `${bin}/5`, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, count: vals.length }
  })
}

interface CorrPairProps {
  label: string
  xKey: 'energy' | 'mood' | 'stress'
  yKey: keyof DayRecord
  xLabel: string
  yLabel: string
  formatter: (v: number) => string
  records: DayRecord[]
  invert?: boolean // if true, higher y is worse (e.g., RHR, stress)
}

function CorrPair({ label, xKey, yKey, xLabel, yLabel, formatter, records, invert }: CorrPairProps) {
  const pairs = records
    .filter((r) => r[xKey] !== null && r[yKey] !== null && (r[yKey] as number) > 0)
    .map((r) => ({ x: r[xKey] as number, y: r[yKey] as number, date: r.date }))

  if (pairs.length < 5) return null

  const r = pearson(pairs.map((p) => p.x), pairs.map((p) => p.y))
  const effectiveR = invert ? -r : r
  const color = corrColor(effectiveR)
  const lbl = corrLabel(effectiveR)
  const abs = Math.abs(r)

  if (abs < 0.1) return null // skip negligible correlations

  // Best and worst scores for that wellness metric
  const high = pairs.filter((p) => p.x >= 4)
  const low = pairs.filter((p) => p.x <= 2)
  const avgHigh = high.length ? high.reduce((s, p) => s + p.y, 0) / high.length : null
  const avgLow = low.length ? low.reduce((s, p) => s + p.y, 0) / low.length : null

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs opacity-60" style={{ color }}>{lbl} (r = {r.toFixed(2)})</p>
        </div>
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <span className="text-sm font-bold" style={{ color }}>{r > 0 ? '+' : ''}{r.toFixed(1)}</span>
        </div>
      </div>

      {/* Scatter */}
      <ResponsiveContainer width="100%" height={120}>
        <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
            label={{ value: xLabel, position: 'insideBottom', offset: -2, fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
            tickFormatter={formatter}
            width={36}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number) => [formatter(v), yLabel]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? fmtDate(payload[0].payload.date) : ''}
          />
          <Scatter data={pairs} fill={color} fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Summary comparison */}
      {avgHigh !== null && avgLow !== null && high.length >= 2 && low.length >= 2 && (
        <div className="flex gap-3 text-xs text-text-secondary">
          <span className="flex-1 bg-surface-secondary rounded-lg p-2">
            <span className="block text-green-400 font-medium">High {xLabel} (4–5/5)</span>
            <span className="block text-text-primary font-semibold">{formatter(avgHigh)}</span>
            <span className="opacity-60">{high.length} days</span>
          </span>
          <span className="flex-1 bg-surface-secondary rounded-lg p-2">
            <span className="block text-red-400 font-medium">Low {xLabel} (1–2/5)</span>
            <span className="block text-text-primary font-semibold">{formatter(avgLow)}</span>
            <span className="opacity-60">{low.length} days</span>
          </span>
        </div>
      )}
    </div>
  )
}

export function WellnessInsightsClient({ records }: WellnessInsightsClientProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📋</span>
        <h2 className="text-lg font-semibold text-text-primary">No check-in data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log your energy, mood, and stress daily in the Check-In page to see how they correlate with your health metrics.
        </p>
      </div>
    )
  }

  if (records.length < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📈</span>
        <h2 className="text-lg font-semibold text-text-primary">Keep logging!</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          You have {records.length} check-in{records.length !== 1 ? 's' : ''}. Log at least 7 to see wellness correlations.
        </p>
      </div>
    )
  }

  const withEnergy = records.filter((r) => r.energy !== null)
  const withMood = records.filter((r) => r.mood !== null)
  const withStress = records.filter((r) => r.stress !== null)

  const avgEnergy = avg(withEnergy.map((r) => r.energy))
  const avgMood = avg(withMood.map((r) => r.mood))
  const avgStress = avg(withStress.map((r) => r.stress))

  // Trend data — last 30 days with check-ins
  const trendData = records.slice(-30).map((r) => ({
    date: fmtDate(r.date),
    energy: r.energy,
    mood: r.mood,
    stress: r.stress,
  }))

  return (
    <div className="space-y-6">
      {/* Averages */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Avg Energy', value: avgEnergy, emojis: ENERGY_EMOJIS, color: 'text-yellow-400' },
          { label: 'Avg Mood', value: avgMood, emojis: MOOD_EMOJIS, color: 'text-blue-400' },
          { label: 'Avg Stress', value: avgStress, emojis: STRESS_EMOJIS, color: 'text-orange-400' },
        ].map(({ label, value, emojis, color }) => {
          const idx = value !== null ? Math.min(5, Math.max(1, Math.round(value))) : 0
          return (
            <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">{label}</p>
              {value !== null ? (
                <>
                  <p className="text-2xl">{emojis[idx]}</p>
                  <p className={`text-sm font-bold ${color}`}>{value.toFixed(1)}/5</p>
                </>
              ) : (
                <p className="text-text-secondary">—</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Trend chart */}
      {trendData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Wellness Trends (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v}/5`, name]} />
              <ReferenceLine y={3} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />
              <Line type="monotone" dataKey="energy" name="Energy" stroke="#facc15" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="mood" name="Mood" stroke="#60a5fa" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="stress" name="Stress" stroke="#fb923c" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block" /> Energy</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Mood</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" /> Stress</span>
          </div>
        </div>
      )}

      {/* Correlation pairs */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary">How health metrics affect how you feel</h3>

        <CorrPair
          label="Energy vs HRV"
          xKey="energy"
          yKey="hrv"
          xLabel="Energy"
          yLabel="HRV (ms)"
          formatter={(v) => `${Math.round(v)} ms`}
          records={records}
        />
        <CorrPair
          label="Energy vs Sleep"
          xKey="energy"
          yKey="sleep"
          xLabel="Energy"
          yLabel="Sleep"
          formatter={(v) => fmtSleep(v)}
          records={records}
        />
        <CorrPair
          label="Energy vs Steps"
          xKey="energy"
          yKey="steps"
          xLabel="Energy"
          yLabel="Steps"
          formatter={(v) => `${Math.round(v / 1000 * 10) / 10}k`}
          records={records}
        />
        <CorrPair
          label="Mood vs HRV"
          xKey="mood"
          yKey="hrv"
          xLabel="Mood"
          yLabel="HRV (ms)"
          formatter={(v) => `${Math.round(v)} ms`}
          records={records}
        />
        <CorrPair
          label="Mood vs Sleep"
          xKey="mood"
          yKey="sleep"
          xLabel="Mood"
          yLabel="Sleep"
          formatter={(v) => fmtSleep(v)}
          records={records}
        />
        <CorrPair
          label="Stress vs Resting HR"
          xKey="stress"
          yKey="rhr"
          xLabel="Stress"
          yLabel="RHR (bpm)"
          formatter={(v) => `${Math.round(v)} bpm`}
          records={records}
          invert
        />
        <CorrPair
          label="Stress vs HRV"
          xKey="stress"
          yKey="hrv"
          xLabel="Stress"
          yLabel="HRV (ms)"
          formatter={(v) => `${Math.round(v)} ms`}
          records={records}
          invert
        />
        <CorrPair
          label="Stress vs Sleep"
          xKey="stress"
          yKey="sleep"
          xLabel="Stress"
          yLabel="Sleep"
          formatter={(v) => fmtSleep(v)}
          records={records}
          invert
        />
      </div>

      {/* Day log */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Recent Check-ins</h3>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {records.slice().reverse().slice(0, 30).map((r) => (
            <div key={r.date} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <p className="text-xs text-text-secondary w-16 shrink-0">{fmtDate(r.date)}</p>
              <div className="flex gap-3 text-sm">
                {r.energy !== null && <span title="Energy">{ENERGY_EMOJIS[r.energy]}</span>}
                {r.mood !== null && <span title="Mood">{MOOD_EMOJIS[r.mood]}</span>}
                {r.stress !== null && <span title="Stress">{STRESS_EMOJIS[r.stress]}</span>}
              </div>
              <div className="flex gap-2 text-xs text-text-secondary opacity-70 ml-auto">
                {r.hrv && <span>{Math.round(r.hrv)}ms</span>}
                {r.sleep && <span>{fmtSleep(r.sleep)}</span>}
                {r.steps && <span>{Math.round(r.steps / 1000 * 10) / 10}k</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">How this works</p>
        <p className="opacity-70">
          Pearson correlation (r) measures the strength of the linear relationship between two variables. Values near ±1 are strong;
          near 0 means no clear pattern. Only correlations with |r| ≥ 0.10 and 5+ overlapping data points are shown.
        </p>
        <p className="opacity-70">
          Use this to discover personal patterns: does your HRV predict how you feel? Do you need more sleep than average to maintain good mood?
        </p>
      </div>
    </div>
  )
}
