// Fencing Science — static server component
// Evidence-based guide covering blade biomechanics, reaction time decision science,
// energy systems, and elite training periodisation in competitive fencing.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Fencing Science' }

// ─── Fonts ────────────────────────────────────────────────────────────────────

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Michroma&family=Roboto:wght@400;500;700;900&display=swap'

// ─── Theme ────────────────────────────────────────────────────────────────────
// --fen-steel: #1c2b3a
// --fen-silver: #b0c4d8
// --fen-electric: #4fc3f7
// --fen-dark: #0a1520

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '25–35 m/s',
    label: 'Blade Tip Speed',
    sub: 'Roi & Bianchedi 2008 (Sports Med) — elite attack velocity',
    accent: '#4fc3f7',
  },
  {
    value: '170 ms',
    label: 'Foil Attack Time',
    sub: 'En garde to target; sabre 150 ms, épée 200 ms (Turner 2011)',
    accent: '#b0c4d8',
  },
  {
    value: '85–95%',
    label: 'HRmax During Bouts',
    sub: 'Iglesias 2003 (Eur J Appl Physiol) — competition intensity',
    accent: '#4fc3f7',
  },
  {
    value: '3 min',
    label: 'Bout Period Duration',
    sub: 'FIE rules: 3 × 3 min periods with 1 min rest intervals',
    accent: '#b0c4d8',
  },
]

// ─── Attack Time Chart Data ────────────────────────────────────────────────────

