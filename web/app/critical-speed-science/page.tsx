// Critical Speed Science — static server component
// "The Threshold Line" — Physics-meets-endurance aesthetic
// Evidence-based deep-dive into CS, W', pacing strategy, and field estimation.

export const metadata = { title: 'Critical Speed Science' }

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:          '#090c12',
  card:        '#0d1219',
  cardAlt:     '#0f1520',
  teal:        '#00d4c8',
  tealDim:     'rgba(0,212,200,0.12)',
  tealBorder:  'rgba(0,212,200,0.28)',
  tealSoft:    '#2dd4bf',
  red:         '#ff2d55',
  redDim:      'rgba(255,45,85,0.12)',
  redBorder:   'rgba(255,45,85,0.28)',
  amber:       '#f59e0b',
  amberDim:    'rgba(245,158,11,0.12)',
  amberBorder: 'rgba(245,158,11,0.28)',
  text:        '#f0f4fa',
  textSub:     '#8b96ae',
  textMuted:   '#3a4560',
  border:      '#151e2e',
  // Font stacks
  syncopate:   "'Syncopate', 'Rajdhani', sans-serif",
  grotesk:     "'Space Grotesk', 'Inter', system-ui, sans-serif",
  inconsolata: "'Inconsolata', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
} as const

// ─── Hero stats ───────────────────────────────────────────────────────────────

const HERO_STATS = [
  {
    value: '85–95%',
    label: 'Performance variance explained by CS',
    sub: 'Vanhatalo 2011 · trained runners',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
  },
  {
    value: '6.3 min',
    label: "Time constant for W' reconstitution",
    sub: 'Skiba 2012 · at rest',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
  },
  {
    value: '100–105%',
    label: 'Optimal 5K race pace relative to CS',
    sub: 'Billat 1999 · Jones 2010',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
  },
] as const

// ─── CS Model cards ───────────────────────────────────────────────────────────

const CS_MODEL_CARDS = [
  {
    num: '01',
    title: 'Monod & Scherrer 1965',
    subtitle: 'Original Formulation',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    body: "Critical Speed is the asymptote of the hyperbolic speed-duration relationship — the speed that can theoretically be sustained indefinitely. D' (D prime) is the curvature constant: a finite anaerobic work capacity above CS. Together, these two parameters allow prediction of exhaustion time from first principles. No other exercise physiology model can predict time to exhaustion from just two parameters.",
    stat: 'T = D\u2032 / (v \u2212 CS)',
    statLabel: 'time to exhaustion at speed v',
    citations: ['Monod & Scherrer 1965 (J Physiol)', 'Hill 1993 (J Appl Physiol)'],
  },
  {
    num: '02',
    title: 'Jones 2010',
    subtitle: 'CS = MLSS = LT2',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    body: "CS is physiologically indistinguishable from the Maximal Lactate Steady State (MLSS) and Lactate Threshold 2 (LT2) in trained athletes. At CS, mitochondrial oxidative flux is maximal — exactly matching ATP demand. Above CS, glycolysis is recruited, driving progressive lactate accumulation, VO\u2082 slow component activation, and inevitable fatigue.",
    stat: 'CS \u2248 89% HRmax',
    statLabel: 'practical estimate (LT2 equivalent)',
    citations: ['Jones AM 2010 (J Exerc Sci Fit)', 'Poole DC 2016 (Med Sci Sports Exerc)'],
  },
  {
    num: '03',
    title: 'Vanhatalo 2011 · Kranenburg 1994',
    subtitle: 'CS vs VO₂max vs LT as Predictors',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    body: 'CS outperforms VO\u2082max and lactate threshold as a performance predictor in trained runners. The hierarchy is clear: CS explains the most variance, followed by running economy, then LT1. VO\u2082max sets the ceiling — CS determines how close you run to it. "VO\u2082max is the ceiling. CS is the floor of that ceiling."',
    stat: '85\u201395%',
    statLabel: 'CS performance variance (trained runners)',
    citations: ['Vanhatalo A 2011 (Med Sci Sports Exerc)', 'Kranenburg KJ 1994 (J Sports Sci)'],
    table: [
      { metric: 'Critical Speed (CS)', variance: '85–95%', bar: 90 },
      { metric: 'VO\u2082max', variance: '55–75%', bar: 65 },
      { metric: 'Running Economy', variance: '35–65%', bar: 50 },
      { metric: 'LT1', variance: '50–70%', bar: 60 },
    ],
  },
  {
    num: '04',
    title: 'Vanhatalo 2008',
    subtitle: 'CS Training Adaptations',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    body: 'Six weeks of CS-targeted training produces measurable improvements in both model parameters. CS improvements translate directly to race performance: each 1% improvement in CS yields approximately 45 seconds on a 5K for trained runners. W\u2032 improvements expand the buffer available for surges, hills, and finishing kicks.',
    stat: '+6.2% CS',
    statLabel: '6-week CS training (Vanhatalo 2008)',
    citations: ['Vanhatalo A 2008 (Med Sci Sports Exerc)'],
    adaptations: [
      { label: 'CS', delta: '+6.2%', color: C.teal },
      { label: "W'", delta: '+13%', color: C.amber },
      { label: 'VO\u2082max', delta: '+4.1%', color: C.red },
    ],
  },
] as const

// ─── W' cards ─────────────────────────────────────────────────────────────────

