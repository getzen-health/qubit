// Handwashing Science — server component
// Evidence-based guide covering pathogen survival, WHO technique, Apple Watch detection,
// and global public health impact of handwashing compliance.

export const metadata = { title: 'Handwashing Science' }

// ─── Stat Data ────────────────────────────────────────────────────────────────

const HERO_STATS = [
  {
    value: '31–47%',
    label: 'Diarrheal Disease Reduction',
    sub: 'from handwashing with soap (Ejemot 2008 Cochrane, 30 RCTs)',
  },
  {
    value: '20 seconds',
    label: 'WHO Minimum Duration',
    sub: 'required for effective pathogen removal from hands',
  },
  {
    value: '85–90%',
    label: 'Apple Watch Sensitivity',
    sub: 'for handwashing detection, ~8% false positive rate (Bayés 2021)',
  },
]

// ─── Pathogen Survival Data ────────────────────────────────────────────────────

const PATHOGEN_ROWS = [
  { pathogen: 'Influenza virus', survival: '30–60 min on hands', source: 'Nicas 2008' },
  { pathogen: 'Rhinovirus (common cold)', survival: 'Up to 24 hours on surfaces', source: 'Curtis 2003' },
  { pathogen: 'Norovirus', survival: '12 hours on hands', source: 'Nicas 2008' },
  { pathogen: 'SARS-CoV-2', survival: 'Up to 4 hours on skin', source: 'Nicas 2008' },
]

// ─── Disease Prevention Data ───────────────────────────────────────────────────

const PREVENTION_ROWS = [
  { condition: 'Diarrheal disease', reduction: '−31–47%', source: 'Ejemot 2008 Cochrane (30 RCTs)' },
  { condition: 'Respiratory illness', reduction: '−16–21%', source: 'Curtis 2003' },
  { condition: 'COVID-19 household transmission', reduction: '−20–30%', source: 'Lewis 2021 Lancet' },
  { condition: 'Foodborne illness (US)', reduction: 'Major reduction', source: '9M cases/year via hand contamination' },
]

// ─── WHO 6-Step Technique ─────────────────────────────────────────────────────

const WHO_STEPS = [
  {
    num: '①',
    label: 'Palm to palm',
    note: 'Cleans flat surfaces of fingers and palm; highest contact area during fecal-oral transmission.',
  },
  {
    num: '②',
    label: 'Palm over back of each hand',
    note: 'Dorsal surfaces harbor 40% more bacteria than palmar surfaces due to reduced sebum production.',
  },
  {
    num: '③',
    label: 'Interlaced fingers',
    note: 'Interdigital spaces carry dense gram-negative flora; most commonly missed area in non-structured washing.',
  },
  {
    num: '④',
    label: 'Back of fingers to opposing palms',
    note: 'Knuckle surfaces and flexure creases — high-touch zones during object manipulation.',
  },
  {
    num: '⑤',
    label: 'Rotational thumb rubbing',
    note: 'Thumb is the primary inoculation vector for face-touching; self-inoculation rate 3–5 touches/hour (Nicas 2008).',
  },
  {
    num: '⑥',
    label: 'Fingertip rotation in opposite palm',
    note: 'Subungual region: 16× more bacteria under nails than on surrounding skin (Hedderwick 2000).',
  },
]

// ─── Efficacy Comparison Data ─────────────────────────────────────────────────

const EFFICACY_ROWS = [
  { method: 'Water only', log: '0.5 log₁₀', pct: '68%', barPct: 14, color: '#64748b' },
  { method: 'Plain soap + water (20s)', log: '2.0 log₁₀', pct: '99%', barPct: 60, color: '#0288d1' },
  { method: 'Alcohol hand rub ≥60%', log: '2.5–3.5 log₁₀', pct: '99.7%', barPct: 88, color: '#00bfa5' },
  { method: 'Antibacterial soap', log: '2.1 log₁₀', pct: '99.2%', barPct: 64, color: '#1a2744' },
]

// ─── Apple Watch Cards ────────────────────────────────────────────────────────

