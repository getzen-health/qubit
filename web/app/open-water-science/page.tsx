// Open Water Swimming Science — static server component
// Covers cold water physiology, navigation tactics, performance physiology,
// and training science for marathon/ocean/lake racing.

import Link from 'next/link'
import { ArrowLeft, Waves, Compass, Thermometer, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Open Water Swimming Science' }

// ─── Theme ────────────────────────────────────────────────────────────────────
// CSS variables referenced inline throughout:
// --ow-abyss:  #020d18   background
// --ow-deep:   #0a3d55   card backgrounds
// --ow-teal:   #0891b2   primary accent
// --ow-foam:   #f0fdff   primary text
// --ow-bio:    #34d399   secondary accent (bioluminescent)
// Google Font: Rubik (weights 400, 500, 700)

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '10 km',
    label: 'Olympic Race Distance',
    sub: 'Elite finish: 118–125 min; >95% aerobic energy contribution',
    accent: '#0891b2',
  },
  {
    value: '34 km',
    label: 'English Channel Distance',
    sub: 'Dover to Cap Gris-Nez; tidal window forces 6-hr current planning',
    accent: '#34d399',
  },
  {
    value: '13 hrs',
    label: 'Average Channel Time',
    sub: 'Range: 7–25 hrs; 500–600 kcal/hr caloric demand',
    accent: '#0891b2',
  },
  {
    value: '18–25%',
    label: 'Drafting Oxygen Saving',
    sub: '0.5–1.5 m behind lead swimmer feet; key tactical variable',
    accent: '#34d399',
  },
]

// ─── Cold Water Performance Chart Data ────────────────────────────────────────

