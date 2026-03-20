'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Scale, TrendingUp, Zap, Info } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_FTP = 242    // Watts
const CURRENT_MASS = 74.2  // kg
const CURRENT_WKG = +(CURRENT_FTP / CURRENT_MASS).toFixed(2) // 3.26

// ─── British Cycling Tiers ────────────────────────────────────────────────────

interface Tier {
  name: string
  min: number
  max: number | null
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  description: string
}

const TIERS: Tier[] = [
  {
    name: 'Pro',
    min: 6.0,
    max: null,
    color: '#a855f7',
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    description: 'World Tour & Grand Tour contenders',
  },
  {
    name: 'Elite',
    min: 5.0,
    max: 6.0,
    color: '#ef4444',
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    description: 'Cat 1–2 / National-level racing',
  },
  {
    name: 'Highly Trained',
    min: 4.0,
    max: 5.0,
    color: '#f97316',
    bgColor: 'bg-orange-500/15',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    description: 'Cat 3 / strong club racer',
  },
  {
    name: 'Trained',
    min: 3.0,
    max: 4.0,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    description: 'Regular rider with structured training',
  },
  {
    name: 'Recreational',
    min: 2.0,
    max: 3.0,
    color: '#22c55e',
    bgColor: 'bg-green-500/15',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    description: 'Active cyclist, occasional events',
  },
  {
    name: 'Beginner',
    min: 1.0,
    max: 2.0,
    color: '#eab308',
    bgColor: 'bg-yellow-500/15',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    description: 'New to structured cycling',
  },
  {
    name: 'Untrained',
    min: 0,
    max: 1.0,
    color: '#6b7280',
    bgColor: 'bg-gray-500/15',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
    description: 'Sedentary / no cycling background',
  },
]