const W_PRIME_CARDS = [
  {
    num: '01',
    title: "W' Physiology",
    subtitle: 'Ferguson 2010',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    body: "W' represents the finite capacity for work above CS — comprising phosphocreatine stores, oxygen stores, and glycolytic capacity. In trained runners, W' typically falls between 90 and 150 metres (distance equivalent). Complete depletion of W' causes exhaustion regardless of how far above CS you are running. At CS, 50% of W' reconstitutes in just 2–3 minutes; 95% is restored within 6–7 minutes of rest or sub-CS running.",
    stat: '90–150m',
    statLabel: "typical W' in trained runners",
    citations: ['Ferguson C 2010 (J Appl Physiol)', 'Skiba PF 2012 (PLoS One)'],
  },
  {
    num: '02',
    title: "W' Balance Model",
    subtitle: 'Skiba 2012',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    body: "The W'BAL model tracks the real-time state of W' throughout a race or training session. Every second spent above CS depletes W' by (v − CS) metres. Every second below CS reconstitutes W' according to an exponential recovery function. When W'BAL reaches zero: immediate exhaustion. This transforms CS science from lab theory into a real-time pacing tool.",
    stat: "W'BAL = 0",
    statLabel: 'immediate exhaustion — the hard ceiling',
    citations: ["Skiba PF 2012 (PLoS One) — W'BAL model"],
    formula: "W'BAL(t) = W' \u2212 \u222b(v\u2212CS)dt + reconstitution",
  },
  {
    num: '03',
    title: "W' Reconstitution Kinetics",
    subtitle: 'Caen 2019',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    body: "The time constant for W' recovery (\u03c4w) averages 377 seconds (6.3 minutes for 63% recovery), but varies enormously between individuals — from 200 to 600 seconds. This variability has strategic implications: athletes with fast \u03c4w can execute aggressive surge-and-recover tactics, while slow recoverers must pace more conservatively. Downhill segments and recovery intervals are not rest — they are W' reconstitution opportunities.",
    stat: '\u03c4w = 377s',
    statLabel: '63% recovery time constant (Caen 2019)',
    citations: ['Caen K 2019 (Front Physiol)', 'Skiba PF 2012 (PLoS One)'],
  },
  {
    num: '04',
    title: 'Individual Variability',
    subtitle: 'Poole 2016',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    body: "W' is highly event-specific and trainable with targeted speed endurance work. Elite 800m runners can exceed 250 metres of W', enabling sustained surges at 110%+ CS. Endurance specialists carry smaller W' (60–100m) but much higher CS. Sprint athletes often have large W' (200–300m) but lower CS. The optimal training prescription for W' expansion: 4 × 3–4 minutes at 105–110% CS with full recovery.",
    stat: '>250m',
    statLabel: "W' in elite 800m runners (Poole 2016)",
    citations: ['Poole DC 2016 (Med Sci Sports Exerc)'],
    types: [
      { type: 'Elite 800m', wPrime: '>250m', cs: 'High', color: C.red },
      { type: 'Endurance specialist', wPrime: '60–100m', cs: 'Very High', color: C.teal },
      { type: 'Sprint athlete', wPrime: '200–300m', cs: 'Moderate', color: C.amber },
    ],
  },
] as const

// ─── Race distance strategies ─────────────────────────────────────────────────

const RACE_STRATEGIES = [
  {
    distance: '5K',
    zone: 'ABOVE CS',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    target: '100–105% CS',
    wSpend: '80–100%',
    strategy: "Conservative first km, progressive build through km 2–4, commit full W' in the final 800m. Positive split indicates poor W' management — you spent W' too early and hit the wall.",
    mistake: "Early surge depletes W' before km 3 — finish fade is inevitable.",
  },
  {
    distance: '10K',
    zone: 'AT CS',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    target: '99–102% CS',
    wSpend: '30–60%',
    strategy: "Even split is critical. The 10K sits at the knife-edge of CS — small positive splits cause disproportionate W' drain. A well-paced 10K should feel progressively harder with available energy for a final km acceleration.",
    mistake: 'Early surge at km 1–3 depletes W\u2032, causes an irreversible fade in km 7–10.',
  },
  {
    distance: 'MARATHON',
    zone: 'BELOW CS',
    accent: C.tealSoft,
    dim: 'rgba(45,212,191,0.10)',
    border: 'rgba(45,212,191,0.25)',
    target: '88–95% CS',
    wSpend: 'W\u2032 not limiting',
    strategy: "W' is not the limiting factor below CS. Cardiovascular efficiency and glycogen availability dominate. CS training still matters: higher CS means lower relative effort at marathon pace, producing less cardiac drift, lower glycogen burn rate, and greater resistance to late-race fade.",
    mistake: 'Neglecting CS development because "W\u2032 doesn\u2019t matter" — CS sets the ceiling that marathon pace is a fraction of.',
  },
] as const

// ─── Training protocols ───────────────────────────────────────────────────────

const TRAINING_PROTOCOLS = [
  {
    name: 'CS Intervals',
    target: 'Raises CS',
    protocol: '4 × 6 min at CS',
    recovery: '3 min easy jog',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    citation: 'Billat 1999',
    mechanism: 'Sustained CS stimulus maximises mitochondrial adaptation and raises the asymptote',
  },
  {
    name: 'vVO₂max Intervals',
    target: 'Raises VO₂max ceiling',
    protocol: '6 × 3 min at 105% CS',
    recovery: '3 min easy',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    citation: 'Billat 1999',
    mechanism: "Above CS — intentional W' depletion that drives VO\u2082max ceiling expansion",
  },
  {
    name: 'Speed Endurance',
    target: "Raises W'",
    protocol: '4 × 3 min at 110% CS',
    recovery: '5 min easy',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    citation: 'Vanhatalo 2008',
    mechanism: "High-intensity W' stress develops the anaerobic buffer and PCr resynthesis capacity",
  },
] as const

// ─── Wearable / estimation cards ─────────────────────────────────────────────

const ESTIMATION_CARDS = [
  {
    device: 'Apple Watch',
    icon: '',
    accent: C.textSub,
    dim: 'rgba(139,150,174,0.08)',
    border: 'rgba(139,150,174,0.2)',
    accuracy: '±10–12%',
    tip: 'VO₂max × 0.85 × economy → rough CS estimate. Better: combine VO₂max data with parkrun PR for an improved field estimate.',
    citation: 'Wearable algorithm vs lab MLSS',
  },
  {
    device: 'Garmin Threshold Pace',
    icon: '',
    accent: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    accuracy: '±4%',
    tip: 'Within 4% of lab CS in trained runners (Snyder 2019). The FirstBeat algorithm detects 3-minute maximal effort segments for threshold estimation.',
    citation: 'Snyder AC 2019 · trained runners',
  },
  {
    device: 'Stryd Running Power',
    icon: '',
    accent: C.amber,
    dim: C.amberDim,
    border: C.amberBorder,
    accuracy: 'r = 0.93',
    tip: 'CP (running Watts) correlates r = 0.93 with lab MLSS (Jones 2017). Terrain-adjusted — eliminates elevation noise from pace-based estimates.',
    citation: 'Jones AM 2017 (Int J Sports Physiol Perf)',
  },
  {
    device: 'Environmental Effects',
    icon: '',
    accent: C.red,
    dim: C.redDim,
    border: C.redBorder,
    accuracy: 'Variable',
    tip: 'Heat >30°C: CS −3 to −8%. Altitude 2000m: CS −5 to −10%. Post-illness: CS −5 to −15%, typically returns within 3–10 days of recovery.',
    citation: 'Nybo 2010 · Chapman 2010 · Moran 2006',
  },
] as const