const COLD_WATER_DATA = [
  { temp: '25°C', label: 'Comfort Zone', km: 50, maxKm: 50, color: '#34d399', note: 'No thermal limit' },
  { temp: '20°C', label: 'Cool',          km: 20, maxKm: 50, color: '#0891b2', note: 'Mild fatigue factor' },
  { temp: '15°C', label: 'Cold',          km: 5,  maxKm: 50, color: '#0e7490', note: 'Functional impairment in 30 min (untrained)' },
  { temp: '10°C', label: 'Very Cold',     km: 1,  maxKm: 50, color: '#1d4ed8', note: 'Cold shock; swim failure risk' },
  { temp: '5°C',  label: 'Extreme',       km: 0.25, maxKm: 50, color: '#7c3aed', note: 'Immediate incapacitation risk' },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'cold-water',
    title: 'Cold Water Physiology',
    accent: '#0891b2',
    accentBg: 'rgba(8,145,178,0.07)',
    accentBorder: 'rgba(8,145,178,0.22)',
    accentPill: 'rgba(8,145,178,0.14)',
    iconSymbol: '❄',
    iconColor: '#67e8f9',
    findings: [
      {
        citation: 'Tipton 2003 — Cold Water Immersion Physiology',
        detail:
          'Initial cold water immersion below 15°C triggers an involuntary gasp reflex (1–2 L inhalation), hyperventilation at 2–3× resting rate sustained for approximately 90 seconds, and cardiac stress of 10–30 bpm heart rate increase. This cold shock — not hypothermia — is the primary risk mechanism in the critical first minutes of immersion. Swimming failure risk during cold shock is substantial: the combination of involuntary hyperventilation, cardiac arrhythmia risk, and motor dysfunction creates a lethal window. Many open water drowning deaths occur within the first 3 minutes from cold shock-induced panic, water inhalation during the gasp reflex, and loss of coordinated movement. Controlled, gradual entry with the face last significantly suppresses this response.',
        stat: 'Gasp reflex 1–2 L; hyperventilation 2–3× for 90 s; 10–30 bpm cardiac increase; primary drowning mechanism',
      },
      {
        citation: 'Tipton 1992 — Journal of Physiology (Neuromuscular Cooling)',
        detail:
          'Swim failure — not hypothermia — is the primary cold water drowning cause for recreational swimmers. Neuromuscular cooling begins peripherally and causes deterioration of hand and arm function before core temperature drops below the hypothermia threshold of 35°C. At 15°C, untrained individuals experience functional swimming impairment within 30 minutes and incapacitation within 60–90 minutes. Estimated swimming distance before functional impairment: 15°C → 1–2 km; 10°C → 0.5–1 km; 5°C → under 250 m. Elite cold water swimmers with thermal acclimatisation and protective subcutaneous fat extend these limits substantially, but do not eliminate the neuromuscular cooling mechanism.',
        stat: '15°C: functional impairment in 30 min; 1–2 km swim distance for untrained; neuromuscular failure precedes hypothermia',
      },
      {
        citation: 'Tipton 1994 — Ergonomics (Cold Habituation)',
        detail:
          'Repeated cold water immersion produces cold habituation — a measurable 40% reduction in the cold shock response (hyperventilation magnitude and duration) without changing the rate of peripheral or core heat loss. Progressive thermal acclimatisation protocols over 5–10 sessions produce this adaptation, which is neurological rather than metabolic. Elite cold water marathon swimmers develop enhanced capacity for peripheral vasoconstriction maintenance, reducing heat loss from extremities while preserving core temperature longer. The adaptation is temperature-specific: habituation at 12°C does not fully transfer to 8°C, and cold water competitive swimmers must acclimatise at race-relevant temperatures to achieve optimal response suppression.',
        stat: 'Cold habituation: −40% shock response over 5–10 sessions; neurological adaptation; temperature-specific',
      },
      {
        citation: 'Chatard 2003 — Medicine & Science in Sports & Exercise (Wetsuit Performance)',
        detail:
          'Wetsuits provide three performance mechanisms: thermoregulation by trapping a thin insulating water layer, buoyancy benefit of 6–8% through hip elevation that improves body position and reduces form drag, and improved frontal area through better horizontal alignment. Net speed benefit is approximately +0.5 km/h compared to skin swimming at equivalent physiological effort. World Aquatics wetsuit regulations for competition: maximum thickness 5 mm at torso, 3 mm at limbs, no coverage above neck or below ankles. Wetsuit-legal conditions apply when water temperature is below 18°C or above 24.6°C. The buoyancy benefit is particularly pronounced for athletes with low natural buoyancy (low body fat, dense musculature), where hip sinking creates disproportionately high active drag.',
        stat: '+0.5 km/h speed; +6–8% buoyancy; hip elevation reduces form drag; wetsuit-legal: <18°C or >24.6°C',
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation & Tactical Science',
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.07)',
    accentBorder: 'rgba(52,211,153,0.22)',
    accentPill: 'rgba(52,211,153,0.14)',
    iconSymbol: '◎',
    iconColor: '#6ee7b7',
    findings: [
      {
        citation: 'Barbosa 2015 — Open Water Swimming Biomechanics Review',
        detail:
          'Head-lift sighting mechanics — the "crocodile eye" technique where only the eyes clear the water surface — must be timed within the stroke cycle to minimise energy cost. Optimal sighting frequency of every 8–12 strokes represents the minimum necessary for course correction in calm conditions; choppier water demands more frequent sighting. The energy overhead of repetitive sighting is 2–3% of total distance due to momentary disruption of body position, neck extension increasing active drag, and the hip drop that follows each head lift. Without any sighting, directional deviation is 5–15° per minute depending on conditions, compounding to 8–20% excess total distance swum. Bilateral breathing offers an inherent navigation advantage by providing visual reference across a 180° arc.',
        stat: 'Sighting every 8–12 strokes; without sighting: 5–15°/min deviation = 8–20% excess distance; 2–3% overhead',
      },
      {
        citation: 'Millet 2012 — International Journal of Sports Physiology & Performance',
        detail:
          'Hydrodynamic drafting in open water swimming reduces oxygen consumption by 18–25% when positioned 0.5–1.5 m directly behind the lead swimmer\'s feet in the primary wake pocket. Hip-side drafting yields a smaller but meaningful 10–15% benefit. Pack swimming tactics in Olympic 10 km events involve embedding in the lead group through feeding stations to maximise energy conservation, reserving capacity for the decisive sprint in the final 400–500 m where 30–40% of finishing positions are decided. Breaking from a pack prematurely incurs a 15–20% oxygen cost penalty from losing drafting benefit. The psychological demand of maintaining close proximity — swimming over other athletes\' feet and accepting incidental contact — is a distinct trainable skill.',
        stat: 'Drafting: 18–25% VO₂ reduction; 0.5–1.5 m behind feet = optimal; hip-side: 10–15%; decisive sprint final 400 m',
      },
      {
        citation: 'Open Water Swimming Manual — FINA Technical Committee 2013',
        detail:
          'Reading water current patterns is a learned competency central to elite open water performance. Experts use visible surface texture, flotsam movement, buoy line angles, boat wake behaviour, and pre-race reconnaissance to identify current assistance zones. Cross-current tactics employ ferry gliding: angling the body 10–30° to the desired course to compensate for lateral drift, minimising total swum distance while exploiting current velocity components. In ocean events, tidal window timing is critical — the English Channel crossing of approximately 34 km requires timing for a 6-hour tidal window before reversal, and swimmers who miss the optimal window may be swept beyond reach of the French coast. Expert navigation and current management yield consistent advantages of 5–15 minutes in competitive events of 10 km and beyond.',
        stat: 'Ferry gliding 10–30° compensates cross-current; Channel tidal window = 6 hrs; current management = 5–15 min advantage',
      },
      {
        citation: 'Baddeley 2016 — Marathon Swimming Federation Analysis',
        detail:
          'English Channel physiology at full scale: the 34 km crossing in 7–16°C water demands caloric expenditure of 500–600 kcal per hour over an average of 13–15 hours, requiring feeding every 30–45 minutes. Channel Swimming Association rules mandate liquid feeds only, passed on a pole without swimmer touching the support boat. Nutrition logistics include liquid carbohydrate concentrates (60–80 g carbohydrate per hour), electrolyte supplementation addressing cold-induced diuresis losses, and sodium management given inevitable seawater ingestion. Crew support structure is critical: experienced support swimmers, a certified navigator, feeding coordinator, and medical oversight. Mental strategies for 13+ hours must systematically address cognitive monotony, rough water management, night darkness (crossings extending past sunset), and crew communication across the entire attempt duration.',
        stat: 'Channel: 500–600 kcal/hr; feed every 30–45 min; 13–15 hr average; liquid feeds only per CSA rules',
      },
    ],
  },
  {
    id: 'physiology',
    title: 'Performance Physiology',
    accent: '#0891b2',
    accentBg: 'rgba(8,145,178,0.07)',
    accentBorder: 'rgba(8,145,178,0.22)',
    accentPill: 'rgba(8,145,178,0.14)',
    iconSymbol: '♥',
    iconColor: '#67e8f9',
    findings: [
      {
        citation: 'Pyne 2014 — International Journal of Sports Physiology & Performance (OW 10 km)',
        detail:
          'Olympic open water 10 km events take elite athletes approximately 118–125 minutes, with aerobic energy contribution exceeding 95%. VO₂max requirements parallel elite pool swimmers: 65–75 mL/kg/min for men, 55–65 mL/kg/min for women. Critically, open water performance requires additional competencies absent from pool events: navigation skill, physical contact management during pack swimming, feeding station proficiency, and tactical intelligence about current dynamics and positioning. Pacing strategy evidence from GPS tracking: athletes embedding in the lead pack from the start and executing a tactical surge in the final 500 m finish an average of 5–8 places higher than athletes who lead from the front and experience aerobic drift.',
        stat: 'VO₂max 65–75 mL/kg/min; 95% aerobic; 118–125 min elite; pack + final sprint strategy = 5–8 place advantage',
      },
      {
        citation: 'Bremer 2017 — European Journal of Sport Science (Body Composition OW vs Pool)',
        detail:
          'Subcutaneous fat plays a genuine thermoregulatory role in open water swimming by insulating against heat loss in cold water. Elite Olympic 10 km open water racers carry 2–5% more body fat than pool swimming counterparts at equivalent performance levels — a physiologically rational adaptation, not a fitness deficit. Marathon Channel swimmers in 7–16°C water may carry 20–25% body fat specifically for thermal protection. The performance versus thermal protection trade-off is event-specific: 10 km racing in 20°C water requires less fat insulation than a Channel attempt in 12°C water over 13 hours. Body fat distribution matters: subcutaneous fat distributed across the torso provides better thermal insulation than equivalent fat concentrated at the abdomen.',
        stat: 'OW racers: 2–5% more body fat than pool equivalents; marathon swimmers: 20–25% BF; distribution matters',
      },
      {
        citation: 'Wadas 2019 — Open Water Hazards & Stress Physiology Review',
        detail:
          'Environmental stress responses during open water competition include jellyfish sting-induced cortisol and adrenaline release, acutely elevating heart rate 10–20 bpm and potentially impairing stroke mechanics through pain-induced muscular tension. Sun exposure at multi-hour events causes UV-mediated inflammation and photokeratitis risk. Salt water aspiration in rough conditions causes electrolyte disturbance and pulmonary irritation. Swimmer\'s ear (external otitis from fungal colonisation) affects 25–35% of high-volume open water swimmers. The startle response to unexpected marine life contact — jellyfish, sea lice, seagrass, or large fish — can produce a 30–60 second stroke disruption with measurable heart rate spike, representing a trainable psychological tolerance variable.',
        stat: 'Sting: +10–20 bpm acute; salt water aspiration: electrolyte risk; startle response: 30–60 s stroke disruption',
      },
      {
        citation: 'Ronconi 2019 — FINA World Championships GPS Pacing Analysis',
        detail:
          'GPS pacing data from FINA World Championship 10 km events demonstrates that athletes using a negative split strategy — swimming the second 5 km 2–4% faster than the first — finish an average of 5–8 positions higher than positive-split athletes. Being dropped from the leading pack before the halfway point incurs a 15–20% oxygen cost penalty through loss of drafting benefit, making early pack positioning disproportionately important. The decisive race phase is the final feeding station (typically 500–800 m to finish), where pack cohesion breaks and sprint capacity and positioning become the primary determinants of podium outcomes. Athletes who maintain 92–95% of maximum aerobic velocity through 9 km retain sprint capacity sufficient for decisive tactical moves.',
        stat: 'Negative split: 2–4% faster 2nd half = 5–8 places higher; final 500 m = 30–40% of positions decided',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training Science',
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.07)',
    accentBorder: 'rgba(52,211,153,0.22)',
    accentPill: 'rgba(52,211,153,0.14)',
    iconSymbol: '↑',
    iconColor: '#6ee7b7',
    findings: [
      {
        citation: 'Knechtle 2014 — Open Water Swimming Training Review',
        detail:
          'Elite open water swimmer training typically involves 60–80 km per week total swimming volume, with approximately 50% completed in open water. Open water time is irreplaceable for developing navigation skill under realistic conditions, thermal acclimatisation, tactical racing instincts, and psychological comfort with deep or turbid water that pool training cannot replicate. Pool training remains essential for stroke mechanics, high-intensity interval work at precise physiological targets (critical velocity, VO₂max intervals), and performance monitoring via pace clocks. National programme structures periodise the open water component to peak during competitive season (May–September in the Northern Hemisphere), with pool-dominant training through winter. Elite programmes typically include 2–3 open water race-simulation sessions per week during peak season.',
        stat: '60–80 km/wk total; ~50% open water; pool for mechanics + HI intervals; OW for navigation + tactics + acclimatisation',
      },
      {
        citation: 'Tipton 2000 — Experimental Physiology (Cold Acclimatisation Protocol)',
        detail:
          'Evidence-based cold water acclimatisation for competitive open water swimming involves progressive cold exposure 3 times weekly over 4 weeks. Beginning at a manageable temperature (14–16°C for pool-trained swimmers) and decreasing by 0.5–1°C per week achieves systematic habituation. Cold shower protocols (3–5 minutes at maximum cold domestic water temperature, typically 8–12°C) usefully complement open water exposure when natural cold water access is limited. Thermoregulation monitoring includes pre- and post-session rectal temperature, subjective comfort and shivering onset time, and functional swimming performance at target temperatures. Outcomes: reduced cold shock magnitude (−40%), earlier onset of peripheral vasoconstriction, improved comfort at race temperatures, and approximately 10–15% extension of functional swimming time before impairment onset.',
        stat: '3×/wk progressive cold exposure; 4 weeks; −0.5–1°C/wk; −40% shock response; +10–15% functional time',
      },
      {
        citation: 'Costa 2019 — International Journal of Sport Nutrition (Marathon Swim Nutrition)',
        detail:
          'Feeding logistics in Channel attempts and ultra-marathon open water events require liquid feeds only per Channel Swimming Association and Marathon Swimmers Federation rules, passed by pole from support boat. Carbohydrate delivery of 60–80 g per hour prevents glycogen depletion across multi-hour events. Electrolyte supplementation addresses sodium and potassium losses elevated by cold-induced diuresis (cold water increases urine output 25–50% above thermoneutral rates). Sodium management is nuanced: sea water ingestion increases sodium load, while excessive fresh water consumption creates hyponatraemia risk. GI tolerance at race intensity varies individually — high-intensity swimming combined with water ingestion produces significant nausea in some athletes, requiring that feeding protocols (formula, concentration, temperature, timing) be individually validated through training feeds of ≥2 hours duration.',
        stat: '60–80 g CHO/hr; cold diuresis +25–50%; hyponatraemia risk; GI tolerance must be individually validated in training',
      },
      {
        citation: 'Munatones 2011 — Open Water Swimming Manual (Psychological Preparation)',
        detail:
          'Mental training for open water addresses a distinct psychological challenge set absent from pool competition: managing thalassophobia (deep water fear), discomfort in turbid or dark water, physical isolation from stable support, night darkness during extended Channel crossings (some attempts last beyond sunset and into the following dawn), and the extremely long-duration cognitive demands of 10+ hour swims. Hallucination risk in ultra-swims exceeding 20 hours has been systematically documented — visual hallucinations of finish lines, familiar faces, or obstacles are reported by experienced marathon swimmers and are manageable with advance preparation. Systematic psychological preparation includes: graduated open water exposure for deep water anxiety, race scenario visualisation, motivational strategy planning with crew, and established cognitive techniques for managing boredom and maintaining stroke focus across many hours of sustained effort.',
        stat: 'Dark water, isolation, 10+ hr duration; hallucination risk >20 hrs; crew motivation strategy; graduated OW exposure',
      },
    ],
  },
]

// ─── Key Principles ───────────────────────────────────────────────────────────

const KEY_PRINCIPLES = [
  'Cold shock — not hypothermia — is the primary cold water drowning mechanism: involuntary gasp, hyperventilation, and cardiac stress in the first 90 seconds are the lethal risks (Tipton 2003).',
  'Swim failure from neuromuscular cooling precedes hypothermia at 15°C: hand/arm function deteriorates before core temperature falls below 35°C (Tipton 1992).',
  'Cold habituation reduces the shock response by 40% over 5–10 sessions of progressive cold exposure without changing heat loss rate.',
  'Wetsuits provide +6–8% buoyancy via hip elevation (reduced form drag) and +0.5 km/h speed benefit; legal in competition when water temperature is below 18°C or above 24.6°C.',
  'Sighting every 8–12 strokes adds 2–3% distance overhead; without sighting, course deviation compounds to 8–20% excess total distance in open water.',
  'Drafting 0.5–1.5 m behind the lead swimmer reduces oxygen cost by 18–25% — the single most important tactical variable in competitive open water events.',
  'Olympic 10 km elite VO₂max: 65–75 mL/kg/min (men); open water racers carry 2–5% more body fat than pool equivalents for thermal insulation.',
  'English Channel: 34 km, 7–16°C, average 13–15 hrs; 500–600 kcal/hr demand; 6-hour tidal window; liquid feeds only per CSA rules.',
  'Negative split pacing (2–4% faster 2nd half) yields 5–8 position improvement over positive-split competitors; the final 500 m decides 30–40% of finishing positions.',
  'Psychological preparation for open water must address deep water fear, dark water crossings, hallucination risk in >20-hour swims, and multi-hour cognitive monotony.',
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
        background: 'rgba(8,61,85,0.55)',
        border: '1px solid rgba(8,145,178,0.18)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '18px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 160,
        fontFamily: "'Rubik', sans-serif",
      }}
    >
      <p
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#cffafe', margin: '8px 0 4px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#4b7a8a', margin: 0, lineHeight: 1.45 }}>{sub}</p>
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
    <div style={{ padding: '16px 18px', borderBottom: '1px solid #071520' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4b7a8a',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#b0dce5', margin: '0 0 11px', lineHeight: 1.65, fontFamily: "'Rubik', sans-serif" }}>
        {detail}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          background: '#040f18',
          border: `1px solid ${accent}22`,
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
        background: 'rgba(4,21,34,0.9)',
        border: '1px solid rgba(8,145,178,0.15)',
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
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              lineHeight: 1,
            }}
          >
            {iconSymbol}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0f7fa', margin: 0, fontFamily: "'Rubik', sans-serif" }}>
          {title}
        </h2>
      </div>

      {/* Findings */}
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

