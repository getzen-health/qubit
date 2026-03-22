// Competition Climbing Science — static server component
// Evidence-based Olympic climbing physiology covering bouldering, lead, and speed disciplines.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Competition Climbing Science' }

// ─── Olympic Format Time Domain Data ─────────────────────────────────────────

const TIME_DOMAINS = [
  { discipline: 'Speed Climbing', seconds: 5,   display: '5 s',    color: '#f97316', barPct: 1.4  },
  { discipline: 'Campus Set',     seconds: 30,  display: '30 s',   color: '#fbbf24', barPct: 8.3  },
  { discipline: 'Boulder Problem',seconds: 240, display: '4 min',  color: '#92400e', barPct: 66.7 },
  { discipline: 'Lead Route',     seconds: 360, display: '6 min',  color: '#b45309', barPct: 100  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '4.79 s',  label: 'Speed Record',        sub: 'Veddriq Leonardo, 2024',              color: '#f97316' },
  { value: '2–3×BW', label: 'Finger Crimp Force',   sub: 'MacLeod 2007 — elite boulderers',     color: '#fbbf24' },
  { value: 'A2 Pulley', label: '#1 Injury',          sub: '30–40% of serious climbing injuries', color: '#ef4444' },
  { value: '<10%',    label: 'Elite Body Fat (Men)', sub: 'Power-to-weight performance driver',  color: '#92400e' },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    number: '01',
    title: 'Bouldering & Lead Climbing Physiology',
    accent: '#92400e',
    accentDim: 'rgba(146,64,14,0.14)',
    accentBorder: 'rgba(146,64,14,0.32)',
    icon: '🧗',
    findings: [
      {
        citation: 'MacLeod 2007 — J Sports Sci',
        stat: '2–3× BW',
        statLabel: 'Finger flexor force normalised to body weight',
        detail: 'Crimp strength in elite boulderers reaches 2–3× body weight — the highest force-to-mass ratio of any sport-specific grip demand. The A2 pulley (annular pulley of the ring and middle fingers) is the primary load-bearing structure in full crimp position; half-crimp and two-finger pocket positions reduce A2 loading by approximately 30%, creating a safety-versus-strength tradeoff. Finger-force-to-body-weight ratio is the strongest individual predictor of climbing grade (r=0.82), outperforming systemic VO₂max. V15–16 grade requirements demand near-maximal forearm flexor recruitment on holds as small as 8–10 mm. Forearm extensor fatigue during sustained climbing destabilises joint mechanics and accelerates pump onset even when flexor capacity remains.',
      },
      {
        citation: 'Vigouroux 2006 — J Biomech',
        stat: '12–18 mmol/L',
        statLabel: 'Local forearm blood lactate during pump',
        detail: 'Forearm arterial occlusion begins at approximately 40% of maximum voluntary contraction (MVC) during sustained gripping — well below maximum effort. Once intramuscular pressure exceeds capillary perfusion pressure, metabolism shifts to ischaemic glycolysis, producing the climbing "pump": progressive forearm hardening, loss of fine motor control, and eventual inability to maintain grip. Local blood lactate in the forearm peaks at 12–18 mmol/L during sustained route climbing, far exceeding systemic levels (which may remain below 6 mmol/L). Reperfusion occurs at rest holds (knee bars, stemming, no-hand rests). Campus board training develops power endurance by targeting the metabolic clearance rate at threshold intensity — repeated bouts of near-occlusion followed by partial recovery.',
      },
      {
        citation: 'España-Romero 2009 — Int J Sports Med',
        stat: '52–62 mL/kg/min',
        statLabel: 'VO₂max in elite lead climbers',
        detail: 'Lead climbing on 40–60-minute competition routes demands sustained oxygen consumption at 50–75% VO₂max with heart rate in the range of 75–88% HRmax. Elite lead climbers demonstrate VO₂max values of 52–62 mL/kg/min — elevated compared to recreational population but not approaching endurance sport values. System board training (sustained climbing on 45° overhang boards) functions as high-intensity interval training for both forearm local aerobic capacity and systemic oxygen uptake, producing adaptations in both compartments simultaneously. Forearm VO₂peak reaches 35–40 mL/100g/min in elite climbers — approximately 4× resting metabolic rate.',
      },
      {
        citation: 'Schöffl 2011 — Wilderness Environ Med',
        stat: '<10% / <16%',
        statLabel: 'Body fat in elite men / women',
        detail: 'Power-to-weight ratio is the dominant physical performance determinant in climbing because all body mass must be lifted against gravity on every move. Elite male competition climbers average below 10% body fat; elite female competitors below 16%. Finger-force-to-body-weight ratio predicts climbing grade (r=0.82) more strongly than absolute finger force alone — meaning a lighter athlete with equivalent finger strength will achieve higher grades. Weight management strategies in competitive climbing carry documented risk of relative energy deficiency in sport (RED-S), particularly in junior competition athletes, and should be supervised by sports nutrition professionals.',
      },
    ],
  },
  {
    id: 'speed',
    number: '02',
    title: 'Speed Climbing Science',
    accent: '#f97316',
    accentDim: 'rgba(249,115,22,0.14)',
    accentBorder: 'rgba(249,115,22,0.32)',
    icon: '⚡',
    findings: [
      {
        citation: 'IFSC World Record — Paris 2024',
        stat: '4.79 s',
        statLabel: 'Men\'s world record, 15m standardised wall',
        detail: 'Veddriq Leonardo (Indonesia) set the men\'s world record of 4.79 seconds on the standardised IFSC 15m speed wall in 2024, achieving an average ascent velocity of 3.1 m/s. Peak power output per leg push is estimated at 500–800 W. Contact time per hold is under 100 ms, directly comparable to 100m sprint ground contact times (80–100 ms at maximum velocity). Kinematics mirror sprint acceleration mechanics: forward trunk lean, explosive triple extension (ankle-knee-hip), and aggressive arm pull on identical hold positions encoded through thousands of repeated attempts.',
      },
      {
        citation: 'Laffaye 2016 — J Sports Sci',
        stat: '18–22 holds',
        statLabel: 'Hold contacts in under 5 seconds',
        detail: 'Elite speed climbers contact 18–22 holds per ascent in under 5 seconds, with individual hold contact duration between 80 and 130 ms. Force application per hold must be precisely directed: any excess braking or misdirected force costs measurable time at this resolution. The worldwide standardised identical route is the defining feature of speed climbing as a sport — it enables bilateral coordination patterns to become fully automatised, allowing explosive reactive force production at every hold position without conscious movement planning. Athletes report "blank" conscious experience during record attempts, indicative of complete motor automatisation.',
      },
      {
        citation: 'Bertuzzi 2012 — J Electromyogr Kinesiol',
        stat: '80%',
        statLabel: 'Upward propulsion from lower limbs',
        detail: 'Biomechanical analysis of speed climbing quantifies lower limb extension as contributing approximately 80% of total upward propulsion. Measured leg extension ground reaction forces at standardised holds range from 500 to 800 N per push in elite athletes. Arm pull provides the remaining 20% and primarily serves body alignment and hold-transition mechanics rather than direct upward propulsion — contrasting with bouldering, where upper body contribution increases substantially on steep overhanging terrain. This asymmetry means speed climbing-specific conditioning prioritises explosive leg power (depth jumps, reactive squats) over upper body pulling strength.',
      },
      {
        citation: 'Magill 2011 — Motor Learning (applied to speed climbing)',
        stat: '1,000+',
        statLabel: 'Route attempts for full automatisation',
        detail: 'Speed climbing is uniquely a motor learning discipline: because the route is physically identical at every competition worldwide, performance optimisation is primarily achieved through repetition-driven automatisation rather than new skill acquisition. Elite speed climbers accumulate 1,000 or more attempts on the standardised route to encode the movement sequence below conscious control. The competitive environment — a sub-5-second event with false-start disqualification pressure — demands near-perfect arousal regulation. False-start disqualification (reaction time <100 ms before start signal) is a real competitive risk, trained through starts under simulated competition conditions.',
      },
    ],
  },
  {
    id: 'injury',
    number: '03',
    title: 'Finger Injury Science',
    accent: '#ef4444',
    accentDim: 'rgba(239,68,68,0.14)',
    accentBorder: 'rgba(239,68,68,0.32)',
    icon: '🩺',
    findings: [
      {
        citation: 'Bollen 1988 + Schöffl 2013 — UIAA Medical Commission',
        stat: '30–40%',
        statLabel: 'A2 pulley rupture share of serious injuries',
        detail: 'The ring finger A2 annular pulley is the most frequently injured climbing structure, accounting for 30–40% of serious injuries presenting to sports medicine. In full crimp position, A2 loading reaches 6–10× the applied fingertip force due to the extreme mechanical disadvantage of the bowstringing tendon geometry. Partial ruptures are more common than complete tears. Diagnostic ultrasound (dynamic, with tendon loading) is the gold standard for grading severity (Grades I–IV). Conservative return-to-climbing protocol: 6–12 weeks with H-taping for load redistribution and graduated reintroduction. Surgery is reserved for complete Grade IV ruptures demonstrating bowstringing deformity.',
      },
      {
        citation: 'Rohrbough 2000 + Schöffl 2007 — Wilderness Environ Med / J Sports Med',
        stat: 'Pre-maturity',
        statLabel: 'Growth plate injury risk in youth climbers',
        detail: 'Intense crimp training before skeletal maturity risks Salter-Harris Type III epiphyseal (growth plate) fractures in the proximal and middle phalanges of the fingers. The proximal phalangeal physis does not close until approximately 15–16 years; the distal physis at 14–15 years. Growth plate fracture can cause permanent deformity and altered finger development. Radiographic screening is recommended for symptomatic young climbers experiencing proximal finger pain during loading. UIAA Medical Commission load management guidelines for junior athletes: maximum 3 climbing sessions per week under age 14; avoid maximum-intensity crimping until skeletal maturity is confirmed radiographically.',
      },
      {
        citation: 'Pieber 2012 — J Sports Med Phys Fitness',
        stat: '25%',
        statLabel: 'Shoulder injuries among all climbing injuries',
        detail: 'Shoulder pathology represents approximately 25% of all climbing injuries. The overhead pulling demands of steep and overhang climbing generate high dynamic loading of the posterior glenohumeral capsule. SLAP (Superior Labrum Anterior to Posterior) lesion mechanism is characterised by the "peel-back" force during dynamic lock-off movements and campus board dyno catches. Rotator cuff impingement from repetitive shoulder flexion and adduction is common in elite-level training loads. Prevention evidence: sleeper stretch for posterior capsule, eccentric external rotator strengthening in 90/90 position (side-lying external rotation), and serratus anterior activation exercises reduce shoulder injury incidence.',
      },
      {
        citation: 'Schöffl 2013 — Br J Sports Med (UIAA guidelines)',
        stat: '40–60%',
        statLabel: 'Injury rate reduction with antagonist training',
        detail: 'Climbing is an exclusively pulling sport producing severe flexor-extensor muscular imbalance in the forearm, elbow, and shoulder. Structured antagonist training directly counteracts this: finger extensor strengthening (rubber band extension, rice bucket, reverse wrist curls), shoulder external rotation under load, and push-up progressions address cumulative structural imbalance. Injury prevention programmes incorporating regular antagonist training reduce overuse injury incidence by 40–60% compared to climbing-only training regimens. The IFSC and UIAA now include antagonist exercise requirements in junior development programme standards for licensed national federations.',
      },
    ],
  },
  {
    id: 'mental',
    number: '04',
    title: 'Competition Format & Mental Science',
    accent: '#fbbf24',
    accentDim: 'rgba(251,191,36,0.14)',
    accentBorder: 'rgba(251,191,36,0.32)',
    icon: '🧠',
    findings: [
      {
        citation: 'IFSC Olympic Format + Hörst 2016 — Training for Climbing',
        stat: '4 min + 2 min',
        statLabel: 'Attempt window + read time per boulder',
        detail: 'Olympic bouldering format: 4–5 boulder problems per round, each with a 2-minute observation (read) window followed by a 4-minute attempt window. Athletes are held in an isolation zone before each problem set — no prior viewing of the problems is permitted. Scoring prioritises: (1) tops reached, (2) zones reached, (3) fewest attempts. Tactical decision-making includes attempt pacing — expending unnecessary attempts damages ranking even if top is eventually reached. The compressed 4-minute window on an unfamiliar problem creates high psychological arousal demanding trained emotional regulation and rapid motor problem-solving under time pressure.',
      },
      {
        citation: 'Goddard & Neumann 1993 — Performance Rock Climbing',
        stat: '2–4 grades',
        statLabel: 'Onsight below redpoint in elite climbers',
        detail: 'Olympic lead climbing is an onsight discipline: athletes receive a single 6-minute observation window and then one attempt with no prior hands-on practice. Onsight performance in elite climbers is systematically 2–4 grades below their redpoint level, reflecting the substantial cognitive overhead of simultaneously reading beta, identifying rest positions, managing clipping stance, and executing unfamiliar movement sequences under competition anxiety. Route-reading strategy — sequence prediction from below, rest identification, anticipating pump positions — is a specific trainable skill that narrows the onsight-to-redpoint gap through coached observation practice.',
      },
      {
        citation: 'Pijpers 2003 — Ergonomics (anxiety-climbing performance)',
        stat: '25–35%',
        statLabel: 'Overgrip increase under fall anxiety',
        detail: 'Climbing-specific arousal regulation research demonstrates that fear of falling triggers involuntary sympathetic arousal causing measurable overgripping: forearm grip tension increases 25–35% above the technical optimum during anxiety-provoking situations, dramatically accelerating pump onset and reducing time-to-failure on endurance routes. Optimal arousal for complex movement execution corresponds to approximately 70% HRmax — below this climbers are under-activated; above this, motor programme execution degrades. Mental training interventions effective in reducing overgripping: 4-7-8 diaphragmatic breathing during rest holds, progressive muscle relaxation pre-attempt, and systematic fall practice normalisation desensitises the fear response.',
      },
      {
        citation: 'Moran 2012 — Sport and Exercise Psychology (motor imagery)',
        stat: '8–15%',
        statLabel: 'Performance gain from structured visualisation',
        detail: 'Kinaesthetic imagery (internal-perspective motor rehearsal without physical movement) is standard practice among elite competition climbers. Research shows elite climbers rehearse route sequences 2–5 full times during observation windows, mentally traversing the route and encoding foot placements, rest positions, clip stances, and sequence decision points. Structured visualisation programmes improve onsight performance 8–15% versus observation without imagery training. Visualisation quality — kinaesthetic vividness and internal first-person perspective — predicts performance outcomes more accurately than visualisation duration alone. Beta memorisation strategies include breaking the route into zones and mentally climbing each zone sequentially before assembling the full sequence.',
      },
    ],
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClimbingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        :root {
          --clm-dark:   #0f0a06;
          --clm-rock:   #92400e;
          --clm-orange: #f97316;
          --clm-chalk:  #fef9f0;
          --clm-hold:   #fbbf24;
          --clm-surface:  #1a100a;
          --clm-surface2: #221407;
          --clm-border:   #2e1a0e;
          --clm-amber:    #b45309;
          --clm-text-dim: #a3856b;
          --clm-text-faint: #4a2f1a;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .clm-root {
          min-height: 100vh;
          background-color: var(--clm-dark);
          color: var(--clm-chalk);
          font-family: 'Archivo', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Chalk dust grain texture */
        .clm-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 500;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Rock glow bg */
        .clm-root::after {
          content: '';
          position: fixed;
          top: -10vh;
          left: -10vw;
          width: 120vw;
          height: 60vh;
          background: radial-gradient(ellipse at 50% 0%, rgba(146,64,14,0.07) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .clm-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(15,10,6,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--clm-border);
          padding: 12px 24px;
        }

        .clm-header-inner {
          max-width: 940px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .clm-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--clm-border);
          background: var(--clm-surface);
          color: var(--clm-text-dim);
          text-decoration: none;
          border-radius: 8px;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .clm-back-btn:hover { border-color: var(--clm-orange); color: var(--clm-orange); }

        .clm-header-title {
          font-family: 'Archivo Black', sans-serif;
          font-size: 15px;
          color: var(--clm-chalk);
          letter-spacing: 0.01em;
        }

        .clm-header-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          color: var(--clm-orange);
          background: rgba(249,115,22,0.12);
          border: 1px solid rgba(249,115,22,0.25);
          border-radius: 99px;
          padding: 3px 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Hero */
        .clm-hero {
          position: relative;
          overflow: hidden;
          padding: 56px 24px 48px;
          text-align: center;
          background: linear-gradient(180deg, #1a0d05 0%, var(--clm-dark) 100%);
          border-bottom: 1px solid var(--clm-border);
        }

        .clm-hero-glow {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.10) 0%, transparent 65%);
          pointer-events: none;
        }

        .clm-hero-content { position: relative; z-index: 1; }

        .clm-hero-title {
          font-family: 'Archivo Black', sans-serif;
          font-size: clamp(32px, 7vw, 58px);
          line-height: 1.0;
          letter-spacing: -0.02em;
          margin-bottom: 14px;
          background: linear-gradient(135deg, var(--clm-hold) 0%, var(--clm-orange) 45%, #c2410c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .clm-hero-sub {
          font-size: 14px;
          color: var(--clm-text-dim);
          max-width: 560px;
          margin: 0 auto 32px;
          line-height: 1.65;
        }

        .clm-hero-disciplines {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .clm-discipline-pill {
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 99px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Main */
        .clm-main {
          max-width: 940px;
          margin: 0 auto;
          padding: 36px 20px 88px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: relative;
          z-index: 1;
        }

        /* Key stats grid */
        .clm-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 680px) {
          .clm-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .clm-stat-card {
          background: var(--clm-surface);
          border: 1px solid var(--clm-border);
          border-radius: 14px;
          padding: 18px 14px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .clm-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 14px 14px 0 0;
        }

        .clm-stat-value {
          font-family: 'Archivo Black', sans-serif;
          font-size: 26px;
          line-height: 1.1;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .clm-stat-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--clm-chalk);
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .clm-stat-sub {
          font-size: 10px;
          color: var(--clm-text-dim);
          line-height: 1.4;
        }

        /* Time domain chart */
        .clm-chart-card {
          background: var(--clm-surface);
          border: 1px solid var(--clm-border);
          border-radius: 16px;
          padding: 22px 22px 26px;
        }

        .clm-chart-title {
          font-family: 'Archivo Black', sans-serif;
          font-size: 14px;
          color: var(--clm-chalk);
          margin-bottom: 4px;
        }

        .clm-chart-sub {
          font-size: 12px;
          color: var(--clm-text-dim);
          margin-bottom: 22px;
        }

        .clm-bar-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .clm-bar-row:last-child { margin-bottom: 0; }

        .clm-bar-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--clm-chalk);
          width: 160px;
          flex-shrink: 0;
        }

        .clm-bar-track {
          flex: 1;
          height: 22px;
          background: var(--clm-surface2);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .clm-bar-fill {
          height: 100%;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding-left: 10px;
          min-width: 4px;
        }

        .clm-bar-time {
          font-family: 'Archivo Black', sans-serif;
          font-size: 11px;
          color: rgba(254,249,240,0.9);
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        /* Science cards */
        .clm-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
          gap: 18px;
        }
        @media (max-width: 500px) {
          .clm-cards-grid { grid-template-columns: 1fr; }
        }

        .clm-science-card {
          background: var(--clm-surface);
          border: 1px solid var(--clm-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .clm-card-header {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom-width: 1px;
          border-bottom-style: solid;
        }

        .clm-card-number {
          font-family: 'Archivo Black', sans-serif;
          font-size: 11px;
          letter-spacing: 0.08em;
          opacity: 0.55;
        }

        .clm-card-icon { font-size: 16px; }

        .clm-card-title {
          font-family: 'Archivo Black', sans-serif;
          font-size: 13px;
          letter-spacing: 0.005em;
          flex: 1;
        }

        .clm-findings {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .clm-finding {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--clm-border);
        }
        .clm-finding:last-child { border-bottom: none; padding-bottom: 0; }

        .clm-finding-meta {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .clm-finding-citation {
          font-size: 10px;
          font-weight: 600;
          color: var(--clm-text-dim);
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .clm-finding-stat {
          font-family: 'Archivo Black', sans-serif;
          font-size: 18px;
          line-height: 1;
          letter-spacing: -0.01em;
        }

        .clm-finding-stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--clm-chalk);
          opacity: 0.75;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .clm-finding-detail {
          font-size: 12px;
          color: var(--clm-text-dim);
          line-height: 1.65;
        }

        /* Hero SVG */
        .clm-hero-svg {
          margin: 0 auto 28px;
          display: block;
        }

        /* Citation footer */
        .clm-footer-cite {
          font-size: 11px;
          color: var(--clm-text-faint);
          text-align: center;
          line-height: 1.8;
        }
      `}} />

      <div className="clm-root">

        {/* ── Sticky header ──────────────────────────────────────────────────── */}
        <header className="clm-header">
          <div className="clm-header-inner">
            <Link href="/climbing" className="clm-back-btn" aria-label="Back">
              <ArrowLeft size={14} />
            </Link>
            <span className="clm-header-title">Competition Climbing Science</span>
            <span className="clm-header-badge">Olympic Disciplines</span>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="clm-hero">
          <div className="clm-hero-glow" />
          <div className="clm-hero-content">

            {/* Climbing wall SVG */}
            <svg
              className="clm-hero-svg"
              width="240"
              height="180"
              viewBox="0 0 240 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Wall background */}
              <rect x="20" y="10" width="200" height="165" rx="4" fill="#1a100a" stroke="#2e1a0e" strokeWidth="1.5" />

              {/* Wall texture lines */}
              <line x1="20" y1="50" x2="220" y2="50" stroke="#2e1a0e" strokeWidth="0.8" />
              <line x1="20" y1="90" x2="220" y2="90" stroke="#2e1a0e" strokeWidth="0.8" />
              <line x1="20" y1="130" x2="220" y2="130" stroke="#2e1a0e" strokeWidth="0.8" />
              <line x1="80" y1="10" x2="80" y2="175" stroke="#2e1a0e" strokeWidth="0.8" />
              <line x1="160" y1="10" x2="160" y2="175" stroke="#2e1a0e" strokeWidth="0.8" />

              {/* Climbing holds — orange/amber */}
              <circle cx="55"  cy="160" r="7" fill="#92400e" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="100" cy="140" r="6" fill="#b45309" stroke="#d97706" strokeWidth="1.2" />
              <circle cx="75"  cy="115" r="8" fill="#f97316" stroke="#fb923c" strokeWidth="1.2" />
              <circle cx="140" cy="125" r="6" fill="#92400e" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="60"  cy="85"  r="7" fill="#fbbf24" stroke="#fcd34d" strokeWidth="1.2" />
              <circle cx="120" cy="95"  r="5" fill="#b45309" stroke="#d97706" strokeWidth="1.2" />
              <circle cx="175" cy="105" r="7" fill="#f97316" stroke="#fb923c" strokeWidth="1.2" />
              <circle cx="95"  cy="65"  r="6" fill="#92400e" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="155" cy="72"  r="8" fill="#fbbf24" stroke="#fcd34d" strokeWidth="1.2" />
              <circle cx="45"  cy="45"  r="5" fill="#f97316" stroke="#fb923c" strokeWidth="1.2" />
              <circle cx="120" cy="40"  r="7" fill="#b45309" stroke="#d97706" strokeWidth="1.2" />
              <circle cx="190" cy="55"  r="6" fill="#92400e" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="70"  cy="28"  r="5" fill="#fbbf24" stroke="#fcd34d" strokeWidth="1.2" />
              <circle cx="180" cy="25"  r="6" fill="#f97316" stroke="#fb923c" strokeWidth="1.2" />

              {/* Hold detail notches */}
              <path d="M71 112 Q75 108 79 112" stroke="#fed7aa" strokeWidth="0.8" fill="none" />
              <path d="M152 68 Q155 64 158 68" stroke="#fed7aa" strokeWidth="0.8" fill="none" />
              <path d="M56 82 Q60 78 64 82" stroke="#fed7aa" strokeWidth="0.8" fill="none" />

              {/* Climber silhouette at mid-wall */}
              {/* Body */}
              <ellipse cx="108" cy="100" rx="7" ry="10" fill="#fef9f0" opacity="0.9" />
              {/* Head */}
              <circle cx="108" cy="87" r="5.5" fill="#fef9f0" opacity="0.9" />
              {/* Left arm reaching up-left to hold */}
              <line x1="102" y1="95" x2="78" y2="83" stroke="#fef9f0" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              {/* Right arm reaching up-right */}
              <line x1="114" y1="94" x2="138" y2="88" stroke="#fef9f0" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              {/* Left leg on lower hold */}
              <line x1="104" y1="108" x2="100" y2="125" stroke="#fef9f0" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <circle cx="100" cy="126" r="3" fill="#f97316" opacity="0.9" />
              {/* Right leg flagged out */}
              <line x1="112" y1="108" x2="132" y2="120" stroke="#fef9f0" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <circle cx="133" cy="121" r="3" fill="#f97316" opacity="0.9" />

              {/* Chalk cloud at left hand */}
              <ellipse cx="79" cy="82" rx="9" ry="5" fill="rgba(254,249,240,0.12)" />
              <ellipse cx="76" cy="79" rx="5" ry="3" fill="rgba(254,249,240,0.08)" />

              {/* Chalk cloud at right hand */}
              <ellipse cx="139" cy="87" rx="8" ry="4" fill="rgba(254,249,240,0.10)" />

              {/* Speed climbing timer indicator */}
              <rect x="168" y="150" width="44" height="18" rx="4" fill="rgba(249,115,22,0.18)" stroke="rgba(249,115,22,0.4)" strokeWidth="1" />
              <text x="190" y="163" textAnchor="middle" fill="#f97316" fontSize="9" fontWeight="bold" fontFamily="monospace">4.79 s</text>
            </svg>

            <h1 className="clm-hero-title">Competition<br />Climbing Science</h1>
            <p className="clm-hero-sub">
              Bouldering · Lead climbing · Speed climbing — Olympic discipline physiology,
              finger injury science, and mental performance research
            </p>

            <div className="clm-hero-disciplines">
              {[
                { label: 'Bouldering', bg: 'rgba(146,64,14,0.22)', border: 'rgba(146,64,14,0.45)', color: '#d97706' },
                { label: 'Lead Climbing', bg: 'rgba(180,83,9,0.22)', border: 'rgba(180,83,9,0.45)', color: '#f97316' },
                { label: 'Speed Climbing', bg: 'rgba(249,115,22,0.18)', border: 'rgba(249,115,22,0.40)', color: '#fbbf24' },
              ].map((d) => (
                <span
                  key={d.label}
                  className="clm-discipline-pill"
                  style={{ background: d.bg, border: `1px solid ${d.border}`, color: d.color }}
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <main className="clm-main">

          {/* ── Key stats ────────────────────────────────────────────────────── */}
          <div className="clm-stats-grid">
            {KEY_STATS.map((s) => (
              <div key={s.label} className="clm-stat-card" style={{ borderTopColor: s.color }}>
                <style dangerouslySetInnerHTML={{__html: ``}} />
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: s.color, borderRadius: '14px 14px 0 0',
                  }}
                />
                <p className="clm-stat-value" style={{ color: s.color }}>{s.value}</p>
                <p className="clm-stat-label">{s.label}</p>
                <p className="clm-stat-sub">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Olympic Format Time Domain Chart ─────────────────────────────── */}
          <div className="clm-chart-card">
            <h3 className="clm-chart-title">Olympic Climbing Format — Time Domains</h3>
            <p className="clm-chart-sub">Duration comparison across disciplines and training exercises</p>

            <div>
              {TIME_DOMAINS.map((d) => (
                <div key={d.discipline} className="clm-bar-row">
                  <span className="clm-bar-label">{d.discipline}</span>
                  <div className="clm-bar-track">
                    <div
                      className="clm-bar-fill"
                      style={{
                        width: `${d.barPct}%`,
                        background: `linear-gradient(90deg, ${d.color}, ${d.color}bb)`,
                        minWidth: d.barPct < 5 ? 52 : undefined,
                      }}
                    >
                      <span className="clm-bar-time">{d.display}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--clm-text-faint)', marginTop: 14 }}>
              Speed climbing world record 4.79 s · Bouldering problem 4 min · Lead route 6 min · Campus power endurance set ~30 s
            </p>
          </div>

          {/* ── Science cards ─────────────────────────────────────────────────── */}
          <div className="clm-cards-grid">
            {SCIENCE_CARDS.map((card) => (
              <div key={card.id} className="clm-science-card">
                <div
                  className="clm-card-header"
                  style={{
                    background: card.accentDim,
                    borderBottomColor: card.accentBorder,
                    borderLeft: `3px solid ${card.accent}`,
                  }}
                >
                  <span className="clm-card-number" style={{ color: card.accent }}>{card.number}</span>
                  <span className="clm-card-icon">{card.icon}</span>
                  <h3 className="clm-card-title" style={{ color: card.accent }}>{card.title}</h3>
                </div>

                <div className="clm-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="clm-finding">
                      <div className="clm-finding-meta">
                        <span className="clm-finding-citation">{f.citation}</span>
                      </div>
                      <span className="clm-finding-stat" style={{ color: card.accent }}>{f.stat}</span>
                      <span className="clm-finding-stat-label">{f.statLabel}</span>
                      <p className="clm-finding-detail">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Discipline comparison panel ──────────────────────────────────── */}
          <div
            style={{
              background: 'var(--clm-surface)',
              border: '1px solid var(--clm-border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--clm-border)',
                background: 'rgba(146,64,14,0.10)',
                borderLeft: '3px solid #92400e',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 13,
                  color: '#d97706',
                  margin: 0,
                }}
              >
                Olympic Combined Discipline Demands
              </h3>
              <p style={{ fontSize: 11, color: 'var(--clm-text-dim)', marginTop: 3 }}>
                Key physiological and technical contrasts across three Olympic climbing events
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--clm-surface2)' }}>
                    {['Discipline', 'Duration', 'Primary System', 'Key Physical Demand', 'Mental Demand'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--clm-text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: '1px solid var(--clm-border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      discipline: 'Bouldering',
                      duration: '4 min / problem',
                      system: 'Anaerobic alactic + glycolytic',
                      physical: 'Max finger strength, power',
                      mental: 'Problem-solving, composure',
                      color: '#92400e',
                    },
                    {
                      discipline: 'Lead Climbing',
                      duration: '6–8 min route',
                      system: 'Aerobic + local forearm',
                      physical: 'Forearm endurance, VO₂',
                      mental: 'Onsight beta-reading',
                      color: '#b45309',
                    },
                    {
                      discipline: 'Speed Climbing',
                      duration: '< 5 seconds',
                      system: 'PCr (phosphocreatine)',
                      physical: 'Leg power, contact speed',
                      mental: 'Automatisation, starts',
                      color: '#f97316',
                    },
                  ].map((row, i, arr) => (
                    <tr
                      key={row.discipline}
                      style={{
                        borderBottom: i < arr.length - 1 ? '1px solid var(--clm-border)' : 'none',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: row.color }}>
                        {row.discipline}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--clm-chalk)' }}>{row.duration}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--clm-text-dim)' }}>{row.system}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--clm-chalk)' }}>{row.physical}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--clm-text-dim)' }}>{row.mental}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Citation footer ───────────────────────────────────────────────── */}
          <p className="clm-footer-cite">
            Research references: MacLeod et al. 2007 · Vigouroux et al. 2006 · España-Romero et al. 2009 ·
            Schöffl et al. 2013 · Rohrbough et al. 2000 · Bollen 1988 · Pieber et al. 2012 ·
            Pijpers et al. 2003 · Laffaye et al. 2016 · Bertuzzi et al. 2012 ·
            IFSC World Records 2024 · Hörst 2016 (Training for Climbing) ·
            Moran 2012 (Sport and Exercise Psychology) · Goddard & Neumann 1993
          </p>
        </main>
      </div>
    </>
  )
}
