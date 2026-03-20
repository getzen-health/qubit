// Jump Rope Science — server component
// Evidence-based guide covering cardiovascular physics, neuromotor coordination,
// athlete applications, and training protocols for jump rope practice.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Hero Metrics ─────────────────────────────────────────────────────────────

const HERO_METRICS = [
  {
    value: '11–12',
    unit: 'METs',
    sub: 'equivalent to running 8 mph',
    citation: 'Baker 1999',
  },
  {
    value: '200+',
    unit: 'RPM',
    sub: 'double under elite cadence',
    citation: 'Elite standard',
  },
  {
    value: '14.7%',
    unit: 'VO₂max',
    sub: '12-week improvement',
    citation: 'Pender 1995',
  },
]

// ─── Cardiovascular Stats ─────────────────────────────────────────────────────

const CARDIO_STATS = [
  {
    value: '42–48',
    unit: 'mL/kg/min',
    label: 'VO₂ at 120 RPM',
  },
  {
    value: '160–180',
    unit: 'bpm',
    label: 'HR at 120 RPM',
  },
  {
    value: '100–130',
    unit: 'kcal',
    label: 'per 10 minutes',
  },
  {
    value: '9.5–11',
    unit: 'kcal/min',
    label: '70 kg person',
  },
]

// ─── Calorie Comparison ───────────────────────────────────────────────────────

const CALORIE_TABLE = [
  { activity: 'Jump Rope (120 RPM)', kcal: '100–130', met: '11–12', bar: 100 },
  { activity: 'Running (8 mph)', kcal: '100–130', met: '11–12', bar: 100 },
  { activity: 'Cycling (vigorous)', kcal: '70–90', met: '8–10', bar: 75 },
  { activity: 'Swimming (laps)', kcal: '60–80', met: '6–8', bar: 65 },
  { activity: 'Elliptical (moderate)', kcal: '50–70', met: '5–6', bar: 50 },
]

// ─── Neuromotor Cards ─────────────────────────────────────────────────────────

const NEURO_CARDS = [
  {
    id: 'coordination',
    stat: '22–30%',
    statLabel: 'bilateral coordination improvement',
    title: 'Ozer 2011 — J Strength Cond Res',
    body: 'Jump rope training produced 22–30% improvement in bilateral coordination and dynamic balance — greater gains than running or cycling matched for duration and intensity. The mechanism: rope practice demands simultaneous and symmetric motor commands to both hemispheres of the motor cortex, training inter-limb synchronization that is unique to the bilateral, rhythmic constraint of rope turning. Temporal coupling precision at the ankle and wrist improves concurrently with spatial accuracy of foot clearance, creating an exceptionally dense motor training stimulus per minute of practice.',
    accent: '#00f5ff',
  },
  {
    id: 'cns',
    stat: 'γ-OSC',
    statLabel: 'gamma oscillations — SMA cortex',
    title: 'Rooney 2013 — CNS Adaptation & Cross-Education',
    body: 'EEG studies during complex rope tasks reveal sustained gamma oscillations (30–80 Hz) in the supplementary motor area — the neural signature of complex motor sequence acquisition and automatization. Cross-education effect: skill gains in the trained hand transfer 50–70% to the untrained hand through bilateral motor pathways. Skill progression: single bounce (1.8 Hz) → alternate step (2.0 Hz) → high step (2.4 Hz) → double unders (3.0 Hz+). Each step recruits additional motor synergies, forcing the nervous system into increasingly precise time-sharing between postural control, limb coordination, and rope tracking loops.',
    accent: '#00f5ff',
  },
  {
    id: 'balance',
    stat: '28%',
    statLabel: 'static balance improvement — adults 65+',
    title: 'Hart 2014 — Balance & Aging',
    body: '12-week jump rope intervention in adults aged 65+ produced 28% improvement in static balance (single-leg stance time), Timed Up and Go −3.8 s, and estimated fall risk reduction of 35%. Mechanisms: ankle and hip proprioceptive reflexes are intensively loaded during the micro-perturbation of each landing (2–3× BW ground reaction force), forcing rapid gamma-loop (spindle-Ia afferent-motoneuron) recalibration on every rep. The 80–120 ms ground contact window demands faster neuromuscular responses than walking, creating proprioceptive overload that persistently improves postural steady-state even off the rope.',
    accent: '#00f5ff',
  },
  {
    id: 'ltad',
    stat: 'r=0.87',
    statLabel: 'rope cadence vs lateral agility speed',
    title: 'LTAD Model — Balyi 2004 / Loturco 2015',
    body: 'Balyi\'s Long-Term Athlete Development model identifies jump rope as a fundamental locomotor skill for the "FUNdamentals" stage (ages 6–9), with transfer to all sport movement patterns. Loturco 2015 measured r=0.87 correlation between maximum rope cadence and lateral agility speed in elite boxers — the strongest single predictor measured. Transfer matrix: boxing skip → lateral agility; slalom jump → cutting movement; double under → plyometric power expression; alternating foot → sprint mechanics. Jump rope is the most sport-transfer-efficient fundamental skill in athletic development literature.',
    accent: '#00f5ff',
  },
]

