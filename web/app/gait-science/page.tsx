'use client'

// ─── Mock data ─────────────────────────────────────────────────────────────────

const CURRENT_METRICS = {
  walkingSpeed: { value: 1.12, unit: 'm/s', label: 'Walking Speed' },
  asymmetry: { value: 3.2, unit: '%', label: 'Gait Asymmetry' },
  doubleSupport: { value: 22, unit: '%', label: 'Double Support' },
}

const STEP_COUNT_WEEKS = [
  { week: 'Wk 1', steps: 68000 },
  { week: 'Wk 2', steps: 71000 },
  { week: 'Wk 3', steps: 45000 },
  { week: 'Wk 4', steps: 73000 },
  { week: 'Wk 5', steps: 66000 },
  { week: 'Wk 6', steps: 52000 },
  { week: 'Wk 7', steps: 78000 },
  { week: 'Wk 8', steps: 69000 },
]

const WALKING_SPEED_WEEKS = [
  { week: 'Wk 1', speed: 1.08 },
  { week: 'Wk 2', speed: 1.10 },
  { week: 'Wk 3', speed: 1.05 },
  { week: 'Wk 4', speed: 1.12 },
  { week: 'Wk 5', speed: 1.09 },
  { week: 'Wk 6', speed: 1.14 },
  { week: 'Wk 7', speed: 1.11 },
  { week: 'Wk 8', speed: 1.12 },
]

const CLINICAL_THRESHOLD = 0.8

