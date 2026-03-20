// Strength Training Science — server component

// ─── Force-Velocity curve data points (SVG path) ──────────────────────────────
// Hyperbolic F-V curve: F = a*(v_max - v) / (v + a/F0) — approximated as discrete points
// x = velocity (0..100%), y = force (0..100%), power = F*V (bell curve peaking ~30% 1RM)
const FV_POINTS = [
  { vPct: 0,  fPct: 100, pPct: 0   },
  { vPct: 10, fPct: 88,  pPct: 25  },
  { vPct: 20, fPct: 74,  pPct: 44  },
  { vPct: 30, fPct: 60,  pPct: 53  }, // power peak zone (~30% 1RM)
  { vPct: 40, fPct: 48,  pPct: 57  }, // power peak at ~30-45%
  { vPct: 50, fPct: 38,  pPct: 56  },
  { vPct: 60, fPct: 28,  pPct: 50  },
  { vPct: 70, fPct: 19,  pPct: 40  },
  { vPct: 80, fPct: 12,  pPct: 28  },
  { vPct: 90, fPct: 5,   pPct: 14  },
  { vPct: 100,fPct: 0,   pPct: 0   },
]

// Build SVG path strings from the points above
const CHART_W = 320
const CHART_H = 160
const PAD_L = 36
const PAD_B = 28
const PLOT_W = CHART_W - PAD_L - 8
const PLOT_H = CHART_H - PAD_B - 8

function px(vPct: number) { return PAD_L + (vPct / 100) * PLOT_W }
function py(yPct: number) { return 8 + (1 - yPct / 100) * PLOT_H }

const fvPath = FV_POINTS.map((p, i) =>
  `${i === 0 ? 'M' : 'L'}${px(p.vPct).toFixed(1)},${py(p.fPct).toFixed(1)}`
).join(' ')

const powerPath = FV_POINTS.map((p, i) =>
  `${i === 0 ? 'M' : 'L'}${px(p.vPct).toFixed(1)},${py(p.pPct).toFixed(1)}`
).join(' ')

// ─── Volume calculator data ────────────────────────────────────────────────────

const MUSCLE_VOLUMES = [
  { muscle: 'Quads',      mev: 8,  mav: 16, mrv: 22, color: '#ef4444' },
  { muscle: 'Hamstrings', mev: 6,  mav: 12, mrv: 20, color: '#f97316' },
  { muscle: 'Chest',      mev: 8,  mav: 14, mrv: 22, color: '#f59e0b' },
  { muscle: 'Back',       mev: 10, mav: 16, mrv: 25, color: '#eab308' },
  { muscle: 'Shoulders',  mev: 8,  mav: 14, mrv: 22, color: '#ef4444' },
  { muscle: 'Biceps',     mev: 6,  mav: 12, mrv: 18, color: '#f97316' },
  { muscle: 'Triceps',    mev: 6,  mav: 12, mrv: 18, color: '#f59e0b' },
  { muscle: 'Calves',     mev: 8,  mav: 20, mrv: 26, color: '#ef4444' },
  { muscle: 'Glutes',     mev: 6,  mav: 12, mrv: 20, color: '#f97316' },
]

