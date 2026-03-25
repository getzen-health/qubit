// Lactate Threshold Science — static server component
// "The Threshold" — Clinical precision meets athletic intensity.
// Evidence-based deep-dive into LT1, LT2, zone physiology, measurement, and training.

export const metadata = { title: 'Lactate Threshold Science' }

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0c0e14',
  card: '#131720',
  teal: '#2a9d8f',
  tealDim: 'rgba(42,157,143,0.15)',
  tealBorder: 'rgba(42,157,143,0.3)',
  amber: '#f4a261',
  amberDim: 'rgba(244,162,97,0.15)',
  amberBorder: 'rgba(244,162,97,0.3)',
  red: '#e63946',
  redDim: 'rgba(230,57,70,0.15)',
  redBorder: 'rgba(230,57,70,0.3)',
  text: '#f0f2f7',
  textSub: '#8892a4',
  textMuted: '#3d4558',
  border: '#1c2133',
  mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', ui-monospace, monospace",
  serif: "'Crimson Pro', 'Georgia', serif",
  display: "'Fraunces', 'Playfair Display', Georgia, serif",
} as const

// ─── Hero stats ───────────────────────────────────────────────────────────────

const HERO_STATS = [
  {
    label: 'LT1',
    value: '~77%',
    unit: 'HRmax',
    desc: 'Aerobic threshold — the all-day intensity. First lactate accumulation above rest (~2 mmol/L).',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
  },
  {
    label: 'LT2',
    value: '~89%',
    unit: 'HRmax',
    desc: 'Anaerobic threshold — race-pace foundation. MLSS: clearance cannot match production (~4 mmol/L).',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
  },
  {
    label: '91%',
    value: '91%',
    unit: 'variance',
    desc: 'Of marathon finishing time explained by LT2 pace — stronger than VO₂max (81%). Faude 2009 Sports Med.',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    isPercent: true,
  },
] as const

// ─── Zone map data ────────────────────────────────────────────────────────────

const ZONES = [
  {
    id: 'z1',
    num: '01',
    name: 'ZONE 1',
    tag: 'AEROBIC BASE',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    hrRange: '<77% HRmax',
    lactate: '0.8–2.0 mmol/L',
    rpe: 'RPE 9–12',
    substrate: 'Fat oxidation dominant',
    tagline: '"Mitochondrial factory mode"',
    desc: 'Builds your aerobic engine at the cellular level. Mitochondrial biogenesis, capillary density, fat oxidation enzymes. This is where champions are quietly made over years.',
    prescription: '75–80% of all training',
    prescriptionColor: C.teal,
    widthPct: '40%',
  },
  {
    id: 'z2',
    num: '02',
    name: 'ZONE 2',
    tag: 'THRESHOLD',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    hrRange: '77–89% HRmax',
    lactate: '2–4 mmol/L',
    rpe: 'RPE 13–15',
    substrate: 'Mixed fat & carbohydrate',
    tagline: '"Comfortably hard"',
    desc: 'Threshold adaptations — specific stimuli that directly raise your LT2 pace. Most road races from 5K to marathon are contested here. The danger zone: too easy to be hard, too hard to recover from.',
    prescription: '5–25% of training',
    prescriptionColor: C.amber,
    widthPct: '35%',
  },
  {
    id: 'z3',
    num: '03',
    name: 'ZONE 3',
    tag: 'VO₂MAX',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    hrRange: '>89% HRmax',
    lactate: '>4–6 mmol/L',
    rpe: 'RPE 16–20',
    substrate: 'Carbohydrate dominant',
    tagline: '"VO₂max ceiling-raiser"',
    desc: 'Sustainable only 15–60 minutes at maximum. Pushes the VO₂max ceiling up — the engine size that limits how fast your threshold can be. Use strategically, recover fully.',
    prescription: '15–20% of training',
    prescriptionColor: C.red,
    widthPct: '25%',
  },
] as const

// ─── Physiology cards ─────────────────────────────────────────────────────────

