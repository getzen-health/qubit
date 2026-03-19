'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  BarChart,
} from 'recharts'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function respColor(avg: number | null): string {
  if (avg === null) return 'rgba(100,116,139,0.4)'
  if (avg < 12) return 'rgba(59,130,246,0.7)'
  if (avg <= 18) return 'rgba(34,197,94,0.7)'
  if (avg <= 22) return 'rgba(234,179,8,0.7)'
  return 'rgba(239,68,68,0.7)'
}

function respLabel(avg: number | null): { label: string; color: string } {
  if (avg === null) return { label: '—', color: 'text-text-secondary' }
  if (avg < 12) return { label: 'Low', color: 'text-blue-400' }
  if (avg <= 18) return { label: 'Normal', color: 'text-green-400' }
  if (avg <= 22) return { label: 'Elevated', color: 'text-yellow-400' }
  return { label: 'High', color: 'text-red-400' }
}

function spo2Color(avg: number | null): string {
  if (avg === null) return 'rgba(100,116,139,0.4)'
  if (avg >= 97) return 'rgba(6,182,212,0.8)'
  if (avg >= 94) return 'rgba(34,197,94,0.7)'
  if (avg >= 90) return 'rgba(234,179,8,0.7)'
  return 'rgba(239,68,68,0.8)'
}

export interface NightData {
  date: string
  respAvg: number | null
  respMin: number | null
  respMax: number | null
  respSamples: number
  spo2Avg: number | null
  spo2Min: number | null
  spo2Samples: number
  lowSpo2Events: number
  respCategory: 'low' | 'normal' | 'elevated' | 'high' | null
}

export interface SpoBucket {
  label: string
  min: number
  max: number
  color: string
  count: number
  pct: number
}

export interface SleepBreathingData {
  nights: NightData[]
  avgResp: number | null
  avgSpo2: number | null
  minSpo2Overall: number | null
  nightsWithLowSpo2: number
  normalRespNights: number
  totalNights: number
  spoBuckets: SpoBucket[]
}

