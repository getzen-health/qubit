// HIIT Science — server component

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'Tabata Protocol',
    value: '+14% VO₂max',
    sub: '4 min vs zero anaerobic gain in moderate group',
    accent: '#e879f9',
  },
  {
    label: 'Norwegian 4×4',
    value: '+46% VO₂max',
    sub: 'cardiac rehab (Wisløff 2007, Circulation)',
    accent: '#f97316',
  },
  {
    label: 'Time Efficiency',
    value: '1/3 the time',
    sub: 'equivalent VO₂max gains vs MICT (Milanović 2015)',
    accent: '#22d3ee',
  },
]

const SCIENCE_CARDS = [
  {
    icon: 'ZAP',
    title: 'HIIT Physiology',
    accent: '#e879f9',
    accentBg: 'rgba(232,121,249,0.10)',
    accentBorder: 'rgba(232,121,249,0.28)',
    facts: [
      {
        label:
          'Tabata 1996: Original HIIT study — 8×20 s all-out at 170% VO₂max / 10 s rest: +14% VO₂max AND +28% anaerobic capacity vs moderate group +10% VO₂max / zero anaerobic gain; Nobel Prize-worthy efficiency',
        value: '+28% anaerobic capacity',
      },
      {
        label:
          'Laursen 2002: Intervals at ≥90% HRmax maximally recruit Type II fibers, spike lactate 8–15 mmol/L; EPOC 6–15% for 12–24 h; stronger AMPK activation than continuous exercise at 70% VO₂max',
        value: 'Lactate 8–15 mmol/L',
      },
      {
        label:
          'Gibala 2006 (J Physiol): 6 sessions of 2.5 min SIT (4–6×30 s Wingate / 4 min rest) = equivalent muscular endurance and oxidative enzyme activity as 10.5 h of continuous training; 30 s all-out activates PGC-1α via AMPK',
        value: '2.5 min = 10.5 h MICT',
      },
      {
        label:
          'Buchheit 2013: Optimal intensity = 90–95% HRmax; 4×4 min at 90–95% HRmax with 3 min rest accumulates time at VO₂max 50% faster than 30-15 intervals',
        value: '50% faster VO₂max time',
      },
    ],
  },
  {
    icon: 'HEART',
    title: 'Adaptations to HIIT Training',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    facts: [
      {
        label:
          'Wisløff 2007 (Circulation): HIIT vs moderate exercise post-MI: VO₂max +46% vs +14%; LV function improved significantly with HIIT only; endothelial function improved 2× more; HIIT now recommended for cardiac rehab',
        value: '+46% vs +14% VO₂max',
      },
      {
        label:
          'Rognmo 2004: VO₂max gains — high-intensity (90–95% HRmax): +5.5 mL/kg/min vs moderate (70–75%): +3.5 mL/kg/min at matched energy expenditure; superior LV compliance and stroke volume',
        value: '+5.5 vs +3.5 mL/kg/min',
      },
      {
        label:
          'Boutcher 2011 (J Obes): 15-week HIIT (8 s sprint / 12 s rest): visceral fat −17%, abdominal subcutaneous −12%, total fat −1.7 kg; continuous cycling control: no significant change despite equal energy',
        value: 'Visceral fat −17%',
      },
      {
        label:
          'Jelleyman 2015 (Obes Rev): 50-study meta-analysis: HIIT reduces HOMA-IR 0.53 SD more than MICT, abdominal fat 0.43 SD more; even 12 min/week HIIT improves metabolic markers in metabolic syndrome',
        value: 'HOMA-IR −0.53 SD vs MICT',
      },
    ],
  },
  {
    icon: 'TIMER',
    title: 'HIIT Protocols & Programming',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        label:
          'Norwegian 4×4 (Helgerud 2007): 4 reps × 4 min at 90–95% HRmax / 3 min active recovery; +7.2 vs +3.5 mL/kg/min with continuous over 8 weeks; gold standard for VO₂max improvement',
        value: '+7.2 mL/kg/min in 8 weeks',
      },
      {
        label:
          'Tabata Protocol: 8×20 s / 10 s at 170% VO₂max; 4 min total; any exercise modality; caution: gym "Tabata" at submaximal effort does NOT replicate the research',
        value: '4 min, 170% VO₂max',
      },
      {
        label:
          '30-15 IFT (Buchheit 2008): Fitness test and training protocol; VIFT-based intensity prescription; superior for repeated sprint ability in team sports',
        value: 'VIFT-based prescription',
      },
      {
        label:
          'Frequency/Recovery (Billat 2001): ≥1 VO₂max session/week required; ≤2 HIIT/week optimal for non-athletes; minimum 48 h between sessions; monitor HRV for recovery status',
        value: '≤2 sessions/week, 48 h gap',
      },
    ],
  },
  {
    icon: 'SCALE',
    title: 'HIIT vs Steady-State: The Evidence',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        label:
          'Scharhag-Rosenberger 2012: HIIT superior for VO₂max, cardiovascular remodeling, time efficiency; MICT superior for fat oxidation per session, mitochondrial enzymes at matched volume; 80% MICT + 20% HIIT (polarized) outperforms either alone or 50/50',
        value: 'Polarized 80/20 wins',
      },
      {
        label:
          'Milanović 2015 (Sports Med meta-analysis): HIIT d = 0.98 vs MICT d = 0.84 on VO₂max; negligible body composition difference at matched energy; HIIT = 1/3 time for equivalent VO₂max',
        value: 'Effect size d = 0.98 vs 0.84',
      },
      {
        label:
          'Sperlich 2014: Excessive HIIT without recovery: resting cortisol +15–30%, suppressed testosterone:cortisol ratio, beta-adrenergic receptor downregulation; HRV trending down across training week = reduce HIIT frequency',
        value: 'Cortisol +15–30% overtraining',
      },
      {
        label:
          'Ross 2015 (Ann Intern Med): HIIT safe in cardiovascular disease, T2DM, metabolic syndrome with medical supervision; risk: 1 cardiac event per 888,000 HIIT sessions in stable CAD; ESC/ACC/AHA guidelines now support HIIT for most cardiac patients',
        value: '1 event per 888,000 sessions',
      },
    ],
  },
]