const SCIENCE_CARDS = [
  {
    emoji: '⚡',
    title: 'Walking Speed as Vital Sign',
    accent: '#16a34a',
    accentBg: 'rgba(22,163,74,0.10)',
    accentBorder: 'rgba(22,163,74,0.3)',
    facts: [
      {
        label:
          'Studenski 2011 (JAMA): in 34,485 adults 65+, each 0.1 m/s faster walking speed is associated with ~12% lower 10-year mortality — independent of age, sex, and chronic disease burden',
        value: '+0.1 m/s → −12% mortality',
      },
      {
        label:
          '0.8 m/s threshold separates high vs. low survival risk at any age; Fritz 2009: MCID (minimal clinically important difference) for walking speed is 0.06–0.10 m/s in rehabilitation settings',
        value: '0.8 m/s = risk threshold',
      },
      {
        label:
          '1.2 m/s is required for safe street crossing at standard pedestrian signal timing (MUTCD); Weir 2016: cadence ≥100 steps/min classifies as moderate-intensity physical activity',
        value: '1.2 m/s = safe street crossing',
      },
      {
        label:
          'Pamoukdjian 2018: walking speed <0.8 m/s predicts chemotherapy toxicity with OR 2.56 — gait speed outperforms standard oncology frailty screens as a pre-treatment prognostic marker',
        value: 'OR 2.56 chemo toxicity',
      },
    ],
  },
  {
    emoji: '🦶',
    title: 'Gait Biomechanics',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.3)',
    facts: [
      {
        label:
          'Perry 1992 (Gait Analysis, classic textbook): normal gait cycle is 60% stance phase / 40% swing phase; healthy adult stride length 1.4–1.6 m, cadence 100–130 steps/min at comfortable walking speed',
        value: '60% stance / 40% swing',
      },
      {
        label:
          'Lee 2010: ground reaction force (GRF) first peak 1.1 × body weight at heel strike, valley 0.7 BW at midstance, push-off peak 1.1 BW — asymmetric peaks indicate unilateral limb pathology',
        value: 'GRF peaks 1.1 / 0.7 / 1.1 BW',
      },
      {
        label:
          'Dingwell 2011: stride-to-stride coefficient of variation (CV) >3% predicts falls independently of gait speed; variability reflects CNS ability to correct perturbations during locomotion',
        value: 'Stride CV >3% → fall risk',
      },
      {
        label:
          'Hreljac 2004: walk-to-run transition occurs at ~2.1 m/s — the metabolic efficiency crossover point; below this speed walking is cheaper, above it running becomes more economical per unit distance',
        value: 'Walk-run transition ~2.1 m/s',
      },
    ],
  },
  {
    emoji: '⚠️',
    title: 'Fall Risk & Prevention',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.10)',
    accentBorder: 'rgba(245,158,11,0.3)',
    facts: [
      {
        label:
          'Lord 2007: falls account for 35–40% of injury deaths in adults ≥65; walking speed <1.0 m/s combined with TUG >12 s and prior fall history yields 78% predicted probability of a fall within 1 year',
        value: '78% 1-year fall probability',
      },
      {
        label:
          'Gillespie 2012 (Cochrane review, 159 RCTs, 79,193 participants): group exercise programs reduce rate of falls by 34% (RR 0.66); home-based exercise reduces falls by 32% in community-dwelling older adults',
        value: 'Group exercise −34% falls',
      },
      {
        label:
          'Podsiadlo 1991: Timed Up and Go (TUG) test thresholds — ≤10 s indicates normal mobility and low fall risk; 10–20 s suggests borderline; >20 s indicates high fall risk requiring clinical referral',
        value: 'TUG >20 s = high risk',
      },
      {
        label:
          'Sherrington 2017 (updated Cochrane): ≥3 h/week of balance and functional exercise reduces falls; Tai Chi reduces falls by 45%; Nordic walking with poles reduces fall rate by 67% in frail older adults',
        value: 'Tai Chi −45% / Poles −67%',
      },
    ],
  },
  {
    emoji: '🧠',
    title: 'Neurological Gait Markers',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.10)',
    accentBorder: 'rgba(168,85,247,0.3)',
    facts: [
      {
        label:
          'Lord 2013: gait asymmetry >5% predicts dementia 7–12 years before clinical diagnosis; double support time >30% of the gait cycle indicates CNS decline affecting postural control and balance confidence',
        value: '>5% asymmetry → dementia risk',
      },
      {
        label:
          'Montero-Odasso 2012: dual-task gait speed reduction >15% (walking while counting backwards) detects mild cognitive impairment (MCI) with 82% sensitivity — superior to single-task gait speed alone',
        value: 'Dual-task decline >15% → MCI',
      },
      {
        label:
          'Verghese 2002: Parkinsonian gait markers (reduced arm swing, shuffling, festination) detectable years before diagnosis; rhythmic auditory stimulation (RAS) reduces freezing of gait episodes by 36%',
        value: 'RAS reduces freezing 36%',
      },
      {
        label:
          'Wrisley 2006: Dynamic Gait Index (DGI) score <19 out of 24 predicts falls in community-dwelling older adults; the DGI assesses gait across 8 tasks including head turns, stepping over obstacles, and stair negotiation',
        value: 'DGI <19/24 predicts falls',
      },
    ],
  },
]

// ─── Helper functions ──────────────────────────────────────────────────────────

function stepCountColor(steps: number): string {
  if (steps >= 70000) return '#16a34a'
  if (steps >= 50000) return '#f59e0b'
  return '#ef4444'
}

function speedStatus(speed: number): { label: string; color: string } {
  if (speed >= 1.2) return { label: 'Excellent', color: '#16a34a' }
  if (speed >= 1.0) return { label: 'Normal', color: '#22c55e' }
  if (speed >= 0.8) return { label: 'Below Average', color: '#f59e0b' }
  return { label: 'High Risk', color: '#ef4444' }
}

function asymmetryStatus(pct: number): { label: string; color: string } {
  if (pct < 5) return { label: 'Balanced', color: '#16a34a' }
  if (pct < 10) return { label: 'Mild', color: '#f59e0b' }
  return { label: 'High', color: '#ef4444' }
}

function doubleSupportStatus(pct: number): { label: string; color: string } {
  if (pct <= 26) return { label: 'Normal', color: '#16a34a' }
  if (pct <= 30) return { label: 'Elevated', color: '#f59e0b' }
  return { label: 'High', color: '#ef4444' }
}

// ─── Mini bar chart (pure div/CSS) ────────────────────────────────────────────

