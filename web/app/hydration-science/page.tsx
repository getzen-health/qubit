// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: '2% BW Loss',
    value: '2–4%',
    sub: 'aerobic performance drop',
    accent: '#3b82f6',
  },
  {
    label: 'Sweat Rate',
    value: '0.5–2.5',
    sub: 'litres per hour',
    accent: '#06b6d4',
  },
  {
    label: 'Sodium in Sweat',
    value: '460–1840',
    sub: 'mg per litre',
    accent: '#8b5cf6',
  },
]

const DEHYDRATION_LEVELS = [
  {
    bwLoss: '0%',
    label: 'Euhydrated',
    perfImpact: 'Baseline',
    impactPct: 0,
    color: '#22c55e',
    detail: 'Optimal physiological function',
  },
  {
    bwLoss: '1%',
    label: 'Mild',
    perfImpact: 'Marginal impairment',
    impactPct: 1,
    color: '#84cc16',
    detail: 'Cognitive impairment begins; thirst not yet perceived',
  },
  {
    bwLoss: '1.5%',
    label: 'Cognitive threshold',
    perfImpact: 'Cognitive ↓',
    impactPct: 4,
    color: '#eab308',
    detail: 'Mood, concentration, and working memory decline',
  },
  {
    bwLoss: '2%',
    label: 'Moderate',
    perfImpact: '2–4% aerobic ↓',
    impactPct: 4,
    color: '#f97316',
    detail: 'Sawka 2007 (ACSM): measurable aerobic performance reduction',
  },
  {
    bwLoss: '3%',
    label: 'Significant',
    perfImpact: '6–8% aerobic ↓',
    impactPct: 8,
    color: '#ef4444',
    detail: 'Core temperature elevates; heart rate drift accelerates',
  },
  {
    bwLoss: '5%',
    label: 'Severe',
    perfImpact: 'Heat exhaustion risk',
    impactPct: 20,
    color: '#dc2626',
    detail: 'Heat exhaustion likely; plasma volume critically reduced',
  },
  {
    bwLoss: '8%+',
    label: 'Dangerous',
    perfImpact: 'Heat stroke risk',
    impactPct: 30,
    color: '#991b1b',
    detail: 'Life-threatening; immediate medical attention required',
  },
]

const URINE_COLORS = [
  {
    point: 1,
    color: '#fefce8',
    label: 'Pale straw',
    status: 'Optimal',
    statusColor: '#22c55e',
    desc: 'Well hydrated',
  },
  {
    point: 2,
    color: '#fef9c3',
    label: 'Straw',
    status: 'Optimal',
    statusColor: '#22c55e',
    desc: 'Well hydrated',
  },
  {
    point: 3,
    color: '#fef08a',
    label: 'Pale yellow',
    status: 'Good',
    statusColor: '#84cc16',
    desc: 'Adequately hydrated',
  },
  {
    point: 4,
    color: '#fde047',
    label: 'Yellow',
    status: 'Acceptable',
    statusColor: '#eab308',
    desc: 'Slightly dehydrated',
  },
  {
    point: 5,
    color: '#facc15',
    label: 'Dark yellow',
    status: 'Caution',
    statusColor: '#f97316',
    desc: 'Dehydrated — drink now',
  },
  {
    point: 6,
    color: '#ca8a04',
    label: 'Amber',
    status: 'Dehydrated',
    statusColor: '#ef4444',
    desc: 'Significantly dehydrated',
  },
  {
    point: 7,
    color: '#92400e',
    label: 'Orange-brown',
    status: 'Very dehydrated',
    statusColor: '#dc2626',
    desc: 'Severely dehydrated',
  },
  {
    point: 8,
    color: '#78350f',
    label: 'Brown',
    status: 'Danger',
    statusColor: '#991b1b',
    desc: 'Extreme dehydration / rhabdomyolysis risk',
  },
]

