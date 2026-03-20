// ─── Data ─────────────────────────────────────────────────────────────────────

const MACRO_STATS = [
  {
    label: 'Protein',
    value: '1.6 g/kg',
    sub: 'daily target (Morton 2018)',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.10)',
    accentBorder: 'rgba(239,68,68,0.28)',
  },
  {
    label: 'Carbohydrates',
    value: '5–7 g/kg',
    sub: 'moderate-intensity training (Thomas 2016)',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
  },
  {
    label: 'Fat',
    value: '1–1.5 g/kg',
    sub: 'minimum for hormonal health',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
  },
]

const SCIENCE_CARDS = [
  {
    icon: '🥩',
    title: 'Protein Synthesis & Muscle Building',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.10)',
    accentBorder: 'rgba(239,68,68,0.28)',
    facts: [
      {
        citation: 'Moore 2009',
        text: '20 g of high-quality protein maximally stimulates muscle protein synthesis (MPS); leucine 2–3 g activates mTORC1 signaling; additional protein above ~0.4 g/kg per meal is oxidized rather than incorporated into muscle',
        stat: '20 g saturates MPS',
      },
      {
        citation: 'Stokes 2018',
        text: 'Spreading protein intake across 4 meals produces 25% more MPS than a bolus (single large dose); the muscle-full effect resets within 3–4 h, creating an anabolic window for the next dose',
        stat: '+25% MPS with 4 meals',
      },
      {
        citation: 'Morton 2018',
        text: 'Meta-analysis of 49 studies: optimal daily protein for hypertrophy is 1.62 g/kg/day (95% CI: 1.03–2.20 g/kg/day); protein intakes exceeding 2.2 g/kg/day confer no additional hypertrophic benefit',
        stat: '1.62 g/kg/day optimal',
      },
      {
        citation: 'Churchward-Venne 2012',
        text: 'Leucine content > PDCAAS > biological value as a predictor of anabolic response; plant proteins require ~20% more total to match leucine from animal sources; combining rice + pea approaches whey BCAA profile',
        stat: 'Plant needs +20% total',
      },
    ],
  },
  {
    icon: '🍞',
    title: 'Carbohydrate Metabolism & Performance',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Bergström 1967',
        text: 'Muscle glycogen stores 300–700 g + liver 75–100 g; depletion occurs at any intensity above 60% VO₂max; glycogen super-compensation raises stores 150–200% above normal baseline',
        stat: '375–800 g total glycogen',
      },
      {
        citation: 'Jentjens 2004',
        text: 'Multiple transportable CHO: SGLT1 saturates at 1.0 g/min; adding fructose (GLUT5) increases total oxidation to 1.75–1.8 g/min — a 75% improvement; optimal ratio is 2:1 glucose:fructose',
        stat: '1.8 g/min with 2:1 ratio',
      },
      {
        citation: 'Thomas 2016',
        text: 'ACSM/DC/AND carbohydrate periodization: train-low/compete-high; low-CHO sessions upregulate fat oxidation enzymes; CHO availability should be matched to session intensity for peak adaptation',
        stat: 'Train-low / compete-high',
      },
      {
        citation: 'Ivy 2002',
        text: 'Post-exercise glycogen resynthesis is fastest in the first 30–45 min; combine 1.0–1.2 g/kg/h CHO + 0.3 g/kg/h protein; caffeine + CHO co-ingestion increases resynthesis rate 66% vs. CHO alone',
        stat: '+66% with caffeine + CHO',
      },
    ],
  },
  {
    icon: '🥑',
    title: 'Fat Oxidation & Metabolic Flexibility',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        citation: 'Achten 2002',
        text: 'FatMax occurs at 45–65% VO₂max; trained athletes oxidize 0.6–0.9 g/min of fat vs. sedentary 0.3–0.4 g/min; regular endurance training effectively doubles fat oxidation capacity',
        stat: 'FatMax at 45–65% VO₂max',
      },
      {
        citation: 'Burke 2020',
        text: 'Chronic high-fat diet (>60% energy from fat) impairs high-intensity performance — PDH is down-regulated, impairing CHO flux; the FACO protocol preserves fat oxidation while restoring glycogen availability',
        stat: 'PDH impaired >60% fat diet',
      },
      {
        citation: 'Volek 2016',
        text: 'FASTER study: LCHF-adapted ultra-endurance runners oxidized 2.3× more fat (1.54 vs 0.67 g/min) at race pace compared to high-CHO peers; high-intensity power output was not impaired after full adaptation',
        stat: '2.3× fat oxidation LCHF',
      },
      {
        citation: 'Spriet 2014',
        text: 'Caffeine (3–6 mg/kg body mass) ingested 60 min pre-exercise increases fat oxidation by 15% and spares muscle glycogen; tolerance develops with daily use — a 7-day washout period restores the ergogenic effect',
        stat: 'Caffeine +15% fat oxidation',
      },
    ],
  },
  {
    icon: '⏱',
    title: 'Nutrient Timing & Recovery',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.10)',
    accentBorder: 'rgba(168,85,247,0.28)',
    facts: [
      {
        citation: 'Aragon 2013',
        text: 'Meta-analysis: post-exercise anabolic window is 3–6 h — not 30 min; pre-sleep casein (40 g) increases overnight MPS by 22% and improves 12-week resistance training adaptations vs. placebo',
        stat: '40 g casein +22% MPS',
      },
      {
        citation: 'Thomas 2016',
        text: '2% body mass dehydration meaningfully impairs aerobic performance and cognition; sodium ≥500 mg/L in fluids maintains plasma volume; glycerol 1.2 g/kg pre-exercise expands plasma volume by ~10%',
        stat: '−2% mass = impaired perf.',
      },
      {
        citation: 'Maughan 2018',
        text: 'IOC Consensus — strong evidence: caffeine 3–6 mg/kg; creatine 3–5 g/day; nitrates 0.5–1 L beetroot juice (6.5% performance improvement); beta-alanine 3.2–6.4 g/day for ≥4 weeks; antioxidant megadoses blunt training adaptations',
        stat: 'Nitrates +6.5% performance',
      },
      {
        citation: 'Howatson 2012',
        text: 'Tart cherry juice (480 mL twice daily) reduces DOMS by 23% and creatine kinase (CK) by 18%; omega-3 supplementation (2–3 g EPA+DHA/day) reduces DOMS magnitude and accelerates strength recovery',
        stat: 'Cherry −23% DOMS',
      },
    ],
  },
]

