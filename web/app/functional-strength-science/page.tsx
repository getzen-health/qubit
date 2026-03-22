// Functional Strength Science — static server component
// Evidence-based guide covering CrossFit & MetCon physiology, Olympic weightlifting,
// kettlebell training science, and functional fitness programming.

import Link from 'next/link'
import { ArrowLeft, Dumbbell, Zap, BarChart3, Shield } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Functional Strength Science' }

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  dark:   '#0a0505',
  red:    '#b91c1c',
  iron:   '#374151',
  orange: '#c2410c',
  text:   '#f9fafb',
} as const

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '6,500 W',
    label: 'Olympic Lift Peak Power',
    sub: 'Elite clean & jerk peak power output (force plate)',
    accent: T.red,
  },
  {
    value: '3.1/1000h',
    label: 'CrossFit Injury Rate',
    sub: 'Hak 2013 — comparable to gymnastics and OLY lifting',
    accent: '#6b7280',
  },
  {
    value: '85–95%',
    label: 'MetCon HRmax',
    sub: 'Heart rate during CrossFit WOD metabolic conditioning',
    accent: T.orange,
  },
  {
    value: '25%',
    label: 'Concurrent Training Interference',
    sub: 'Hypertrophy reduction when endurance trained same session',
    accent: T.red,
  },
]

// ─── Peak Power Chart Data ─────────────────────────────────────────────────────