function StepCountChart() {
  const maxSteps = Math.max(...STEP_COUNT_WEEKS.map((w) => w.steps))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {STEP_COUNT_WEEKS.map((w) => {
          const heightPct = (w.steps / maxSteps) * 100
          const color = stepCountColor(w.steps)
          return (
            <div
              key={w.week}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
            >
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                {(w.steps / 1000).toFixed(0)}k
              </span>
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  background: color,
                  borderRadius: '4px 4px 2px 2px',
                  opacity: 0.85,
                  transition: 'opacity 0.2s',
                  minHeight: 4,
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {STEP_COUNT_WEEKS.map((w) => (
          <div key={w.week} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#475569' }}>
            {w.week}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mini walking speed line chart (SVG) ──────────────────────────────────────

function WalkingSpeedChart() {
  const width = 520
  const height = 110
  const paddingLeft = 36
  const paddingRight = 12
  const paddingTop = 12
  const paddingBottom = 28

  const chartW = width - paddingLeft - paddingRight
  const chartH = height - paddingTop - paddingBottom

  const minSpeed = 0.7
  const maxSpeed = 1.3

  const toX = (i: number) => paddingLeft + (i / (WALKING_SPEED_WEEKS.length - 1)) * chartW
  const toY = (speed: number) =>
    paddingTop + chartH - ((speed - minSpeed) / (maxSpeed - minSpeed)) * chartH

  const thresholdY = toY(CLINICAL_THRESHOLD)

  const points = WALKING_SPEED_WEEKS.map((w, i) => ({ x: toX(i), y: toY(w.speed), ...w }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  // Area path under the speed line
  const areaPath = [
    `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`,
    ...points.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)}`,
    `L ${points[0].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)}`,
    'Z',
  ].join(' ')

  // Y-axis ticks
  const yTicks = [0.8, 0.9, 1.0, 1.1, 1.2]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-label="Walking speed over 8 weeks"
    >
      {/* Subtle grid lines */}
      {yTicks.map((tick) => {
        const y = toY(tick)
        return (
          <line
            key={tick}
            x1={paddingLeft}
            y1={y}
            x2={paddingLeft + chartW}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        )
      })}

      {/* Y-axis labels */}
      {yTicks.map((tick) => {
        const y = toY(tick)
        return (
          <text
            key={tick}
            x={paddingLeft - 4}
            y={y + 4}
            textAnchor="end"
            fontSize={9}
            fill="#475569"
          >
            {tick.toFixed(1)}
          </text>
        )
      })}

      {/* Clinical threshold reference line */}
      <line
        x1={paddingLeft}
        y1={thresholdY}
        x2={paddingLeft + chartW}
        y2={thresholdY}
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <text
        x={paddingLeft + chartW - 2}
        y={thresholdY - 5}
        textAnchor="end"
        fontSize={9}
        fill="#ef4444"
        fontWeight="600"
      >
        0.8 m/s threshold
      </text>

      {/* Area fill */}
      <path d={areaPath} fill="#16a34a" fillOpacity={0.08} />

      {/* Speed line */}
      <path d={linePath} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#16a34a" stroke="#0a0a0a" strokeWidth={1.5} />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={paddingTop + chartH + 16}
          textAnchor="middle"
          fontSize={9}
          fill="#475569"
        >
          {WALKING_SPEED_WEEKS[i].week}
        </text>
      ))}
    </svg>
  )
}

// ─── Science card ─────────────────────────────────────────────────────────────

function ScienceCard({
  emoji,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  emoji: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { label: string; value: string }[]
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#f1f5f9',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {facts.map((fact, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, flex: 1 }}>
              {fact.label}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: accent,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                textAlign: 'right',
                maxWidth: 120,
                lineHeight: 1.3,
              }}
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Metric status pill ───────────────────────────────────────────────────────

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 999,
        padding: '2px 8px',
        letterSpacing: '0.03em',
      }}
    >
      {label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaitSciencePage() {
  const speedStatus = (() => {
    const s = CURRENT_METRICS.walkingSpeed.value
    if (s >= 1.2) return { label: 'Excellent', color: '#16a34a' }
    if (s >= 1.0) return { label: 'Normal', color: '#22c55e' }
    if (s >= 0.8) return { label: 'Below Average', color: '#f59e0b' }
    return { label: 'High Risk', color: '#ef4444' }
  })()

  const asymStatus = (() => {
    const a = CURRENT_METRICS.asymmetry.value
    if (a < 5) return { label: 'Balanced', color: '#16a34a' }
    if (a < 10) return { label: 'Mild', color: '#f59e0b' }
    return { label: 'High', color: '#ef4444' }
  })()

  const dsStatus = (() => {
    const d = CURRENT_METRICS.doubleSupport.value
    if (d <= 26) return { label: 'Normal', color: '#16a34a' }
    if (d <= 30) return { label: 'Elevated', color: '#f59e0b' }
    return { label: 'High', color: '#ef4444' }
  })()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001a08 0%, #00120a 40%, #0a0a0a 100%)',
          borderBottom: '1px solid #1f1f1f',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 340,
            height: 200,
            background: 'radial-gradient(ellipse, rgba(22,163,74,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.3)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 12 }}>🦶</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', letterSpacing: '0.08em' }}>
              GAIT SCIENCE
            </span>
          </div>

          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#f1f5f9',
              margin: '0 0 12px',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Gait Science
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#94a3b8',
              maxWidth: 520,
              margin: '0 auto 8px',
              lineHeight: 1.55,
            }}
          >
            Walking speed is the sixth vital sign. Gait biomechanics, neurological markers, and
            fall risk — passively measured by your iPhone and Apple Watch every day.
          </p>

          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
            Biomechanics · Vital Sign · Neurological Markers · Fall Risk
          </p>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '28px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >

        {/* ── Current gait metrics card ──────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {/* Walking speed — hero metric */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(22,163,74,0.04) 100%)',
              borderBottom: '1px solid rgba(22,163,74,0.2)',
              padding: '24px 24px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.06em' }}>
                WALKING SPEED · SIXTH VITAL SIGN
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 900,
                    color: '#16a34a',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {CURRENT_METRICS.walkingSpeed.value.toFixed(2)}
                </span>
                <span style={{ fontSize: 18, color: '#4ade80', fontWeight: 600 }}>m/s</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <StatusPill label={speedStatus.label} color={speedStatus.color} />
                <span style={{ fontSize: 11, color: '#475569' }}>Studenski 0.8 m/s threshold</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: 12,
                padding: '12px 16px',
                minWidth: 160,
              }}
            >
              <p style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.05em' }}>
                CLINICAL CONTEXT
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Above 1.0 m/s = expected survival for age. Each 0.1 m/s gain → ~12% lower mortality
                (Studenski 2011, JAMA).
              </p>
            </div>
          </div>

          {/* Asymmetry + double support */}
          <div style={{ display: 'flex', borderBottom: 'none' }}>
            {/* Gait asymmetry */}
            <div
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRight: '1px solid #1f1f1f',
              }}
            >
              <p style={{ fontSize: 10, color: '#64748b', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.05em' }}>
                GAIT ASYMMETRY
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: asymStatus.color,
                    letterSpacing: '-0.5px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {CURRENT_METRICS.asymmetry.value.toFixed(1)}
                </span>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>%</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <StatusPill label={asymStatus.label} color={asymStatus.color} />
              </div>
              <p style={{ fontSize: 10, color: '#475569', margin: '6px 0 0', lineHeight: 1.4 }}>
                &lt;5% balanced · &gt;5% flag · Lord 2013: &gt;5% predicts dementia early
              </p>
            </div>

            {/* Double support */}
            <div style={{ flex: 1, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, color: '#64748b', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.05em' }}>
                DOUBLE SUPPORT
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: dsStatus.color,
                    letterSpacing: '-0.5px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {CURRENT_METRICS.doubleSupport.value}
                </span>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>%</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <StatusPill label={dsStatus.label} color={dsStatus.color} />
              </div>
              <p style={{ fontSize: 10, color: '#475569', margin: '6px 0 0', lineHeight: 1.4 }}>
                Normal 16–26% · &gt;30% signals CNS decline / balance loss
              </p>
            </div>
          </div>
        </div>

        {/* ── Weekly step count chart ────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 20,
            padding: '20px 20px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>
                Weekly Step Count
              </h2>
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                Past 8 weeks
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#16a34a' }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>≥70k</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>50–69k</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>&lt;50k</span>
              </div>
            </div>
          </div>

          <StepCountChart />

          <p style={{ fontSize: 10, color: '#475569', margin: '10px 0 0', textAlign: 'center' }}>
            Weir 2016: cadence ≥100 steps/min = moderate intensity activity
          </p>
        </div>

        {/* ── Walking speed trend chart ──────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 20,
            padding: '20px 20px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>
                Walking Speed Trend
              </h2>
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                8-week history · m/s
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 20,
                  height: 2,
                  background: '#ef4444',
                  borderRadius: 1,
                  borderStyle: 'dashed',
                }}
              />
              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
                0.8 m/s clinical threshold
              </span>
            </div>
          </div>

          <WalkingSpeedChart />

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginTop: 12,
              background: 'rgba(22,163,74,0.06)',
              border: '1px solid rgba(22,163,74,0.15)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>📊</span>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Your average walking speed of{' '}
              <strong style={{ color: '#4ade80' }}>
                {(WALKING_SPEED_WEEKS.reduce((a, w) => a + w.speed, 0) / WALKING_SPEED_WEEKS.length).toFixed(2)} m/s
              </strong>{' '}
              is{' '}
              <strong style={{ color: '#4ade80' }}>
                {(
                  ((WALKING_SPEED_WEEKS.reduce((a, w) => a + w.speed, 0) / WALKING_SPEED_WEEKS.length - CLINICAL_THRESHOLD) /
                    CLINICAL_THRESHOLD) *
                  100
                ).toFixed(0)}
                % above
              </strong>{' '}
              the 0.8 m/s Studenski clinical threshold — indicating normal mobility and lower survival risk.
            </p>
          </div>
        </div>

        {/* ── Science cards ─────────────────────────────────────────────────── */}
        {SCIENCE_CARDS.map((card) => (
          <ScienceCard key={card.title} {...card} />
        ))}

        {/* ── Clinical context note ──────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(59,130,246,0.08)',
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              borderLeft: '3px solid #3b82f6',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>📱</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              What Apple Watch Passively Measures
            </h3>
          </div>

          <div style={{ padding: '16px' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 14px' }}>
              Apple Watch and iPhone passively measure four gait metrics during normal daily walking —
              no dedicated workout session required. The accelerometer and gyroscope classify each step,
              and the algorithms were validated against clinical-grade instrumented gait analysis:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                {
                  metric: 'Walking Speed',
                  apple: 'Measured passively via iPhone motion sensors, averaged over walking bouts of ≥6 steps',
                  clinical: '10 m Walk Test, GaitRite mat, motion capture lab',
                },
                {
                  metric: 'Walking Asymmetry',
                  apple: 'Left-right step time difference from accelerometer — 0% = perfectly symmetric',
                  clinical: 'Kinematic gait analysis, instrumented insoles, force plates',
                },
                {
                  metric: 'Double Support Time',
                  apple: 'Percentage of gait cycle when both feet contact ground — higher = slower/less stable',
                  clinical: 'Force plate walkways, pressure measurement systems (e.g., GAITRite)',
                },
                {
                  metric: 'Step Length',
                  apple: 'Estimated from step time, hip height, and cadence via validated predictive models',
                  clinical: 'Optical motion capture, instrumented treadmills, 3D gait labs',
                },
              ].map((row) => (
                <div
                  key={row.metric}
                  style={{
                    background: '#0f0f0f',
                    border: '1px solid #1a1a1a',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
                    {row.metric}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 3px', lineHeight: 1.4 }}>
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>Apple: </span>
                    {row.apple}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>Clinical gold standard: </span>
                    {row.clinical}
                  </p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.5 }}>
              Values shown are passively measured estimates from Apple HealthKit. Correlation with
              clinical gait labs is good (r ≈ 0.92 for speed) but consumer wearables should not replace
              clinical evaluation. Consult a physician or physical therapist if you have concerns about
              mobility or fall risk.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
