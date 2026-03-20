// Aerobic Decoupling Science — static server component
// Evidence-based guide: Pa:HR physiology, MAF method, environmental modifiers,
// measurement protocols — "Signal vs Drift" precision endurance science aesthetic.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Aerobic Decoupling Science' }

// ─── Color tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:       '#080b14',
  surface:  '#0f1420',
  teal:     '#00e5cc',
  coral:    '#ff6b6b',
  amber:    '#ffc107',
  orange:   '#ff9800',
  border:   'rgba(255,255,255,0.06)',
  muted:    '#3a4260',
  text:     '#c8d4e8',
  textDim:  '#556080',
  textFaint:'#2e3a55',
}

// ─── Decoupling scale zones ────────────────────────────────────────────────────

const SCALE_ZONES = [
  { label: 'Excellent', range: '0–5%',  color: C.teal,   pct: 25,  desc: 'Aerobic base built (Maffetone threshold)' },
  { label: 'Good',      range: '5–8%',  color: '#7fffde', pct: 15,  desc: 'Base developing, extend long runs' },
  { label: 'Moderate',  range: '8–10%', color: C.amber,  pct: 10,  desc: 'More Zone 1 volume needed' },
  { label: 'High',      range: '10–15%',color: C.orange, pct: 25,  desc: 'Aerobic deficiency present' },
  { label: 'Severe',    range: '15%+',  color: C.coral,  pct: 25,  desc: 'Rest, illness, or overtraining signal' },
]

// ─── Hero stats ───────────────────────────────────────────────────────────────

const HERO_STATS = [
  {
    value:   '<5%',
    label:   'Maffetone Threshold',
    detail:  'Decoupling below 5% at MAF HR = aerobic base built (Maffetone 1996)',
    accent:  C.teal,
  },
  {
    value:   '8 bpm',
    label:   'Dehydration HR Drift',
    detail:  'Just 2% body-weight loss causes +8 bpm HR drift (Fritzsche 1999)',
    accent:  C.amber,
  },
  {
    value:   '80%',
    label:   'Elite Zone 1 Volume',
    detail:  'Of elite training done at Zone 1 — the decoupling-resistant base (Seiler 2010)',
    accent:  C.coral,
  },
]

// ─── Mechanism cards ───────────────────────────────────────────────────────────

const MECHANISM_CARDS = [
  {
    id:      'causes',
    title:   'What Causes HR Drift',
    accent:  C.teal,
    accentBg: 'rgba(0,229,204,0.06)',
    accentBorder: 'rgba(0,229,204,0.18)',
    accentPill:   'rgba(0,229,204,0.12)',
    symbol:  '∿',
    findings: [
      {
        citation: 'Coyle & González-Alonso 1992 — Journal of Applied Physiology',
        detail:   'The Pa:HR (Pace-to-HR) ratio quantifies aerobic coupling. When aerobic fitness is adequate the ratio stays stable across a run — pace remains constant while HR stays flat. Cardiovascular drift is the progressive HR rise at constant effort caused by three simultaneous mechanisms: (1) plasma volume shift from blood to working muscles reduces circulating volume, (2) stroke volume drops as filling pressure falls, and (3) the heart compensates by beating faster to maintain cardiac output — raising HR without any increase in actual workload.',
        stat:     'Pa:HR = constant at fixed effort in a fit aerobic base; drift = falling stroke volume',
      },
      {
        citation: 'González-Alonso 1998 — Journal of Physiology (thermoregulation)',
        detail:   'Thermoregulatory competition is the second driver: skin blood flow increases to dissipate core heat, directly competing with working-muscle blood flow. The body essentially "robs" the muscles to keep core temperature below 40°C. A third mechanism — muscle fatigue leading to declining mechanical efficiency — forces the aerobic system to work harder per unit of output, further elevating HR at unchanged pace. All three mechanisms compound over run duration.',
        stat:     'Skin blood flow vs working muscle blood flow competition: +5–10 bpm at >25°C',
      },
    ],
  },
  {
    id:      'trained',
    title:   'Why Trained Athletes Decouple Less',
    accent:  '#7fffde',
    accentBg: 'rgba(127,255,222,0.05)',
    accentBorder: 'rgba(127,255,222,0.15)',
    accentPill:   'rgba(127,255,222,0.10)',
    symbol:  '↑',
    findings: [
      {
        citation: 'Convertino 1991 — Medicine & Science in Sports & Exercise (plasma volume)',
        detail:   'Endurance training expands plasma volume by 20–25% versus sedentary individuals — directly combating the plasma shift that triggers drift. Superior stroke volume (trained heart: 130–170 mL/beat vs sedentary: 70–90 mL/beat) means the heart can maintain cardiac output with less compensatory HR increase. Greater mitochondrial density and superior fat oxidation capacity reduce glycolytic demand and muscle fatigue at any given submaximal pace.',
        stat:     '+20–25% plasma volume in trained; stroke volume: 130–170 mL/beat (trained) vs 70–90 mL/beat (sedentary)',
      },
      {
        citation: 'Real-world benchmarks — Maffetone 1996 / Esteve-Lanao 2007',
        detail:   'Elite marathoners running at easy effort for 90 minutes show decoupling <3% — their aerobic systems are so efficient that pace-to-HR ratio barely moves. Recreational runners with underdeveloped aerobic bases show 10–15% decoupling over the same duration at comparable relative intensity. This gap closes with structured low-intensity base building: 16–24 weeks of consistent Zone 1 work brings recreational runners to <5% in long easy runs.',
        stat:     'Elite: <3% decoupling at 90-min easy; recreational: 10–15% — gap closes with base training',
      },
    ],
  },
  {
    id:      'interpret',
    title:   'Interpreting Your Numbers',
    accent:  C.amber,
    accentBg: 'rgba(255,193,7,0.06)',
    accentBorder: 'rgba(255,193,7,0.18)',
    accentPill:   'rgba(255,193,7,0.12)',
    symbol:  '◈',
    findings: [
      {
        citation: 'Environmental Adjustments — Ely 2007 (Med Sci Sports Exerc)',
        detail:   'Decoupling thresholds require environmental context. Temperate baseline (<18°C): apply the 0–5% / 5–8% / 8–10%+ scale directly. In heat (>25°C): add 3–5% to expected acceptable decoupling — a reading of 8% that would be concerning in cool conditions may be appropriate in high heat and humidity. First week of heat exposure always worsens decoupling temporarily before heat acclimatisation improves plasma volume and thermoregulatory efficiency.',
        stat:     'Heat >25°C: add 3–5% tolerance to thresholds; first-week heat decoupling is expected, not alarming',
      },
      {
        citation: 'Practical decision framework',
        detail:   'Consistent <5% in 60+ minute runs at MAF HR = cleared for longer efforts and race-specific training. Consistent 5–10% = extend low-intensity base volume, limit lactate-threshold work. Consistent >10% = prioritise Zone 1 exclusively for 6–8 weeks before reassessing. Single-run spikes (poor sleep, illness, travel, heat) should not change training philosophy — track 4-run rolling averages rather than individual readings.',
        stat:     '>10% consistent = Zone 1 only for 6–8 weeks; use 4-run rolling averages, not single readings',
      },
    ],
  },
  {
    id:      'vo2max',
    title:   'Decoupling vs VO₂max — Two Different Questions',
    accent:  C.coral,
    accentBg: 'rgba(255,107,107,0.06)',
    accentBorder: 'rgba(255,107,107,0.18)',
    accentPill:   'rgba(255,107,107,0.12)',
    symbol:  '⋈',
    findings: [
      {
        citation: 'Bassett & Howley 2000 — Medicine & Science in Sports & Exercise',
        detail:   'VO₂max is an aerobic ceiling — the maximum oxygen your cardiovascular system can deliver and muscles can extract. It is determined by genetics (~40–50%), cardiac output, and arteriovenous oxygen difference. Aerobic decoupling is fundamentally different: it is a training indicator revealing how efficiently and durably you operate below that ceiling. Two runners with identical VO₂max scores (say, 55 mL/kg/min) can have completely different race performances if one shows <3% decoupling (indicating high aerobic base) and the other shows 12% (aerobic deficiency).',
        stat:     'VO₂max = aerobic ceiling (genetics ~40–50%); decoupling = how efficiently you use that ceiling',
      },
      {
        citation: 'Practical implications for training',
        detail:   'In the base-building phase, decoupling improvement is the primary target — not VO₂max gains. Only once decoupling is consistently <5% at race duration should an athlete introduce significant lactate-threshold or VO₂max-specific work. VO₂max predicts what pace you can theoretically sustain; aerobic decoupling predicts whether you will sustain that pace evenly from start to finish. Race-day decoupling <5% in long training runs is the strongest predictor of even-split race execution.',
        stat:     'Base phase target: decoupling <5% first; VO₂max work comes after aerobic base is established',
      },
    ],
  },
]