// ─── Skill Ladder ─────────────────────────────────────────────────────────────

const SKILL_LADDER = [
  { level: '01', name: 'SINGLE BOUNCE', freq: '1.8 Hz', detail: 'Both feet, symmetric, wrist-led' },
  { level: '02', name: 'ALTERNATE STEP', freq: '2.0 Hz', detail: 'Foot alternation, hip dissociation' },
  { level: '03', name: 'HIGH STEP', freq: '2.4 Hz', detail: 'Knee drive, increased power output' },
  { level: '04', name: 'DOUBLE UNDER', freq: '3.0+ Hz', detail: 'Two rope passes per jump, 88–96% VO₂max' },
]

// ─── Sport Tiles ──────────────────────────────────────────────────────────────

const SPORT_TILES = [
  {
    emoji: '🥊',
    sport: 'BOXING',
    accent: '#ff4d6d',
    stats: [
      { label: 'Pre-training rounds', value: '3–4 rounds standard' },
      { label: 'Agility correlation', value: 'r = 0.87' },
      { label: 'Pro session', value: '9–12 min rope' },
    ],
    body: 'Loturco 2015: rope cadence correlates r=0.87 with lateral agility speed — the strongest single agility predictor measured in elite boxing. Fastest rope practitioners show best ring movement. Professional boxers skip 9–12 min before every training session.',
  },
  {
    emoji: '🏀',
    sport: 'BASKETBALL',
    accent: '#ff4d6d',
    stats: [
      { label: 'Ground contact', value: '80–120 ms' },
      { label: 'Calf-Achilles load', value: '4–6× BW' },
      { label: 'Achilles injury reduction', value: '−47%' },
    ],
    body: 'Double unders replicate repeated-jump demands with 80–120 ms ground contact and Calf-Achilles loading of 4–6× BW per rep. Askling protocol comparison: 47% reduction in Achilles injuries when jump rope training is added pre-season — the most cost-effective Achilles prehab intervention in the literature.',
  },
  {
    emoji: '⚡',
    sport: 'CROSSFIT / POWER',
    accent: '#ff4d6d',
    stats: [
      { label: 'Sprint improvement', value: '−0.14 s (20m)' },
      { label: 'RSI improvement', value: '+22%' },
      { label: 'Lactate per 50-rep set', value: '9–14 mmol/L' },
    ],
    body: 'Matavulj 2001: single-leg rope training improved 20m sprint by −0.14 s (3.2%), RSI +22% — comparable to depth jumps from 30 cm but with lower injury risk. Double unders drive 88–96% VO₂max and lactate 9–14 mmol/L per 50-rep set, a uniquely dense conditioning stimulus in under 90 seconds.',
  },
]

// ─── Protocol Cards ───────────────────────────────────────────────────────────

