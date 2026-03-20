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
import type { UVExposureData, UVDay, UVCategory } from './page'
import { getUVCategory } from './page'

interface Props {
  data: UVExposureData
}

// ─── Category palette ─────────────────────────────────────────────────────────

const CAT_COLOR: Record<UVCategory, string> = {
  Low: '#22c55e',
  Moderate: '#eab308',
  High: '#f97316',
  'Very High': '#ef4444',
  Extreme: '#a855f7',
}

const CAT_BG: Record<UVCategory, string> = {
  Low: 'rgba(34,197,94,0.12)',
  Moderate: 'rgba(234,179,8,0.12)',
  High: 'rgba(249,115,22,0.12)',
  'Very High': 'rgba(239,68,68,0.12)',
  Extreme: 'rgba(168,85,247,0.12)',
}

const CAT_BORDER: Record<UVCategory, string> = {
  Low: 'rgba(34,197,94,0.30)',
  Moderate: 'rgba(234,179,8,0.30)',
  High: 'rgba(249,115,22,0.30)',
  'Very High': 'rgba(239,68,68,0.30)',
  Extreme: 'rgba(168,85,247,0.30)',
}

// ─── Category reference table data ───────────────────────────────────────────

const WHO_CATEGORIES: Array<{
  cat: UVCategory
  range: string
  recommendation: string
}> = [
  {
    cat: 'Low',
    range: '< 25 J/m²',
    recommendation: 'No protection needed. Safe for typical outdoor activities.',
  },
  {
    cat: 'Moderate',
    range: '25–50 J/m²',
    recommendation: 'SPF 30 sunscreen for extended time outdoors. Seek shade at midday.',
  },
  {
    cat: 'High',
    range: '50–100 J/m²',
    recommendation: 'Protection essential. SPF 50+, hat, UV-blocking sunglasses.',
  },
  {
    cat: 'Very High',
    range: '100–200 J/m²',
    recommendation: 'Extra protection required. Avoid peak hours (10 am – 4 pm).',
  },
  {
    cat: 'Extreme',
    range: '> 200 J/m²',
    recommendation: 'Dangerous exposure. Stay indoors during peak sunlight hours.',
  },
]

// ─── Science facts ────────────────────────────────────────────────────────────

const SCIENCE_FACTS = [
  {
    icon: '☀️',
    title: 'Vitamin D synthesis',
    body: '15–20 min of midday sun at UVI 3+ (25–50 J/m²) synthesises ~1,000 IU vitamin D. Melanin slows synthesis — darker skin tones need 3–6× longer exposure for the same yield.',
  },
  {
    icon: '🔬',
    title: 'Skin cancer risk',
    body: 'Cumulative UV exposure is the primary environmental driver of skin cancer. SPF 30 blocks ~97% of UVB; SPF 50 blocks ~98%. Reapply every 2 hours when active.',
  },
  {
    icon: '🌡️',
    title: 'Sunburn dose (SED)',
    body: '100 J/m² = 1 Standard Erythema Dose (SED). Fair skin (Fitzpatrick type I) may burn at just 200 J/m²; darker tones tolerate 500–1,000 J/m² before burning.',
  },
  {
    icon: '🕐',
    title: 'Time of day',
    body: 'Roughly 80% of daily UV arrives between 10 am and 4 pm. UV intensity rises ~10% for every 1,000 m of elevation gain — a key consideration for trail running and alpine sports.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtFullDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface UVTooltipProps {
  active?: boolean
  payload?: { payload: UVDay; value: number }[]
}

function UVTooltip({ active, payload }: UVTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.uv === 0) {
    return (
      <div
        style={{
          background: 'var(--color-surface, #1a1a1a)',
          border: '1px solid var(--color-border, #333)',
          borderRadius: 8,
          fontSize: 12,
          padding: '8px 12px',
          minWidth: 140,
        }}
      >
        <p className="font-semibold text-text-primary mb-0.5">{fmtDate(d.date)}</p>
        <p className="text-text-secondary">Indoor day — no data</p>
      </div>
    )
  }
  return (
    <div
      style={{
        background: 'var(--color-surface, #1a1a1a)',
        border: '1px solid var(--color-border, #333)',
        borderRadius: 8,
        fontSize: 12,
        padding: '8px 12px',
        minWidth: 160,
      }}
    >
      <p className="font-semibold text-text-primary mb-1">{fmtDate(d.date)}</p>
      <p className="text-text-secondary">
        UV dose:{' '}
        <span className="font-semibold" style={{ color: CAT_COLOR[d.category] }}>
          {d.uv} J/m²
        </span>
      </p>
      <p className="text-text-secondary">
        Category:{' '}
        <span className="font-medium" style={{ color: CAT_COLOR[d.category] }}>
          {d.category}
        </span>
      </p>
      {d.note && (
        <p className="text-text-secondary mt-0.5">Activity: {d.note}</p>
      )}
    </div>
  )
}