// ─── Training phase targets ───────────────────────────────────────────────────

const PHASE_TARGETS = [
  { phase: 'Base Phase',  target: '<5%',  context: '60-min run at MAF HR',     color: C.teal,  note: 'Pass = cleared for longer base runs' },
  { phase: 'Build Phase', target: '5–8%', context: 'Longer Zone 2 efforts',    color: C.amber, note: 'Tolerate during structured build blocks' },
  { phase: 'Peak Phase',  target: '<5%',  context: 'Target race effort',        color: '#7fffde', note: 'Should be achievable; confirm fitness' },
  { phase: 'Race Day',    target: '<5%',  context: 'Long training runs (2h+)',  color: C.coral, note: 'Even-split race execution predictor' },
]

// ─── Technology accuracy cards ────────────────────────────────────────────────

const TECH_CARDS = [
  {
    device:   'Apple Watch (Optical PPG)',
    accuracy: '±3–5 bpm',
    icon:     '⌚',
    color:    C.teal,
    note:     'Sufficient for detecting 5–10% decoupling when tracking multi-run trends. Motion artifact is the main limitation at high intensity.',
    verdict:  'Trust trends, not single runs',
  },
  {
    device:   'Chest Strap (Polar H10)',
    accuracy: '±1 bpm',
    icon:     '◎',
    color:    '#7fffde',
    note:     'Reduces total measurement uncertainty to ±2% decoupling — the gold standard for validation runs. ECG-grade accuracy even at high cadence.',
    verdict:  'Best for baseline testing',
  },
  {
    device:   'Stryd Running Power Pod',
    accuracy: 'Po:HR ratio',
    icon:     '⚡',
    color:    C.amber,
    note:     'Eliminates terrain variability — Power-to-HR ratio is more consistent than Pace-to-HR on hilly courses. Better signal on undulating terrain.',
    verdict:  'Ideal for variable terrain',
  },
]

// ─── Environmental factors ────────────────────────────────────────────────────

const ENV_FACTORS = [
  {
    icon:    '🌡',
    title:   'Heat (>25°C)',
    color:   C.coral,
    accentBg: 'rgba(255,107,107,0.07)',
    accentBorder: 'rgba(255,107,107,0.2)',
    points: [
      'Cardiovascular demand +5–10 bpm at same pace in heat',
      'Slow down to maintain MAF HR — adaptations still occur plus heat acclimatisation',
      'Plasma volume: +300–500 mL after 10–14 days heat exposure',
      'First week of heat: decoupling worsens, then improves — this is expected physiology',
    ],
  },
  {
    icon:    '💧',
    title:   'Dehydration',
    color:   C.amber,
    accentBg: 'rgba(255,193,7,0.07)',
    accentBorder: 'rgba(255,193,7,0.2)',
    points: [
      '2% body-weight loss → +8 bpm drift → +3–5% added decoupling (Fritzsche 1999)',
      '4% body-weight loss → catastrophic decoupling (>15%) — performance collapses',
      'Decoupling accelerating mid-run? Drink 400–600 mL/h with 400–600 mg sodium/L',
      'Weigh before and after runs: 1 kg lost ≈ 1 L fluid deficit',
    ],
  },
  {
    icon:    '⛰',
    title:   'Altitude',
    color:   '#9fa8da',
    accentBg: 'rgba(159,168,218,0.07)',
    accentBorder: 'rgba(159,168,218,0.2)',
    points: [
      'Acute altitude (first 48h): plasma contraction → temporary decoupling increase',
      'After 2–3 weeks: EPO adaptations → decoupling returns to baseline or improves',
      'Live-high-train-low: hemoglobin mass +4–6%, decoupling −2–3% at sea level',
      'Do not judge aerobic base from first-week altitude data — it is artificially worse',
    ],
  },
]

// ─── MAF adjustments ──────────────────────────────────────────────────────────