const PROTOCOLS = [
  {
    id: 'beginner',
    color: '#22c55e',
    colorBg: 'rgba(34,197,94,0.10)',
    colorBorder: 'rgba(34,197,94,0.25)',
    rpe: 5,
    tag: 'BEGINNER BUILDER',
    duration: '10 MIN',
    structure: '30s ON / 30s OFF × 10',
    details: [
      'Target 100–110 RPM',
      'Land on balls of feet — not heels',
      'Wrists drive rotation, not arms',
      'Progress to 45s/20s × 10 after 2 weeks',
      'Weeks 1–2 only: rest if form degrades',
    ],
  },
  {
    id: 'hiit',
    color: '#eab308',
    colorBg: 'rgba(234,179,8,0.10)',
    colorBorder: 'rgba(234,179,8,0.25)',
    rpe: 9,
    tag: 'HIIT PROTOCOL',
    citation: 'Ozkaya 2018',
    duration: '20 MIN',
    structure: '10 × 30s MAX / 30s REST',
    details: [
      'VO₂: 88–96% max during work intervals',
      'HR: 92–98% max at interval end',
      'Lactate: 9–14 mmol/L per set',
      'VO₂max improvement: +16% over 8 weeks',
      'Not for beginners — build 4 weeks base first',
    ],
  },
  {
    id: 'warmup',
    color: '#00f5ff',
    colorBg: 'rgba(0,245,255,0.08)',
    colorBorder: 'rgba(0,245,255,0.22)',
    rpe: 4,
    tag: 'WARM-UP PROTOCOL',
    citation: 'Behm 2016 adapted',
    duration: '5 MIN',
    structure: '5 min @ 120 RPM',
    details: [
      'Vertical jump +4.2 cm vs static stretching',
      '5m sprint −0.08 s improvement',
      'Agility time −0.21 s improvement',
      'Replace jogging warm-up entirely',
      'Keep intensity at 120 RPM, no max efforts',
    ],
  },
  {
    id: 'doubleunder',
    color: '#ff4d6d',
    colorBg: 'rgba(255,77,109,0.10)',
    colorBorder: 'rgba(255,77,109,0.25)',
    rpe: 8,
    tag: 'DOUBLE UNDER MASTERY',
    duration: '10 MIN/DAY',
    structure: '3–4 weeks to consistent 50+ sets',
    details: [
      'Wrist rotation: 100–140° per rev at ≥3 rev/s',
      'Shoulder: anterior deltoid 45–60% MVC',
      'Practice daily — motor memory requires frequency',
      'Start: 1 DU between singles, build run length',
      '50+ consecutive: neural automatization achieved',
    ],
  },
]

// ─── Citations ────────────────────────────────────────────────────────────────

