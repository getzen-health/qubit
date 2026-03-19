'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts'

interface DayRow {
  date: string
  resting_heart_rate: number | null
  avg_hrv: number | null
  steps: number | null
  active_calories: number | null
  sleep_duration_minutes: number | null
  rolling: number
}

interface Props {
  rows: DayRow[]
  latestRhr: number | null
  minRhr: number | null
  maxRhr: number | null
  avgRhr: number | null
  trendSlope: number | null
  byDow: (number | null)[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function classifyRhr(rhr: number): { label: string; color: string; tailwind: string; desc: string } {
  if (rhr < 50) return { label: 'Athlete', color: '#22c55e', tailwind: 'text-green-400', desc: 'Exceptional cardiovascular fitness' }
  if (rhr < 60) return { label: 'Excellent', color: '#86efac', tailwind: 'text-green-300', desc: 'Well above average fitness' }
  if (rhr < 70) return { label: 'Good', color: '#facc15', tailwind: 'text-yellow-400', desc: 'Above average fitness level' }
  if (rhr < 80) return { label: 'Average', color: '#f97316', tailwind: 'text-orange-400', desc: 'Typical for sedentary adults' }
  return { label: 'High', color: '#ef4444', tailwind: 'text-red-400', desc: 'Consider consulting your doctor' }
}

function rhrColor(rhr: number): string {
  return classifyRhr(rhr).color
}

export function RHRClient({ rows, latestRhr, minRhr, maxRhr, avgRhr, trendSlope, byDow }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">❤️</span>
        <h2 className="text-lg font-semibold text-text-primary">No resting HR data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch measures resting heart rate throughout the day while you&apos;re inactive.
          Sync your health data to see your analysis.
        </p>
      </div>
    )
  }

  const cls = latestRhr !== null ? classifyRhr(latestRhr) : null
  const trendLabel = trendSlope === null ? null
    : trendSlope < -0.1 ? { label: 'Declining (improving fitness)', color: 'text-green-400', icon: '↓' }
    : trendSlope > 0.1 ? { label: 'Rising (monitor for stress/illness)', color: 'text-orange-400', icon: '↑' }
    : { label: 'Stable', color: 'text-text-secondary', icon: '→' }

  // Chart data
  const trendData = rows.map((r) => ({
    date: fmtDate(r.date),
    rhr: r.resting_heart_rate,
    rolling: r.rolling,
  }))

  // RHR vs HRV scatter
  const scatterData = rows.filter((r) => r.avg_hrv && r.avg_hrv > 0 && r.resting_heart_rate).map((r) => ({
    rhr: r.resting_heart_rate!,
    hrv: Math.round(r.avg_hrv!),
    date: r.date,
  }))

  // Day of week bar data
  const dowData = DOW_LABELS.map((label, i) => ({ label, rhr: byDow[i] })).filter((d) => d.rhr !== null)