const SCIENCE_CARDS = [
  {
    icon: '💧',
    title: 'Hydration & Exercise Performance',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Sawka 2007 (ACSM)',
        text: '1% BW loss = marginal impairment; 2% = 2–4% aerobic reduction; 3% = 6–8% reduction; 5% = heat exhaustion risk. Cognitive impairment begins at 1.5% — a lower threshold than physical performance loss.',
        stat: '2% BW → 2–4% drop',
      },
      {
        citation: 'Cheuvront 2003',
        text: 'Sweat rate ranges 0.5–2.5 L/h depending on intensity, environment, and acclimatization status. Heat-acclimatized athletes produce more dilute sweat at higher volumes. Electrolyte losses: sodium 460–1,840 mg/L, potassium 160–480 mg/L.',
        stat: 'Na⁺ 460–1,840 mg/L',
      },
      {
        citation: 'Kenefick 2012',
        text: 'Thirst lags behind the actual fluid deficit by ~30 min and underestimates need by 20–40%. Older adults show blunted thirst sensation. Programmed drinking (scheduled intervals) is superior to thirst-driven intake for athletic performance.',
        stat: 'Thirst lags 30 min',
      },
      {
        citation: 'Montain 1992',
        text: 'Glycerol hyperhydration protocol: 1.2 g/kg glycerol + 26 mL/kg fluid 2h pre-exercise expands plasma volume by ~10% and reduces core temperature rise by 0.3°C during subsequent exercise.',
        stat: 'Plasma vol +10%',
      },
    ],
  },
  {
    icon: '🔬',
    title: 'Cellular Physiology of Hydration',
    accent: '#06b6d4',
    accentBg: 'rgba(6,182,212,0.10)',
    accentBorder: 'rgba(6,182,212,0.28)',
    facts: [
      {
        citation: 'Acker 2012',
        text: 'Total body water: 60% of body mass in men, 55% in women. Intracellular fluid (ICF) = 65%; extracellular fluid (ECF) = 35%. Plasma volume is the most rapidly affected compartment — decreasing within 15 min of exercise onset.',
        stat: 'TBW 60% (men), 55% (women)',
      },
      {
        citation: 'Nose 1988',
        text: '60% of a fluid deficit is restored within 30 min of drinking; full restoration takes 24–48h. A 10% plasma volume decrease reduces cardiac output by ~1 L/min and peak power by 5–8%.',
        stat: 'Full restore 24–48h',
      },
      {
        citation: 'Mohr 2010',
        text: 'Cell swelling acts as an anabolic signal — it promotes protein synthesis via mTOR pathway activation. Dehydrated cells activate catabolic pathways. Hydration status meaningfully influences body composition adaptations and recovery quality.',
        stat: 'mTOR anabolic signal',
      },
      {
        citation: 'Popkin 2010',
        text: 'Chronic mild dehydration: urine osmolality >500 mOsm/kg is associated with increased risk of kidney stones and UTIs. Morning urine color chart — pale straw (score 1–3) = optimal hydration status.',
        stat: '>500 mOsm/kg = risk',
      },
    ],
  },
  {
    icon: '⚗️',
    title: 'Electrolytes & Osmotic Balance',
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.10)',
    accentBorder: 'rgba(139,92,246,0.28)',
    facts: [
      {
        citation: 'Hew-Butler 2015 (IOC)',
        text: 'Exercise-associated hyponatremia (EAH): serum sodium <135 mmol/L caused by excessive hypotonic fluid intake (>1 L/h) in events >4h. Treatment is fluid restriction + hypertonic saline — NOT additional water, which worsens the condition.',
        stat: 'EAH Na⁺ <135 mmol/L',
      },
      {
        citation: 'Coyle 2004',
        text: 'Sodium ≥500 mg/L in drinks stimulates thirst 40% more, reduces urine output by 50%, and retains 60% more fluid vs. plain water. ORS is optimized at 75–90 mmol/L sodium; most commercial athlete formulas deliver 20–30 mmol/L.',
        stat: 'Na⁺ +40% thirst drive',
      },
      {
        citation: 'Maughan 2004 + Miller 2010',
        text: 'Muscle cramps arise primarily from altered neuromuscular control due to fatigue, not simple electrolyte deficit alone. Pickle juice resolves cramps in ~85 seconds via a pharyngeal neural reflex mechanism, faster than electrolytes could be absorbed.',
        stat: 'Pickle juice: 85 sec',
      },
      {
        citation: 'Sawka 2012',
        text: 'Sports drinks with 6–8% CHO concentration are optimal for gastric emptying rate and intestinal absorption. Sodium facilitates glucose co-transport via the SGLT1 transporter mechanism, boosting both fluid and energy delivery simultaneously.',
        stat: '6–8% CHO optimal',
      },
    ],
  },
  {
    icon: '📋',
    title: 'Evidence-Based Hydration Protocols',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        citation: 'McDermott 2017 (NATA)',
        text: 'Pre-exercise hydration: 5–7 mL/kg 4h before; if urine is dark, add 3–5 mL/kg 2h before. Avoid excessive caffeine and alcohol ≥12h prior in hot conditions, as both increase baseline fluid deficit.',
        stat: '5–7 mL/kg, 4h pre',
      },
      {
        citation: 'Thomas 2016 (ACSM/DC/AND)',
        text: 'During exercise: 150–250 mL every 15–20 min. Events >1h: sports drink with 30–60 g CHO/h plus 0.5–0.7 g/L sodium. Personalize intake rate using an individual sweat rate test (pre/post body mass comparison).',
        stat: '150–250 mL / 15–20 min',
      },
      {
        citation: 'Shirreffs 2004',
        text: 'Post-exercise rehydration: restore 150% of fluid deficit over 4h using a beverage containing 500–700 mg/L sodium. Milk outperforms sports drinks for rehydration due to its combined electrolyte and protein content.',
        stat: '150% deficit × 4h',
      },
      {
        citation: 'Armstrong 2012',
        text: 'Caffeine at ≤400 mg/day does NOT cause clinically meaningful dehydration in habitual users, who develop complete tolerance. Acute large doses (>500 mg) transiently increase urine output ~25% for 1–2h, but net fluid balance remains neutral.',
        stat: '≤400 mg/day = neutral',
      },
    ],
  },
]

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