export function SleepBreathingClient({ data }: { data: SleepBreathingData }) {
  const {
    nights,
    avgResp,
    avgSpo2,
    minSpo2Overall,
    nightsWithLowSpo2,
    normalRespNights,
    totalNights,
    spoBuckets,
  } = data

  const hasResp = nights.some((n) => n.respAvg !== null)
  const hasSpo2 = nights.some((n) => n.spo2Avg !== null)

  const { label: respLbl, color: respClr } = respLabel(avgResp)
  const consistencyPct = totalNights > 0 ? Math.round((normalRespNights / totalNights) * 100) : 0
  const lowSpo2Pct = totalNights > 0 ? Math.round((nightsWithLowSpo2 / totalNights) * 100) : 0

  return (
    <div className="space-y-4">

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {hasResp && avgResp !== null && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Avg Resp. Rate</p>
            <p className={`text-2xl font-bold ${respClr}`}>{avgResp}</p>
            <p className="text-xs text-text-secondary mt-0.5">breaths/min · {respLbl}</p>
          </div>
        )}
        {hasSpo2 && avgSpo2 !== null && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Avg SpO₂</p>
            <p className={`text-2xl font-bold ${avgSpo2 >= 97 ? 'text-cyan-400' : avgSpo2 >= 94 ? 'text-green-400' : 'text-yellow-400'}`}>
              {avgSpo2}%
            </p>
            <p className="text-xs text-text-secondary mt-0.5">overnight average</p>
          </div>
        )}
        {hasSpo2 && minSpo2Overall !== null && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Lowest SpO₂</p>
            <p className={`text-2xl font-bold ${minSpo2Overall < 90 ? 'text-red-400' : minSpo2Overall < 94 ? 'text-yellow-400' : 'text-green-400'}`}>
              {minSpo2Overall}%
            </p>
            <p className="text-xs text-text-secondary mt-0.5">recorded minimum</p>
          </div>
        )}
        {hasResp && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Normal Nights</p>
            <p className={`text-2xl font-bold ${consistencyPct >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
              {consistencyPct}%
            </p>
            <p className="text-xs text-text-secondary mt-0.5">resp. in 12–18 bpm</p>
          </div>
        )}
        {hasSpo2 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Low SpO₂ Nights</p>
            <p className={`text-2xl font-bold ${nightsWithLowSpo2 === 0 ? 'text-green-400' : lowSpo2Pct > 20 ? 'text-red-400' : 'text-yellow-400'}`}>
              {nightsWithLowSpo2}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">any reading &lt;94%</p>
          </div>
        )}
      </div>

      {/* ── Respiratory Rate Trend ─────────────────────────────────────── */}
      {hasResp && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Nightly Respiratory Rate</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Breaths/min during sleep · Normal: 12–18 bpm
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={nights.filter((n) => n.respAvg !== null)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                domain={[8, 26]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${Number(v).toFixed(1)} br/min`,
                  name === 'respAvg' ? 'Avg Resp. Rate' : name === 'respMin' ? 'Min' : 'Max',
                ]}
                labelFormatter={(l: string) => fmtDate(l)}
              />
              {/* Reference lines for normal range */}
              <ReferenceLine y={12} stroke="rgba(34,197,94,0.2)" strokeDasharray="4 3" label={{ value: '12', position: 'left', fontSize: 8, fill: 'rgba(34,197,94,0.4)' }} />
              <ReferenceLine y={18} stroke="rgba(34,197,94,0.2)" strokeDasharray="4 3" label={{ value: '18', position: 'left', fontSize: 8, fill: 'rgba(34,197,94,0.4)' }} />
              {/* Min-Max range as bars */}
              <Bar dataKey="respMin" fill="transparent" />
              <Bar dataKey="respMax" fill="transparent" />
              {/* Avg line */}
              <Line
                type="monotone"
                dataKey="respAvg"
                stroke="rgba(250,204,21,0.8)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: 'rgba(250,204,21,0.8)' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Category legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: 'Low (<12)', color: 'bg-blue-400/70' },
              { label: 'Normal (12–18)', color: 'bg-green-400/70' },
              { label: 'Elevated (18–22)', color: 'bg-yellow-400/70' },
              { label: 'High (>22)', color: 'bg-red-400/70' },
            ].map((cat) => (
              <span key={cat.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── SpO2 Trend ────────────────────────────────────────────────── */}
      {hasSpo2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Overnight Blood Oxygen (SpO₂)</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Nightly average SpO₂ · Normal: ≥95%
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={nights.filter((n) => n.spo2Avg !== null)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 2', 100]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${Number(v).toFixed(1)}%`,
                  name === 'spo2Avg' ? 'Avg SpO₂' : 'Min SpO₂',
                ]}
                labelFormatter={(l: string) => fmtDate(l)}
              />
              <ReferenceLine y={95} stroke="rgba(34,197,94,0.25)" strokeDasharray="4 3" label={{ value: '95%', position: 'left', fontSize: 8, fill: 'rgba(34,197,94,0.4)' }} />
              <ReferenceLine y={90} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 3" label={{ value: '90%', position: 'left', fontSize: 8, fill: 'rgba(239,68,68,0.4)' }} />
              {/* Min dots */}
              <Line
                type="monotone"
                dataKey="spo2Min"
                stroke="rgba(239,68,68,0.5)"
                strokeWidth={0}
                dot={{ r: 3, fill: 'rgba(239,68,68,0.6)' }}
                activeDot={{ r: 5 }}
              />
              {/* Avg line */}
              <Line
                type="monotone"
                dataKey="spo2Avg"
                stroke="rgba(6,182,212,0.9)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 rounded-sm bg-cyan-400/80 inline-block" /> Avg SpO₂</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400/60 inline-block" /> Nightly min</span>
          </div>
        </div>
      )}

      {/* ── SpO2 Distribution ─────────────────────────────────────────── */}
      {hasSpo2 && spoBuckets.some((b) => b.count > 0) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">SpO₂ Distribution</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            How often your blood oxygen falls in each range during sleep
          </p>
          <div className="space-y-2">
            {[...spoBuckets].reverse().filter((b) => b.count > 0).map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-14 shrink-0">{b.label}%</span>
                <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${b.pct}%`, background: b.color }}
                  />
                </div>
                <span className="text-xs text-text-secondary w-10 text-right shrink-0">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Night detail table ────────────────────────────────────────── */}
      {nights.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Night-by-Night</p>
          <div className="space-y-2">
            {[...nights].reverse().slice(0, 20).map((n) => {
              const { color: rc } = respLabel(n.respAvg)
              return (
                <div key={n.date} className="flex items-center gap-3 py-1 border-b border-border last:border-0">
                  <p className="text-xs text-text-secondary w-20 shrink-0">
                    {fmtDate(n.date)}
                  </p>
                  {n.respAvg !== null && (
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-text-secondary">RR</span>
                      <span className={`text-xs font-medium ${rc}`}>{n.respAvg} br/min</span>
                    </div>
                  )}
                  {n.spo2Avg !== null && (
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-text-secondary">SpO₂</span>
                      <span className={`text-xs font-medium ${n.spo2Avg >= 95 ? 'text-cyan-400' : n.spo2Avg >= 90 ? 'text-yellow-400' : 'text-red-400'}`}>
                        avg {n.spo2Avg}%
                      </span>
                      {n.spo2Min !== null && n.spo2Min < n.spo2Avg - 0.5 && (
                        <span className="text-[10px] text-red-400 opacity-70">
                          · min {n.spo2Min}%
                        </span>
                      )}
                    </div>
                  )}
                  {n.lowSpo2Events > 0 && (
                    <span className="text-[10px] text-red-400 shrink-0">
                      {n.lowSpo2Events} low
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Clinical context ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2 text-xs text-text-secondary">
        <p className="font-semibold text-text-primary text-sm">What to look for</p>
        <p><span className="text-green-400 font-medium">Respiratory rate 12–18 br/min</span> during sleep is normal. Rates consistently above 20 may indicate restless sleep, illness, or sleep-disordered breathing.</p>
        <p><span className="text-cyan-400 font-medium">SpO₂ above 95%</span> is healthy. Frequent drops below 94% — especially below 90% — may be a sign of sleep apnea and should be discussed with a doctor.</p>
        <p className="opacity-60 italic">Apple Watch data is for wellness only, not medical diagnosis.</p>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalNights} nights analysed · last 90 days
      </p>
    </div>
  )
}