// ─── UV Index scale visual ────────────────────────────────────────────────────

function UVIndexScale() {
  const segments: Array<{ label: string; color: string; flex: number }> = [
    { label: 'Low', color: '#22c55e', flex: 1 },
    { label: 'Moderate', color: '#eab308', flex: 1 },
    { label: 'High', color: '#f97316', flex: 2 },
    { label: 'Very High', color: '#ef4444', flex: 2 },
    { label: 'Extreme', color: '#a855f7', flex: 2 },
  ]

  return (
    <div className="mt-3">
      <p className="text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wide">
        UV Dose Scale
      </p>
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {segments.map((s) => (
          <div key={s.label} style={{ flex: s.flex, backgroundColor: s.color }} />
        ))}
      </div>
      <div className="flex mt-1 text-[10px] text-text-secondary">
        <span className="flex-1">0</span>
        <span className="flex-1 text-center">25</span>
        <span className="flex-[2] text-center">50</span>
        <span className="flex-[2] text-center">100</span>
        <span className="flex-[2] text-right">200+</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UVExposureClient({ data }: Props) {
  const { days, summary } = data

  const todayColor = CAT_COLOR[summary.todayCategory]
  const todayBg = CAT_BG[summary.todayCategory]
  const todayBorder = CAT_BORDER[summary.todayCategory]

  const peakCategory = getUVCategory(summary.peak30d)

  return (
    <div className="space-y-6">

      {/* ── Hero stat ─────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: todayBg, borderColor: todayBorder }}
      >
        {/* Sun icon row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              Today's UV Exposure
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className="text-5xl font-bold tabular-nums"
                style={{ color: todayColor }}
              >
                {summary.today}
              </span>
              <span className="text-lg font-medium text-text-secondary">J/m²</span>
            </div>
          </div>
          {/* Stylised sun */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: 'rgba(251,191,36,0.15)', border: '2px solid rgba(251,191,36,0.35)' }}
          >
            ☀️
          </div>
        </div>

        {/* WHO category badge */}
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              background: todayBg,
              border: `1.5px solid ${todayBorder}`,
              color: todayColor,
            }}
          >
            {summary.todayCategory}
          </span>
          <span className="text-sm text-text-secondary">
            {summary.todayCategory === 'High' && 'Protection essential — SPF 50+, hat, sunglasses'}
            {summary.todayCategory === 'Low' && 'No protection needed'}
            {summary.todayCategory === 'Moderate' && 'SPF 30 recommended for extended time'}
            {summary.todayCategory === 'Very High' && 'Extra protection, avoid peak hours'}
            {summary.todayCategory === 'Extreme' && 'Dangerous — stay indoors during peak hours'}
          </span>
        </div>

        <UVIndexScale />
      </div>

      {/* ── 30-day bar chart ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Daily UV Dose — Last 30 Days (J/m²)
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          {(Object.keys(CAT_COLOR) as UVCategory[]).map((cat) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: CAT_COLOR[cat] }}
              />
              {cat}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={days} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
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
              tickFormatter={fmtDate}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              domain={[0, 210]}
              tickFormatter={(v: number) => `${v}`}
            />
            {/* High threshold */}
            <ReferenceLine
              y={50}
              stroke="#f97316"
              strokeDasharray="4 3"
              strokeOpacity={0.55}
              label={{ value: '50', position: 'right', fontSize: 9, fill: '#f97316' }}
            />
            {/* Vitamin D minimum */}
            <ReferenceLine
              y={15}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeOpacity={0.55}
              label={{ value: '15', position: 'right', fontSize: 9, fill: '#22c55e' }}
            />
            <Tooltip content={<UVTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="uv" radius={[3, 3, 0, 0]}>
              {days.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.uv === 0 ? 'rgba(255,255,255,0.08)' : CAT_COLOR[d.category]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-text-secondary">
          <span>
            <span
              className="inline-block w-6 border-t border-dashed mr-1 align-middle"
              style={{ borderColor: '#f97316' }}
            />
            50 J/m² — High threshold
          </span>
          <span>
            <span
              className="inline-block w-6 border-t border-dashed mr-1 align-middle"
              style={{ borderColor: '#22c55e' }}
            />
            15 J/m² — Vitamin D minimum
          </span>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-amber-400">{summary.avg30d}</p>
          <p className="text-xs text-text-secondary mt-0.5">30d avg (J/m²)</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: CAT_COLOR[peakCategory] }}
          >
            {summary.peak30d}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Peak day (J/m²)</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{fmtDate(summary.peakDate)}</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-red-400">{summary.highPlusDays}</p>
          <p className="text-xs text-text-secondary mt-0.5">High+ days</p>
          <p className="text-[11px] text-text-secondary mt-0.5">≥ 100 J/m²</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-sky-400">{summary.daysTracked}</p>
          <p className="text-xs text-text-secondary mt-0.5">Days tracked</p>
          <p className="text-[11px] text-text-secondary mt-0.5">of 30</p>
        </div>
      </div>

      {/* ── Vitamin D / Sunburn info banner ───────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4 space-y-3"
        style={{
          background: 'rgba(251,191,36,0.07)',
          borderColor: 'rgba(251,191,36,0.25)',
        }}
      >
        <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
          <span>🌤️</span> Vitamin D &amp; Sunburn Reference
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-surface/60 rounded-xl border border-border p-3">
            <p className="text-xs font-semibold text-green-400 mb-1">Vitamin D synthesis</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              15–20 min at UVI 3+ (25–50 J/m²) is typically sufficient to synthesise vitamin D.
              Optimal window: 10 am – 2 pm, arms and legs exposed.
            </p>
          </div>
          <div className="bg-surface/60 rounded-xl border border-border p-3">
            <p className="text-xs font-semibold text-red-400 mb-1">Sunburn threshold (SED)</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Sunburn risk starts at 100–300 J/m² depending on skin type. Fair skin (type I)
              can burn at as little as 200 J/m² — roughly 2 SED.
            </p>
          </div>
        </div>
      </div>

      {/* ── WHO Categories reference card ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="text-lg">☀️</span>
          <h3 className="text-sm font-medium text-text-secondary">
            WHO UV Exposure Categories
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Category
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary whitespace-nowrap">
                  Dose (J/m²)
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {WHO_CATEGORIES.map((row) => (
                <tr key={row.cat} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                      style={{
                        background: CAT_BG[row.cat],
                        border: `1px solid ${CAT_BORDER[row.cat]}`,
                        color: CAT_COLOR[row.cat],
                      }}
                    >
                      {row.cat}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono font-medium text-text-primary whitespace-nowrap">
                    {row.range}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary leading-relaxed">
                    {row.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">UV Science</h3>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {SCIENCE_FACTS.map((fact) => (
            <div key={fact.title} className="p-4 space-y-1.5">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span>{fact.icon}</span>
                {fact.title}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">{fact.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data source note ──────────────────────────────────────────────────── */}
      <div className="px-1">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          UV dose measured by the Apple Watch Ultra ambient light sensor during outdoor activities
          and recorded in Apple Health as cumulative erythemally-weighted irradiance (J/m²). Values
          shown are representative of direct and diffuse solar UV at wrist level; actual skin exposure
          varies with clothing, posture, and surface reflectance. Always consult a dermatologist for
          personalised sun safety advice.
        </p>
      </div>

    </div>
  )
}