export default function HydrationSciencePage() {
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
          background: 'linear-gradient(135deg, #020d1a 0%, #030a14 50%, #0a0a0a 100%)',
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
            top: '30%',
            left: '15%',
            width: 380,
            height: 380,
            background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '45%',
            width: 380,
            height: 380,
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '8%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
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
              { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', icon: '💧' },
              { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.35)', icon: '🔬' },
              { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', icon: '⚗️' },
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 45%, #8b5cf6 80%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Hydration Science
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
            Fluid physiology, electrolyte balance, and the evidence base behind
            hydration for exercise performance and recovery
          </p>

          {/* Tag row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Fluid Physiology', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
              { label: 'Electrolytes', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)' },
              { label: 'Osmotic Balance', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
              { label: 'Performance', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
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

        {/* ── Dehydration severity chart ─────────────────────────────────────── */}
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
            <span style={{ fontSize: 16 }}>📉</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Dehydration Severity & Performance Impact
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Sawka 2007 (ACSM Position Stand) — % body weight fluid loss vs. physiological consequence
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEHYDRATION_LEVELS.map((level) => (
              <div key={level.bwLoss}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: level.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        background: `${level.color}18`,
                        border: `1px solid ${level.color}40`,
                        borderRadius: 5,
                        padding: '2px 7px',
                        flexShrink: 0,
                        minWidth: 36,
                        textAlign: 'center',
                      }}
                    >
                      {level.bwLoss}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: level.color }}>{level.label}</span>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'none' }}>{level.detail}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: level.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {level.perfImpact}
                    </span>
                  </div>
                </div>
                {/* Detail text */}
                <p style={{ fontSize: 11, color: '#475569', margin: '0 0 6px 0', paddingLeft: 2 }}>
                  {level.detail}
                </p>
                {/* Visual bar — normalized to a max severity */}
                <div
                  style={{
                    height: 8,
                    background: '#0f0f0f',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: level.bwLoss === '0%' ? '4%' : `${Math.min((level.impactPct / 30) * 100 + 8, 100)}%`,
                      background: `linear-gradient(90deg, ${level.color}88, ${level.color})`,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Sweat electrolyte losses callout */}
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                background: 'rgba(6,182,212,0.07)',
                border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: 10,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 16 }}>🧂</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#67e8f9', margin: '0 0 4px' }}>
                  Sweat Electrolyte Profile (Cheuvront 2003)
                </p>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { ion: 'Sodium (Na⁺)', range: '460–1,840 mg/L', color: '#3b82f6' },
                    { ion: 'Potassium (K⁺)', range: '160–480 mg/L', color: '#8b5cf6' },
                    { ion: 'Chloride (Cl⁻)', range: '710–2,840 mg/L', color: '#06b6d4' },
                  ].map((el) => (
                    <div key={el.ion} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: el.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{el.ion}</span>{' '}
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: el.color, fontWeight: 700 }}>
                          {el.range}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

        {/* ── Urine color guide ──────────────────────────────────────────────── */}
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
              background: 'rgba(234,179,8,0.08)',
              borderBottom: '1px solid rgba(234,179,8,0.2)',
              borderLeft: '3px solid #eab308',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🔍</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Urine Color Hydration Guide
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Armstrong 8-point scale — Popkin 2010: morning first-void optimal indicator of daily hydration status
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* Color strip */}
            <div
              style={{
                display: 'flex',
                height: 28,
                borderRadius: 10,
                overflow: 'hidden',
                marginBottom: 16,
                border: '1px solid #2a2a2a',
              }}
            >
              {URINE_COLORS.map((u) => (
                <div
                  key={u.point}
                  style={{
                    flex: 1,
                    background: u.color,
                    position: 'relative',
                  }}
                  title={`${u.point}: ${u.label}`}
                />
              ))}
            </div>

            {/* Individual rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {URINE_COLORS.map((u) => (
                <div
                  key={u.point}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Color swatch + number */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, width: 90 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: u.color,
                        border: '1px solid rgba(255,255,255,0.1)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#64748b',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      #{u.point} {u.label}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: u.statusColor,
                      background: `${u.statusColor}18`,
                      border: `1px solid ${u.statusColor}35`,
                      borderRadius: 4,
                      padding: '2px 7px',
                      flexShrink: 0,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      letterSpacing: '0.02em',
                      minWidth: 88,
                      textAlign: 'center',
                    }}
                  >
                    {u.status}
                  </span>

                  {/* Description */}
                  <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{u.desc}</span>
                </div>
              ))}
            </div>

            {/* Tip callout */}
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 8,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 14 }}>✅</span>
              <p style={{ fontSize: 12, color: '#86efac', margin: 0, lineHeight: 1.5 }}>
                <strong>Target:</strong> First morning void should be pale straw (score 1–3) for optimal hydration status. Urine osmolality &gt;500 mOsm/kg indicates chronic under-hydration and elevated kidney stone risk (Popkin 2010).
              </p>
            </div>
          </div>
        </div>

        {/* ── Protocol summary cards ─────────────────────────────────────────── */}
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
                title: 'Pre-Exercise',
                lines: ['5–7 mL/kg, 4h before', 'If dark urine +3–5 mL/kg', 'Avoid alcohol ≥12h prior'],
                color: '#3b82f6',
              },
              {
                icon: '🏃',
                title: 'During Exercise',
                lines: ['150–250 mL / 15–20 min', '>1h: 30–60 g CHO/h', '0.5–0.7 g/L sodium in drink'],
                color: '#06b6d4',
              },
              {
                icon: '🔄',
                title: 'Post-Exercise',
                lines: ['150% of deficit over 4h', '500–700 mg/L sodium', 'Milk > sports drink'],
                color: '#22c55e',
              },
              {
                icon: '☕',
                title: 'Caffeine',
                lines: ['≤400 mg/day = no dehydration', 'Habitual users: full tolerance', 'Net fluid balance neutral'],
                color: '#8b5cf6',
              },
              {
                icon: '🧂',
                title: 'Hyponatremia Alert',
                lines: ['Do not drink >1 L/h', 'Events >4h: sodium drinks', 'EAH: restrict fluid, NOT water'],
                color: '#ef4444',
              },
              {
                icon: '💡',
                title: 'Sweat Rate Test',
                lines: ['Weigh pre & post exercise', '1 kg loss ≈ 1 L deficit', 'Add fluid consumed to total'],
                color: '#f59e0b',
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
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: item.color,
                    }}
                  >
                    {item.title}
                  </span>
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

        {/* ── Body water compartments diagram ───────────────────────────────── */}
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
              background: 'rgba(6,182,212,0.08)',
              borderBottom: '1px solid rgba(6,182,212,0.2)',
              borderLeft: '3px solid #06b6d4',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🧬</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Body Water Compartments
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Acker 2012 — distribution of total body water in a 70 kg male (~42 L total)
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* Total body water bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Total Body Water</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#06b6d4',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  60% of body mass (men) · 55% (women)
                </span>
              </div>
              <div
                style={{
                  height: 36,
                  display: 'flex',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #2a2a2a',
                }}
              >
                {/* ICF 65% */}
                <div
                  style={{
                    flex: 65,
                    background: 'linear-gradient(90deg, #1e3a5f, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#93c5fd' }}>ICF</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#60a5fa',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    65%
                  </span>
                </div>
                {/* ECF — plasma 8% */}
                <div
                  style={{
                    flex: 8,
                    background: 'linear-gradient(90deg, #0e7490, #0891b2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#a5f3fc' }}>PV</span>
                </div>
                {/* ECF — interstitial 20% */}
                <div
                  style={{
                    flex: 20,
                    background: 'linear-gradient(90deg, #155e75, #0e7490)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#67e8f9' }}>Interstitial</span>
                </div>
                {/* ECF — other 7% */}
                <div
                  style={{
                    flex: 7,
                    background: '#164e63',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#a5f3fc' }}>Other</span>
                </div>
              </div>
            </div>

            {/* Compartment details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 10,
              }}
            >
              {[
                {
                  name: 'Intracellular Fluid (ICF)',
                  pct: '65%',
                  vol: '~27 L',
                  color: '#3b82f6',
                  note: 'K⁺, Mg²⁺, proteins dominant',
                },
                {
                  name: 'Interstitial Fluid',
                  pct: '20%',
                  vol: '~8.4 L',
                  color: '#06b6d4',
                  note: 'Na⁺, Cl⁻, HCO₃⁻ dominant',
                },
                {
                  name: 'Plasma Volume (PV)',
                  pct: '8%',
                  vol: '~3.4 L',
                  color: '#0891b2',
                  note: 'Most rapidly affected by exercise',
                },
                {
                  name: 'Other ECF',
                  pct: '7%',
                  vol: '~2.9 L',
                  color: '#164e63',
                  note: 'CSF, lymph, transcellular',
                },
              ].map((comp) => (
                <div
                  key={comp.name}
                  style={{
                    background: '#0d0d0d',
                    border: `1px solid ${comp.color}30`,
                    borderRadius: 10,
                    padding: '12px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: comp.color }}>{comp.name}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: comp.color,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {comp.pct}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>{comp.vol} · {comp.note}</p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: '#93c5fd', margin: 0, lineHeight: 1.5 }}>
                <strong>Exercise impact (Nose 1988):</strong> A 10% plasma volume decrease reduces cardiac output by ~1 L/min and peak power by 5–8%. Plasma volume restoration begins within 30 min of drinking but full restoration requires 24–48h.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