const ATTACK_TIMES = [
  { weapon: 'Sabre Attack',      ms: 150, maxMs: 300, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
  { weapon: 'Foil Attack',       ms: 170, maxMs: 300, color: '#4fc3f7', bg: 'rgba(79,195,247,0.12)', border: 'rgba(79,195,247,0.3)' },
  { weapon: 'Épée Attack',       ms: 200, maxMs: 300, color: '#b0c4d8', bg: 'rgba(176,196,216,0.12)', border: 'rgba(176,196,216,0.3)' },
  { weapon: 'Parry-Riposte',     ms: 280, maxMs: 300, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)' },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'blade-biomechanics',
    title: 'Blade Speed & Attack Biomechanics',
    accent: '#4fc3f7',
    accentBg: 'rgba(79,195,247,0.07)',
    accentBorder: 'rgba(79,195,247,0.22)',
    accentPill: 'rgba(79,195,247,0.14)',
    iconSymbol: '⚡',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'Roi & Bianchedi 2008 — Sports Medicine (Fencing review)',
        detail:
          'Blade tip velocity during an attack reaches 25–35 m/s (90–126 km/h) in elite fencers, generated through a proximal-to-distal kinetic chain: rear-leg extension drives hip forward, shoulder rotation accelerates the forearm, and wrist snap delivers the final velocity impulse to the blade tip. Épée fencers achieve higher tip velocity due to heavier blade mass and longer reach; sabre cuts can exceed 30 m/s. Tip velocity correlates strongly with lunge speed (r = 0.82) but is only weakly correlated with raw grip strength, emphasising technique over brute force.',
        stat: 'Blade tip: 25–35 m/s; wrist snap contributes final 20–30% of tip velocity',
      },
      {
        citation: 'Turner 2011 — Journal of Sports Sciences (Fencing lunge mechanics)',
        detail:
          'The lunge is the primary attacking action in all three weapons. Rear-leg peak ground reaction force averages 2.8–3.2× body weight during the propulsive phase. Front foot touchdown impact force: 1.4–1.8× BW — absorbed by the front knee in a semi-extended position. Total attack time from en garde to target contact: 150 ms (sabre), 170 ms (foil), 200 ms (épée). The sabre is fastest because right-of-way rules incentivise the most explosive possible first movement; épée's no-right-of-way rule allows more measured, accurate attacks.',
        stat: 'Rear-leg GRF: 2.8–3.2× BW; attack time: sabre 150 ms, foil 170 ms, épée 200 ms',
      },
      {
        citation: 'Gutierrez-Davila 2013 — Journal of Human Kinetics (Weapon-specific tactics)',
        detail:
          'Each weapon creates a distinct tactical profile. Sabre: 86% of points are won by the attacker (right-of-way rewards explosive first action); preparation footwork is minimal, aggression maximal. Foil: right-of-way also applies, but the smaller target (torso) demands precision line control and ceding the line is fatal — defensive parries are more technical. Épée: the only weapon where simultaneous touches score for both fencers; whole-body valid target requires continuous threat assessment from tip to shoulder. Épée fencers show 40–60 ms longer decision times due to the increased number of tactical variables to evaluate.',
        stat: 'Sabre: 86% attacker wins; épée decisions 40–60 ms longer due to whole-body valid target',
      },
      {
        citation: 'Guilhem 2014 — European Journal of Sport Science (Musculoskeletal asymmetry)',
        detail:
          'Chronic en garde stance (front knee 120–140° flexion, rear knee 130–150°, sustained for thousands of training hours) produces systematic bilateral strength asymmetry. Front-leg quadriceps are 12–18% stronger; rear-leg hamstrings and gluteus maximus 14–22% stronger from lunge propulsion. Ankle plantar flexors show 15–25% side-to-side asymmetry. These imbalances persist for years post-retirement if untrained. Corrective bilateral strength work must be explicitly programmed from junior level to prevent long-term articular consequences.',
        stat: 'En garde asymmetry: quad +12–18% front, hamstring +14–22% rear; persists without intervention',
      },
    ],
  },
  {
    id: 'reaction-decision',
    title: 'Reaction Time & Decision Science',
    accent: '#7c3aed',
    accentBg: 'rgba(124,58,237,0.07)',
    accentBorder: 'rgba(124,58,237,0.22)',
    accentPill: 'rgba(124,58,237,0.14)',
    iconSymbol: '◈',
    iconColor: '#c4b5fd',
    findings: [
      {
        citation: 'Borysiuk 2010 — Archives of Budo (Fencing reaction time study)',
        detail:
          'Elite fencers\' simple reaction time (one stimulus, one response) averages 150–180 ms — comparable to other elite combat athletes. However, fencing-specific choice reaction time — selecting the correct parry-riposte or counter-attack from multiple simultaneous stimuli (blade line, footwork pattern, body posture) — averages 220–320 ms. The elite vs sub-elite performance gap is most pronounced in choice RT (40–60 ms) rather than simple RT (< 10 ms). Training choice RT requires varied, unpredictable drill formats, not repetitive pattern rehearsal.',
        stat: 'Simple RT: 150–180 ms; choice RT: 220–320 ms; elite edge comes from faster choice RT',
      },
      {
        citation: 'Harmenberg 2007 — Int J Sports Physiology & Performance (Parry timing)',
        detail:
          'A successful parry must intercept an incoming blade within 100–200 ms from the moment of attack recognition — a window so narrow that pure reaction time is often insufficient. Given that an elite fencer\'s simple reaction time is ~160 ms and choice RT is ~270 ms, a reactive parry frequently cannot beat a committed attack in real time. This biomechanical reality explains why elite fencing is dominated by anticipation, probability assessment, and tactical trap-setting rather than raw speed. The paradox resolves when fencers learn to predict rather than react.',
        stat: 'Parry window: 100–200 ms; pure reaction is often too slow — anticipation dominates at elite level',
      },
      {
        citation: 'Tsolakis 2011 — Journal of Human Kinetics (Action-reaction paradox)',
        detail:
          'The action-reaction paradox states: a well-prepared attacking action is biomechanically faster than an equally skilled defensive reaction, because the attacker\'s motor programme is pre-loaded and executed without a detection phase. The defender must: detect the attack (50–80 ms), recognise the attack type (40–70 ms), select the correct parry (30–60 ms), and initiate movement — total: 200–280 ms, typically exceeding the available window. Feints exploit this: a feint forces the defender to commit a parry motor programme, which takes 80–120 ms to abort before a new one can be initiated.',
        stat: 'Feint delay cost: 80–120 ms defender programme abort; attacker motor programme has no detection phase',
      },
      {
        citation: 'Borysiuk & Waskiewicz 2008 — Journal of Human Kinetics (EEG alpha in fencing)',
        detail:
          'EEG recordings during fencing bouts reveal elevated left-temporal alpha-wave activity (8–12 Hz) in elite fencers — a neural signature associated with efficient motor memory retrieval and reduced cortical noise. Elite fencers process tactical cues with 30–40% less measurable neural activation than intermediate fencers performing identical decisions, consistent with motor chunking: expert fencers group attack-parry-riposte sequences as single retrieval units. Anticipatory kinematic cues in an opponent\'s preparation (shoulder tilt, arm velocity, knee extension onset) precede blade departure by 80–120 ms — within detectable range if trained.',
        stat: 'Elite EEG: +alpha, −30–40% cortical activation; kinematic cues precede blade departure by 80–120 ms',
      },
    ],
  },
  {
    id: 'energy-systems',
    title: 'Physical Demands & Energy Systems',
    accent: '#4fc3f7',
    accentBg: 'rgba(79,195,247,0.07)',
    accentBorder: 'rgba(79,195,247,0.22)',
    accentPill: 'rgba(79,195,247,0.14)',
    iconSymbol: '♥',
    iconColor: '#7dd3fc',
    findings: [
      {
        citation: 'Bottoms 2011 — Journal of Sports Sciences (Fencing metabolic demands)',
        detail:
          'Individual fencing actions last 1–5 seconds, making the phosphocreatine (PCr) system the dominant energy source (80–90% of energy for single actions). Blood lactate during competition peaks at 4–8 mmol/L — elevated but not maximally anaerobic, indicating significant aerobic contribution during the 10–45 s recovery intervals between actions. Anaerobic peak power (Wingate test) correlates strongly with competitive ranking (r = 0.78), while VO₂max correlates moderately (r = 0.61) — confirming the alactic-dominant but aerobically supported energy landscape.',
        stat: 'PCr system: 80–90% per-action energy; lactate 4–8 mmol/L; alactic power r = 0.78 with ranking',
      },
      {
        citation: 'Iglesias 2003 — European Journal of Applied Physiology (Fencing HR demands)',
        detail:
          'FIE bout structure: three 3-minute periods with 1-minute rests between periods; individual actions last 2–20 s with 10–45 s between hits. Heart rate averages 85–92% HRmax for foil and épée bouts, reaching 90–95% HRmax in sabre due to the faster action tempo and shorter recovery in sabre\'s right-of-way pressure. A full tournament day involves 6–15 bouts over 8–10 hours; aerobic base is critical for between-bout recovery even though individual actions are alactic.',
        stat: 'HR: 85–92% HRmax (foil/épée), 90–95% (sabre); 6–15 bouts per tournament day',
      },
      {
        citation: 'Roi & Bianchedi 2008 — Sports Medicine (Elite fencer physiology review)',
        detail:
          'Elite male fencers average VO₂max 55–65 mL/kg/min; sabre specialists at the upper end (61–65) due to higher aerobic demands from faster action tempo. Elite female fencers: 48–58 mL/kg/min. Body composition: lean body mass 75–82%, body fat 8–13% for males, 14–19% for females. Muscle fibre type distribution shows a mixed Type I/IIa profile (unlike pure power sports) reflecting the hybrid aerobic-anaerobic demand — approximately 52% Type I, 48% Type II in the dominant weapon arm.',
        stat: 'VO₂max: 55–65 mL/kg/min; fibre type ~52% Type I / 48% Type II — hybrid aerobic-alactic profile',
      },
      {
        citation: 'Guilhem 2014 (Eur J Sport Sci) + Roi & Bianchedi 2008 — Knee & ankle demands',
        detail:
          'Sustaining the en garde position (front knee 120–140° flexion) generates continuous patellofemoral joint compression of 2.0–3.5× body weight. Patellar tendinopathy prevalence in competitive fencers: 18–28%, higher in sabre athletes. Ankle inversion sprain is the most common acute injury due to rapid lateral footwork (advance-retreat, fleche) on the 14 m × 2 m piste surface. Long-career fencers (≥15 competitive years) show elevated radiographic signs of front-knee osteoarthritis versus controls, reinforcing the importance of loading management and asymmetry correction.',
        stat: 'Patellofemoral load: 2.0–3.5× BW; patellar tendinopathy: 18–28%; ankle sprain #1 acute injury',
      },
    ],
  },
  {
    id: 'training-development',
    title: 'Training Science & Elite Development',
    accent: '#7c3aed',
    accentBg: 'rgba(124,58,237,0.07)',
    accentBorder: 'rgba(124,58,237,0.22)',
    accentPill: 'rgba(124,58,237,0.14)',
    iconSymbol: '↑',
    iconColor: '#c4b5fd',
    findings: [
      {
        citation: 'Helsen 1998 — Journal of Sports Sciences (Deliberate practice in fencing)',
        detail:
          'Consistent with Ericsson\'s deliberate practice framework, elite international fencers accumulate 10,000–14,000 hours of deliberate practice before achieving senior international success. Fencing is unusual in having a bimodal specialisation pathway: early starters (ages 6–10) benefit from proprioceptive and coordination development, while late specialisers (ages 12–16) who transfer from racket sports or martial arts can reach elite level, with the oldest recorded Olympic debut at age 44. Early specialisation before age 10 is associated with higher burnout and dropout rates (Moesch 2011, Scand J Med Sci Sports).',
        stat: '10,000–14,000 h to elite; late specialisation (age 12–16) viable; early specialisation linked to burnout',
      },
      {
        citation: 'Turner 2011 (J Sports Sci) + Boo 2013 — IJSPP (Footwork training)',
        detail:
          'Footwork — advance, retreat, lunge, fleche, cross-step, appel — constitutes 40–60% of elite training time. This emphasis reflects the finding that footwork speed and accuracy predict 62% of variance in competitive outcome (Roi 2008). Plyometric training (box jumps, hurdle bounds, reactive agility) improves lunge velocity by 8–14% over 12 weeks. Bout simulation (sparring with scored hits) is reserved for 25–35% of training time at elite level; excessive sparring without technical feedback entrenches errors in sub-elite athletes.',
        stat: 'Footwork: 40–60% training time; plyometrics improve lunge velocity 8–14% over 12 weeks',
      },
      {
        citation: 'Guilhem 2014 — Eur J Sport Sci (S&C asymmetry correction)',
        detail:
          'Elite fencing strength & conditioning programs explicitly target bilateral symmetry restoration. Bilateral exercises (back squat, Romanian deadlift, hex-bar deadlift) are combined with unilateral emphasis on the non-dominant side (split squat, step-up, single-leg press). Goal: bilateral strength deficit < 10%. Core rotational symmetry is addressed with anti-rotation exercises (pallof press, cable chop) and bilateral rotation (cable rotation at equal load bilaterally). Programs targeting asymmetry below 15% reduce lower-limb injury incidence by approximately 30%.',
        stat: 'S&C target: bilateral deficit < 10%; asymmetry < 15% → 30% lower-limb injury reduction',
      },
      {
        citation: 'Bompa 2009 (Periodization) + Guillot 2012 — Brain & Cognition (Mental rehearsal)',
        detail:
          'Fencing season periodisation: Oct–Dec general conditioning (aerobic base, bilateral strength); Jan–Feb technical-tactical (footwork density, blade work refinement); Mar–Jun competition phase (peak intensity with taper 7–10 days pre-major event). Psychological preparation is integral: visualisation of attack-parry-riposte sequences activates the same primary motor cortex areas as physical execution (Guillot 2012) — mental rehearsal at rate-equivalent to physical speed is most effective. Elite fencers report structured pre-bout routines of 10–15 minutes: progressive physical warm-up, mental rehearsal of 3–4 key tactical scenarios, breathing regulation, and an attentional cue (\'see the target, not the blade\').',
        stat: 'Taper: 7–10 days; visualisation activates motor cortex equivalently to physical execution (Guillot 2012)',
      },
    ],
  },
]

