// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'Autophagy Onset',
    value: '16–24h',
    sub: 'significant autophagic flux',
    accent: '#a855f7',
  },
  {
    label: 'GH Increase',
    value: '5×',
    sub: 'growth hormone at 24h fast',
    accent: '#f59e0b',
  },
  {
    label: 'Insulin Sensitivity',
    value: '+38%',
    sub: 'early TRE vs control (Sutton 2018)',
    accent: '#3b82f6',
  },
  {
    label: 'IGF-1 Reduction',
    value: '−30%',
    sub: 'FMD 5-day monthly (Brandhorst 2015)',
    accent: '#22c55e',
  },
]

const FASTING_PROTOCOLS = [
  {
    name: '16:8',
    subtitle: 'Most studied',
    desc: '16h fast / 8h eating window',
    detail: 'e.g. eat 12:00–20:00 · skip breakfast',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.35)',
    fastHours: 16,
    totalHours: 24,
  },
  {
    name: '5:2',
    subtitle: '500 kcal on 2 days/week',
    desc: '5 normal days · 2 restricted days',
    detail: '~500 kcal on fast days (Mon & Thu)',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    fastHours: 2,
    totalHours: 7,
  },
  {
    name: 'OMAD',
    subtitle: 'One Meal A Day',
    desc: '23h fast / 1h eating window',
    detail: 'Most aggressive form of TRE',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    fastHours: 23,
    totalHours: 24,
  },
]

const FASTING_TIMELINE = [
  {
    hour: '0–4h',
    label: 'Fed State',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
    xPct: 0,
    widthPct: 8,
    events: [
      { metric: 'Insulin', value: 'Peak', dir: 'up', color: '#ef4444' },
      { metric: 'Glucose', value: 'Elevated', dir: 'up', color: '#f59e0b' },
      { metric: 'Glucagon', value: 'Low', dir: 'down', color: '#22c55e' },
      { metric: 'Ketones', value: '~0', dir: 'neutral', color: '#94a3b8' },
    ],
    note: 'Digestion & nutrient absorption. mTOR active, autophagy suppressed.',
  },
  {
    hour: '4–8h',
    label: 'Early Fast',
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.12)',
    border: 'rgba(132,204,22,0.3)',
    xPct: 8,
    widthPct: 8,
    events: [
      { metric: 'Insulin', value: 'Falling', dir: 'down', color: '#22c55e' },
      { metric: 'Glucose', value: 'Falling', dir: 'down', color: '#f59e0b' },
      { metric: 'Glucagon', value: 'Rising', dir: 'up', color: '#f59e0b' },
      { metric: 'Ketones', value: 'Trace', dir: 'neutral', color: '#94a3b8' },
    ],
    note: 'Liver glycogen mobilised. Gluconeogenesis begins.',
  },
  {
    hour: '8–12h',
    label: 'Glycogen Depletion',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(234,179,8,0.3)',
    xPct: 16,
    widthPct: 8,
    events: [
      { metric: 'Insulin', value: 'Low', dir: 'down', color: '#22c55e' },
      { metric: 'GH', value: 'Rising 3×', dir: 'up', color: '#a855f7' },
      { metric: 'AMPK', value: 'Activating', dir: 'up', color: '#3b82f6' },
      { metric: 'Ketones', value: 'Low', dir: 'up', color: '#f59e0b' },
    ],
    note: 'Liver glycogen nearly depleted. GH rises for protein sparing.',
  },
  {
    hour: '12–16h',
    label: 'Metabolic Switch',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.3)',
    xPct: 24,
    widthPct: 8,
    events: [
      { metric: 'Insulin', value: 'Nadir', dir: 'down', color: '#22c55e' },
      { metric: 'Ketones', value: '0.5–1 mM', dir: 'up', color: '#f59e0b' },
      { metric: 'AMPK', value: 'Peak', dir: 'up', color: '#3b82f6' },
      { metric: 'Autophagy', value: 'Initiating', dir: 'up', color: '#a855f7' },
    ],
    note: 'Metabolic switch: fat oxidation dominant. Autophagy begins.',
  },
  {
    hour: '16–24h',
    label: 'Autophagy Peak',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.3)',
    xPct: 32,
    widthPct: 14,
    events: [
      { metric: 'GH', value: 'Peak 5×', dir: 'up', color: '#a855f7' },
      { metric: 'Ketones', value: '1–2 mM', dir: 'up', color: '#f59e0b' },
      { metric: 'Autophagy', value: 'High', dir: 'up', color: '#a855f7' },
      { metric: 'IGF-1', value: 'Falling', dir: 'down', color: '#22c55e' },
    ],
    note: 'Ohsumi 2016: peak autophagic flux. GH pulsatile secretion 5× baseline.',
  },
  {
    hour: '24–48h',
    label: 'Deep Fasting',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.3)',
    xPct: 46,
    widthPct: 27,
    events: [
      { metric: 'Ketones', value: '2–5 mM', dir: 'up', color: '#f59e0b' },
      { metric: 'Autophagy', value: 'Maximum', dir: 'up', color: '#a855f7' },
      { metric: 'Neuronal AP', value: '+2×', dir: 'up', color: '#3b82f6' },
      { metric: 'Proteolysis', value: 'Minimised', dir: 'down', color: '#22c55e' },
    ],
    note: 'Alirezaei 2010: 2× neuronal autophagy. Ketones spare 50% brain glucose.',
  },
  {
    hour: '48h+',
    label: 'Ketoadaptation',
    color: '#e11d48',
    bg: 'rgba(225,29,72,0.12)',
    border: 'rgba(225,29,72,0.3)',
    xPct: 73,
    widthPct: 27,
    events: [
      { metric: 'Stem Cells', value: 'Regenerating', dir: 'up', color: '#22c55e' },
      { metric: 'IGF-1', value: 'Very low', dir: 'down', color: '#3b82f6' },
      { metric: 'CRP', value: 'Falling', dir: 'down', color: '#22c55e' },
      { metric: 'Brain glc', value: '−50% need', dir: 'down', color: '#f59e0b' },
    ],
    note: 'Choi 2016: immune stem cell regeneration. FMD territory (3–5 days).',
  },
]