const PHYSIOLOGY_CARDS = [
  {
    id: 'lactate-fuel',
    icon: '⬡',
    title: 'Lactate Is Not the Enemy',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    citations: ['Wasserman 1964 (J Appl Physiol)', 'Beaver 1986 (J Appl Physiol)'],
    body: 'Lactate is not metabolic waste — it is a fuel. The monocarboxylate transporter (MCT) shuttle moves lactate from fast-twitch fibres to slow-twitch fibres and the heart, where it is oxidised preferentially as fuel. LT1 marks the first detectable accumulation above rest (~2 mmol/L): production just exceeds the resting clearance rate. LT2 is the Maximal Lactate Steady State (MLSS) — the highest intensity at which clearance can still match production, classically near 4 mmol/L. Above LT2, lactate accumulates exponentially, driving acidosis and fatigue.',
    stat: 'LT1 ≈ 2 mmol/L | LT2 ≈ 4 mmol/L (MLSS)',
  },
  {
    id: 'performance-equation',
    icon: '≡',
    title: 'The Performance Equation',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    citations: ['Faude 2009 (Sports Med)', 'Jones 2010 (J Exerc Sci Fit)'],
    body: 'LT2 explains 91% of marathon finishing time variance — outperforming VO₂max (81%) as a race predictor. LT2 pace maps directly to half-marathon to marathon race pace. Critical Speed (CS), the mathematical equivalent of LT2 defined by Jones (2010), can be estimated from two time trials without lab equipment: CS = (D2 − D1) / (T2 − T1), where D and T are distances and times. CS represents the asymptote of the speed-duration relationship and is physiologically indistinguishable from MLSS in trained athletes.',
    stat: 'LT2 → 91% marathon variance; VO₂max → 81% (Faude 2009)',
  },
  {
    id: 'race-pacing',
    icon: '→',
    title: 'Race Pacing Translation',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    citations: ['Billat 2003 (J Sports Sci)', 'Daniels 2005 (Running Formula)'],
    body: 'LT2 pace is the single most useful training anchor for race prediction. Knowing your LT2 pace unlocks precise race pace targets across all distances. The ratios below represent the sustainable fraction of LT2 intensity sustainable for each race duration.',
    stat: 'LT2 pace = your most trainable performance lever',
    paceRows: [
      { dist: '5K', ratio: '95–105%', label: 'of LT2 pace', accent: C.red },
      { dist: '10K', ratio: '98–102%', label: 'of LT2 pace', accent: C.red },
      { dist: 'Half', ratio: '96–99%', label: 'of LT2 pace', accent: C.amber },
      { dist: 'Marathon', ratio: '90–95%', label: 'of LT2 pace', accent: C.amber },
      { dist: 'Ultra', ratio: 'LT1 pace', label: 'aerobic threshold', accent: C.teal },
    ],
  },
  {
    id: 'masters',
    icon: '◈',
    title: 'Masters Athletes & Aging',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    citations: ['Wilson 2000 (Med Sci Sports Exerc)', 'Tanaka 1997 (J Am Coll Cardiol)'],
    body: 'LT2 as a percentage of VO₂max remains remarkably stable across age — a trained 65-year-old holds LT2 at 85–88% VO₂max, similar to a trained 30-year-old. Absolute LT2 pace declines ~1%/year after 40 due to VO₂max reduction, but relative threshold is preserved. Crucially, threshold training is equally effective for improving LT2 at age 60+ as at 30 (Tanaka 1997): the metabolic adaptation machinery does not age out. Resistance training preserves running economy and thereby maintains LT2 pace expression in masters athletes.',
    stat: 'LT2 %VO₂max stable with age; threshold training effective at 60+ (Tanaka 1997)',
  },
] as const

// ─── Measurement tiers ────────────────────────────────────────────────────────

const MEASUREMENT_TIERS = [
  {
    tier: 'GOLD STANDARD',
    medal: '01',
    method: 'Lab Blood Lactate Test',
    citation: 'Heck 1985 (Eur J Appl Physiol)',
    accent: '#f4d03f',
    dim: 'rgba(244,208,63,0.1)',
    border: 'rgba(244,208,63,0.28)',
    accuracy: 'CV 3.5% | ICC >0.95',
    cost: '$200–500',
    details: [
      'Incremental treadmill: 3–5 min stages, 0.5 km/h increments',
      'Fingertip blood samples: 25–50 μL per stage',
      'MLSS validation: 30-min constant-intensity protocol',
      'Full lactate curve: pinpoints both LT1 and LT2 precisely',
    ],
  },
  {
    tier: 'FIELD TEST',
    medal: '02',
    method: '30-Min Time Trial + Talk Test',
    citation: 'Thomas 2008 (J Strength Cond Res) | Foster 2008 (Int J Sports Physiol Perf)',
    accent: '#94a3b8',
    dim: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.22)',
    accuracy: 'Within 3 bpm of lab LT2',
    cost: 'Free',
    details: [
      '30-min all-out time trial: average HR over final 20 min ≈ LT2 HR (±3 bpm)',
      'Talk test: LT1 = when sustaining speech becomes difficult (92% sensitivity)',
      'Critical Speed field test: two time trials at different distances',
      'Requires honest maximal effort — common error is under-pacing',
    ],
  },
  {
    tier: 'HRV METHOD',
    medal: '03',
    method: 'DFA-α1 Real-Time HRV',
    citation: 'Buchheit 2007 (Eur J Appl Physiol) | Rogers 2021 (Sports Med)',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    accuracy: '±4 bpm accuracy (Rogers 2021)',
    cost: 'Polar H10 + HRV Logger',
    details: [
      'α1 > 0.75 = below LT1 (safe Zone 1 territory)',
      'α1 0.50–0.75 = LT1–LT2 threshold zone',
      'α1 < 0.50 = above LT2 (Zone 3 — VO₂max territory)',
      'Real-time feedback during exercise — no lab required',
    ],
  },
  {
    tier: 'WEARABLE ESTIMATE',
    medal: '04',
    method: 'Apple Watch / Garmin',
    citation: 'Algorithm-based — calibrated against population lab data',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    accuracy: '±5 bpm (LT2), ±7 bpm (LT1)',
    cost: 'Included in device',
    details: [
      'Apple Watch: HRmax × 0.89 ≈ LT2 HR (±5 bpm); HRmax × 0.77 ≈ LT1 HR (±7 bpm)',
      'Garmin threshold pace: validated within 4% of lab LT2 in trained runners',
      'Requires accurate HRmax — use 220-age formula as starting point only',
      'Best used as a starting estimate, refined by field tests over time',
    ],
  },
] as const