const POWER_DATA = [
  { exercise: 'Snatch',      watts: 5800, pct: 5800 / 5800, color: T.red },
  { exercise: 'Clean & Jerk',watts: 5400, pct: 5400 / 5800, color: T.red },
  { exercise: 'Power Clean', watts: 5100, pct: 5100 / 5800, color: T.orange },
  { exercise: 'Box Jump',    watts: 3200, pct: 3200 / 5800, color: '#6b7280' },
  { exercise: 'Squat Jump',  watts: 2800, pct: 2800 / 5800, color: '#4b5563' },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'crossfit',
    title: 'CrossFit & High-Intensity Functional Training',
    iconSymbol: '\u{1F3CB}',
    iconColor: '#fca5a5',
    accent: T.red,
    accentBg: 'rgba(185,28,28,0.08)',
    accentBorder: 'rgba(185,28,28,0.22)',
    accentPill: 'rgba(185,28,28,0.14)',
    findings: [
      {
        citation: 'Glassman 2002 — CrossFit methodology & MetCon physiology',
        detail: 'Metabolic conditioning (MetCon) workouts elicit HR 85–95% HRmax with blood lactate 8–15 mmol/L — near-maximum across all energy systems simultaneously. CrossFit Games athletes average VO\u2082max 58–68 mL/kg/min (both sexes at elite level). Energy system demands vary dramatically by WOD structure: short AMRAPs are anaerobic-dominant; 20+ min chippers engage sustained aerobic metabolism with lactate oscillating around threshold.',
        stat: 'MetCon HR 85–95% HRmax; lactate 8–15 mmol/L; Games athletes VO\u2082max 58–68 mL/kg/min',
      },
      {
        citation: 'Benchmark WOD Fran — thruster + pull-up physiological demands',
        detail: 'Fran (21-15-9 thrusters + pull-ups) completed in 2–4 minutes by elite competitors, 6–10 minutes by competitive athletes. Near-maximal effort is maintained throughout with no rest prescribed. The thruster carries the highest metabolic cost per rep in functional training — it activates the full kinetic chain from ankle to overhead lockout and demands rapid transition between a maximal-depth squat and explosive overhead press, creating simultaneous leg, trunk, and shoulder fatigue.',
        stat: 'Elite Fran: 2–4 min; competitive: 6–10 min; thrusters = highest metabolic cost per rep',
      },
      {
        citation: 'Peak power in OLY movements — bar velocity monitoring (VBT)',
        detail: 'Clean and jerk and snatch peak power outputs reach 4,000–6,500 W, measured via force plates and bar-mounted accelerometers. Bar velocity monitoring (VBT) tracks bar speed as a proxy for fatigue and daily readiness. Rate of force development (RFD) — the slope of the force-time curve in the first 100 ms — is the primary neurological adaptation from repeated Olympic lifting in functional fitness programming and the most sport-applicable explosive quality.',
        stat: 'OLY lift peak power: 4,000–6,500 W; RFD in first 100 ms = primary explosive adaptation',
      },
      {
        citation: 'Hak 2013 — CrossFit injury epidemiology (n=132)',
        detail: '3.1 injuries per 1,000 training hours — comparable to Olympic weightlifting and gymnastics, substantially lower than contact sports (rugby 91/1,000h; American football 35/1,000h). Shoulder accounts for 25% of all incidents, spine 20%. Rhabdomyolysis risk is elevated with extreme first exposure to high-volume eccentric loading in untrained individuals — the "Uncle Rhabdo" phenomenon. Gradual introductory programming over the first 4–8 weeks is essential for injury risk management.',
        stat: '3.1 injuries/1,000h; shoulder 25%, spine 20%; rhabdo risk with extreme first exposure',
      },
    ],
  },
  {
    id: 'olympic-lifting',
    title: 'Olympic Weightlifting Science',
    iconSymbol: '\u26A1',
    iconColor: '#fdba74',
    accent: T.orange,
    accentBg: 'rgba(194,65,12,0.08)',
    accentBorder: 'rgba(194,65,12,0.22)',
    accentPill: 'rgba(194,65,12,0.14)',
    findings: [
      {
        citation: 'Clean biomechanics — force plate and bar path analysis',
        detail: 'First pull (floor to mid-thigh), transition (scoop/double knee bend), second pull (explosive triple extension of ankle, knee, hip), catch (front squat position). Force plate data at triple extension: 2–3\u00D7 body weight vertical force; peak power 4,000–6,500 W. Bar path traces a sigma-shaped curve — optimal bar contact with thighs in transition reduces horizontal displacement and maximises vertical velocity. Bar velocity at highest point: 1.8–2.2 m/s.',
        stat: 'Triple extension: 2–3\u00D7 BW force; peak power 4,000–6,500 W; bar velocity 1.8–2.2 m/s',
      },
      {
        citation: 'Snatch — overhead catch mechanics and technical error analysis',
        detail: 'The snatch catch requires an overhead squat with approximately 60\u00B0 forward trunk lean. Glenohumeral joint must maintain a packed, externally rotated position against downward bar momentum. Technical errors and biomechanical causes: early arm bend (reduces bar height at turnover); early pull (bar loses thigh contact, reducing transfer efficiency); forward miss (insufficient hip-to-shoulder sequencing in the second pull). Ankle and wrist mobility are critical limiting factors.',
        stat: 'Snatch catch: ~60\u00B0 forward trunk lean; shoulder packed, externally rotated throughout',
      },
      {
        citation: 'Relative strength standards — back squat to OLY lift relationships',
        detail: 'Elite men\'s 89 kg class: back squat 220–240 kg (2.5–2.7\u00D7 BW). Posterior chain dominance: back squat is typically 120–130% of clean; front squat 105–115% of clean. The posterior chain — glutes, hamstrings, erector spinae — is central to both pulls. Primary accessory lifts: Romanian deadlifts, good mornings, weighted back extensions. Insufficient posterior chain relative strength is the most common technical limiter for advanced OLY athletes.',
        stat: 'Elite back squat: 2.5\u00D7 BW; back squat = 120–130% of clean; front squat = 105–115%',
      },
      {
        citation: 'Neural adaptations timeline — rate coding and motor unit recruitment',
        detail: 'First 4–8 weeks of systematic training: 80–90% of strength gains are neural — improved motor unit recruitment, elevated firing rate (rate coding), enhanced inter-muscular coordination, reduced antagonist co-contraction. RFD improvements measurable within 4–6 weeks precede significant hypertrophy. Structural gains become primary driver after 8–12 weeks. Motor pattern acquisition for complex OLY lifts requires 200–400 technically correct repetitions before movement automaticity develops.',
        stat: 'First 4–8 wks: 80–90% neural gains; hypertrophy dominant after 8–12 wks; 200–400 reps to automaticity',
      },
    ],
  },
  {
    id: 'kettlebell',
    title: 'Kettlebell Science',
    iconSymbol: '\u{1F3CB}',
    iconColor: '#fca5a5',
    accent: T.red,
    accentBg: 'rgba(185,28,28,0.08)',
    accentBorder: 'rgba(185,28,28,0.22)',
    accentPill: 'rgba(185,28,28,0.14)',
    findings: [
      {
        citation: 'Kettlebell swing — posterior chain activation and ballistic loading',
        detail: 'Two-arm swing at 24 kg: ~20 kcal/min metabolic demand; 600–900 hip extensions per session in standard training blocks. Posterior chain activation: glutes ~40%, hamstrings ~35%, erector spinae ~25%. The ballistic eccentric-to-concentric transition at the bottom of the swing under hip hinge mechanics develops posterior chain stretch-shortening cycle more effectively than slow isotonic work. Contrast loading (swings followed by box jumps) amplifies RFD via post-activation potentiation.',
        stat: '20 kcal/min at 24 kg; glutes 40%, hamstrings 35%, erectors 25%; 600–900 hip extensions/session',
      },
      {
        citation: 'Turkish get-up — 7-step full-body stability integration',
        detail: 'TGU phases: (1) roll to elbow, (2) roll to hand, (3) hip bridge, (4) sweep leg to half-kneeling, (5) tall kneeling, (6) stand, (7) reverse. Throughout all phases the shoulder is maintained in a packed (depressed, retracted) externally rotated position supporting the overhead kettlebell. The movement sequentially challenges floor-level rotary stability, lateral trunk stability, hip mobility, and single-leg balance — making it both a comprehensive stability assessment and a high-quality training stimulus.',
        stat: '7-step sequence; shoulder packed throughout; rotary → lateral → hip → single-leg stability progression',
      },
      {
        citation: 'RKC snatch test — grip endurance and cardiovascular capacity',
        detail: 'The Russian Kettlebell Certification snatch test: 100 repetitions in 5 minutes with 24 kg (men) / 16 kg (women), using hand switches but no setting the bell down. HR throughout: 85–90% HRmax. Primary limiting factor is grip endurance and cumulative forearm fatigue rather than cardiovascular capacity in trained practitioners. Technique: a loose finger-grip during the float phase spares forearm flexors. Callus management (pumice stone, avoiding torn skin) is critical for training continuity.',
        stat: 'RKC: 100 reps / 5 min / 24 kg; HR 85–90% HRmax; grip endurance = primary limiter',
      },
      {
        citation: 'Jay 2010 — kettlebell RCT (n=40) — VO\u2082max and core strength outcomes',
        detail: '20-minute kettlebell circuit 3\u00D7 weekly increased VO\u2082max 6% and core strength 70% in previously sedentary adults over 8 weeks. Metabolic conditioning effects comparable to treadmill running at equivalent heart rate. The combination of strength and cardiorespiratory demands in a single implement with minimal setup makes kettlebells among the most time-efficient exercise modalities for general population fitness and time-constrained training environments.',
        stat: '8-week KB circuit: VO\u2082max +6%, core strength +70%; metabolic equivalent to treadmill at same HR',
      },
    ],
  },
  {
    id: 'programming',
    title: 'Programming & Periodisation',
    iconSymbol: '\u{1F4CA}',
    iconColor: '#fdba74',
    accent: T.orange,
    accentBg: 'rgba(194,65,12,0.08)',
    accentBorder: 'rgba(194,65,12,0.22)',
    accentPill: 'rgba(194,65,12,0.14)',
    findings: [
      {
        citation: 'Rate of force development — most trainable explosive quality',
        detail: 'RFD (0–100 ms peak force rate) is the most sport-applicable strength quality — ground contact times in sprinting and jumping are too brief for maximal force to be expressed; only RFD matters in these time windows. Olympic lifts, plyometrics, and contrast training (heavy compound set immediately followed by explosive movement) improve RFD 15–25% in 8–12 weeks. Neural mechanisms: increased motor unit synchronisation, enhanced rate coding, reduced antagonist inhibition at high velocities.',
        stat: 'RFD in first 100 ms = sport-relevant; contrast training: +15–25% RFD in 8–12 wks',
      },
      {
        citation: 'Hickson 1980 / Atherton 2009 — concurrent training interference effect',
        detail: 'Simultaneous strength and endurance training creates molecular signalling conflict: AMPK activation from endurance work inhibits mTORC1 signalling required for muscle protein synthesis. This blunts hypertrophic adaptation 25–30% vs. strength-only training. Mitigation: separate sessions by 6+ hours minimum, or if same session, sequence endurance before strength — so the anabolic signalling window post-strength training is not blunted by subsequent AMPK activation from cardio.',
        stat: 'Concurrent training: −25–30% hypertrophy; separate by 6+ h or do cardio before strength',
      },
      {
        citation: 'Rhea 2002 — daily undulating vs linear periodisation RCT',
        detail: 'Daily undulating periodisation (DUP — varying rep ranges on consecutive days: e.g., Mon 3\u00D75 heavy, Wed 4\u00D78 moderate, Fri 5\u00D712 high-rep) outperforms linear periodisation by 10–15% in trained individuals at 12 weeks. DUP prevents neural and metabolic accommodation, allows movement variety, and aligns with the multi-quality demands of CrossFit and functional fitness competition. Linear periodisation remains superior for untrained beginners establishing a base.',
        stat: 'DUP outperforms linear periodisation +10–15% at 12 wks; prevents neural accommodation',
      },
      {
        citation: 'Competition taper — functional fitness and OLY competition preparation',
        detail: '7–10 day taper for functional fitness competitions (CrossFit Open, OLY meets): reduce volume 40–50% while maintaining load intensity (same weights, fewer total sets and reps). Prioritise skill practice, movement quality, and sleep. The taper window for strength-power sports is shorter than endurance (7–10 days vs. 14–21 days) because neuromuscular fatigue dissipates faster than aerobic detraining occurs. Avoid new movements, extreme range exercises, or unfamiliar loading patterns in the final 10 days.',
        stat: 'Taper 7–10 days: volume −40–50%, maintain intensity; no new movements in final 10 days',
      },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  sub,
  accent,
}: {
  value: string
  label: string
  sub: string
  accent: string
}) {
  return (
    <div
      style={{
        background: '#140a0a',
        border: '1px solid #1f1111',
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
          fontSize: 26,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: '"Black Ops One", "Impact", system-ui, sans-serif',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: '8px 0 4px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#4b5563', margin: 0, lineHeight: 1.45 }}>{sub}</p>
    </div>
  )
}