const SCIENCE_CARDS = [
  {
    icon: '♻️',
    title: 'Autophagy & Cellular Cleaning',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.10)',
    accentBorder: 'rgba(168,85,247,0.28)',
    facts: [
      {
        citation: 'Ohsumi 2016 (Nobel Prize)',
        text: 'Autophagy is lysosomal degradation of damaged organelles and misfolded proteins — regulated by mTOR (inhibits) and AMPK (promotes). 16–24h fasting significantly upregulates autophagic flux. Yoshinori Ohsumi awarded Nobel Prize in Physiology or Medicine 2016 for autophagy mechanism discovery.',
        stat: 'Nobel 2016',
      },
      {
        citation: 'Levine 2019 (Cell Metabolism)',
        text: 'Blood glucose falls 4–8h; glycogen depletion at 12–16h triggers autophagy initiation; insulin reaches minimum at ~14h; AMPK peaks 16–24h; autophagy peaks 24–48h. mTOR re-activation after refeeding is critical for muscle protein synthesis — the fast/feed cycle drives adaptation.',
        stat: 'AMPK peak 16–24h',
      },
      {
        citation: 'Alirezaei 2010',
        text: '24–48h fasting increases neuronal autophagy 2-fold. Autophagic clearance targets tau, amyloid-β, and α-synuclein — all implicated in Alzheimer\'s, Parkinson\'s, and Huntington\'s disease. Animal models show fasting reduces AD pathology markers by 50–60%.',
        stat: 'Neuronal AP +2×',
      },
      {
        citation: 'Choi 2016 (Cell)',
        text: '48–72h fasting promotes immune stem cell regeneration through IGF-1/PKA pathway suppression. Fasting-mimicking diet (FMD) 3–5 days/month reduces CRP significantly; Brandhorst 2015 demonstrated IGF-1 reduction of 30% with monthly FMD cycles.',
        stat: 'IGF-1 −30%',
      },
    ],
  },
  {
    icon: '⚡',
    title: 'Metabolic Effects of Fasting',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.10)',
    accentBorder: 'rgba(245,158,11,0.28)',
    facts: [
      {
        citation: 'Mattson 2014 (Nat Rev Neurosci)',
        text: 'Metabolic switching occurs at 12–14h: blood ketones rise to 0.5–2.0 mmol/L. β-hydroxybutyrate (β-HB) acts as a signalling molecule: inhibits NLRP3 inflammasome, activates FOXO3 longevity transcription factor, and acts as an HDAC inhibitor modulating gene expression.',
        stat: 'β-HB 0.5–2.0 mM',
      },
      {
        citation: 'Sutton 2018 (Cell Metabolism)',
        text: '5-week early time-restricted eating (TRE 6:00–15:00) in pre-diabetic men: insulin sensitivity +38%, blood pressure reduced, oxidative stress reduced — all independent of weight loss. Circadian alignment of eating with the morning cortisol peak amplifies metabolic benefits significantly.',
        stat: 'Insulin sens +38%',
      },
      {
        citation: 'Varady 2013',
        text: 'Alternate-day fasting (ADF) vs daily caloric restriction: comparable weight loss (−5.7 vs −5.4 kg) with significantly better lean mass preservation in ADF. Produces automatic caloric deficit without daily tracking burden — adherence is comparable to standard CR.',
        stat: 'ADF −5.7 kg, CR −5.4 kg',
      },
      {
        citation: 'Longo 2016 (Cell Metabolism)',
        text: '5-day FMD monthly (750–1,100 kcal/day cycling protocol): −1.9 kg trunk fat, −15% IGF-1, −26% CRP. Regenerative effects arise from stem cell activation during the refeeding period — the re-feeding response is as important as the fasting period itself.',
        stat: 'CRP −26%',
      },
    ],
  },
  {
    icon: '🔬',
    title: 'Hormonal Response to Fasting',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Cahill 1970',
        text: 'Classic hormonal timeline: 0–4h: insulin↓, glucagon↑; 4–16h: GH rises 3× for protein sparing; 16–24h: GH peaks 5×, ketones rise, insulin at nadir; 24–72h: ketoadaptation, muscle proteolysis minimised. By day 3, ketones spare 50% of the brain\'s glucose requirement.',
        stat: 'GH 5× at 24h',
      },
      {
        citation: 'Ho 1988 (J Clin Endocrinol)',
        text: '24h fasting increases GH pulsatile secretion 5-fold. The GH↑/IGF-1↓ dissociation unique to fasting — where GH rises while IGF-1 falls — may have protective anti-aging effects distinct from GH therapy, which elevates both simultaneously.',
        stat: 'GH 5× / IGF-1↓',
      },
      {
        citation: 'Mosley 2013 (5:2 Diet RCT)',
        text: '5:2 vs daily caloric restriction: similar weight loss, but 5:2 produces greater insulin sensitization, greater IGF-1 reduction, and better lean mass retention. Triglycerides reduced 14% vs 9% with 5:2 vs CR. Intermittent fasting may provide hormonal benefits beyond simple energy restriction.',
        stat: 'TG −14% vs −9%',
      },
      {
        citation: 'Patterson 2017 (Ann Rev Nutr)',
        text: 'Circadian misalignment (late-night eating) increases insulin resistance 17%. A 12h overnight fast — stopping eating by 20:00 and not eating until 8:00 — improves metabolic syndrome markers regardless of total caloric intake. When you eat matters as much as what you eat.',
        stat: '12h fast = metabolic benefit',
      },
    ],
  },
  {
    icon: '📋',
    title: 'Evidence-Based Fasting Protocols',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        citation: 'Harris 2018 (NEJM)',
        text: 'Who benefits most: pre-diabetics and insulin-resistant individuals show the strongest benefit; metabolically healthy individuals show weight loss comparable to caloric restriction; athletes can safely use 12–14h overnight fasts; disordered eating history requires clinical supervision.',
        stat: 'Pre-diabetics: strongest effect',
      },
      {
        citation: 'Moro 2016 (J Transl Med)',
        text: '16:8 TRE in resistance-trained men (eating window 13:00–21:00, protein 1.8 g/kg/day): fat mass −16.4%, lean mass maintained, strength unchanged over 8 weeks. Muscle protein synthesis preserved with adequate daily protein — protein total matters more than timing within the window.',
        stat: 'Fat −16.4%, LBM maintained',
      },
      {
        citation: 'Tinsley 2019',
        text: 'Fasted aerobic exercise: fat oxidation +20–30% vs fed state; fasted resistance training: no impairment when glycogen stores are sufficient from previous meals. Post-exercise refeeding: 20–40g protein + carbohydrates within 30–60 minutes is critical for recovery regardless of feeding state.',
        stat: 'Fat ox +20–30%',
      },
      {
        citation: 'Mattson 2019 (NEJM)',
        text: '12-month RCT of 16:8: equivalent weight loss to caloric restriction, no adverse effects observed, no metabolic adaptation penalty. Contraindications: pregnant or nursing, type 1 diabetes on insulin, eating disorders (any history), BMI <18.5. Medical supervision recommended for any chronic condition.',
        stat: '12-month RCT: no adverse effects',
      },
    ],
  },
]