const MAF_ADJUSTMENTS = [
  { symbol: '✓', label: 'Recovering from illness, injury, or major life stress', delta: '−10', active: true,  color: C.coral },
  { symbol: '○', label: 'Training consistently less than 6 months', delta: '−5',  active: false, color: C.amber },
  { symbol: '○', label: 'Training consistently 2+ years, no issues', delta: '+0',  active: false, color: C.textDim },
  { symbol: '★', label: '2+ years consistent, improving, and healthy', delta: '+5',  active: false, color: C.teal },
]

// ─── MAF Progression milestones ──────────────────────────────────────────────

const MAF_PROGRESSION = [
  { month: 'Mo 1',  pace: '8:45/mi', note: 'Base pace at MAF HR',       pct: 15, color: C.coral },
  { month: 'Mo 3',  pace: '8:15/mi', note: '+30 s/mi faster',            pct: 35, color: C.orange },
  { month: 'Mo 6',  pace: '7:30/mi', note: 'Noticeable base progress',  pct: 60, color: C.amber },
  { month: 'Mo 12', pace: '6:45/mi', note: 'Race-ready aerobic base',   pct: 85, color: '#7fffde' },
  { month: 'Mo 24', pace: '6:00/mi', note: 'Elite aerobic efficiency',  pct: 100, color: C.teal },
]

// ─── Citation list ─────────────────────────────────────────────────────────────

const CITATIONS = [
  'Maffetone P (1996). Training for Endurance. David Barmore Productions. [180 Formula]',
  'Seiler S (2010). What is best practice for training intensity and duration distribution? Scand J Med Sci Sports.',
  'Coyle EF & González-Alonso J (1992). Cardiovascular drift during prolonged exercise. J Appl Physiol.',
  'Fritzsche RG et al (1999). Water and carbohydrate ingestion during prolonged exercise. J Appl Physiol.',
  'Bassett DR & Howley ET (2000). Limiting factors for maximum oxygen uptake. Med Sci Sports Exerc.',
  'Convertino VA (1991). Blood volume: its adaptation to endurance training. Med Sci Sports Exerc.',
  'González-Alonso J et al (1998). Dehydration markedly impairs cardiovascular function. J Physiol.',
  'Plews DJ et al (2014). Training adaptation and HRV in elite endurance athletes. IJSPP.',
  'Urhausen A & Kindermann W (2002). Diagnosis of overtraining. Sports Medicine.',
  'Ely MR et al (2007). Impact of weather on marathon-running performance. Med Sci Sports Exerc.',
  'Esteve-Lanao J et al (2007). Running-specific muscle mechanical power output. IJSPP.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroStat({ value, label, detail, accent }: (typeof HERO_STATS)[number]) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 150,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '20px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: `linear-gradient(180deg, ${accent}14 0%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />
      <p
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: accent,
          margin: 0,
          lineHeight: 1,
          fontFamily: "'Fira Code', 'JetBrains Mono', ui-monospace, monospace",
          letterSpacing: '-1px',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#8899bb',
          margin: '10px 0 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 11,
          color: C.textDim,
          margin: 0,
          lineHeight: 1.5,
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: 'italic',
        }}
      >
        {detail}
      </p>
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
    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#556080',
          margin: '0 0 8px',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          fontFamily: "'Fira Code', monospace",
        }}
      >
        {citation}
      </p>
      <p
        style={{
          fontSize: 13,
          color: C.text,
          margin: '0 0 12px',
          lineHeight: 1.7,
          fontFamily: "'Lora', Georgia, serif",
        }}
      >
        {detail}
      </p>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: "'Fira Code', monospace",
          background: `${accent}12`,
          border: `1px solid ${accent}28`,
          borderRadius: 6,
          padding: '5px 12px',
          display: 'inline-block',
          lineHeight: 1.45,
        }}
      >
        {stat}
      </p>
    </div>
  )
}

function MechanismCard({
  symbol,
  title,
  accent,
  accentBg,
  accentBorder,
  accentPill,
  findings,
}: (typeof MECHANISM_CARDS)[number]) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${accentBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: accentPill,
            border: `1px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: accent,
              fontFamily: "'Fira Code', monospace",
              lineHeight: 1,
            }}
          >
            {symbol}
          </span>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#e8f0ff',
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {title}
        </h2>
      </div>
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

// ─── Hero SVG: Animated Pace vs HR Drift ─────────────────────────────────────

