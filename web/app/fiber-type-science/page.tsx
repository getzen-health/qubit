// Muscle Fiber Type Science — server component, Next.js App Router
// Design: "Cellular Blueprint" — scientific precision meets genetic mystery

export const metadata = { title: 'Muscle Fiber Science' }

// ─── CSS Animations & Font Imports ────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800;900&family=Overpass+Mono:wght@400;600;700&family=Alegreya:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');

  @keyframes barGrow {
    from { width: 0%; }
    to { width: var(--bar-w); }
  }

  @keyframes barGrowFixed {
    from { width: 0; }
    to { width: var(--fixed-w); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(156,39,176,0.0); }
    50% { box-shadow: 0 0 24px 4px rgba(156,39,176,0.25); }
  }

  @keyframes pulseGlowGreen {
    0%, 100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.0); }
    50% { box-shadow: 0 0 24px 4px rgba(76,175,80,0.25); }
  }

  @keyframes grainMove {
    0% { transform: translate(0,0); }
    10% { transform: translate(-2%,-3%); }
    20% { transform: translate(3%,2%); }
    30% { transform: translate(-1%,4%); }
    40% { transform: translate(4%,-1%); }
    50% { transform: translate(-3%,3%); }
    60% { transform: translate(2%,-2%); }
    70% { transform: translate(-4%,1%); }
    80% { transform: translate(1%,-4%); }
    90% { transform: translate(-2%,2%); }
    100% { transform: translate(0,0); }
  }

  .fiber-bar {
    animation: barGrow 1.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    width: 0%;
  }

  .hero-fade {
    animation: fadeUp 0.8s ease forwards;
  }

  .hero-fade-1 { animation-delay: 0.1s; opacity: 0; }
  .hero-fade-2 { animation-delay: 0.25s; opacity: 0; }
  .hero-fade-3 { animation-delay: 0.4s; opacity: 0; }
  .hero-fade-4 { animation-delay: 0.55s; opacity: 0; }
  .hero-fade-5 { animation-delay: 0.7s; opacity: 0; }

  .stat-delay-0 { animation-delay: 0.3s; }
  .stat-delay-1 { animation-delay: 0.55s; }
  .stat-delay-2 { animation-delay: 0.8s; }

  .grain-overlay::before {
    content: '';
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 128px 128px;
    opacity: 0.35;
    pointer-events: none;
    z-index: 0;
    animation: grainMove 8s steps(10) infinite;
  }

  .fiber-strip-fast {
    animation: pulseGlow 4s ease-in-out infinite;
  }

  .fiber-strip-slow {
    animation: pulseGlowGreen 4s ease-in-out 2s infinite;
  }

  .spectrum-dot {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .spectrum-dot:hover {
    transform: scale(1.3);
    box-shadow: 0 0 12px rgba(255,193,7,0.6);
  }
`

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_STATS = [
  {
    value: '73% vs 24%',
    label: 'ST fiber % in elite marathoners vs sprinters',
    sub: 'Costill 1976 — muscle biopsy study',
    accent: '#4caf50',
    delay: 'stat-delay-0',
  },
  {
    value: '70%',
    label: 'Genetic determination of fiber type composition',
    sub: 'Simoneau & Bouchard 1995 — Am J Physiol',
    accent: '#ffc107',
    delay: 'stat-delay-1',
  },
  {
    value: '4×',
    label: 'VO₂max trainability range between responders',
    sub: 'HERITAGE Family Study — Bouchard 2015',
    accent: '#9c27b0',
    delay: 'stat-delay-2',
  },
]

// Costill 1976 biopsy data — FT percentages
const COSTILL_BARS = [
  { label: '100m Sprinters', ftPct: 76, stPct: 24, color: '#9c27b0' },
  { label: 'Cyclists', ftPct: 43, stPct: 57, color: '#7b68ee' },
  { label: 'Average', ftPct: 50, stPct: 50, color: '#94a3b8' },
  { label: 'XC Skiers', ftPct: 28, stPct: 72, color: '#4caf50' },
  { label: 'Marathoners', ftPct: 27, stPct: 73, color: '#2e7d32' },
]

// Athlete type spectrum — % ST
const SPECTRUM_ATHLETES = [
  { label: '100m Sprint', stPct: 24, pos: 24 },
  { label: 'Weightlifting', stPct: 40, pos: 40 },
  { label: 'Basketball', stPct: 50, pos: 50 },
  { label: 'Soccer Mid', stPct: 60, pos: 60 },
  { label: 'Marathon', stPct: 73, pos: 73 },
  { label: 'XC Skiing', stPct: 76, pos: 76 },
]

// ACTN3 genotypes
const ACTN3_GENOTYPES = [
  {
    genotype: 'R/R',
    frequency: '30%',
    dot: '#ef4444',
    label: 'Power Profile',
    desc: 'Both copies functional. Full alpha-actinin-3 in fast-twitch fibers. Overrepresented in elite sprint and power athletes.',
    sports: 'Sprinting, weightlifting, power sports',
    ftBias: true,
  },
  {
    genotype: 'R/X',
    frequency: '50%',
    dot: '#ffc107',
    label: 'Mixed Profile',
    desc: 'One copy functional. Intermediate phenotype. Most common genotype in the general population — the genetic middle ground.',
    sports: 'Middle-distance, team sports, mixed disciplines',
    ftBias: null,
  },
  {
    genotype: 'X/X',
    frequency: '20%',
    dot: '#4caf50',
    label: 'Endurance Profile',
    desc: 'Zero alpha-actinin-3 expression. Subtle endurance advantage. Slightly enriched in elite endurance athletes.',
    sports: 'Distance running, cycling, triathlon',
    ftBias: false,
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FiberStrips() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 32,
      }}
    >
      {/* Slow-twitch strip */}
      <div
        className="fiber-strip-slow"
        style={{
          width: 6,
          height: 80,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
          opacity: 0.9,
        }}
      />
      <div
        style={{
          width: 6,
          height: 80,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)',
          opacity: 0.6,
        }}
      />
      <div
        style={{
          width: 6,
          height: 80,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #66bb6a 0%, #4caf50 100%)',
          opacity: 0.35,
        }}
      />
      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 80,
          background: 'rgba(255,255,255,0.06)',
          margin: '0 4px',
        }}
      />
      {/* Fast-twitch strip */}
      <div
        style={{
          width: 6,
          height: 80,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #ce93d8 0%, #9c27b0 100%)',
          opacity: 0.35,
        }}
      />
      <div
        style={{
          width: 6,
          height: 80,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #ba68c8 0%, #9c27b0 100%)',
          opacity: 0.6,
        }}
      />
      <div
        className="fiber-strip-fast"
        style={{
          width: 6,
          height: 80,
          borderRadius: 3,
          background: 'linear-gradient(180deg, #ce93d8 0%, #9c27b0 100%)',
          opacity: 0.9,
        }}
      />
    </div>
  )
}

function TypeComparisonCards() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 12,
        marginTop: 28,
      }}
    >
      {/* Type I — Slow Twitch */}
      <div
        style={{
          background: 'rgba(19,10,26,0.9)',
          border: '1px solid rgba(76,175,80,0.3)',
          borderTop: '3px solid #4caf50',
          borderRadius: 16,
          padding: '22px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cell motif */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(76,175,80,0.06)',
            border: '1px solid rgba(76,175,80,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(76,175,80,0.08)',
            border: '1px solid rgba(76,175,80,0.18)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(76,175,80,0.15)',
              border: '2px solid rgba(76,175,80,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#4caf50',
                opacity: 0.8,
              }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#4caf50',
                margin: 0,
                fontFamily: 'Overpass Mono, ui-monospace, monospace',
              }}
            >
              TYPE I
            </p>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#f0fdf4',
                margin: '2px 0 0',
                fontFamily: 'Raleway, sans-serif',
                letterSpacing: '-0.3px',
              }}
            >
              Slow-Twitch
            </h3>
          </div>
        </div>

        {/* Attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
          {[
            { attr: 'Metabolism', val: 'Aerobic' },
            { attr: 'Mitochondria', val: 'High density' },
            { attr: 'Fatigue', val: 'Resistant (indefinite)' },
            { attr: 'Primary fuel', val: 'Fat oxidation' },
            { attr: 'MHC isoform', val: 'MHC-I' },
            { attr: 'Peak power', val: 'Low' },
            { attr: 'Contraction speed', val: '1–3 lengths/s' },
            { attr: 'Domain', val: 'Marathon god' },
          ].map((row) => (
            <div
              key={row.attr}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
                padding: '5px 0',
                borderBottom: '1px solid rgba(76,175,80,0.1)',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#86efac',
                  opacity: 0.6,
                  fontFamily: 'Alegreya, serif',
                }}
              >
                {row.attr}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#bbf7d0',
                  fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  textAlign: 'right',
                }}
              >
                {row.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Type II — Fast Twitch */}
      <div
        style={{
          background: 'rgba(19,10,26,0.9)',
          border: '1px solid rgba(156,39,176,0.3)',
          borderTop: '3px solid #9c27b0',
          borderRadius: 16,
          padding: '22px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cell motif */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(156,39,176,0.06)',
            border: '1px solid rgba(156,39,176,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(156,39,176,0.08)',
            border: '1px solid rgba(156,39,176,0.18)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(156,39,176,0.15)',
              border: '2px solid rgba(156,39,176,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#9c27b0',
                opacity: 0.8,
              }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#9c27b0',
                margin: 0,
                fontFamily: 'Overpass Mono, ui-monospace, monospace',
              }}
            >
              TYPE II
            </p>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#fdf4ff',
                margin: '2px 0 0',
                fontFamily: 'Raleway, sans-serif',
                letterSpacing: '-0.3px',
              }}
            >
              Fast-Twitch
            </h3>
          </div>
        </div>

        {/* Attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
          {[
            { attr: 'Metabolism', val: 'Anaerobic / Power' },
            { attr: 'Mitochondria', val: 'Low density' },
            { attr: 'Fatigue', val: 'Rapid (~10s max)' },
            { attr: 'Primary fuel', val: 'Glycogen' },
            { attr: 'MHC isoform', val: 'MHC-IIa / IIx' },
            { attr: 'Peak power', val: '4–5× more/gram' },
            { attr: 'Contraction speed', val: '3–7 lengths/s' },
            { attr: 'Domain', val: 'Sprint royalty' },
          ].map((row) => (
            <div
              key={row.attr}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
                padding: '5px 0',
                borderBottom: '1px solid rgba(156,39,176,0.1)',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#e9d5ff',
                  opacity: 0.6,
                  fontFamily: 'Alegreya, serif',
                }}
              >
                {row.attr}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#e9d5ff',
                  fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  textAlign: 'right',
                }}
              >
                {row.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroStatCard({
  value,
  label,
  sub,
  accent,
  delay,
}: {
  value: string
  label: string
  sub: string
  accent: string
  delay: string
}) {
  return (
    <div
      className={`hero-fade ${delay}`}
      style={{
        background: '#130a1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '20px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 180,
      }}
    >
      <p
        style={{
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: 'Overpass Mono, ui-monospace, monospace',
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#e2e8f0',
          margin: '8px 0 4px',
          fontFamily: 'Raleway, sans-serif',
          lineHeight: 1.3,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 10,
          color: '#475569',
          margin: 0,
          fontFamily: 'Overpass Mono, ui-monospace, monospace',
        }}
      >
        {sub}
      </p>
    </div>
  )
}

function SectionDivider({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ffc107' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#9c27b0' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4caf50' }} />
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 800,
          color: '#f8fafc',
          margin: '0 0 6px',
          fontFamily: 'Raleway, sans-serif',
          letterSpacing: '-0.5px',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            margin: 0,
            fontFamily: 'Alegreya, serif',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

function ScienceCard({
  title,
  citation,
  accent,
  children,
}: {
  title: string
  citation: string
  accent: string
  children: React.ReactNode
}) {
  const bg =
    accent === '#9c27b0'
      ? 'rgba(156,39,176,0.08)'
      : accent === '#4caf50'
        ? 'rgba(76,175,80,0.08)'
        : 'rgba(255,193,7,0.08)'
  const border =
    accent === '#9c27b0'
      ? 'rgba(156,39,176,0.25)'
      : accent === '#4caf50'
        ? 'rgba(76,175,80,0.25)'
        : 'rgba(255,193,7,0.25)'

  return (
    <div
      style={{
        background: '#130a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          padding: '14px 20px',
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: 0,
            fontFamily: 'Raleway, sans-serif',
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: accent,
            fontFamily: 'Overpass Mono, ui-monospace, monospace',
            letterSpacing: '0.05em',
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
            borderRadius: 4,
            padding: '1px 6px',
            marginTop: 6,
            display: 'inline-block',
          }}
        >
          {citation}
        </span>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function FactLine({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: '#94a3b8',
          fontFamily: 'Alegreya, serif',
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          fontFamily: 'Overpass Mono, ui-monospace, monospace',
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 13,
        color: '#94a3b8',
        margin: '0 0 10px',
        lineHeight: 1.7,
        fontFamily: 'Alegreya, serif',
      }}
    >
      {children}
    </p>
  )
}

function CostillBiopsyChart() {
  return (
    <ScienceCard
      title="Costill's Biopsy Data — Fiber Composition by Sport"
      citation="Costill 1976 — J Appl Physiol"
      accent="#4caf50"
    >
      <p
        style={{
          fontSize: 12,
          color: '#64748b',
          margin: '0 0 16px',
          fontFamily: 'Alegreya, serif',
          fontStyle: 'italic',
        }}
      >
        Horizontal bars show fast-twitch (FT) percentage — slow-twitch fills the remainder
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {COSTILL_BARS.map((row, i) => (
          <div key={row.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  fontFamily: 'Raleway, sans-serif',
                }}
              >
                {row.label}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#9c27b0',
                    fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  }}
                >
                  FT {row.ftPct}%
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#4caf50',
                    fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  }}
                >
                  ST {row.stPct}%
                </span>
              </div>
            </div>
            <div
              style={{
                height: 10,
                background: '#0d0814',
                borderRadius: 5,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="fiber-bar"
                style={
                  {
                    '--bar-w': `${row.ftPct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, #9c27b0, #ce93d8)`,
                    borderRadius: 5,
                    animationDelay: `${0.4 + i * 0.15}s`,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #9c27b0, #ce93d8)' }} />
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'Overpass Mono, ui-monospace, monospace' }}>Fast-twitch</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #2e7d32, #4caf50)' }} />
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'Overpass Mono, ui-monospace, monospace' }}>Slow-twitch</span>
        </div>
      </div>
    </ScienceCard>
  )
}