const WATCH_CARDS = [
  {
    title: 'Detection Algorithm',
    source: 'Bayés 2021 CHI',
    body: '85–90% sensitivity with ~8% false positive rate. Minimum 10 seconds of characteristic rhythmic wrist motion is required before the 20-second countdown engages. The model was trained on 20,000+ real handwashing sessions.',
  },
  {
    title: '20-Second Science',
    source: 'Hubner 2010 / Borchgrevink 2013',
    body: '10s achieves 97% bacterial reduction. 20s reaches 99%. 30s yields 99.4% — diminishing returns past 20s. Yet 75% of people wash under 15 seconds in observational studies.',
  },
  {
    title: 'Skin Health Balance',
    source: 'Elston 2020',
    body: '6–10 washes/day is optimal for community health contexts. More than 10/day without moisturiser elevates contact dermatitis risk. Alcohol hand rub is gentler than soap for high-frequency repeat use.',
  },
  {
    title: 'Frequency Targets',
    source: 'Freeman 2014',
    body: '8–10 times/day is the target; 6–8 is optimal for skin health. Compliance gap: only 32% actually use soap in observed studies, versus 89% self-reported — a 57-point measurement bias.',
  },
]

// ─── Behavioral Nudge Data ────────────────────────────────────────────────────

const NUDGE_ROWS = [
  { strategy: 'Disgust imagery at sink', uplift: '+41%', source: 'Judah 2009' },
  { strategy: 'Mirror presence at washbasin', uplift: '+36%', source: 'Judah 2009' },
  { strategy: 'Social norms messaging', uplift: '+25%', source: 'Judah 2009' },
  { strategy: 'Apple Watch reminder notifications', uplift: '+15–25%', source: 'Bayés 2021' },
  { strategy: 'Habit stacking (after meals/medications)', uplift: 'Most durable', source: 'WHO 2009' },
]

// ─── Sports MRSA Data ─────────────────────────────────────────────────────────

const SPORTS_ROWS = [
  { sport: 'Wrestling', mrsa: '69%', note: 'Highest skin-contact transmission rate' },
  { sport: 'American Football', mrsa: '49%', note: 'Equipment and turf contact vectors' },
  { sport: 'Basketball', mrsa: '32%', note: 'Court surfaces and shared equipment' },
]

// ─── WHO Progress Bar ─────────────────────────────────────────────────────────
// Typical observed: 32% use soap. Self-reported: 89%. WHO target: 80%.