function classifyWkg(wkg: number): Tier {
  for (const tier of TIERS) {
    if (tier.max === null && wkg >= tier.min) return tier
    if (tier.max !== null && wkg >= tier.min && wkg < tier.max) return tier
  }
  return TIERS[TIERS.length - 1]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// 12 months of FTP + mass data — Mar 2025 → Mar 2026
const MONTHLY_DATA = [
  { month: 'Mar 25', ftp: 218, mass: 76.5 },
  { month: 'Apr 25', ftp: 221, mass: 76.1 },
  { month: 'May 25', ftp: 225, mass: 75.8 },
  { month: 'Jun 25', ftp: 228, mass: 75.6 },
  { month: 'Jul 25', ftp: 226, mass: 75.3 },
  { month: 'Aug 25', ftp: 231, mass: 75.0 },
  { month: 'Sep 25', ftp: 234, mass: 74.9 },
  { month: 'Oct 25', ftp: 236, mass: 74.7 },
  { month: 'Nov 25', ftp: 239, mass: 74.5 },
  { month: 'Dec 25', ftp: 237, mass: 74.4 },
  { month: 'Jan 26', ftp: 240, mass: 74.3 },
  { month: 'Feb 26', ftp: 241, mass: 74.2 },
  { month: 'Mar 26', ftp: 242, mass: 74.2 },
]

const TREND_DATA = MONTHLY_DATA.map((d) => ({
  ...d,
  wkg: +(d.ftp / d.mass).toFixed(2),
}))

const CURRENT_TIER = classifyWkg(CURRENT_WKG)

// Tier band: Trained is 3.0–4.0
const TIER_BAND_MIN = 3.0
const TIER_BAND_MAX = 4.0

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PowerToWeightPage() {
  const [simMass, setSimMass] = useState(CURRENT_MASS)
  const simWkg = +(CURRENT_FTP / simMass).toFixed(2)
  const simTier = classifyWkg(simWkg)
  const tierChanged = simTier.name !== CURRENT_TIER.name

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/cycling"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to cycling"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Power-to-Weight Ratio</h1>
            <p className="text-sm text-text-secondary">
              Cycling performance in W/kg — the number that matters on climbs
            </p>
          </div>
          <Scale className="w-5 h-5 text-blue-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero Card ── */}
        <div className="bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-surface rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
                Power-to-Weight
              </p>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-extrabold text-blue-400 tabular-nums leading-none">
                  {CURRENT_WKG}
                </span>
                <span className="text-2xl font-semibold text-text-secondary mb-1">W/kg</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${CURRENT_TIER.bgColor} ${CURRENT_TIER.textColor} border ${CURRENT_TIER.borderColor}`}
                >
                  {CURRENT_TIER.name}
                </span>
                <span className="text-xs text-text-secondary">{CURRENT_TIER.description}</span>
              </div>
            </div>
            <div className="shrink-0 space-y-3">
              <div className="bg-surface/60 rounded-xl px-4 py-3 border border-border text-right">
                <p className="text-xl font-bold text-text-primary tabular-nums">{CURRENT_FTP} W</p>
                <p className="text-xs text-text-secondary">Current FTP</p>
              </div>
              <div className="bg-surface/60 rounded-xl px-4 py-3 border border-border text-right">
                <p className="text-xl font-bold text-text-primary tabular-nums">{CURRENT_MASS} kg</p>
                <p className="text-xs text-text-secondary">Body mass</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-text-primary">
                +{(CURRENT_WKG - TREND_DATA[0].wkg).toFixed(2)} W/kg gained over 12 months
              </span>
              <span className="text-xs text-text-secondary">
                · FTP +{CURRENT_FTP - TREND_DATA[0].ftp} W, mass −{(TREND_DATA[0].mass - CURRENT_MASS).toFixed(1)} kg
              </span>
            </div>
          </div>
        </div>

        {/* ── 12-Month W/kg Trend with Tier Band ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">12-Month W/kg Trend</h2>
          <p className="text-xs text-text-secondary mb-4">
            Monthly W/kg — shaded band shows the Trained tier (3.0–4.0)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={TREND_DATA} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888' }}
                domain={[2.6, 3.8]}
                width={36}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} W/kg`, 'Ratio']}
              />
              {/* Shaded Trained tier band */}
              <ReferenceArea
                y1={TIER_BAND_MIN}
                y2={TIER_BAND_MAX}
                fill="#3b82f6"
                fillOpacity={0.07}
                stroke="#3b82f6"
                strokeOpacity={0.2}
                strokeDasharray="4 3"
              />
              <ReferenceLine
                y={TIER_BAND_MIN}
                stroke="#3b82f6"
                strokeOpacity={0.4}
                strokeDasharray="4 3"
                label={{ value: '3.0 Trained', position: 'insideTopLeft', fontSize: 9, fill: '#3b82f6' }}
              />
              <ReferenceLine
                y={TIER_BAND_MAX}
                stroke="#f97316"
                strokeOpacity={0.4}
                strokeDasharray="4 3"
                label={{ value: '4.0 Highly Trained', position: 'insideTopLeft', fontSize: 9, fill: '#f97316' }}
              />
              <Line
                type="monotone"
                dataKey="wkg"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#60a5fa' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="text-xs text-text-secondary">W/kg ratio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/20 border border-blue-500/40" />
              <span className="text-xs text-text-secondary">Trained tier (3.0–4.0)</span>
            </div>
          </div>
        </div>

        {/* ── British Cycling Tier Table ── */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">British Cycling Classification</h2>
            <p className="text-xs text-text-secondary mt-0.5">W/kg tiers for male cyclists (female tiers ~15% lower)</p>
          </div>
          <div className="divide-y divide-border">
            {TIERS.map((tier) => {
              const isCurrent = tier.name === CURRENT_TIER.name
              return (
                <div
                  key={tier.name}
                  className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                    isCurrent ? `${tier.bgColor}` : ''
                  }`}
                >
                  <div
                    className="w-2 self-stretch rounded-full shrink-0"
                    style={{ background: tier.color, opacity: isCurrent ? 1 : 0.35 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${isCurrent ? tier.textColor : 'text-text-primary'}`}
                      >
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${tier.bgColor} ${tier.textColor} border ${tier.borderColor}`}
                        >
                          You are here
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{tier.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-bold tabular-nums"
                      style={{ color: isCurrent ? tier.color : '#6b7280' }}
                    >
                      {tier.max === null
                        ? `>${tier.min.toFixed(1)}`
                        : tier.min === 0
                        ? `<${tier.max.toFixed(1)}`
                        : `${tier.min.toFixed(1)}–${tier.max.toFixed(1)}`}
                    </p>
                    <p className="text-xs text-text-secondary">W/kg</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Interactive Weight Simulator ── */}
        <WeightSimulator simMass={simMass} setSimMass={setSimMass} simWkg={simWkg} simTier={simTier} tierChanged={tierChanged} />

        {/* ── FTP vs Mass Dual Chart ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">FTP &amp; Body Mass Trend</h2>
          <p className="text-xs text-text-secondary mb-4">
            12-month progression — FTP (left axis) and body mass (right axis)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={MONTHLY_DATA} margin={{ top: 8, right: 44, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              {/* Left Y axis — FTP */}
              <YAxis
                yAxisId="ftp"
                orientation="left"
                tick={{ fontSize: 10, fill: '#f59e0b' }}
                domain={[210, 255]}
                width={38}
                tickFormatter={(v: number) => `${v}W`}
              />
              {/* Right Y axis — mass */}
              <YAxis
                yAxisId="mass"
                orientation="right"
                tick={{ fontSize: 10, fill: '#22c55e' }}
                domain={[73, 78]}
                width={40}
                tickFormatter={(v: number) => `${v}kg`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  name === 'ftp' ? `${value} W` : `${value} kg`,
                  name === 'ftp' ? 'FTP' : 'Mass',
                ]}
              />
              <Line
                yAxisId="ftp"
                type="monotone"
                dataKey="ftp"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fbbf24' }}
              />
              <Line
                yAxisId="mass"
                type="monotone"
                dataKey="mass"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#4ade80' }}
                strokeDasharray="5 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-yellow-500 rounded" />
              <span className="text-xs text-text-secondary">FTP (W)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-green-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#22c55e 0,#22c55e 5px,transparent 5px,transparent 8px)' }} />
              <span className="text-xs text-text-secondary">Body mass (kg)</span>
            </div>
          </div>
        </div>

        {/* ── Science Card ── */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-text-primary">The Science of W/kg</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: 'Why climbs are different',
                color: 'text-blue-400',
                border: 'border-blue-500/30',
                bg: 'bg-blue-500/5',
                body:
                  'On flat roads, aerodynamic drag dominates. On climbs, gravity is the enemy — and gravity doesn\'t care about raw watts, only watts per kilogram. A 60 kg rider at 3.3 W/kg climbs faster than a 90 kg rider at 3.3 W/kg by the same power-to-weight, identical pace.',
              },
              {
                label: 'Apple Watch FTP (iOS 17+)',
                color: 'text-green-400',
                border: 'border-green-500/30',
                bg: 'bg-green-500/5',
                body:
                  'Since watchOS 10 / iOS 17, Apple Watch estimates FTP using heart rate during cycling workouts. It models FTP as the highest sustainable output over ~60 min. Accuracy improves after several outdoor rides with location data. Validate with a 20-min all-out test.',
              },
              {
                label: 'Training vs weight loss',
                color: 'text-orange-400',
                border: 'border-orange-500/30',
                bg: 'bg-orange-500/5',
                body:
                  'Raising FTP 10 W at 74 kg gives +0.13 W/kg. Losing 2 kg at 242 W gives +0.09 W/kg. Training wins in the short term; a combined approach is optimal. Aggressive calorie restriction impairs adaptation — aim for ≤500 kcal daily deficit during build phases.',
              },
              {
                label: 'Seasonal variation',
                color: 'text-purple-400',
                border: 'border-purple-500/30',
                bg: 'bg-purple-500/5',
                body:
                  'W/kg typically dips 5–10% in winter due to reduced volume and slight mass gain. Spring FTP testing baselines should account for this. Body mass often rises Oct–Feb then drops Mar–Jun. Track rolling 8-week W/kg to smooth seasonal noise.',
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-lg p-3 border ${card.border} ${card.bg}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${card.color}`}>
                  {card.label}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

// ─── Weight Simulator (extracted for hooks) ───────────────────────────────────

interface WeightSimulatorProps {
  simMass: number
  setSimMass: (v: number) => void
  simWkg: number
  simTier: Tier
  tierChanged: boolean
}

function WeightSimulator({ simMass, setSimMass, simWkg, simTier, tierChanged }: WeightSimulatorProps) {
  // Build slider data: every 0.5 kg step from 60–90
  const steps = Array.from({ length: 61 }, (_, i) => {
    const mass = +(60 + i * 0.5).toFixed(1)
    const wkg = +(CURRENT_FTP / mass).toFixed(2)
    return { mass, wkg, tier: classifyWkg(wkg) }
  })

  // Find tier transition messages
  function tierMessage(): string {
    if (simMass === CURRENT_MASS) return `Currently ${CURRENT_WKG} W/kg — move the slider to simulate`
    const delta = simWkg - CURRENT_WKG
    const sign = delta > 0 ? '+' : ''
    const msg = `At ${simMass} kg → ${simWkg} W/kg (${sign}${delta.toFixed(2)} W/kg)`
    if (tierChanged) {
      return `${msg} · tier changes to ${simTier.name}`
    }
    return msg
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-text-primary">Weight Simulator</h2>
        <span className="text-xs text-text-secondary">at current FTP ({CURRENT_FTP} W)</span>
      </div>

      {/* Current vs simulated */}
      <div className="flex gap-3">
        <div className="flex-1 bg-surface-secondary rounded-lg p-3 border border-border text-center">
          <p className="text-2xl font-extrabold text-text-primary tabular-nums">{CURRENT_WKG}</p>
          <p className="text-xs text-text-secondary">Current W/kg</p>
          <p className="text-xs font-semibold text-blue-400 mt-0.5">{CURRENT_MASS} kg</p>
        </div>
        <div className="flex items-center text-text-secondary text-lg font-light">→</div>
        <div
          className={`flex-1 rounded-lg p-3 border text-center transition-all ${
            tierChanged
              ? `${simTier.bgColor} ${simTier.borderColor}`
              : 'bg-surface-secondary border-border'
          }`}
        >
          <p
            className="text-2xl font-extrabold tabular-nums"
            style={{ color: tierChanged ? simTier.color : undefined }}
          >
            {simWkg}
          </p>
          <p className="text-xs text-text-secondary">Simulated W/kg</p>
          <p
            className={`text-xs font-semibold mt-0.5 ${tierChanged ? simTier.textColor : 'text-text-secondary'}`}
          >
            {simMass} kg · {simTier.name}
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>60 kg</span>
          <span className="font-semibold text-text-primary">{simMass} kg</span>
          <span>90 kg</span>
        </div>
        <input
          type="range"
          min={60}
          max={90}
          step={0.1}
          value={simMass}
          onChange={(e) => setSimMass(+parseFloat(e.target.value).toFixed(1))}
          className="w-full accent-blue-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{+(CURRENT_FTP / 60).toFixed(2)} W/kg</span>
          <span>{+(CURRENT_FTP / 75).toFixed(2)} W/kg</span>
          <span>{+(CURRENT_FTP / 90).toFixed(2)} W/kg</span>
        </div>
      </div>

      {/* Insight message */}
      <div
        className={`rounded-lg px-3 py-2.5 border text-xs leading-relaxed ${
          tierChanged
            ? `${simTier.bgColor} ${simTier.borderColor} ${simTier.textColor}`
            : 'bg-surface-secondary border-border text-text-secondary'
        }`}
      >
        {tierMessage()}
      </div>

      {/* Mini tier transition chart */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-text-secondary">W/kg at current FTP — by body weight</p>
        <div className="flex h-6 rounded overflow-hidden">
          {steps.filter((_, i) => i % 2 === 0).map((s) => (
            <div
              key={s.mass}
              className="flex-1 relative"
              style={{ background: s.tier.color, opacity: Math.abs(s.mass - simMass) < 0.6 ? 1 : 0.35 }}
              title={`${s.mass} kg → ${s.wkg} W/kg (${s.tier.name})`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-text-secondary">
          <span>60 kg · {+(CURRENT_FTP / 60).toFixed(1)} W/kg</span>
          <span>75 kg · {+(CURRENT_FTP / 75).toFixed(1)} W/kg</span>
          <span>90 kg · {+(CURRENT_FTP / 90).toFixed(1)} W/kg</span>
        </div>
        {/* Tier color legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {TIERS.slice().reverse().map((t) => (
            <div key={t.name} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
              <span className="text-xs text-text-secondary">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
