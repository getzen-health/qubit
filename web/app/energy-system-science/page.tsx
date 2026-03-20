'use client'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SYSTEM_STATS = [
  {
    label: 'ATP-PCr Duration',
    value: '0–10s',
    sub: 'phosphocreatine system',
    accent: '#ef4444',
  },
  {
    label: 'Glycolytic Duration',
    value: '10s–2min',
    sub: 'fast glycolysis',
    accent: '#f97316',
  },
  {
    label: 'Aerobic Duration',
    value: '>2 min',
    sub: 'oxidative phosphorylation',
    accent: '#3b82f6',
  },
]

const TIMELINE_SEGMENTS = [
  {
    label: 'ATP-PCr',
    sublabel: '0–10s',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.18)',
    border: 'rgba(239,68,68,0.45)',
    widthPct: 15,
  },
  {
    label: 'Glycolytic',
    sublabel: '10s–2min',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.18)',
    border: 'rgba(249,115,22,0.45)',
    widthPct: 35,
  },
  {
    label: 'Aerobic',
    sublabel: '>2 min',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.18)',
    border: 'rgba(59,130,246,0.45)',
    widthPct: 50,
  },
]

// Overlap indicators showing co-contribution across phases
const OVERLAP_ROWS = [
  {
    system: 'ATP-PCr',
    color: '#ef4444',
    segments: [
      { widthPct: 20, opacity: 1.0 },
      { widthPct: 15, opacity: 0.55 },
      { widthPct: 12, opacity: 0.2 },
      { widthPct: 53, opacity: 0.04 },
    ],
  },
  {
    system: 'Glycolytic',
    color: '#f97316',
    segments: [
      { widthPct: 5, opacity: 0.15 },
      { widthPct: 30, opacity: 0.9 },
      { widthPct: 25, opacity: 0.55 },
      { widthPct: 40, opacity: 0.12 },
    ],
  },
  {
    system: 'Aerobic',
    color: '#3b82f6',
    segments: [
      { widthPct: 5, opacity: 0.05 },
      { widthPct: 15, opacity: 0.2 },
      { widthPct: 35, opacity: 0.65 },
      { widthPct: 45, opacity: 1.0 },
    ],
  },
]

const TIME_LABELS = ['1s', '5s', '10s', '30s', '1min', '2min', '5min+']

