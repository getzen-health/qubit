// Indoor Cycling Science — static server component
// Evidence-based guide covering spin class physiology, smart trainer science,
// track cycling biomechanics, and indoor cycling adaptation.

import Link from 'next/link'
import { ArrowLeft, Zap, Flame, Activity, Timer } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Indoor Cycling Science' }

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  dark:     '#0f0800',
  fire:     '#ea580c',
  electric: '#eab308',
  red:      '#dc2626',
  text:     '#fff7ed',
} as const

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '600 kcal',
    label: 'Per 45-min Spin Class',
    sub: 'Chavarrias 2019 — HR 75–92% HRmax, lactate 3–7 mmol/L',
    accent: T.fire,
  },
  {
    value: '6.0 W/kg',
    label: 'Pro Racing Threshold',
    sub: 'FTP power-to-weight for professional road racing',
    accent: T.electric,
  },
  {
    value: '2,500 W',
    label: 'Track Sprint Peak Power',
    sub: 'Peak output in 0.3 s from standing start (velodrome)',
    accent: T.red,
  },
  {
    value: '88 mL/kg/min',
    label: 'Elite VO\u2082max',
    sub: 'World-class track endurance cyclist aerobic capacity',
    accent: T.electric,
  },
]

// ─── Power Zone Chart Data ─────────────────────────────────────────────────────

