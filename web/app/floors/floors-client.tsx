'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface DaySummary {
  date: string
  floors_climbed: number
  steps?: number | null
}

interface FloorsClientProps {
  days: DaySummary[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function floorColor(floors: number): string {
  if (floors >= 20) return '#4ade80'  // great
  if (floors >= 10) return '#a3e635'  // good
  if (floors >= 5)  return '#facc15'  // okay
  return '#94a3b8'                     // low
}

// 7-day rolling average
function rollingAvg(days: DaySummary[], window = 7): number[] {
  return days.map((_, i) => {
    const slice = days.slice(Math.max(0, i - window + 1), i + 1)
    return Math.round(slice.reduce((s, d) => s + d.floors_climbed, 0) / slice.length)
  })
}

export function FloorsClient({ days }: FloorsClientProps) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏢</span>
        <h2 className="text-lg font-semibold text-text-primary">No floors data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          iPhone and Apple Watch automatically detect flights of stairs using the barometer. Sync to see your data.
        </p>
      </div>
    )
  }

  const totalFloors = days.reduce((s, d) => s + d.floors_climbed, 0)
  const avgFloors = Math.round(totalFloors / days.length)
  const maxFloors = Math.max(...days.map((d) => d.floors_climbed))
  const maxDay = days.find((d) => d.floors_climbed === maxFloors)
  const daysAbove10 = days.filter((d) => d.floors_climbed >= 10).length

  // Rolling average
  const avgs = rollingAvg(days)

  // Chart data
  const chartData = days.map((d, i) => ({
    date: fmtDate(d.date),
    floors: d.floors_climbed,
    avg: avgs[i],
  }))

  // Weekly aggregation (ISO week)
  const weekMap: Record<string, number> = {}
  for (const d of days) {
    const dt = new Date(d.date + 'T00:00:00')
    const jan4 = new Date(dt.getFullYear(), 0, 4)
    const weekNum = Math.ceil(((dt.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
    const key = `W${weekNum}`
    weekMap[key] = (weekMap[key] ?? 0) + d.floors_climbed
  }
  const weekData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, floors]) => ({ week, floors }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{avgFloors}</p>
          <p className="text-xs text-text-secondary mt-0.5">Daily avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{maxFloors}</p>
          <p className="text-xs text-text-secondary mt-0.5">Best day</p>
          {maxDay && <p className="text-xs text-text-secondary opacity-60">{fmtDate(maxDay.date)}</p>}
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{daysAbove10}</p>
          <p className="text-xs text-text-secondary mt-0.5">Days ≥ 10 floors</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{totalFloors.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total floors</p>
        </div>
      </div>

      {/* Daily bar chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Floors Climbed</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} floors`, 'Floors']} />
            <ReferenceLine y={10} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3"
              label={{ value: '10', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.4)' }} />
            <Bar dataKey="floors" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={floorColor(entry.floors)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 7-day trend */}
      {chartData.length >= 7 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">7-Day Rolling Average</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} floors`, '7-day avg']} />
              <ReferenceLine y={10} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly totals */}
      {weekData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Totals</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weekData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} floors`, 'Week total']} />
              <ReferenceLine y={70} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3"
                label={{ value: '70', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.4)' }} />
              <Bar dataKey="floors" fill="#34d399" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Why stair climbing matters</p>
        <div className="space-y-2">
          {[
            { title: '10+ floors daily', color: 'text-green-400', detail: 'The benchmark commonly cited in research for cardiovascular benefit. One "floor" = approximately 3 meters (10 feet) of elevation gain.' },
            { title: '2× the benefit of walking', color: 'text-emerald-400', detail: 'Stair climbing burns roughly twice as many calories per minute as level walking and provides greater cardiovascular demand per unit time.' },
            { title: 'Lower all-cause mortality risk', color: 'text-blue-400', detail: 'A 2024 study found that climbing ≥ 5 floors/day was associated with a 20% reduction in cardiovascular disease risk compared to not climbing stairs.' },
            { title: 'Barometer detected', color: 'text-purple-400', detail: 'iPhone and Apple Watch use the built-in barometric pressure sensor to detect elevation changes. Elevators do not count.' },
          ].map(({ title, color, detail }) => (
            <div key={title}>
              <p className="font-medium text-text-primary"><span className={color}>{title}</span></p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Days</h2>
        {[...days].reverse().slice(0, 30).map((d) => {
          const pct = Math.min((d.floors_climbed / 20) * 100, 100)
          return (
            <div key={d.date} className="bg-surface rounded-xl border border-border px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-text-primary">
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm font-bold" style={{ color: floorColor(d.floors_climbed) }}>
                  {d.floors_climbed} <span className="text-xs font-normal text-text-secondary">floors</span>
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: floorColor(d.floors_climbed) }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