// ─── Training interventions ───────────────────────────────────────────────────

const TRAINING_FORMATS = [
  { label: 'Minimum effective', detail: '20 min at LT2 pace', freq: '2×/week', accent: C.amber },
  { label: 'Optimal volume', detail: '40–60 min LT2 distributed across sessions', freq: '1–2 sessions', accent: C.amber },
  { label: 'Continuous tempo', detail: '20–40 min unbroken at LT2', freq: 'Classic format', accent: C.red },
  { label: 'Cruise intervals', detail: '2×20 min at LT2 with 3 min recovery', freq: 'Volume builder', accent: C.amber },
  { label: 'Lactate surges', detail: '4×8 min at LT2+5 s/km with 2 min float', freq: 'LT2 overspeed', accent: C.red },
]

const NEEDLE_MOVERS = [
  {
    driver: 'Zone 1 volume',
    mechanism: 'Raises LT1 via mitochondrial enzyme upregulation',
    effect: '+LT1 pace',
    accent: C.teal,
    citation: 'Holloszy 1967',
  },
  {
    driver: 'LT2 threshold work',
    mechanism: 'Specific adaptation raises LT2 pace directly',
    effect: '+LT2 pace',
    accent: C.amber,
    citation: 'Billat 2003',
  },
  {
    driver: 'Zone 3 intervals',
    mechanism: 'Raises VO₂max ceiling (Helgerud 4×4: +13% VO₂max)',
    effect: '+VO₂max',
    accent: C.red,
    citation: 'Helgerud 2007',
  },
  {
    driver: 'Altitude training',
    mechanism: '+4–6% hemoglobin mass → LT2 pace +3–5%',
    effect: '+3–5% pace',
    accent: '#a78bfa',
    citation: 'Gore 2013 | Stray-Gundersen 1992',
  },
  {
    driver: 'Resistance training',
    mechanism: 'Preserves running economy → maintains LT2 pace in masters',
    effect: 'Economy +',
    accent: C.teal,
    citation: 'Wilson 2000',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ThresholdLine({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        height: 2,
        background: `${accent}22`,
        borderRadius: 1,
        overflow: 'hidden',
        margin: '20px 0',
      }}
    >
      <div className="threshold-line-fill" style={{ height: '100%', background: `linear-gradient(90deg, ${accent}88, ${accent})`, borderRadius: 1 }} />
    </div>
  )
}

function HeroStatBox({
  label,
  value,
  unit,
  desc,
  accent,
  dim,
  border,
  isPercent,
}: {
  label: string
  value: string
  unit: string
  desc: string
  accent: string
  dim: string
  border: string
  isPercent?: boolean
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '24px 20px',
        flex: '1 1 220px',
        minWidth: 200,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at top left, ${dim} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            color: accent,
            margin: '0 0 12px',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: C.display,
            fontStyle: 'italic',
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 900,
            lineHeight: 1,
            color: accent,
            margin: '0 0 4px',
            letterSpacing: '-2px',
          }}
        >
          {isPercent ? value : value}
        </p>
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 11,
            fontWeight: 600,
            color: C.textSub,
            margin: '0 0 12px',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
          }}
        >
          {unit}
        </p>
        <p
          style={{
            fontFamily: C.serif,
            fontSize: 13,
            color: C.textSub,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  )
}

