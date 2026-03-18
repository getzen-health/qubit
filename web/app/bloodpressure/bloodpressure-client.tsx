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
} from 'recharts'

interface Reading {
  timestamp: string
  systolic: number
  diastolic: number
  pulse: number
  hour: number
}

interface BloodPressureClientProps {
  readings: Reading[]
}

// ACC/AHA 2017 Blood Pressure Classification
const BP_CATEGORIES = [
  { label: 'Normal', sysMax: 120, diaMax: 80, color: '#4ade80', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  { label: 'Elevated', sysMax: 130, diaMax: 80, color: '#facc15', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  { label: 'Stage 1 Hypertension', sysMax: 140, diaMax: 90, color: '#fb923c', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  { label: 'Stage 2 Hypertension', sysMax: 999, diaMax: 999, color: '#f87171', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
]

function classify(systolic: number, diastolic: number) {
  if (systolic < 120 && diastolic < 80) return BP_CATEGORIES[0]
  if (systolic < 130 && diastolic < 80) return BP_CATEGORIES[1]
  if (systolic < 140 || diastolic < 90) return BP_CATEGORIES[2]
  return BP_CATEGORIES[3]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function movingAvg(readings: Reading[], window = 7) {
  return readings.map((_, i) => {
    const slice = readings.slice(Math.max(0, i - window + 1), i + 1)
    const avgSys = Math.round(slice.reduce((s, r) => s + r.systolic, 0) / slice.length)
    const avgDia = Math.round(slice.reduce((s, r) => s + r.diastolic, 0) / slice.length)
    return { date: fmtDate(readings[i].timestamp), systolic: readings[i].systolic, diastolic: readings[i].diastolic, avgSys, avgDia }
  })
}

export function BloodPressureClient({ readings }: BloodPressureClientProps) {
  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💉</span>
        <h2 className="text-lg font-semibold text-text-primary">No blood pressure data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync blood pressure readings from a compatible cuff or device connected to Apple Health.
        </p>
      </div>
    )
  }

  const latest = readings[readings.length - 1]
  const latestCategory = classify(latest.systolic, latest.diastolic)

  // Averages
  const avgSys = Math.round(readings.reduce((s, r) => s + r.systolic, 0) / readings.length)
  const avgDia = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length)
  const avgCategory = classify(avgSys, avgDia)
  const avgPulse = Math.round(readings.reduce((s, r) => s + r.pulse, 0) / readings.length)

  // Max/min
  const maxSys = Math.max(...readings.map((r) => r.systolic))
  const minSys = Math.min(...readings.map((r) => r.systolic))

  // Category distribution
  const catCounts = BP_CATEGORIES.map((cat) => ({
    ...cat,
    count: readings.filter((r) => classify(r.systolic, r.diastolic).label === cat.label).length,
  }))

  // Chart data with moving avg
  const chartData = movingAvg(readings)

  // Time of day analysis (morning 6-12, afternoon 12-18, evening 18-24, night 0-6)
  const timeSlots = [
    { label: 'Morning', hours: [6, 7, 8, 9, 10, 11] },
    { label: 'Afternoon', hours: [12, 13, 14, 15, 16, 17] },
    { label: 'Evening', hours: [18, 19, 20, 21, 22, 23] },
    { label: 'Night', hours: [0, 1, 2, 3, 4, 5] },
  ]
  const timeAnalysis = timeSlots.map((slot) => {
    const inSlot = readings.filter((r) => slot.hours.includes(r.hour))
    if (!inSlot.length) return null
    return {
      label: slot.label,
      avgSys: Math.round(inSlot.reduce((s, r) => s + r.systolic, 0) / inSlot.length),
      avgDia: Math.round(inSlot.reduce((s, r) => s + r.diastolic, 0) / inSlot.length),
      count: inSlot.length,
    }
  }).filter(Boolean) as { label: string; avgSys: number; avgDia: number; count: number }[]

  return (
    <div className="space-y-6">
      {/* Latest reading + category */}
      <div className={`rounded-xl border p-5 ${latestCategory.bg} ${latestCategory.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary mb-1">Latest Reading</p>
            <p className="text-4xl font-bold" style={{ color: latestCategory.color }}>
              {latest.systolic}<span className="text-2xl text-text-secondary">/</span>{latest.diastolic}
            </p>
            <p className="text-xs text-text-secondary mt-1">{fmtDateTime(latest.timestamp)}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${latestCategory.bg} ${latestCategory.border} border ${latestCategory.text}`}>
              {latestCategory.label}
            </span>
            <p className="text-xs text-text-secondary mt-2">Pulse pressure: {latest.pulse} mmHg</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold" style={{ color: avgCategory.color }}>{avgSys}/{avgDia}</p>
          <p className="text-xs text-text-secondary mt-0.5">30-day avg</p>
          <p className="text-xs mt-1" style={{ color: avgCategory.color }}>{avgCategory.label}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-orange-400">{maxSys}</p>
          <p className="text-xs text-text-secondary mt-0.5">Highest systolic</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-blue-400">{avgPulse} mmHg</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg pulse pressure</p>
        </div>
      </div>

      {/* BP trend chart */}
      {chartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Blood Pressure Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[50, 180]} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${Math.round(v)} mmHg`, name === 'avgSys' ? 'Systolic (avg)' : name === 'avgDia' ? 'Diastolic (avg)' : name === 'systolic' ? 'Systolic' : 'Diastolic']} />
              {/* Reference lines */}
              <ReferenceLine y={120} stroke="rgba(74,222,128,0.2)" strokeDasharray="4 3"
                label={{ value: '120', position: 'insideTopLeft', fontSize: 9, fill: 'rgba(74,222,128,0.5)' }} />
              <ReferenceLine y={130} stroke="rgba(250,204,21,0.2)" strokeDasharray="4 3"
                label={{ value: '130', position: 'insideTopLeft', fontSize: 9, fill: 'rgba(250,204,21,0.5)' }} />
              <ReferenceLine y={140} stroke="rgba(251,146,60,0.2)" strokeDasharray="4 3"
                label={{ value: '140', position: 'insideTopLeft', fontSize: 9, fill: 'rgba(251,146,60,0.5)' }} />
              <ReferenceLine y={80} stroke="rgba(74,222,128,0.15)" strokeDasharray="4 3" />
              {/* Raw readings (faded) */}
              <Line type="monotone" dataKey="systolic" stroke="rgba(248,113,113,0.3)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="diastolic" stroke="rgba(96,165,250,0.3)" strokeWidth={1} dot={false} />
              {/* Moving avg (prominent) */}
              <Line type="monotone" dataKey="avgSys" stroke="#f87171" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="avgDia" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-400" /> Systolic</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-400" /> Diastolic</div>
            <div className="text-text-secondary opacity-60">(bold = 7-reading avg)</div>
          </div>
        </div>
      )}

      {/* Category distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Reading Distribution</h3>
        <div className="space-y-2">
          {catCounts.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <p className="text-xs font-medium" style={{ color: cat.color }}>{cat.label}</p>
              </div>
              <div className="flex-1 h-5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: readings.length > 0 ? `${(cat.count / readings.length) * 100}%` : '0%',
                    backgroundColor: cat.color + '88',
                  }}
                />
              </div>
              <div className="w-16 text-right text-xs text-text-secondary shrink-0">
                {cat.count} ({readings.length > 0 ? Math.round((cat.count / readings.length) * 100) : 0}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time of day analysis */}
      {timeAnalysis.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">By Time of Day</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {timeAnalysis.map((slot) => {
              const cat = classify(slot.avgSys, slot.avgDia)
              return (
                <div key={slot.label} className={`rounded-lg border p-3 text-center ${cat.bg} ${cat.border}`}>
                  <p className="text-xs text-text-secondary mb-1">{slot.label}</p>
                  <p className="text-lg font-bold" style={{ color: cat.color }}>{slot.avgSys}/{slot.avgDia}</p>
                  <p className="text-xs text-text-secondary">{slot.count} readings</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Classification guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">ACC/AHA 2017 classification</p>
        <div className="space-y-2">
          {[
            { label: 'Normal', range: '< 120/80 mmHg', color: 'text-green-400', detail: 'Maintain with healthy lifestyle habits.' },
            { label: 'Elevated', range: '120–129 / < 80 mmHg', color: 'text-yellow-400', detail: 'Lifestyle changes recommended. Monitor closely.' },
            { label: 'Stage 1 Hypertension', range: '130–139 / 80–89 mmHg', color: 'text-orange-400', detail: 'Lifestyle changes and possible medication. Consult your doctor.' },
            { label: 'Stage 2 Hypertension', range: '≥ 140 / ≥ 90 mmHg', color: 'text-red-400', detail: 'Medication and lifestyle changes. Seek medical attention.' },
            { label: 'Hypertensive Crisis', range: '> 180 / > 120 mmHg', color: 'text-red-600', detail: 'Seek emergency care immediately.' },
          ].map(({ label, range, color, detail }) => (
            <div key={label}>
              <p className="font-medium text-text-primary">
                <span className={color}>{label}</span> — <span className="font-mono text-text-secondary">{range}</span>
              </p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">
          Pulse pressure (systolic − diastolic) above 60 mmHg may indicate arterial stiffness. This information is for educational purposes only — always consult a healthcare professional.
        </p>
      </div>

      {/* Recent readings */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Readings</h2>
        {[...readings].reverse().slice(0, 20).map((r, i) => {
          const cat = classify(r.systolic, r.diastolic)
          return (
            <div key={i} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{fmtDateTime(r.timestamp)}</p>
                <p className="text-xs text-text-secondary mt-0.5">Pulse pressure: {r.pulse} mmHg</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: cat.color }}>{r.systolic}/{r.diastolic}</p>
                <p className="text-xs" style={{ color: cat.color }}>{cat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