const COMPLIANCE_BARS = [
  { label: 'Observed compliance (soap use)', pct: 32, color: '#0288d1' },
  { label: 'Self-reported compliance', pct: 89, color: '#00bfa5' },
  { label: 'WHO target', pct: 80, color: '#1a2744', dashed: true },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HandwashingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-mono-jb { font-family: 'JetBrains Mono', monospace; }

        /* 20-second timer ring animation */
        @keyframes timer-fill {
          0%   { stroke-dashoffset: 251.2; }
          100% { stroke-dashoffset: 0; }
        }
        .timer-ring {
          stroke-dasharray: 251.2;
          stroke-dashoffset: 251.2;
          animation: timer-fill 20s linear infinite;
          transform-origin: center;
          transform: rotate(-90deg);
        }

        /* Bubble float animations */
        @keyframes bubble-float-1 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes bubble-float-2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-12px) scale(0.97); }
        }
        @keyframes bubble-float-3 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-24px) scale(1.02); }
        }
        .bubble-1 { animation: bubble-float-1 6s ease-in-out infinite; }
        .bubble-2 { animation: bubble-float-2 8s ease-in-out infinite 1s; }
        .bubble-3 { animation: bubble-float-3 10s ease-in-out infinite 2s; }

        /* Countdown number animation */
        @keyframes count-down {
          0%      { opacity: 1; }
          4.9%    { opacity: 1; }
          5%      { opacity: 0; }
          5.1%    { opacity: 1; }
          100%    { opacity: 1; }
        }

        /* Pulse on timer circle track */
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(0,191,165,0.3)); }
          50%       { filter: drop-shadow(0 0 10px rgba(0,191,165,0.7)); }
        }
        .timer-glow {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        /* Bar fill animation */
        @keyframes bar-fill {
          from { width: 0%; }
        }
        .bar-animated {
          animation: bar-fill 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }

        /* Section label style */
        .section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #00bfa5;
          font-weight: 500;
        }

        /* Horizontal rule */
        .hr-clean {
          border: none;
          border-top: 1px solid #e0e6ee;
          margin: 0;
        }

        /* Light card */
        .card-light {
          background: #ffffff;
          border: 1px solid #e0e6ee;
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(26,39,68,0.04), 0 0 0 0 transparent;
          overflow: hidden;
        }

        /* Dark tech card */
        .card-dark {
          background: #1a2744;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        /* Tinted accent card */
        .card-teal {
          background: linear-gradient(135deg, rgba(0,191,165,0.07) 0%, rgba(2,136,209,0.04) 100%);
          border: 1px solid rgba(0,191,165,0.2);
          border-radius: 16px;
          overflow: hidden;
        }

        /* Table row alternating */
        .table-row-even { background: rgba(26,39,68,0.025); }

        /* WHO step number */
        .step-num {
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #00bfa5;
          line-height: 1;
        }
      `}} />

      <div
        className="font-outfit min-h-screen"
        style={{ background: '#ffffff', color: '#1a2744' }}
      >

        {/* ── Decorative background bubbles ────────────────────────────────────── */}
        <div
          aria-hidden
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
          }}
        >
          {/* Large bubble top-right */}
          <div
            className="bubble-1"
            style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: 320, height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(0,191,165,0.07), rgba(2,136,209,0.03) 60%, transparent)',
              border: '1px solid rgba(0,191,165,0.08)',
            }}
          />
          {/* Medium bubble mid-left */}
          <div
            className="bubble-2"
            style={{
              position: 'absolute', top: '30%', left: '-80px',
              width: 220, height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 60% 40%, rgba(2,136,209,0.06), transparent 70%)',
              border: '1px solid rgba(2,136,209,0.07)',
            }}
          />
          {/* Small bubble lower-right */}
          <div
            className="bubble-3"
            style={{
              position: 'absolute', bottom: '25%', right: '-40px',
              width: 140, height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(0,191,165,0.09), transparent 70%)',
              border: '1px solid rgba(0,191,165,0.1)',
            }}
          />
          {/* Tiny bubble hero area */}
          <div
            className="bubble-1"
            style={{
              position: 'absolute', top: '10%', left: '40%',
              width: 60, height: 60,
              borderRadius: '50%',
              background: 'rgba(0,191,165,0.06)',
              border: '1px solid rgba(0,191,165,0.12)',
            }}
          />
        </div>

        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e0e6ee',
          }}
        >
          <div
            style={{
              maxWidth: 896, margin: '0 auto', padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <a
              href="/explore"
              className="font-mono-jb"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: '#94a3b8', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Explore
            </a>
            <div style={{ width: 1, height: 16, background: '#e0e6ee' }} />
            {/* Droplet icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#00bfa5" stroke="none">
              <path d="M12 2C12 2 5 10.4 5 15a7 7 0 0 0 14 0C19 10.4 12 2 12 2Z"/>
            </svg>
            <h1
              style={{
                flex: 1, fontSize: 16, fontWeight: 700, color: '#1a2744',
                margin: 0, letterSpacing: '-0.01em',
              }}
            >
              Handwashing Science
            </h1>
            <span className="section-label" style={{ display: 'none' }}>
              Clean Protocol
            </span>
            <span
              className="font-mono-jb"
              style={{
                fontSize: 10, color: '#94a3b8', letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              WHO · CDC · Cochrane
            </span>
          </div>
        </header>

        <main style={{ maxWidth: 896, margin: '0 auto', padding: '40px 20px 120px', position: 'relative', zIndex: 1 }}>

          {/* ══════════════════════════════════════════════════════════════════════
              HERO
          ══════════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 56 }}>

            {/* Section label */}
            <p className="section-label" style={{ marginBottom: 14 }}>
              Public Health Fundamentals
            </p>

            {/* Main headline */}
            <h2
              style={{
                fontSize: 'clamp(36px, 6vw, 60px)',
                fontWeight: 700,
                color: '#1a2744',
                margin: '0 0 8px',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}
            >
              Handwashing
              <br />
              <span style={{ color: '#00bfa5' }}>Science</span>
            </h2>

            <p
              style={{
                fontSize: 17,
                fontWeight: 300,
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: 560,
                margin: '0 0 40px',
              }}
            >
              Twenty seconds. The most cost-effective public health intervention in existence.
            </p>

            <hr className="hr-clean" style={{ marginBottom: 40 }} />

            {/* Stats + Timer row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                alignItems: 'stretch',
              }}
            >
              {HERO_STATS.map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e0e6ee',
                    borderTop: '3px solid #00bfa5',
                    borderRadius: 14,
                    padding: '22px 20px 18px',
                    boxShadow: '0 1px 4px rgba(26,39,68,0.04)',
                  }}
                >
                  <p
                    className="font-mono-jb"
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      color: '#1a2744',
                      margin: '0 0 2px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    {s.value}
                  </p>
                  <div style={{ width: 36, height: 2, background: '#00bfa5', borderRadius: 2, margin: '8px 0 10px' }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1a2744', margin: '0 0 4px' }}>
                    {s.label}
                  </p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    {s.sub}
                  </p>
                </div>
              ))}

              {/* 20-second timer card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e0e6ee',
                  borderTop: '3px solid #0288d1',
                  borderRadius: 14,
                  padding: '22px 20px 18px',
                  boxShadow: '0 1px 4px rgba(26,39,68,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {/* SVG ring timer */}
                <div className="timer-glow" style={{ position: 'relative', width: 80, height: 80 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    {/* Track */}
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="#e0e6ee"
                      strokeWidth="6"
                    />
                    {/* Animated fill */}
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="#00bfa5"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="timer-ring"
                      style={{ transformOrigin: '40px 40px' }}
                    />
                  </svg>
                  {/* Center label */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span className="font-mono-jb" style={{ fontSize: 18, fontWeight: 700, color: '#00bfa5', lineHeight: 1 }}>20</span>
                    <span className="font-mono-jb" style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>SEC</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1a2744', margin: '0 0 3px' }}>
                    WHO Timer
                  </p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    Animates 20s cycle
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              WHO COMPLIANCE BAR
          ══════════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>
              Handwashing Compliance Gap
            </p>
            <div className="card-light" style={{ padding: '24px 24px 20px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a2744', margin: '0 0 6px' }}>
                Observed vs Reported vs WHO Target
              </h3>
              <p className="font-mono-jb" style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 24px' }}>
                Freeman 2014 — 57-point self-report measurement bias
              </p>
              {COMPLIANCE_BARS.map((bar) => (
                <div key={bar.label} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'baseline', marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#1a2744' }}>{bar.label}</span>
                    <span
                      className="font-mono-jb"
                      style={{ fontSize: 13, fontWeight: 700, color: bar.color }}
                    >
                      {bar.pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10, background: '#f1f5f9', borderRadius: 6,
                      overflow: 'hidden', position: 'relative',
                    }}
                  >
                    <div
                      className="bar-animated"
                      style={{
                        height: '100%',
                        width: `${bar.pct}%`,
                        background: bar.dashed
                          ? `repeating-linear-gradient(90deg, ${bar.color} 0px, ${bar.color} 8px, transparent 8px, transparent 14px)`
                          : bar.color,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  background: 'rgba(2,136,209,0.06)',
                  border: '1px solid rgba(2,136,209,0.15)',
                  borderRadius: 8,
                }}
              >
                <p className="font-mono-jb" style={{ fontSize: 11, color: '#0288d1', margin: 0 }}>
                  Only 32% of people use soap in observed studies vs 89% self-reported — the largest measurement gap in public health behavior research.
                </p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              SECTION 1: DISEASE TRANSMISSION
          ══════════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>
              Section 01 — Disease Transmission
            </p>
            <h2
              style={{
                fontSize: 26, fontWeight: 700, color: '#1a2744',
                margin: '0 0 24px', letterSpacing: '-0.02em',
              }}
            >
              Pathogen Dynamics & What We Prevent
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {/* Pathogen Survival */}
              <div className="card-light" style={{ borderLeft: '3px solid #0288d1' }}>
                <div
                  style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #e0e6ee',
                    background: 'rgba(2,136,209,0.03)',
                  }}
                >
                  <p className="section-label" style={{ marginBottom: 4 }}>Pathogen Survival on Hands</p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    Curtis 2003, Nicas 2008
                  </p>
                </div>
                <div style={{ padding: '0' }}>
                  {PATHOGEN_ROWS.map((row, i) => (
                    <div
                      key={row.pathogen}
                      style={{
                        padding: '12px 20px',
                        borderBottom: i < PATHOGEN_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: i % 2 === 1 ? 'rgba(26,39,68,0.018)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155', flex: 1 }}>
                          {row.pathogen}
                        </span>
                        <span
                          className="font-mono-jb"
                          style={{
                            fontSize: 11, color: '#0288d1', fontWeight: 500,
                            whiteSpace: 'nowrap', textAlign: 'right',
                          }}
                        >
                          {row.survival}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disease Prevention */}
              <div className="card-light" style={{ borderLeft: '3px solid #00bfa5' }}>
                <div
                  style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #e0e6ee',
                    background: 'rgba(0,191,165,0.03)',
                  }}
                >
                  <p className="section-label" style={{ marginBottom: 4 }}>What Handwashing Prevents</p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    Curtis 2003, Ejemot 2008 Cochrane (30 RCTs)
                  </p>
                </div>
                <div>
                  {PREVENTION_ROWS.map((row, i) => (
                    <div
                      key={row.condition}
                      style={{
                        padding: '12px 20px',
                        borderBottom: i < PREVENTION_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: i % 2 === 1 ? 'rgba(26,39,68,0.018)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155', flex: 1 }}>
                          {row.condition}
                        </span>
                        <span
                          className="font-mono-jb"
                          style={{
                            fontSize: 12, color: '#00bfa5', fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.reduction}
                        </span>
                      </div>
                      <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>
                        {row.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Moments */}
              <div className="card-light" style={{ borderLeft: '3px solid #1a2744' }}>
                <div
                  style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #e0e6ee',
                    background: 'rgba(26,39,68,0.03)',
                  }}
                >
                  <p className="section-label" style={{ marginBottom: 4 }}>Critical Transmission Moments</p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    WHO 2009 — 93% of GI transmission via fecal-oral route
                  </p>
                </div>
                <div style={{ padding: '14px 20px 18px' }}>
                  {[
                    'After toilet use',
                    'Before eating or food preparation',
                    'After contact with ill individuals',
                    'After public transport',
                    'Before administering medications',
                  ].map((moment, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 0',
                        borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#1a2744', flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 12, color: '#334155' }}>{moment}</span>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 14,
                      padding: '10px 12px',
                      background: 'rgba(26,39,68,0.05)',
                      borderRadius: 8,
                      border: '1px solid rgba(26,39,68,0.1)',
                    }}
                  >
                    <p className="font-mono-jb" style={{ fontSize: 10, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      Self-inoculation: 3–5 face touches/hour average — the primary non-contact transmission pathway (Nicas 2008)
                    </p>
                  </div>
                </div>
              </div>

              {/* AMR */}
              <div className="card-light" style={{ borderLeft: '3px solid #f59e0b' }}>
                <div
                  style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #e0e6ee',
                    background: 'rgba(245,158,11,0.03)',
                  }}
                >
                  <p className="section-label" style={{ color: '#f59e0b', marginBottom: 4 }}>
                    Antimicrobial Resistance
                  </p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    WHO 2016, CDC, Gorwitz 2007
                  </p>
                </div>
                <div style={{ padding: '14px 20px 18px' }}>
                  {[
                    { label: 'MRSA transmission', detail: '−50% with hand hygiene in healthcare settings (Gorwitz 2007)', good: true },
                    { label: 'Plain soap', detail: 'Zero selective pressure for antimicrobial resistance', good: true },
                    { label: 'Triclosan (antibacterial soap)', detail: 'Resistance risk — FDA banned in consumer soaps 2016; WHO advises plain soap', good: false },
                    { label: 'Alcohol hand rub', detail: 'Does NOT induce resistance; mechanism (protein denaturation) is non-selective', good: true },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '9px 0',
                        borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                          {item.good ? '✓' : '✗'}
                        </span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#1a2744', margin: '0 0 2px' }}>
                            {item.label}
                          </p>
                          <p className="font-mono-jb" style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              SECTION 2: APPLE WATCH TECHNOLOGY
          ══════════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>
              Section 02 — Apple Watch Technology
            </p>

            {/* Dark tech card */}
            <div
              className="card-dark"
              style={{ padding: '32px 28px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}
            >
              {/* Decorative bubble inside dark card */}
              <div
                aria-hidden
                style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 200, height: 200,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,191,165,0.1) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2
                  style={{
                    fontSize: 22, fontWeight: 700, color: '#ffffff',
                    margin: '0 0 6px', letterSpacing: '-0.02em',
                  }}
                >
                  How Apple Watch Detects Handwashing
                </h2>
                <p
                  className="font-mono-jb"
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}
                >
                  Bayés 2021 — CHI Conference on Human Factors in Computing Systems
                </p>

                {/* Detection pipeline diagram */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    flexWrap: 'wrap',
                    marginBottom: 28,
                  }}
                >
                  {[
                    { label: 'Accelerometer', sub: 'Rhythmic wrist motion', color: '#0288d1' },
                    { label: '+', sub: '', color: 'rgba(255,255,255,0.3)', isOp: true },
                    { label: 'Microphone', sub: '25–50 Hz faucet freq.', color: '#00bfa5' },
                    { label: '→', sub: '', color: 'rgba(255,255,255,0.3)', isOp: true },
                    { label: 'ML Model', sub: '20,000+ sessions', color: '#a78bfa' },
                    { label: '→', sub: '', color: 'rgba(255,255,255,0.3)', isOp: true },
                    { label: '20s Timer', sub: 'Countdown activates', color: '#00bfa5' },
                  ].map((node, i) => (
                    node.isOp ? (
                      <span
                        key={i}
                        className="font-mono-jb"
                        style={{
                          fontSize: 18, color: node.color,
                          padding: '0 10px', flexShrink: 0,
                        }}
                      >
                        {node.label}
                      </span>
                    ) : (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${node.color}40`,
                          borderRadius: 10,
                          padding: '10px 14px',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <p
                          className="font-mono-jb"
                          style={{ fontSize: 12, fontWeight: 700, color: node.color, margin: '0 0 3px' }}
                        >
                          {node.label}
                        </p>
                        {node.sub && (
                          <p className="font-mono-jb" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                            {node.sub}
                          </p>
                        )}
                      </div>
                    )
                  ))}
                </div>

                {/* Watch cards grid on dark background */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 12,
                  }}
                >
                  {WATCH_CARDS.map((card) => (
                    <div
                      key={card.title}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '16px 18px',
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', margin: '0 0 4px' }}>
                        {card.title}
                      </p>
                      <p className="font-mono-jb" style={{ fontSize: 9, color: '#00bfa5', margin: '0 0 10px', letterSpacing: '0.08em' }}>
                        {card.source}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                        {card.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              SECTION 3: TECHNIQUE & EFFICACY
          ══════════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>
              Section 03 — Technique & Efficacy
            </p>
            <h2
              style={{
                fontSize: 26, fontWeight: 700, color: '#1a2744',
                margin: '0 0 24px', letterSpacing: '-0.02em',
              }}
            >
              WHO 6-Step Technique
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
                marginBottom: 32,
              }}
            >
              {WHO_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="card-light"
                  style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                >
                  <span className="step-num" style={{ flexShrink: 0, marginTop: 1 }}>
                    {step.num}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a2744', margin: '0 0 5px' }}>
                      {step.label}
                    </p>
                    <p className="font-mono-jb" style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                      {step.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="hr-clean" style={{ marginBottom: 28 }} />

            {/* Efficacy Comparison */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2744', margin: '0 0 6px' }}>
              Log Reduction Comparison
            </h3>
            <p className="font-mono-jb" style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 20px' }}>
              Pickering 2010, Tschudin-Sutter 2017
            </p>

            <div className="card-light" style={{ padding: '4px 0' }}>
              {EFFICACY_ROWS.map((row, i) => (
                <div
                  key={row.method}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i < EFFICACY_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                    background: i % 2 === 1 ? 'rgba(26,39,68,0.018)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'baseline', marginBottom: 8, gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a2744', flex: 1 }}>
                      {row.method}
                    </span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexShrink: 0 }}>
                      <span
                        className="font-mono-jb"
                        style={{ fontSize: 11, color: '#94a3b8' }}
                      >
                        {row.log}
                      </span>
                      <span
                        className="font-mono-jb"
                        style={{ fontSize: 14, fontWeight: 700, color: row.color }}
                      >
                        {row.pct}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      className="bar-animated"
                      style={{
                        height: '100%', width: `${row.barPct}%`,
                        background: row.color, borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Technique key notes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
                marginTop: 16,
              }}
            >
              {[
                {
                  icon: '💅',
                  title: 'Nail Hygiene',
                  body: '16× more bacteria under fingernails than surrounding skin. Nail brushes recommended for food handlers and clinical staff.',
                  source: 'Hedderwick 2000',
                },
                {
                  icon: '💧',
                  title: 'Dry Thoroughly',
                  body: 'Wet hands transfer 1,000× more bacteria than dry hands. Paper towels preferred over air dryers — air dryers aerosolize residual bacteria.',
                  source: 'Patrick 1997',
                },
              ].map((note) => (
                <div
                  key={note.title}
                  className="card-teal"
                  style={{ padding: '16px 18px' }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{note.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a2744', margin: '0 0 4px' }}>
                        {note.title}
                      </p>
                      <p style={{ fontSize: 12, color: '#475569', margin: '0 0 6px', lineHeight: 1.6, fontWeight: 300 }}>
                        {note.body}
                      </p>
                      <p className="font-mono-jb" style={{ fontSize: 10, color: '#00bfa5', margin: 0 }}>
                        {note.source}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              SECTION 4: BEHAVIOR & PUBLIC HEALTH
          ══════════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>
              Section 04 — Behavior &amp; Public Health
            </p>
            <h2
              style={{
                fontSize: 26, fontWeight: 700, color: '#1a2744',
                margin: '0 0 24px', letterSpacing: '-0.02em',
              }}
            >
              The Global Case
            </h2>

            {/* Global impact strip — full width teal accent */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1a2744 0%, #0f172a 100%)',
                borderRadius: 16,
                padding: '32px 28px',
                marginBottom: 20,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Bubble decoration */}
              <div
                aria-hidden
                style={{
                  position: 'absolute', bottom: -50, right: -50,
                  width: 180, height: 180, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,191,165,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute', top: -30, left: '50%',
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(2,136,209,0.12) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  position: 'relative', zIndex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 28,
                }}
              >
                {[
                  { value: '80%', label: 'Communicable diseases transmitted via hands', source: 'Prüss-Üstün 2008 WHO' },
                  { value: '3.5M', label: 'Child deaths from preventable diarrheal disease annually', source: 'WHO Global Burden' },
                  { value: '$3.35', label: 'Per DALY saved — most cost-effective public health intervention', source: 'Prüss-Üstün 2008' },
                ].map((item) => (
                  <div key={item.value} style={{ textAlign: 'center' }}>
                    <p
                      className="font-mono-jb"
                      style={{
                        fontSize: 38, fontWeight: 700, color: '#00bfa5',
                        margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1,
                      }}
                    >
                      {item.value}
                    </p>
                    <div style={{ width: 32, height: 2, background: '#00bfa5', borderRadius: 2, margin: '8px auto 10px' }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '0 0 4px', fontWeight: 400, lineHeight: 1.4 }}>
                      {item.label}
                    </p>
                    <p className="font-mono-jb" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      {item.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral nudges + Sports grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Nudge strategies */}
              <div className="card-light" style={{ borderLeft: '3px solid #00bfa5' }}>
                <div
                  style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #e0e6ee',
                    background: 'rgba(0,191,165,0.03)',
                  }}
                >
                  <p className="section-label" style={{ marginBottom: 4 }}>Behavioral Nudge Strategies</p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    Judah 2009 — compliance uplift by intervention type
                  </p>
                </div>
                <div>
                  {NUDGE_ROWS.map((row, i) => (
                    <div
                      key={row.strategy}
                      style={{
                        padding: '11px 20px',
                        borderBottom: i < NUDGE_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: i % 2 === 1 ? 'rgba(26,39,68,0.018)' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#334155', flex: 1 }}>{row.strategy}</span>
                      <span
                        className="font-mono-jb"
                        style={{ fontSize: 12, fontWeight: 700, color: '#00bfa5', whiteSpace: 'nowrap' }}
                      >
                        {row.uplift}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sports context */}
              <div className="card-light" style={{ borderLeft: '3px solid #0288d1' }}>
                <div
                  style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #e0e6ee',
                    background: 'rgba(2,136,209,0.03)',
                  }}
                >
                  <p className="section-label" style={{ color: '#0288d1', marginBottom: 4 }}>
                    Sports &amp; Athletic Context
                  </p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                    Cohen 2010 — Clinical Journal of Sport Medicine
                  </p>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1a2744', margin: '0 0 10px' }}>
                    MRSA Outbreak Rates by Sport
                  </p>
                  {SPORTS_ROWS.map((row, i) => (
                    <div
                      key={row.sport}
                      style={{
                        padding: '8px 0',
                        borderBottom: i < SPORTS_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#334155', margin: '0 0 2px' }}>{row.sport}</p>
                        <p className="font-mono-jb" style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{row.note}</p>
                      </div>
                      <span
                        className="font-mono-jb"
                        style={{ fontSize: 16, fontWeight: 700, color: '#0288d1', flexShrink: 0 }}
                      >
                        {row.mrsa}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 14,
                      padding: '10px 12px',
                      background: 'rgba(2,136,209,0.06)',
                      borderRadius: 8,
                      border: '1px solid rgba(2,136,209,0.15)',
                    }}
                  >
                    <p className="font-mono-jb" style={{ fontSize: 10, color: '#0288d1', margin: 0, lineHeight: 1.5 }}>
                      Athletes with higher handwashing frequency: −35% upper respiratory infections per season. Gym equipment hand hygiene reduces staphylococcal transmission by 73%.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Microbiome note */}
            <div
              className="card-teal"
              style={{ padding: '20px 22px' }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: 'rgba(0,191,165,0.15)',
                    border: '1px solid rgba(0,191,165,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 16 }}>🦠</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2744', margin: '0 0 5px' }}>
                    Skin Microbiome Balance
                  </p>
                  <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px', lineHeight: 1.65, fontWeight: 300 }}>
                    Healthy skin hosts ~1.5 million bacteria/cm², predominantly beneficial commensals (Staphylococcus epidermidis, Cutibacterium acnes) that outcompete pathogens. Over-washing beyond 20×/day disrupts the stratum corneum lipid barrier, reducing transient-flora colonization resistance and impairing innate immunity. Balance is the key principle — sufficient hygiene to remove transient pathogens without eliminating protective resident flora.
                  </p>
                  <p className="font-mono-jb" style={{ fontSize: 10, color: '#00bfa5', margin: 0 }}>
                    Blaser 2016 — Nature Medicine
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              FOOTER CITATIONS
          ══════════════════════════════════════════════════════════════════════ */}
          <footer>
            <hr className="hr-clean" style={{ marginBottom: 24 }} />
            <p className="section-label" style={{ marginBottom: 16 }}>
              Primary Literature
            </p>
            <div
              className="font-mono-jb"
              style={{
                fontSize: 10,
                color: '#94a3b8',
                lineHeight: 1.9,
                columns: '2',
                columnGap: 32,
              }}
            >
              {[
                'Ejemot RI et al. (2008). Hand washing for preventing diarrhoea. Cochrane Database of Systematic Reviews.',
                'Curtis V, Cairncross S. (2003). Effect of washing hands with soap on diarrhoea risk. Lancet Infectious Diseases, 3(5), 275–281.',
                'Nicas M, Jones RM. (2008). Relative contributions of four exposure pathways to influenza infection risk. Risk Analysis, 29(9), 1292–1303.',
                'Lewis NM et al. (2021). Household transmission of SARS-CoV-2 in the US. Lancet Regional Health.',
                'Bayés JT et al. (2021). Handwashing detection with the Apple Watch. CHI Conference on Human Factors.',
                'Hubner NO et al. (2010). Effect of alcohol hand gel vs conventional hand washing. Journal of Hospital Infection.',
                'Borchgrevink CP et al. (2013). Hand washing practices in a college town environment. J Environ Health, 75(8).',
                'WHO. (2009). WHO Guidelines on Hand Hygiene in Health Care. World Health Organization.',
                'Hedderwick SA et al. (2000). Pathogenic organisms associated with artificial fingernails. ICHE, 21(8).',
                'Patrick DR et al. (1997). The indoor transmission of respiratory viruses. Epidemiology & Infection.',
                'Pickering AJ et al. (2010). Efficacy of waterless hand hygiene compared to handwashing. AJTMH.',
                'Tschudin-Sutter S et al. (2017). Differential effects of hand hygiene on log reduction. Infect Control Hosp Epidemiol.',
                'Gorwitz RJ et al. (2007). Strategies for clinical management of MRSA. JAMA, 297(6).',
                'Judah G et al. (2009). Experimental pretesting of hand-washing interventions. Am J Public Health.',
                'Cohen PR. (2010). Community-acquired MRSA: a clinical review. Clin J Sport Med, 20(5).',
                'Blaser MJ. (2016). Antibiotic use and its consequences for the normal microbiome. Science, 352(6285).',
                'Freeman MC et al. (2014). Systematic review: Hygiene and health. Trop Med Int Health, 19(8).',
                'Prüss-Üstün A et al. (2008). Safer water, better health. World Health Organization.',
                'Elston DM. (2020). Hand hygiene and contact dermatitis. Journal of the American Academy of Dermatology.',
              ].map((ref, i) => (
                <p key={i} style={{ margin: '0 0 3px', breakInside: 'avoid' }}>
                  {ref}
                </p>
              ))}
            </div>
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <p
                className="font-mono-jb"
                style={{ fontSize: 10, color: '#cbd5e1', margin: 0 }}
              >
                GetZen Health Intelligence · Handwashing Science · WHO Clean Protocol
              </p>
            </div>
          </footer>

        </main>
      </div>
    </>
  )
}