// Protocol comparison data
const PROTOCOLS = [
  {
    name: 'Tabata',
    author: 'Tabata 1996',
    workInterval: '20s',
    restInterval: '10s',
    reps: '8 reps',
    totalTime: '4 min',
    intensity: '170% VO₂max',
    intensityPct: 98,
    vo2maxGain: '+14%',
    bestFor: 'Anaerobic capacity + VO₂max',
    accent: '#e879f9',
    accentBg: 'rgba(232,121,249,0.12)',
    accentBorder: 'rgba(232,121,249,0.3)',
  },
  {
    name: '4×4 Norwegian',
    author: 'Helgerud 2007',
    workInterval: '4 min',
    restInterval: '3 min active',
    reps: '4 reps',
    totalTime: '28 min',
    intensity: '90–95% HRmax',
    intensityPct: 92,
    vo2maxGain: '+46%',
    bestFor: 'VO₂max & cardiac output',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
  },
  {
    name: '30-15 IFT',
    author: 'Buchheit 2008',
    workInterval: '30s',
    restInterval: '15s passive',
    reps: 'Until failure',
    totalTime: '~25 min',
    intensity: 'VIFT-based',
    intensityPct: 85,
    vo2maxGain: '+12–18%',
    bestFor: 'Repeated sprint ability',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.3)',
  },
]

// Intensity zones with BPM targets (based on max HR 190 bpm reference)
const INTENSITY_ZONES = [
  {
    zone: 'Z1',
    name: 'Recovery',
    pctRange: '< 60%',
    bpmRange: '< 114 bpm',
    desc: 'Active recovery between intervals',
    color: '#64748b',
    barBg: '#334155',
    barWidth: 30,
  },
  {
    zone: 'Z2',
    name: 'Aerobic Base',
    pctRange: '60–70%',
    bpmRange: '114–133 bpm',
    desc: 'Mitochondrial density, fat oxidation',
    color: '#3b82f6',
    barBg: '#1d4ed8',
    barWidth: 42,
  },
  {
    zone: 'Z3',
    name: 'Tempo',
    pctRange: '70–80%',
    bpmRange: '133–152 bpm',
    desc: 'Lactate threshold, sustained effort',
    color: '#10b981',
    barBg: '#059669',
    barWidth: 55,
  },
  {
    zone: 'Z4',
    name: 'Threshold',
    pctRange: '80–90%',
    bpmRange: '152–171 bpm',
    desc: 'Lactate clearance, HIIT lower bound',
    color: '#f59e0b',
    barBg: '#d97706',
    barWidth: 68,
  },
  {
    zone: 'Z5',
    name: 'HIIT Target',
    pctRange: '90–95%',
    bpmRange: '171–181 bpm',
    desc: 'Primary HIIT zone — maximizes VO₂max stimulus',
    color: '#f97316',
    barBg: '#ea580c',
    barWidth: 82,
    highlight: true,
  },
  {
    zone: 'Z6',
    name: 'Tabata / SIT',
    pctRange: '95–100%+',
    bpmRange: '181–190+ bpm',
    desc: 'Supramaximal — short sprints only',
    color: '#e879f9',
    barBg: '#a855f7',
    barWidth: 96,
    highlight: true,
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
        borderRadius: 16,
        padding: '20px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          borderRadius: 999,
        }}
      />
      <p
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#e2e8f0',
          margin: '4px 0 2px',
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