function DriftAnimationSVG() {
  const W = 600
  const H = 180
  const PAD = { t: 20, r: 20, b: 40, l: 44 }
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b

  // Pace line: flat at y=0.3 of plotH (top area = fast pace)
  const paceY = PAD.t + plotH * 0.28
  const pacePath = `M${PAD.l},${paceY} L${PAD.l + plotW},${paceY}`

  // HR line: starts at same y, curves up to 0.75 of plotH
  const hrStartY = paceY
  const hrEndY   = PAD.t + plotH * 0.82
  // Cubic bezier: starts flat, curves up in the second half
  const hrPath = `M${PAD.l},${hrStartY} C${PAD.l + plotW * 0.45},${hrStartY} ${PAD.l + plotW * 0.55},${hrEndY} ${PAD.l + plotW},${hrEndY}`

  // Divergence fill area (between the two lines)
  const fillPath = `M${PAD.l},${paceY} L${PAD.l + plotW},${paceY} C${PAD.l + plotW * 0.55 + plotW * 0.45},${hrEndY} ${PAD.l + plotW * 0.55},${hrEndY} ${PAD.l + plotW * 0.45},${hrStartY} Z`
  const fillPathFull = `M${PAD.l},${paceY} L${PAD.l + plotW},${paceY} L${PAD.l + plotW},${hrEndY} C${PAD.l + plotW * 0.55},${hrEndY} ${PAD.l + plotW * 0.45},${hrStartY} ${PAD.l},${paceY} Z`

  // X-axis tick positions (time marks)
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0]
  const xLabels = ['0', '15', '30', '45', '60 min']

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: 200 }}
      aria-label="Pace vs HR drift animation — pace stays flat, HR curves upward over time"
    >
      <defs>
        {/* Divergence fill gradient */}
        <linearGradient id="drift-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={C.coral} stopOpacity="0" />
          <stop offset="50%"  stopColor={C.coral} stopOpacity="0.06" />
          <stop offset="100%" stopColor={C.coral} stopOpacity="0.18" />
        </linearGradient>

        {/* Pace line gradient */}
        <linearGradient id="pace-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={C.teal} stopOpacity="0.6" />
          <stop offset="100%" stopColor={C.teal} stopOpacity="1" />
        </linearGradient>

        {/* HR line gradient */}
        <linearGradient id="hr-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={C.teal}  stopOpacity="0.5" />
          <stop offset="50%"  stopColor={C.amber} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.coral} stopOpacity="1" />
        </linearGradient>

        {/* Glow filter for lines */}
        <filter id="line-glow" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip path for animate-in */}
        <clipPath id="reveal-clip">
          <rect x={PAD.l} y="0" width={plotW} height={H}>
            <animate
              attributeName="width"
              from="0"
              to={plotW}
              dur="2.4s"
              begin="0.3s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
          </rect>
        </clipPath>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const y = PAD.t + plotH * frac
        return (
          <line
            key={frac}
            x1={PAD.l}
            y1={y}
            x2={PAD.l + plotW}
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        )
      })}

      {/* X-axis */}
      <line
        x1={PAD.l}
        y1={PAD.t + plotH}
        x2={PAD.l + plotW}
        y2={PAD.t + plotH}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* X labels */}
      {xTicks.map((frac, i) => (
        <text
          key={frac}
          x={PAD.l + plotW * frac}
          y={H - 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          fontSize="9"
          fontFamily="'Fira Code', monospace"
        >
          {xLabels[i]}
        </text>
      ))}

      {/* Y-axis labels */}
      <text x={PAD.l - 6} y={paceY + 4} textAnchor="end" fill={C.teal} fontSize="9" fontFamily="'Fira Code', monospace" opacity="0.8">
        Pace
      </text>
      <text x={PAD.l - 6} y={hrEndY + 4} textAnchor="end" fill={C.coral} fontSize="9" fontFamily="'Fira Code', monospace" opacity="0.8">
        HR
      </text>

      {/* Divergence fill (clips to reveal animation) */}
      <g clipPath="url(#reveal-clip)">
        <path
          d={fillPathFull}
          fill="url(#drift-fill)"
        />
      </g>

      {/* "DECOUPLING ZONE" label — mid-right */}
      <g opacity="0">
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.5s"
          begin="2s"
          fill="freeze"
        />
        <text
          x={PAD.l + plotW * 0.75}
          y={(paceY + hrEndY) / 2 + 4}
          textAnchor="middle"
          fill={C.coral}
          fontSize="9"
          fontFamily="'Fira Code', monospace"
          opacity="0.7"
          letterSpacing="1.5"
        >
          DECOUPLING ZONE
        </text>
      </g>

      {/* Pace line (flat — teal) */}
      <g clipPath="url(#reveal-clip)">
        <path
          d={pacePath}
          fill="none"
          stroke="url(#pace-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#line-glow)"
        />
      </g>

      {/* HR line (curved upward — teal → coral) */}
      <g clipPath="url(#reveal-clip)">
        <path
          d={hrPath}
          fill="none"
          stroke="url(#hr-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#line-glow)"
        />
      </g>

      {/* End-point dots */}
      <g opacity="0">
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.4s"
          begin="2.5s"
          fill="freeze"
        />
        {/* Pace end dot */}
        <circle cx={PAD.l + plotW} cy={paceY} r="4" fill={C.teal} opacity="0.9" />
        <circle cx={PAD.l + plotW} cy={paceY} r="8" fill={C.teal} opacity="0.15" />
        {/* HR end dot */}
        <circle cx={PAD.l + plotW} cy={hrEndY} r="4" fill={C.coral} opacity="0.9" />
        <circle cx={PAD.l + plotW} cy={hrEndY} r="8" fill={C.coral} opacity="0.15" />
      </g>

      {/* Legend */}
      <g>
        <circle cx={PAD.l + 8}  cy={H - 18} r="4" fill={C.teal} opacity="0.9" />
        <text x={PAD.l + 16} y={H - 14} fill={C.teal}  fontSize="9" fontFamily="'Fira Code', monospace" opacity="0.8">Pace (stable)</text>
        <circle cx={PAD.l + 100} cy={H - 18} r="4" fill={C.coral} opacity="0.9" />
        <text x={PAD.l + 108} y={H - 14} fill={C.coral} fontSize="9" fontFamily="'Fira Code', monospace" opacity="0.8">Heart Rate (drifting)</text>
      </g>
    </svg>
  )
}

// ─── Decoupling scale bar ──────────────────────────────────────────────────────