// ─── Science cards data ────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    icon: 'M',
    title: 'Muscle Hypertrophy Science',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.10)',
    accentBorder: 'rgba(239,68,68,0.28)',
    facts: [
      {
        citation: 'Schoenfeld 2010',
        text: 'Three mechanisms of hypertrophy: mechanical tension (mTORC1 signalling via titin stretch), metabolic stress (metabolite accumulation, cell swelling), muscle damage (satellite cell activation ~10% contribution). Mechanical tension is the primary driver — the others are modulators.',
        stat: 'Tension = primary driver',
      },
      {
        citation: 'Morton 2016',
        text: 'Loads from 30–80% 1RM produce equivalent hypertrophy when sets are taken to failure. High load >70% 1RM preferentially targets myofibrillar hypertrophy; moderate load promotes greater sarcoplasmic component. 30% 1RM is the lower effective threshold.',
        stat: '30–80% 1RM equivalent',
      },
      {
        citation: 'Krieger 2010',
        text: 'Meta-analysis: multi-set training yields 40% greater hypertrophy than single-set protocols. Optimal weekly volume is 10–20 sets per muscle group. MAV varies by muscle: calves 20–25+ sets, arms 10–14 sets, larger muscles 12–20 sets.',
        stat: 'Multi-set +40% hypertrophy',
      },
      {
        citation: 'Figueiredo 2018 / Atherton 2009',
        text: 'Type I slow-twitch fibers (50–80% of postural muscles) respond best to 15–30 reps. Type II fast-twitch fibers have 2–4× greater hypertrophy potential and respond optimally to 6–12 reps. Concurrent aerobic + strength training blunts hypertrophy 17% via AMPK-mTOR pathway interference.',
        stat: 'Type II: 2–4× potential',
      },
    ],
  },
  {
    icon: 'N',
    title: 'Neural Adaptations & Strength Gains',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.10)',
    accentBorder: 'rgba(168,85,247,0.28)',
    facts: [
      {
        citation: 'Moritani 1979',
        text: 'In the first 4–8 weeks of training, 80–90% of strength gains are neural in origin: improved motor unit recruitment, increased rate coding (firing frequency), better inter-muscular coordination, and reduced antagonist co-activation. This explains rapid beginner strength gains with minimal muscle size change.',
        stat: '80–90% neural first 4–8 wks',
      },
      {
        citation: 'Aagaard 2002',
        text: 'Rate of force development (RFD) — force produced in the first 50–100 ms — is the critical determinant of sports performance (reaction, sprinting, jumping). Neural training increases RFD 15–25%. Heavy slow resistance paradoxically decreases RFD by −10% despite increasing maximal strength.',
        stat: 'Neural RFD +15–25%',
      },
      {
        citation: 'Sale 1988',
        text: 'Untrained individuals recruit only 70–80% of available motor units at maximal effort. Trained athletes can access 90–95%. Recruitment follows Henneman\'s size principle: Type I motor units first, Type II last. Closing this recruitment gap requires maximal-intent neural training.',
        stat: 'Trained: 90–95% MU recruit',
      },
      {
        citation: 'Carroll 2011',
        text: 'Strength transfer to untrained movements is only 15–30%. Transfer is also velocity-specific: training at 3.5 m/s bar speed transfers minimally to 0.5 m/s movements. Sport-specific velocity training is essential — slow strength does not automatically confer fast-movement power.',
        stat: 'Strength transfer only 15–30%',
      },
    ],
  },
  {
    icon: 'P',
    title: 'Power, Explosiveness & Functional Strength',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    facts: [
      {
        citation: 'Wilson 1993',
        text: 'Power = force × velocity; the hyperbolic F-V relationship means no single load maximises both. Peak mechanical power occurs at approximately 30% 1RM. Complex training (heavy strength followed by plyometrics in the same session) exploits post-activation potentiation to produce power output above either method alone.',
        stat: 'Peak power ~30% 1RM',
      },
      {
        citation: 'Suchomel 2016',
        text: 'Force plate metrics most responsive to training: peak force, peak power, and RFD. Countermovement jump (CMJ) height correlates with sprint performance at r = 0.77. Weekly CMJ monitoring can detect accumulated fatigue 2–3 days before subjective symptoms emerge — making it a sensitive readiness marker.',
        stat: 'CMJ–sprint r = 0.77',
      },
      {
        citation: 'McBride 2002',
        text: 'Optimal power loads by exercise: Olympic weightlifting movements 70–90% 1RM, jump squats 0–30% 1RM, bench press throws 30–50% 1RM. All regions of the force-velocity curve must be trained for full power development — no single load or velocity range is sufficient.',
        stat: 'Jump squat power: 0–30% 1RM',
      },
      {
        citation: 'Kraemer 2002 / Stamatakis 2018',
        text: 'Muscle mass peaks at age 25 in men, then declines 3–5%/decade; after 60, loss accelerates to 1–2%/year (sarcopenia). Resistance training is the primary intervention. Stamatakis (2018) found each additional year of regular resistance training reduces all-cause mortality by 15%.',
        stat: '−15% mortality per year of RT',
      },
    ],
  },
  {
    icon: 'R',
    title: 'Recovery, Periodization & Programming',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Schoenfeld 2016',
        text: 'Each muscle group requires 48–72h recovery between stimulating sessions. Training each muscle 2× per week produces 30% greater hypertrophy than 1× per week at matched volume. Full-body 3×/week programming is superior to body-part splits for beginners and intermediates.',
        stat: '2×/week = +30% hypertrophy',
      },
      {
        citation: 'Zourdos 2016 / Helms autoregulation',
        text: 'Training to absolute failure (RIR 0) maximises stimulus but doubles recovery cost. Stopping at RIR 2–3 delivers 85–90% of the hypertrophic stimulus with dramatically lower fatigue. Progressive autoregulation: begin mesocycles at RIR 3–4, advance to RIR 0–1 in peaking weeks.',
        stat: 'RIR 2–3 = 85–90% stimulus',
      },
      {
        citation: 'Rhea 2003',
        text: 'Daily undulating periodization (DUP) outperforms linear in trained individuals: Mon heavy 3×5 (85–90%), Wed moderate 4×8 (70–75%), Fri light 5×15 (55–60%). DUP produced +29% strength gain vs. +14% with linear periodization over 12 weeks in trained subjects.',
        stat: 'DUP +29% vs linear +14%',
      },
      {
        citation: 'Damas 2016',
        text: 'Muscle damage and the repeated bout effect: DOMS peaks at 24–72h post-session. After the initial exposure, subsequent identical sessions cause only 10–50% of original damage. Crucially, DOMS does NOT reliably indicate hypertrophic stimulus — progressive overload (volume, load, density) is the only consistent driver of muscle growth.',
        stat: 'DOMS ≠ hypertrophy proxy',
      },
    ],
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderTop: '3px solid #ef4444',
        borderRadius: 14,
        padding: '18px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 160,
      }}
    >
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: '#ef4444',
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 3px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ScienceCard({
  icon,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  icon: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { citation: string; text: string; stat: string }[]
}) {
  const iconLabels: Record<string, string> = { M: 'MH', N: 'NA', P: 'PW', R: 'RP' }
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
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${accent}22`,
            border: `1px solid ${accent}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: accent,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {iconLabels[icon] ?? icon}
          </span>
        </div>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {facts.map((fact, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: accent,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  marginTop: 1,
                  background: `${accent}18`,
                  border: `1px solid ${accent}35`,
                  borderRadius: 4,
                  padding: '1px 5px',
                }}
              >
                {fact.citation}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: accent,
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  textAlign: 'right',
                }}
              >
                {fact.stat}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>
              {fact.text}
            </p>
            {i < facts.length - 1 && (
              <div style={{ height: 1, background: '#1a1a1a', marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StrengthSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Hero ────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0500 0%, #100808 45%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a1a',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Red glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '30%',
            width: 420,
            height: 420,
            background: 'radial-gradient(circle, rgba(239,68,68,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Orange accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '15%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Icon cluster */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              marginBottom: 22,
            }}
          >
            {[
              { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', label: 'MH' },
              { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', label: 'NA' },
              { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', label: 'PW' },
              { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', label: 'RP' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: i > 0 ? -10 : 0,
                  boxShadow: '0 0 0 2px #0a0a0a',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    color: item.border.replace('0.35', '1'),
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 50px)',
              fontWeight: 900,
              margin: '0 0 14px',
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 45%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Strength Training Science
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#94a3b8',
              margin: '0 auto 20px',
              maxWidth: 580,
              lineHeight: 1.65,
            }}
          >
            The evidence base for resistance training — hypertrophy mechanisms, neural
            adaptations, power development, and evidence-based periodization
          </p>

          {/* Topic tags */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Hypertrophy', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
              { label: 'Neural', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
              { label: 'Power', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
              { label: 'Periodization', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
            ].map((tag) => (
              <span
                key={tag.label}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: tag.color,
                  background: tag.bg,
                  border: `1px solid ${tag.border}`,
                  borderRadius: 20,
                  padding: '5px 14px',
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >

        {/* ── Key stats bar ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatPill
            label="Training Frequency"
            value="2–4×/wk"
            sub="sessions per muscle group"
          />
          <StatPill
            label="Optimal Weekly Volume"
            value="10–20"
            sub="sets per muscle group"
          />
          <StatPill
            label="Hypertrophy Load Range"
            value="30–80%"
            sub="of 1RM when taken to failure"
          />
        </div>

        {/* ── Force-Velocity Curve ───────────────────────────────────────────── */}
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
              background: 'rgba(249,115,22,0.08)',
              borderBottom: '1px solid rgba(249,115,22,0.2)',
              borderLeft: '3px solid #f97316',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#f97316',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                background: 'rgba(249,115,22,0.18)',
                border: '1px solid rgba(249,115,22,0.35)',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              F-V
            </span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Force-Velocity Curve
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Wilson 1993 — hyperbolic relationship; peak power at ~30% 1RM
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 20px 8px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* SVG chart */}
            <div style={{ flex: '0 0 auto' }}>
              <svg
                width={CHART_W}
                height={CHART_H}
                style={{ display: 'block', overflow: 'visible' }}
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <line
                    key={v}
                    x1={PAD_L}
                    y1={py(v)}
                    x2={PAD_L + PLOT_W}
                    y2={py(v)}
                    stroke="#1e1e1e"
                    strokeWidth={1}
                  />
                ))}
                {[0, 25, 50, 75, 100].map((v) => (
                  <line
                    key={v}
                    x1={px(v)}
                    y1={8}
                    x2={px(v)}
                    y2={8 + PLOT_H}
                    stroke="#1e1e1e"
                    strokeWidth={1}
                  />
                ))}

                {/* Power area fill */}
                <path
                  d={`${powerPath} L${px(100)},${py(0)} L${px(0)},${py(0)} Z`}
                  fill="rgba(249,115,22,0.07)"
                />

                {/* Power curve */}
                <path
                  d={powerPath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5,3"
                />

                {/* F-V curve */}
                <path
                  d={fvPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                />

                {/* Peak power marker at ~35% velocity */}
                <circle cx={px(35)} cy={py(57)} r={4} fill="#f97316" />
                <text
                  x={px(35) + 8}
                  y={py(57) - 4}
                  fontSize={9}
                  fill="#f97316"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fontWeight="700"
                >
                  PEAK POWER
                </text>

                {/* Axes */}
                <line x1={PAD_L} y1={8} x2={PAD_L} y2={8 + PLOT_H} stroke="#333" strokeWidth={1.5} />
                <line x1={PAD_L} y1={8 + PLOT_H} x2={PAD_L + PLOT_W} y2={8 + PLOT_H} stroke="#333" strokeWidth={1.5} />

                {/* Y axis label */}
                <text
                  x={10}
                  y={8 + PLOT_H / 2}
                  fontSize={9}
                  fill="#475569"
                  textAnchor="middle"
                  transform={`rotate(-90, 10, ${8 + PLOT_H / 2})`}
                >
                  Force / Power (%)
                </text>

                {/* X axis labels */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <text
                    key={v}
                    x={px(v)}
                    y={8 + PLOT_H + 14}
                    fontSize={8}
                    fill="#475569"
                    textAnchor="middle"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {v}%
                  </text>
                ))}

                {/* X axis title */}
                <text
                  x={PAD_L + PLOT_W / 2}
                  y={CHART_H - 2}
                  fontSize={9}
                  fill="#475569"
                  textAnchor="middle"
                >
                  Velocity (% max)
                </text>

                {/* Y axis tick labels */}
                {[0, 50, 100].map((v) => (
                  <text
                    key={v}
                    x={PAD_L - 5}
                    y={py(v) + 3}
                    fontSize={8}
                    fill="#334155"
                    textAnchor="end"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {v}
                  </text>
                ))}
              </svg>
            </div>

            {/* Legend + key zones */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={28} height={12}>
                    <line x1={0} y1={6} x2={28} y2={6} stroke="#ef4444" strokeWidth={2.5} />
                  </svg>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>Force curve</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={28} height={12}>
                    <line x1={0} y1={6} x2={28} y2={6} stroke="#f97316" strokeWidth={2} strokeDasharray="5,3" />
                  </svg>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>Power curve</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Olympic lifts', zone: '70–90% 1RM', note: 'high force', color: '#ef4444' },
                  { label: 'Jump squats', zone: '0–30% 1RM', note: 'peak power', color: '#f97316' },
                  { label: 'Bench throws', zone: '30–50% 1RM', note: 'moderate', color: '#fbbf24' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: '#0d0d0d',
                      border: '1px solid #1a1a1a',
                      borderLeft: `2px solid ${item.color}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 10, color: item.color, margin: '2px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700 }}>
                      {item.zone}
                    </p>
                    <p style={{ fontSize: 10, color: '#475569', margin: '1px 0 0' }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>
              Training must span all zones of the F-V curve — no single velocity or load trains the full power spectrum. (McBride 2002)
            </p>
          </div>
        </div>

        {/* ── Science cards ──────────────────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#e2e8f0',
              margin: '0 0 16px',
              letterSpacing: '-0.2px',
            }}
          >
            Research Deep-Dive
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: 16,
            }}
          >
            {SCIENCE_CARDS.map((card) => (
              <ScienceCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                accent={card.accent}
                accentBg={card.accentBg}
                accentBorder={card.accentBorder}
                facts={card.facts}
              />
            ))}
          </div>
        </div>

        {/* ── Weekly Volume Calculator ───────────────────────────────────────── */}
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
              background: 'rgba(239,68,68,0.08)',
              borderBottom: '1px solid rgba(239,68,68,0.2)',
              borderLeft: '3px solid #ef4444',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: '#ef4444',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  background: 'rgba(239,68,68,0.18)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                VOL
              </span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                  Optimal Weekly Volume by Muscle
                </h3>
                <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                  MEV = Minimum Effective · MAV = Maximum Adaptive · MRV = Maximum Recoverable
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: '#92400e',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 999,
                padding: '3px 10px',
                fontWeight: 600,
              }}
            >
              Krieger 2010 / Israetel MAV
            </span>
          </div>

          <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Column headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 48px 48px 48px',
                gap: 8,
                paddingBottom: 8,
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Muscle</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Volume range (sets/week)</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MEV</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MAV</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MRV</span>
            </div>

            {MUSCLE_VOLUMES.map((row) => {
              const maxMrv = 26
              const mevX = (row.mev / maxMrv) * 100
              const mavX = (row.mav / maxMrv) * 100
              const mrvX = (row.mrv / maxMrv) * 100

              return (
                <div
                  key={row.muscle}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 48px 48px 48px',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{row.muscle}</span>

                  {/* Bar track */}
                  <div style={{ position: 'relative', height: 12, background: '#0d0d0d', borderRadius: 6, overflow: 'hidden' }}>
                    {/* Full MRV fill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${mrvX}%`,
                        background: `${row.color}22`,
                        borderRadius: 6,
                      }}
                    />
                    {/* MAV fill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${mavX}%`,
                        background: `${row.color}55`,
                        borderRadius: 6,
                      }}
                    />
                    {/* MEV to MAV highlight (optimal zone) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${mevX}%`,
                        top: '20%',
                        height: '60%',
                        width: `${mavX - mevX}%`,
                        background: row.color,
                        borderRadius: 3,
                        boxShadow: `0 0 6px ${row.color}66`,
                      }}
                    />
                    {/* MEV marker */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${mevX}%`,
                        top: 0,
                        height: '100%',
                        width: 1.5,
                        background: '#64748b',
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#64748b',
                      textAlign: 'right',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {row.mev}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#f97316',
                      textAlign: 'right',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {row.mav}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ef4444',
                      textAlign: 'right',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {row.mrv}
                  </span>
                </div>
              )
            })}

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                marginTop: 6,
                paddingTop: 12,
                borderTop: '1px solid #1a1a1a',
                flexWrap: 'wrap',
              }}
            >
              {[
                { color: '#64748b', label: 'MEV — minimum effective volume (where growth begins)' },
                { color: '#f97316', label: 'MAV — sweet spot (best stimulus/fatigue ratio)' },
                { color: '#ef4444', label: 'MRV — upper limit (beyond this: overreaching)' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 10, color: '#475569' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DUP Weekly Schedule ────────────────────────────────────────────── */}
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
              background: 'rgba(59,130,246,0.08)',
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              borderLeft: '3px solid #3b82f6',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#3b82f6',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                background: 'rgba(59,130,246,0.18)',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              DUP
            </span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Daily Undulating Periodization — Weekly Template
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Rhea 2003 — DUP +29% strength vs linear +14% in 12 weeks (trained subjects)
              </p>
            </div>
          </div>

          <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                day: 'Monday',
                tag: 'HEAVY',
                scheme: '3 × 5',
                load: '85–90% 1RM',
                rir: 'RIR 1–2',
                focus: 'Maximal strength — myofibrillar adaptation, neural drive',
                color: '#ef4444',
                tagBg: 'rgba(239,68,68,0.18)',
                tagBorder: 'rgba(239,68,68,0.4)',
              },
              {
                day: 'Wednesday',
                tag: 'MODERATE',
                scheme: '4 × 8',
                load: '70–75% 1RM',
                rir: 'RIR 2–3',
                focus: 'Hypertrophy — mechanical tension + metabolic stress balance',
                color: '#f97316',
                tagBg: 'rgba(249,115,22,0.18)',
                tagBorder: 'rgba(249,115,22,0.4)',
              },
              {
                day: 'Friday',
                tag: 'LIGHT',
                scheme: '5 × 15',
                load: '55–60% 1RM',
                rir: 'RIR 3–4',
                focus: 'Muscular endurance — capillarization, Type I hypertrophy, recovery',
                color: '#3b82f6',
                tagBg: 'rgba(59,130,246,0.18)',
                tagBorder: 'rgba(59,130,246,0.4)',
              },
            ].map((session) => (
              <div
                key={session.day}
                style={{
                  background: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderLeft: `3px solid ${session.color}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
                    {session.day}
                  </p>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: session.color,
                      background: session.tagBg,
                      border: `1px solid ${session.tagBorder}`,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {session.tag}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: session.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      {session.scheme}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#94a3b8',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {session.load}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#64748b',
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {session.rir}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {session.focus}
                  </p>
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: 4,
                padding: '10px 14px',
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.18)',
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: '#93c5fd', margin: 0, lineHeight: 1.5 }}>
                <strong>Autoregulation (Helms model):</strong> Begin the mesocycle at RIR 3–4, progress weekly toward RIR 0–1 in the peaking phase. This preserves stimulus quality while managing cumulative fatigue across the training block.
              </p>
            </div>
          </div>
        </div>

        {/* ── Key concepts footer grid ─────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {[
            {
              label: 'mTORC1',
              desc: 'Mechanistic target of rapamycin complex 1 — primary anabolic signalling hub activated by mechanical tension via titin. Triggers protein synthesis cascade.',
              color: '#ef4444',
            },
            {
              label: 'RIR',
              desc: 'Reps In Reserve — autoregulatory proximity-to-failure metric. RIR 0 = absolute failure. More objective than RPE for load management.',
              color: '#a855f7',
            },
            {
              label: 'AMPK-mTOR',
              desc: 'Concurrent training interference: AMPK (activated by aerobic exercise) inhibits mTOR signalling, blunting hypertrophy by up to 17%. (Atherton 2009)',
              color: '#f97316',
            },
            {
              label: 'Henneman\'s Law',
              desc: 'Size principle of motor unit recruitment: slow Type I recruited first, fast Type II last. High loads or maximal intent are required to recruit high-threshold MUs.',
              color: '#3b82f6',
            },
            {
              label: 'PAP',
              desc: 'Post-activation potentiation — heavy resistance primes CNS for subsequent explosive effort. Foundation of complex training (strength + plyometrics in one session).',
              color: '#f97316',
            },
            {
              label: 'Sarcopenia',
              desc: 'Age-related muscle loss: 3–5%/decade from age 30, accelerating to 1–2%/year after 60. Resistance training is the primary countermeasure. (Kraemer 2002)',
              color: '#ef4444',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: '#111111',
                border: '1px solid #1f1f1f',
                borderRadius: 12,
                padding: '14px 14px',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: item.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '0.03em',
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}35`,
                    borderRadius: 4,
                    padding: '2px 7px',
                  }}
                >
                  {item.label}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
