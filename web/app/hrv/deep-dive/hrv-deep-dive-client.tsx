'use client'

import {
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
  ComposedChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HrvReading {
  date: string
  sdnn: number
  rolling: number
}

interface MonthlyAvg {
  month: string
  label: string
  avg: number
}

interface HrvDeepDiveClientProps {
  readings: HrvReading[]
  monthly: MonthlyAvg[]
  latestHrv: number
  latest30Avg: number
  trend30: number
  baseline: number
  peak12mo: number
  low12mo: number
  ansState: string
  ratio: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN = '#22c55e'
const GREEN_DIM = 'rgba(34,197,94,0.35)'
const GREEN_DARK = '#16a34a'
const TEAL = '#14b8a6'
const ORANGE = '#f97316'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── ANS zone configuration ───────────────────────────────────────────────────

const ANS_ZONES = [
  {
    label: 'Parasympathetic Dominant',
    condition: 'Ratio ≥ 1.08',
    color: GREEN,
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    recommendation: 'Ready for hard session',
    description: 'Recovery is excellent. High SDNN reflects strong vagal tone — your body is primed for intensity.',
  },
  {
    label: 'Balanced',
    condition: 'Ratio 0.92–1.08',
    color: TEAL,
    bg: 'rgba(20,184,166,0.08)',
    border: 'rgba(20,184,166,0.25)',
    recommendation: 'Moderate training OK',
    description: 'ANS is in equilibrium. Steady-state or tempo work is appropriate; avoid back-to-back high-load days.',
  },
  {
    label: 'Sympathetic Dominant',
    condition: 'Ratio < 0.92',
    color: ORANGE,
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
    recommendation: 'Recovery needed',
    description: 'Suppressed SDNN signals accumulated stress or fatigue. Prioritise sleep, nutrition, and easy movement.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ansColor(state: string) {
  if (state === 'Parasympathetic Dominant') return GREEN
  if (state === 'Balanced') return TEAL
  return ORANGE
}

// ─── Custom tooltip for trend chart ──────────────────────────────────────────

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: HrvReading }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-0.5">
      <p className="text-text-secondary text-[11px]">{fmtDate(d.date)}</p>
      <p className="font-semibold" style={{ color: GREEN }}>
        {d.sdnn} ms <span className="text-text-secondary font-normal text-[11px]">daily</span>
      </p>
      <p className="text-[11px]" style={{ color: GREEN_DARK }}>
        {d.rolling} ms <span className="text-text-secondary">30-day avg</span>
      </p>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function HrvDeepDiveClient({
  readings,
  monthly,
  latestHrv,
  latest30Avg,
  trend30,
  baseline,
  peak12mo,
  low12mo,
  ansState,
  ratio,
}: HrvDeepDiveClientProps) {
  const trendColor = trend30 >= 0 ? GREEN : ORANGE
  const trendSign = trend30 >= 0 ? '+' : ''
  const currentAnsColor = ansColor(ansState)

  // X-axis tick: show month label at first reading of each month
  const monthTicks = readings
    .filter((r, i) => {
      if (i === 0) return true
      return r.date.slice(5, 7) !== readings[i - 1].date.slice(5, 7)
    })
    .map((r) => r.date)

  return (
    <div className="space-y-6">
      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Latest HRV SDNN</p>
            <p className="text-5xl font-bold leading-none" style={{ color: GREEN }}>
              {latestHrv}
              <span className="text-2xl font-medium text-text-secondary ml-1">ms</span>
            </p>
            <p
              className="mt-2 inline-block text-sm font-semibold px-2.5 py-0.5 rounded-full"
              style={{ color: currentAnsColor, background: `${currentAnsColor}18` }}
            >
              {ansState}
            </p>
          </div>
          <span className="text-5xl select-none">💚</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface/60 rounded-xl p-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">Baseline</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">{baseline} ms</p>
          </div>
          <div className="bg-surface/60 rounded-xl p-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">Peak 12 mo</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: GREEN }}>
              {peak12mo} ms
            </p>
          </div>
          <div className="bg-surface/60 rounded-xl p-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">Low 12 mo</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: ORANGE }}>
              {low12mo} ms
            </p>
          </div>
          <div className="bg-surface/60 rounded-xl p-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">30-day trend</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: trendColor }}>
              {trendSign}{trend30} ms
            </p>
          </div>
        </div>
      </div>

      {/* ── 12-month trend chart ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          12-Month SDNN Trend
        </h3>
        <p className="text-[11px] text-text-secondary mb-3">
          Daily readings (dots) · 30-day rolling average (line) · baseline {baseline} ms (dashed)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={readings} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              type="category"
              ticks={monthTicks}
              tickFormatter={(v: string) =>
                new Date(v).toLocaleDateString('en-US', { month: 'short' })
              }
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[20, 95]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip content={<TrendTooltip />} />
            <ReferenceLine
              y={baseline}
              stroke={GREEN}
              strokeDasharray="5 4"
              strokeOpacity={0.5}
              label={{
                value: `baseline ${baseline}`,
                position: 'insideTopRight',
                fontSize: 9,
                fill: GREEN,
                opacity: 0.7,
              }}
            />
            {/* Daily scatter rendered as a line with dots but no connecting line */}
            <Line
              dataKey="sdnn"
              dot={{ r: 2.5, fill: GREEN_DIM, stroke: 'none' }}
              activeDot={{ r: 4, fill: GREEN, stroke: 'none' }}
              stroke="none"
              isAnimationActive={false}
            />
            {/* 30-day rolling average */}
            <Line
              dataKey="rolling"
              dot={false}
              stroke={GREEN}
              strokeWidth={2.5}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: GREEN }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-end">
          <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: GREEN_DIM }} />
            Daily SDNN
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <span className="w-5 h-0.5 rounded" style={{ background: GREEN }} />
            30-day avg
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <span className="w-5 border-t border-dashed" style={{ borderColor: `${GREEN}80` }} />
            Baseline
          </span>
        </div>
      </div>

      {/* ── Monthly average bar chart ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Monthly Average SDNN</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[40, 70]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              tickFormatter={(v: number) => `${v}`}
            />
            <ReferenceLine
              y={baseline}
              stroke={GREEN}
              strokeDasharray="5 4"
              strokeOpacity={0.45}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} ms`, 'Monthly avg SDNN']}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {monthly.map((m, i) => (
                <Cell
                  key={i}
                  fill={m.avg >= baseline ? GREEN : GREEN_DIM}
                  opacity={m.avg >= baseline ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-text-secondary mt-1 text-right">
          Bright green = above baseline ({baseline} ms)
        </p>
      </div>

      {/* ── ANS Balance zones ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-text-secondary">ANS Balance Zones</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Based on 30-day avg / baseline ratio. Current ratio:{' '}
            <span className="font-semibold" style={{ color: currentAnsColor }}>
              {ratio.toFixed(2)}
            </span>
          </p>
        </div>
        <div className="divide-y divide-border">
          {ANS_ZONES.map((zone) => {
            const isCurrent = zone.label === ansState
            return (
              <div
                key={zone.label}
                className="px-4 py-3"
                style={isCurrent ? { background: zone.bg } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: zone.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{zone.label}</p>
                        {isCurrent && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ color: zone.color, background: `${zone.color}20` }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">{zone.condition}</p>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {zone.description}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg text-right whitespace-nowrap"
                    style={{ color: zone.color, background: `${zone.color}15` }}
                  >
                    {zone.recommendation}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <h3 className="text-sm font-semibold text-text-primary">The Science of SDNN</h3>
        </div>

        <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
          <p>
            <span className="font-semibold text-text-primary">SDNN</span> (Standard Deviation of
            Normal-to-Normal RR intervals) is the most widely used time-domain HRV metric. It
            captures beat-to-beat variation driven primarily by the autonomic nervous system — both
            sympathetic and parasympathetic branches — making it a sensitive marker of overall
            cardiovascular regulation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(34,197,94,0.07)', borderLeft: `3px solid ${GREEN}` }}
            >
              <p className="font-semibold text-text-primary mb-1">Parasympathetic (vagal)</p>
              <p>
                Drives HRV upward. Active during recovery, sleep, and low-stress states. High vagal
                tone = faster cardiac adaptation, better endurance, stronger immune function.
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(249,115,22,0.07)', borderLeft: `3px solid ${ORANGE}` }}
            >
              <p className="font-semibold text-text-primary mb-1">Sympathetic ("fight or flight")</p>
              <p>
                Suppresses HRV. Elevated by training stress, poor sleep, illness, or psychological
                load. Chronic dominance signals insufficient recovery.
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-text-primary mb-1">Typical SDNN Ranges</p>
            <div className="flex flex-col gap-1">
              {[
                { label: 'Elite / endurance athletes', range: '80–120+ ms', color: GREEN },
                { label: 'Active adults', range: '60–100 ms', color: GREEN },
                { label: 'General healthy population', range: '30–60 ms', color: TEAL },
                { label: 'Clinical concern threshold', range: '< 20 ms', color: ORANGE },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span>{row.label}</span>
                  <span className="font-semibold tabular-nums" style={{ color: row.color }}>
                    {row.range}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-2.5 space-y-1">
            <p className="font-semibold text-text-primary text-[11px] uppercase tracking-wide">
              Key References
            </p>
            <p>
              Kiviniemi AM et al. (2010). Individual-guided training prescription based on heart rate
              variability in endurance athletes.{' '}
              <em>European Journal of Applied Physiology</em>, 108(4), 765–773.
            </p>
            <p>
              Plews DJ et al. (2013). Heart rate variability in elite triathletes, is variation in
              variability the key to effective training? A case comparison.{' '}
              <em>European Journal of Applied Physiology</em>, 113(11), 2763–2773.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