  // Monthly averages (last 6 months)
  const monthMap = new Map<string, number[]>()
  for (const r of rows) {
    const month = r.date.slice(0, 7)
    if (!monthMap.has(month)) monthMap.set(month, [])
    monthMap.get(month)!.push(r.resting_heart_rate!)
  }
  const monthlyData = Array.from(monthMap.entries())
    .map(([month, vals]) => ({
      month: new Date(month + '-15').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))

  const avgRhrForDow = dowData.length > 0 ? dowData.reduce((s, d) => s + d.rhr!, 0) / dowData.length : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center col-span-2 sm:col-span-1">
          <p className={`text-3xl font-bold ${cls?.tailwind ?? 'text-text-primary'}`}>
            {latestRhr ?? '—'}
          </p>
          <p className="text-xs font-medium text-text-primary mt-0.5">Latest RHR (bpm)</p>
          <p className={`text-xs mt-0.5 font-semibold ${cls?.tailwind ?? 'text-text-secondary'}`}>
            {cls?.label ?? '—'}
          </p>
        </div>
        {[
          { label: '6-Month Average', value: avgRhr !== null ? `${avgRhr} bpm` : '—', sub: 'baseline reference' },
          { label: 'Lowest Recorded', value: minRhr !== null ? `${minRhr} bpm` : '—', sub: 'personal best' },
          {
            label: '28-Day Trend',
            value: trendLabel ? `${trendLabel.icon} ${trendSlope !== null ? (Math.abs(trendSlope) * 7).toFixed(1) : '0'} bpm/wk` : '—',
            sub: trendLabel?.label ?? 'insufficient data',
            color: trendLabel?.color,
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color ?? 'text-text-primary'}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Classification guide */}
      {cls && (
        <div className={`rounded-xl border p-4 space-y-1 ${
          latestRhr! < 60 ? 'bg-green-500/5 border-green-500/20' :
          latestRhr! < 70 ? 'bg-yellow-500/5 border-yellow-500/20' :
          'bg-orange-500/5 border-orange-500/20'
        }`}>
          <p className={`text-sm font-semibold ${cls.tailwind}`}>{cls.label} — {latestRhr} bpm</p>
          <p className="text-xs text-text-secondary">{cls.desc}</p>
        </div>
      )}

      {/* Trend Chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-1">RHR Trend</h2>
        <p className="text-xs text-text-secondary mb-3">
          A declining trend over months indicates improving aerobic fitness
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                `${v} bpm`,
                name === 'rolling' ? '7-day avg' : 'RHR',
              ]}
            />
            {/* Reference zones */}
            <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.3} />
            <ReferenceLine y={60} stroke="#86efac" strokeDasharray="4 3" strokeOpacity={0.3} />
            <ReferenceLine y={70} stroke="#facc15" strokeDasharray="4 3" strokeOpacity={0.3} />
            <Line
              type="monotone"
              dataKey="rhr"
              stroke="#f87171"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#f87171' }}
              activeDot={{ r: 4 }}
              name="RHR"
            />
            <Line
              type="monotone"
              dataKey="rolling"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
              name="rolling"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
          <div className="flex items-center gap-1.5"><div className="w-3 h-px bg-red-400" />Daily</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-px bg-yellow-400" />7-day avg</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400 opacity-50" />50 / 60 / 70 targets</div>
        </div>
      </div>

      {/* Monthly trend */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Monthly Average RHR</h2>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} bpm`, 'Avg RHR']} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {monthlyData.map((d, i) => (
                  <Cell key={i} fill={rhrColor(d.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day of week pattern */}
      {dowData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Day of Week Pattern</h2>
          <p className="text-xs text-text-secondary mb-3">
            Lower RHR on active days suggests improved autonomic regulation
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} bpm`, 'Avg RHR']} />
              <ReferenceLine y={avgRhrForDow} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Bar dataKey="rhr" radius={[3, 3, 0, 0]}>
                {dowData.map((d, i) => (
                  <Cell key={i} fill={d.rhr! < avgRhrForDow ? '#22c55e' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RHR vs HRV scatter */}
      {scatterData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">RHR vs HRV Correlation</h2>
          <p className="text-xs text-text-secondary mb-3">
            Lower RHR with higher HRV = optimal parasympathetic balance
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="rhr"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                label={{ value: 'RHR (bpm)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#888' }}
              />
              <YAxis
                dataKey="hrv"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: number, name: string) => [`${v} ${name === 'rhr' ? 'bpm' : 'ms'}`, name.toUpperCase()]}
              />
              <Scatter data={scatterData} fill="#f87171" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fitness classification table */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">RHR Fitness Classification</h2>
        <div className="space-y-1.5 text-xs">
          {[
            { range: '< 50 bpm', label: 'Athlete', color: 'text-green-400', note: 'Elite aerobic capacity, high vagal tone' },
            { range: '50–59 bpm', label: 'Excellent', color: 'text-green-300', note: 'Well-trained, very good cardiovascular fitness' },
            { range: '60–69 bpm', label: 'Good', color: 'text-yellow-400', note: 'Above average, moderately active lifestyle' },
            { range: '70–79 bpm', label: 'Average', color: 'text-orange-400', note: 'Normal for sedentary adults; room to improve' },
            { range: '≥ 80 bpm', label: 'High', color: 'text-red-400', note: 'Elevated risk; consult your doctor if persistent' },
          ].map(({ range, label, color, note }) => (
            <div
              key={label}
              className={`grid grid-cols-3 gap-2 py-2 border-b border-border last:border-0 ${
                latestRhr !== null && classifyRhr(latestRhr).label === label ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <span className={`font-medium ${color}`}>{label}</span>
              <span className="text-text-secondary">{range}</span>
              <span className="text-text-secondary">{note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary opacity-50">
          These ranges are general guidelines. Individual variation is normal and expected.
        </p>
      </div>
    </div>
  )
}