const MEAL_SLOTS = [
  {
    label: 'Breakfast',
    time: '07:00',
    exampleFoods: '3 eggs + 200g Greek yogurt',
    proteinG: 40,
    color: '#f97316',
    lightColor: 'rgba(249,115,22,0.18)',
    borderColor: 'rgba(249,115,22,0.38)',
  },
  {
    label: 'Lunch',
    time: '12:30',
    exampleFoods: '150g chicken breast + legumes',
    proteinG: 40,
    color: '#3b82f6',
    lightColor: 'rgba(59,130,246,0.18)',
    borderColor: 'rgba(59,130,246,0.38)',
  },
  {
    label: 'Post-Workout',
    time: '17:30',
    exampleFoods: 'Whey shake + milk',
    proteinG: 40,
    color: '#ef4444',
    lightColor: 'rgba(239,68,68,0.18)',
    borderColor: 'rgba(239,68,68,0.38)',
  },
  {
    label: 'Dinner',
    time: '20:00',
    exampleFoods: '200g salmon + cottage cheese',
    proteinG: 44,
    color: '#a855f7',
    lightColor: 'rgba(168,85,247,0.18)',
    borderColor: 'rgba(168,85,247,0.38)',
  },
]

const SUPPLEMENT_TIERS = [
  {
    tier: 'Strong Evidence',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.22)',
    items: ['Caffeine 3–6 mg/kg', 'Creatine 3–5 g/day', 'Beetroot / nitrates', 'Beta-alanine 3.2–6.4 g/day'],
  },
  {
    tier: 'Moderate Evidence',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
    items: ['Omega-3 EPA+DHA 2–3 g/day', 'Tart cherry juice 480 mL ×2', 'Pre-sleep casein 40 g', 'Glycerol 1.2 g/kg pre-exercise'],
  },
  {
    tier: 'Use With Caution',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.22)',
    items: ['Antioxidant megadoses (blunt adaptation)', 'BCAA alone (redundant with whole protein)', 'Protein >2.2 g/kg/day (no extra gain)', 'Chronic LCHF without carb-back (PDH)'],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroStatCard({
  label,
  value,
  sub,
  accent,
  accentBg,
  accentBorder,
}: {
  label: string
  value: string
  sub: string
  accent: string
  accentBg: string
  accentBorder: string
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: `1px solid ${accentBorder}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '20px 18px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 180,
      }}
    >
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 4px' }}>{label}</p>
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
      {/* Card header */}
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>{icon}</span>
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
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  marginTop: 1,
                  background: `${accent}18`,
                  border: `1px solid ${accent}35`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  whiteSpace: 'nowrap',
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
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              {fact.text}
            </p>
            {i < facts.length - 1 && (
              <div style={{ height: 1, background: '#1a1a1a', marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionSciencePage() {
  const BODY_MASS_KG = 75
  const totalProtein = MEAL_SLOTS.reduce((sum, m) => sum + m.proteinG, 0)
  const perKg = (totalProtein / BODY_MASS_KG).toFixed(2)
  const maxProtein = Math.max(...MEAL_SLOTS.map((m) => m.proteinG))

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
          background: 'linear-gradient(135deg, #140008 0%, #060e1a 45%, #081408 80%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a1a',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '10%',
            width: 380,
            height: 380,
            background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '38%',
            width: 360,
            height: 360,
            background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '8%',
            width: 360,
            height: 360,
            background: 'radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 500,
            height: 200,
            background: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)',
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
              { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', icon: '🥩' },
              { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', icon: '🍞' },
              { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', icon: '🥑' },
              { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', icon: '⏱' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
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
              background:
                'linear-gradient(135deg, #ef4444 0%, #f97316 25%, #3b82f6 55%, #22c55e 80%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Nutrition Science
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#94a3b8',
              margin: '0 auto 22px',
              maxWidth: 580,
              lineHeight: 1.65,
            }}
          >
            The evidence base for performance nutrition — protein synthesis, carbohydrate
            metabolism, fat oxidation, and evidence-graded supplementation
          </p>

          {/* Topic tags */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Protein & MPS', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.30)' },
              { label: 'Carb Metabolism', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.30)' },
              { label: 'Fat Oxidation', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.30)' },
              { label: 'Nutrient Timing', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.30)' },
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
          padding: '32px 16px 88px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* ── Macro stats bar ───────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#e2e8f0',
                margin: 0,
                letterSpacing: '-0.2px',
              }}
            >
              Daily Macro Targets
            </h2>
            <span
              style={{
                fontSize: 11,
                color: '#475569',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                background: '#111111',
                border: '1px solid #1f1f1f',
                borderRadius: 6,
                padding: '3px 8px',
              }}
            >
              per kg body mass · evidence-based guidelines
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {MACRO_STATS.map((s) => (
              <MacroStatCard
                key={s.label}
                label={s.label}
                value={s.value}
                sub={s.sub}
                accent={s.accent}
                accentBg={s.accentBg}
                accentBorder={s.accentBorder}
              />
            ))}
          </div>
        </div>

        {/* ── Macro proportion bar ──────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 22px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Macronutrient Energy Distribution
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Illustrative split for a moderate-intensity training day at 75 kg body mass
          </p>

          {/* Stacked proportion bar */}
          <div
            style={{
              height: 28,
              display: 'flex',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                flex: 25,
                background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Protein 25%</span>
            </div>
            <div
              style={{
                flex: 50,
                background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Carbs 50%</span>
            </div>
            <div
              style={{
                flex: 25,
                background: 'linear-gradient(90deg, #15803d, #22c55e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Fat 25%</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { color: '#ef4444', label: 'Protein', note: '1.62 g/kg × 75 kg = 122 g = ~488 kcal' },
              { color: '#3b82f6', label: 'Carbs', note: '6 g/kg × 75 kg = 450 g = ~1800 kcal' },
              { color: '#22c55e', label: 'Fat', note: '1.2 g/kg × 75 kg = 90 g = ~810 kcal' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: item.color,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{item.label}</span>
                  <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science cards ─────────────────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 15,
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

        {/* ── Protein-per-meal optimizer ─────────────────────────────────────── */}
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
              borderBottom: '1px solid rgba(239,68,68,0.20)',
              borderLeft: '3px solid #ef4444',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 3px' }}>
                Protein-Per-Meal Optimizer
              </h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                Stokes 2018 · Moore 2009 — 4-meal distribution at 0.4 g/kg per dose · 75 kg example
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexShrink: 0,
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#ef4444',
                    margin: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {totalProtein} g
                </p>
                <p style={{ fontSize: 10, color: '#475569', margin: '1px 0 0' }}>total daily protein</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#f97316',
                    margin: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {perKg} g/kg
                </p>
                <p style={{ fontSize: 10, color: '#475569', margin: '1px 0 0' }}>per kg body mass</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {MEAL_SLOTS.map((meal) => {
              const barWidthPct = (meal.proteinG / (maxProtein + 10)) * 100
              return (
                <div key={meal.label}>
                  {/* Meal header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Colored meal badge */}
                      <div
                        style={{
                          background: meal.lightColor,
                          border: `1px solid ${meal.borderColor}`,
                          borderRadius: 8,
                          padding: '4px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: meal.color,
                          }}
                        >
                          {meal.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: meal.color,
                            opacity: 0.7,
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          }}
                        >
                          {meal.time}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{meal.exampleFoods}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: meal.color,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {meal.proteinG}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>g protein</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#334155',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          marginLeft: 4,
                        }}
                      >
                        ({(meal.proteinG / BODY_MASS_KG).toFixed(2)} g/kg)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 10,
                      background: '#0f0f0f',
                      borderRadius: 999,
                      overflow: 'hidden',
                      border: '1px solid #1a1a1a',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidthPct}%`,
                        background: `linear-gradient(90deg, ${meal.color}aa, ${meal.color})`,
                        borderRadius: 999,
                        boxShadow: `0 0 8px ${meal.color}55`,
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {/* MPS threshold reference line note */}
            <div
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.20)',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>📌</span>
              <div>
                <p style={{ fontSize: 12, color: '#fca5a5', margin: '0 0 4px', fontWeight: 600 }}>
                  Why 4 meals at ~40 g?
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                  Moore 2009 established ~20 g as the minimum to maximally stimulate MPS; Stokes 2018 showed
                  the muscle-full effect resets within 3–4 h. At 75 kg, 0.4 g/kg × 4 meals delivers{' '}
                  <span
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: '#ef4444',
                      fontWeight: 700,
                    }}
                  >
                    {totalProtein} g/day ({perKg} g/kg)
                  </span>
                  {' '}— near the Morton 2018 optimum of 1.62 g/kg. Pre-sleep casein (Aragon 2013) can
                  substitute the dinner slot to extend overnight MPS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Carbohydrate periodization visual ─────────────────────────────── */}
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
              borderBottom: '1px solid rgba(59,130,246,0.20)',
              borderLeft: '3px solid #3b82f6',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 3px' }}>
              CHO Availability by Session Type
            </h3>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              Thomas 2016 (ACSM/DC/AND) carbohydrate periodization framework
            </p>
          </div>

          <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Easy / Recovery', intensity: 'Low', cho: '3–5 g/kg', fill: 35, note: 'Train-low — upregulates fat enzymes', color: '#22c55e' },
              { label: 'Moderate Aerobic', intensity: 'Moderate', cho: '5–7 g/kg', fill: 55, note: 'Balanced — matched to demand', color: '#3b82f6' },
              { label: 'Threshold / Race', intensity: 'High', cho: '7–10 g/kg', fill: 80, note: 'Compete-high — full glycogen stores', color: '#f97316' },
              { label: 'Super-compensation', intensity: 'Pre-race', cho: '10–12 g/kg', fill: 100, note: 'Bergström 1967 — +150–200% stores', color: '#ef4444' },
            ].map((row) => (
              <div key={row.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 5,
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{row.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: row.color,
                        background: `${row.color}18`,
                        border: `1px solid ${row.color}35`,
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontWeight: 600,
                      }}
                    >
                      {row.intensity}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{row.note}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: row.color,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      flexShrink: 0,
                    }}
                  >
                    {row.cho}
                  </span>
                </div>
                <div
                  style={{
                    height: 7,
                    background: '#0f0f0f',
                    borderRadius: 999,
                    overflow: 'hidden',
                    border: '1px solid #1a1a1a',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${row.fill}%`,
                      background: `linear-gradient(90deg, ${row.color}88, ${row.color})`,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Supplement evidence tiers ──────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#e2e8f0',
              margin: '0 0 16px',
              letterSpacing: '-0.2px',
            }}
          >
            Supplement Evidence Tiers
          </h2>
          <p style={{ fontSize: 12, color: '#475569', margin: '-10px 0 16px' }}>
            Maughan 2018 IOC Consensus Statement classification
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
            }}
          >
            {SUPPLEMENT_TIERS.map((tier) => (
              <div
                key={tier.tier}
                style={{
                  background: tier.bg,
                  border: `1px solid ${tier.border}`,
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: tier.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: tier.color,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {tier.tier}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tier.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: tier.color,
                          flexShrink: 0,
                          marginTop: 1,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        ›
                      </span>
                      <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Key mechanisms footer ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12,
          }}
        >
          {[
            {
              icon: '🔬',
              title: 'mTORC1',
              desc: 'Master regulator of muscle protein synthesis — activated by leucine (2–3 g threshold) and insulin; downstream of Akt/PKB pathway',
              color: '#ef4444',
            },
            {
              icon: '🚂',
              title: 'SGLT1 / GLUT5',
              desc: 'Intestinal glucose (SGLT1) and fructose (GLUT5) co-transporters; using both in 2:1 ratio raises CHO oxidation ceiling from 1.0 to 1.8 g/min',
              color: '#3b82f6',
            },
            {
              icon: '🔥',
              title: 'PDH Regulation',
              desc: 'Pyruvate dehydrogenase gates glycolysis flux into TCA cycle; chronic LCHF diet down-regulates PDH and impairs high-intensity CHO combustion',
              color: '#22c55e',
            },
            {
              icon: '🍒',
              title: 'Anthocyanins',
              desc: 'Tart cherry polyphenols inhibit COX-1 and COX-2 pathways — similar to ibuprofen — reducing exercise-induced inflammation and DOMS by 23%',
              color: '#a855f7',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: item.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {item.title}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Disclaimer ────────────────────────────────────────────────────── */}
        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: 10,
            padding: '14px 18px',
          }}
        >
          <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>Research summary only.</span>{' '}
            Values represent averages from cited studies and may differ by individual, training status, and
            sport. Consult a registered sports dietitian for personalized nutrition protocols. Citations:
            Moore et al. 2009 (AJCN) · Stokes et al. 2018 (Nutr Rev) · Morton et al. 2018 (BJSM) ·
            Churchward-Venne et al. 2012 (AJCN) · Bergström et al. 1967 (Acta Physiol Scand) ·
            Jentjens et al. 2004 (J Appl Physiol) · Thomas et al. 2016 (MSSE) · Ivy et al. 2002 (IJSNEM) ·
            Achten &amp; Jeukendrup 2002 (MSSE) · Burke et al. 2020 (J Physiol) · Volek et al. 2016 (Metabolism) ·
            Spriet 2014 (Sports Med) · Aragon &amp; Schoenfeld 2013 (JISSN) · Maughan et al. 2018 (BJSM) ·
            Howatson et al. 2012 (Scand J Med Sci Sports)
          </p>
        </div>

      </main>
    </div>
  )
}