function FindingRow({
  citation,
  detail,
  stat,
  accent,
}: {
  citation: string
  detail: string
  stat: string
  accent: string
}) {
  return (
    <div style={{ padding: '16px 18px', borderBottom: '1px solid #140a0a' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#374151',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#d1d5db', margin: '0 0 11px', lineHeight: 1.65 }}>{detail}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          background: '#0a0505',
          border: `1px solid ${accent}33`,
          borderRadius: 6,
          padding: '4px 10px',
          display: 'inline-block',
          lineHeight: 1.4,
        }}
      >
        {stat}
      </p>
    </div>
  )
}

function ScienceCard({
  iconSymbol,
  iconColor,
  title,
  accent,
  accentBg,
  accentBorder,
  accentPill,
  findings,
}: (typeof SCIENCE_CARDS)[number]) {
  return (
    <div
      style={{
        background: '#0f0808',
        border: '1px solid #1f1111',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: accentPill,
            border: `1px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: iconColor, lineHeight: 1 }}>
            {iconSymbol}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h2>
      </div>
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

function PeakPowerChart() {
  return (
    <div
      style={{
        background: '#0f0808',
        border: '1px solid #1f1111',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(185,28,28,0.08)',
          borderBottom: '1px solid rgba(185,28,28,0.2)',
          borderLeft: `3px solid ${T.red}`,
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
          Peak Power Output by Exercise Type
        </h2>
        <p style={{ fontSize: 12, color: '#374151', margin: '3px 0 0' }}>
          Elite athlete force plate measurements — Watts peak power
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {POWER_DATA.map((d) => (
          <div key={d.exercise} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.exercise}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: d.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {d.watts.toLocaleString()} W
              </span>
            </div>
            <div style={{ height: 10, background: '#1a0e0e', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${d.pct * 100}%`,
                  background: `linear-gradient(90deg, ${d.color}55, ${d.color}dd)`,
                  borderRadius: 5,
                }}
              />
            </div>
          </div>
        ))}
        <p
          style={{
            fontSize: 11,
            color: '#374151',
            margin: '10px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          Values represent elite-level athletes. Recreational CrossFit peak power is typically 40–60% of these values. Power clean values assume 80–85% 1RM loading at optimal velocity.
        </p>
      </div>
    </div>
  )
}

