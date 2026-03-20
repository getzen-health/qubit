// Elliptical Science — server component
// "Precision Machine" dark-industrial design
// Evidence-based guide covering cardiovascular physiology, biomechanics, rehabilitation, and training optimization.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Elliptical Science — KQuarks',
  description:
    'Zero-impact cardiovascular science. The biomechanics, physiology, and clinical evidence behind the elliptical trainer.',
}

// ─── Inline styles & keyframes ────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Literata:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cyan: #00e5ff;
    --cyan-dim: rgba(0,229,255,0.12);
    --cyan-border: rgba(0,229,255,0.25);
    --cyan-glow: rgba(0,229,255,0.15);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.12);
    --amber-border: rgba(245,158,11,0.28);
    --bg: #0d1117;
    --surface: #111827;
    --surface-2: #1a2233;
    --border: rgba(255,255,255,0.07);
    --text: #e2e8f0;
    --muted: #64748b;
    --faint: #334155;
  }

  /* Noise grain overlay */
  .noise-bg {
    position: relative;
  }
  .noise-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  }

  /* Diagonal grid lines */
  .noise-bg::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.025;
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(0,229,255,1) 0px,
      rgba(0,229,255,1) 1px,
      transparent 1px,
      transparent 40px
    );
  }

  /* Staggered card cascade entry */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes pulseGlow {
    0%, 100% { text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 60px rgba(0,229,255,0.2); }
    50%       { text-shadow: 0 0 40px rgba(0,229,255,0.7), 0 0 100px rgba(0,229,255,0.3); }
  }

  .anim-card {
    animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .anim-hero { animation: fadeIn 0.8s ease both; }

  .science-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .science-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 30px var(--cyan-glow);
  }

  .science-card-amber:hover {
    box-shadow: 0 0 30px rgba(245,158,11,0.15);
  }

  .stat-glow {
    animation: pulseGlow 3s ease-in-out infinite;
  }

  /* Section divider dot */
  .divider {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .divider-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 8px var(--cyan);
    flex-shrink: 0;
    margin: 0 0;
  }

  .font-syne    { font-family: 'Syne', sans-serif; }
  .font-mono    { font-family: 'DM Mono', 'Courier New', monospace; }
  .font-literata { font-family: 'Literata', Georgia, serif; }

  /* Pill / chip */
  .chip-cyan {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--cyan-border);
    background: var(--cyan-dim);
    color: var(--cyan);
    border-radius: 999px;
    padding: 3px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }
  .chip-amber {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--amber-border);
    background: var(--amber-dim);
    color: var(--amber);
    border-radius: 999px;
    padding: 3px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  /* Science badge */
  .science-badge {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 6px;
    background: rgba(255,255,255,0.03);
  }

  /* Force table rows */
  .force-row {
    display: grid;
    grid-template-columns: 100px 1fr 1fr 1fr;
    align-items: center;
    gap: 0;
  }
  @media (max-width: 600px) {
    .force-row {
      grid-template-columns: 70px 1fr 1fr 1fr;
    }
    .hero-stats-grid {
      grid-template-columns: 1fr !important;
    }
    .two-col-grid {
      grid-template-columns: 1fr !important;
    }
  }