// ─── Footer citations ─────────────────────────────────────────────────────────

const CITATIONS = [
  'Monod H, Scherrer J. The work capacity of a synergic muscular group. Ergonomics. 1965;8(3):329–338.',
  'Hill DW. The critical power concept: a review. Sports Med. 1993;16(4):237–254.',
  'Jones AM. The physiology of the world record holder for the women\'s marathon. Int J Sports Sci Coach. 2006;1(2):101–116; Critical Speed: Jones 2010 J Exerc Sci Fit.',
  'Vanhatalo A, Jones AM, Burnley M. Application of critical power in sport. Int J Sports Physiol Perform. 2011;6(1):128–136.',
  'Kranenburg KJ, Smith DJ. Comparison of critical speed determined from track running and treadmill tests in elite runners. Med Sci Sports Exerc. 1994;26(5):614–618.',
  'Skiba PF, Chidnok W, Vanhatalo A, Jones AM. Modeling the expenditure and reconstitution of work capacity above critical power. Med Sci Sports Exerc. 2012;44(8):1526–1532.',
  'Ferguson C, Whipp BJ, Quigley AJ, Higginson J, Ward SA, Porcelli S, Jones AM. Effects of prior very-heavy intensity exercise on indices of aerobic function and high-intensity exercise tolerance. J Appl Physiol. 2010;108(2):485–497.',
  'Vanhatalo A, Doust JH, Burnley M. A 3-min all-out cycling test is sensitive to a change in critical power. Med Sci Sports Exerc. 2008;40(9):1693–1699.',
  'Caen K, Bourgois G, Bourgois J, Van Eetvelde B, Vermeire K, Boone J. The reconstitution of W\' depends on both the severity and the duration of the recovery intensity below critical power. Front Physiol. 2019;10:1381.',
  'Poole DC, Burnley M, Vanhatalo A, Rossiter HB, Jones AM. Critical power: an important fatigue threshold in exercise physiology. Med Sci Sports Exerc. 2016;48(11):2320–2334.',
  'Billat VL, Blondel N, Berthoin S. Determination of the velocity associated with the longest time to exhaustion at maximal oxygen uptake. Eur J Appl Physiol. 1999;80(2):159–161.',
  'Morton RH, Hodgson DJ. The relationship between power output and endurance: a brief review. Eur J Appl Physiol Occup Physiol. 1996;73(6):491–502.',
  'Jones AM, Vanhatalo A. The \'critical power\' concept: applications to sports performance with a focus on intermittent high-intensity exercise. Sports Med. 2010;40(5):379–396.',
] as const

// ─── Battery levels for W' visualization ──────────────────────────────────────