const POWER_ZONES = [
  { zone: 'Zone 1 — Recovery',   watts: 150, pct: 150 / 420, color: '#4ade80' },
  { zone: 'Zone 2 — Endurance',  watts: 220, pct: 220 / 420, color: '#86efac' },
  { zone: 'Zone 3 — Tempo',      watts: 270, pct: 270 / 420, color: T.electric },
  { zone: 'Zone 4 — Threshold',  watts: 310, pct: 310 / 420, color: '#fb923c' },
  { zone: 'Zone 5 — VO\u2082max',watts: 360, pct: 360 / 420, color: T.fire },
  { zone: 'Zone 6 — Anaerobic',  watts: 420, pct: 420 / 420, color: T.red },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'spin',
    title: 'Spin Class & Group Cycling Science',
    iconSymbol: '\u{1F6B4}',
    iconColor: '#fdba74',
    accent: T.fire,
    accentBg: 'rgba(234,88,12,0.08)',
    accentBorder: 'rgba(234,88,12,0.22)',
    accentPill: 'rgba(234,88,12,0.14)',
    findings: [
      {
        citation: 'Chavarrias 2019 — spin class energy expenditure',
        detail: 'Structured spin classes elicit HR 75–92% HRmax and blood lactate 3–7 mmol/L during interval phases, yielding 400–600 kcal per 45-minute session. Indoor classes deliver higher average intensity than equivalent outdoor rides because the absence of downhills removes passive recovery periods — every pedal stroke is loaded. Metabolic equivalence: comparable to outdoor riding at 35–40 km/h on flat terrain.',
        stat: '400–600 kcal / 45 min; HR 75–92% HRmax; lactate 3–7 mmol/L in intervals',
      },
      {
        citation: 'Cadence science — pedalling economy and neuromuscular demand',
        detail: 'At 90–100 RPM with moderate resistance, type I fibre recruitment dominates and per-rep force is low — ideal for endurance adaptation. At 60–70 RPM with heavy resistance, type II fibres are recruited, mimicking hill-climbing mechanics. High-cadence drills at 120+ RPM train neuromuscular rate coding and pedalling smoothness; low-cadence 50–60 RPM work builds on-bike strength endurance by requiring peak torque at slow angular velocity.',
        stat: '80–110 RPM optimal endurance; 60–80 RPM climb simulation; 120+ RPM neuromuscular drill',
      },
      {
        citation: 'Karageorghis 2008 — Journal of Sport & Exercise Psychology',
        detail: 'Synchronous music at 120–140 BPM increases cycling power output 15–20% vs. no-music control. The dissociation effect attenuates RPE by redirecting attentional focus away from physiological signals — delayed time to exhaustion by 10–15 min in maximal tests. Effect size decreases above 85% VO\u2082max as internal cues override external stimuli, but motivational value remains significant throughout structured spin intervals.',
        stat: '+15–20% power output with 120–140 BPM music; time to exhaustion +10–15 min',
      },
      {
        citation: 'Social facilitation & the Köhler effect — group cycling dynamics',
        detail: 'Group spin class settings increase self-selected power output 8–12% vs. solo riding at equivalent RPE, driven by social facilitation and instructor motivation effects. Competitive awareness of visible fellow riders elevates effort across all fitness levels. The Köhler effect is especially notable: less-fit riders improve disproportionately more in group settings — awareness of being the weakest member motivates above-average individual effort relative to baseline capacity.',
        stat: 'Group setting: +8–12% power vs. solo; Köhler effect amplifies gains for lower-fitness riders',
      },
    ],
  },
  {
    id: 'smart-trainer',
    title: 'Smart Trainer & Zwift Science',
    iconSymbol: '\u26A1',
    iconColor: '#fca5a5',
    accent: T.red,
    accentBg: 'rgba(220,38,38,0.08)',
    accentBorder: 'rgba(220,38,38,0.22)',
    accentPill: 'rgba(220,38,38,0.14)',
    findings: [
      {
        citation: 'Smart trainer accuracy — ±2% power measurement',
        detail: 'Direct-drive trainers (Wahoo KICKR, Tacx NEO) measure power with ±2% accuracy — equivalent to mid-range power meter pedals used outdoors. ERG mode maintains constant wattage regardless of cadence, enabling precise physiological targeting. Zwift racing physiological demands (sustained threshold with sprint efforts) are equivalent to outdoor criterium racing at equivalent power outputs; sweat rate and cardiac strain are higher indoors due to the absence of convective wind cooling.',
        stat: '±2% power accuracy; ERG mode enables precise zone targeting; Zwift \u2245 outdoor criterium physiology',
      },
      {
        citation: 'FTP methodology — Allen & Coggan power-based training',
        detail: 'FTP (functional threshold power) approximates one-hour sustainable power. The 20-min test yields slightly elevated values corrected by the 0.95 factor. Benchmarks: recreational cyclists 200–250 W (2.5–3.0 W/kg); competitive amateurs 280–320 W (3.5–4.5 W/kg); elite amateurs 320–380 W (4.5–5.5 W/kg); professionals 400–450 W (5.5–6.5 W/kg). The critical power model (Monod 1965) provides a biologically precise asymptote but requires three exhaustive trials.',
        stat: 'FTP = 20-min power × 0.95; recreational 200–250 W; pro 400–450 W (5.5–6.5 W/kg)',
      },
      {
        citation: 'Indoor heat stress — thermoregulatory challenge without wind cooling',
        detail: 'The absence of wind chill allows core temperature to rise 1–2\u00B0C above equivalent outdoor efforts. Sweat loss indoors: 1.5–2.5 L/hour vs. 0.8–1.5 L/hour outdoors. Fan airflow >20 km/h is recommended to replicate outdoor convective cooling. Without active cooling, performance declines 5–8% over 60-minute sessions as blood is progressively diverted to skin for thermoregulation, reducing active muscle perfusion and elevating perceived effort at constant power.',
        stat: 'Core temp +1–2\u00B0C vs outdoor; sweat 1.5–2.5 L/hr; >20 km/h fan = outdoor cooling equivalent',
      },
      {
        citation: 'Training zone models — Coggan, British Cycling, Seiler polarised',
        detail: 'Coggan 6-zone and British Cycling 7-zone models anchor zones at LT1 (\u224855–65% FTP) and LT2 (\u224895–105% FTP). Seiler\'s polarised model recommends 80% of training below LT1 and 20% above LT2 with minimal time in between — associated with superior VO\u2082max gains vs. pyramidal or threshold-heavy distributions in elite cyclist studies. For base-building, zones 1–2 dominate. For event preparation inside 8 weeks, threshold and VO\u2082max work increases to 15–25% of volume.',
        stat: 'Polarised: 80% <LT1, 20% >LT2; superior VO\u2082max vs threshold-heavy distribution',
      },
    ],
  },
  {
    id: 'track',
    title: 'Track Cycling Science (Velodrome)',
    iconSymbol: '\u{1F3C6}',
    iconColor: '#fdba74',
    accent: T.fire,
    accentBg: 'rgba(234,88,12,0.08)',
    accentBorder: 'rgba(234,88,12,0.22)',
    accentPill: 'rgba(234,88,12,0.14)',
    findings: [
      {
        citation: 'Sprint biomechanics — explosive fixed-gear acceleration',
        detail: 'Track sprint: peak velocity 70–75 km/h, peak power 2,500–3,000 W in approximately 0.3 s from triple extension. Gear selection balances maximum speed against acceleration capacity out of slow tactical phases; typical keirin gear 90–95 inches. Aerodynamic position optimisation (low handlebar, tucked elbows, aero helmet) reduces CdA by 15–20% versus upright position at 70 km/h — a crucial advantage when 80–90% of resistance is aerodynamic.',
        stat: '70–75 km/h peak; 2,500–3,000 W in 0.3 s; aero position −15–20% CdA vs upright',
      },
      {
        citation: 'Team pursuit aerodynamics — drafting and rotation strategy',
        detail: 'Team pursuit (4 riders \u00D7 4 km): following riders save 25–30% aerodynamic energy while drafting 0.3–0.5 m behind. The lead rider bears 30–35% higher energy cost than followers. Optimal rotation every 1–1.5 laps prevents lead accumulation of lactate above clearance capacity. World record pace (Ganna\'s squad, 2022): 62.5 km/h average, requiring sustained lead-rider power of approximately 460–480 W.',
        stat: 'Following riders: −25–30% energy cost; lead rider +30–35% cost; world record 62.5 km/h',
      },
      {
        citation: 'Velodrome physics — banking angle and fixed-gear mechanics',
        detail: 'Banking angle in velodrome corners (42–45\u00B0) is derived from centripetal force requirements at design speed: tan(\u03B8) = v\u00B2 / (r \u00D7 g). Fixed gear eliminates coasting — the drivetrain applies constant mechanical demand and prevents unpowered recovery. This creates a fundamentally different neuromuscular pattern from freewheel cycling: hip flexors must actively manage the upstroke against pedal resistance, producing balanced 360\u00B0 circular pedalling mechanics.',
        stat: '42–45\u00B0 banking; fixed gear = constant 360\u00B0 mechanical demand; hip flexors active on upstroke',
      },
      {
        citation: 'Aerodynamics — drag dominance and CdA optimisation',
        detail: 'At velocities above 40 km/h, aerodynamic drag comprises 70–90% of total resistance on a velodrome. CdA for pursuit specialists: 0.20–0.22 m\u00B2; sprinters in more upright positions: 0.22–0.28 m\u00B2. Skin suits reduce CdA 5–8%, aero helmets 3–5%, disc rear wheel 2–3% vs. spoked wheel. Field-based CdA estimation using power meters and speed (Chung method) provides approximately 80% of wind tunnel accuracy at minimal cost.',
        stat: 'Aerodynamic drag = 70–90% total resistance at 50 km/h; CdA 0.20–0.25 pursuit specialists',
      },
    ],
  },
  {
    id: 'physiology',
    title: 'Physiology & Training',
    iconSymbol: '\u2764',
    iconColor: '#fca5a5',
    accent: T.red,
    accentBg: 'rgba(220,38,38,0.08)',
    accentBorder: 'rgba(220,38,38,0.22)',
    accentPill: 'rgba(220,38,38,0.14)',
    findings: [
      {
        citation: 'Elite cycling VO\u2082max — cardiac adaptations and aerobic ceiling',
        detail: 'World-class track endurance cyclists achieve VO\u2082max 72–88 mL/kg/min, with cardiac stroke volumes of 200–220 mL/beat. Left ventricular hypertrophy from years of high-volume training produces Athlete\'s Heart — enlarged cavity volume with normal wall thickness, distinguishing it from pathological hypertrophy. VO\u2082max alone explains ~70% of performance variance; cycling economy (O\u2082 cost per watt) and FTP:VO\u2082max ratio complete the deterministic model.',
        stat: 'VO\u2082max 72–88 mL/kg/min; stroke volume 200–220 mL/beat; VO\u2082max explains ~70% variance',
      },
      {
        citation: 'Power-to-weight thresholds — amateur to professional standards',
        detail: 'Professional road racing: FTP \u22656.0 W/kg; elite amateur 4.5–5.5 W/kg; competitive recreational 3.0–4.0 W/kg. Sprint W/kg and FTP W/kg measure different qualities: track sprinters peak at 20–25 W/kg over 5 seconds; climbers optimise FTP W/kg at 6.0–7.0. Cycling climbing velocity scales linearly with W/kg on grades above 5% — each 0.1 W/kg improvement at 6% grade reduces a 20-minute climb by approximately 45 seconds for a 70 kg rider.',
        stat: 'Pro FTP \u22656.0 W/kg; elite amateur 4.5–5.5; sprint peak 20–25 W/kg (5 sec)',
      },
      {
        citation: 'Altitude training — live-high-train-low haematological adaptation',
        detail: 'Three weeks at 2,500 m stimulates EPO release 20–30%, reticulocyte count rises within 5–7 days, and haemoglobin mass increases after 3+ weeks. The live-high-train-low (LHTL) methodology maximises haematological stimulus from altitude living while preserving training quality at sea-level O\u2082 partial pressure. Performance benefit of 1–3% in time trials peaks 2–4 weeks post-return to sea level before haemoglobin mass begins declining.',
        stat: '3 weeks at 2,500 m: EPO +20–30%; Hb mass increase; performance +1–3% at 2–4 wk post-return',
      },
      {
        citation: 'Post-session recovery — cold immersion, compression, active recovery',
        detail: 'Cold water immersion at 10–15\u00B0C for 10 minutes post-session reduces CK 20% and DOMS 25–30% vs. passive recovery (Bleakley 2012). Vasoconstriction limits inflammatory oedema; tissue cooling reduces nerve conduction velocity and pain signalling. Compression tights improve venous return and interstitial fluid clearance. Active recovery rides at 50–55% FTP the following day enhance metabolite clearance without adding training stress.',
        stat: 'CWI 10–15\u00B0C \u00D7 10 min: CK \u221220%; DOMS \u221225–30%; active recovery at 50–55% FTP next day',
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
        background: '#1a0f05',
        border: '1px solid #2a1a0a',
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
          fontFamily: '"Russo One", "Impact", system-ui, sans-serif',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: '8px 0 4px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#a16207', margin: 0, lineHeight: 1.45 }}>{sub}</p>
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
    <div style={{ padding: '16px 18px', borderBottom: `1px solid #1a0f05` }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#92400e',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#fde68a', margin: '0 0 11px', lineHeight: 1.65 }}>{detail}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          background: '#0f0800',
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
        background: '#120900',
        border: '1px solid #2a1a0a',
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
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: iconColor,
              lineHeight: 1,
            }}
          >
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