function ZoneCard({
  num,
  name,
  tag,
  accent,
  dim,
  border,
  hrRange,
  lactate,
  rpe,
  substrate,
  tagline,
  desc,
  prescription,
  prescriptionColor,
}: (typeof ZONES)[number]) {
  return (
    <div
      className="zone-card"
      style={{
        background: C.card,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
        flex: '1 1 280px',
        minWidth: 260,
        position: 'relative',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Background mesh */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at top left, ${dim} 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px' }}>
        {/* Zone header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2.5px',
                color: `${accent}aa`,
                margin: '0 0 4px',
                textTransform: 'uppercase' as const,
              }}
            >
              {name}
            </p>
            <span
              style={{
                fontFamily: C.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: accent,
                textTransform: 'uppercase' as const,
                padding: '3px 8px',
                background: dim,
                border: `1px solid ${border}`,
                borderRadius: 4,
              }}
            >
              {tag}
            </span>
          </div>
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 28,
              fontWeight: 900,
              color: `${accent}20`,
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            {num}
          </span>
        </div>

        {/* HR Range — big number */}
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 22,
            fontWeight: 800,
            color: accent,
            margin: '0 0 16px',
            letterSpacing: '-0.5px',
          }}
        >
          {hrRange}
        </p>

        {/* Metrics row */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 16 }}>
          {[lactate, rpe, substrate].map((m) => (
            <span
              key={m}
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                fontWeight: 600,
                color: C.textSub,
                padding: '3px 8px',
                background: `${C.bg}`,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                whiteSpace: 'nowrap' as const,
              }}
            >
              {m}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: C.display,
            fontStyle: 'italic',
            fontSize: 15,
            fontWeight: 700,
            color: accent,
            margin: '0 0 10px',
          }}
        >
          {tagline}
        </p>

        {/* Description */}
        <p
          style={{
            fontFamily: C.serif,
            fontSize: 13,
            color: C.textSub,
            margin: '0 0 16px',
            lineHeight: 1.65,
          }}
        >
          {desc}
        </p>

        {/* Prescription */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: prescriptionColor,
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontFamily: C.mono,
              fontSize: 11,
              fontWeight: 700,
              color: prescriptionColor,
              margin: 0,
              letterSpacing: '0.3px',
            }}
          >
            {prescription}
          </p>
        </div>
      </div>
    </div>
  )
}

function PhysiologyCard({
  icon,
  title,
  accent,
  dim,
  border,
  citations,
  body,
  stat,
  paceRows,
}: (typeof PHYSIOLOGY_CARDS)[number] & { paceRows?: readonly { dist: string; ratio: string; label: string; accent: string }[] }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: dim,
          borderBottom: `1px solid ${border}`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: dim,
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 18,
              fontWeight: 900,
              color: accent,
              lineHeight: 1,
            }}
          >
            {icon}
          </span>
        </div>
        <div>
          <h2
            style={{
              fontFamily: C.display,
              fontStyle: 'italic',
              fontSize: 17,
              fontWeight: 700,
              color: C.text,
              margin: '0 0 3px',
            }}
          >
            {title}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {citations.map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: C.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  color: `${accent}bb`,
                  padding: '2px 7px',
                  background: `${accent}12`,
                  border: `1px solid ${accent}22`,
                  borderRadius: 3,
                  letterSpacing: '0.3px',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px' }}>
        <p
          style={{
            fontFamily: C.serif,
            fontSize: 14,
            color: C.textSub,
            margin: 0,
            lineHeight: 1.75,
          }}
        >
          {body}
        </p>

        {/* Pace rows if present */}
        {'paceRows' in ({ paceRows } as { paceRows?: unknown }) && paceRows ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
            {(paceRows as typeof PHYSIOLOGY_CARDS[2]['paceRows']).map((row) => (
              <div
                key={row.dist}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.textSub,
                    minWidth: 48,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '1px',
                  }}
                >
                  {row.dist}
                </span>
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: 14,
                    fontWeight: 800,
                    color: row.accent,
                    minWidth: 88,
                  }}
                >
                  {row.ratio}
                </span>
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.textMuted,
                    letterSpacing: '0.3px',
                  }}
                >
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Stat pill */}
        <div style={{ marginTop: 16 }}>
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 11,
              fontWeight: 700,
              color: accent,
              padding: '5px 12px',
              background: dim,
              border: `1px solid ${border}`,
              borderRadius: 6,
              display: 'inline-block',
              lineHeight: 1.4,
            }}
          >
            {stat}
          </span>
        </div>
      </div>
    </div>
  )
}

