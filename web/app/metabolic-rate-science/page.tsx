// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_NUMBERS = [
  {
    label: 'RMR',
    value: '60–75%',
    sub: 'of TDEE (sedentary)',
    accent: '#f97316',
  },
  {
    label: 'TEF',
    value: '8–10%',
    sub: 'thermic effect of food',
    accent: '#ef4444',
  },
  {
    label: 'EAT',
    value: '5–20%',
    sub: 'exercise activity',
    accent: '#3b82f6',
  },
  {
    label: 'NEAT',
    value: '6–50%',
    sub: 'non-exercise activity',
    accent: '#22c55e',
  },
]

const SCIENCE_CARDS = [
  {
    title: 'RMR Measurement & Prediction',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    facts: [
      {
        citation: 'Mifflin 1990',
        text: 'Mifflin-St Jeor equation: RMR = 10×weight(kg) + 6.25×height(cm) − 5×age + 5 (men) or −161 (women); most accurate predictive equation — mean error ±10% vs ±14% for Harris-Benedict; validated across BMI 17–57',
        stat: '±10% mean error',
      },
      {
        citation: 'Schofield 1985',
        text: 'Doubly Labeled Water (DLW) is gold standard for TDEE measurement; RMR accounts for 60–75% of TDEE in sedentary individuals; athletes 45–55% due to higher activity thermogenesis',
        stat: 'RMR = 60–75% TDEE',
      },
      {
        citation: 'Ravussin 1988',
        text: 'Fat-free mass (FFM) explains 80% of inter-individual RMR variance; RMR decreases ~2% per decade primarily from FFM loss; genetic factors account for remaining 20% of variance',
        stat: 'FFM → 80% variance',
      },
      {
        citation: 'Johnstone 2005',
        text: 'Apple Watch RMR estimation accuracy within 8–15% of DLW in free-living conditions; daily averaging of multiple measurements reduces error to ~5%; wrist-based estimates require calibration for clinical use',
        stat: 'Watch error ~8–15%',
      },
    ],
  },
  {
    title: 'Metabolic Adaptation & Suppression',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.10)',
    accentBorder: 'rgba(239,68,68,0.28)',
    facts: [
      {
        citation: 'Rosenbaum 2010',
        text: 'During caloric restriction, RMR decreases 10–15% beyond what FFM loss alone predicts — adaptive thermogenesis; driven by reduced T3, suppressed SNS activity, and improved muscle work efficiency; persists ≥6 years post weight loss',
        stat: 'RMR ↓ 10–15% extra',
      },
      {
        citation: 'Leibel 1995 (NEJM)',
        text: '10% weight loss decreases TDEE by 20–25%; metabolic adaptation more than doubles the expected caloric deficit; static calorie targets calculated at baseline will progressively over-estimate the deficit',
        stat: 'TDEE ↓ 20–25% at −10% wt',
      },
      {
        citation: 'Trexler 2014',
        text: 'Reverse dieting at 50–100 kcal/week gradual increase can restore RMR without fat regain; periodic refeeds (48–72h at maintenance) temporarily restore T3, leptin, and RMR — blunting adaptive thermogenesis',
        stat: '+50–100 kcal/wk reverse diet',
      },
      {
        citation: 'Pontzer 2021 (Science)',
        text: 'Highly active individuals spend 200–300 kcal/day less at rest via metabolic compensation (constrained total energy model); net exercise energy increase is 150–400 kcal/day — most effective when combined with dietary modification',
        stat: 'Net exercise +150–400 kcal',
      },
    ],
  },
  {
    title: 'TDEE Components & Activity',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Ravussin 1988',
        text: 'TDEE breakdown: BMR/RMR 60–75%, thermic effect of food (TEF) 8–10%, exercise activity thermogenesis (EAT) 5–20%, non-exercise activity thermogenesis (NEAT) 6–50%; NEAT is the most variable and trainable component',
        stat: 'NEAT: 6–50% TDEE',
      },
      {
        citation: 'Levine 2004 (Science)',
        text: 'Lean vs obese individuals differ by up to 2,000 kcal/day in NEAT — driven by unconscious postural changes, spontaneous movement, and fidgeting; NEAT is suppressed 300–500 kcal/day after overfeeding as a compensatory mechanism',
        stat: 'NEAT gap: 2,000 kcal/day',
      },
      {
        citation: 'Ainsworth 2011 (Compendium)',
        text: 'Validated activity multipliers for TDEE: sedentary ×1.2, lightly active ×1.375, moderately active ×1.55, very active ×1.725, extra active ×1.9; self-reported activity levels overestimate TDEE by 20–30% on average',
        stat: 'Self-report +20–30% error',
      },
      {
        citation: 'Church 2011',
        text: 'Compensation effect: adding structured exercise without dietary modification produces only 30–40% of expected weight loss; compensatory eating accounts for 40–60% of the predicted deficit — explaining the "exercise paradox"',
        stat: 'Exercise alone: 30–40% effect',
      },
    ],
  },
  {
    title: 'Body Composition & Metabolic Health',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        citation: 'Gallagher 2000',
        text: 'BMI fails to distinguish fat mass from lean mass; Fat-Free Mass Index (FFMI = FFM / height²) is a superior body composition metric; FFMI >25 kg/m² in men is rarely achieved naturally — used as a benchmark in anti-doping research',
        stat: 'FFMI >25 rarely natural',
      },
      {
        citation: 'Despres 2006',
        text: 'Visceral adipose tissue >130 cm² (CT scan) is independently associated with insulin resistance and CVD regardless of BMI; waist circumference >88 cm (women) / >102 cm (men) predicts metabolic syndrome with high sensitivity',
        stat: 'Visceral fat >130 cm² → MetS',
      },
      {
        citation: 'Ivy 2004',
        text: 'Each kg of skeletal muscle increases systemic glucose disposal by ~10 mg/min; resistance training increases GLUT4 transporter expression 50% in just 6 weeks — the most potent non-pharmacological intervention for insulin resistance',
        stat: 'GLUT4 +50% in 6 weeks',
      },
      {
        citation: 'Jensen 2006',
        text: 'Adipocytes never disappear after weight loss — they only shrink; post-weight-loss fat cells are metabolically hyperactive, producing elevated ghrelin and reduced leptin; this creates a sustained biological drive to regain lost weight',
        stat: 'Fat cells shrink, never vanish',
      },
    ],
  },
]