function PowerZoneChart() {
  return (
    <div
      style={{
        background: '#120900',
        border: '1px solid #2a1a0a',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(234,88,12,0.08)',
          borderBottom: '1px solid rgba(234,88,12,0.2)',
          borderLeft: `3px solid ${T.fire}`,
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
          Power Output by Training Zone
        </h2>
        <p style={{ fontSize: 12, color: '#92400e', margin: '3px 0 0' }}>
          Coggan 6-zone model — reference values for a 310 W FTP athlete
        </p>
      </div>

      <div style={{ padding: '20px 20px' }}>
        {POWER_ZONES.map((z) => (
          <div key={z.zone} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
                flexWrap: 'wrap',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: z.color }}>{z.zone}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: z.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {z.watts} W
              </span>
            </div>
            <div style={{ height: 10, background: '#1a0f05', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${z.pct * 100}%`,
                  background: `linear-gradient(90deg, ${z.color}55, ${z.color}dd)`,
                  borderRadius: 5,
                }}
              />
            </div>
          </div>
        ))}
        <p
          style={{
            fontSize: 11,
            color: '#78350f',
            margin: '10px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          Coggan zones: Z1 &lt;55% FTP, Z2 56–75%, Z3 76–90%, Z4 91–105%, Z5 106–120%, Z6 121–150% — each targets distinct physiological adaptations anchored at LT1 and LT2
        </p>
      </div>
    </div>
  )
}

function HeroSVG() {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
      <svg
        viewBox="0 0 320 160"
        width="320"
        height="160"
        aria-hidden="true"
        style={{ maxWidth: '100%' }}
      >
        {/* Background glow */}
        <ellipse cx="160" cy="130" rx="130" ry="18" fill={`${T.fire}22`} />

        {/* Bike frame */}
        <line x1="100" y1="110" x2="160" y2="65" stroke={T.fire} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="160" y1="65" x2="210" y2="110" stroke={T.fire} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="160" y1="65" x2="155" y2="40" stroke={T.electric} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="110" x2="210" y2="110" stroke={T.fire} strokeWidth="3.5" strokeLinecap="round" />

        {/* Rear wheel */}
        <circle cx="100" cy="115" r="24" fill="none" stroke={T.fire} strokeWidth="3" />
        <circle cx="100" cy="115" r="4" fill={T.fire} />

        {/* Front wheel */}
        <circle cx="210" cy="115" r="24" fill="none" stroke={T.fire} strokeWidth="3" />
        <circle cx="210" cy="115" r="4" fill={T.fire} />

        {/* Handlebars */}
        <line x1="148" y1="38" x2="168" y2="38" stroke={T.electric} strokeWidth="3" strokeLinecap="round" />
        <line x1="155" y1="38" x2="155" y2="48" stroke={T.electric} strokeWidth="2.5" strokeLinecap="round" />

        {/* Saddle */}
        <rect x="152" y="58" width="22" height="5" rx="2.5" fill={T.electric} />

        {/* Crank arm */}
        <line x1="155" y1="110" x2="168" y2="125" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
        <circle cx="168" cy="126" r="5" fill="none" stroke="#f97316" strokeWidth="2.5" />

        {/* Rider silhouette */}
        <ellipse cx="162" cy="34" rx="9" ry="9" fill={T.electric} opacity="0.85" />
        <path d="M160 43 Q150 58 152 68" stroke={T.electric} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <line x1="152" y1="68" x2="148" y2="38" stroke={T.electric} strokeWidth="2.5" strokeLinecap="round" />

        {/* Power display */}
        <rect x="220" y="25" width="88" height="48" rx="8" fill="#1a0f05" stroke={T.electric} strokeWidth="1.5" />
        <text x="264" y="43" textAnchor="middle" fill={T.electric} fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">POWER</text>
        <text x="264" y="62" textAnchor="middle" fill={T.fire} fontSize="18" fontWeight="900" fontFamily="ui-monospace, monospace">310 W</text>

        {/* Sweat droplets */}
        <ellipse cx="185" cy="50" rx="3" ry="5" fill="#60a5fa" opacity="0.7" />
        <ellipse cx="192" cy="60" rx="2.5" ry="4" fill="#60a5fa" opacity="0.5" />
        <ellipse cx="178" cy="58" rx="2" ry="3.5" fill="#60a5fa" opacity="0.4" />

        {/* Heat waves */}
        <path d="M55 90 Q62 82 69 90 Q76 98 83 90" stroke={T.red} strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M55 100 Q62 92 69 100 Q76 108 83 100" stroke={T.red} strokeWidth="1.5" fill="none" opacity="0.4" />
      </svg>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IndoorCyclingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: T.dark, color: T.text }}>
      {/* Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');`}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: `${T.dark}cc`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2a1a0a',
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
            href="/cycling"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#1a0f05',
              border: '1px solid #2a1a0a',
              color: '#a16207',
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
                fontFamily: '"Russo One", system-ui, sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              Indoor Cycling Science
            </h1>
            <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
              Spin · Smart trainer · Track cycling · Physiology
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color={T.electric} />
            <Flame size={18} color={T.fire} />
            <Activity size={18} color={T.red} />
            <Timer size={18} color={T.electric} />
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
            background: `linear-gradient(135deg, rgba(234,88,12,0.14) 0%, rgba(220,38,38,0.10) 50%, rgba(234,179,8,0.08) 100%)`,
            border: '1px solid rgba(234,88,12,0.25)',
            borderRadius: 18,
            padding: '20px 22px 12px',
            marginBottom: 24,
          }}
        >
          <HeroSVG />
          <p
            style={{
              fontSize: 13,
              color: '#fde68a',
              margin: '12px 0 0',
              lineHeight: 1.7,
            }}
          >
            Indoor cycling encompasses spin classes, smart-trainer platforms like Zwift, and fixed-gear velodrome racing — each with distinct physiological demands. Without wind cooling, indoor heat stress is a primary limiter. Power-based training zones anchor structured sessions to measurable physiological thresholds. From 600 kcal spin classes to 2,500 W track sprints, the science here spans the full spectrum of saddle-based indoor effort.
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

        {/* Power zone chart */}
        <div style={{ marginBottom: 24 }}>
          <PowerZoneChart />
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
            background: '#120900',
            border: '1px solid #2a1a0a',
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <p style={{ fontSize: 11, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: '#92400e', fontWeight: 700 }}>Data note:</span> Power benchmarks (FTP, peak sprint power) are population distributions — individual variation is high. Your personal FTP trend over months is more meaningful than absolute comparison to population norms. Indoor cycling data in Apple Health captures primarily spin class sessions tagged as cycling workout type.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
