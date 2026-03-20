'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  score: number
  totalSessions: number
  easyPct: number
  moderatePct: number
  hardPct: number
}

interface WeekPoint {
  week: string
  easyPct: number
}

interface SportRow {
  sport: string
  easy: number
  moderate: number
  hard: number
  sessions: number
}

interface PolarizationClientProps {
  summary: Summary
  weeklyTrend: WeekPoint[]
  sportBreakdown: SportRow[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN  = '#4ade80'
const YELLOW = '#facc15'
const RED    = '#f87171'
const INDIGO = '#818cf8'

const ZONE_COLORS = { easy: GREEN, moderate: YELLOW, hard: RED }

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreLabel(score: number): { label: string; color: string; note: string } {
  if (score >= 85) return { label: 'Optimal', color: 'text-green-400', note: 'Textbook polarized distribution — you are building aerobic base while driving adaptation.' }
  if (score >= 70) return { label: 'Good',    color: 'text-indigo-400', note: 'Close to ideal. Reduce gray-zone moderate work to unlock more recovery and supercompensation.' }
  if (score >= 50) return { label: 'Fair',    color: 'text-yellow-400', note: 'Too much moderate intensity. Shift gray-zone sessions either easier or harder.' }
  return           { label: 'Poor',    color: 'text-red-400',    note: 'Training is stuck in the gray zone. Consider a polarized 12-week restructuring block.' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PolarizationClient({ summary, weeklyTrend, sportBreakdown }: PolarizationClientProps) {
  const { score, totalSessions, easyPct, moderatePct, hardPct } = summary
  const rating = scoreLabel(score)

  const pieData = [
    { name: 'Easy',     value: easyPct,     color: GREEN  },
    { name: 'Moderate', value: moderatePct, color: YELLOW },
    { name: 'Hard',     value: hardPct,     color: RED    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(129,140,248,0.07)', borderColor: 'rgba(129,140,248,0.25)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
              Polarization Score
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-text-primary">{score}</span>
              <span className="text-xl text-text-secondary">/100</span>
            </div>
            <p className={`text-sm font-semibold mt-1 ${rating.color}`}>{rating.label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary mb-1">Sessions analyzed</p>
            <p className="text-3xl font-bold" style={{ color: INDIGO }}>{totalSessions}</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-4">{rating.note}</p>

        {/* Zone bar */}
        <div className="space-y-2">
          <div className="flex rounded-full overflow-hidden h-3">
            <div style={{ width: `${easyPct}%`, background: GREEN }} />
            <div style={{ width: `${moderatePct}%`, background: YELLOW }} />
            <div style={{ width: `${hardPct}%`, background: RED }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {([
              { label: 'Easy',     pct: easyPct,     color: GREEN,  target: '≥80%' },
              { label: 'Moderate', pct: moderatePct, color: YELLOW, target: '5–10%' },
              { label: 'Hard',     pct: hardPct,     color: RED,    target: '15–20%' },
            ] as const).map(({ label, pct, color, target }) => (
              <div key={label} className="bg-surface rounded-xl border border-border p-3">
                <p className="text-xl font-bold" style={{ color }}>{pct}%</p>
                <p className="text-xs text-text-secondary">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>target {target}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Zone distribution donut chart ─────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Zone Distribution</h3>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="rgba(0,0,0,0.35)"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-3">
            {pieData.map(({ name, value, color }) => (
              <div key={name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-text-primary font-medium">{name}</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color }}>{value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                </div>
              </div>
            ))}

            <div className="pt-1 border-t border-border">
              <p className="text-xs text-text-secondary">
                Optimal: <span style={{ color: GREEN }}>80%</span> easy,{' '}
                <span style={{ color: YELLOW }}>5–10%</span> moderate,{' '}
                <span style={{ color: RED }}>15–20%</span> hard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Weekly easy% trend line chart ──────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Weekly Easy% — Last 13 Weeks
        </h3>
        <p className="text-xs text-text-secondary mb-3 opacity-70">
          Dashed line = 80% target threshold
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
              domain={[50, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v}%`, 'Easy zone']}
            />
            <ReferenceLine
              y={80}
              stroke={GREEN}
              strokeDasharray="5 4"
              strokeOpacity={0.6}
              label={{ value: '80%', position: 'right', fontSize: 10, fill: GREEN, fillOpacity: 0.7 }}
            />
            <Line
              type="monotone"
              dataKey="easyPct"
              stroke={INDIGO}
              strokeWidth={2.5}
              dot={{ r: 3, fill: INDIGO, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: INDIGO }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: INDIGO }} />
            Easy% per week
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: GREEN }} />
            80% target
          </div>
        </div>
      </div>

      {/* ── Sport breakdown table ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-text-secondary">Polarization by Sport</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2">Sport</th>
                <th className="text-right text-xs font-medium px-3 py-2" style={{ color: GREEN }}>Easy</th>
                <th className="text-right text-xs font-medium px-3 py-2" style={{ color: YELLOW }}>Moderate</th>
                <th className="text-right text-xs font-medium px-3 py-2" style={{ color: RED }}>Hard</th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {sportBreakdown.map((row, i) => {
                const isGrayZoneFlag = row.moderate > 15
                return (
                  <tr
                    key={row.sport}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.sport}
                        {isGrayZoneFlag && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(250,204,21,0.15)', color: YELLOW }}
                          >
                            gray zone
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: GREEN }}>
                      {row.easy}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: YELLOW }}>
                      {row.moderate}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: RED }}>
                      {row.hard}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {row.sessions}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'rgba(129,140,248,0.05)', borderColor: 'rgba(129,140,248,0.2)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: INDIGO }}>
            The Science — Seiler's Polarized Model
          </p>
          <h3 className="text-base font-bold text-text-primary leading-snug">
            Why 80% of your training should feel almost too easy
          </h3>
        </div>

        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>
            Exercise physiologist Stephen Seiler studied elite endurance athletes across sports and found
            a consistent pattern: the best performers spend roughly <span className="font-semibold" style={{ color: GREEN }}>80% of sessions below the first
            lactate threshold</span> (conversational pace, &lt;80% HRmax) and only{' '}
            <span className="font-semibold" style={{ color: RED }}>15–20% at genuinely hard intensities</span>{' '}
            (&gt;87% HRmax). The remaining &lt;5% falls in between.
          </p>

          <div
            className="rounded-xl border p-3"
            style={{ background: 'rgba(250,204,21,0.07)', borderColor: 'rgba(250,204,21,0.2)' }}
          >
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: YELLOW }}>
              The Gray Zone Problem (Moderate Intensity)
            </p>
            <p className="text-xs">
              Moderate intensity (80–87% HRmax) is deceptively harmful to long-term progress. It is hard
              enough to accumulate significant fatigue and cortisol stress, yet not hard enough to produce the
              powerful super-compensation signals that high-intensity intervals drive. Spending too many
              sessions here suppresses aerobic base development and blocks recovery, creating a chronic
              low-grade fatigue state sometimes called "gray zone overtraining."
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              {
                color: GREEN,
                bg: 'rgba(74,222,128,0.08)',
                bc: 'rgba(74,222,128,0.2)',
                zone: 'Easy Zone',
                range: '<80% HRmax',
                effect: 'Builds mitochondrial density, fat oxidation, and cardiac stroke volume with minimal fatigue cost. Allows high volume.',
              },
              {
                color: YELLOW,
                bg: 'rgba(250,204,21,0.08)',
                bc: 'rgba(250,204,21,0.2)',
                zone: 'Gray Zone',
                range: '80–87% HRmax',
                effect: 'High fatigue, low adaptation signal. Crowds out easy volume and hard sessions. Minimize to 5–10%.',
              },
              {
                color: RED,
                bg: 'rgba(248,113,113,0.08)',
                bc: 'rgba(248,113,113,0.2)',
                zone: 'Hard Zone',
                range: '>87% HRmax',
                effect: 'Drives VO2max, lactate tolerance, and running economy. Potent stimulus — requires full recovery between sessions.',
              },
            ].map(({ color, bg, bc, zone, range, effect }) => (
              <div key={zone} className="rounded-xl border p-3" style={{ background: bg, borderColor: bc }}>
                <p className="text-xs font-bold mb-0.5" style={{ color }}>{zone}</p>
                <p className="text-xs font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{range}</p>
                <p className="text-xs">{effect}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-secondary opacity-70">
            Reference: Seiler, S. (2010). What is best practice for training intensity and duration distribution in
            endurance athletes? Int J Sports Physiol Perform, 5(3), 276–291.
          </p>
        </div>
      </div>

    </div>
  )
}
