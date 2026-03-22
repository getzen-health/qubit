// Lacrosse Science — static server component
// Evidence-based lacrosse physiology covering running demands, shooting biomechanics,
// collision & injury science, and box vs field lacrosse differences.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Lacrosse Science' }

// ─── Distance by Position (GPS data) ─────────────────────────────────────────

const POSITION_DISTANCE = [
  { pos: 'Midfield', km: 9.2, display: '9.2 km', color: '#7b2d8b', barPct: 100 },
  { pos: 'Attack',   km: 7.8, display: '7.8 km', color: '#c0392b', barPct: 85  },
  { pos: 'Defence',  km: 7.1, display: '7.1 km', color: '#f39c12', barPct: 77  },
  { pos: 'Goalkeeper', km: 2.4, display: '2.4 km', color: '#5a3e6b', barPct: 26  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '7–10 km', label: 'Per Match Distance' },
  { value: '145 km/h', label: 'Max Shot Speed' },
  { value: '55–65', label: 'VO\u2082max mL/kg/min' },
  { value: '3–5', label: 'Concussions per 1000 AE' },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'running',
    number: '01',
    title: 'Running Profile & Physical Demands',
    accent: '#7b2d8b',
    icon: '🏃',
    findings: [
      {
        citation: 'Vescovi 2011 — J Strength Cond Res',
        stat: '7–10 km',
        statLabel: 'Total match distance by position',
        detail: 'GPS tracking of elite NCAA lacrosse players established total match distances of 7.1–9.8 km. Midfielders cover the greatest distance (avg 9.2 km) due to end-to-end transition responsibilities; attackers average 7.8 km and defenders 7.1 km. Goalkeepers cover just 2.4 km but perform highly intense short-distance movements within the crease. Field coverage is non-uniform — all positions spend 38–44% of time at high metabolic load, interspersed with recovery bouts at <10 km/h.',
      },
      {
        citation: 'Muir 2017 — Int J Sports Physiol Perform',
        stat: '1,500–2,500 m',
        statLabel: 'High-intensity running (>18 km/h) per match',
        detail: 'Elite men\'s field lacrosse GPS analysis found high-intensity running above 18 km/h accounts for 1,500–2,500 m of match distance. Midfielders perform the greatest high-speed volume. Sprint frequency averaged 35–55 maximal efforts per match, predominantly 2–4 s in duration over 15–30 m. Repeated sprint ability (RSA) — maintaining sprint performance across short rest intervals — is the primary physical differentiator between elite and sub-elite midfielders, predicting performance more strongly than VO₂max alone.',
      },
      {
        citation: 'Hoffman 1992 + NSCA Position Statement',
        stat: '80–92%',
        statLabel: 'HRmax during active play',
        detail: 'Elite male lacrosse players exhibit VO₂max values of 57–65 mL/kg/min; elite women 52–60 mL/kg/min — approaching field hockey and soccer benchmarks. Heart rate during active play tracks at 80–92% HRmax (157–183 bpm for a 25-year-old). Higher VO₂max directly enables faster lactate clearance during brief recovery windows: midfielders with VO₂max >62 mL/kg/min maintain sprint peak power within 8% of first-half values through the fourth quarter, vs a 15–22% decline in lower-aerobic-capacity players.',
      },
      {
        citation: 'Scott 2019 — Int J Sports Physiol Perform',
        stat: '35–55',
        statLabel: 'Maximal sprints per match',
        detail: 'Positional sprint frequency data from GPS-tracked elite men\'s lacrosse: attackers 38 ± 8 maximal sprints, midfielders 52 ± 11, defenders 36 ± 7. Sprints were defined as efforts exceeding 95% of individual maximum velocity. Work:rest ratios averaged 1:3 for attackers and 1:2.5 for midfielders — confirming the alactic-aerobic hybrid energy demand. Elite male attackers reached peak velocities of 28–31 km/h during fastbreaks. Sprint deceleration forces (2.5–4.0 × body mass) create high lower-limb eccentric loading that underpins overuse injury risk.',
      },
    ],
  },
  {
    id: 'biomechanics',
    number: '02',
    title: 'Shooting Biomechanics & Stick Skills',
    accent: '#c0392b',
    icon: '🥍',
    findings: [
      {
        citation: 'Knapp 2016 — Sports Biomech',
        stat: '120–145 km/h',
        statLabel: 'Elite overhand shot velocity',
        detail: 'Radar-gun measurements of elite NCAA men\'s lacrosse players recorded overhand shot velocities of 120–145 km/h (74–90 mph). The overhand shot relies on a sequential kinetic chain: hip-shoulder separation of 40–55° at stride foot contact, followed by core rotation peaking at 700–900°/s, then terminal wrist snap and flexion generating the final 15–25% of ball velocity. Elite shooters achieve ball release within 0.18–0.22 s of loading position — a critical speed advantage against anticipating goalies. Women\'s elite velocities range 100–125 km/h due to lighter sticks and differing mechanics.',
      },
      {
        citation: 'Cradling mechanics — biomechanical analysis',
        stat: '4–6 m/s²',
        statLabel: 'Centripetal acceleration keeping ball in pocket',
        detail: 'Cradling exploits centripetal acceleration to retain the ball in the mesh pocket without a closed hand. At typical cradling frequency of 2–3 cycles/s, the ball experiences approximately 4–6 m/s² centripetal acceleration directed toward the pocket centre — enough to overcome gravity during moderate lateral lean. Wrist supination-pronation and elbow flexion-extension co-activate at 60–80 cycles/min during evasive movement. Ball-retention failure increases sharply when centripetal acceleration drops below ~3 m/s², occurring at very low cradling speed or upon stick-check contact disrupting angular momentum.',
      },
      {
        citation: 'Lapinski 2018 — J Appl Biomech',
        stat: '+18 km/h',
        statLabel: 'Overhand vs cross-body velocity advantage',
        detail: 'Overhand throws produce significantly higher velocity (average +18 km/h) and accuracy over 15–40 m ranges compared to cross-body or sidearm mechanics. However, cross-body mechanics offer faster release time (<0.15 s) in tight traffic situations where shooting angle is constrained. Kinetic chain contributions to overhand lacrosse throws: hip-shoulder separation 28–35% of total velocity; trunk rotation 35–45%; arm mechanics (elbow extension + wrist roll) 25–30%. Asymmetric dominant-side development is common — shoulder internal rotation strength exceeds non-dominant by 15–25% in collegiate players, increasing posterior capsule injury risk.',
      },
      {
        citation: 'Visual anticipation research — goalie biomechanics',
        stat: '0.18 s',
        statLabel: 'Flight time from 7 m at elite shot speed',
        detail: 'An elite shot at 140 km/h from a 7 m shooting distance reaches the goal face in approximately 0.18 s — at the lower bound of average simple visual reaction time (0.18–0.22 s). Lacrosse goalies must therefore initiate movement before ball release, relying on anticipatory postural cues. Research on elite goalies shows anticipatory saccades toward likely release zones beginning 80–110 ms before stick contact with ball. Trained pattern recognition accounts for 60–70% of successful saves; raw reaction speed contributes only 30–40%. Stick-head loading position and hip orientation are the primary predictive cues trained in elite goalkeeping programmes.',
      },
    ],
  },
  {
    id: 'injury',
    number: '03',
    title: 'Collision Demands & Injury Science',
    accent: '#f39c12',
    icon: '🛡️',
    findings: [
      {
        citation: 'Covassin 2012 — Am J Sports Med',
        stat: '3–5',
        statLabel: 'Concussions per 1,000 athlete-exposures',
        detail: 'NCAA surveillance data found concussion incidence of 3.1–4.9 per 1,000 athlete-exposures (AEs) in men\'s lacrosse — among the highest rates in collision sports. Women\'s lacrosse — despite minimal contact rules — showed 2.5–3.6 per 1,000 AEs due to stick contact with the head and ball impacts. The 2016 NOCSAE lacrosse helmet standard update reduced peak laboratory linear acceleration by 18%; field studies suggest an 8–12% concussion incidence reduction in the following four seasons. Sideline assessment using SCAT5 is now the standard protocol at NCAA and NLL levels.',
      },
      {
        citation: 'Body checking biomechanics — NCAA & NLL data',
        stat: '18–45 G',
        statLabel: 'Head linear acceleration per body check',
        detail: 'Accelerometer data from men\'s NCAA field lacrosse shows body checks produce 18–45 G head linear acceleration on the receiving player, below typical concussion thresholds (>75 G linear) but contributing to sub-concussive cumulative exposure. Box lacrosse players execute 2–3× more body checks per minute than field lacrosse due to the smaller 60 × 27 m court and board-contact mechanics analogous to ice hockey. Shoulder injuries account for 14–18% of all lacrosse injuries — the majority from checking contact and falls. Acromioclavicular joint sprains (Grade I–III) are the most common specific shoulder diagnosis.',
      },
      {
        citation: 'Joseph 2013 — Sports Health',
        stat: '2.6×',
        statLabel: 'ACL injury rate excess in women vs men',
        detail: 'ACL injury rate in women\'s lacrosse was 0.18 per 1,000 AEs — 2.6× higher than men\'s lacrosse (0.07/1,000 AEs). The majority of women\'s ACL injuries are non-contact, occurring during cutting and landing with knee valgus collapse. Contributing anatomical and neuromuscular factors include greater hip adduction during deceleration, lower hamstring-to-quadriceps strength ratios, and wider Q-angle geometry. Neuromuscular prevention programs (FIFA 11+, Sportsmetrics, KLIPS) reduce ACL incidence by 50–65% when implemented 3×/week pre-season across 8–10 weeks — the strongest evidence-based intervention available for women\'s lacrosse programmes.',
      },
      {
        citation: 'McCrory 2023 — Br J Sports Med (6th Consensus)',
        stat: '6 days',
        statLabel: 'Minimum graduated return-to-play protocol',
        detail: 'The 6th International Consensus on Concussion in Sport mandates a minimum 6-day graduated return-to-play protocol: Day 1 symptom-limited cognitive rest; Day 2 light aerobic walking; Day 3 sport-specific movement; Day 4 non-contact drills; Day 5 full-contact practice; Day 6 return to competition. Vestibulo-ocular rehabilitation is increasingly integrated into lacrosse concussion recovery due to high visual-tracking demands (ball pursuit, opponent scanning). Impaired smooth pursuit eye movement on post-concussion assessment correlates with prolonged recovery exceeding 14 days and is a contraindication to stage progression in lacrosse-specific return-to-play protocols.',
      },
    ],
  },
  {
    id: 'boxvsfield',
    number: '04',
    title: 'Box vs Field Lacrosse Science',
    accent: '#7b2d8b',
    icon: '📊',
    findings: [
      {
        citation: 'Court dimensions & shot clock — NLL / World Lacrosse',
        stat: '3.6×',
        statLabel: 'Field lacrosse surface area vs box lacrosse',
        detail: 'Box lacrosse (indoor) is played on a hockey-rink surface (60 × 27 m = 1,620 m²); field lacrosse uses 100 × 55 m (5,500 m²) — a 3.4× larger playing area. The compression of space in box lacrosse dramatically reduces average ball possession time from 8–12 s (field) to 3–5 s (box) and forces a mandatory 30-second shot clock, compared to no shot clock in traditional field lacrosse (NCAA). Transition speed requirements differ fundamentally: field fastbreaks span 60–80 m over 8–12 s; box transitions cover 20–30 m in 3–5 s, emphasising explosive acceleration and immediate decision-making above all else.',
      },
      {
        citation: 'Petersen 2009 — NSCA + NLL physiological data',
        stat: '>90% HRmax',
        statLabel: 'Sustained intensity in box lacrosse',
        detail: 'Box lacrosse players maintain >90% HRmax for 65–75% of playing time — comparable to ice hockey and far exceeding field lacrosse (80–92% HRmax, 40–55% of time). Blood lactate measurements during NLL games peak at 10–14 mmol/L (box) vs 6–9 mmol/L in field lacrosse. This confirms box lacrosse as primarily an anaerobic glycolytic sport with continuous high-intensity work, while field lacrosse operates in a mixed aerobic-anaerobic zone. VO₂max requirements reflect this: elite box players 60–68 mL/kg/min; field lacrosse 55–65 mL/kg/min. Both formats demand excellent anaerobic power; box demands substantially higher sustained anaerobic capacity.',
      },
      {
        citation: 'NLL scoring data 2019–2023 / NCAA D1 field data 2018–2023',
        stat: '10–20',
        statLabel: 'Goals per game in box vs 8–15 in field',
        detail: 'NLL box lacrosse averages 10–20 combined goals per game (2019–2023 season data); NCAA D1 field lacrosse averages 8–15 combined goals per game (2018–2023). The higher box lacrosse scoring rate reflects smaller goal area, closer shooting distances (avg 8–10 m vs 12–18 m in field), and constant fast-break opportunities from the compact surface and boards. Box goalies face 35–55 shots per game vs field goalies 18–30. Shot-save percentage is consequently lower in box (~68% vs ~78% in field lacrosse), and goalkeeping technique — particularly butterfly-style low saves — is more analogous to ice hockey than field lacrosse.',
      },
      {
        citation: 'Positional science — NLL player tracking & field GPS',
        stat: '5-player',
        statLabel: 'Box lacrosse rotation (no positional limits)',
        detail: 'Field lacrosse enforces strict positional boundaries — 3 attackers, 3 midfielders, and 3 defenders must respect the midfield line, creating clear role specialisation. Box lacrosse uses a 5-player rotation with no positional restrictions and continuous line changes (analogous to ice hockey), demanding full offensive and defensive competency from every skater. Physical profiling reflects this: box lacrosse players are typically more similar across the roster in strength and anaerobic power, while field lacrosse shows wide physical divergence between midfielder (highest VO₂max, RSA), attacker (highest shot velocity, agility), and defenseman (highest body mass, stick-check strength) profiles.',
      },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function LacrosseSciencePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

        :root {
          --lac-deep:    #1a0a2e;
          --lac-purple:  #7b2d8b;
          --lac-crimson: #c0392b;
          --lac-gold:    #f39c12;
          --lac-text:    #f0e6ff;
        }

        .lac-root {
          font-family: 'Chakra Petch', sans-serif;
          background: var(--lac-deep);
          color: var(--lac-text);
          min-height: 100vh;
        }

        /* ── hero ── */
        .lac-hero {
          position: relative;
          overflow: hidden;
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(160deg, #0e0520 0%, #1a0a2e 40%, #2a0a1e 100%);
        }

        .lac-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 50%, rgba(123,45,139,0.25) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 80% 50%, rgba(192,57,43,0.20) 0%, transparent 70%);
          pointer-events: none;
        }

        .lac-hero-svg {
          position: absolute;
          right: 4%;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.08;
          width: min(420px, 45vw);
          pointer-events: none;
        }

        .lac-back {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--lac-gold);
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1.8rem;
          opacity: 0.85;
          transition: opacity 0.2s;
        }
        .lac-back:hover { opacity: 1; }

        .lac-eyebrow {
          position: relative;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--lac-gold);
          margin-bottom: 0.75rem;
        }

        .lac-hero-title {
          position: relative;
          font-size: clamp(2.2rem, 6vw, 4rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0 0 1rem;
          background: linear-gradient(135deg, #f0e6ff 0%, var(--lac-gold) 55%, var(--lac-crimson) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lac-hero-sub {
          position: relative;
          max-width: 580px;
          margin: 0 auto 2.5rem;
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(240,230,255,0.7);
          font-style: italic;
        }

        /* ── key stats grid ── */
        .lac-stats-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          max-width: 540px;
          margin: 0 auto;
          border: 1px solid rgba(123,45,139,0.4);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(123,45,139,0.15);
        }

        .lac-stat-cell {
          padding: 1.1rem 0.8rem;
          text-align: center;
          background: rgba(26,10,46,0.6);
          backdrop-filter: blur(8px);
        }

        .lac-stat-val {
          font-size: 1.7rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
          background: linear-gradient(135deg, var(--lac-gold), var(--lac-crimson));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.3rem;
        }

        .lac-stat-lbl {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240,230,255,0.55);
        }

        /* ── chart section ── */
        .lac-section {
          max-width: 860px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        .lac-section-title {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--lac-purple);
          margin-bottom: 1.5rem;
        }

        .lac-chart-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(123,45,139,0.25);
          border-radius: 16px;
          padding: 1.8rem 1.6rem;
        }

        .lac-chart-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--lac-text);
          margin-bottom: 0.3rem;
        }

        .lac-chart-sub {
          font-size: 0.72rem;
          color: rgba(240,230,255,0.45);
          margin-bottom: 1.6rem;
        }

        .lac-bar-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.9rem;
        }

        .lac-bar-pos {
          width: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(240,230,255,0.8);
          flex-shrink: 0;
          text-align: right;
        }

        .lac-bar-track {
          flex: 1;
          height: 22px;
          background: rgba(255,255,255,0.05);
          border-radius: 6px;
          overflow: hidden;
        }

        .lac-bar-fill {
          height: 100%;
          border-radius: 6px;
          display: flex;
          align-items: center;
          padding-left: 8px;
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          transition: width 0.8s ease;
        }

        /* ── science cards ── */
        .lac-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
          gap: 1.25rem;
        }

        .lac-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(123,45,139,0.2);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .lac-card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 1.4rem 1.4rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .lac-card-num {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(240,230,255,0.3);
          margin-bottom: 0.2rem;
        }

        .lac-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--lac-text);
          line-height: 1.25;
        }

        .lac-card-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .lac-findings {
          padding: 0.8rem 1.4rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .lac-finding {
          padding-bottom: 1.1rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .lac-finding:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .lac-finding-citation {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240,230,255,0.35);
          margin-bottom: 0.35rem;
        }

        .lac-finding-stat-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
          flex-wrap: wrap;
        }

        .lac-finding-stat {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .lac-finding-stat-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(240,230,255,0.55);
        }

        .lac-finding-detail {
          font-size: 0.78rem;
          line-height: 1.65;
          color: rgba(240,230,255,0.62);
          font-style: italic;
        }

        /* ── footer ── */
        .lac-footer {
          text-align: center;
          padding: 3rem 1.5rem 4rem;
          font-size: 0.68rem;
          color: rgba(240,230,255,0.25);
          letter-spacing: 0.08em;
          line-height: 1.8;
          border-top: 1px solid rgba(123,45,139,0.15);
        }

        @media (min-width: 640px) {
          .lac-stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .lac-bar-pos {
            width: 120px;
          }
        }
      `}</style>

      <div className="lac-root">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <header className="lac-hero">

          {/* Lacrosse stick SVG silhouette */}
          <svg className="lac-hero-svg" viewBox="0 0 300 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Stick shaft */}
            <rect x="142" y="160" width="16" height="420" rx="8" fill="white"/>
            {/* Stick head (pocket frame) */}
            <ellipse cx="150" cy="95" rx="42" ry="22" stroke="white" strokeWidth="10" fill="none"/>
            <line x1="150" y1="73" x2="150" y2="160" stroke="white" strokeWidth="10"/>
            {/* Mesh cross-lines (simplified) */}
            <line x1="112" y1="90" x2="188" y2="100" stroke="white" strokeWidth="3" opacity="0.5"/>
            <line x1="112" y1="100" x2="188" y2="90" stroke="white" strokeWidth="3" opacity="0.5"/>
            {/* Ball */}
            <circle cx="150" cy="55" r="22" fill="white" opacity="0.9"/>
            {/* Ball seam lines */}
            <path d="M132 48 Q150 62 168 48" stroke="#1a0a2e" strokeWidth="2.5" fill="none"/>
            <path d="M132 62 Q150 48 168 62" stroke="#1a0a2e" strokeWidth="2.5" fill="none"/>
          </svg>

          <Link href="/" className="lac-back">
            <ArrowLeft size={13} />
            Back
          </Link>

          <p className="lac-eyebrow">Sport Science Series</p>
          <h1 className="lac-hero-title">Lacrosse Science</h1>
          <p className="lac-hero-sub">
            The physiology of North America's fastest sport — from GPS running profiles
            and 145 km/h shooting mechanics to box vs field energy demands
            and the biomechanics of cradling.
          </p>

          {/* Key stats */}
          <div className="lac-stats-grid">
            {KEY_STATS.map(s => (
              <div key={s.label} className="lac-stat-cell">
                <div className="lac-stat-val">{s.value}</div>
                <div className="lac-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Distance Chart ────────────────────────────────────────────────── */}
        <section className="lac-section">
          <p className="lac-section-title">GPS Analysis</p>
          <div className="lac-chart-card">
            <p className="lac-chart-title">Distance Covered by Position Per Match</p>
            <p className="lac-chart-sub">Elite field lacrosse GPS data — Vescovi 2011, Scott 2019</p>
            {POSITION_DISTANCE.map(d => (
              <div key={d.pos} className="lac-bar-row">
                <div className="lac-bar-pos">{d.pos}</div>
                <div className="lac-bar-track">
                  <div
                    className="lac-bar-fill"
                    style={{
                      width: `${d.barPct}%`,
                      background: `linear-gradient(90deg, ${d.color}cc, ${d.color})`,
                    }}
                  >
                    {d.display}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Science Cards ─────────────────────────────────────────────────── */}
        <section className="lac-section" style={{ paddingTop: 0 }}>
          <p className="lac-section-title">Evidence-Based Findings</p>
          <div className="lac-cards-grid">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="lac-card">
                <div className="lac-card-header">
                  <div>
                    <div className="lac-card-num">{card.number}</div>
                    <div className="lac-card-title">{card.title}</div>
                  </div>
                  <div className="lac-card-icon" role="img" aria-label={card.title}>
                    {card.icon}
                  </div>
                </div>
                <div className="lac-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="lac-finding">
                      <div className="lac-finding-citation">{f.citation}</div>
                      <div className="lac-finding-stat-row">
                        <span className="lac-finding-stat" style={{ color: card.accent }}>
                          {f.stat}
                        </span>
                        <span className="lac-finding-stat-lbl">{f.statLabel}</span>
                      </div>
                      <p className="lac-finding-detail">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="lac-footer">
          <p>
            Sources: Vescovi 2011 (J Strength Cond Res) · Muir 2017 (Int J Sports Physiol Perform) ·
            Hoffman 1992 (NSCA) · Scott 2019 (IJSPP) · Knapp 2016 (Sports Biomech) ·
            Lapinski 2018 (J Appl Biomech) · Covassin 2012 (Am J Sports Med) ·
            Joseph 2013 (Sports Health) · McCrory 2023 (Br J Sports Med) ·
            Petersen 2009 (NSCA) · NLL Season Data 2019–2023 · NCAA D1 Statistics 2018–2023
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            KQuarks Sport Science · Data is educational only and does not constitute medical advice.
          </p>
        </footer>

      </div>
    </>
  )
}