function MeasurementTier({
  tier,
  medal,
  method,
  citation,
  accent,
  dim,
  border,
  accuracy,
  cost,
  details,
}: (typeof MEASUREMENT_TIERS)[number]) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: dim,
          borderBottom: `1px solid ${border}`,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `${accent}18`,
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 13,
              fontWeight: 900,
              color: accent,
              lineHeight: 1,
            }}
          >
            {medal}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: C.mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '2px',
              color: accent,
              margin: '0 0 3px',
              textTransform: 'uppercase' as const,
            }}
          >
            {tier}
          </p>
          <p
            style={{
              fontFamily: C.display,
              fontStyle: 'italic',
              fontSize: 15,
              fontWeight: 700,
              color: C.text,
              margin: 0,
            }}
          >
            {method}
          </p>
        </div>
        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
          <p
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              fontWeight: 700,
              color: accent,
              margin: '0 0 2px',
            }}
          >
            {accuracy}
          </p>
          <p
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.textMuted,
              margin: 0,
            }}
          >
            {cost}
          </p>
        </div>
      </div>

      {/* Citation */}
      <div style={{ padding: '8px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 9,
            fontWeight: 700,
            color: C.textMuted,
            margin: 0,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.8px',
          }}
        >
          {citation}
        </p>
      </div>

      {/* Detail bullets */}
      <div style={{ padding: '14px 18px' }}>
        {details.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '6px 0',
              borderBottom: i < details.length - 1 ? `1px solid ${C.border}` : undefined,
            }}
          >
            <span
              style={{
                fontFamily: C.mono,
                fontSize: 9,
                fontWeight: 900,
                color: accent,
                flexShrink: 0,
                marginTop: 3,
                letterSpacing: '0.5px',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <p
              style={{
                fontFamily: C.serif,
                fontSize: 13,
                color: C.textSub,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {d}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LactateThresholdSciencePage() {
  return (
    <>
      {/* Font imports + animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,ital@9..144,400..900,0..1&family=JetBrains+Mono:wght@400;600;700;800&family=Crimson+Pro:ital,wght@0,400;0,600;1,400;1,600&display=swap');

            @keyframes threshold-fill {
              from { width: 0%; }
              to   { width: 100%; }
            }
            @keyframes fade-up {
              from { opacity: 0; transform: translateY(18px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes hero-glow-pulse {
              0%, 100% { opacity: 0.4; }
              50%       { opacity: 0.7; }
            }

            .threshold-line-fill {
              animation: threshold-fill 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }

            .hero-section {
              animation: fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .zone-card {
              transition: border-left-color 0.2s ease, box-shadow 0.2s ease;
            }
            .zone-card:hover {
              box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4);
            }

            .lt-page * {
              box-sizing: border-box;
            }

            .lt-page {
              background: ${C.bg};
              color: ${C.text};
              min-height: 100vh;
              font-family: ${C.serif};
            }

            /* Scrollbar */
            .lt-page ::-webkit-scrollbar { width: 6px; height: 6px; }
            .lt-page ::-webkit-scrollbar-track { background: ${C.card}; }
            .lt-page ::-webkit-scrollbar-thumb { background: #2a3045; border-radius: 3px; }
          `,
        }}
      />

      <div className="lt-page">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            paddingTop: 64,
            paddingBottom: 56,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {/* Gradient mesh background */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse 80% 60% at 20% 0%, rgba(230,57,70,0.12) 0%, transparent 55%),
                radial-gradient(ellipse 60% 50% at 80% 20%, rgba(244,162,97,0.08) 0%, transparent 50%),
                radial-gradient(ellipse 40% 70% at 50% 100%, rgba(42,157,143,0.06) 0%, transparent 55%)
              `,
              pointerEvents: 'none',
            }}
          />

          {/* Animated glow orb */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -80,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 400,
              background: 'radial-gradient(ellipse, rgba(230,57,70,0.07) 0%, transparent 65%)',
              pointerEvents: 'none',
              animation: 'hero-glow-pulse 4s ease-in-out infinite',
            }}
          />

          {/* Decorative threshold line motif — LT1 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '35%',
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${C.teal}30 20%, ${C.teal}15 80%, transparent 100%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Decorative threshold line motif — LT2 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '62%',
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${C.red}25 20%, ${C.red}12 80%, transparent 100%)`,
              pointerEvents: 'none',
            }}
          />

          <div
            className="hero-section"
            style={{
              maxWidth: 860,
              margin: '0 auto',
              padding: '0 24px',
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
            }}
          >
            {/* Eyebrow label */}
            <p
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: C.red,
                margin: '0 0 20px',
              }}
            >
              Exercise Physiology — Threshold Science
            </p>

            {/* Main title */}
            <h1
              style={{
                fontFamily: C.display,
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: 'clamp(3.2rem, 10vw, 8rem)',
                lineHeight: 0.92,
                letterSpacing: '-3px',
                margin: '0 0 28px',
                background: `linear-gradient(135deg, ${C.text} 0%, rgba(240,242,247,0.7) 40%, ${C.red} 80%, ${C.amber} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Lactate
              <br />
              Threshold
            </h1>

            {/* Animated threshold line */}
            <div style={{ maxWidth: 480, margin: '0 auto 28px' }}>
              <div
                style={{
                  position: 'relative',
                  height: 2,
                  background: `${C.red}18`,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <div
                  className="threshold-line-fill"
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${C.teal}, ${C.amber}, ${C.red})`,
                    borderRadius: 1,
                  }}
                />
              </div>
            </div>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: C.serif,
                fontStyle: 'italic',
                fontSize: 'clamp(15px, 2.2vw, 19px)',
                color: C.textSub,
                margin: '0 auto 40px',
                lineHeight: 1.7,
                maxWidth: 600,
              }}
            >
              Not a wall. Not a limit. A precisely measurable physiological boundary
              that determines whether you race or survive.
            </p>

            {/* Hero stat boxes */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {HERO_STATS.map((s) => (
                <HeroStatBox key={s.label} {...s} />
              ))}
            </div>
          </div>
        </div>

        {/* ── ZONE MAP ──────────────────────────────────────────────────── */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingTop: 56,
            paddingBottom: 56,
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

            {/* Section label */}
            <div style={{ marginBottom: 32 }}>
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: C.textMuted,
                  margin: '0 0 6px',
                }}
              >
                Section 01
              </p>
              <h2
                style={{
                  fontFamily: C.display,
                  fontStyle: 'italic',
                  fontSize: 'clamp(24px, 4vw, 40px)',
                  fontWeight: 900,
                  color: C.text,
                  margin: '0 0 8px',
                  letterSpacing: '-1px',
                }}
              >
                The Zone Map
              </h2>
              <p
                style={{
                  fontFamily: C.serif,
                  fontSize: 14,
                  color: C.textSub,
                  margin: 0,
                  maxWidth: 560,
                  lineHeight: 1.6,
                }}
              >
                Three physiologically distinct training domains separated by your lactate thresholds.
                Every minute of training lives in one of these zones.
              </p>
            </div>

            {/* Zone proportion visual bar */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}>
                <div style={{ flex: 4, background: `linear-gradient(90deg, ${C.teal}66, ${C.teal})`, borderRadius: '5px 0 0 5px' }} />
                <div style={{ flex: 1.5, background: `linear-gradient(90deg, ${C.amber}66, ${C.amber})` }} />
                <div style={{ flex: 1, background: `linear-gradient(90deg, ${C.red}66, ${C.red})`, borderRadius: '0 5px 5px 0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontFamily: C.mono, fontSize: 9, color: C.teal, fontWeight: 700, letterSpacing: '1px' }}>ZONE 1 — 75–80%</span>
                <span style={{ fontFamily: C.mono, fontSize: 9, color: C.amber, fontWeight: 700, letterSpacing: '1px' }}>ZONE 2 — 5–25%</span>
                <span style={{ fontFamily: C.mono, fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: '1px' }}>ZONE 3 — 15–20%</span>
              </div>
            </div>

            {/* Zone cards */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {ZONES.map((z) => (
                <ZoneCard key={z.id} {...z} />
              ))}
            </div>

            {/* 80/20 polarized note */}
            <div
              style={{
                marginTop: 28,
                padding: '18px 22px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.amber}`,
                borderRadius: 12,
              }}
            >
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  color: C.amber,
                  margin: '0 0 8px',
                  textTransform: 'uppercase',
                }}
              >
                Seiler 2010 — Int J Sports Physiol Perf
              </p>
              <p
                style={{
                  fontFamily: C.serif,
                  fontSize: 14,
                  color: C.textSub,
                  margin: 0,
                  lineHeight: 1.7,
                }}
              >
                Analysis of elite endurance athletes across cycling, rowing, running, and cross-country skiing found
                that champion athletes spontaneously converge on <strong style={{ color: C.text }}>80% Zone 1 / 20% Zone 3</strong> — the
                "polarized" model. Zone 2 ("the black hole") is deceptively dangerous: too hard to recover from quickly,
                too easy to provide Zone 3 stimulus. Recreational athletes chronically over-train Zone 2 and under-train
                Zone 1, sacrificing aerobic base development for the illusion of hard work.
              </p>
            </div>
          </div>
        </div>

        {/* ── PHYSIOLOGY ────────────────────────────────────────────────── */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingTop: 56,
            paddingBottom: 56,
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

            <div style={{ marginBottom: 32 }}>
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: C.textMuted,
                  margin: '0 0 6px',
                }}
              >
                Section 02
              </p>
              <h2
                style={{
                  fontFamily: C.display,
                  fontStyle: 'italic',
                  fontSize: 'clamp(24px, 4vw, 40px)',
                  fontWeight: 900,
                  color: C.text,
                  margin: '0 0 8px',
                  letterSpacing: '-1px',
                }}
              >
                The Physiology
              </h2>

              {/* Threshold divider line */}
              <ThresholdLine accent={C.red} />
            </div>

            {/* 2-column grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 20,
              }}
            >
              {PHYSIOLOGY_CARDS.map((card) => (
                <PhysiologyCard key={card.id} {...card} />
              ))}
            </div>
          </div>
        </div>

        {/* ── MEASUREMENT ───────────────────────────────────────────────── */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingTop: 56,
            paddingBottom: 56,
          }}
        >
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

            <div style={{ marginBottom: 32 }}>
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: C.textMuted,
                  margin: '0 0 6px',
                }}
              >
                Section 03
              </p>
              <h2
                style={{
                  fontFamily: C.display,
                  fontStyle: 'italic',
                  fontSize: 'clamp(24px, 4vw, 40px)',
                  fontWeight: 900,
                  color: C.text,
                  margin: '0 0 10px',
                  letterSpacing: '-1px',
                }}
              >
                How to Find Your Threshold
              </h2>
              <p
                style={{
                  fontFamily: C.serif,
                  fontSize: 14,
                  color: C.textSub,
                  margin: 0,
                  lineHeight: 1.6,
                  maxWidth: 520,
                }}
              >
                Four methods ranked by accuracy. The accuracy pyramid — higher tiers provide more
                precise boundaries, but even field estimates are actionable.
              </p>
              <ThresholdLine accent={C.amber} />
            </div>

            {/* Accuracy pyramid visual */}
            <div
              style={{
                marginBottom: 28,
                padding: '16px 20px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
              }}
            >
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  color: C.textMuted,
                  margin: '0 0 12px',
                  textTransform: 'uppercase',
                }}
              >
                Accuracy Pyramid
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MEASUREMENT_TIERS.map((t, i) => {
                  const widths = ['100%', '75%', '55%', '35%']
                  return (
                    <div
                      key={t.tier}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: C.mono,
                          fontSize: 10,
                          fontWeight: 700,
                          color: t.accent,
                          minWidth: 24,
                        }}
                      >
                        {t.medal}
                      </span>
                      <div
                        style={{
                          height: 7,
                          width: widths[i],
                          background: `linear-gradient(90deg, ${t.accent}40, ${t.accent})`,
                          borderRadius: 4,
                          transition: 'width 0.3s ease',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: C.mono,
                          fontSize: 10,
                          color: t.accent,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.tier}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Measurement tiers */}
            {MEASUREMENT_TIERS.map((tier) => (
              <MeasurementTier key={tier.tier} {...tier} />
            ))}
          </div>
        </div>

        {/* ── IMPROVEMENT PROTOCOLS ─────────────────────────────────────── */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            paddingTop: 56,
            paddingBottom: 56,
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

            <div style={{ marginBottom: 32 }}>
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: C.textMuted,
                  margin: '0 0 6px',
                }}
              >
                Section 04
              </p>
              <h2
                style={{
                  fontFamily: C.display,
                  fontStyle: 'italic',
                  fontSize: 'clamp(24px, 4vw, 40px)',
                  fontWeight: 900,
                  color: C.text,
                  margin: '0 0 8px',
                  letterSpacing: '-1px',
                }}
              >
                Improvement Protocols
              </h2>
              <ThresholdLine accent={C.teal} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: 24,
              }}
            >
              {/* Left — Training Prescriptions */}
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${C.amber}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: C.amberDim,
                    borderBottom: `1px solid ${C.amberBorder}`,
                    padding: '16px 20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: C.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '2px',
                      color: C.amber,
                      margin: '0 0 4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Billat 2003 — J Sports Sci
                  </p>
                  <h3
                    style={{
                      fontFamily: C.display,
                      fontStyle: 'italic',
                      fontSize: 18,
                      fontWeight: 700,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    Training Prescriptions
                  </h3>
                </div>

                <div style={{ padding: '18px 20px' }}>
                  {TRAINING_FORMATS.map((fmt, i) => (
                    <div
                      key={fmt.label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        padding: '12px 0',
                        borderBottom: i < TRAINING_FORMATS.length - 1 ? `1px solid ${C.border}` : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: C.mono,
                            fontSize: 10,
                            fontWeight: 700,
                            color: fmt.accent,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          {fmt.label}
                        </span>
                        <span
                          style={{
                            fontFamily: C.mono,
                            fontSize: 9,
                            color: C.textMuted,
                            padding: '2px 6px',
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 3,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fmt.freq}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: C.serif,
                          fontSize: 13,
                          color: C.textSub,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {fmt.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — What Moves the Needle */}
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${C.teal}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: C.tealDim,
                    borderBottom: `1px solid ${C.tealBorder}`,
                    padding: '16px 20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: C.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '2px',
                      color: C.teal,
                      margin: '0 0 4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Evidence-Based Mechanisms
                  </p>
                  <h3
                    style={{
                      fontFamily: C.display,
                      fontStyle: 'italic',
                      fontSize: 18,
                      fontWeight: 700,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    What Moves the Needle
                  </h3>
                </div>

                <div style={{ padding: '18px 20px' }}>
                  {NEEDLE_MOVERS.map((nm, i) => (
                    <div
                      key={nm.driver}
                      style={{
                        padding: '12px 0',
                        borderBottom: i < NEEDLE_MOVERS.length - 1 ? `1px solid ${C.border}` : undefined,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: C.mono,
                            fontSize: 11,
                            fontWeight: 800,
                            color: nm.accent,
                            letterSpacing: '0.3px',
                          }}
                        >
                          {nm.driver}
                        </span>
                        <span
                          style={{
                            fontFamily: C.mono,
                            fontSize: 10,
                            fontWeight: 700,
                            color: nm.accent,
                            padding: '2px 8px',
                            background: `${nm.accent}15`,
                            border: `1px solid ${nm.accent}30`,
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {nm.effect}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: C.serif,
                          fontSize: 13,
                          color: C.textSub,
                          margin: '0 0 4px',
                          lineHeight: 1.5,
                        }}
                      >
                        {nm.mechanism}
                      </p>
                      <p
                        style={{
                          fontFamily: C.mono,
                          fontSize: 9,
                          color: C.textMuted,
                          margin: 0,
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {nm.citation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KEY PRINCIPLES SUMMARY ────────────────────────────────────── */}
        <div style={{ paddingTop: 48, paddingBottom: 24 }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '24px 24px 20px',
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: C.textMuted,
                  margin: '0 0 16px',
                }}
              >
                Key Principles
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { text: 'LT2 pace — not VO₂max — is the strongest single predictor of endurance race performance across all distances.', accent: C.red },
                  { text: 'Lactate is a fuel, not a toxin. The MCT shuttle transports it between fibre types and to the heart as a preferred substrate.', accent: C.teal },
                  { text: 'The "black hole" (Zone 2) is the most common training mistake: too hard to recover from, too easy for Zone 3 stimulus.', accent: C.amber },
                  { text: 'Threshold training is equally effective at age 60+ — the metabolic machinery that responds to LT2 work does not age out.', accent: C.teal },
                  { text: 'DFA-α1 <0.50 confirms you are above LT2 in real-time without a lab — the most actionable wearable threshold tool available.', accent: C.amber },
                  { text: 'A 30-min time trial average HR estimates LT2 to within 3 bpm — sufficient precision for training zone calculation.', accent: C.red },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        fontFamily: C.mono,
                        fontSize: 9,
                        fontWeight: 900,
                        color: p.accent,
                        flexShrink: 0,
                        marginTop: 3,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      style={{
                        fontFamily: C.serif,
                        fontSize: 13,
                        color: C.textSub,
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {p.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER CITATIONS ─────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32, paddingBottom: 48 }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
            <p
              style={{
                fontFamily: C.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: C.textMuted,
                margin: '0 0 14px',
              }}
            >
              Primary References
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              {[
                'Faude O, Kindermann W, Meyer T. Lactate threshold concepts: how valid are they? Sports Med. 2009;39(6):469–490.',
                'Wasserman K, McIlroy MB. Detecting the threshold of anaerobic metabolism in cardiac patients during exercise. Am J Cardiol. 1964;14(6):844–852.',
                'Beaver WL, Wasserman K, Whipp BJ. A new method for detecting anaerobic threshold by gas exchange. J Appl Physiol. 1986;60(6):2020–2027.',
                'Heck H, et al. Justification of the 4-mmol/l lactate threshold. Int J Sports Med. 1985;6(3):117–130.',
                'Seiler S. What is best practice for training intensity and duration distribution in endurance athletes? Int J Sports Physiol Perform. 2010;5(3):276–291.',
                'Billat VL. Interval training for performance: a scientific and empirical practice. Sports Med. 2001;31(1):13–31; review updated Billat 2003 J Sports Sci.',
                'Thomas SG, et al. A field test for determination of lactate threshold. J Strength Cond Res. 2008;22(6):1830–1835.',
                'Foster C, et al. The talk test as a marker of exercise training intensity. J Cardiopulm Rehabil Prev. 2008;28(1):24–30.',
                'Buchheit M. Monitoring training status with HR measures: do all roads lead to Rome? Front Physiol. 2007; Rogers B et al. Sports Med. 2021.',
                'Wilson TM, Tanaka H. Meta-analysis of the age-associated decline in maximal aerobic capacity in men. J Appl Physiol. 2000;88(1):101–108.',
                'Tanaka H, Seals DR. Age and gender interactions in physiological functional capacity. J Appl Physiol. 1997;82(3):846–851.',
                'Helgerud J, et al. Aerobic high-intensity intervals improve VO2max more than moderate training. Med Sci Sports Exerc. 2007;39(4):665–671.',
                'Gore CJ, et al. Altitude training and haemoglobin mass. Br J Sports Med. 2013;47(Suppl 1):i83–i86.',
                'Stray-Gundersen J, Chapman RF, Levine BD. "Living high-training low" altitude training improves sea level performance. J Appl Physiol. 2001;91(3):1113–1120.',
                'Jones AM. The physiology of the world record holder for the women\'s marathon. Int J Sports Sci Coach. 2006;1(2):101–116; Critical Speed: Jones 2010 J Exerc Sci Fit.',
              ].map((ref, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.textMuted,
                    margin: 0,
                    lineHeight: 1.55,
                    paddingLeft: 14,
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: `${C.red}60`,
                      fontWeight: 700,
                    }}
                  >
                    ›
                  </span>
                  {ref}
                </p>
              ))}
            </div>

            {/* Disclaimer */}
            <div
              style={{
                marginTop: 24,
                padding: '14px 18px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.textMuted}`,
                borderRadius: 10,
              }}
            >
              <p
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: C.textSub, fontWeight: 700 }}>Disclaimer:</span> This page summarises
                peer-reviewed literature. Effect sizes reflect population study data; individual physiology varies.
                LT1 and LT2 percentages represent population means — personal thresholds require individual testing.
                Consult a qualified coach or physician before beginning high-intensity training protocols.
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