function DecouplingScaleBar() {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 28,
      }}
    >
      <div
        style={{
          background: `rgba(0,229,204,0.05)`,
          borderBottom: `1px solid rgba(0,229,204,0.15)`,
          borderLeft: `3px solid ${C.teal}`,
          padding: '14px 20px',
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Aerobic Decoupling Scale
        </h2>
        <p style={{ fontSize: 11, color: C.textDim, margin: '3px 0 0', fontFamily: "'Fira Code', monospace" }}>
          Pa:HR ratio stability over a long run — temperate conditions baseline
        </p>
      </div>

      <div style={{ padding: '20px 20px 24px' }}>
        {/* Bar */}
        <div style={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
          {SCALE_ZONES.map((zone) => (
            <div
              key={zone.label}
              style={{
                flex: zone.pct,
                background: `${zone.color}55`,
                borderRight: `1px solid ${C.bg}`,
                position: 'relative',
              }}
            />
          ))}
        </div>

        {/* Color fill bar underneath */}
        <div style={{ display: 'flex', height: 6, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          {SCALE_ZONES.map((zone) => (
            <div key={zone.label} style={{ flex: zone.pct, background: zone.color }} />
          ))}
        </div>

        {/* Zone labels */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SCALE_ZONES.map((zone) => (
            <div
              key={zone.label}
              style={{
                flex: '1 1 140px',
                background: `${zone.color}0d`,
                border: `1px solid ${zone.color}28`,
                borderTop: `2px solid ${zone.color}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: zone.color,
                  margin: 0,
                  fontFamily: "'Fira Code', monospace",
                }}
              >
                {zone.range}
              </p>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#e8f0ff',
                  margin: '3px 0 3px',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {zone.label}
              </p>
              <p style={{ fontSize: 10, color: C.textDim, margin: 0, lineHeight: 1.4, fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                {zone.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAF HR Calculator ────────────────────────────────────────────────────────

function MAFCalculatorWidget() {
  const exampleAge = 35
  const baseMAF = 180 - exampleAge

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid rgba(0,229,204,0.18)`,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(0,229,204,0.07)',
          borderBottom: 'rgba(0,229,204,0.15)',
          borderLeft: `3px solid ${C.teal}`,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            MAF HR Calculator
          </h3>
          <p style={{ fontSize: 11, color: C.textDim, margin: '3px 0 0', fontFamily: "'Fira Code', monospace" }}>
            Maffetone 180 Formula — aerobic training ceiling
          </p>
        </div>

        {/* Formula display */}
        <div
          style={{
            background: 'rgba(0,229,204,0.1)',
            border: `1px solid rgba(0,229,204,0.25)`,
            borderRadius: 10,
            padding: '10px 18px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.teal,
              margin: 0,
              fontFamily: "'Fira Code', monospace",
              letterSpacing: '-0.5px',
            }}
          >
            180 − age
          </p>
          <p style={{ fontSize: 10, color: C.textDim, margin: '4px 0 0', fontFamily: "'Fira Code', monospace" }}>
            base MAF HR (bpm)
          </p>
        </div>
      </div>

      {/* Example calculation */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textDim, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: "'Fira Code', monospace" }}>
          Example: Age 35
        </p>
        <div
          style={{
            background: '#060911',
            border: `1px solid rgba(0,229,204,0.1)`,
            borderRadius: 8,
            padding: '14px 16px',
            fontFamily: "'Fira Code', monospace",
          }}
        >
          <p style={{ fontSize: 13, color: C.textDim, margin: '0 0 4px' }}>
            <span style={{ color: '#556080' }}>// Base calculation</span>
          </p>
          <p style={{ fontSize: 14, color: '#e8f0ff', margin: '0 0 8px' }}>
            180 − 35 = <span style={{ color: C.teal, fontWeight: 700 }}>{baseMAF} bpm</span>
          </p>
          <p style={{ fontSize: 12, color: C.textDim, margin: 0, opacity: 0.7 }}>
            Train at or below {baseMAF} bpm for fully aerobic fat-burning sessions
          </p>
        </div>
      </div>

      {/* Adjustments */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textDim, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: "'Fira Code', monospace" }}>
          Adjustments (apply the single most relevant)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MAF_ADJUSTMENTS.map((adj) => (
            <div
              key={adj.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: adj.active ? `${adj.color}0d` : 'transparent',
                border: `1px solid ${adj.active ? adj.color + '28' : C.border}`,
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 14, color: adj.color, fontFamily: "'Fira Code', monospace", flexShrink: 0, width: 16 }}>
                {adj.symbol}
              </span>
              <p style={{ fontSize: 12, color: adj.active ? C.text : C.textDim, margin: 0, flex: 1, fontFamily: "'Lora', serif" }}>
                {adj.label}
              </p>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: adj.color,
                  fontFamily: "'Fira Code', monospace",
                  background: `${adj.color}14`,
                  border: `1px solid ${adj.color}25`,
                  borderRadius: 6,
                  padding: '2px 10px',
                  flexShrink: 0,
                }}
              >
                {adj.delta}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.textFaint, margin: '14px 0 0', lineHeight: 1.5, fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
          Mark Allen example: followed MAF method for 2 years, pace at MAF HR improved from 8:00/mile → 5:20/mile — same heart rate, dramatically faster.
        </p>
      </div>
    </div>
  )
}

// ─── Overtraining Detection ────────────────────────────────────────────────────

function OvertTrainingAlert() {
  return (
    <div
      style={{
        background: 'rgba(255,107,107,0.06)',
        border: `1px solid rgba(255,107,107,0.2)`,
        borderLeft: `3px solid ${C.coral}`,
        borderRadius: 12,
        padding: '16px 20px',
        marginTop: 20,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.coral,
          margin: '0 0 8px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: "'Fira Code', monospace",
        }}
      >
        Overtraining Detection — Urhausen 2002 (Sports Medicine)
      </p>
      <p style={{ fontSize: 13, color: C.text, margin: '0 0 10px', lineHeight: 1.65, fontFamily: "'Lora', serif" }}>
        Elevated decoupling + depressed HRV + elevated resting heart rate = strong overtraining signal. If base runs that previously showed 3–4% decoupling now show 8–12%, flag a 3–7 day recovery block immediately — the aerobic system is accumulating unresolved fatigue.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Decoupling ↑ (base runs)', color: C.coral },
          { label: 'HRV ↓ (depressed)', color: C.coral },
          { label: 'Resting HR ↑', color: C.coral },
        ].map(({ label, color }) => (
          <span
            key={label}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color,
              background: `${color}14`,
              border: `1px solid ${color}28`,
              borderRadius: 20,
              padding: '4px 12px',
              fontFamily: "'Fira Code', monospace",
            }}
          >
            {label}
          </span>
        ))}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.amber,
            background: `${C.amber}14`,
            border: `1px solid ${C.amber}28`,
            borderRadius: 20,
            padding: '4px 12px',
            fontFamily: "'Fira Code', monospace",
          }}
        >
          = 3–7 day rest indicated
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AerobicDecouplingSciencePage() {
  return (
    <>
      {/* ── Fonts + global styles ───────────────────────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&family=Fira+Code:wght@400;500;700&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap');

            .adsc-body {
              background-color: #080b14;
              background-image:
                linear-gradient(rgba(0,229,204,0.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,229,204,0.025) 1px, transparent 1px);
              background-size: 40px 40px;
              min-height: 100vh;
              color: #c8d4e8;
            }

            .adsc-header {
              background: rgba(8,11,20,0.92);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              border-bottom: 1px solid rgba(0,229,204,0.1);
            }

            /* Data chip hover expansion */
            .adsc-chip {
              cursor: default;
              transition: all 0.22s ease;
              white-space: nowrap;
            }
            .adsc-chip:hover {
              transform: scale(1.04);
              box-shadow: 0 0 16px rgba(0,229,204,0.15);
            }

            /* Section divider line */
            .adsc-divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(0,229,204,0.18), transparent);
              margin: 32px 0;
            }

            /* Progression bar fill animation */
            @keyframes barGrow {
              from { width: 0%; }
              to   { width: var(--target-width); }
            }
            .adsc-bar-fill {
              animation: barGrow 1.2s cubic-bezier(0.4,0,0.2,1) both;
            }

            /* Section label pulse */
            @keyframes pulse-teal {
              0%, 100% { opacity: 0.6; }
              50%       { opacity: 1; }
            }
            .adsc-section-pulse {
              animation: pulse-teal 3s ease-in-out infinite;
            }
          `,
        }}
      />

      <div className="adsc-body">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <header className="adsc-header sticky top-0 z-50">
          <div
            style={{
              maxWidth: 860,
              margin: '0 auto',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Link
              href="/aerobic-decoupling"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 8,
                color: 'rgba(200,212,232,0.5)',
                textDecoration: 'none',
                fontSize: 12,
                fontFamily: "'Fira Code', monospace",
                transition: 'color 0.2s',
              }}
              aria-label="Back to Aerobic Decoupling"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              back
            </Link>

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#e8f0ff',
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.3px',
                }}
              >
                Aerobic Decoupling Science
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: C.textDim,
                  margin: 0,
                  fontFamily: "'Fira Code', monospace",
                  letterSpacing: '0.5px',
                }}
              >
                Signal vs Drift · Evidence-based endurance physiology
              </p>
            </div>

            {/* Teal data badge */}
            <div
              style={{
                background: 'rgba(0,229,204,0.1)',
                border: '1px solid rgba(0,229,204,0.2)',
                borderRadius: 20,
                padding: '4px 12px',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.teal,
                  fontFamily: "'Fira Code', monospace",
                  letterSpacing: '0.6px',
                }}
                className="adsc-section-pulse"
              >
                PA:HR ANALYSIS
              </span>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 96px' }}>

          {/* ── HERO ──────────────────────────────────────────────────────────── */}
          <section style={{ marginBottom: 40 }}>

            {/* Title block */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.teal,
                    fontFamily: "'Fira Code', monospace",
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    opacity: 0.8,
                  }}
                >
                  Maffetone · Coyle · Seiler
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,229,204,0.15)' }} />
              </div>

              <h1
                style={{
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  fontWeight: 900,
                  color: '#f0f6ff',
                  margin: '0 0 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-1.5px',
                  lineHeight: 1.05,
                }}
              >
                Aerobic Decoupling
              </h1>

              <p
                style={{
                  fontSize: 'clamp(14px, 2vw, 17px)',
                  color: '#7a8eaa',
                  margin: 0,
                  fontFamily: "'Lora', Georgia, serif",
                  lineHeight: 1.65,
                  maxWidth: 580,
                  fontStyle: 'italic',
                }}
              >
                The metric that reveals whether your aerobic engine is built or broken — in a single long run.
              </p>
            </div>

            {/* Animated SVG chart */}
            <div
              style={{
                background: C.surface,
                border: `1px solid rgba(0,229,204,0.12)`,
                borderRadius: 16,
                padding: '20px 16px 10px',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background glow */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 60,
                  background: `radial-gradient(ellipse at center, rgba(0,229,204,0.07) 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.textDim,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontFamily: "'Fira Code', monospace",
                  }}
                >
                  60-Minute Easy Run · Pa:HR Drift Visualization
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="adsc-chip" style={{ fontSize: 10, color: C.teal, background: 'rgba(0,229,204,0.1)', border: '1px solid rgba(0,229,204,0.2)', borderRadius: 20, padding: '2px 10px', fontFamily: "'Fira Code', monospace" }}>
                    PACE · stable
                  </span>
                  <span className="adsc-chip" style={{ fontSize: 10, color: C.coral, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 20, padding: '2px 10px', fontFamily: "'Fira Code', monospace" }}>
                    HR · drifting ↑
                  </span>
                </div>
              </div>
              <DriftAnimationSVG />
            </div>

            {/* Hero stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {HERO_STATS.map((stat) => (
                <HeroStat key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          {/* ── SECTION 1: PHYSIOLOGY ─────────────────────────────────────────── */}
          <div className="adsc-divider" />

          <section style={{ marginBottom: 36 }}>
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.teal,
                  margin: '0 0 6px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontFamily: "'Fira Code', monospace",
                }}
              >
                Section 01
              </p>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#e8f0ff',
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.5px',
                }}
              >
                The Physiology
              </h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '6px 0 0', fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                What is decoupling, and what is your body actually measuring?
              </p>
            </div>

            {/* Decoupling scale bar */}
            <DecouplingScaleBar />

            {/* Mechanism cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {MECHANISM_CARDS.map((card) => (
                <MechanismCard key={card.id} {...card} />
              ))}
            </div>
          </section>

          {/* ── SECTION 2: MAF METHOD ────────────────────────────────────────── */}
          <div className="adsc-divider" />

          <section style={{ marginBottom: 36 }}>
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.teal,
                  margin: '0 0 6px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontFamily: "'Fira Code', monospace",
                }}
              >
                Section 02
              </p>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#e8f0ff',
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.5px',
                }}
              >
                The Maffetone Method: Build First
              </h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '6px 0 0', fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                A systematic protocol for building the aerobic base that makes decoupling disappear.
              </p>
            </div>

            {/* MAF calculator */}
            <MAFCalculatorWidget />

            {/* Supporting science */}
            <div
              style={{
                background: C.surface,
                border: `1px solid rgba(0,229,204,0.15)`,
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: 'rgba(0,229,204,0.06)',
                  borderBottom: `1px solid rgba(0,229,204,0.12)`,
                  borderLeft: `3px solid ${C.teal}`,
                  padding: '14px 20px',
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Scientific Foundation
                </h3>
              </div>

              {[
                {
                  citation: 'Maffetone 1996 — 180 Formula Origin',
                  text: 'Below MAF HR = fully aerobic zone: fat oxidation is maximized, lactate remains near resting levels (<2 mmol/L), and the cardiovascular system operates without sympathetic overstimulation. Training predominantly below MAF HR drives mitochondrial biogenesis, capillary density increases, and plasma volume expansion — the three primary adaptations that make aerobic decoupling decrease over time.',
                  chip: 'Lactate <2 mmol/L at MAF HR — fully aerobic zone',
                  color: C.teal,
                },
                {
                  citation: 'MAF Test Protocol — 5-Mile Timed Run',
                  text: 'Standard assessment: run exactly 5 miles (or 8 km) at MAF HR ±5 bpm on a flat course. Record total time and splits. Repeat every 4–6 weeks under consistent conditions. If pace at same HR is increasing: aerobic base is developing correctly. If pace is stalling or worsening: investigate recovery, sleep, training load, or illness. Mark Allen improved from 8:00/mile to 5:20/mile over 2 years using this protocol exclusively as his base-building tool.',
                  chip: 'MAF Test: 5-mile time trial at MAF HR ±5 bpm, repeat every 4–6 weeks',
                  color: C.teal,
                },
                {
                  citation: 'Seiler 2010 — Scandinavian Journal of Medicine & Science in Sports',
                  text: 'Analysis of elite endurance athletes across rowing, cycling, and running confirms 80% of training volume at Zone 1 intensity. Mitochondrial biogenesis in skeletal muscle increases 50–70% density after 6 months of consistent high-volume Zone 1 training. Capillary density around slow-twitch muscle fibers increases 15–20% — directly improving oxygen delivery per unit of muscle tissue and reducing cardiovascular demand per unit of effort.',
                  chip: 'Mitochondrial density +50–70% after 6 months Zone 1; capillary density +15–20%',
                  color: C.teal,
                },
                {
                  citation: 'Plews 2014 — International Journal of Sports Physiology & Performance',
                  text: 'HRV combined with low-intensity volume is the best predictor of aerobic performance improvement across an 8-week training block. HRV-guided low-intensity training (below MAF HR) showed greater aerobic gains than fixed-prescription training. This supports the MAF approach: let physiological readiness (HRV) determine session quality, but maintain consistent Zone 1 volume as the structural foundation.',
                  chip: 'HRV + Zone 1 volume = best predictor of aerobic improvement (r = 0.79)',
                  color: C.teal,
                },
              ].map((item, i) => (
                <div key={i} style={{ padding: '18px 20px', borderBottom: i < 3 ? `1px solid ${C.border}` : undefined }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.textDim, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: "'Fira Code', monospace" }}>
                    {item.citation}
                  </p>
                  <p style={{ fontSize: 13, color: C.text, margin: '0 0 10px', lineHeight: 1.7, fontFamily: "'Lora', serif" }}>
                    {item.text}
                  </p>
                  <span
                    className="adsc-chip"
                    style={{ fontSize: 11, fontWeight: 700, color: item.color, background: `${item.color}12`, border: `1px solid ${item.color}28`, borderRadius: 6, padding: '5px 12px', display: 'inline-block', fontFamily: "'Fira Code', monospace", lineHeight: 1.45 }}
                  >
                    {item.chip}
                  </span>
                </div>
              ))}
            </div>

            {/* Progression timeline */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <div style={{ background: 'rgba(0,229,204,0.05)', borderBottom: `1px solid rgba(0,229,204,0.12)`, borderLeft: `3px solid ${C.teal}`, padding: '14px 20px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  MAF Progression Timeline — Pace at Same HR
                </h3>
                <p style={{ fontSize: 11, color: C.textDim, margin: '3px 0 0', fontFamily: "'Fira Code', monospace" }}>
                  Typical aerobic base development arc — consistent Zone 1 training
                </p>
              </div>
              <div style={{ padding: '20px' }}>
                {MAF_PROGRESSION.map((m, i) => (
                  <div key={m.month} style={{ marginBottom: i < MAF_PROGRESSION.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: m.color, fontFamily: "'Fira Code', monospace", minWidth: 36 }}>
                          {m.month}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e8f0ff', fontFamily: "'Fira Code', monospace" }}>
                          {m.pace}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                        {m.note}
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#060911', borderRadius: 4, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.04)` }}>
                      <div
                        className="adsc-bar-fill"
                        style={{
                          height: '100%',
                          width: `${m.pct}%`,
                          background: `linear-gradient(90deg, ${m.color}44, ${m.color}cc)`,
                          borderRadius: 4,
                          ['--target-width' as string]: `${m.pct}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SECTION 3: ENVIRONMENTAL FACTORS ─────────────────────────────── */}
          <div className="adsc-divider" />

          <section style={{ marginBottom: 36 }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.amber, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Fira Code', monospace" }}>
                Section 03
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.5px' }}>
                When Decoupling Lies (And When It Doesn't)
              </h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '6px 0 0', fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                Environmental context is essential — a high number isn't always alarming.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 0 }}>
              {ENV_FACTORS.map((env) => (
                <div
                  key={env.title}
                  style={{
                    background: env.accentBg,
                    border: `1px solid ${env.accentBorder}`,
                    borderTop: `3px solid ${env.color}`,
                    borderRadius: 14,
                    padding: '18px 18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{env.icon}</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: env.color, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                      {env.title}
                    </h3>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {env.points.map((pt, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: env.color, fontFamily: "'Fira Code', monospace", fontSize: 10, flexShrink: 0, marginTop: 3, opacity: 0.7 }}>
                          ·
                        </span>
                        <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.55, fontFamily: "'Lora', serif" }}>
                          {pt}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <OvertTrainingAlert />
          </section>

          {/* ── SECTION 4: MEASUREMENT ────────────────────────────────────────── */}
          <div className="adsc-divider" />

          <section style={{ marginBottom: 36 }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.coral, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Fira Code', monospace" }}>
                Section 04
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.5px' }}>
                How to Calculate Your Decoupling
              </h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '6px 0 0', fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                The Pa:HR formula — precise, reproducible, and device-agnostic.
              </p>
            </div>

            {/* Formula display */}
            <div
              style={{
                background: '#060911',
                border: `1px solid rgba(0,229,204,0.15)`,
                borderRadius: 14,
                padding: '24px 24px',
                marginBottom: 20,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at center top, rgba(0,229,204,0.06) 0%, transparent 65%)',
                  pointerEvents: 'none',
                }}
              />

              <p
                style={{
                  fontSize: 'clamp(16px, 3vw, 24px)',
                  fontWeight: 700,
                  color: C.teal,
                  margin: '0 0 8px',
                  fontFamily: "'Fira Code', monospace",
                  letterSpacing: '-0.5px',
                  lineHeight: 1.3,
                }}
              >
                Decoupling % = [(Pa:HR₁ − Pa:HR₂) / Pa:HR₁] × 100
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: C.textDim,
                  margin: 0,
                  fontFamily: "'Fira Code', monospace",
                }}
              >
                Where Pa:HR = (Speed in km/h) ÷ Heart Rate (bpm) — computed separately for each run half
              </p>

              {/* Subscript key */}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  { sub: '₁', label: 'First half of run (by distance)', color: C.teal },
                  { sub: '₂', label: 'Second half of run (by distance)', color: C.amber },
                ].map(({ sub, label, color }) => (
                  <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Fira Code', monospace" }}>{sub}</span>
                    <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'Lora', serif" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Worked example */}
            <div
              style={{
                background: '#060911',
                border: `1px solid rgba(255,193,7,0.15)`,
                borderRadius: 14,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <div style={{ background: 'rgba(255,193,7,0.07)', borderBottom: `1px solid rgba(255,193,7,0.12)`, padding: '12px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.amber, margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: "'Fira Code', monospace" }}>
                  Worked Example — 60-Min Run
                </p>
              </div>
              <div style={{ padding: '18px 20px', fontFamily: "'Fira Code', monospace" }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
                  {[
                    {
                      label: 'First Half (0–30 min)',
                      speed: '12.0 km/h',
                      hr: '140 bpm',
                      pahr: '0.0857',
                      color: C.teal,
                    },
                    {
                      label: 'Second Half (30–60 min)',
                      speed: '11.6 km/h',
                      hr: '148 bpm',
                      pahr: '0.0784',
                      color: C.amber,
                    },
                  ].map((half) => (
                    <div
                      key={half.label}
                      style={{
                        background: `${half.color}08`,
                        border: `1px solid ${half.color}20`,
                        borderRadius: 10,
                        padding: '14px 16px',
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 700, color: half.color, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        {half.label}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <p style={{ fontSize: 12, color: C.text, margin: 0 }}>
                          <span style={{ color: C.textDim }}>Speed: </span>
                          <span style={{ color: half.color }}>{half.speed}</span>
                        </p>
                        <p style={{ fontSize: 12, color: C.text, margin: 0 }}>
                          <span style={{ color: C.textDim }}>Avg HR: </span>
                          <span style={{ color: half.color }}>{half.hr}</span>
                        </p>
                        <p style={{ fontSize: 12, color: '#e8f0ff', margin: 0, fontWeight: 700 }}>
                          <span style={{ color: C.textDim }}>Pa:HR = </span>
                          {half.pahr}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Result */}
                <div
                  style={{
                    background: 'rgba(255,152,0,0.08)',
                    border: `1px solid rgba(255,152,0,0.2)`,
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <p style={{ fontSize: 12, color: C.textDim, margin: '0 0 6px' }}>
                    Decoupling = (0.0857 − 0.0784) / 0.0857 × 100
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.orange, margin: 0 }}>
                    = <span style={{ fontSize: 22, letterSpacing: '-0.5px' }}>8.5%</span>
                    {'  '}
                    <span style={{ fontSize: 12, color: C.textDim, fontWeight: 400 }}>→ Moderate — more Zone 1 volume indicated</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Technology accuracy */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
              {TECH_CARDS.map((tech) => (
                <div
                  key={tech.device}
                  style={{
                    background: C.surface,
                    border: `1px solid ${tech.color}22`,
                    borderTop: `2px solid ${tech.color}`,
                    borderRadius: 12,
                    padding: '16px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{tech.icon}</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                      {tech.device}
                    </p>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: tech.color, margin: '0 0 8px', fontFamily: "'Fira Code', monospace" }}>
                    {tech.accuracy}
                  </p>
                  <p style={{ fontSize: 11, color: C.textDim, margin: '0 0 10px', lineHeight: 1.5, fontFamily: "'Lora', serif" }}>
                    {tech.note}
                  </p>
                  <span
                    className="adsc-chip"
                    style={{ fontSize: 10, fontWeight: 700, color: tech.color, background: `${tech.color}12`, border: `1px solid ${tech.color}25`, borderRadius: 20, padding: '3px 10px', fontFamily: "'Fira Code', monospace" }}
                  >
                    {tech.verdict}
                  </span>
                </div>
              ))}
            </div>

            {/* Training phase targets */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <div style={{ background: 'rgba(0,229,204,0.05)', borderBottom: `1px solid rgba(0,229,204,0.1)`, borderLeft: `3px solid ${C.teal}`, padding: '14px 20px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8f0ff', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Training Phase Targets
                </h3>
                <p style={{ fontSize: 11, color: C.textDim, margin: '3px 0 0', fontFamily: "'Fira Code', monospace" }}>
                  Decoupling goals by periodization phase
                </p>
              </div>

              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 90px 1fr 1fr',
                  padding: '10px 20px',
                  borderBottom: `1px solid ${C.border}`,
                  background: '#0a0e1a',
                }}
              >
                {['Phase', 'Target', 'Context', 'Interpretation'].map((h) => (
                  <p
                    key={h}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: C.textDim,
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      fontFamily: "'Fira Code', monospace",
                    }}
                  >
                    {h}
                  </p>
                ))}
              </div>

              {PHASE_TARGETS.map((row, i) => (
                <div
                  key={row.phase}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 90px 1fr 1fr',
                    padding: '14px 20px',
                    borderBottom: i < PHASE_TARGETS.length - 1 ? `1px solid ${C.border}` : undefined,
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontFamily: "'DM Sans', sans-serif" }}>
                    {row.phase}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: row.color,
                      fontFamily: "'Fira Code', monospace",
                      background: `${row.color}12`,
                      border: `1px solid ${row.color}22`,
                      borderRadius: 6,
                      padding: '2px 10px',
                      display: 'inline-block',
                    }}
                  >
                    {row.target}
                  </span>
                  <span style={{ fontSize: 11, color: C.text, fontFamily: "'Lora', serif" }}>
                    {row.context}
                  </span>
                  <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                    {row.note}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── FOOTER CITATIONS ─────────────────────────────────────────────── */}
          <div className="adsc-divider" />

          <footer>
            <div
              style={{
                background: '#060911',
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.textDim,
                  margin: '0 0 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontFamily: "'Fira Code', monospace",
                }}
              >
                Evidence Sources
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {CITATIONS.map((cite, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 10,
                      color: C.textFaint,
                      margin: 0,
                      lineHeight: 1.55,
                      fontFamily: "'Fira Code', monospace",
                    }}
                  >
                    {cite}
                  </p>
                ))}
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: C.textFaint,
                  margin: '14px 0 0',
                  fontFamily: "'Lora', serif",
                  fontStyle: 'italic',
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                }}
              >
                This page is for educational purposes only. Aerobic decoupling calculations from consumer wearables involve measurement assumptions. Always consult a qualified coach or sports medicine professional for personalised training guidance.
              </p>
            </div>
          </footer>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