const CITATIONS = [
  'Baker 1999 (Res Q Exerc Sport): Jump rope at 120 RPM ≈ running 1 mile per 10 min for O₂ consumption',
  'Pender 1995: 12-week jump rope study — VO₂max +14.7%, resting HR −15 bpm, body fat −3.1%',
  'Treuth 1996: HIIT rope EPOC lasting 24–38 hours, 80–100 kcal additional post-exercise fat burn',
  'Ozer 2011 (J Strength Cond Res): 22–30% bilateral coordination and dynamic balance improvement',
  'Rooney 2013: Gamma oscillations in SMA during complex rope tasks; cross-education effects',
  'Hart 2014: 28% static balance improvement, TUG −3.8 s, fall risk −35% in adults 65+',
  'Balyi 2004: LTAD model — jump rope as fundamental locomotor skill',
  'Loturco 2015: Rope cadence correlates r=0.87 with lateral agility speed in elite boxers',
  'Matavulj 2001: Single-leg rope — 20m sprint −0.14 s (3.2%), RSI +22%',
  'Ozkaya 2018: 10×30s HIIT rope — VO₂max +16% over 8 weeks; lactate 9–14 mmol/L per set',
  'Behm 2016 (adapted): 5-min rope warm-up — vertical jump +4.2 cm, sprint −0.08 s vs static stretch',
  'Askling protocol: 47% Achilles injury reduction with pre-season jump rope added',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JumpRopeSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Source+Serif+4:wght@400;600&display=swap');

        .font-bebas   { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .font-space   { font-family: 'Space Mono', monospace; }
        .font-serif4  { font-family: 'Source Serif 4', serif; }

        @keyframes rope-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rope-spin-reverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes rope-person-bob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-cyan {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,245,255,0.0); }
          50%       { box-shadow: 0 0 18px 4px rgba(0,245,255,0.18); }
        }

        .rope-outer {
          animation: rope-spin 0.55s linear infinite;
          transform-origin: center center;
        }
        .rope-inner {
          animation: rope-spin-reverse 0.55s linear infinite;
          transform-origin: center center;
        }
        .person-bob {
          animation: rope-person-bob 0.55s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .card-glow:hover {
          animation: pulse-cyan 1.8s ease-in-out infinite;
          border-color: rgba(0,245,255,0.45) !important;
        }
        .fade-up { animation: fade-up 0.6s ease both; }

        /* Zigzag divider */
        .zigzag-divider {
          width: 100%;
          height: 18px;
          background:
            linear-gradient(135deg, transparent 33.33%, #00f5ff 33.33%, #00f5ff 66.66%, transparent 66.66%) 0 0 / 18px 18px repeat-x,
            linear-gradient(225deg, transparent 33.33%, #00f5ff 33.33%, #00f5ff 66.66%, transparent 66.66%) 0 0 / 18px 18px repeat-x;
          opacity: 0.18;
        }

        /* Rope coil background pattern */
        .rope-bg {
          background-image:
            radial-gradient(circle at 50% 50%, rgba(0,245,255,0.06) 2px, transparent 2px),
            radial-gradient(circle at 80% 20%, rgba(255,77,109,0.04) 1.5px, transparent 1.5px),
            radial-gradient(ellipse at 30% 70%, rgba(0,245,255,0.03) 3px, transparent 3px);
          background-size: 48px 48px, 32px 32px, 64px 64px;
        }

        .metric-line::after {
          content: '';
          display: block;
          height: 3px;
          width: 48px;
          background: #ff4d6d;
          margin-top: 6px;
          border-radius: 2px;
        }

        .section-header {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.15em;
          font-size: 1.1rem;
          color: rgba(255,255,255,0.35);
        }

        .rpe-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #00f5ff, #ff4d6d);
        }

        .diagonal-card {
          transform: rotate(-0.8deg);
          transition: transform 0.2s ease;
        }
        .diagonal-card:hover {
          transform: rotate(0deg);
        }
        .diagonal-card-alt {
          transform: rotate(0.6deg);
          transition: transform 0.2s ease;
        }
        .diagonal-card-alt:hover {
          transform: rotate(0deg);
        }
      ` }} />

      <div className="min-h-screen text-white rope-bg" style={{ background: '#111318' }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{ background: 'rgba(17,19,24,0.92)', borderColor: 'rgba(0,245,255,0.12)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 font-space text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK
            </Link>
            <div className="h-4 w-px" style={{ background: 'rgba(0,245,255,0.18)' }} />
            {/* Rope animation icon */}
            <div className="relative w-7 h-7 shrink-0">
              <svg viewBox="0 0 28 28" className="w-full h-full">
                <g className="rope-outer">
                  <ellipse cx="14" cy="14" rx="11" ry="4" fill="none" stroke="#00f5ff" strokeWidth="1.8" strokeOpacity="0.7" />
                </g>
                <g className="rope-inner">
                  <ellipse cx="14" cy="14" rx="11" ry="4" fill="none" stroke="#ff4d6d" strokeWidth="1.2" strokeOpacity="0.5" transform="rotate(60 14 14)" />
                </g>
                <circle cx="14" cy="14" r="2.5" fill="#00f5ff" fillOpacity="0.9" />
              </svg>
            </div>
            <h1 className="font-bebas text-xl tracking-widest" style={{ color: '#00f5ff' }}>
              JUMP ROPE SCIENCE
            </h1>
            <span className="hidden sm:block font-space text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
              EVIDENCE-BASED
            </span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 pb-28">

          {/* ── HERO ──────────────────────────────────────────────────────────── */}
          <section className="pt-10 pb-8 relative overflow-hidden">
            {/* Decorative background rope animation */}
            <div className="absolute right-0 top-4 opacity-10 pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 200 200" className="w-48 h-48">
                <g className="rope-outer" style={{ transformOrigin: '100px 100px' }}>
                  <ellipse cx="100" cy="100" rx="80" ry="28" fill="none" stroke="#00f5ff" strokeWidth="3" />
                </g>
                <g style={{ transformOrigin: '100px 100px', animation: 'rope-spin-reverse 0.55s linear infinite' }}>
                  <ellipse cx="100" cy="100" rx="80" ry="28" fill="none" stroke="#ff4d6d" strokeWidth="2" transform="rotate(40 100 100)" />
                </g>
                <g className="person-bob" style={{ transformOrigin: '100px 140px' }}>
                  <circle cx="100" cy="80" r="10" fill="#00f5ff" fillOpacity="0.6" />
                  <rect x="94" y="90" width="12" height="24" rx="4" fill="#00f5ff" fillOpacity="0.4" />
                  <line x1="94" y1="96" x2="82" y2="108" stroke="#00f5ff" strokeWidth="2" strokeOpacity="0.4" />
                  <line x1="106" y1="96" x2="118" y2="108" stroke="#00f5ff" strokeWidth="2" strokeOpacity="0.4" />
                  <line x1="96" y1="114" x2="90" y2="132" stroke="#00f5ff" strokeWidth="2" strokeOpacity="0.4" />
                  <line x1="104" y1="114" x2="110" y2="132" stroke="#00f5ff" strokeWidth="2" strokeOpacity="0.4" />
                </g>
              </svg>
            </div>

            <div className="relative z-10 max-w-3xl">
              <div
                className="inline-block font-space text-[10px] px-3 py-1 rounded mb-4"
                style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', letterSpacing: '0.18em' }}
              >
                THE SCIENCE
              </div>
              <h2
                className="font-bebas leading-none mb-4"
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#ffffff', letterSpacing: '0.03em' }}
              >
                JUMP ROPE
                <br />
                <span style={{ color: '#00f5ff' }}>SCIENCE</span>
              </h2>
              <p className="font-serif4 text-base leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>
                The most underrated cardio tool in existence. 10 minutes. 11 METs. More coordination than any treadmill.
              </p>
            </div>

            {/* Hero metric displays */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {HERO_METRICS.map((m) => (
                <div
                  key={m.unit}
                  className="rounded-xl p-5 border card-glow"
                  style={{ background: '#1a1e27', borderColor: 'rgba(0,245,255,0.2)', borderLeftWidth: '3px', borderLeftColor: '#00f5ff' }}
                >
                  <div className="metric-line">
                    <span className="font-bebas" style={{ fontSize: '3.5rem', color: '#00f5ff', lineHeight: 1 }}>
                      {m.value}
                    </span>
                  </div>
                  <div className="font-space text-xs mt-2 font-bold" style={{ color: '#ff4d6d' }}>{m.unit}</div>
                  <div className="font-space text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{m.sub}</div>
                  <div
                    className="font-space text-[9px] mt-2 px-2 py-0.5 rounded inline-block"
                    style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', letterSpacing: '0.1em' }}
                  >
                    {m.citation}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ZIGZAG DIVIDER ────────────────────────────────────────────────── */}
          <div className="zigzag-divider my-2" />

          {/* ── SECTION 1: CARDIOVASCULAR PHYSICS ────────────────────────────── */}
          <section className="py-8">
            <div className="section-header mb-6">
              ▸ CARDIOVASCULAR PHYSICS
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {CARDIO_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 text-center border"
                  style={{ background: '#1a1e27', borderColor: 'rgba(0,245,255,0.12)' }}
                >
                  <div className="font-bebas" style={{ fontSize: '2rem', color: '#00f5ff', lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div
                    className="font-space text-[10px] font-bold mt-0.5"
                    style={{ color: '#ff4d6d' }}
                  >
                    {s.unit}
                  </div>
                  <div
                    className="font-space text-[10px] mt-1.5"
                    style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Two cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card A */}
              <div
                className="rounded-xl border overflow-hidden diagonal-card card-glow"
                style={{ background: '#1a1e27', borderColor: 'rgba(0,245,255,0.2)', borderLeftWidth: '3px', borderLeftColor: '#00f5ff' }}
              >
                <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
                  <div
                    className="font-space text-[10px] mb-2 px-2 py-0.5 rounded inline-block"
                    style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', letterSpacing: '0.1em' }}
                  >
                    BAKER 1999 — RES Q EXERC SPORT
                  </div>
                  <h3 className="font-bebas text-xl" style={{ color: '#00f5ff', letterSpacing: '0.08em' }}>
                    THE 10-MINUTE MILE CLAIM IS TRUE
                  </h3>
                </div>
                <div className="px-5 py-4">
                  <p className="font-serif4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    10 minutes at 120 RPM produces equivalent O₂ consumption to running 1 mile. Whole-body movement at high cadence demands continuous bilateral arm work, trunk stabilization, and plyometric calf loading simultaneously — no treadmill setting replicates this multi-system demand. The metabolic equivalence is calorically real, not merely theoretical.
                  </p>

                  {/* Calorie comparison table */}
                  <div className="mt-4 space-y-2">
                    <div className="font-space text-[9px] mb-3" style={{ color: 'rgba(0,245,255,0.5)', letterSpacing: '0.15em' }}>
                      KCAL/10 MIN AT MATCHED PERCEIVED EFFORT
                    </div>
                    {CALORIE_TABLE.map((row) => (
                      <div key={row.activity}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-space text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {row.activity}
                          </span>
                          <span
                            className="font-space text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: row.activity.startsWith('Jump') ? 'rgba(255,77,109,0.18)' : 'rgba(255,255,255,0.06)',
                              color: row.activity.startsWith('Jump') ? '#ff4d6d' : 'rgba(255,255,255,0.45)',
                            }}
                          >
                            {row.kcal} kcal
                          </span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.bar}%`,
                              background: row.activity.startsWith('Jump') ? '#00f5ff' : 'rgba(0,245,255,0.3)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card B */}
              <div
                className="rounded-xl border overflow-hidden diagonal-card-alt card-glow"
                style={{ background: '#1a1e27', borderColor: 'rgba(0,245,255,0.2)', borderLeftWidth: '3px', borderLeftColor: '#00f5ff' }}
              >
                <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
                  <div
                    className="font-space text-[10px] mb-2 px-2 py-0.5 rounded inline-block"
                    style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', letterSpacing: '0.1em' }}
                  >
                    PENDER 1995 / TREUTH 1996
                  </div>
                  <h3 className="font-bebas text-xl" style={{ color: '#00f5ff', letterSpacing: '0.08em' }}>
                    VO₂MAX IN 12 WEEKS
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {/* Pender stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: '+14.7%', lbl: 'VO₂max' },
                      { val: '−15 bpm', lbl: 'submaximal HR' },
                      { val: '−3.1%', lbl: 'body fat' },
                    ].map((s) => (
                      <div
                        key={s.lbl}
                        className="rounded-lg p-3 text-center"
                        style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.12)' }}
                      >
                        <div className="font-bebas text-lg" style={{ color: '#00f5ff' }}>{s.val}</div>
                        <div className="font-space text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  <p className="font-serif4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    12-week structured rope program drives meaningful VO₂max adaptation, submaximal cardiac efficiency gains, and body composition changes — a triple-adaptation profile matched by few modalities.
                  </p>

                  {/* EPOC callout */}
                  <div
                    className="rounded-lg p-3"
                    style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)' }}
                  >
                    <div className="font-space text-[9px] mb-1 font-bold" style={{ color: '#ff4d6d', letterSpacing: '0.12em' }}>
                      THE EPOC ADVANTAGE — TREUTH 1996
                    </div>
                    <p className="font-space text-[11px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      HIIT rope produces EPOC lasting 24–38 hours. Additional 80–100 kcal post-exercise fat oxidation per session — without a minute of extra training time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── ZIGZAG DIVIDER ────────────────────────────────────────────────── */}
          <div className="zigzag-divider my-2" />

          {/* ── SECTION 2: NEUROMOTOR COORDINATION ───────────────────────────── */}
          <section className="py-8">
            <div className="section-header mb-2">
              ▸ NEUROMOTOR COORDINATION
            </div>

            {/* Full-width callout */}
            <div
              className="rounded-xl p-6 mb-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.08) 0%, rgba(255,77,109,0.06) 100%)', border: '1px solid rgba(0,245,255,0.18)' }}
            >
              {/* Decorative rope coils */}
              <div className="absolute right-6 top-4 opacity-10 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 80 80" className="w-20 h-20">
                  <g className="rope-outer" style={{ transformOrigin: '40px 40px' }}>
                    <ellipse cx="40" cy="40" rx="32" ry="12" fill="none" stroke="#00f5ff" strokeWidth="2" />
                  </g>
                </svg>
              </div>
              <p className="font-bebas relative z-10" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#ffffff', lineHeight: 1.15, letterSpacing: '0.04em' }}>
                THE ROPE WINDOW IS{' '}
                <span style={{ color: '#00f5ff' }}>200 MILLISECONDS</span>{' '}
                AT 120 RPM.
                <br />
                YOUR NERVOUS SYSTEM ADAPTS OR FAILS.
              </p>
            </div>

            {/* Neuromotor cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {NEURO_CARDS.map((card, i) => (
                <div
                  key={card.id}
                  className={`rounded-xl border overflow-hidden card-glow ${i % 2 === 0 ? 'diagonal-card' : 'diagonal-card-alt'}`}
                  style={{ background: '#1a1e27', borderColor: 'rgba(0,245,255,0.18)', borderLeftWidth: '3px', borderLeftColor: '#00f5ff' }}
                >
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className="font-bebas text-3xl leading-none"
                        style={{ color: '#00f5ff' }}
                      >
                        {card.stat}
                      </div>
                      <div
                        className="font-space text-[9px] text-right px-2 py-1 rounded"
                        style={{ background: 'rgba(255,77,109,0.12)', color: '#ff4d6d', letterSpacing: '0.08em', minWidth: 0 }}
                      >
                        {card.statLabel}
                      </div>
                    </div>
                    <div
                      className="font-space text-[10px] font-bold mb-2 uppercase"
                      style={{ color: 'rgba(0,245,255,0.7)', letterSpacing: '0.08em' }}
                    >
                      {card.title}
                    </div>
                    <p className="font-serif4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.52)' }}>
                      {card.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Skill progression ladder */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: '#1a1e27', borderColor: 'rgba(0,245,255,0.15)' }}
            >
              <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
                <div className="font-bebas text-base tracking-widest" style={{ color: '#00f5ff' }}>
                  SKILL PROGRESSION LADDER
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(0,245,255,0.07)' }}>
                {SKILL_LADDER.map((step) => (
                  <div key={step.level} className="flex items-center gap-4 px-5 py-3.5">
                    <div
                      className="font-bebas text-2xl shrink-0 w-10 text-center"
                      style={{ color: 'rgba(0,245,255,0.3)' }}
                    >
                      {step.level}
                    </div>
                    <div
                      className="h-8 w-px shrink-0"
                      style={{ background: 'rgba(0,245,255,0.12)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bebas tracking-widest" style={{ color: '#ffffff', fontSize: '1.05rem' }}>
                        {step.name}
                      </div>
                      <div className="font-space text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {step.detail}
                      </div>
                    </div>
                    <div
                      className="font-space text-xs font-bold shrink-0 px-2.5 py-1 rounded"
                      style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d' }}
                    >
                      {step.freq}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ZIGZAG DIVIDER ────────────────────────────────────────────────── */}
          <div className="zigzag-divider my-2" />

          {/* ── SECTION 3: ATHLETE APPLICATIONS ──────────────────────────────── */}
          <section className="py-8">
            <div className="section-header mb-6">
              ▸ ATHLETE APPLICATIONS
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {SPORT_TILES.map((tile, i) => (
                <div
                  key={tile.sport}
                  className={`rounded-xl border overflow-hidden card-glow ${i === 1 ? 'diagonal-card' : 'diagonal-card-alt'}`}
                  style={{ background: '#1a1e27', borderColor: 'rgba(255,77,109,0.22)', borderLeftWidth: '3px', borderLeftColor: '#ff4d6d' }}
                >
                  <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'rgba(255,77,109,0.12)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{tile.emoji}</span>
                      <span className="font-bebas tracking-widest text-lg" style={{ color: '#ff4d6d' }}>
                        {tile.sport}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {/* Stat badges */}
                    <div className="space-y-2 mb-4">
                      {tile.stats.map((s) => (
                        <div key={s.label} className="flex items-center justify-between gap-2">
                          <span className="font-space text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            {s.label}
                          </span>
                          <span
                            className="font-space text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={{ background: 'rgba(255,77,109,0.18)', color: '#ff4d6d' }}
                          >
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="font-serif4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.52)' }}>
                      {tile.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ZIGZAG DIVIDER ────────────────────────────────────────────────── */}
          <div className="zigzag-divider my-2" />

          {/* ── SECTION 4: PROTOCOL CARDS ─────────────────────────────────────── */}
          <section className="py-8">
            <div className="section-header mb-2">
              ▸ BUILD YOUR PRACTICE
            </div>
            <h3
              className="font-bebas mb-6"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#ffffff', letterSpacing: '0.05em' }}
            >
              REP COUNTER <span style={{ color: '#00f5ff' }}>PROTOCOLS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROTOCOLS.map((p, i) => (
                <div
                  key={p.id}
                  className={`rounded-xl border overflow-hidden card-glow ${i % 2 === 0 ? 'diagonal-card' : 'diagonal-card-alt'}`}
                  style={{ background: '#1a1e27', borderColor: `${p.colorBorder}`, borderLeftWidth: '3px', borderLeftColor: p.color }}
                >
                  {/* Protocol header */}
                  <div
                    className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 border-b"
                    style={{ borderColor: `${p.colorBorder}` }}
                  >
                    <div>
                      <div
                        className="font-space text-[10px] font-bold mb-1 tracking-widest"
                        style={{ color: p.color, letterSpacing: '0.15em' }}
                      >
                        {p.tag}
                      </div>
                      {p.citation && (
                        <div
                          className="font-space text-[9px] px-1.5 py-0.5 rounded inline-block"
                          style={{ background: 'rgba(255,77,109,0.12)', color: '#ff4d6d' }}
                        >
                          {p.citation}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bebas text-xl" style={{ color: p.color }}>{p.duration}</div>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {/* Structure badge */}
                    <div
                      className="font-space text-xs font-bold mb-4 px-3 py-1.5 rounded text-center"
                      style={{ background: p.colorBg, color: p.color, border: `1px solid ${p.colorBorder}`, letterSpacing: '0.06em' }}
                    >
                      {p.structure}
                    </div>

                    {/* RPE gauge */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-space text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
                          RPE GAUGE
                        </span>
                        <span className="font-space text-[10px] font-bold" style={{ color: p.color }}>
                          {p.rpe}/10
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${p.rpe * 10}%`, background: `linear-gradient(90deg, ${p.color}aa, ${p.color})` }}
                        />
                      </div>
                    </div>

                    {/* Details list */}
                    <ul className="space-y-2">
                      {p.details.map((d) => (
                        <li key={d} className="flex items-start gap-2">
                          <span
                            className="inline-block w-1 h-1 rounded-full shrink-0 mt-1.5"
                            style={{ background: p.color, opacity: 0.7 }}
                          />
                          <span className="font-space text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                            {d}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ZIGZAG DIVIDER ────────────────────────────────────────────────── */}
          <div className="zigzag-divider my-2" />

          {/* ── CITATIONS FOOTER ──────────────────────────────────────────────── */}
          <section className="py-8">
            <div className="section-header mb-4">
              ▸ REFERENCES
            </div>
            <div
              className="rounded-xl border p-5"
              style={{ background: 'rgba(26,30,39,0.6)', borderColor: 'rgba(0,245,255,0.1)' }}
            >
              <ol className="space-y-2">
                {CITATIONS.map((cite, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="font-space text-[10px] shrink-0 w-5 text-right mt-0.5"
                      style={{ color: 'rgba(0,245,255,0.4)' }}
                    >
                      {i + 1}.
                    </span>
                    <span className="font-space text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {cite}
                    </span>
                  </li>
                ))}
              </ol>
              <div
                className="mt-5 pt-4 border-t font-space text-[10px] leading-relaxed"
                style={{ borderColor: 'rgba(0,245,255,0.08)', color: 'rgba(255,255,255,0.2)' }}
              >
                For educational purposes only. Consult a qualified coach or clinician before starting a new training program, particularly if managing cardiovascular, musculoskeletal, or metabolic conditions.
              </div>
            </div>
          </section>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