const ACTIVITY_MULTIPLIERS = [
  { label: 'Sedentary', desc: 'desk job, little/no exercise', mult: '×1.2', color: '#475569' },
  { label: 'Lightly Active', desc: 'light exercise 1–3 days/wk', mult: '×1.375', color: '#64748b' },
  { label: 'Moderately Active', desc: 'moderate exercise 3–5 days/wk', mult: '×1.55', color: '#f97316' },
  { label: 'Very Active', desc: 'hard exercise 6–7 days/wk', mult: '×1.725', color: '#ef4444' },
  { label: 'Extra Active', desc: 'physical job + hard exercise', mult: '×1.9', color: '#dc2626' },
]

// Example values for the static TDEE calculator
const EXAMPLE = {
  weight: 75,   // kg
  height: 175,  // cm
  age: 30,
  sex: 'male',
  // Mifflin-St Jeor: 10*75 + 6.25*175 - 5*30 + 5 = 750 + 1093.75 - 150 + 5 = 1698.75
  rmr: 1699,
  tdee_sedentary: Math.round(1699 * 1.2),
  tdee_moderate: Math.round(1699 * 1.55),
  tdee_active: Math.round(1699 * 1.725),
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KeyNumberCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '18px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 140,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          margin: '0 0 6px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: '#f1f5f9',
          margin: '0 0 4px',
          letterSpacing: '-0.5px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ScienceCard({
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { citation: string; text: string; stat: string }[]
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
      {/* Card header */}
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 18px',
        }}
      >
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

      {/* Facts */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {facts.map((fact, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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
                  letterSpacing: '0.05em',
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
              <div style={{ height: 1, background: '#1a1a1a', marginTop: 5 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MetabolicRateSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #100800 0%, #120505 50%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a1a',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '15%',
            width: 380,
            height: 380,
            background: 'radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(239,68,68,0.10) 0%, transparent 70%)',
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
              { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', icon: '🔥' },
              { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', icon: '⚗️' },
              { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '🧬' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  marginLeft: i > 0 ? -10 : 0,
                  boxShadow: '0 0 0 2px #0a0a0a',
                }}
              >
                {item.icon}
              </div>
            ))}
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 50px)',
              fontWeight: 900,
              margin: '0 0 14px',
              background: 'linear-gradient(135deg, #f97316 0%, #ef4444 55%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Metabolic Rate Science
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#94a3b8',
              margin: '0 auto 22px',
              maxWidth: 560,
              lineHeight: 1.65,
            }}
          >
            Understanding resting metabolic rate, total daily energy expenditure, and
            metabolic adaptation — the science behind why calories in vs. calories out
            is far more dynamic than it appears
          </p>

          {/* Tag row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'RMR / BMR', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
              { label: 'TDEE', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
              { label: 'NEAT', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
              { label: 'Adaptation', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
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

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '32px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >

        {/* ── Key numbers row ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_NUMBERS.map((n) => (
            <KeyNumberCard
              key={n.label}
              label={n.label}
              value={n.value}
              sub={n.sub}
              accent={n.accent}
            />
          ))}
        </div>

        {/* ── TDEE component breakdown ───────────────────────────────────────── */}
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
              borderBottom: '1px solid rgba(249,115,22,0.22)',
              borderLeft: '3px solid #f97316',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>
              TDEE Component Breakdown
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
              Ravussin 1988 — relative contribution of each metabolic compartment
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            {[
              { label: 'RMR / BMR', range: '60–75%', mid: 68, color: '#f97316', desc: 'Basal cellular maintenance, organ function' },
              { label: 'TEF', range: '8–10%', mid: 9, color: '#fbbf24', desc: 'Digestion, absorption, nutrient processing' },
              { label: 'EAT', range: '5–20%', mid: 13, color: '#3b82f6', desc: 'Intentional structured exercise' },
              { label: 'NEAT', range: '6–50%', mid: 20, color: '#22c55e', desc: 'Fidgeting, posture, daily movement — most variable' },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: row.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        width: 40,
                        flexShrink: 0,
                      }}
                    >
                      {row.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{row.desc}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: row.color,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      flexShrink: 0,
                    }}
                  >
                    {row.range}
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: '#0f0f0f',
                    borderRadius: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${row.mid}%`,
                      background: row.color,
                      borderRadius: 5,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            ))}

            <p
              style={{
                fontSize: 11,
                color: '#334155',
                margin: '4px 0 0',
                fontStyle: 'italic',
              }}
            >
              Bar widths show midpoint estimates. NEAT range reflects sedentary desk worker (low) to manual labourer (high).
            </p>
          </div>
        </div>

        {/* ── Mifflin-St Jeor Calculator (static) ───────────────────────────── */}
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
              borderBottom: '1px solid rgba(239,68,68,0.22)',
              borderLeft: '3px solid #ef4444',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>
              Mifflin-St Jeor TDEE Calculator
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
              Most validated RMR prediction equation (1990) — example: 75 kg male, 175 cm, 30 years old
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Formula display */}
            <div
              style={{
                background: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: 10,
                padding: '16px 18px',
                marginBottom: 20,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#475569',
                  margin: '0 0 8px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Formula
              </p>
              <p style={{ fontSize: 13, color: '#f97316', margin: '0 0 4px', fontWeight: 700 }}>
                RMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age + S
              </p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                S = +5 for men &nbsp;|&nbsp; S = −161 for women
              </p>
            </div>

            {/* Step-by-step calculation */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#475569',
                  margin: '0 0 12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Step-by-step example
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    step: '10 × 75 kg',
                    result: '750',
                    label: 'weight component',
                    color: '#f97316',
                  },
                  {
                    step: '6.25 × 175 cm',
                    result: '1,093.75',
                    label: 'height component',
                    color: '#f97316',
                  },
                  {
                    step: '5 × 30 yrs',
                    result: '−150',
                    label: 'age component',
                    color: '#ef4444',
                  },
                  {
                    step: 'Sex constant (male)',
                    result: '+5',
                    label: 'sex adjustment',
                    color: '#3b82f6',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: '#0f0f0f',
                      borderRadius: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        flex: 1,
                      }}
                    >
                      {item.step}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: item.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        width: 80,
                        textAlign: 'right',
                      }}
                    >
                      {item.result}
                    </span>
                    <span style={{ fontSize: 11, color: '#334155', width: 130, textAlign: 'right' }}>
                      {item.label}
                    </span>
                  </div>
                ))}

                {/* Total RMR */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'rgba(249,115,22,0.10)',
                    border: '1px solid rgba(249,115,22,0.28)',
                    borderRadius: 8,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#e2e8f0',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      flex: 1,
                    }}
                  >
                    RMR =
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: '#f97316',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {EXAMPLE.rmr.toLocaleString()} kcal/day
                  </span>
                </div>
              </div>
            </div>

            {/* Activity multiplier table */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#475569',
                margin: '0 0 10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              TDEE by activity level
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ACTIVITY_MULTIPLIERS.map((row) => {
                const tdee = Math.round(EXAMPLE.rmr * parseFloat(row.mult.replace('×', '')))
                const isHighlighted = row.label === 'Moderately Active'
                return (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: isHighlighted ? 'rgba(249,115,22,0.08)' : '#0f0f0f',
                      border: isHighlighted ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                      borderRadius: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isHighlighted ? 700 : 500,
                        color: isHighlighted ? '#f1f5f9' : '#94a3b8',
                        width: 130,
                        flexShrink: 0,
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#475569',
                        flex: 1,
                      }}
                    >
                      {row.desc}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#334155',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        width: 44,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {row.mult}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: row.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        width: 80,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {tdee.toLocaleString()} kcal
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Accuracy note */}
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 8,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
              <p style={{ fontSize: 12, color: '#fde68a', margin: 0, lineHeight: 1.55 }}>
                <strong>Accuracy caveat:</strong> Mifflin-St Jeor predicts RMR within ±10% for ~82% of individuals
                (Frankenfield 2005). Accuracy decreases at BMI extremes. Metabolic adaptation during caloric
                restriction means actual TDEE may be 15–25% lower than predicted after sustained dieting.
              </p>
            </div>
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
                title={card.title}
                accent={card.accent}
                accentBg={card.accentBg}
                accentBorder={card.accentBorder}
                facts={card.facts}
              />
            ))}
          </div>
        </div>

        {/* ── Metabolic adaptation timeline ─────────────────────────────────── */}
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
              borderBottom: '1px solid rgba(239,68,68,0.22)',
              borderLeft: '3px solid #ef4444',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>
              Adaptive Thermogenesis Timeline
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
              Rosenbaum 2010 / Leibel 1995 — RMR suppression beyond FFM loss during caloric deficit
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  phase: 'Week 1–2',
                  desc: 'Water weight loss dominates; RMR unchanged',
                  rmrChange: '0%',
                  color: '#64748b',
                  barW: 2,
                },
                {
                  phase: 'Week 3–6',
                  desc: 'FFM loss begins; RMR starts dropping in proportion',
                  rmrChange: '−3–5%',
                  color: '#f97316',
                  barW: 15,
                },
                {
                  phase: 'Week 7–12',
                  desc: 'Adaptive thermogenesis activates; extra RMR drop beyond FFM loss',
                  rmrChange: '−8–12%',
                  color: '#ef4444',
                  barW: 32,
                },
                {
                  phase: 'Month 4–6',
                  desc: 'T3, leptin, SNS suppressed; plateau common; TDEE far below baseline',
                  rmrChange: '−12–18%',
                  color: '#dc2626',
                  barW: 50,
                },
                {
                  phase: '≥6 yrs post WL',
                  desc: 'Persistent adaptation even after weight is maintained at loss level',
                  rmrChange: '−10–15%',
                  color: '#b91c1c',
                  barW: 42,
                },
              ].map((row) => (
                <div key={row.phase}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 5,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: row.color,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          marginRight: 10,
                        }}
                      >
                        {row.phase}
                      </span>
                      <span style={{ fontSize: 11, color: '#475569' }}>{row.desc}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: row.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      {row.rmrChange}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: '#0f0f0f',
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${row.barW}%`,
                        background: row.color,
                        borderRadius: 4,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, lineHeight: 1.55 }}>
                <strong>Key insight (Leibel 1995):</strong> A 10% weight loss reduces TDEE by 20–25% — double
                the expected amount. This means a 500 kcal/day deficit at baseline becomes a ~250 kcal effective
                deficit after 3–4 months without adjusting targets. Calorie tracking must account for progressive
                metabolic adaptation.
              </p>
            </div>
          </div>
        </div>

        {/* ── Key concepts footer grid ────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {[
            {
              title: 'DLW Gold Standard',
              desc: 'Doubly Labeled Water traces ²H₂O and H₂¹⁸O elimination to calculate CO₂ production and precise TDEE over 10–14 days',
              color: '#f97316',
            },
            {
              title: 'Leptin & T3',
              desc: 'Both drop rapidly during caloric restriction — leptin within 24–72h, T3 within weeks — suppressing metabolic rate and increasing hunger',
              color: '#ef4444',
            },
            {
              title: 'GLUT4 & Muscle',
              desc: 'Skeletal muscle is the primary glucose sink; each kg of muscle raises glucose disposal ~10 mg/min; resistance training is the most potent insulin sensitizer',
              color: '#22c55e',
            },
            {
              title: 'NEAT Compensation',
              desc: 'After overfeeding, NEAT rises 500+ kcal/day; after under-eating, NEAT falls 300–500 kcal/day — partially buffering the intended energy deficit',
              color: '#3b82f6',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: '#111111',
                border: '1px solid #1f1f1f',
                borderRadius: 12,
                padding: '16px 14px',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: item.color,
                  margin: '0 0 8px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {item.title}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