// ─── Hormone curve data (relative units 0–100) ────────────────────────────────
// Points: [0h, 4h, 8h, 12h, 16h, 24h, 48h]
const HORMONE_CURVES: { label: string; color: string; points: number[]; dash?: string }[] = [
  { label: 'Insulin', color: '#ef4444', points: [90, 70, 40, 20, 8, 5, 5] },
  { label: 'Glucose', color: '#f59e0b', points: [85, 72, 58, 50, 45, 42, 40] },
  { label: 'Ketones', color: '#a855f7', points: [2, 3, 5, 12, 28, 55, 85] },
  { label: 'Growth Hormone', color: '#3b82f6', points: [15, 12, 25, 40, 75, 100, 60], dash: '5,3' },
  { label: 'Autophagy', color: '#22c55e', points: [0, 0, 2, 8, 30, 70, 100], dash: '3,2' },
]

// ─── Helper: SVG polyline path from points ────────────────────────────────────
function buildPath(points: number[]): string {
  // 7 time points mapped to x positions across 100% width
  const xPositions = [0, 8, 16, 24, 33, 55, 100]
  const height = 80
  const coords = points.map((val, i) => {
    const x = (xPositions[i] / 100) * 400
    const y = height - (val / 100) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return coords.join(' ')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
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
        minWidth: 160,
      }}
    >
      <p
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: accent,
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
        <span style={{ fontSize: 18 }}>{icon}</span>
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
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
              <div style={{ height: 1, background: '#1a1a1a', marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FastingSciencePage() {
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
          background: 'linear-gradient(135deg, #0d0015 0%, #080010 50%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a1a',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glows */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 420,
            height: 420,
            background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '42%',
            width: 360,
            height: 360,
            background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '8%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
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
              marginBottom: 22,
            }}
          >
            {[
              { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', icon: '♻️' },
              { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', icon: '⚡' },
              { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', icon: '🔬' },
              { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', icon: '📋' },
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
              fontSize: 'clamp(30px, 6vw, 52px)',
              fontWeight: 900,
              margin: '0 0 14px',
              background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 45%, #3b82f6 75%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Fasting Science
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
            The cellular and metabolic science of intermittent fasting — autophagy,
            hormonal response, metabolic switching, and evidence-based protocols
          </p>

          {/* Tag row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Autophagy', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
              { label: 'Metabolic Effects', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
              { label: 'Hormonal Response', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
              { label: 'Protocols', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
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
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* ── Key numbers ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} accent={s.accent} />
          ))}
        </div>

        {/* ── Fasting protocols bar ──────────────────────────────────────────── */}
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
              background: 'rgba(168,85,247,0.08)',
              borderBottom: '1px solid rgba(168,85,247,0.2)',
              borderLeft: '3px solid #a855f7',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>⏱️</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Intermittent Fasting Protocols
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Most studied approaches — each with distinct hormonal and metabolic signatures
              </p>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FASTING_PROTOCOLS.map((p) => (
              <div key={p.name}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: p.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        background: p.bg,
                        border: `1px solid ${p.border}`,
                        borderRadius: 8,
                        padding: '4px 12px',
                      }}
                    >
                      {p.name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{p.desc}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: p.color,
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}35`,
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {p.subtitle}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#475569' }}>{p.detail}</span>
                </div>

                {/* 24h clock bar */}
                <div
                  style={{
                    height: 28,
                    background: '#0d0d0d',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid #1a1a1a',
                    display: 'flex',
                    position: 'relative',
                  }}
                >
                  {/* Fasting portion */}
                  <div
                    style={{
                      flex: p.fastHours,
                      background: `linear-gradient(90deg, ${p.color}40, ${p.color}70)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 800, color: p.color }}>
                      {p.name === '5:2' ? '2 fast days' : `${p.fastHours}h fasting`}
                    </span>
                  </div>
                  {/* Eating portion */}
                  <div
                    style={{
                      flex: p.totalHours - p.fastHours,
                      background: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>
                      {p.name === '5:2' ? '5 normal days' : `${p.totalHours - p.fastHours}h eating`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Visual fasting timeline ────────────────────────────────────────── */}
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
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
              borderLeft: '3px solid #f59e0b',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>📈</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                24–48h Fasting Timeline
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Hormones, glucose, ketones & autophagy — relative changes from last meal
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* SVG hormone curves */}
            <div
              style={{
                position: 'relative',
                background: '#0d0d0d',
                borderRadius: 10,
                border: '1px solid #1a1a1a',
                padding: '16px 12px 12px',
                marginBottom: 20,
                overflow: 'hidden',
              }}
            >
              {/* Y-axis labels */}
              <div style={{ position: 'absolute', left: 6, top: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 80, pointerEvents: 'none' }}>
                <span style={{ fontSize: 9, color: '#334155' }}>High</span>
                <span style={{ fontSize: 9, color: '#334155' }}>Low</span>
              </div>

              <svg
                viewBox="0 0 400 80"
                style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0, 20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1a1a1a" strokeWidth="0.5" />
                ))}
                {/* Time marker lines at 4h, 8h, 12h, 16h, 24h, 48h */}
                {[8, 16, 24, 33, 55].map((xPct, i) => (
                  <line
                    key={i}
                    x1={xPct * 4}
                    y1="0"
                    x2={xPct * 4}
                    y2="80"
                    stroke="#1f1f1f"
                    strokeWidth="0.8"
                    strokeDasharray="3,2"
                  />
                ))}
                {/* Hormone curves */}
                {HORMONE_CURVES.map((curve) => (
                  <polyline
                    key={curve.label}
                    points={buildPath(curve.points)}
                    fill="none"
                    stroke={curve.color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={curve.dash}
                    opacity="0.9"
                  />
                ))}
              </svg>

              {/* X-axis time labels */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  paddingLeft: 2,
                  paddingRight: 2,
                }}
              >
                {['0h', '4h', '8h', '12h', '16h', '24h', '48h'].map((t) => (
                  <span key={t} style={{ fontSize: 9, color: '#475569', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {t}
                  </span>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 10 }}>
                {HORMONE_CURVES.map((curve) => (
                  <div key={curve.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="22" height="10" style={{ flexShrink: 0 }}>
                      <line
                        x1="0"
                        y1="5"
                        x2="22"
                        y2="5"
                        stroke={curve.color}
                        strokeWidth="2"
                        strokeDasharray={curve.dash}
                      />
                    </svg>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{curve.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 10,
              }}
            >
              {FASTING_TIMELINE.map((phase) => (
                <div
                  key={phase.hour}
                  style={{
                    background: '#0d0d0d',
                    border: `1px solid ${phase.border}`,
                    borderLeft: `3px solid ${phase.color}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  {/* Phase header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: phase.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        background: phase.bg,
                        border: `1px solid ${phase.border}`,
                        borderRadius: 4,
                        padding: '2px 7px',
                      }}
                    >
                      {phase.hour}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: phase.color }}>{phase.label}</span>
                  </div>

                  {/* Metric pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {phase.events.map((ev) => (
                      <span
                        key={ev.metric}
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: ev.color,
                          background: `${ev.color}15`,
                          border: `1px solid ${ev.color}30`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ev.metric}: {ev.value}
                      </span>
                    ))}
                  </div>

                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {phase.note}
                  </p>
                </div>
              ))}
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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

        {/* ── mTOR / AMPK see-saw ────────────────────────────────────────────── */}
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
              background: 'rgba(168,85,247,0.08)',
              borderBottom: '1px solid rgba(168,85,247,0.2)',
              borderLeft: '3px solid #a855f7',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>⚖️</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                mTOR vs AMPK — The Cellular Switch
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Opposing energy sensors that govern autophagy, growth, and metabolism
              </p>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'stretch' }}>
            {/* mTOR side */}
            <div
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12,
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🔴</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#f87171', margin: 0 }}>mTOR</p>
                  <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>Active in fed state</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Promotes protein synthesis',
                  'Inhibits autophagy',
                  'Activated by insulin & amino acids',
                  'Drives cell growth & proliferation',
                  'Suppressed by fasting at 12–16h',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Central arrow */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                minWidth: 50,
              }}
            >
              <div style={{ fontSize: 20, color: '#f59e0b' }}>⇌</div>
              <span style={{ fontSize: 9, color: '#475569', textAlign: 'center', fontWeight: 700 }}>
                FASTING<br />SWITCH
              </span>
            </div>

            {/* AMPK side */}
            <div
              style={{
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 12,
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🔵</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', margin: 0 }}>AMPK</p>
                  <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>Active in fasted state</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Promotes autophagy & mitophagy',
                  'Inhibits mTOR signalling',
                  'Activated by low ATP / AMP ratio',
                  'Drives fat oxidation & ketogenesis',
                  'Peaks at 16–24h of fasting',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                    <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <div
            style={{
              margin: '0 20px 20px',
              padding: '10px 14px',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 12, color: '#fcd34d', margin: 0, lineHeight: 1.5 }}>
              <strong>The refeeding signal is essential:</strong> After fasting, mTOR re-activation through protein and carbohydrate intake drives muscle protein synthesis (MPS). The fast-refeed cycle — not fasting alone — creates the adaptations. Adequate daily protein (1.6–2.2 g/kg) preserves lean mass during TRE protocols (Levine 2019; Moro 2016).
            </p>
          </div>
        </div>

        {/* ── Quick Reference ────────────────────────────────────────────────── */}
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
            Quick Reference
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {[
              {
                icon: '⏰',
                title: '16:8 Starter',
                lines: ['Stop eating at 20:00', 'First meal at 12:00', 'Protein ≥1.6 g/kg/day'],
                color: '#a855f7',
              },
              {
                icon: '⚡',
                title: 'Autophagy Target',
                lines: ['16h minimum to initiate', '24h for significant flux', '48h for peak (Ohsumi 2016)'],
                color: '#f59e0b',
              },
              {
                icon: '🏋️',
                title: 'Athletes',
                lines: ['12–14h overnight fast safest', 'Post-workout: 20–40g protein', 'No fasted resistance training impairment'],
                color: '#3b82f6',
              },
              {
                icon: '💉',
                title: 'Insulin Benefit',
                lines: ['Early TRE (6:00–15:00) optimal', '+38% insulin sensitivity', 'Effect independent of weight loss'],
                color: '#22c55e',
              },
              {
                icon: '🧠',
                title: 'Brain Health',
                lines: ['β-HB inhibits NLRP3 inflammasome', 'Neuronal autophagy +2× at 24h', 'Clears tau, amyloid-β, α-syn'],
                color: '#06b6d4',
              },
              {
                icon: '🚫',
                title: 'Contraindications',
                lines: ['Pregnant / nursing', 'Type 1 DM on insulin', 'Eating disorder history', 'BMI <18.5'],
                color: '#ef4444',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.title}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {item.lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: item.color,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ketone metabolite callout ──────────────────────────────────────── */}
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
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
              borderLeft: '3px solid #f59e0b',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🔥</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                β-Hydroxybutyrate — Beyond Fuel
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Mattson 2014 (Nat Rev Neurosci) — β-HB as a signalling molecule
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {[
              {
                icon: '🛡️',
                label: 'NLRP3 Inhibition',
                desc: 'Suppresses the inflammasome — reduces IL-1β and IL-18 production, anti-inflammatory effect',
                color: '#f59e0b',
              },
              {
                icon: '🔑',
                label: 'FOXO3 Activation',
                desc: 'Activates longevity transcription factor — upregulates antioxidant and DNA repair pathways',
                color: '#a855f7',
              },
              {
                icon: '🧬',
                label: 'HDAC Inhibition',
                desc: 'Epigenetic effect: β-HB acts as an HDAC inhibitor, altering gene expression patterns toward stress resistance',
                color: '#3b82f6',
              },
              {
                icon: '🧠',
                label: 'Brain Fuel Sparing',
                desc: 'By day 3 of fasting, ketones supply ~50% of brain\'s energy needs, reducing glucose requirement significantly',
                color: '#22c55e',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: '#0d0d0d',
                  border: `1px solid ${item.color}25`,
                  borderRadius: 10,
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