function HeroSVG() {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <svg
        viewBox="0 0 320 150"
        width="320"
        height="150"
        aria-hidden="true"
        style={{ maxWidth: '100%' }}
      >
        {/* Background glow */}
        <ellipse cx="160" cy="135" rx="140" ry="14" fill={`${T.red}1a`} />

        {/* Barbell shaft */}
        <rect x="35" y="68" width="250" height="14" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="1.5" />

        {/* Left large plate */}
        <rect x="48" y="42" width="28" height="66" rx="5" fill={T.red} opacity="0.9" />
        {/* Left small plate */}
        <rect x="78" y="52" width="16" height="46" rx="4" fill={T.orange} opacity="0.85" />

        {/* Right large plate */}
        <rect x="244" y="42" width="28" height="66" rx="5" fill={T.red} opacity="0.9" />
        {/* Right small plate */}
        <rect x="226" y="52" width="16" height="46" rx="4" fill={T.orange} opacity="0.85" />

        {/* Collar clamps */}
        <rect x="96" y="62" width="10" height="26" rx="2" fill="#6b7280" />
        <rect x="214" y="62" width="10" height="26" rx="2" fill="#6b7280" />

        {/* Plate details / ridges */}
        <line x1="54" y1="55" x2="54" y2="95" stroke="#7f1d1d" strokeWidth="2" />
        <line x1="60" y1="50" x2="60" y2="100" stroke="#7f1d1d" strokeWidth="1" opacity="0.6" />
        <line x1="250" y1="55" x2="250" y2="95" stroke="#7f1d1d" strokeWidth="2" />
        <line x1="262" y1="50" x2="262" y2="100" stroke="#7f1d1d" strokeWidth="1" opacity="0.6" />

        {/* Kettlebell body */}
        <circle cx="160" cy="108" r="22" fill="#1f2937" stroke={T.red} strokeWidth="2.5" />
        <rect x="149" y="81" width="22" height="14" rx="4" fill="none" stroke={T.red} strokeWidth="2.5" />
        <text x="160" y="113" textAnchor="middle" fill={T.red} fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">24kg</text>

        {/* Chalk dust particles */}
        {[
          { cx: 115, cy: 58, r: 3, op: 0.6 },
          { cx: 122, cy: 48, r: 2, op: 0.4 },
          { cx: 108, cy: 52, r: 1.5, op: 0.5 },
          { cx: 198, cy: 55, r: 3, op: 0.6 },
          { cx: 205, cy: 46, r: 2, op: 0.4 },
          { cx: 192, cy: 50, r: 1.5, op: 0.5 },
        ].map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="white" opacity={d.op} />
        ))}

        {/* Weight labels on plates */}
        <text x="62" y="78" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity="0.85">20</text>
        <text x="62" y="88" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity="0.85">kg</text>
        <text x="258" y="78" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity="0.85">20</text>
        <text x="258" y="88" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity="0.85">kg</text>
      </svg>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FunctionalStrengthSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: T.dark, color: T.text }}>
      {/* Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap');`}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: `${T.dark}cc`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1f1111',
        }}
      >
        <div
          style={{
            maxWidth: 768,
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/strength"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#140a0a',
              border: '1px solid #1f1111',
              color: '#374151',
              textDecoration: 'none',
            }}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: T.text,
                margin: 0,
                fontFamily: '"Black Ops One", system-ui, sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              Functional Strength Science
            </h1>
            <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
              CrossFit · Olympic lifting · Kettlebell · Programming
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dumbbell size={18} color={T.red} />
            <Zap size={18} color={T.orange} />
            <BarChart3 size={18} color='#6b7280' />
            <Shield size={18} color={T.red} />
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 768,
          margin: '0 auto',
          padding: '24px 16px 96px',
        }}
      >
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(185,28,28,0.12) 0%, rgba(194,65,12,0.08) 50%, rgba(55,65,81,0.10) 100%)',
            border: '1px solid rgba(185,28,28,0.22)',
            borderRadius: 18,
            padding: '20px 22px 16px',
            marginBottom: 24,
          }}
        >
          <HeroSVG />
          <p
            style={{
              fontSize: 13,
              color: '#d1d5db',
              margin: '12px 0 0',
              lineHeight: 1.7,
            }}
          >
            Functional strength training encompasses CrossFit metabolic conditioning, Olympic weightlifting, and kettlebell work — movements that build explosive power, multi-planar stability, and metabolic fitness simultaneously. This page covers the peer-reviewed science behind WOD physiology, force-plate biomechanics of the Olympic lifts, kettlebell cardiovascular adaptations, and evidence-based programming strategies including the interference effect and daily undulating periodisation.
          </p>
        </div>

        {/* Key stats */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          {KEY_STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Peak power chart */}
        <div style={{ marginBottom: 24 }}>
          <PeakPowerChart />
        </div>

        {/* Science cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            background: '#0f0808',
            border: '1px solid #1f1111',
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <p style={{ fontSize: 11, color: '#374151', margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: '#4b5563', fontWeight: 700 }}>Data note:</span> Peak power values are from elite athlete populations. Functional strength training workouts appear in Apple Health as &quot;Functional Strength Training&quot; workout type when tagged correctly. The concurrent training interference effect applies to sessions performed within the same 6-hour window — splitting strength and endurance training to separate AM/PM sessions largely eliminates the molecular signalling conflict.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