// ─── Cold Water Chart ─────────────────────────────────────────────────────────

function ColdWaterChart() {
  const maxKm = 50
  return (
    <div
      style={{
        background: 'rgba(4,21,34,0.9)',
        border: '1px solid rgba(8,145,178,0.15)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(8,145,178,0.08)',
          borderBottom: '1px solid rgba(8,145,178,0.2)',
          borderLeft: '3px solid #0891b2',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0f7fa', margin: 0, fontFamily: "'Rubik', sans-serif" }}>
          Cold Water Swim Performance by Temperature
        </h2>
        <p style={{ fontSize: 12, color: '#2e6070', margin: '3px 0 0', fontFamily: "'Rubik', sans-serif" }}>
          Maximum safe swim distance (km) for untrained swimmers — Tipton 1992, 2000
        </p>
      </div>

      {/* Chart */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {COLD_WATER_DATA.map((row) => {
          const pct = (row.km / maxKm) * 100
          return (
            <div key={row.temp}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 5,
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: row.color,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      minWidth: 44,
                    }}
                  >
                    {row.temp}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: row.color,
                      background: `${row.color}18`,
                      border: `1px solid ${row.color}30`,
                      borderRadius: 4,
                      padding: '1px 7px',
                      fontFamily: "'Rubik', sans-serif",
                    }}
                  >
                    {row.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: row.color,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {row.km} km
                  </span>
                  <span style={{ fontSize: 11, color: '#2e6070', fontFamily: "'Rubik', sans-serif" }}>
                    {row.note}
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 8,
                  background: '#040f18',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid #071e2e',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${row.color}44, ${row.color}cc)`,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid #071520',
          background: '#040d14',
        }}
      >
        <p style={{ fontSize: 11, color: '#2e6070', margin: 0, lineHeight: 1.55, fontFamily: "'Rubik', sans-serif" }}>
          <span style={{ color: '#0891b2', fontWeight: 700 }}>Note:</span> Distances represent functional swimming distance before impairment for untrained individuals. Cold-acclimatised swimmers and those in wetsuits substantially exceed these limits. Acclimatisation, wetsuit use, body fat, and fitness all modify cold water tolerance significantly. These figures are indicative; individual response varies considerably.
        </p>
      </div>
    </div>
  )
}

// ─── Key Principles Footer ────────────────────────────────────────────────────

function KeyPrinciples() {
  return (
    <div
      style={{
        background: 'rgba(4,16,26,0.95)',
        border: '1px solid rgba(8,145,178,0.15)',
        borderRadius: 14,
        padding: '18px 20px',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#2e6070',
          margin: '0 0 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        Key Principles
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {KEY_PRINCIPLES.map((point, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: i % 2 === 0 ? '#0891b2' : '#34d399',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                flexShrink: 0,
                marginTop: 2,
                letterSpacing: '0.5px',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <p style={{ fontSize: 12, color: '#2e6070', margin: 0, lineHeight: 1.55, fontFamily: "'Rubik', sans-serif" }}>
              {point}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Hero SVG ─────────────────────────────────────────────────────────────────

function HeroSVG() {
  return (
    <svg
      viewBox="0 0 480 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto' }}
      aria-label="Open water swimmer from above with wave ripples and compass rose"
    >
      {/* Ocean background */}
      <rect width="480" height="220" fill="#020d18" />

      {/* Wave ripples emanating from swimmer */}
      {[30, 55, 80, 110, 145].map((r, i) => (
        <ellipse
          key={i}
          cx="240"
          cy="110"
          rx={r * 1.6}
          ry={r}
          stroke="#0891b2"
          strokeWidth={0.8}
          strokeOpacity={0.18 - i * 0.03}
          fill="none"
        />
      ))}

      {/* Bioluminescent shimmer dots */}
      {[
        [60, 40], [400, 60], [80, 160], [420, 155], [180, 30], [310, 185],
        [140, 190], [350, 25], [50, 110], [440, 110],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.5} fill="#34d399" opacity={0.35 + (i % 3) * 0.1} />
      ))}

      {/* Swimmer body (top-down view) */}
      {/* Torso */}
      <ellipse cx="240" cy="110" rx="12" ry="22" fill="#0891b2" opacity={0.9} />
      {/* Head */}
      <circle cx="240" cy="83" r="9" fill="#0e7490" opacity={0.95} />
      {/* Swim cap highlight */}
      <ellipse cx="240" cy="80" rx="6" ry="4" fill="#67e8f9" opacity={0.5} />
      {/* Left arm extended */}
      <path
        d="M230 95 Q205 80 195 65"
        stroke="#0891b2"
        strokeWidth="5"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Left hand */}
      <ellipse cx="193" cy="63" rx="5" ry="3.5" fill="#34d399" opacity={0.8} transform="rotate(-35 193 63)" />
      {/* Right arm pull */}
      <path
        d="M250 105 Q275 115 280 130"
        stroke="#0891b2"
        strokeWidth="5"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Right hand */}
      <ellipse cx="282" cy="133" rx="5" ry="3.5" fill="#34d399" opacity={0.8} transform="rotate(20 282 133)" />
      {/* Legs / kick trail */}
      <path
        d="M236 130 Q230 148 225 162"
        stroke="#0e7490"
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M244 132 Q250 150 255 164"
        stroke="#0e7490"
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Wake trail behind swimmer */}
      <path
        d="M238 134 Q235 155 232 172 M242 135 Q245 156 248 173"
        stroke="#34d399"
        strokeWidth="1.2"
        strokeOpacity={0.25}
      />

      {/* Compass rose — top right */}
      <g transform="translate(408 42)">
        {/* Outer circle */}
        <circle cx="0" cy="0" r="26" stroke="#0891b2" strokeWidth="1" strokeOpacity={0.35} fill="rgba(2,13,24,0.6)" />
        {/* Cardinal spokes */}
        <line x1="0" y1="-23" x2="0" y2="23" stroke="#0891b2" strokeWidth="0.8" strokeOpacity={0.4} />
        <line x1="-23" y1="0" x2="23" y2="0" stroke="#0891b2" strokeWidth="0.8" strokeOpacity={0.4} />
        {/* Diagonal spokes */}
        <line x1="-16" y1="-16" x2="16" y2="16" stroke="#0891b2" strokeWidth="0.5" strokeOpacity={0.25} />
        <line x1="16" y1="-16" x2="-16" y2="16" stroke="#0891b2" strokeWidth="0.5" strokeOpacity={0.25} />
        {/* North arrow (teal) */}
        <polygon points="0,-22 -4,-8 0,-13 4,-8" fill="#34d399" opacity={0.9} />
        {/* South arrow */}
        <polygon points="0,22 -4,8 0,13 4,8" fill="#0891b2" opacity={0.6} />
        {/* East arrow */}
        <polygon points="22,0 8,-4 13,0 8,4" fill="#0891b2" opacity={0.6} />
        {/* West arrow */}
        <polygon points="-22,0 -8,-4 -13,0 -8,4" fill="#0891b2" opacity={0.6} />
        {/* N label */}
        <text x="0" y="-27" textAnchor="middle" fontSize="7" fill="#34d399" fontFamily="ui-monospace,monospace" fontWeight="700" opacity={0.9}>N</text>
        {/* Center dot */}
        <circle cx="0" cy="0" r="2.5" fill="#34d399" opacity={0.8} />
      </g>

      {/* Distance scale indicator — bottom left */}
      <g transform="translate(22 192)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="#0891b2" strokeWidth="1.5" strokeOpacity={0.5} />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#0891b2" strokeWidth="1.5" strokeOpacity={0.5} />
        <line x1="60" y1="-4" x2="60" y2="4" stroke="#0891b2" strokeWidth="1.5" strokeOpacity={0.5} />
        <text x="30" y="-7" textAnchor="middle" fontSize="7" fill="#0891b2" fontFamily="ui-monospace,monospace" opacity={0.7}>10 km</text>
      </g>

      {/* Sighting line of sight */}
      <line x1="240" y1="74" x2="380" y2="28" stroke="#34d399" strokeWidth="0.8" strokeDasharray="4 3" strokeOpacity={0.3} />
      {/* Sighting target buoy */}
      <circle cx="382" cy="26" r="4" fill="#34d399" opacity={0.6} />
      <circle cx="382" cy="26" r="6.5" stroke="#34d399" strokeWidth="0.8" strokeOpacity={0.3} fill="none" />

      {/* Temperature overlay text */}
      <text x="22" y="22" fontSize="9" fill="#67e8f9" fontFamily="ui-monospace,monospace" opacity={0.5}>
        15°C
      </text>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpenWaterSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020d18',
        fontFamily: "'Rubik', sans-serif",
      }}
    >
      {/* Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap');
        .ow-page * { box-sizing: border-box; }
      `}</style>

      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(2,13,24,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(8,145,178,0.15)',
        }}
      >
        <div
          style={{
            maxWidth: 896,
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/swimming"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(8,145,178,0.1)',
              border: '1px solid rgba(8,145,178,0.2)',
              color: '#67e8f9',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            aria-label="Back to Swimming"
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#f0fdff',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Open Water Science
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: 'rgba(8,145,178,0.15)',
                  border: '1px solid rgba(8,145,178,0.35)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#67e8f9',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.5px',
                }}
              >
                Marathon & Ocean
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#2e6070', margin: 0 }}>
              Cold water, navigation, marathon swimming, and ocean racing physiology
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Waves style={{ width: 18, height: 18, color: '#0891b2' }} />
            <Compass style={{ width: 18, height: 18, color: '#34d399' }} />
            <Thermometer style={{ width: 18, height: 18, color: '#67e8f9' }} />
            <Activity style={{ width: 18, height: 18, color: '#0891b2' }} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 896, margin: '0 auto', padding: '24px 16px 96px' }}>

        {/* Hero SVG */}
        <div
          style={{
            background: 'rgba(8,61,85,0.2)',
            border: '1px solid rgba(8,145,178,0.15)',
            borderRadius: 16,
            padding: '24px 16px',
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <HeroSVG />
        </div>

        {/* Intro */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(8,145,178,0.10) 0%, rgba(52,211,153,0.07) 50%, rgba(2,13,24,0.1) 100%)',
            border: '1px solid rgba(8,145,178,0.18)',
            borderRadius: 16,
            padding: '20px 22px',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: '#6da8b8',
              margin: 0,
              lineHeight: 1.75,
            }}
          >
            Open water swimming is one of sport's most demanding and complex disciplines, combining elite aerobic physiology with navigation science, cold water physiology, tactical pack racing, and the psychology of multi-hour solo effort in an open environment. From the Olympic 10 km mass-start race — decided in the final sprint after 118 minutes of tactical positioning — to the English Channel's 34 km crossing in 7–16°C water, open water demands unique physiological adaptations and technical skills that pool swimming cannot replicate. This page synthesises the peer-reviewed evidence on cold water immersion, hydrodynamic drafting, marathon nutrition, and acclimatisation science.
          </p>
        </div>

        {/* Key Stats */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Cold Water Performance Chart */}
        <div style={{ marginBottom: 20 }}>
          <ColdWaterChart />
        </div>

        {/* Science Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* Key Principles */}
        <KeyPrinciples />

      </main>

      <BottomNav />
    </div>
  )
}