const BATTERY_STATES = [
  { label: 'BELOW CS — Rest & Recovery', pct: 100, desc: 'W\u2032 fully charged. Aerobic system dominant. Can sustain indefinitely.', accent: C.teal, animId: 'bat-full' },
  { label: 'ABOVE CS — 2 min sustained', pct: 60, desc: 'W\u2032 depleting at rate (v \u2212 CS) m/s. Lactate rising. VO\u2082 slow component active.', accent: C.amber, animId: 'bat-mid' },
  { label: 'ABOVE CS — 6 min — EXHAUSTED', pct: 0, desc: 'W\u2032 = 0. Exhaustion regardless of motivation. Speed must drop to CS to reconstitute.', accent: C.red, animId: 'bat-empty' },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CriticalSpeedSciencePage() {
  const svgW = 900
  const svgH = 340

  // Speed-time hyperbolic curve: v = CS + D'/t
  // Axis: x = 60s to 3600s (1hr), y = 0 to v_max
  const CS_MS   = 3.47   // m/s (~12.5 km/h)
  const D_PRIME = 280    // metres
  const V_MAX   = CS_MS + D_PRIME / 60  + 0.5  // ~8.1 m/s
  const T_MIN   = 60     // 1 min
  const T_MAX   = 3600   // 60 min

  const xPad = 52
  const yPad = 32
  const plotW = svgW - xPad - 24
  const plotH = svgH - yPad - 40

  const tToX = (t: number) => xPad + ((Math.log(t) - Math.log(T_MIN)) / (Math.log(T_MAX) - Math.log(T_MIN))) * plotW
  const vToY = (v: number) => yPad + plotH - ((v - 0) / (V_MAX - 0)) * plotH

  // Build SVG curve points
  const N = 120
  const curvePoints: [number, number][] = []
  for (let i = 0; i <= N; i++) {
    const t = Math.exp(Math.log(T_MIN) + (i / N) * (Math.log(T_MAX) - Math.log(T_MIN)))
    const v = CS_MS + D_PRIME / t
    if (v <= V_MAX + 0.1) {
      curvePoints.push([tToX(t), vToY(v)])
    }
  }

  const curvePath = curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ')

  // CS asymptote y-position
  const csY = vToY(CS_MS)

  // Annotation points
  const annAboveX = tToX(180)
  const annAboveY = vToY(CS_MS + D_PRIME / 180 + 0.4)
  const annCSX = tToX(2400)
  const annCSY = csY - 10

  // X-axis tick marks (minutes)
  const xTicks = [2, 5, 10, 20, 30, 60].map(min => ({ min, x: tToX(min * 60) }))
  // Y-axis ticks (m/s)
  const yTicks = [2, 3, 4, 5, 6, 7, 8].map(v => ({ v, y: vToY(v) }))

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* ── GOOGLE FONTS + ANIMATIONS ───────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Inconsolata:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes bat-fill-full {
          0%   { width: 0% }
          60%  { width: 100% }
          100% { width: 100% }
        }
        @keyframes bat-fill-mid {
          0%   { width: 100% }
          40%  { width: 100% }
          80%  { width: 60% }
          100% { width: 60% }
        }
        @keyframes bat-fill-empty {
          0%   { width: 100% }
          30%  { width: 100% }
          90%  { width: 0% }
          100% { width: 0% }
        }
        @keyframes pulse-teal {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes flicker-red {
          0%, 100% { opacity: 1; }
          25%       { opacity: 0.7; }
          75%       { opacity: 0.85; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift-line {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -40; }
        }
        @keyframes glow-teal {
          0%, 100% { box-shadow: 0 0 8px rgba(0,212,200,0.25); }
          50%       { box-shadow: 0 0 20px rgba(0,212,200,0.5); }
        }

        .hero-title {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.08;
          color: #f0f4fa;
          margin: 0;
        }
        .section-label {
          font-family: 'Syncopate', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${C.textMuted};
        }
        .section-heading {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: ${C.text};
          margin: 0;
        }
        .formula-block {
          font-family: 'Inconsolata', ui-monospace, monospace;
          background: #060a10;
          border: 1px solid ${C.tealBorder};
          border-left: 3px solid ${C.teal};
          border-radius: 6px;
          padding: 14px 18px;
          color: ${C.teal};
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1.5;
          white-space: pre;
        }
        .formula-block.amber {
          border-color: ${C.amberBorder};
          border-left-color: ${C.amber};
          color: ${C.amber};
        }
        .formula-block.red {
          border-color: ${C.redBorder};
          border-left-color: ${C.red};
          color: ${C.red};
        }
        .card-base {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 12px;
          overflow: hidden;
        }
        .hero-formula-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }
        .hero-formula-item {
          font-family: 'Inconsolata', ui-monospace, monospace;
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          font-weight: 700;
          color: ${C.teal};
          background: rgba(0,212,200,0.07);
          border: 1px solid ${C.tealBorder};
          border-radius: 8px;
          padding: 10px 16px;
          letter-spacing: 0.01em;
          line-height: 1.3;
          animation: glow-teal 3s ease-in-out infinite;
        }
        .hero-formula-item .comment {
          color: ${C.textMuted};
          font-weight: 400;
          font-size: 0.8em;
          margin-left: 8px;
        }
        .stat-pill {
          display: inline-block;
          font-family: 'Inconsolata', ui-monospace, monospace;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 4px;
          margin-bottom: 2px;
        }
        .body-text {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: 0.9rem;
          line-height: 1.7;
          color: ${C.textSub};
          margin: 0;
        }
        .data-label {
          font-family: 'Inconsolata', ui-monospace, monospace;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.textMuted};
        }
        .big-stat {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 700;
          font-size: clamp(1.6rem, 3.5vw, 2.6rem);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .card-num {
          font-family: 'Syncopate', sans-serif;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: ${C.textMuted};
        }
        .citation-tag {
          font-family: 'Inconsolata', ui-monospace, monospace;
          font-size: 0.65rem;
          color: ${C.textMuted};
          letter-spacing: 0.04em;
        }
        @media (min-width: 640px) {
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        }
        @media (max-width: 639px) {
          .grid-2, .grid-3, .grid-4 { display: flex; flex-direction: column; gap: 12px; }
        }
      ` }} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 540, paddingBottom: 0 }}>

        {/* Red zone background (above CS) */}
        <div style={{
          position: 'absolute', inset: 0, top: 0,
          background: `linear-gradient(to bottom, rgba(255,45,85,0.05) 0%, transparent 55%)`,
          pointerEvents: 'none',
        }} />

        {/* SVG: Speed-Time Hyperbolic Curve */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', opacity: 0.9 }}>
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', maxWidth: svgW, height: 'auto' }}
            aria-hidden="true"
          >
            {/* Red zone fill above CS asymptote (above the curve) */}
            <defs>
              <linearGradient id="redZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.red} stopOpacity="0.10" />
                <stop offset="100%" stopColor={C.red} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="greenZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.teal} stopOpacity="0.01" />
                <stop offset="100%" stopColor={C.teal} stopOpacity="0.07" />
              </linearGradient>
              <linearGradient id="curveGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={C.red} stopOpacity="0.9" />
                <stop offset="60%" stopColor={C.amber} stopOpacity="0.9" />
                <stop offset="100%" stopColor={C.teal} stopOpacity="0.9" />
              </linearGradient>
              <filter id="blurF" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Green zone below CS */}
            <rect
              x={xPad} y={csY}
              width={plotW} height={plotH - (csY - yPad)}
              fill="url(#greenZoneGrad)"
            />

            {/* Red zone above CS asymptote — area above the curve path */}
            <path
              d={`${curvePath} L${curvePoints[curvePoints.length - 1][0].toFixed(1)},${yPad} L${curvePoints[0][0].toFixed(1)},${yPad} Z`}
              fill="url(#redZoneGrad)"
            />

            {/* Axis lines */}
            <line x1={xPad} y1={yPad} x2={xPad} y2={yPad + plotH} stroke={C.textMuted} strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1={xPad} y1={yPad + plotH} x2={xPad + plotW} y2={yPad + plotH} stroke={C.textMuted} strokeWidth="0.8" strokeOpacity="0.5" />

            {/* Grid lines */}
            {yTicks.map(({ v, y }) => (
              <line key={v} x1={xPad} y1={y} x2={xPad + plotW} y2={y}
                stroke={v === Math.round(CS_MS) ? 'transparent' : C.textMuted}
                strokeWidth="0.4" strokeOpacity="0.2" strokeDasharray="4 6"
              />
            ))}

            {/* CS asymptote — dashed teal horizontal */}
            <line
              x1={xPad} y1={csY} x2={xPad + plotW} y2={csY}
              stroke={C.teal} strokeWidth="1.5"
              strokeDasharray="10 6"
              style={{ animation: 'drift-line 4s linear infinite' }}
            />
            {/* CS glow blur */}
            <line
              x1={xPad} y1={csY} x2={xPad + plotW} y2={csY}
              stroke={C.teal} strokeWidth="4" strokeOpacity="0.18"
              filter="url(#blurF)"
            />

            {/* Hyperbolic curve — glow shadow */}
            <path d={curvePath} fill="none" stroke="url(#curveGlow)" strokeWidth="5" strokeOpacity="0.2" filter="url(#blurF)" strokeLinecap="round" />
            {/* Hyperbolic curve — main */}
            <path d={curvePath} fill="none" stroke="url(#curveGlow)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

            {/* X-axis ticks and labels */}
            {xTicks.map(({ min, x }) => (
              <g key={min}>
                <line x1={x} y1={yPad + plotH} x2={x} y2={yPad + plotH + 4} stroke={C.textMuted} strokeWidth="0.8" strokeOpacity="0.5" />
                <text x={x} y={yPad + plotH + 14} textAnchor="middle"
                  fill={C.textMuted} fontSize="9" fontFamily="Inconsolata, monospace"
                >{min}m</text>
              </g>
            ))}

            {/* Y-axis labels (m/s) */}
            {yTicks.filter(({ v }) => v <= Math.ceil(V_MAX)).map(({ v, y }) => (
              <text key={v} x={xPad - 6} y={y + 3} textAnchor="end"
                fill={v === Math.round(CS_MS) ? C.teal : C.textMuted}
                fontSize="9" fontFamily="Inconsolata, monospace"
                fontWeight={v === Math.round(CS_MS) ? '700' : '400'}
              >{v}</text>
            ))}

            {/* Axis labels */}
            <text x={xPad + plotW / 2} y={svgH - 2} textAnchor="middle"
              fill={C.textMuted} fontSize="9" fontFamily="Inconsolata, monospace" letterSpacing="0.08em"
            >TIME (minutes)</text>
            <text x={14} y={yPad + plotH / 2} textAnchor="middle"
              fill={C.textMuted} fontSize="9" fontFamily="Inconsolata, monospace" letterSpacing="0.06em"
              transform={`rotate(-90 14 ${yPad + plotH / 2})`}
            >SPEED (m/s)</text>

            {/* "CS" label on asymptote */}
            <text x={xPad + plotW - 8} y={csY - 6} textAnchor="end"
              fill={C.teal} fontSize="10" fontFamily="Inconsolata, monospace" fontWeight="700" letterSpacing="0.06em"
            >CS = {CS_MS} m/s</text>

            {/* Annotations */}
            {/* "D' exhausted above CS" — red zone */}
            <line x1={annAboveX} y1={annAboveY} x2={annAboveX + 30} y2={annAboveY - 22}
              stroke={C.red} strokeWidth="0.8" strokeOpacity="0.7" />
            <text x={annAboveX + 34} y={annAboveY - 24} fill={C.red} fontSize="9"
              fontFamily="Inconsolata, monospace" fontWeight="600"
            >D\u2032 depletes above CS</text>

            {/* "CS sustained indefinitely" */}
            <line x1={annCSX} y1={annCSY} x2={annCSX} y2={csY + 8}
              stroke={C.teal} strokeWidth="0.8" strokeOpacity="0.7" />
            <text x={annCSX} y={annCSY - 4} fill={C.teal} fontSize="9" textAnchor="middle"
              fontFamily="Inconsolata, monospace" fontWeight="600"
            >CS \u2014 sustained indefinitely</text>
          </svg>
        </div>

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 10,
          maxWidth: 860, margin: '0 auto', padding: '72px 24px 48px',
        }}>
          {/* Eyebrow */}
          <div style={{ marginBottom: 16 }}>
            <span className="section-label" style={{ color: C.teal }}>
              Exercise Physiology · Running Science
            </span>
          </div>

          <h1 className="hero-title" style={{ maxWidth: 600 }}>
            Critical Speed<br />
            <span style={{ color: C.teal }}>Science</span>
          </h1>

          <p style={{
            fontFamily: C.grotesk, fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: C.textSub, marginTop: 16, maxWidth: 540, lineHeight: 1.6,
          }}>
            The two-parameter model that defines everything between a sprint and a marathon.
          </p>

          {/* Hero formulas */}
          <div className="hero-formula-row">
            <div className="hero-formula-item" style={{ animationDelay: '0s' }}>
              T = D\u2032 / (v &minus; CS)
              <span className="comment">// time to exhaustion at speed v</span>
            </div>
            <div className="hero-formula-item" style={{ animationDelay: '1s' }}>
              d = CS &times; t + D\u2032
              <span className="comment">// total distance at time t</span>
            </div>
            <div className="hero-formula-item" style={{ animationDelay: '2s' }}>
              CS &asymp; 89% HR<sub style={{ fontSize: '0.75em' }}>max</sub>
              <span className="comment">// practical estimate</span>
            </div>
          </div>

          {/* Hero stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 36 }}>
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: stat.dim,
                  border: `1px solid ${stat.border}`,
                  borderRadius: 10,
                  padding: '14px 20px',
                  minWidth: 160,
                  flex: '1 1 160px',
                  maxWidth: 220,
                }}
              >
                <div className="big-stat" style={{ color: stat.accent }}>{stat.value}</div>
                <div style={{ fontFamily: C.grotesk, fontSize: '0.78rem', color: C.textSub, marginTop: 4, lineHeight: 1.4 }}>{stat.label}</div>
                <div className="citation-tag" style={{ marginTop: 5 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CS threshold line extending full width */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(to right, transparent, ${C.teal}60, ${C.teal}90, ${C.teal}60, transparent)`,
          boxShadow: `0 0 16px ${C.teal}40`,
        }} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: THE CS MODEL                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 72, paddingBottom: 64 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

          {/* Section header */}
          <div style={{ marginBottom: 40 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Section 01</div>
            <h2 className="section-heading">
              The{' '}
              <span style={{ color: C.teal }}>CS Model</span>
            </h2>
            <p className="body-text" style={{ marginTop: 10, maxWidth: 560 }}>
              Below CS: sustainable indefinitely. Above CS: W&prime; depletes at rate (v &minus; CS) m/s until exhaustion.
            </p>
          </div>

          {/* W' Battery Visualisation */}
          <div className="card-base" style={{ marginBottom: 32, padding: '24px 24px 20px' }}>
            <div style={{ marginBottom: 16 }}>
              <span className="section-label" style={{ color: C.amber }}>W&prime; Battery — Real-Time State</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BATTERY_STATES.map((bat, i) => {
                const animName =
                  i === 0 ? 'bat-fill-full' :
                  i === 1 ? 'bat-fill-mid' :
                  'bat-fill-empty'
                return (
                  <div key={bat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: C.inconsolata, fontSize: '0.75rem', fontWeight: 700, color: bat.accent, letterSpacing: '0.08em' }}>
                        {bat.label}
                      </span>
                      <span style={{ fontFamily: C.inconsolata, fontSize: '0.7rem', color: C.textMuted }}>
                        {bat.pct}%
                      </span>
                    </div>
                    {/* Battery track */}
                    <div style={{
                      position: 'relative',
                      height: 18,
                      background: '#060a10',
                      border: `1px solid ${bat.accent}30`,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${bat.pct}%`,
                        background: bat.pct === 0
                          ? 'transparent'
                          : `linear-gradient(to right, ${bat.accent}90, ${bat.accent})`,
                        borderRadius: 3,
                        animation: `${animName} 5s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                        transition: 'width 0.3s',
                      }} />
                      {/* Battery segment lines */}
                      {[25, 50, 75].map(pct => (
                        <div key={pct} style={{
                          position: 'absolute', top: 0, bottom: 0,
                          left: `${pct}%`,
                          width: 1,
                          background: '#090c12',
                          opacity: 0.7,
                        }} />
                      ))}
                    </div>
                    <p style={{ fontFamily: C.grotesk, fontSize: '0.78rem', color: C.textMuted, margin: '5px 0 0', lineHeight: 1.5 }}>
                      {bat.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CS Model cards */}
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {CS_MODEL_CARDS.map((card) => (
              <div key={card.num} className="card-base" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Top accent bar */}
                <div style={{ height: 3, background: card.accent, flexShrink: 0 }} />
                <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="card-num">{card.num}</div>
                      <h3 style={{ fontFamily: C.grotesk, fontWeight: 700, fontSize: '1rem', color: C.text, margin: '4px 0 0', lineHeight: 1.2 }}>
                        {card.title}
                      </h3>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.7rem', color: card.accent, letterSpacing: '0.1em', marginTop: 3 }}>
                        {card.subtitle}
                      </div>
                    </div>
                    <div style={{
                      background: card.dim,
                      border: `1px solid ${card.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      textAlign: 'center',
                      flexShrink: 0,
                      marginLeft: 12,
                    }}>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.85rem', fontWeight: 700, color: card.accent, whiteSpace: 'nowrap' }}>
                        {card.stat}
                      </div>
                      <div style={{ fontFamily: C.grotesk, fontSize: '0.6rem', color: C.textMuted, marginTop: 2, whiteSpace: 'nowrap' }}>
                        {card.statLabel}
                      </div>
                    </div>
                  </div>

                  <p className="body-text">{card.body}</p>

                  {/* Predictor table for card 03 */}
                  {'table' in card && card.table && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {card.table.map((row) => (
                        <div key={row.metric}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontFamily: C.grotesk, fontSize: '0.75rem', color: row.bar >= 80 ? C.teal : C.textSub }}>{row.metric}</span>
                            <span style={{ fontFamily: C.inconsolata, fontSize: '0.72rem', fontWeight: 700, color: row.bar >= 80 ? C.teal : C.textSub }}>{row.variance}</span>
                          </div>
                          <div style={{ height: 4, background: '#1a2236', borderRadius: 2 }}>
                            <div style={{
                              height: '100%', width: `${row.bar}%`,
                              background: row.bar >= 80 ? C.teal : C.textMuted,
                              borderRadius: 2, opacity: row.bar >= 80 ? 1 : 0.5,
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adaptation deltas for card 04 */}
                  {'adaptations' in card && card.adaptations && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                      {card.adaptations.map((a) => (
                        <div key={a.label} style={{
                          background: `${a.color}15`,
                          border: `1px solid ${a.color}30`,
                          borderRadius: 6,
                          padding: '6px 12px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontFamily: C.inconsolata, fontSize: '1rem', fontWeight: 800, color: a.color }}>{a.delta}</div>
                          <div style={{ fontFamily: C.grotesk, fontSize: '0.62rem', color: C.textMuted, marginTop: 1 }}>{a.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Citations */}
                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    {card.citations.map((c) => (
                      <div key={c} className="citation-tag" style={{ lineHeight: 1.6 }}>› {c}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: W' — THE FINITE RESERVOIR                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 64, paddingBottom: 64, background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.03) 40%, transparent)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ marginBottom: 40 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Section 02</div>
            <h2 className="section-heading">
              W&prime; &mdash; The{' '}
              <span style={{ color: C.amber }}>Finite Reservoir</span>
            </h2>
            <p className="body-text" style={{ marginTop: 10, maxWidth: 560 }}>
              A precisely quantifiable anaerobic work capacity. Deplete it completely — regardless of fitness — and you stop.
            </p>
          </div>

          {/* W'BAL formula display */}
          <div style={{ marginBottom: 28 }}>
            <div className="formula-block amber">
              W&prime;BAL(t) = W&prime; &minus; &int;(v&minus;CS) dt + reconstitution
            </div>
            <div style={{ fontFamily: C.grotesk, fontSize: '0.78rem', color: C.textMuted, marginTop: 8 }}>
              Real-time W&prime; tracking: when W&prime;BAL = 0, exhaustion is immediate and unavoidable (Skiba 2012).
            </div>
          </div>

          {/* W' cards */}
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {W_PRIME_CARDS.map((card) => (
              <div key={card.num} className="card-base" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 3, background: card.accent }} />
                <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="card-num">{card.num}</div>
                      <h3 style={{ fontFamily: C.grotesk, fontWeight: 700, fontSize: '1rem', color: C.text, margin: '4px 0 0', lineHeight: 1.2 }}>
                        {card.title}
                      </h3>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.7rem', color: card.accent, letterSpacing: '0.1em', marginTop: 3 }}>
                        {card.subtitle}
                      </div>
                    </div>
                    <div style={{
                      background: card.dim,
                      border: `1px solid ${card.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      textAlign: 'center',
                      flexShrink: 0,
                      marginLeft: 12,
                    }}>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.85rem', fontWeight: 700, color: card.accent, whiteSpace: 'nowrap' }}>
                        {card.stat}
                      </div>
                      <div style={{ fontFamily: C.grotesk, fontSize: '0.6rem', color: C.textMuted, marginTop: 2, whiteSpace: 'nowrap' }}>
                        {card.statLabel}
                      </div>
                    </div>
                  </div>

                  <p className="body-text">{card.body}</p>

                  {/* Formula for card 02 */}
                  {'formula' in card && card.formula && (
                    <div className="formula-block amber" style={{ fontSize: '0.85rem', padding: '10px 14px' }}>
                      {card.formula}
                    </div>
                  )}

                  {/* Types table for card 04 */}
                  {'types' in card && card.types && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {card.types.map((t) => (
                        <div key={t.type} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: `${t.color}08`,
                          border: `1px solid ${t.color}20`,
                          borderRadius: 6, padding: '7px 12px',
                        }}>
                          <span style={{ fontFamily: C.grotesk, fontSize: '0.75rem', color: C.textSub }}>{t.type}</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontFamily: C.inconsolata, fontSize: '0.7rem', fontWeight: 700, color: t.color }}>W&prime; {t.wPrime}</span>
                            <span style={{ fontFamily: C.inconsolata, fontSize: '0.65rem', color: C.textMuted }}>CS: {t.cs}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    {card.citations.map((c) => (
                      <div key={c} className="citation-tag" style={{ lineHeight: 1.6 }}>› {c}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: RACE PACING STRATEGY                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ marginBottom: 40 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Section 03</div>
            <h2 className="section-heading">
              Race Pacing{' '}
              <span style={{ color: C.red }}>Strategy</span>
            </h2>
            <p className="body-text" style={{ marginTop: 10, maxWidth: 560 }}>
              How to use CS on race day. Every distance has a unique relationship with CS and W&prime;.
            </p>
          </div>

          {/* Race distance cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            {RACE_STRATEGIES.map((race) => (
              <div key={race.distance} className="card-base" style={{ display: 'flex', overflow: 'hidden' }}>
                {/* Left accent strip */}
                <div style={{ width: 4, background: race.accent, flexShrink: 0 }} />

                {/* Distance label */}
                <div style={{
                  padding: '24px 20px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  borderRight: `1px solid ${C.border}`,
                  minWidth: 80, flexShrink: 0,
                }}>
                  <span style={{ fontFamily: C.syncopate, fontSize: '1rem', fontWeight: 700, color: race.accent, letterSpacing: '0.08em' }}>
                    {race.distance}
                  </span>
                  <span className="stat-pill" style={{
                    background: race.dim, color: race.accent,
                    border: `1px solid ${race.border}`,
                    marginTop: 8, fontSize: '0.58rem',
                  }}>
                    {race.zone}
                  </span>
                </div>

                {/* Main content */}
                <div style={{ padding: '20px 22px', flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                    <div style={{ background: race.dim, border: `1px solid ${race.border}`, borderRadius: 6, padding: '5px 12px' }}>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.62rem', color: C.textMuted, letterSpacing: '0.1em' }}>TARGET PACE</div>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.9rem', fontWeight: 700, color: race.accent }}>{race.target}</div>
                    </div>
                    <div style={{ background: C.amberDim, border: `1px solid ${C.amberBorder}`, borderRadius: 6, padding: '5px 12px' }}>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.62rem', color: C.textMuted, letterSpacing: '0.1em' }}>W&prime; SPEND</div>
                      <div style={{ fontFamily: C.inconsolata, fontSize: '0.9rem', fontWeight: 700, color: C.amber }}>{race.wSpend}</div>
                    </div>
                  </div>
                  <p className="body-text" style={{ marginBottom: 8 }}>{race.strategy}</p>
                  <div style={{
                    background: `${C.red}08`, border: `1px solid ${C.red}20`,
                    borderRadius: 6, padding: '8px 12px',
                  }}>
                    <span style={{ fontFamily: C.inconsolata, fontSize: '0.65rem', fontWeight: 700, color: C.red, letterSpacing: '0.1em' }}>COMMON MISTAKE → </span>
                    <span style={{ fontFamily: C.grotesk, fontSize: '0.78rem', color: C.textSub }}>{race.mistake}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Training Protocols */}
          <div style={{ marginBottom: 12 }}>
            <span className="section-label" style={{ color: C.teal }}>Training Protocols (Billat 1999)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {TRAINING_PROTOCOLS.map((proto) => (
              <div key={proto.name} className="card-base" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 3, background: proto.accent }} />
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h4 style={{ fontFamily: C.grotesk, fontWeight: 700, fontSize: '0.88rem', color: C.text, margin: 0 }}>{proto.name}</h4>
                    <span className="stat-pill" style={{ background: proto.dim, color: proto.accent, border: `1px solid ${proto.border}`, fontSize: '0.6rem' }}>
                      {proto.target}
                    </span>
                  </div>
                  <div className="formula-block" style={{
                    fontSize: '0.8rem', padding: '8px 12px',
                    borderLeftColor: proto.accent, color: proto.accent,
                    borderColor: proto.border,
                    marginBottom: 10,
                  }}>
                    {proto.protocol}{'\n'}{proto.recovery}
                  </div>
                  <p style={{ fontFamily: C.grotesk, fontSize: '0.76rem', color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
                    {proto.mechanism}
                  </p>
                  <div className="citation-tag" style={{ marginTop: 8 }}>› {proto.citation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: ESTIMATION & WEARABLES                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 64, paddingBottom: 64, background: 'linear-gradient(180deg, transparent, rgba(0,212,200,0.025) 50%, transparent)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ marginBottom: 40 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Section 04</div>
            <h2 className="section-heading">
              Estimation &amp;{' '}
              <span style={{ color: C.teal }}>Wearables</span>
            </h2>
            <p className="body-text" style={{ marginTop: 10, maxWidth: 560 }}>
              Finding your CS without a lab. Field accuracy within 3–5% of lab MLSS using two time trials.
            </p>
          </div>

          {/* Field estimation formula block */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.tealBorder}`,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 32,
          }}>
            <div style={{ height: 3, background: `linear-gradient(to right, ${C.teal}, ${C.tealSoft})` }} />
            <div style={{ padding: '24px 26px' }}>
              <div style={{ fontFamily: C.syncopate, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', color: C.teal, marginBottom: 18 }}>
                FIELD ESTIMATION PROTOCOL · MORTON 1996
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { step: '01', label: 'Two maximal efforts', formula: 'Record d\u2081, t\u2081  (e.g. 1500m all-out)\nRecord d\u2082, t\u2082  (e.g. 5000m all-out)' },
                  { step: '02', label: 'Calculate Critical Speed', formula: 'CS = (d\u2082 \u2212 d\u2081) / (t\u2082 \u2212 t\u2081)' },
                  { step: '03', label: "Calculate W' (D prime)", formula: "D\u2032 = d\u2081 \u2212 (CS \u00d7 t\u2081)" },
                ].map(({ step, label, formula }) => (
                  <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      fontFamily: C.syncopate, fontSize: '0.6rem', fontWeight: 700,
                      color: C.teal, minWidth: 24, paddingTop: 3, letterSpacing: '0.1em',
                    }}>
                      {step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: C.grotesk, fontSize: '0.78rem', color: C.textSub, marginBottom: 6 }}>{label}</div>
                      <div className="formula-block" style={{ fontSize: '0.88rem', padding: '10px 14px' }}>{formula}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: C.tealDim, border: `1px solid ${C.tealBorder}`,
                borderRadius: 6,
              }}>
                <span style={{ fontFamily: C.inconsolata, fontSize: '0.72rem', fontWeight: 700, color: C.teal }}>ACCURACY: </span>
                <span style={{ fontFamily: C.grotesk, fontSize: '0.78rem', color: C.textSub }}>
                  Field CS within 3–5% of lab MLSS in trained runners (Morton 1996). No lab, no blood draws, no equipment beyond a GPS watch.
                </span>
              </div>
            </div>
          </div>

          {/* Wearable cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {ESTIMATION_CARDS.map((card) => (
              <div key={card.device} className="card-base" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 3, background: card.accent }} />
                <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h4 style={{ fontFamily: C.grotesk, fontWeight: 700, fontSize: '0.88rem', color: C.text, margin: 0 }}>{card.device}</h4>
                    <div style={{
                      background: `${card.accent}15`,
                      border: `1px solid ${card.border}`,
                      borderRadius: 5, padding: '3px 9px',
                      fontFamily: C.inconsolata, fontSize: '0.72rem', fontWeight: 700, color: card.accent,
                      whiteSpace: 'nowrap',
                    }}>
                      {card.accuracy}
                    </div>
                  </div>
                  <p className="body-text" style={{ flex: 1 }}>{card.tip}</p>
                  <div className="citation-tag" style={{ marginTop: 10 }}>› {card.citation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KEY PRINCIPLES SUMMARY                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <div className="card-base" style={{ padding: '28px 28px 24px' }}>
            <div style={{ fontFamily: C.syncopate, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', color: C.textMuted, marginBottom: 20 }}>
              KEY PRINCIPLES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { text: 'CS — not VO\u2082max — is the strongest predictor of endurance performance across all distances from 1500m to marathon.', accent: C.teal },
                { text: 'W\u2032 depletion is the universal mechanism of exhaustion above CS. Speed, not fitness, determines depletion rate: every (v \u2212 CS) m/s.', accent: C.amber },
                { text: 'At CS, mitochondrial oxidative flux is maximal. Above CS, glycolysis is recruited \u2014 progressive lactate accumulation is inevitable.', accent: C.teal },
                { text: '6 weeks of CS-targeted training improves CS by ~6.2% and W\u2032 by ~13%. Each 1% CS gain \u2248 45 seconds on a 5K for trained runners.', accent: C.red },
                { text: 'W\u2032 reconstitution requires 6\u20137 minutes for 95% recovery. Strategic race pacing exploits this: conserve early, surge when W\u2032 is full.', accent: C.amber },
                { text: 'Field CS estimation (two time trials) achieves 3\u20135% accuracy vs lab MLSS \u2014 sufficient precision for training zone targeting.', accent: C.teal },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: C.inconsolata, fontSize: '0.65rem', fontWeight: 900,
                    color: p.accent, flexShrink: 0, marginTop: 4, letterSpacing: '0.1em',
                    minWidth: 22,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="body-text" style={{ margin: 0 }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER CITATIONS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, paddingTop: 36, paddingBottom: 64 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontFamily: C.syncopate, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.22em', color: C.textMuted, marginBottom: 16 }}>
            PRIMARY REFERENCES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {CITATIONS.map((ref, i) => (
              <p key={i} style={{
                fontFamily: C.inconsolata, fontSize: '0.68rem', color: C.textMuted,
                margin: 0, lineHeight: 1.6, paddingLeft: 16, position: 'relative',
              }}>
                <span style={{ position: 'absolute', left: 0, color: `${C.teal}50`, fontWeight: 700 }}>›</span>
                {ref}
              </p>
            ))}
          </div>

          <div style={{
            marginTop: 28, padding: '14px 18px',
            background: C.tealDim, border: `1px solid ${C.tealBorder}`,
            borderRadius: 8,
          }}>
            <p style={{ fontFamily: C.grotesk, fontSize: '0.75rem', color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: C.teal, fontFamily: C.inconsolata }}>DISCLAIMER</strong> &nbsp;
              This page is for educational purposes. CS and W&prime; values are population-level estimates.
              Individual physiology varies. Consult a sports physiologist for personalised threshold testing.
              References cited represent the primary evidence base as of early 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
