'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, ComposedChart,
} from 'recharts'

export interface DowBPStat {
  label: string
  count: number
  avgSys: number | null
  avgDia: number | null
}

export interface TimePeriodStat {
  label: string
  icon: string
  count: number
  avgSys: number
  avgDia: number
}

export interface MonthBPStat {
  label: string
  count: number
  avgSys: number
  avgDia: number
}

export interface CategoryDist {
  label: string
  count: number
  pct: number
}

export interface BPPatternData {
  totalReadings: number
  avgSys: number
  avgDia: number
  avgPulsePressure: number
  latestCategory: string
  dowData: DowBPStat[]
  timePeriods: TimePeriodStat[]
  monthData: MonthBPStat[]
  categoryDist: CategoryDist[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Normal':  '#22c55e',
  'Elevated':'#f59e0b',
  'Stage 1': '#f97316',
  'Stage 2': '#ef4444',
}

const CATEGORY_BG: Record<string, string> = {
  'Normal':  'bg-green-500/10 text-green-400',
  'Elevated':'bg-amber-500/10 text-amber-400',
  'Stage 1': 'bg-orange-500/10 text-orange-400',
  'Stage 2': 'bg-red-500/10 text-red-400',
}

const CATEGORY_NOTES: Record<string, string> = {
  'Normal':  '<120/<80 mmHg',
  'Elevated':'120–129/<80 mmHg',
  'Stage 1': '130–139/80–89 mmHg',
  'Stage 2': '≥140/≥90 mmHg',
}

function bpColor(sys: number): string {
  if (sys < 120) return '#22c55e'
  if (sys < 130) return '#f59e0b'
  if (sys < 140) return '#f97316'
  return '#ef4444'
}

export function BPPatternsClient({ data }: { data: BPPatternData }) {
  const {
    totalReadings, avgSys, avgDia, avgPulsePressure, latestCategory,
    dowData, timePeriods, monthData, categoryDist,
  } = data

  const dowWithData = dowData.filter((d) => d.count > 0 && d.avgSys !== null)
  const hasMonthData = monthData.length >= 2

  const catColor = CATEGORY_COLORS[latestCategory] ?? '#6b7280'
  const catBg = CATEGORY_BG[latestCategory] ?? 'bg-surface-secondary text-text-primary'

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{avgSys}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Systolic</p>
          <p className="text-xs text-text-secondary opacity-60">mmHg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{avgDia}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Diastolic</p>
          <p className="text-xs text-text-secondary opacity-60">mmHg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{avgPulsePressure}</p>
          <p className="text-xs text-text-secondary mt-0.5">Pulse Pressure</p>
          <p className="text-xs text-text-secondary opacity-60">mmHg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${catBg}`}>
            {latestCategory}
          </span>
          <p className="text-xs text-text-secondary mt-1">Latest Reading</p>
          <p className="text-xs text-text-secondary opacity-60">{totalReadings} total</p>
        </div>
      </div>

      {/* BP Category distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Reading Classification Breakdown</p>
        <div className="space-y-3">
          {categoryDist.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <div className="w-20">
                <p className="text-xs font-medium" style={{ color: CATEGORY_COLORS[cat.label] }}>{cat.label}</p>
                <p className="text-xs text-text-secondary opacity-60">{CATEGORY_NOTES[cat.label]}</p>
              </div>
              <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.pct}%`, backgroundColor: CATEGORY_COLORS[cat.label] + 'cc' }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary w-12 text-right">{cat.pct}%</span>
              <span className="text-xs text-text-secondary w-8">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time of day patterns */}
      {timePeriods.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Time of Day Patterns</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {timePeriods.map((p) => (
              <div key={p.label} className="text-center">
                <p className="text-xl mb-1">{p.icon}</p>
                <p className="text-xs text-text-secondary mb-1">{p.label}</p>
                <p className="text-sm font-bold" style={{ color: bpColor(p.avgSys) }}>
                  {p.avgSys}/{p.avgDia}
                </p>
                <p className="text-xs text-text-secondary opacity-60">{p.count} readings</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOW bar chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average BP by Day of Week</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={dowData.filter((d) => d.avgSys !== null)} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} mmHg`, name]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="avgSys" name="Systolic" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.8} />
              <Bar dataKey="avgDia" name="Diastolic" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.8} />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Normal range reference */}
          <p className="text-xs text-text-secondary mt-2 opacity-60">
            Normal: &lt;120/&lt;80 mmHg · Elevated: 120–129 · Stage 1: 130–139 · Stage 2: ≥140
          </p>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Blood Pressure Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} mmHg`, name]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {/* Reference lines for BP targets */}
              <Line type="monotone" dataKey="avgSys" name="Systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avgDia" name="Diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          {/* BP stage reference */}
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(CATEGORY_COLORS).map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                {label}: {CATEGORY_NOTES[label]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Monthly table */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Monthly Summary</p>
          </div>
          <div className="divide-y divide-border">
            {[...monthData].reverse().map((m) => {
              const cat = m.avgSys < 120 ? 'Normal' : m.avgSys < 130 ? 'Elevated' : m.avgSys < 140 ? 'Stage 1' : 'Stage 2'
              return (
                <div key={m.label} className="flex items-center px-4 py-3 gap-4">
                  <div className="w-10 text-sm font-medium text-text-secondary">{m.label}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: bpColor(m.avgSys) }}>
                      {m.avgSys}/{m.avgDia} mmHg
                    </p>
                    <p className="text-xs text-text-secondary">{m.count} readings</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_BG[cat]}`}>{cat}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