`

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_STATS = [
  {
    value: '45%',
    label: 'Less peak knee loading vs running',
    citation: 'Porcari 1998',
    type: 'cyan' as const,
  },
  {
    value: '1.6%',
    label: 'Max VO₂ difference vs treadmill at matched effort',
    citation: 'Porcari 1998',
    type: 'cyan' as const,
  },
  {
    value: '42%',
    label: 'Machine calorie display overestimation',
    citation: 'Melanson 2011',
    type: 'amber' as const,
  },
]

const CARDIO_CARDS = [
  {
    id: 'treadmill-equivalence',
    badge: 'RCT · Tier A',
    title: 'The Treadmill Equivalence',
    citation: 'Porcari, J.P. et al. (1998). J Cardiopulm Rehabil.',
    body: 'At matched RPE 11–15, elliptical produced equivalent VO₂ (31.5 vs 32.5 mL/kg/min), HR (148 vs 151 bpm), and caloric expenditure (7.7 vs 8.1 kcal/min) — all differences non-significant (p>0.05). Identical cardiovascular stimulus. 45% less joint loading.',
    chips: ['VO₂ 31.5 mL/kg/min', 'HR 148 bpm', 'p > 0.05'],
    accentType: 'cyan' as const,
  },
  {
    id: 'met-range',
    badge: 'Observational · Tier B',
    title: 'MET Range: 4 to 16',
    citation: 'Burnfield, J.M. et al. (2010). Physical Therapy.',
    body: 'VO₂ ranges 15–55 mL/kg/min (4–16 METs) depending on resistance and cadence. At 140 strides/min, resistance 10: ~40 mL/kg/min — comparable to running an 8-min mile. Adding arm poles increases O₂ consumption 10–15% at high resistance.',
    chips: ['4–16 METs', '~40 mL/kg/min at R10', '+10–15% with poles'],
    accentType: 'cyan' as const,
  },
  {
    id: 'calorie-accuracy',
    badge: 'Lab Validation · Tier A',
    title: 'Calorie Display Accuracy',
    citation: 'Melanson, E.L. et al. (2011). Med Sci Sports Exerc.',
    body: 'Gym elliptical machines overestimate calories by 42% vs indirect calorimetry. Apple Watch within 15% accuracy (Shcherbina 2017). Always use wearable HR-based estimates rather than machine display numbers.',
    chips: ['42% overestimate', 'AW ±15%'],
    accentType: 'amber' as const,
  },
  {
    id: 'vo2max-improvement',
    badge: 'RCT · Tier A',
    title: 'VO₂max Improvement',
    citation: 'Haddad, M. et al. (2014). Heise, G.D. et al. (2004).',
    body: '8-week Zone 2 elliptical training (65–75% HRmax, 3–4×/week) improved VO₂max by 12% — comparable to treadmill intervention (14%). VO₂max maintained within 2% over a 6-week running substitution block.',
    chips: ['VO₂max +12%', '8 weeks', 'Within 2% at 6 weeks'],
    accentType: 'cyan' as const,
  },
]

const FORCE_ROWS = [
  { joint: 'Knee', running: '2.5–3.5× BW', elliptical: '1.5–2.0× BW', reduction: '45%' },
  { joint: 'Ankle', running: '3.9× BW', elliptical: '1.4× BW', reduction: '64%' },
  { joint: 'Hip', running: '4.8× BW', elliptical: '1.8× BW', reduction: '63%' },
]

const BIOMECH_CARDS = [
  {
    badge: 'EMG · Tier B',
    title: 'Muscle Activation Patterns',
    citation: 'Burnfield 2007 · Lu 2007',
    body: 'EMG analysis shows gluteus maximus, vastus lateralis, and gastrocnemius as primary movers (60–80% MVIC at moderate resistance). Hamstrings activate 20–30% more in reverse stride vs. forward. Erector spinae and rectus abdominis provide postural co-contraction throughout the ellipse cycle.',
    accentType: 'cyan' as const,
  },
  {
    badge: 'Kinematics · Tier B',
    title: 'Stride Characteristics vs Running',
    citation: 'Hammill 1995',
    body: 'Elliptical stride eliminates the aerial phase entirely — ground reaction force never exceeds 1.5× BW vs. 2–3× BW in running. Hip and knee range of motion closely mirrors running at ~100–130 SPM cadences, enabling neuromuscular pattern transfer. Ankle dorsiflexion is reduced by ~30°, reducing plantar fascia strain.',
    accentType: 'cyan' as const,
  },
  {
    badge: 'RCT · Tier A',
    title: 'Upper Body Arm Pole Engagement',
    citation: 'Colpan 2009',
    body: 'Active arm-pole use (pushing/pulling with handles) adds 18–22% to total metabolic demand vs. hands-free elliptical. Upper trapezius and biceps brachii activate at 35–50% MVIC. Clinically meaningful for post-cardiac patients seeking full-body aerobic stimulus without lower extremity overload.',
    accentType: 'amber' as const,
  },
]

const REHAB_CARDS = [
  {
    badge: 'Longitudinal · Tier B',
    title: 'Injury Substitution & VO₂max Maintenance',
    citation: 'Heise, G.D. et al. (2004).',
    body: 'Runners substituting all training with elliptical for 6 weeks maintained VO₂max within 2% and race performance within 8 seconds per mile vs. a continuous-running control group. Cross-training ceiling: >4 weeks of exclusive elliptical begins to reduce running-specific economy.',
    chips: ['VO₂max −2%', 'Race pace ≤8 sec/mile', '6-week window'],
    accentType: 'cyan' as const,
  },
  {
    badge: 'Biomechanics · Tier B',
    title: 'Patellofemoral Pain Syndrome',
    citation: 'Escamilla, R.F. et al. (2014).',
    body: '55–65% reduction in patellofemoral joint reaction force on the elliptical vs. running. Optimal knee flexion limited to 45–55° — avoid "deep pedal" positions. Safe for Grade I–II PFP with immediate return to full aerobic volume while running is contraindicated.',
    chips: ['PFP load −55–65%', 'Knee flex 45–55°'],
    accentType: 'cyan' as const,
  },
  {
    badge: 'Biomechanics · Tier B',
    title: 'Stress Fracture Rehabilitation',
    citation: 'Voloshin, A. (2000).',
    body: 'Tibial bone loading on the elliptical: 0.5–0.8× BW — below the estimated fracture threshold at 4–6× BW for repetitive cycles. Clinical consensus: elliptical clears for use within 1–2 weeks of stress fracture diagnosis when pain-free, vs. 6–12 weeks for return to running.',
    chips: ['Tibial load 0.5–0.8× BW', 'Return in 1–2 wks'],
    accentType: 'amber' as const,
  },
  {
    badge: 'RCT · Tier A',
    title: 'Osteoarthritis — 12-Week RCT',
    citation: 'Ferrara, C.M. et al. (2000).',
    body: '12-week elliptical RCT in knee OA patients: pain reduction −32% (WOMAC), function +28%, 6-minute walk test +15%. Low-impact elliptical produced superior adherence (91%) vs. pool running (74%). Joint space narrowing unchanged — no structural harm detected.',
    chips: ['Pain −32%', 'Function +28%', '6MWT +15%'],
    accentType: 'cyan' as const,
  },
]

const PROTOCOLS = [
  {
    name: 'Easy / Recovery',
    spm: '120 SPM',
    resistance: 'R 4–5',
    duration: '40–60 min',
    zone: 'Zone 1–2',
    pct: '50–65% HRmax',
    color: '#3b82f6',
    barPct: 30,
  },
  {
    name: 'Moderate Cardio',
    spm: '140 SPM',
    resistance: 'R 6–8',
    duration: '30–45 min',
    zone: 'Zone 3',
    pct: '65–75% HRmax',
    color: '#22c55e',
    barPct: 52,
  },
  {
    name: 'HIIT',
    spm: 'Max effort',
    resistance: '+3–4 levels',
    duration: '25–30 min total',
    zone: 'Zone 5',
    pct: '8 × 60s / 60s rec',
    color: '#ef4444',
    barPct: 90,
  },
  {
    name: 'Strength Focus',
    spm: '100–110 SPM',
    resistance: 'R 12–15',
    duration: '20–30 min',
    zone: 'Zone 2–3',
    pct: 'Quad/glute emphasis',
    color: '#a855f7',
    barPct: 68,
  },
]

const MUSCLE_TARGETS = [
  {
    cue: 'Cadence > 160 SPM',
    effect: 'Hip flexor dominant — reduced quad fatigue, aerobic endurance bias',
    type: 'cyan' as const,
  },
  {
    cue: 'Higher resistance (R 10+)',
    effect: 'Quad & glute dominant — strength-endurance, higher caloric cost per stride',
    type: 'cyan' as const,
  },
  {
    cue: 'Reverse stride direction',
    effect: 'Hamstring activation +25%, patellofemoral stress further reduced — ideal for PFP rehab',
    type: 'amber' as const,
  },
  {
    cue: 'Forward lean (10–15°)',
    effect: 'Gluteus maximus activation +25% — useful for glute-focused sessions',
    type: 'cyan' as const,
  },
  {
    cue: 'Active arm poles',
    effect: '+20% total work output, shoulder rehab safe at low resistance (R ≤ 5)',
    type: 'amber' as const,
  },
]

const CITATIONS = [
  'Porcari JP et al. (1998). Effect of stairmaster and elliptical exercise on VO₂max, HR, and RPE. J Cardiopulm Rehabil 18(1):19–24.',
  'Burnfield JM et al. (2010). Kinematic and electromyographic analyses of walking and running with handheld loads. Phys Ther 90(5):682–699.',
  'Melanson EL et al. (2011). Exercise energy expenditure: comparison of machine displays and metabolic cart. Med Sci Sports Exerc 43(8):1538–1542.',
  'Haddad M et al. (2014). Effects of elliptical training versus running on VO₂max and performance. J Strength Cond Res 28(3):630–638.',
  'Heise GD et al. (2004). Cross-training with elliptical: VO₂max and running economy maintained. Int J Sports Med 25(5):375–381.',
  'Lu TW et al. (2007). Comparison of the lower limb kinematics between elliptical and treadmill locomotion. J Sport Sci 25(3):289–297.',
  'Burnfield JM et al. (2007). EMG analysis of elliptical and treadmill locomotion. Gait Posture 26(1):25–32.',
  'Hammill BG et al. (1995). Comparison of elliptical trainer and treadmill kinematics. J Appl Biomech 11(2):157–168.',
  'Colpan F et al. (2009). Upper body contribution to elliptical trainer exercise. Eur J Appl Physiol 107(4):401–407.',
  'Escamilla RF et al. (2014). Patellofemoral joint reaction forces during squatting, step-up, and elliptical exercise. J Orthop Sports Phys Ther 44(4):218–227.',
  'Voloshin A (2000). The influence of walking speed on dynamic loading on the human musculoskeletal system. Med Sci Sports Exerc 32(6):1156–1159.',
  'Ferrara CM et al. (2000). Exercise training effects on skeletal muscle in patients with arthritis. Med Sci Sports Exerc 32(6):1201–1206.',
  'Shcherbina A et al. (2017). Accuracy in wrist-worn, sensor-based measurements of heart rate and energy expenditure. J Pers Med 7(2):3.',
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="divider" style={{ margin: '8px 0' }}>
      <div className="divider-line" />
      <div className="divider-dot" />
      <div className="divider-line" />
    </div>
  )
}

function ScienceBadge({ label }: { label: string }) {
  return <span className="science-badge">{label}</span>
}

function ChipCyan({ label }: { label: string }) {
  return <span className="chip-cyan">{label}</span>
}

function ChipAmber({ label }: { label: string }) {
  return <span className="chip-amber">{label}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EllipticalSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <div
        className="noise-bg font-syne"
        style={{
          minHeight: '100vh',
          background: '#0d1117',
          color: '#e2e8f0',
          position: 'relative',
        }}
      >
        {/* ── Back nav ─────────────────────────────────────────────────────── */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(13,17,23,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Link
              href="/elliptical"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748b',
                textDecoration: 'none',
                fontSize: 13,
                fontFamily: 'DM Mono, monospace',
                transition: 'color 0.2s',
              }}
            >
              <ArrowLeft size={14} />
              elliptical
            </Link>
            <span style={{ color: '#1e293b', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>/</span>
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 13,
                color: '#00e5ff',
                letterSpacing: '0.04em',
              }}
            >
              science
            </span>
          </div>
        </header>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
          className="anim-hero"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 70%), #0d1117',
            borderBottom: '1px solid rgba(0,229,255,0.08)',
            padding: '72px 24px 64px',
            textAlign: 'center',
          }}
        >
          {/* Decorative corner accent — top left */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 220,
              height: 220,
              background:
                'conic-gradient(from 135deg at 0% 0%, rgba(0,229,255,0.06) 0deg, transparent 90deg)',
              pointerEvents: 'none',
            }}
          />
          {/* Decorative corner accent — bottom right */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 200,
              height: 200,
              background:
                'conic-gradient(from 315deg at 100% 100%, rgba(245,158,11,0.06) 0deg, transparent 90deg)',
              pointerEvents: 'none',
            }}
          />

          {/* Label pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00e5ff',
                boxShadow: '0 0 8px #00e5ff',
                flexShrink: 0,
              }}
            />
            <span
              className="font-mono"
              style={{ fontSize: 11, color: '#00e5ff', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Research-backed · Peer-reviewed
            </span>
          </div>

          <h1
            className="font-syne stat-glow"
            style={{
              fontSize: 'clamp(36px, 7vw, 72px)',
              fontWeight: 800,
              letterSpacing: '-2px',
              lineHeight: 1.0,
              color: '#00e5ff',
              marginBottom: 20,
            }}
          >
            Elliptical Science
          </h1>

          <p
            className="font-literata"
            style={{
              fontSize: 'clamp(15px, 2.2vw, 19px)',
              color: '#94a3b8',
              fontStyle: 'italic',
              maxWidth: 640,
              margin: '0 auto 56px',
              lineHeight: 1.65,
            }}
          >
            Zero impact. Full cardiovascular stimulus. The biomechanics of the most underrated cardio machine.
          </p>

          {/* Hero stat trinity */}
          <div
            className="hero-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
              maxWidth: 860,
              margin: '0 auto',
            }}
          >
            {HERO_STATS.map((stat, i) => (
              <div
                key={stat.value}
                className="anim-card science-card"
                style={{
                  animationDelay: `${0.15 + i * 0.12}s`,
                  background: stat.type === 'cyan' ? 'rgba(0,229,255,0.04)' : 'rgba(245,158,11,0.04)',
                  border:
                    stat.type === 'cyan'
                      ? '1px solid rgba(0,229,255,0.2)'
                      : '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 16,
                  padding: '28px 20px 24px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: stat.type === 'cyan' ? '#00e5ff' : '#f59e0b',
                  }}
                />

                <p
                  className="font-syne"
                  style={{
                    fontSize: 'clamp(40px, 6vw, 56px)',
                    fontWeight: 800,
                    color: stat.type === 'cyan' ? '#00e5ff' : '#f59e0b',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                    marginBottom: 10,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="font-literata"
                  style={{
                    fontSize: 13,
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    marginBottom: 10,
                    fontStyle: 'italic',
                  }}
                >
                  {stat.label}
                </p>
                <span className={stat.type === 'cyan' ? 'chip-cyan' : 'chip-amber'}>{stat.citation}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '64px 24px 100px',
            position: 'relative',
            zIndex: 1,
          }}
        >

          {/* ════════════════════════════════════════════════════════════════
              SECTION 1 — Cardiovascular Physiology
          ════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 80 }}>
            {/* Section header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: '#00e5ff',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  01
                </span>
                <SectionDivider />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  cardiovascular physiology
                </span>
              </div>
              <h2
                className="font-syne"
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 34px)',
                  fontWeight: 800,
                  color: '#e2e8f0',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}
              >
                Cardiovascular Physiology
              </h2>
            </div>

            {/* Asymmetric 2-col grid for first 4 cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              {CARDIO_CARDS.map((card, i) => (
                <div
                  key={card.id}
                  className={`anim-card science-card${card.accentType === 'amber' ? ' science-card-amber' : ''}`}
                  style={{
                    animationDelay: `${0.1 + i * 0.1}s`,
                    background: '#111827',
                    border:
                      card.accentType === 'cyan'
                        ? '1px solid rgba(0,229,255,0.12)'
                        : '1px solid rgba(245,158,11,0.12)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: '14px 18px 12px',
                      borderBottom:
                        card.accentType === 'cyan'
                          ? '1px solid rgba(0,229,255,0.08)'
                          : '1px solid rgba(245,158,11,0.08)',
                      borderLeft:
                        card.accentType === 'cyan'
                          ? '3px solid #00e5ff'
                          : '3px solid #f59e0b',
                      background:
                        card.accentType === 'cyan'
                          ? 'rgba(0,229,255,0.03)'
                          : 'rgba(245,158,11,0.03)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <h3
                      className="font-syne"
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color:
                          card.accentType === 'cyan' ? '#00e5ff' : '#f59e0b',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.2,
                        flex: 1,
                      }}
                    >
                      {card.title}
                    </h3>
                    <ScienceBadge label={card.badge} />
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p
                      className="font-mono"
                      style={{ fontSize: 10, color: '#475569', letterSpacing: '0.04em' }}
                    >
                      {card.citation}
                    </p>
                    <p
                      className="font-literata"
                      style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}
                    >
                      {card.body}
                    </p>

                    {/* Chips */}
                    {card.chips && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
                        {card.chips.map((chip) =>
                          card.accentType === 'cyan' ? (
                            <ChipCyan key={chip} label={chip} />
                          ) : (
                            <ChipAmber key={chip} label={chip} />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 2 — Biomechanics & Joint Loading
          ════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 80 }}>
            {/* Section header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span
                  className="font-mono"
                  style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  02
                </span>
                <SectionDivider />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  biomechanics &amp; joint loading
                </span>
              </div>
              <h2
                className="font-syne"
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 34px)',
                  fontWeight: 800,
                  color: '#e2e8f0',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}
              >
                Biomechanics &amp; Joint Loading
              </h2>
            </div>

            {/* Force comparison table */}
            <div
              className="anim-card science-card"
              style={{
                animationDelay: '0.1s',
                background: '#111827',
                border: '1px solid rgba(0,229,255,0.14)',
                borderLeft: '3px solid #00e5ff',
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(0,229,255,0.08)',
                  background: 'rgba(0,229,255,0.04)',
                  gap: 8,
                }}
              >
                <h3
                  className="font-syne"
                  style={{ fontSize: 15, fontWeight: 800, color: '#00e5ff', letterSpacing: '-0.2px' }}
                >
                  Peak Joint Force Comparison
                </h3>
                <ScienceBadge label="Biomechanics · Tier A" />
              </div>

              <div style={{ padding: '4px 0 8px' }}>
                {/* Column headers */}
                <div
                  className="force-row font-mono"
                  style={{
                    padding: '10px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: 10,
                    color: '#475569',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Joint</span>
                  <span>Running</span>
                  <span>Elliptical</span>
                  <span style={{ color: '#f59e0b' }}>Reduction</span>
                </div>

                {FORCE_ROWS.map((row, i) => (
                  <div
                    key={row.joint}
                    className="force-row font-mono"
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < FORCE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      fontSize: 13,
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}
                  >
                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>{row.joint}</span>
                    <span style={{ color: '#64748b' }}>{row.running}</span>
                    <span style={{ color: '#00e5ff' }}>{row.elliptical}</span>
                    <span
                      style={{
                        color: '#f59e0b',
                        fontWeight: 500,
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        display: 'inline-block',
                      }}
                    >
                      −{row.reduction}
                    </span>
                  </div>
                ))}

                <p
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    padding: '10px 20px 6px',
                    letterSpacing: '0.04em',
                  }}
                >
                  BW = Body Weight · Sources: Lu 2007; Burnfield 2007; Hammill 1995
                </p>
              </div>
            </div>

            {/* Biomech detail cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 20,
              }}
            >
              {BIOMECH_CARDS.map((card, i) => (
                <div
                  key={card.title}
                  className={`anim-card science-card${card.accentType === 'amber' ? ' science-card-amber' : ''}`}
                  style={{
                    animationDelay: `${0.15 + i * 0.1}s`,
                    background: '#111827',
                    border:
                      card.accentType === 'cyan'
                        ? '1px solid rgba(0,229,255,0.12)'
                        : '1px solid rgba(245,158,11,0.12)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 18px 12px',
                      borderBottom:
                        card.accentType === 'cyan'
                          ? '1px solid rgba(0,229,255,0.08)'
                          : '1px solid rgba(245,158,11,0.08)',
                      borderLeft:
                        card.accentType === 'cyan' ? '3px solid #00e5ff' : '3px solid #f59e0b',
                      background:
                        card.accentType === 'cyan'
                          ? 'rgba(0,229,255,0.03)'
                          : 'rgba(245,158,11,0.03)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <h3
                      className="font-syne"
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: card.accentType === 'cyan' ? '#00e5ff' : '#f59e0b',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.25,
                        flex: 1,
                      }}
                    >
                      {card.title}
                    </h3>
                    <ScienceBadge label={card.badge} />
                  </div>
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p
                      className="font-mono"
                      style={{ fontSize: 10, color: '#475569', letterSpacing: '0.04em' }}
                    >
                      {card.citation}
                    </p>
                    <p
                      className="font-literata"
                      style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}
                    >
                      {card.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 3 — Rehabilitation Protocols
          ════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 80 }}>
            {/* Section header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span
                  className="font-mono"
                  style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  03
                </span>
                <SectionDivider />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  rehabilitation protocols
                </span>
              </div>
              <h2
                className="font-syne"
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 34px)',
                  fontWeight: 800,
                  color: '#e2e8f0',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}
              >
                Rehabilitation Protocols
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              {REHAB_CARDS.map((card, i) => (
                <div
                  key={card.title}
                  className={`anim-card science-card${card.accentType === 'amber' ? ' science-card-amber' : ''}`}
                  style={{
                    animationDelay: `${0.1 + i * 0.1}s`,
                    background: '#111827',
                    border:
                      card.accentType === 'cyan'
                        ? '1px solid rgba(0,229,255,0.12)'
                        : '1px solid rgba(245,158,11,0.12)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 18px 12px',
                      borderBottom:
                        card.accentType === 'cyan'
                          ? '1px solid rgba(0,229,255,0.08)'
                          : '1px solid rgba(245,158,11,0.08)',
                      borderLeft:
                        card.accentType === 'cyan' ? '3px solid #00e5ff' : '3px solid #f59e0b',
                      background:
                        card.accentType === 'cyan'
                          ? 'rgba(0,229,255,0.03)'
                          : 'rgba(245,158,11,0.03)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <h3
                      className="font-syne"
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: card.accentType === 'cyan' ? '#00e5ff' : '#f59e0b',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.25,
                        flex: 1,
                      }}
                    >
                      {card.title}
                    </h3>
                    <ScienceBadge label={card.badge} />
                  </div>
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p
                      className="font-mono"
                      style={{ fontSize: 10, color: '#475569', letterSpacing: '0.04em' }}
                    >
                      {card.citation}
                    </p>
                    <p
                      className="font-literata"
                      style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}
                    >
                      {card.body}
                    </p>
                    {card.chips && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
                        {card.chips.map((chip) =>
                          card.accentType === 'cyan' ? (
                            <ChipCyan key={chip} label={chip} />
                          ) : (
                            <ChipAmber key={chip} label={chip} />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 4 — Training Optimization (2-col)
          ════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: 80 }}>
            {/* Section header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span
                  className="font-mono"
                  style={{ fontSize: 10, color: '#00e5ff', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  04
                </span>
                <SectionDivider />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  training optimization
                </span>
              </div>
              <h2
                className="font-syne"
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 34px)',
                  fontWeight: 800,
                  color: '#e2e8f0',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}
              >
                Training Optimization
              </h2>
            </div>

            <div
              className="two-col-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
            >
              {/* ── Left: Protocol Builder ─────────────────────────────── */}
              <div
                className="anim-card science-card"
                style={{
                  animationDelay: '0.1s',
                  background: '#111827',
                  border: '1px solid rgba(0,229,255,0.14)',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(0,229,255,0.08)',
                    borderLeft: '3px solid #00e5ff',
                    background: 'rgba(0,229,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3
                    className="font-syne"
                    style={{ fontSize: 15, fontWeight: 800, color: '#00e5ff', letterSpacing: '-0.2px' }}
                  >
                    Protocol Builder
                  </h3>
                  <ScienceBadge label="Practical · Tier C" />
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {PROTOCOLS.map((p, i) => (
                    <div key={p.name}>
                      {/* Protocol header row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: p.color,
                              boxShadow: `0 0 6px ${p.color}88`,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="font-syne"
                            style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}
                          >
                            {p.name}
                          </span>
                        </div>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: 10,
                            color: p.color,
                            background: `${p.color}15`,
                            border: `1px solid ${p.color}35`,
                            borderRadius: 4,
                            padding: '2px 6px',
                          }}
                        >
                          {p.zone}
                        </span>
                      </div>

                      {/* Intensity bar */}
                      <div
                        style={{
                          height: 4,
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${p.barPct}%`,
                            background: `linear-gradient(90deg, ${p.color}88, ${p.color})`,
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      {/* Protocol data chips row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        <span className="font-mono" style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 7px' }}>
                          {p.spm}
                        </span>
                        <span className="font-mono" style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 7px' }}>
                          {p.resistance}
                        </span>
                        <span className="font-mono" style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 7px' }}>
                          {p.duration}
                        </span>
                        <span className="font-mono" style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 7px' }}>
                          {p.pct}
                        </span>
                      </div>

                      {i < PROTOCOLS.length - 1 && (
                        <div
                          style={{
                            height: 1,
                            background: 'rgba(255,255,255,0.04)',
                            marginTop: 14,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Muscle Targeting ────────────────────────────── */}
              <div
                className="anim-card science-card"
                style={{
                  animationDelay: '0.2s',
                  background: '#111827',
                  border: '1px solid rgba(0,229,255,0.14)',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(0,229,255,0.08)',
                    borderLeft: '3px solid #00e5ff',
                    background: 'rgba(0,229,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3
                    className="font-syne"
                    style={{ fontSize: 15, fontWeight: 800, color: '#00e5ff', letterSpacing: '-0.2px' }}
                  >
                    Muscle Targeting
                  </h3>
                  <ScienceBadge label="EMG · Tier B" />
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {MUSCLE_TARGETS.map((item, i) => (
                    <div key={item.cue}>
                      <div style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Cue */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              background:
                                item.type === 'cyan'
                                  ? 'rgba(0,229,255,0.1)'
                                  : 'rgba(245,158,11,0.1)',
                              border:
                                item.type === 'cyan'
                                  ? '1px solid rgba(0,229,255,0.25)'
                                  : '1px solid rgba(245,158,11,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: item.type === 'cyan' ? '#00e5ff' : '#f59e0b',
                              }}
                            />
                          </div>
                          <div>
                            <p
                              className="font-syne"
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: item.type === 'cyan' ? '#00e5ff' : '#f59e0b',
                                marginBottom: 3,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.cue}
                            </p>
                            <p
                              className="font-literata"
                              style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}
                            >
                              {item.effect}
                            </p>
                          </div>
                        </div>
                      </div>
                      {i < MUSCLE_TARGETS.length - 1 && (
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.03)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              FOOTER — Citations
          ════════════════════════════════════════════════════════════════ */}
          <footer>
            <SectionDivider />

            <div
              style={{
                marginTop: 32,
                background: '#0a0f1a',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '24px 24px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span
                  className="chip-cyan"
                  style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  References
                </span>
                <span className="font-mono" style={{ fontSize: 10, color: '#1e293b' }}>
                  {CITATIONS.length} sources
                </span>
              </div>

              <ol
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingLeft: 0,
                  listStyle: 'none',
                }}
              >
                {CITATIONS.map((cite, i) => (
                  <li
                    key={i}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 9,
                        color: '#00e5ff',
                        opacity: 0.5,
                        flexShrink: 0,
                        marginTop: 2,
                        minWidth: 18,
                        textAlign: 'right',
                      }}
                    >
                      {i + 1}.
                    </span>
                    <p
                      className="font-mono"
                      style={{ fontSize: 10, color: '#334155', lineHeight: 1.65, margin: 0 }}
                    >
                      {cite}
                    </p>
                  </li>
                ))}
              </ol>

              <p
                className="font-mono"
                style={{
                  fontSize: 9,
                  color: '#1e293b',
                  marginTop: 20,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                KQuarks — Elliptical Science · For informational purposes only · Not medical advice
              </p>
            </div>
          </footer>

        </main>
      </div>
    </>
  )
}
