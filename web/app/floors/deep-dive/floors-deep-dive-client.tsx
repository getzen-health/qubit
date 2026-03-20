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
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FloorLevel = 'dark' | 'medium' | 'light'

export interface DailyFloors {
  date: string
  floors: number
  level: FloorLevel
}

export interface DowAvg {
  day: string
  avg: number
}

export interface FloorsDeepDiveData {
  todayFloors: number
  goalFloors: number
  avg30d: number
  bestDay: number
  bestDayDate: string
  daysMetGoal: number
  currentStreak: number
  daily: DailyFloors[]
  dowAvg: DowAvg[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE_DARK   = '#c2410c' // ≥ 15 floors
const ORANGE_MED    = '#f97316' // ≥ 10 floors
const ORANGE_LIGHT  = '#fdba74' // < 10 floors
const ORANGE_ACCENT = '#f97316'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levelColor(level: FloorLevel): string {
  if (level === 'dark')   return ORANGE_DARK
  if (level === 'medium') return ORANGE_MED
  return ORANGE_LIGHT
}

function classifyLevel(floors: number): FloorLevel {
  if (floors >= 15) return 'dark'
  if (floors >= 10) return 'medium'
  return 'light'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloorsDeepDiveClient({ data }: { data: FloorsDeepDiveData }) {
  const {
    todayFloors,
    goalFloors,
    avg30d,
    bestDay,
    bestDayDate,
    daysMetGoal,
    currentStreak,
    daily,
    dowAvg,
  } = data

  const goalPct = Math.min(100, Math.round((todayFloors / goalFloors) * 100))
  const dowMax = Math.max(...dowAvg.map((d) => d.avg))

  return (
    <div className="space-y-6">

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(249,115,22,0.07)', borderColor: 'rgba(249,115,22,0.22)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              Today's Floors
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold" style={{ color: ORANGE_ACCENT }}>
                {todayFloors}
              </p>
              <p className="text-sm text-text-secondary">/ {goalFloors} goal</p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold mt-1 text-orange-400"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.35)' }}
          >
            {goalPct}% of goal
          </span>
        </div>

        {/* Goal progress bar */}
        <div className="mb-5">
          <div className="h-2 bg-background/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${goalPct}%`, background: ORANGE_ACCENT }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1 opacity-60">
            {goalFloors - todayFloors > 0
              ? `${goalFloors - todayFloors} more floors to reach today's goal`
              : 'Goal reached!'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary">{avg30d.toFixed(1)}</p>
            <p className="text-xs text-text-secondary mt-0.5">30d Average</p>
            <p className="text-xs text-text-secondary opacity-50">floors/day</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold" style={{ color: ORANGE_DARK }}>{bestDay}</p>
            <p className="text-xs text-text-secondary mt-0.5">Best Day</p>
            <p className="text-xs text-text-secondary opacity-50">{bestDayDate}</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-orange-400">{daysMetGoal}</p>
            <p className="text-xs text-text-secondary mt-0.5">Days Met Goal</p>
            <p className="text-xs text-text-secondary opacity-50">last 30 days</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{currentStreak}</p>
            <p className="text-xs text-text-secondary mt-0.5">Current Streak</p>
            <p className="text-xs text-text-secondary opacity-50">days ≥ goal</p>
          </div>
        </div>
      </div>

      {/* ── 30-day bar chart ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">30-Day Floors History</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Dark orange ≥ 15 · medium ≥ 10 · light &lt; 10 · dashed line = 10-floor goal
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val} floors`, 'Floors Climbed']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <ReferenceLine
              y={10}
              stroke={ORANGE_ACCENT}
              strokeDasharray="5 3"
              strokeOpacity={0.55}
              label={{ value: 'Goal (10)', fill: ORANGE_ACCENT, fontSize: 9, position: 'insideTopRight' }}
            />
            <Bar dataKey="floors" radius={[3, 3, 0, 0]}>
              {daily.map((entry, i) => (
                <Cell key={i} fill={levelColor(entry.level)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Day-of-week pattern ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Pattern</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Average floors per weekday over the last 30 days
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dowAvg} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              allowDecimals={false}
              domain={[0, Math.ceil(dowMax) + 2]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val.toFixed(1)} floors`, 'Avg Floors']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <ReferenceLine
              y={10}
              stroke={ORANGE_ACCENT}
              strokeDasharray="5 3"
              strokeOpacity={0.45}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {dowAvg.map((entry, i) => (
                <Cell
                  key={i}
                  fill={levelColor(classifyLevel(entry.avg))}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Science card ─────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">The Science of Stair Climbing</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">
            Why floors climbed is a surprisingly strong health signal
          </p>
        </div>
        <div className="divide-y divide-border">

          <div className="px-4 py-4 flex items-start gap-3">
            <div
              className="flex-none w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5"
              style={{ background: 'rgba(249,115,22,0.15)', color: ORANGE_ACCENT }}
            >
              33%
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Harvard Alumni Study — Mortality Reduction
              </p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                Paffenbarger et al. tracked 10,000+ Harvard alumni over 16 years and found that men
                who climbed 8 or more floors per day had a{' '}
                <span className="text-orange-400 font-medium">33% lower all-cause mortality</span>{' '}
                rate compared to sedentary peers, independent of other exercise habits.
              </p>
              <p className="text-xs text-text-secondary mt-2 opacity-55">
                Paffenbarger RS Jr et al., NEJM 1986
              </p>
            </div>
          </div>

          <div className="px-4 py-4 flex items-start gap-3">
            <div
              className="flex-none w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5"
              style={{ background: 'rgba(249,115,22,0.15)', color: ORANGE_ACCENT }}
            >
              7%
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Kamada 2017 — Cardiovascular Risk per Flight
              </p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                A prospective cohort study by Kamada et al. (2017) found that each additional
                flight of stairs climbed daily was associated with a{' '}
                <span className="text-orange-400 font-medium">
                  ~7% reduction in cardiovascular disease risk
                </span>
                . The effect was dose-dependent up to approximately 15 floors per day.
              </p>
              <p className="text-xs text-text-secondary mt-2 opacity-55">
                Kamada M et al., Sci Rep 2017; doi:10.1038/s41598-017-15006-5
              </p>
            </div>
          </div>

          <div className="px-4 py-4 flex items-start gap-3">
            <div
              className="flex-none w-8 h-8 rounded-lg flex items-center justify-center text-lg mt-0.5"
              style={{ background: 'rgba(249,115,22,0.10)', color: ORANGE_ACCENT }}
            >
              ⚠
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Altimeter Detection — Elevators &amp; Escalators
              </p>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                iPhone and Apple Watch use the barometric altimeter to detect pressure changes
                equivalent to climbing one floor (~3 m / 10 ft). Because the sensor measures
                altitude gain, not motion,{' '}
                <span className="text-orange-400 font-medium">
                  riding an elevator or escalator can register as floors climbed
                </span>
                . For accurate data, ensure "Motion Calibration &amp; Distance" is enabled in
                Privacy settings and be aware floors may be slightly overstated on heavy-elevator
                days.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