function ACTN3Card({ g }: { g: (typeof ACTN3_GENOTYPES)[number] }) {
  const accentColor = g.dot
  const bgColor =
    accentColor === '#ef4444'
      ? 'rgba(239,68,68,0.08)'
      : accentColor === '#ffc107'
        ? 'rgba(255,193,7,0.08)'
        : 'rgba(76,175,80,0.08)'
  const borderColor =
    accentColor === '#ef4444'
      ? 'rgba(239,68,68,0.3)'
      : accentColor === '#ffc107'
        ? 'rgba(255,193,7,0.3)'
        : 'rgba(76,175,80,0.3)'

  // DNA-like letter styling
  const letters = g.genotype.split('/')

  return (
    <div
      style={{
        background: '#130a1a',
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: '20px',
        flex: '1 1 200px',
      }}
    >
      {/* Genotype display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            padding: '6px 12px',
          }}
        >
          {letters.map((letter, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'Overpass Mono, ui-monospace, monospace',
                fontSize: 22,
                fontWeight: 700,
                color: accentColor,
                lineHeight: 1,
              }}
            >
              {letter}
              {i < letters.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 2px' }}>/</span>
              )}
            </span>
          ))}
        </div>
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#f1f5f9',
              margin: 0,
              fontFamily: 'Raleway, sans-serif',
            }}
          >
            {g.label}
          </p>
          <p
            style={{
              fontSize: 11,
              color: accentColor,
              margin: '2px 0 0',
              fontFamily: 'Overpass Mono, ui-monospace, monospace',
              fontWeight: 600,
            }}
          >
            {g.frequency} of population
          </p>
        </div>
      </div>

      <p
        style={{
          fontSize: 12,
          color: '#94a3b8',
          margin: '0 0 12px',
          lineHeight: 1.65,
          fontFamily: 'Alegreya, serif',
        }}
      >
        {g.desc}
      </p>

      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: '#475569',
            fontFamily: 'Overpass Mono, ui-monospace, monospace',
            display: 'block',
            marginBottom: 3,
          }}
        >
          TYPICAL SPORTS
        </span>
        <span
          style={{
            fontSize: 11,
            color: accentColor,
            fontFamily: 'Alegreya, serif',
            fontWeight: 600,
          }}
        >
          {g.sports}
        </span>
      </div>
    </div>
  )
}

function AthleteSpectrum() {
  return (
    <div
      style={{
        background: '#130a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: '3px solid #ffc107',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(255,193,7,0.07)',
          borderBottom: '1px solid rgba(255,193,7,0.2)',
          padding: '14px 20px',
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: 0,
            fontFamily: 'Raleway, sans-serif',
          }}
        >
          Athlete Type Spectrum
        </h3>
        <p
          style={{
            fontSize: 11,
            color: '#64748b',
            margin: '4px 0 0',
            fontFamily: 'Overpass Mono, ui-monospace, monospace',
          }}
        >
          Position = % slow-twitch fibers | Costill 1976 / Gollnick 1972 composite
        </p>
      </div>

      <div style={{ padding: '24px 20px' }}>
        {/* Spectrum track */}
        <div style={{ position: 'relative', marginBottom: 40 }}>
          {/* Track background */}
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background: 'linear-gradient(90deg, #9c27b0 0%, #7c3aed 30%, #475569 50%, #2e7d32 70%, #4caf50 100%)',
              opacity: 0.7,
              position: 'relative',
            }}
          />

          {/* Dots */}
          {SPECTRUM_ATHLETES.map((a) => (
            <div
              key={a.label}
              className="spectrum-dot"
              style={{
                position: 'absolute',
                top: -6,
                left: `${a.pos}%`,
                transform: 'translateX(-50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#0d0814',
                border: '2px solid #ffc107',
                cursor: 'default',
                zIndex: 2,
              }}
              title={`${a.label}: ${a.stPct}% ST`}
            />
          ))}

          {/* Labels below */}
          {SPECTRUM_ATHLETES.map((a) => (
            <div
              key={a.label + '-label'}
              style={{
                position: 'absolute',
                top: 24,
                left: `${a.pos}%`,
                transform: 'translateX(-50%)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#ffc107',
                  margin: '0 0 1px',
                  fontFamily: 'Overpass Mono, ui-monospace, monospace',
                }}
              >
                {a.stPct}%
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: '#64748b',
                  margin: 0,
                  fontFamily: 'Raleway, sans-serif',
                }}
              >
                {a.label}
              </p>
            </div>
          ))}
        </div>

        {/* Axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9c27b0',
              fontFamily: 'Overpass Mono, ui-monospace, monospace',
            }}
          >
            0% ST — Fast-Twitch dominant
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#4caf50',
              fontFamily: 'Overpass Mono, ui-monospace, monospace',
            }}
          >
            100% ST — Slow-Twitch dominant
          </span>
        </div>
      </div>
    </div>
  )
}

function TrainingColumn({
  type,
  accent,
  title,
  subtitle,
  items,
}: {
  type: 'st' | 'ft'
  accent: string
  title: string
  subtitle: string
  items: { heading: string; body: string }[]
}) {
  const bg = type === 'st' ? 'rgba(76,175,80,0.07)' : 'rgba(156,39,176,0.07)'
  const border = type === 'st' ? 'rgba(76,175,80,0.25)' : 'rgba(156,39,176,0.25)'

  return (
    <div
      style={{
        background: '#130a1a',
        border: `1px solid ${border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
        flex: '1 1 280px',
      }}
    >
      <div
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          padding: '16px 20px',
        }}
      >
        {/* Fiber strip indicator */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                background: accent,
                opacity: 0.3 + i * 0.14,
              }}
            />
          ))}
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: '0 0 4px',
            fontFamily: 'Raleway, sans-serif',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: accent,
            margin: 0,
            fontFamily: 'Alegreya, serif',
            fontStyle: 'italic',
          }}
        >
          {subtitle}
        </p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, i) => (
          <div key={i}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: accent,
                margin: '0 0 4px',
                fontFamily: 'Raleway, sans-serif',
                letterSpacing: '0.01em',
              }}
            >
              {item.heading}
            </p>
            <p
              style={{
                fontSize: 12,
                color: '#94a3b8',
                margin: 0,
                lineHeight: 1.65,
                fontFamily: 'Alegreya, serif',
              }}
            >
              {item.body}
            </p>
            {i < items.length - 1 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginTop: 10 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FiberTypeSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div
        className="grain-overlay"
        style={{
          minHeight: '100vh',
          background: '#0d0814',
          color: '#f1f5f9',
          fontFamily: 'Alegreya, serif',
          position: 'relative',
        }}
      >
        {/* ── HERO ──────────────────────────────────────────────────────────────── */}
        <div
          style={{
            background:
              'linear-gradient(160deg, #0d0814 0%, #13082a 30%, #0d0814 60%, #08140d 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            padding: 'clamp(40px, 6vw, 72px) 24px clamp(36px, 5vw, 60px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glows */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '20%',
              left: '15%',
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(76,175,80,0.10) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '20%',
              right: '15%',
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(156,39,176,0.10) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '60%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(255,193,7,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto' }}>
            {/* Superscript label */}
            <p
              className="hero-fade hero-fade-1"
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#ffc107',
                margin: '0 0 16px',
                fontFamily: 'Overpass Mono, ui-monospace, monospace',
              }}
            >
              Cellular Blueprint
            </p>

            {/* Fiber strips as visual metaphor */}
            <div className="hero-fade hero-fade-2">
              <FiberStrips />
            </div>

            {/* Main title */}
            <h1
              className="hero-fade hero-fade-2"
              style={{
                fontSize: 'clamp(34px, 7vw, 62px)',
                fontWeight: 900,
                margin: '0 0 16px',
                lineHeight: 1.05,
                letterSpacing: '-2px',
                fontFamily: 'Raleway, sans-serif',
                background: 'linear-gradient(135deg, #e9d5ff 0%, #9c27b0 35%, #ffc107 65%, #4caf50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Muscle Fiber Science
            </h1>

            {/* Subtitle */}
            <p
              className="hero-fade hero-fade-3"
              style={{
                fontSize: 'clamp(14px, 2.5vw, 18px)',
                color: '#94a3b8',
                margin: '0 auto 32px',
                maxWidth: 560,
                lineHeight: 1.7,
                fontFamily: 'Alegreya, serif',
                fontStyle: 'italic',
              }}
            >
              Inside every muscle, a genetic blueprint. Slow or fast — your fibers define your
              potential, and training defines how far you go.
            </p>

            {/* Tag strip */}
            <div
              className="hero-fade hero-fade-4"
              style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}
            >
              {[
                { label: 'Type I', color: '#4caf50', bg: 'rgba(76,175,80,0.12)', border: 'rgba(76,175,80,0.3)' },
                { label: 'Type II', color: '#9c27b0', bg: 'rgba(156,39,176,0.12)', border: 'rgba(156,39,176,0.3)' },
                { label: 'ACTN3 Genetics', color: '#ffc107', bg: 'rgba(255,193,7,0.12)', border: 'rgba(255,193,7,0.3)' },
                { label: 'Contractile Physiology', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.2)' },
                { label: 'Training Optimization', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.2)' },
              ].map((tag) => (
                <span
                  key={tag.label}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: tag.color,
                    background: tag.bg,
                    border: `1px solid ${tag.border}`,
                    borderRadius: 20,
                    padding: '5px 14px',
                    fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  }}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Hero comparison cards */}
            <div className="hero-fade hero-fade-5">
              <TypeComparisonCards />
            </div>
          </div>
        </div>

        {/* ── HERO STATS ────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 940, margin: '0 auto', padding: '32px 20px 0' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {HERO_STATS.map((s) => (
              <HeroStatCard key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* ── SECTION 1: THE PHYSIOLOGY ──────────────────────────────────────── */}
        <main style={{ maxWidth: 940, margin: '0 auto', padding: '44px 20px 0' }}>
          <SectionDivider
            title="The Physiology"
            subtitle="How muscle fibers are classified, recruited, and what makes them fundamentally different"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Card 1: Fiber Classification */}
            <ScienceCard
              title="Fiber Classification"
              citation="Brooke & Kaiser 1970 · Staron 1994"
              accent="#4caf50"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                {[
                  {
                    type: 'Type I',
                    color: '#4caf50',
                    traits: ['Slow oxidative', 'Aerobic ATP', 'Fatigue-resistant', 'Low peak force', 'MHC-I isoform'],
                  },
                  {
                    type: 'Type IIa',
                    color: '#7c3aed',
                    traits: ['Fast oxidative-glycolytic', 'Mixed aerobic/anaerobic', 'Intermediate fatigue', 'High force', 'MHC-IIa isoform'],
                  },
                  {
                    type: 'Type IIb / IIx',
                    color: '#9c27b0',
                    traits: ['Fast glycolytic', 'Anaerobic ATP', 'Rapid fatigue (~10s)', 'Peak force', 'MHC-IIx isoform'],
                  },
                ].map((ft) => (
                  <div
                    key={ft.type}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${ft.color}33`,
                      borderTop: `2px solid ${ft.color}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: ft.color,
                        margin: '0 0 8px',
                        fontFamily: 'Raleway, sans-serif',
                      }}
                    >
                      {ft.type}
                    </p>
                    {ft.traits.map((t) => (
                      <p
                        key={t}
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          margin: '0 0 3px',
                          fontFamily: 'Overpass Mono, ui-monospace, monospace',
                        }}
                      >
                        · {t}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: 'rgba(255,193,7,0.05)',
                  border: '1px solid rgba(255,193,7,0.18)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 14,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffc107',
                    margin: '0 0 4px',
                    fontFamily: 'Raleway, sans-serif',
                  }}
                >
                  Size Principle — Henneman 1957
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: '#94a3b8',
                    margin: 0,
                    lineHeight: 1.65,
                    fontFamily: 'Alegreya, serif',
                  }}
                >
                  Motor units are recruited in order of increasing size: Type I first, then IIa, then IIx. Smaller motor
                  neurons have lower activation thresholds and are engaged for all activities. Type IIx fibers are only
                  recruited at near-maximal intensities — explaining why most people never fully activate their fast-twitch
                  potential in everyday life.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <FactLine label="Human population average fiber composition" value="~50% ST" accent="#4caf50" />
              </div>
              <FactLine label="Observed individual variation range" value="20–80% ST" accent="#ffc107" />
              <FactLine label="Training-induced ST shift (elite endurance, years)" value="+3–5% max" accent="#94a3b8" />
            </ScienceCard>

            {/* Card 2: Costill Biopsy */}
            <CostillBiopsyChart />

            {/* Card 3: Contractile Properties */}
            <ScienceCard
              title="Contractile Properties"
              citation="Edman 1979 · Faulkner 1986"
              accent="#9c27b0"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#4caf50',
                      margin: '0 0 10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontFamily: 'Overpass Mono, ui-monospace, monospace',
                    }}
                  >
                    Slow-Twitch (Type I)
                  </p>
                  <FactLine label="Contraction speed" value="1–3 lengths/s" accent="#4caf50" />
                  <FactLine label="Peak force per CSA" value="Lower" accent="#4caf50" />
                  <FactLine label="Power output per gram" value="Baseline" accent="#4caf50" />
                  <FactLine label="Fatigue resistance" value="Indefinite (aerobic)" accent="#4caf50" />
                  <FactLine label="ATP source" value="Oxidative phosphorylation" accent="#4caf50" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#9c27b0',
                      margin: '0 0 10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontFamily: 'Overpass Mono, ui-monospace, monospace',
                    }}
                  >
                    Fast-Twitch (Type II)
                  </p>
                  <FactLine label="Contraction speed" value="3–7 lengths/s" accent="#9c27b0" />
                  <FactLine label="Peak force per CSA" value="Greater than ST" accent="#9c27b0" />
                  <FactLine label="Power output per gram" value="4–5× more" accent="#9c27b0" />
                  <FactLine label="Fatigue resistance" value="~10s maximal effort" accent="#9c27b0" />
                  <FactLine label="ATP source" value="Glycolysis + PCr" accent="#9c27b0" />
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'rgba(156,39,176,0.06)',
                  border: '1px solid rgba(156,39,176,0.18)',
                  borderRadius: 10,
                }}
              >
                <BodyText>
                  The 4–5× power advantage of fast-twitch fibers per gram of tissue explains why sprinters, despite having
                  smaller absolute muscle mass than powerlifters, can generate extraordinary rate of force development.
                  The speed of myosin ATPase activity — not just fiber size — determines contractile velocity.
                </BodyText>
              </div>
            </ScienceCard>

            {/* Card 4: Can Fiber Type Change */}
            <ScienceCard
              title="Can Fiber Type Change?"
              citation="Andersen 2000 · Trappe 2004 · Pette 2000"
              accent="#ffc107"
            >
              <BodyText>
                The most clinically relevant finding: Type IIb (IIx) fibers readily convert to Type IIa with endurance
                and resistance training — this is both significant and beneficial. The reverse pathway (IIa → IIb) occurs
                with extreme detraining or immobilization.
              </BodyText>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <FactLine label="IIb → IIa conversion with training" value="Yes, significant" accent="#4caf50" />
                <FactLine label="ST ↔ FT fundamental conversion (human)" value="Extremely limited" accent="#ef4444" />
                <FactLine label="Animal models (complete conversion)" value="Possible" accent="#ffc107" />
                <FactLine label="Max human ST increase above genetic baseline" value="3–5% (years)" accent="#94a3b8" />
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,193,7,0.06)',
                  border: '1px solid rgba(255,193,7,0.2)',
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#ffc107',
                    margin: '0 0 6px',
                    fontFamily: 'Raleway, sans-serif',
                  }}
                >
                  The Practical Conclusion
                </p>
                <BodyText>
                  Fundamental ST/FT ratio is largely fixed by genetics. Training optimizes the performance of the fibers
                  you already have — improving mitochondrial density in FT fibers, increasing oxidative capacity, and
                  converting IIx to more fatigue-resistant IIa. The strategy is optimization, not transformation.
                </BodyText>
              </div>
            </ScienceCard>
          </div>

          {/* ── SECTION 2: THE GENETICS ──────────────────────────────────────── */}
          <div style={{ marginTop: 52 }}>
            <SectionDivider
              title="Written in Your DNA"
              subtitle="The genetic architecture of fiber composition, trainability, and the ACTN3 story"
            />

            {/* DNA Sequence Visual Header */}
            <div
              style={{
                background: '#130a1a',
                border: '1px solid rgba(255,193,7,0.2)',
                borderRadius: 16,
                padding: '20px',
                marginBottom: 20,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'repeating-linear-gradient(90deg, rgba(255,193,7,0.02) 0px, rgba(255,193,7,0.02) 1px, transparent 1px, transparent 24px)',
                  pointerEvents: 'none',
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#ffc107',
                  margin: '0 0 10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                ACTN3 R577X — Chromosome 11q13.1
              </p>

              {/* DNA sequence visualization */}
              <div
                style={{
                  display: 'flex',
                  gap: 3,
                  flexWrap: 'wrap',
                  marginBottom: 14,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {['A','C','T','N','3','·','R','5','7','7','X','·','C','G','A','T','T','C','G','A','·','R','5','7','7','·','α','-','A','C','T','I','N','I','N','·','3'].map(
                  (ch, i) => {
                    const isKey = ['R','5','7','7','X','α'].includes(ch)
                    const isLabel = ['A','C','T','N','3'].includes(ch) && i < 5
                    return (
                      <span
                        key={i}
                        style={{
                          fontSize: isKey ? 14 : 11,
                          fontWeight: isKey ? 800 : 400,
                          color: isKey
                            ? '#ffc107'
                            : isLabel
                              ? '#e9d5ff'
                              : 'rgba(148,163,184,0.5)',
                          fontFamily: 'Overpass Mono, ui-monospace, monospace',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {ch}
                      </span>
                    )
                  }
                )}
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  margin: 0,
                  lineHeight: 1.65,
                  fontFamily: 'Alegreya, serif',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                The ACTN3 gene encodes alpha-actinin-3, a structural protein exclusive to fast-twitch muscle fibers.
                The R577X polymorphism creates a premature stop codon in the X allele, eliminating alpha-actinin-3
                expression entirely in X/X individuals — a functional genetic variation present in 20% of humans.
              </p>
            </div>

            {/* ACTN3 Genotype Cards */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              {ACTN3_GENOTYPES.map((g) => (
                <ACTN3Card key={g.genotype} g={g} />
              ))}
            </div>

            {/* Genetics science cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* ACTN3 detailed */}
              <ScienceCard
                title="ACTN3 R577X — Sprint vs Endurance Distributions"
                citation="Yang 2003 — Am J Hum Genet"
                accent="#ffc107"
              >
                <BodyText>
                  The landmark Yang 2003 study comparing elite sprint/power athletes vs elite endurance athletes vs
                  sedentary controls found statistically significant genotype frequency differences — confirming ACTN3
                  as a genuine performance gene, albeit one with modest individual-level predictive power.
                </BodyText>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                  {[
                    { group: 'Elite Sprint/Power', rr: '35–50%', rx: '44–50%', xx: '6–15%' },
                    { group: 'General Population', rr: '30%', rx: '50%', xx: '20%' },
                    { group: 'Elite Endurance', rr: '26–30%', rx: '47–50%', xx: '24–27%' },
                  ].map((row) => (
                    <div
                      key={row.group}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,193,7,0.15)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#ffc107',
                          margin: '0 0 8px',
                          fontFamily: 'Raleway, sans-serif',
                        }}
                      >
                        {row.group}
                      </p>
                      <FactLine label="R/R" value={row.rr} accent="#ef4444" />
                      <FactLine label="R/X" value={row.rx} accent="#ffc107" />
                      <FactLine label="X/X" value={row.xx} accent="#4caf50" />
                    </div>
                  ))}
                </div>
                <FactLine label="Variance in athletic performance explained by ACTN3" value="1–3% only" accent="#94a3b8" />
              </ScienceCard>

              {/* Heritability */}
              <ScienceCard
                title="Heritability of Fiber Type Composition"
                citation="Simoneau & Bouchard 1995 — Am J Physiol"
                accent="#ffc107"
              >
                <BodyText>
                  The Quebec Family Study examined fiber type composition in 127 pairs of relatives across generations.
                  Heritability estimates for ST fiber percentage ranged from 0.45 to 0.70 — meaning 45–70% of the
                  variance in muscle fiber composition is explained by genetic factors. The environment (training,
                  nutrition, activity) accounts for the remainder.
                </BodyText>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <FactLine label="Heritability of fiber type composition" value="h² = 0.45–0.70" accent="#ffc107" />
                  <FactLine label="Heritability of aerobic trainability (VO₂max response)" value="h² = 0.30–0.60" accent="#ffc107" />
                  <FactLine label="Genetic contribution to absolute VO₂max" value="~50%" accent="#ffc107" />
                </div>
              </ScienceCard>

              {/* HERITAGE Family Study */}
              <ScienceCard
                title="HERITAGE Family Study — Trainability Is Also Genetic"
                citation="Bouchard 2015 — Exerc Sport Sci Rev"
                accent="#9c27b0"
              >
                <BodyText>
                  The HERITAGE Family Study placed 481 sedentary individuals from 99 families on an identical 20-week
                  supervised aerobic training protocol. Despite perfect protocol compliance, VO₂max improvements ranged
                  from nearly zero to over 60% — a 4× difference between lowest and highest responders. Crucially, this
                  non-responder/high-responder pattern clustered within families, confirming a strong genetic basis for
                  trainability itself.
                </BodyText>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <FactLine label="Non-responders: VO₂max gain on identical protocol" value="+5–20%" accent="#ef4444" />
                  <FactLine label="High-responders: VO₂max gain on identical protocol" value="+40–60%" accent="#4caf50" />
                  <FactLine label="Ratio between highest and lowest responders" value="4× difference" accent="#ffc107" />
                  <FactLine label="Genetic loci influencing VO₂max trainability" value="25+ loci" accent="#9c27b0" />
                  <FactLine label="Polygenic score explaining variance in VO₂max response" value="8–12%" accent="#94a3b8" />
                </div>
              </ScienceCard>

              {/* Testosterone & Fiber Type */}
              <ScienceCard
                title="Sex, Testosterone & Fiber Type"
                citation="Bhasin 2001 — N Engl J Med"
                accent="#9c27b0"
              >
                <BodyText>
                  Males generally exhibit larger fiber cross-sectional area (CSA) than females, particularly in Type IIa
                  and IIx fibers. This is largely androgen-mediated. Controlled testosterone administration studies
                  demonstrate direct hypertrophic effects on fast-twitch fiber CSA.
                </BodyText>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <FactLine label="Type II fiber CSA increase with testosterone administration" value="+27%" accent="#9c27b0" />
                  <FactLine label="Male vs female fiber type composition difference" value="Minimal" accent="#94a3b8" />
                </div>
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(156,39,176,0.06)',
                    border: '1px solid rgba(156,39,176,0.18)',
                    borderRadius: 10,
                  }}
                >
                  <BodyText>
                    The male-female performance gap is not primarily explained by fiber type composition differences.
                    The dominant factors are cardiac output capacity, hemoglobin mass (oxygen delivery), and absolute
                    muscle mass — not the ratio of ST to FT fibers, which is broadly similar between sexes.
                  </BodyText>
                </div>
              </ScienceCard>
            </div>
          </div>

          {/* ── SECTION 3: TRAINING FOR YOUR TYPE ───────────────────────────── */}
          <div style={{ marginTop: 52 }}>
            <SectionDivider
              title="Training for Your Type"
              subtitle="Strategic optimization — working with your genetic profile, not against it"
            />

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <TrainingColumn
                type="st"
                accent="#4caf50"
                title="ST-Dominant — Endurance"
                subtitle="Mitochondria, fat oxidation, fatigue resistance"
                items={[
                  {
                    heading: 'Core Strengths',
                    body: 'High mitochondrial density, superior fat oxidation, lactate threshold, fatigue resistance — the physiological machinery of long-duration performance.',
                  },
                  {
                    heading: 'Target Sports',
                    body: 'Marathon, ultra-marathon, triathlon, road cycling, cross-country skiing, rowing (long distance).',
                  },
                  {
                    heading: 'Training Distribution',
                    body: '75–80% Zone 1–2 volume builds oxidative base. Threshold work 10–15%. Zone 3 intervals 5–10%. Avoid excessive high-intensity volume.',
                  },
                  {
                    heading: 'Resistance Training',
                    body: 'High-rep (15–25), low-load, minimal rest. Goal is muscular endurance, not hypertrophy. Excessive muscle mass is a metabolic burden for endurance.',
                  },
                  {
                    heading: 'Priority Adaptation',
                    body: 'Maximize mitochondrial volume density, capillary density, and fat oxidation capacity within your existing fiber profile.',
                  },
                ]}
              />

              <TrainingColumn
                type="ft"
                accent="#9c27b0"
                title="FT-Dominant — Power"
                subtitle="Peak power, acceleration, rate of force development"
                items={[
                  {
                    heading: 'Core Strengths',
                    body: 'Explosive peak power, superior rate of force development (RFD), high neuromuscular recruitment — the machinery of speed and power.',
                  },
                  {
                    heading: 'Target Sports',
                    body: '100–400m sprint, weightlifting, gymnastics, throws, jump events, explosive team sport positions (winger, striker).',
                  },
                  {
                    heading: 'Resistance Training',
                    body: 'Heavy compound lifts at 1–5RM. Emphasis on bar speed and intent. Cluster sets, contrast training, and post-activation potentiation protocols.',
                  },
                  {
                    heading: 'Speed & Power Work',
                    body: 'Sprint intervals 10–30s max effort with full recovery (3–5 min). Plyometrics: depth jumps, bounding. Olympic lifts for RFD.',
                  },
                  {
                    heading: 'Aerobic Base — Non-Negotiable',
                    body: 'Zone 1–2 essential for recovery, cardiac efficiency, and IIb→IIa conversion. Adaptations are slower but critical. Periodize: base → power → peak.',
                  },
                ]}
              />
            </div>

            {/* Mixed Profile card */}
            <div
              style={{
                background: '#130a1a',
                border: '1px solid rgba(148,163,184,0.18)',
                borderLeft: '3px solid #94a3b8',
                borderRadius: 16,
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 4,
                        height: 20,
                        borderRadius: 2,
                        background: i < 2 ? '#4caf50' : '#9c27b0',
                        opacity: 0.7,
                      }}
                    />
                  ))}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i + 3}
                      style={{
                        width: 4,
                        height: 20,
                        borderRadius: 2,
                        background: i < 1 ? '#4caf50' : '#9c27b0',
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#f1f5f9',
                    margin: 0,
                    fontFamily: 'Raleway, sans-serif',
                  }}
                >
                  Mixed Profile — Most Athletes (45–55% ST)
                </h3>
              </div>

              <BodyText>
                The majority of humans fall in the 45–55% slow-twitch range. This is the natural home of middle-distance
                running (800m–3000m), team sport generalists, and multisport athletes — where neither extreme dominates.
              </BodyText>

              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,193,7,0.05)',
                  border: '1px solid rgba(255,193,7,0.18)',
                  borderRadius: 10,
                  marginTop: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffc107',
                    margin: '0 0 6px',
                    fontFamily: 'Raleway, sans-serif',
                  }}
                >
                  Interference Effect — Hawley 2002
                </p>
                <BodyText>
                  Concurrent strength and endurance training simultaneously reduces maximum strength gain by 20–30%
                  vs pure strength training. AMPK-activated pathways from endurance work suppress mTOR-dependent
                  hypertrophy signaling. Solution: sequence modalities within the week, separate days, or periodize
                  primary emphasis by training phase and competitive season.
                </BodyText>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: WHERE DO YOU FIT ──────────────────────────────────── */}
          <div style={{ marginTop: 52 }}>
            <SectionDivider
              title="Where Do You Fit?"
              subtitle="Sport-specific fiber profiles and how KQuarks estimates your type from workout history"
            />

            <AthleteSpectrum />

            {/* KQuarks estimation section */}
            <div
              style={{
                marginTop: 20,
                background: '#130a1a',
                border: '1px solid rgba(156,39,176,0.2)',
                borderLeft: '3px solid #9c27b0',
                borderRadius: 16,
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#f1f5f9',
                  margin: '0 0 8px',
                  fontFamily: 'Raleway, sans-serif',
                }}
              >
                How KQuarks Estimates Your Profile
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  margin: '0 0 16px',
                  fontFamily: 'Overpass Mono, ui-monospace, monospace',
                }}
              >
                Inferred from your Apple Health workout history — functional phenotyping, not genetic testing
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  {
                    indicator: 'High proportion of intense sessions (>80% HRmax)',
                    signal: 'Power-oriented profile',
                    color: '#9c27b0',
                  },
                  {
                    indicator: 'Long Zone 2 sessions dominant in workout history',
                    signal: 'Endurance-oriented profile',
                    color: '#4caf50',
                  },
                  {
                    indicator: 'Explosive sport participation logged',
                    signal: 'Fast-twitch indicator',
                    color: '#9c27b0',
                  },
                  {
                    indicator: 'Low HR drift on long aerobic efforts',
                    signal: 'Strong oxidative base',
                    color: '#4caf50',
                  },
                ].map((item) => (
                  <div
                    key={item.indicator}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${item.color}22`,
                      borderRadius: 10,
                      padding: '12px 14px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        margin: '0 0 8px',
                        lineHeight: 1.5,
                        fontFamily: 'Alegreya, serif',
                      }}
                    >
                      {item.indicator}
                    </p>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: item.color,
                        fontFamily: 'Overpass Mono, ui-monospace, monospace',
                        background: `${item.color}15`,
                        border: `1px solid ${item.color}30`,
                        borderRadius: 6,
                        padding: '3px 8px',
                        display: 'inline-block',
                      }}
                    >
                      → {item.signal}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  background: 'rgba(255,193,7,0.05)',
                  border: '1px solid rgba(255,193,7,0.15)',
                  borderRadius: 8,
                }}
              >
                <p style={{ fontSize: 11, color: '#a16207', margin: 0, lineHeight: 1.6, fontFamily: 'Alegreya, serif' }}>
                  <span style={{ color: '#ffc107', fontWeight: 700 }}>Note:</span>{' '}
                  For genetic confirmation, direct-to-consumer tests (23andMe, Athletigen, DNAFit) report ACTN3
                  R577X status. However, remember: ACTN3 explains only 1–3% of athletic performance variance.
                  Your training history and current physiology are far more actionable data.
                </p>
              </div>
            </div>
          </div>

          {/* ── FOOTER CITATIONS ─────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 52,
              padding: '22px 24px',
              background: '#0d0814',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 16,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 14px',
                fontFamily: 'Overpass Mono, ui-monospace, monospace',
              }}
            >
              Primary Literature
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                'Brooke MH, Kaiser KK. Muscle fiber types: how many and what kind? Arch Neurol. 1970;23(4):369–379.',
                'Costill DL, et al. Skeletal muscle enzymes and fiber composition in male and female track athletes. J Appl Physiol. 1976;40(2):149–154.',
                'Edman KAP. The velocity of unloaded shortening and its relation to sarcomere length and isometric force in vertebrate muscle fibres. J Physiol. 1979;291:143–159.',
                'Henneman E, et al. Functional significance of cell size in spinal motoneurons. J Neurophysiol. 1965;28:560–580.',
                'Simoneau JA, Bouchard C. Genetic determinism of fiber type proportion in human skeletal muscle. FASEB J. 1995;9(11):1091–1095.',
                'Staron RS, et al. Fiber type composition of the vastus lateralis muscle of young men and women. J Histochem Cytochem. 1994;42(1):27–41.',
                'Yang N, et al. ACTN3 genotype is associated with human elite athletic performance. Am J Hum Genet. 2003;73(3):627–631.',
                'Andersen JL, Aagaard P. Myosin heavy chain IIX overshoot in human skeletal muscle. Muscle Nerve. 2000;23(7):1095–1104.',
                'Trappe S, et al. Single muscle fiber adaptations with marathon training. J Appl Physiol. 2004;97(2):721–727.',
                'Bhasin S, et al. Testosterone dose-response relationships in healthy young men. Am J Physiol. 2001;281(6):E1172–E1181.',
                'Bouchard C, et al. Genomic predictors of the maximal O₂ uptake response to standardized exercise training programs. J Appl Physiol. 2011;110(5):1160–1170.',
                'Hawley JA. Adaptations of skeletal muscle to prolonged, intense endurance training. Clin Exp Pharmacol Physiol. 2002;29(3):218–222.',
                'Pette D, Staron RS. Myosin isoforms, muscle fiber types, and transitions. Microsc Res Tech. 2000;50(6):500–509.',
              ].map((ref, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    margin: 0,
                    lineHeight: 1.6,
                    fontFamily: 'Overpass Mono, ui-monospace, monospace',
                  }}
                >
                  {ref}
                </p>
              ))}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '18px 0' }} />
            <p style={{ fontSize: 11, color: '#1e293b', margin: 0, lineHeight: 1.6, fontFamily: 'Alegreya, serif' }}>
              This page summarises peer-reviewed research for educational purposes. Individual results vary substantially.
              Consult a sports medicine professional before beginning any high-intensity training programme.
            </p>
          </div>

          <div style={{ height: 80 }} />
        </main>
      </div>
    </>
  )
}
