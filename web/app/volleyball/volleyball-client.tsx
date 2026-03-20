'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VolleyballSession {
  id: string
  start_time: string
  workout_type?: string | null
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
}

interface VolleyballClientProps {
  sessions: VolleyballSession[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const YELLOW = '#ca8a04'
const YELLOW_DIM = 'rgba(202,138,4,0.40)'
const YELLOW_BG = 'rgba(202,138,4,0.08)'
const YELLOW_BORDER = 'rgba(202,138,4,0.25)'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// 22 sessions spread across 90 days ending 2026-03-19
const MOCK_SESSIONS: VolleyballSession[] = [
  { id: 'm1',  start_time: '2025-12-27T10:00:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 62, active_calories: 498, avg_heart_rate: 141, max_heart_rate: 174 },
  { id: 'm2',  start_time: '2025-12-30T18:30:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 55, active_calories: 512, avg_heart_rate: 148, max_heart_rate: 178 },
  { id: 'm3',  start_time: '2026-01-03T09:45:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 70, active_calories: 560, avg_heart_rate: 143, max_heart_rate: 172 },
  { id: 'm4',  start_time: '2026-01-07T19:00:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 65, active_calories: 540, avg_heart_rate: 146, max_heart_rate: 181 },
  { id: 'm5',  start_time: '2026-01-11T10:15:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 58, active_calories: 530, avg_heart_rate: 150, max_heart_rate: 179 },
  { id: 'm6',  start_time: '2026-01-14T18:45:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 68, active_calories: 575, avg_heart_rate: 144, max_heart_rate: 169 },
  { id: 'm7',  start_time: '2026-01-18T10:00:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 50, active_calories: 488, avg_heart_rate: 152, max_heart_rate: 176 },
  { id: 'm8',  start_time: '2026-01-22T19:30:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 72, active_calories: 590, avg_heart_rate: 142, max_heart_rate: 170 },
  { id: 'm9',  start_time: '2026-01-27T09:30:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 60, active_calories: 510, avg_heart_rate: 145, max_heart_rate: 173 },
  { id: 'm10', start_time: '2026-01-31T18:00:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 52, active_calories: 495, avg_heart_rate: 149, max_heart_rate: 177 },
  { id: 'm11', start_time: '2026-02-04T10:30:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 66, active_calories: 552, avg_heart_rate: 143, max_heart_rate: 168 },
  { id: 'm12', start_time: '2026-02-07T19:00:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 57, active_calories: 525, avg_heart_rate: 151, max_heart_rate: 180 },
  { id: 'm13', start_time: '2026-02-11T09:00:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 71, active_calories: 585, avg_heart_rate: 144, max_heart_rate: 171 },
  { id: 'm14', start_time: '2026-02-15T18:30:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 63, active_calories: 532, avg_heart_rate: 146, max_heart_rate: 174 },
  { id: 'm15', start_time: '2026-02-19T10:00:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 54, active_calories: 505, avg_heart_rate: 150, max_heart_rate: 178 },
  { id: 'm16', start_time: '2026-02-22T19:15:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 69, active_calories: 568, avg_heart_rate: 143, max_heart_rate: 169 },
  { id: 'm17', start_time: '2026-02-26T10:30:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 56, active_calories: 518, avg_heart_rate: 148, max_heart_rate: 176 },
  { id: 'm18', start_time: '2026-03-01T18:45:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 64, active_calories: 544, avg_heart_rate: 145, max_heart_rate: 172 },
  { id: 'm19', start_time: '2026-03-05T09:15:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 73, active_calories: 597, avg_heart_rate: 142, max_heart_rate: 167 },
  { id: 'm20', start_time: '2026-03-09T19:00:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 53, active_calories: 502, avg_heart_rate: 151, max_heart_rate: 179 },
  { id: 'm21', start_time: '2026-03-13T10:00:00Z', workout_type: 'Indoor Volleyball', duration_minutes: 67, active_calories: 557, avg_heart_rate: 144, max_heart_rate: 170 },
  { id: 'm22', start_time: '2026-03-17T18:30:00Z', workout_type: 'Beach Volleyball',  duration_minutes: 59, active_calories: 528, avg_heart_rate: 147, max_heart_rate: 175 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function kcalPerMin(session: VolleyballSession): number | null {
  if (!session.active_calories || session.active_calories <= 0) return null
  if (session.duration_minutes <= 0) return null
  return session.active_calories / session.duration_minutes
}

function intensityColor(kpm: number): string {
  if (kpm >= 10) return '#f97316' // orange
  if (kpm >= 7) return YELLOW
  return '#fef08a' // pale yellow
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VolleyballClient({ sessions }: VolleyballClientProps) {
  // Use mock data when no real sessions are available
  const data = sessions.length > 0 ? sessions : MOCK_SESSIONS

  // ─── Summary stats ──────────────────────────────────────────────────────────
  const totalSessions = data.length
  const totalMinutes = data.reduce((s, w) => s + w.duration_minutes, 0)
  const totalHours = totalMinutes / 60

  const sessionsWithCalories = data.filter((s) => (s.active_calories ?? 0) > 0)
  const avgKcalPerMin =
    sessionsWithCalories.length > 0
      ? sessionsWithCalories.reduce((sum, s) => {
          const kpm = kcalPerMin(s)
          return sum + (kpm ?? 0)
        }, 0) / sessionsWithCalories.length
      : null

  const sessionsWithHR = data.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((sum, s) => sum + (s.avg_heart_rate ?? 0), 0) / sessionsWithHR.length
      : null

  const peakHR = data.reduce((max, s) => {
    const hr = s.max_heart_rate ?? 0
    return hr > max ? hr : max
  }, 0)

  // ─── Weekly sessions (last 13 weeks) ───────────────────────────────────────
  const weeklySessions = (() => {
    const weeks: Map<string, number> = new Map()
    const now = new Date()
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.set(weekLabel(d), 0)
    }
    for (const s of data) {
      const label = weekLabel(new Date(s.start_time))
      if (weeks.has(label)) {
        weeks.set(label, (weeks.get(label) ?? 0) + 1)
      }
    }
    return Array.from(weeks.entries()).map(([week, count]) => ({ week, count }))
  })()

  const maxWeekCount = Math.max(...weeklySessions.map((w) => w.count), 1)

  // ─── Calorie intensity (last 20 sessions) ──────────────────────────────────
  const last20 = [...data].reverse().slice(0, 20).reverse()
  const intensityData = last20.map((s) => {
    const kpm = kcalPerMin(s)
    return {
      date: fmtDate(s.start_time),
      kpm: kpm !== null ? Math.round(kpm * 10) / 10 : 0,
    }
  })
  const avgKpmLine =
    avgKcalPerMin !== null ? Math.round(avgKcalPerMin * 10) / 10 : null

  // ─── Recent sessions table (last 12) ───────────────────────────────────────
  const recentSessions = [...data].reverse().slice(0, 12)

  return (
    <div className="space-y-6">
      {/* 90-day summary card */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: YELLOW_BG, borderColor: YELLOW_BORDER }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🏐</span>
          <h2 className="text-base font-semibold text-text-primary">90-Day Summary</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: YELLOW }}>
              {totalSessions}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: YELLOW }}>
              {totalHours.toFixed(1)}h
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: YELLOW }}>
              {avgKcalPerMin !== null ? avgKcalPerMin.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg kcal/min</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: YELLOW }}>
              {avgHR !== null ? `${Math.round(avgHR)}` : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg HR (bpm)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: YELLOW }}>
              {peakHR > 0 ? peakHR : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Peak HR (bpm)</p>
          </div>
        </div>
      </div>

      {/* Weekly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Weekly Sessions — Last 13 Weeks
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklySessions} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
              allowDecimals={false}
              domain={[0, 'dataMax + 1']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {weeklySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === maxWeekCount && entry.count > 0 ? YELLOW : YELLOW_DIM}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calorie intensity bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Calorie Intensity — Last 20 Sessions (kcal/min)
        </h3>
        <div className="flex gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#f97316' }} />
            ≥ 10 kcal/min
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: YELLOW }} />
            ≥ 7 kcal/min
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#fef08a' }} />
            &lt; 7 kcal/min
          </span>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={intensityData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              domain={[0, 16]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} kcal/min`, 'Intensity']}
            />
            {avgKpmLine !== null && (
              <ReferenceLine
                y={avgKpmLine}
                stroke={YELLOW}
                strokeDasharray="5 3"
                label={{
                  value: `avg ${avgKpmLine}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: YELLOW,
                }}
              />
            )}
            <Bar dataKey="kpm" radius={[3, 3, 0, 0]}>
              {intensityData.map((entry, i) => (
                <Cell key={i} fill={intensityColor(entry.kpm)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-text-secondary">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2">
                  Date
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Duration
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  kcal
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  kcal/min
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s, i) => {
                const kpm = kcalPerMin(s)
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-text-primary whitespace-nowrap">
                      {fmtDateFull(s.start_time)}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right tabular-nums font-medium"
                      style={{ color: YELLOW }}
                    >
                      {s.duration_minutes} min
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {kpm !== null ? kpm.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {(s.avg_heart_rate ?? 0) > 0
                        ? `${Math.round(s.avg_heart_rate!)} bpm`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