function IconShape({ icon, accent }: { icon: string; accent: string }) {
  if (icon === 'ZAP') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`${accent}33`}
        />
      </svg>
    )
  }
  if (icon === 'HEART') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`${accent}33`}
        />
      </svg>
    )
  }
  if (icon === 'TIMER') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="13" r="8" stroke={accent} strokeWidth="2" fill={`${accent}22`} />
        <path d="M12 9v4l3 3" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 2h6M12 2v3" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  // SCALE
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v18M3 6l9-3 9 3M5 10c0 2.5 2 4 7 4s7-1.5 7-4M5 17c0 2.5 2 4 7 4s7-1.5 7-4"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
          gap: 10,
        }}
      >
        <IconShape icon={icon} accent={accent} />
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

      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {facts.map((fact, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 14,
              paddingBottom: i < facts.length - 1 ? 14 : 0,
              borderBottom: i < facts.length - 1 ? '1px solid #161616' : 'none',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.55,
                flex: 1,
              }}
            >
              {fact.label}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: accent,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: accentBg,
                border: `1px solid ${accentBorder}`,
                borderRadius: 6,
                padding: '3px 8px',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HiitSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0020 0%, #0f000f 40%, #0a0a0a 100%)',
          borderBottom: '1px solid #1f1f1f',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 500,
            background:
              'radial-gradient(circle, rgba(232,121,249,0.20) 0%, rgba(232,121,249,0.04) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Secondary pulse ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700,
            height: 700,
            border: '1px solid rgba(232,121,249,0.07)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Icon badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(232,121,249,0.13)',
              border: '1px solid rgba(232,121,249,0.35)',
              marginBottom: 22,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                stroke="#e879f9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="rgba(232,121,249,0.25)"
              />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 7vw, 54px)',
              fontWeight: 900,
              margin: '0 0 10px',
              background: 'linear-gradient(135deg, #e879f9 0%, #c026d3 40%, #f0abfc 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            HIIT Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: '0 auto 20px',
              maxWidth: 580,
              lineHeight: 1.65,
            }}
          >
            The physiology and evidence base of high-intensity interval training — from Tabata
            to the Norwegian 4×4, EPOC to cardiac rehab, and everything in between
          </p>

          {/* Tag strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {[
              'EPOC & AMPK',
              'VO₂max Adaptation',
              'Cardiac Remodeling',
              'Fat Loss Mechanisms',
              'Protocol Science',
            ].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#d946ef',
                  background: 'rgba(232,121,249,0.08)',
                  border: '1px solid rgba(232,121,249,0.20)',
                  borderRadius: 999,
                  padding: '4px 12px',
                  letterSpacing: '0.02em',
                }}
              >
                {tag}
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
          padding: '36px 16px 96px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* ── Key Stats ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              accent={s.accent}
            />
          ))}
        </div>

        {/* ── Protocol Comparison Chart ──────────────────────────────────────── */}
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
              padding: '16px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="#e879f9"
                strokeWidth="2"
                fill="rgba(232,121,249,0.1)"
              />
              <path d="M3 9h18M9 3v18" stroke="#e879f9" strokeWidth="2" />
            </svg>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#e2e8f0',
                margin: 0,
              }}
            >
              Protocol Comparison
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: '#64748b',
              }}
            >
              Tabata · Norwegian 4×4 · 30-15 IFT
            </span>
          </div>

          <div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {PROTOCOLS.map((p) => (
              <div
                key={p.name}
                style={{
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  borderRadius: 12,
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* left accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: p.accent,
                    borderRadius: '12px 0 0 12px',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'flex-start',
                    paddingLeft: 8,
                  }}
                >
                  {/* Protocol name & author */}
                  <div style={{ minWidth: 140, flex: '1 1 140px' }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: p.accent,
                        margin: '0 0 2px',
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{p.author}</p>
                  </div>

                  {/* Interval details */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      flex: '3 1 300px',
                    }}
                  >
                    {[
                      { l: 'Work', v: p.workInterval },
                      { l: 'Rest', v: p.restInterval },
                      { l: 'Volume', v: p.reps },
                      { l: 'Total', v: p.totalTime },
                      { l: 'Intensity', v: p.intensity },
                      { l: 'VO₂max gain', v: p.vo2maxGain },
                    ].map((item) => (
                      <div
                        key={item.l}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid #1f1f1f',
                          borderRadius: 8,
                          padding: '6px 10px',
                          minWidth: 64,
                        }}
                      >
                        <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {item.l}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: item.l === 'VO₂max gain' ? p.accent : '#e2e8f0',
                            margin: 0,
                          }}
                        >
                          {item.v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intensity bar */}
                <div style={{ marginTop: 14, paddingLeft: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#64748b' }}>Relative intensity</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.accent }}>
                      {p.intensityPct}% HRmax equiv.
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: '#0a0a0a',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${p.intensityPct}%`,
                        background: `linear-gradient(90deg, ${p.accentBorder}, ${p.accent})`,
                        borderRadius: 999,
                        boxShadow: `0 0 8px ${p.accent}55`,
                      }}
                    />
                  </div>
                </div>

                {/* Best for */}
                <div style={{ marginTop: 10, paddingLeft: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: p.accent,
                      fontWeight: 600,
                    }}
                  >
                    Best for: {p.bestFor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HIIT Intensity Zone Reference ─────────────────────────────────── */}
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
              background: 'rgba(232,121,249,0.08)',
              borderBottom: '1px solid rgba(232,121,249,0.18)',
              borderLeft: '3px solid #e879f9',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 12h-4l-3 9L9 3l-3 9H2"
                  stroke="#e879f9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#f1f5f9',
                  margin: 0,
                }}
              >
                HIIT Intensity Zone Reference
              </h3>
            </div>
            <span
              style={{
                fontSize: 11,
                color: '#a855f7',
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: 999,
                padding: '3px 10px',
                fontWeight: 600,
              }}
            >
              Reference: Max HR 190 bpm
            </span>
          </div>

          <div
            style={{
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
            }}
          >
            {INTENSITY_ZONES.map((z, i) => (
              <div
                key={z.zone}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: z.highlight ? '8px 10px' : '0',
                  background: z.highlight ? `${z.color}0d` : 'transparent',
                  border: z.highlight ? `1px solid ${z.color}25` : '1px solid transparent',
                  borderRadius: z.highlight ? 10 : 0,
                }}
              >
                {/* Zone badge */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: `${z.color}1a`,
                    border: `1px solid ${z.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: z.color,
                    }}
                  >
                    {z.zone}
                  </span>
                </div>

                {/* Name + bar + info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 5,
                      flexWrap: 'wrap',
                      gap: 4,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: z.highlight ? z.color : '#e2e8f0',
                        }}
                      >
                        {z.name}
                      </span>
                      {z.highlight && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            color: z.color,
                            background: `${z.color}20`,
                            border: `1px solid ${z.color}40`,
                            borderRadius: 4,
                            padding: '1px 5px',
                          }}
                        >
                          HIIT ZONE
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#64748b' }}>{z.pctRange} HRmax</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: z.color,
                        }}
                      >
                        {z.bpmRange}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: '#1a1a1a',
                      borderRadius: 999,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${z.barWidth}%`,
                        background: `linear-gradient(90deg, ${z.barBg}, ${z.color})`,
                        borderRadius: 999,
                        boxShadow: z.highlight ? `0 0 6px ${z.color}66` : 'none',
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {z.desc}
                  </p>
                </div>
              </div>
            ))}

            <p
              style={{
                fontSize: 11,
                color: '#334155',
                margin: '6px 0 0',
                textAlign: 'center',
              }}
            >
              BPM targets are illustrative · scale proportionally to your actual max HR
            </p>
          </div>
        </div>

        {/* ── Science Cards ──────────────────────────────────────────────────── */}
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

        {/* ── Evidence summary callout ───────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(232,121,249,0.10) 0%, rgba(168,85,247,0.06) 100%)',
            border: '1px solid rgba(232,121,249,0.22)',
            borderRadius: 16,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#e879f9" strokeWidth="2" fill="rgba(232,121,249,0.12)" />
              <path d="M12 8v4M12 16h.01" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#f0abfc',
                margin: 0,
              }}
            >
              The Evidence Synthesis
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {[
              {
                stat: 'Effect size d = 0.98',
                desc: 'HIIT on VO₂max vs d = 0.84 for MICT (Milanović 2015)',
              },
              {
                stat: '80/20 Polarized',
                desc: 'Optimal training distribution: 80% low, 20% high intensity',
              },
              {
                stat: '12 min/week',
                desc: 'Minimum effective HIIT dose for metabolic syndrome improvement',
              },
              {
                stat: '48 h recovery',
                desc: 'Minimum gap between HIIT sessions for non-athletes (Billat 2001)',
              },
            ].map((item) => (
              <div
                key={item.stat}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(232,121,249,0.12)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#e879f9',
                    margin: '0 0 4px',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {item.stat}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