const SCIENCE_CARDS = [
  {
    icon: '⚡',
    title: 'ATP-PCr System (0–10 seconds)',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.10)',
    accentBorder: 'rgba(239,68,68,0.28)',
    facts: [
      {
        citation: 'Hultman 1986',
        text: 'Phosphocreatine (PCr) stores 14–26 mmol/kg dry muscle; depletes in 5–10s of maximal effort; ATP production rate 9× faster than aerobic but total yield minimal; creatine kinase (CK) is the only reaction sustaining maximal power',
        stat: '9× faster ATP rate',
      },
      {
        citation: 'Greenhaff 2001',
        text: 'Creatine supplementation (20g/day × 5 days, then 3g/day): increases muscle PCr 15–20%; improves repeat sprint performance 5–10%; most effective for efforts 5–30s at maximal intensity',
        stat: 'PCr +15–20%',
      },
      {
        citation: 'Harris 1992',
        text: 'PCr resynthesis kinetics: 50% restored in 30s rest, 95% in 3–5 min; explains why repeated short maximal efforts require ≥3 min rest for full recovery',
        stat: '95% recovery in 3–5 min',
      },
      {
        citation: 'Gastin 2001',
        text: 'Power contribution by duration: 0–1s = 99% ATP-PCr; 5s = 85% ATP-PCr; 10s = 70% ATP-PCr / 25% glycolytic; 30s = 50%/40%/10% split',
        stat: '99% at 1s → 70% at 10s',
      },
    ],
  },
  {
    icon: '🔥',
    title: 'Glycolytic System (10s–2 min)',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    facts: [
      {
        citation: 'Spriet 1990',
        text: 'Glycolysis rate: peak flux 3 mmol glucose/kg/min at maximal intensity; 13 enzymes, 10 steps; PFK is rate-limiting — activated by AMP, ADP, Pi; inhibited by ATP, citrate, H⁺',
        stat: 'Peak 3 mmol/kg/min',
      },
      {
        citation: 'Robergs 2004',
        text: 'Lactate paradox: lactate is NOT the cause of fatigue; H⁺ accumulation from ATP hydrolysis causes acidosis; lactate itself is a fuel — cardiac muscle and Type I fibers preferentially oxidize lactate via MCT1 transporters',
        stat: 'Lactate = fuel, not waste',
      },
      {
        citation: 'Weston 2014',
        text: 'Glycogen depletion threshold: performance degrades below 200 mmol/kg dm; CHO ingestion during exercise >60 min at >70% VO₂max improves performance 2–3%; multiple transportable CHO increase oxidation to 1.8 g/min',
        stat: 'CHO +2–3% performance',
      },
      {
        citation: 'Hargreaves 2020',
        text: 'HIIT increases muscle buffering capacity 20–30%; beta-alanine supplementation increases muscle carnosine 64% in 4 weeks — improves repeat high-intensity effort by 2.85%',
        stat: 'β-alanine +64% carnosine',
      },
    ],
  },
  {
    icon: '🫀',
    title: 'Aerobic System (>2 min)',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Holloszy 1967',
        text: 'Mitochondrial biogenesis: endurance training doubles muscle mitochondrial density over 3–6 months; driven by PGC-1α activated by AMPK and p38-MAPK during exercise',
        stat: '2× mitochondrial density',
      },
      {
        citation: 'Bassett 2000',
        text: 'VO₂max determinants: cardiac output (Q) accounts for 70–80% of variance; Q = HR × stroke volume; training increases max stroke volume 20–40% via eccentric cardiac hypertrophy',
        stat: 'Stroke volume +20–40%',
      },
      {
        citation: 'Seiler 2010',
        text: 'Polarized training model: 80% below LT1 (Zone 1–2), 20% above LT2 (Zone 4–5); produces greater VO₂max gains than threshold-dominated or HVT approaches',
        stat: '80/20 polarized split',
      },
      {
        citation: 'Brooks 2018',
        text: 'Intracellular lactate shuttle: active muscle exports lactate via MCT4 → blood → adjacent Type I fibers oxidize via MCT1 → mitochondrial LDH; Zone 2 maximally activates this shuttle and peaks mitochondrial adaptation stimulus',
        stat: 'Zone 2 = lactate shuttle peak',
      },
    ],
  },
  {
    icon: '⚖️',
    title: 'Substrate Use & Crossover Point',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        citation: 'Brooks 1994',
        text: 'Crossover concept: below ~65% VO₂max, fat is primary fuel; above 65%, CHO dominates; elite endurance athletes cross over at higher intensities; FatMax at 45–65% VO₂max (Achten 2002)',
        stat: 'Crossover ~65% VO₂max',
      },
      {
        citation: 'Volek 2015',
        text: 'Keto-adapted athletes oxidize 2.3× more fat per minute; peak fat oxidation 1.5 g/min vs. 0.6 g/min control; requires 3–6 months full adaptation',
        stat: '2.3× fat oxidation rate',
      },
      {
        citation: 'Gollnick 1985',
        text: 'Glycogen sparing via fat oxidation: trained muscle preferentially oxidizes fat at submaximal intensities; mechanism: higher mitochondrial density → more NADH from β-oxidation → allosteric PFK inhibition',
        stat: 'Glycogen sparing effect',
      },
      {
        citation: 'LaForgia 2006',
        text: 'EPOC: repays PCr stores (60%), oxidizes lactate (25%), elevates temperature/catecholamines (15%); HIIT EPOC lasts 12–48h contributing 6–15% to total exercise energy cost',
        stat: 'HIIT EPOC 12–48h',
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
      {/* Card header */}
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

      {/* Facts */}
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

export default function EnergySystemSciencePage() {
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
          background: 'linear-gradient(135deg, #100a00 0%, #080e18 50%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a1a',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Multi-color glow */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '20%',
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '40%',
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '10%',
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
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
              { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', icon: '⚡' },
              { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', icon: '🔥' },
              { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', icon: '🫀' },
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
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 40%, #3b82f6 80%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Energy Systems Science
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
            Understanding how the body produces ATP — from explosive phosphocreatine
            hydrolysis to sustained mitochondrial oxidative phosphorylation
          </p>

          {/* System tag row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'ATP-PCr', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
              { label: 'Glycolytic', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
              { label: 'Aerobic', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
              { label: 'Substrate', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
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
        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {SYSTEM_STATS.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} accent={s.accent} />
          ))}
        </div>

        {/* ── Timeline visualization ─────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '22px 22px 26px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Energy System Timeline
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 22px' }}>
            Relative contribution of each energy system across exercise duration — systems overlap and co-contribute
          </p>

          {/* Horizontal phase bars */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 8, height: 36 }}>
            {TIMELINE_SEGMENTS.map((seg) => (
              <div
                key={seg.label}
                style={{
                  flex: `0 0 ${seg.widthPct}%`,
                  background: seg.bg,
                  border: `1px solid ${seg.border}`,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, color: seg.color }}>{seg.label}</span>
                <span
                  style={{
                    fontSize: 9,
                    color: seg.color,
                    opacity: 0.7,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {seg.sublabel}
                </span>
              </div>
            ))}
          </div>

          {/* Overlap contribution rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
            {OVERLAP_ROWS.map((row) => (
              <div key={row.system} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: row.color,
                    width: 70,
                    flexShrink: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {row.system}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 14,
                    display: 'flex',
                    borderRadius: 7,
                    overflow: 'hidden',
                    background: '#0f0f0f',
                  }}
                >
                  {row.segments.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        flex: `0 0 ${seg.widthPct}%`,
                        background: row.color,
                        opacity: seg.opacity,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Time axis labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingLeft: 80,
            }}
          >
            {TIME_LABELS.map((label) => (
              <span
                key={label}
                style={{
                  fontSize: 9,
                  color: '#334155',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Power contribution snapshot */}
          <div
            style={{
              marginTop: 20,
              background: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Power contribution snapshot (Gastin 2001)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { time: '1s', pcr: 99, gly: 1, aer: 0 },
                { time: '5s', pcr: 85, gly: 14, aer: 1 },
                { time: '10s', pcr: 70, gly: 25, aer: 5 },
                { time: '30s', pcr: 50, gly: 40, aer: 10 },
                { time: '2min', pcr: 15, gly: 45, aer: 40 },
                { time: '5min+', pcr: 3, gly: 15, aer: 82 },
              ].map((row) => (
                <div key={row.time} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 36,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#64748b',
                      flexShrink: 0,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {row.time}
                  </span>
                  <div style={{ flex: 1, display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ flex: row.pcr, background: '#ef4444' }} />
                    <div style={{ flex: row.gly, background: '#f97316' }} />
                    <div style={{ flex: row.aer, background: '#3b82f6' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {row.pcr > 0 && (
                      <span style={{ fontSize: 9, color: '#ef4444', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700 }}>
                        {row.pcr}%
                      </span>
                    )}
                    {row.gly > 0 && (
                      <span style={{ fontSize: 9, color: '#f97316', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700 }}>
                        {row.gly}%
                      </span>
                    )}
                    {row.aer > 0 && (
                      <span style={{ fontSize: 9, color: '#3b82f6', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontWeight: 700 }}>
                        {row.aer}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[
                { color: '#ef4444', label: 'ATP-PCr' },
                { color: '#f97316', label: 'Glycolytic' },
                { color: '#3b82f6', label: 'Aerobic' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#475569' }}>{item.label}</span>
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

        {/* ── Substrate crossover chart ───────────────────────────────────────── */}
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
              background: 'rgba(34,197,94,0.08)',
              borderBottom: '1px solid rgba(34,197,94,0.2)',
              borderLeft: '3px solid #22c55e',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>⚖️</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Fat / CHO Crossover Curve
              </h3>
              <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                Brooks 1994 crossover concept — substrate shift by exercise intensity
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* Simplified visual crossover */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Rest / Very Easy', pct: 15, fatPct: 85, choPct: 15 },
                { label: '45% VO₂max — FatMax', pct: 30, fatPct: 75, choPct: 25 },
                { label: '55% VO₂max', pct: 45, fatPct: 60, choPct: 40 },
                { label: '65% VO₂max — Crossover', pct: 60, fatPct: 48, choPct: 52 },
                { label: '75% VO₂max', pct: 75, fatPct: 30, choPct: 70 },
                { label: '85% VO₂max +', pct: 90, fatPct: 12, choPct: 88 },
              ].map((row) => (
                <div key={row.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: row.label.includes('Crossover') || row.label.includes('FatMax') ? 700 : 500,
                        color: row.label.includes('Crossover') ? '#22c55e' : row.label.includes('FatMax') ? '#f59e0b' : '#94a3b8',
                      }}
                    >
                      {row.label}
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#f59e0b',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        Fat {row.fatPct}%
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#3b82f6',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        CHO {row.choPct}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 8,
                      display: 'flex',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: '#0f0f0f',
                    }}
                  >
                    <div
                      style={{
                        flex: row.fatPct,
                        background: 'linear-gradient(90deg, #b45309, #f59e0b)',
                      }}
                    />
                    <div
                      style={{
                        flex: row.choPct,
                        background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 24,
                    height: 8,
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #b45309, #f59e0b)',
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748b' }}>Fat (lipid oxidation)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 24,
                    height: 8,
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748b' }}>CHO (glycolysis)</span>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 8,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 14 }}>📌</span>
              <p style={{ fontSize: 12, color: '#86efac', margin: 0, lineHeight: 1.5 }}>
                <strong>Keto-adapted athletes</strong> (Volek 2015) shift the crossover rightward — achieving 2.3× greater
                fat oxidation (1.5 g/min) vs. carbohydrate-fueled controls (0.6 g/min) after 3–6 months adaptation.
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
              icon: '🧪',
              title: 'PGC-1α',
              desc: 'Master regulator of mitochondrial biogenesis — activated by AMPK during prolonged aerobic exercise',
              color: '#3b82f6',
            },
            {
              icon: '⚗️',
              title: 'PFK Rate-Limiting',
              desc: 'Phosphofructokinase governs glycolysis flux; AMP/ADP activate, ATP/citrate/H⁺ inhibit',
              color: '#f97316',
            },
            {
              icon: '🏃',
              title: 'Lactate Shuttle',
              desc: 'MCT4 exports lactate from glycolytic cells → MCT1 imports into Type I fibers for mitochondrial oxidation',
              color: '#22c55e',
            },
            {
              icon: '💊',
              title: 'EPOC Composition',
              desc: 'Post-exercise O₂ debt: 60% PCr repayment, 25% lactate clearance, 15% thermal/catecholamine effects',
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

      </main>
    </div>
  )
}