// ─── Key Principles ───────────────────────────────────────────────────────────

const KEY_PRINCIPLES = [
  'Blade tip velocity of 25–35 m/s emerges from the proximal-to-distal kinetic chain, not grip strength — technique determines attack speed.',
  'Choice reaction time (220–320 ms) usually exceeds the parry window (100–200 ms); elite fencing is therefore dominated by anticipation and tactical deception, not pure reaction.',
  'The action-reaction paradox: a committed attack beats a reactive defense because the attacker has no detection phase — feints exploit the defender\'s 80–120 ms motor programme abort cost.',
  'EEG alpha activity in elite fencers reflects motor chunking: attack-parry-riposte sequences are retrieved as single units with 30–40% less cortical activation than sub-elite.',
  'Individual actions are PCr-dominant (80–90%), yet HR averages 85–95% HRmax throughout bouts; aerobic base is critical for between-bout and between-action recovery in tournaments.',
  'En garde stance creates 12–25% bilateral strength asymmetries that persist without targeted bilateral and unilateral corrective training.',
  'Patellar tendinopathy affects 18–28% of competitive fencers; patellofemoral joint compression reaches 2.0–3.5× body weight during sustained en garde.',
  'Elite fencers accumulate 10,000–14,000 h of deliberate practice; late specialisation (age 12–16) from racket or combat sports is a viable pathway to international success.',
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
        background: '#0f1e2d',
        border: '1px solid #1c2b3a',
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
          fontFamily: '"Michroma", ui-monospace, monospace',
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#b0c4d8', margin: '8px 0 4px', fontFamily: '"Roboto", sans-serif' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#3d5a73', margin: 0, lineHeight: 1.45, fontFamily: '"Roboto", sans-serif' }}>{sub}</p>
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
    <div style={{ padding: '16px 18px', borderBottom: '1px solid #111d28' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#4a7fa5',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: '"Michroma", ui-monospace, monospace',
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#8fafc8', margin: '0 0 11px', lineHeight: 1.65, fontFamily: '"Roboto", sans-serif' }}>{detail}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: '"Michroma", ui-monospace, monospace',
          background: '#0a1520',
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
        background: '#0f1e2d',
        border: '1px solid #1c2b3a',
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
              fontFamily: 'ui-monospace, monospace',
              lineHeight: 1,
            }}
          >
            {iconSymbol}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8edf2', margin: 0, fontFamily: '"Michroma", ui-monospace, monospace' }}>{title}</h2>
      </div>
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

function AttackTimeChart() {
  const maxMs = 300
  return (
    <div
      style={{
        background: '#0f1e2d',
        border: '1px solid #1c2b3a',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(79,195,247,0.07)',
          borderBottom: '1px solid rgba(79,195,247,0.2)',
          borderLeft: '3px solid #4fc3f7',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8edf2', margin: 0, fontFamily: '"Michroma", ui-monospace, monospace' }}>
          Attack Time by Weapon
        </h2>
        <p style={{ fontSize: 12, color: '#3d5a73', margin: '3px 0 0', fontFamily: '"Roboto", sans-serif' }}>
          Turner 2011 (J Sports Sci) — milliseconds from en garde to target contact
        </p>
      </div>
      <div style={{ padding: '20px 20px 16px' }}>
        {ATTACK_TIMES.map((row) => (
          <div key={row.weapon} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: row.color,
                  fontFamily: '"Michroma", ui-monospace, monospace',
                  letterSpacing: '0.3px',
                }}
              >
                {row.weapon}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: row.color,
                  fontFamily: '"Michroma", ui-monospace, monospace',
                  background: row.bg,
                  border: `1px solid ${row.border}`,
                  borderRadius: 6,
                  padding: '2px 10px',
                }}
              >
                {row.ms} ms
              </span>
            </div>
            <div style={{ height: 8, background: '#0a1520', borderRadius: 4, overflow: 'hidden', border: '1px solid #1c2b3a' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(row.ms / maxMs) * 100}%`,
                  background: `linear-gradient(90deg, ${row.color}66, ${row.color}cc)`,
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: '#3d5a73', margin: '12px 0 0', fontFamily: '"Roboto", sans-serif', lineHeight: 1.5 }}>
          Parry-riposte is a combined defence + counter-attack sequence; sabre attacks are fastest due to right-of-way rules that reward explosive first action.
        </p>
      </div>
    </div>
  )
}

function PisteSVG() {
  return (
    <svg
      viewBox="0 0 600 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }}
      aria-label="Fencing piste diagram from above"
    >
      {/* Piste surface */}
      <rect x="20" y="40" width="560" height="40" rx="4" fill="#0f1e2d" stroke="#1c2b3a" strokeWidth="1.5" />

      {/* Outer boundary lines */}
      <line x1="20" y1="40" x2="20" y2="80" stroke="#4fc3f7" strokeWidth="2.5" />
      <line x1="580" y1="40" x2="580" y2="80" stroke="#4fc3f7" strokeWidth="2.5" />

      {/* Center line */}
      <line x1="300" y1="34" x2="300" y2="86" stroke="#b0c4d8" strokeWidth="1.5" strokeDasharray="3 2" />

      {/* En garde lines (2m from center each side) */}
      <line x1="233" y1="37" x2="233" y2="83" stroke="#4fc3f7" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
      <line x1="367" y1="37" x2="367" y2="83" stroke="#4fc3f7" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />

      {/* Warning lines (1m from end each side) */}
      <line x1="54" y1="37" x2="54" y2="83" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <line x1="546" y1="37" x2="546" y2="83" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

      {/* Fencer left (attacking) */}
      <circle cx="220" cy="60" r="7" fill="#4fc3f7" opacity="0.9" />
      {/* Blade extended */}
      <line x1="225" y1="59" x2="275" y2="58" stroke="#4fc3f7" strokeWidth="1.5" opacity="0.8" />
      <polygon points="275,56 281,58 275,60" fill="#4fc3f7" opacity="0.8" />

      {/* Fencer right (defending) */}
      <circle cx="380" cy="60" r="7" fill="#b0c4d8" opacity="0.9" />

      {/* Labels */}
      <text x="300" y="18" textAnchor="middle" fill="#4fc3f7" fontSize="9" fontFamily="Michroma, monospace" letterSpacing="1">CENTRE LINE</text>
      <text x="233" y="25" textAnchor="middle" fill="#4fc3f7" fontSize="8" fontFamily="Michroma, monospace" opacity="0.7">EN GARDE</text>
      <text x="367" y="25" textAnchor="middle" fill="#4fc3f7" fontSize="8" fontFamily="Michroma, monospace" opacity="0.7">EN GARDE</text>
      <text x="54" y="25" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="Michroma, monospace" opacity="0.7">WARNING</text>
      <text x="546" y="25" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="Michroma, monospace" opacity="0.7">WARNING</text>

      {/* Piste dimensions */}
      <line x1="20" y1="100" x2="580" y2="100" stroke="#1c2b3a" strokeWidth="1" markerEnd="url(#arrow)" />
      <text x="300" y="113" textAnchor="middle" fill="#3d5a73" fontSize="9" fontFamily="Michroma, monospace">14 m PISTE × 2 m WIDE</text>
    </svg>
  )
}

function KeyPrinciples() {
  return (
    <div
      style={{
        background: '#0a1520',
        border: '1px solid #1c2b3a',
        borderRadius: 14,
        padding: '18px 20px',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#3d5a73',
          margin: '0 0 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: '"Michroma", ui-monospace, monospace',
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
                color: '#4fc3f7',
                fontFamily: '"Michroma", ui-monospace, monospace',
                flexShrink: 0,
                marginTop: 2,
                letterSpacing: '0.5px',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <p style={{ fontSize: 12, color: '#4a7fa5', margin: 0, lineHeight: 1.55, fontFamily: '"Roboto", sans-serif' }}>{point}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FencingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a1520', color: '#e8edf2' }}>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_LINK} rel="stylesheet" />

      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10,21,32,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1c2b3a',
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/workouts"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#0f1e2d',
              border: '1px solid #1c2b3a',
              color: '#b0c4d8',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            aria-label="Back to Workouts"
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#e8edf2',
                  margin: 0,
                  fontFamily: '"Michroma", ui-monospace, monospace',
                  letterSpacing: '0.5px',
                }}
              >
                Fencing Science
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 9px',
                  borderRadius: 9999,
                  background: 'rgba(79,195,247,0.10)',
                  border: '1px solid rgba(79,195,247,0.25)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#4fc3f7',
                  fontFamily: '"Michroma", ui-monospace, monospace',
                  letterSpacing: '0.4px',
                }}
              >
                EVIDENCE-BASED
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#3d5a73', margin: '2px 0 0', fontFamily: '"Roboto", sans-serif' }}>
              Blade biomechanics · Reaction time science · Energy systems · Elite training
            </p>
          </div>
        </div>
      </header>

      {/* Hero: Piste diagram + tagline */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0d1c2b 0%, #0a1520 100%)',
          borderBottom: '1px solid #1c2b3a',
          padding: '32px 16px 28px',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 13,
              color: '#4a7fa5',
              margin: '0 0 20px',
              fontFamily: '"Roboto", sans-serif',
              lineHeight: 1.6,
              maxWidth: 580,
            }}
          >
            The sport of fencing — foil, épée, and sabre — is a discipline of extreme precision where blade velocities exceed 30 m/s and attack decisions unfold in under 200 milliseconds. Science reveals why anticipation defeats reaction, why en garde destroys symmetry, and why the best fencers think less, not faster.
          </p>

          {/* Piste SVG */}
          <div
            style={{
              background: '#0a1520',
              border: '1px solid #1c2b3a',
              borderRadius: 12,
              padding: '16px 12px 12px',
              marginBottom: 28,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#3d5a73',
                margin: '0 0 12px',
                textAlign: 'center',
                fontFamily: '"Michroma", ui-monospace, monospace',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Fencing Piste — Plan View
            </p>
            <PisteSVG />
            <div
              style={{
                display: 'flex',
                gap: 20,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: 14,
              }}
            >
              {[
                { color: '#4fc3f7', label: 'Boundary / En garde lines' },
                { color: '#ef4444', label: 'Warning line (1 m from end)' },
                { color: '#b0c4d8', label: 'Centre line' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: '#4a7fa5', fontFamily: '"Roboto", sans-serif' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key stats grid */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {KEY_STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Attack Time Chart */}
          <AttackTimeChart />

          {/* Science Cards */}
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}

          {/* Weapon comparison table */}
          <div
            style={{
              background: '#0f1e2d',
              border: '1px solid #1c2b3a',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'rgba(176,196,216,0.07)',
                borderBottom: '1px solid rgba(176,196,216,0.2)',
                borderLeft: '3px solid #b0c4d8',
                padding: '14px 18px',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8edf2', margin: 0, fontFamily: '"Michroma", ui-monospace, monospace' }}>
                Weapon-by-Weapon Comparison
              </h2>
              <p style={{ fontSize: 12, color: '#3d5a73', margin: '3px 0 0', fontFamily: '"Roboto", sans-serif' }}>
                Physical demands, valid target, right-of-way, and tactical profile per weapon
              </p>
            </div>

            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 1fr 1fr',
                padding: '10px 20px',
                borderBottom: '1px solid #111d28',
                background: '#0a1520',
                gap: 8,
              }}
            >
              {(['Attribute', 'Foil', 'Épée', 'Sabre'] as const).map((h) => (
                <p
                  key={h}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: h === 'Foil' ? '#4fc3f7' : h === 'Épée' ? '#b0c4d8' : h === 'Sabre' ? '#ef4444' : '#3d5a73',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: '"Michroma", ui-monospace, monospace',
                  }}
                >
                  {h}
                </p>
              ))}
            </div>

            {[
              { attr: 'Valid target', foil: 'Torso only', epee: 'Entire body', sabre: 'Upper body incl. head & arms' },
              { attr: 'Right-of-way', foil: 'Yes', epee: 'No (doubles score)', sabre: 'Yes' },
              { attr: 'Attack time', foil: '~170 ms', epee: '~200 ms', sabre: '~150 ms' },
              { attr: 'HR avg. bout', foil: '85–90% HRmax', epee: '85–92% HRmax', sabre: '90–95% HRmax' },
              { attr: 'Primary tactic', foil: 'Line control & parry', epee: 'Point control & tempo', sabre: 'Explosive first action' },
              { attr: 'Dominant energy', foil: 'PCr + aerobic', epee: 'PCr + aerobic', sabre: 'PCr dominant' },
              { attr: 'VO₂max elite', foil: '55–63 mL/kg/min', epee: '55–62 mL/kg/min', sabre: '58–65 mL/kg/min' },
            ].map((row, i) => (
              <div
                key={row.attr}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 1fr 1fr',
                  padding: '11px 20px',
                  borderBottom: i < 6 ? '1px solid #0e1d2b' : undefined,
                  alignItems: 'center',
                  gap: 8,
                  background: i % 2 === 0 ? 'transparent' : '#0a1520',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#4a7fa5',
                    fontFamily: '"Michroma", ui-monospace, monospace',
                    letterSpacing: '0.2px',
                  }}
                >
                  {row.attr}
                </span>
                <span style={{ fontSize: 12, color: '#8fafc8', fontFamily: '"Roboto", sans-serif' }}>{row.foil}</span>
                <span style={{ fontSize: 12, color: '#8fafc8', fontFamily: '"Roboto", sans-serif' }}>{row.epee}</span>
                <span style={{ fontSize: 12, color: '#8fafc8', fontFamily: '"Roboto", sans-serif' }}>{row.sabre}</span>
              </div>
            ))}
          </div>

          {/* Key Principles */}
          <KeyPrinciples />

          {/* Disclaimer */}
          <p
            style={{
              fontSize: 11,
              color: '#253d52',
              margin: 0,
              lineHeight: 1.6,
              fontFamily: '"Roboto", sans-serif',
              textAlign: 'center',
              padding: '0 8px',
            }}
          >
            Research summary for educational purposes. Specific values reflect group averages from published studies and will vary by individual, competitive level, and weapon discipline. Consult qualified coaches and sports medicine professionals for personalised training guidance.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
