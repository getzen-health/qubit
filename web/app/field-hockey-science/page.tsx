// Field Hockey Science — static server component
// Evidence-based field hockey physiology covering GPS running demands, stick skill
// biomechanics, physical conditioning & injury science, and tactical team science.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Field Hockey Science' }

// ─── Distance by Position (GPS data) ─────────────────────────────────────────

const POSITION_DISTANCE = [
  { pos: 'Midfielder', km: 12.1, display: '12.1 km', color: '#ea580c', barPct: 100 },
  { pos: 'Forward',    km: 10.2, display: '10.2 km', color: '#15803d', barPct: 84  },
  { pos: 'Defender',   km: 9.6,  display: '9.6 km',  color: '#ea580c', barPct: 79  },
  { pos: 'Goalkeeper', km: 4.1,  display: '4.1 km',  color: '#15803d', barPct: 34  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '9–13 km',  label: 'Per Match Distance' },
  { value: '150 km/h', label: 'Drag Flick Speed' },
  { value: '82–91%',   label: 'HRmax During Play' },
  { value: '22–32%',   label: 'Penalty Corner Conv.' },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'running',
    number: '01',
    title: 'Running Profile & GPS Demands',
    accent: '#ea580c',
    icon: '🏑',
    findings: [
      {
        citation: 'Jennings 2012 — GPS, International Field Hockey',
        stat: '9–13 km',
        statLabel: 'Per match on synthetic turf',
        detail: 'Elite players cover 9–13 km per match on synthetic turf. High-intensity running (>18 km/h): 2,000–3,500 m per match. Positional differences: midfielders highest total distance (11–13 km); defenders 9–10 km; forwards 9–11 km but highest sprint count. Match format: 4 × 15-minute quarters (since 2014 rule change), creating clear intensity variations between quarters.',
      },
      {
        citation: 'Macutkiewicz 2011 — Elite Field Hockey Sprint Analysis',
        stat: '40–60',
        statLabel: 'Maximal sprint efforts per match',
        detail: 'Elite field hockey players perform 40–60 sprint efforts per match. Sprint duration: 2–4 s. Repeated sprint ability (RSA) test: 6 × 30 m sprints with 20 s recovery — elite performance <4.5 s per sprint. High-intensity running represents 18–22% of total match distance. Work:rest ratio approximately 1:3 overall but 1:1 during intense phases.',
      },
      {
        citation: 'MacLeod 2007 — Physiological Demands of Elite Field Hockey',
        stat: '82–91%',
        statLabel: 'HRmax sustained across quarters',
        detail: 'Heart rate during elite field hockey sustained at 82–91% HRmax. Blood lactate: 4–7 mmol/L. VO₂max requirements: midfielders 60–68 mL/kg/min; defenders/forwards 55–63 mL/kg/min. Quarter 3 typically shows highest HR (accumulated fatigue + tactical intensity). Synthetic turf vs. natural grass: turf increases total distance 8–12% due to more consistent surface.',
      },
      {
        citation: 'Penalty Corner Physiology — Goalkeeper Demands',
        stat: '90–110 ms',
        statLabel: 'Goalkeeper reaction window for drag-flick',
        detail: 'Penalty corners (15–20 per match average): goalkeeper must react to drag-flick shots within 90–110 ms. Goalkeeper HR: 75–88% HRmax — lower than field players but with extreme peak intensities during set pieces. Leg pad weight: 4–6 kg per leg, significantly increasing metabolic cost of movement.',
      },
    ],
  },
  {
    id: 'biomechanics',
    number: '02',
    title: 'Stick Skill Biomechanics',
    accent: '#15803d',
    icon: '🏒',
    findings: [
      {
        citation: 'Chivers 2011 — Drag-Flick Biomechanics, Penalty Corner',
        stat: '130–150 km/h',
        statLabel: 'Drag-flick ball speed at penalty corner',
        detail: 'Penalty corner drag-flick injection generates ball speeds of 130–150 km/h from the top of the circle. Kinetic chain: run-up → low stick position → sweeping drag motion → wrist snap at release. Flicker\'s approach velocity: 5–7 m/s contributing 30–35% of total ball speed. Wrist radial deviation at release generates final acceleration.',
      },
      {
        citation: '3D Hit Mechanics — Field Hockey Biomechanics Research',
        stat: '160–180 km/h',
        statLabel: 'Peak ball speed in slap-hit technique',
        detail: 'The 3D hit (hockey-specific flat-stick strike): trunk rotation 400–500°/s, shoulder internal rotation, wrist snap generating 160–180 km/h. Reverse-stick reverse hit: increasingly used in modern hockey — opposite side of blade, enabling attacking from all angles. Stick weight: 500–560 g with J-hook head design creating specific aerodynamic and contact properties.',
      },
      {
        citation: '3D Game Evolution — Elite International Transition Analysis',
        stat: '25–35%',
        statLabel: 'Of elite transitions using aerial balls',
        detail: '3D game evolution: aerial balls (lifted passes) requiring recipients to control balls dropping at 12–15 m/s. Catching mechanics on the move, stick presentation angle for trap, body repositioning. Aerial balls now used in 25–35% of transitions in elite international hockey, fundamentally changing defensive and attacking structure.',
      },
      {
        citation: 'Indian Dribble & 3D Skills — Elite Dribbling Analysis',
        stat: '4–6 Hz',
        statLabel: 'Stick rotation frequency in Indian dribble',
        detail: 'The traditional Indian dribble (alternating forehand-backhand stick rotation while running): stick rotation frequency 4–6 Hz in elite dribblers, evasion of pressure, ball protection mechanics. Modern 3D skills: lifts, \'jink\' moves, toe drag — requiring wrist pronation-supination at 400–600°/s.',
      },
    ],
  },
  {
    id: 'injury',
    number: '03',
    title: 'Physical Conditioning & Injury',
    accent: '#ea580c',
    icon: '🩹',
    findings: [
      {
        citation: 'Malisoux 2015 — Synthetic Turf & ACL Injury Risk',
        stat: '3–5',
        statLabel: 'ACL injuries per 100 player-seasons',
        detail: 'Synthetic turf increases ACL injury risk 20–30% vs. natural grass — higher traction, altered foot-surface interface. Field hockey ACL mechanisms: cutting/pivoting under defensive pressure, stick checking distraction. Female players: 2–3× higher ACL rate than male players. Prevention: Nordic hamstring program reduces ACL risk 50% in randomised controlled trials.',
      },
      {
        citation: 'Field Hockey Upper Extremity Injury Epidemiology',
        stat: '15–20%',
        statLabel: 'Shoulder injuries from stick contact',
        detail: 'Upper extremity injuries from stick contact, high velocity ball impact (160+ km/h), and overhead trapping. Goalkeeper-specific: wrist and hand injuries from shot blocking. Dental injuries: mouthguard compliance significantly reduces dental trauma from stick/ball contact at match speed.',
      },
      {
        citation: 'Lumbar Demands — Elite Field Hockey Postural Analysis',
        stat: '35–45%',
        statLabel: 'Elite players with chronic lower back pain',
        detail: 'Chronic lower back pain in 35–45% of elite field hockey players — attributable to sustained trunk flexion during play (stick must contact ground-level ball). Ergonomic research suggests 40° forward trunk lean as a prolonged postural stressor. Core strengthening and periodic postural reset protocols recommended.',
      },
      {
        citation: 'Synthetic Surface Abrasion — Field Hockey Epidemiology',
        stat: '60–70%',
        statLabel: 'Players sustaining turf burns per season',
        detail: 'Synthetic Astroturf abrasion injuries affecting 60–70% of players per season. Prevention: compression garments, padded shin guards extending beyond knee. Infection risk from abrasion wounds on artificial surface. Skin protection protocols in elite environments reduce severity and recurrence.',
      },
    ],
  },
  {
    id: 'tactical',
    number: '04',
    title: 'Tactical & Team Science',
    accent: '#15803d',
    icon: '📊',
    findings: [
      {
        citation: 'Elite International Hockey — Set Piece Conversion Data',
        stat: '22–32%',
        statLabel: 'Penalty corner conversion rate',
        detail: 'Set piece conversion rates in elite international hockey: penalty corners convert at 22–32% of injections. Injector run-up speed → flicker timing → deflection/shot coordination. Defensive slide timing: 0.8–1.0 s from injection to shot — requiring precisely coordinated team rush from the defensive circle.',
      },
      {
        citation: 'GPS Pressing Demands — Modern Field Hockey Tactics',
        stat: '+15%',
        statLabel: 'High-intensity distance increase with high press',
        detail: 'Modern pressing tactics in field hockey — high press requiring 15% more high-intensity running than mid-block defence. Counter-press immediately after ball loss. Physical requirements of sustained pressing: RSA and high aerobic capacity are the primary fitness determinants of pressing effectiveness over 60-minute matches.',
      },
      {
        citation: 'Self-Pass Rule 2009 — FIH Rule Change Impact Analysis',
        stat: '12–15%',
        statLabel: 'Ball-in-play time increase post rule change',
        detail: 'The self-pass rule allowing direct self-pass from free hits transformed tactical tempo, increasing game speed and reducing stoppages. Average ball-in-play time increased 12–15% post-rule change. Physical consequence: higher sustained intensity and reduced recovery windows for all positions across all four quarters.',
      },
      {
        citation: 'Performance Analysis — Elite Field Hockey GPS & Video',
        stat: '400–600',
        statLabel: 'Video clips reviewed per week at elite level',
        detail: 'Modern performance analysis in field hockey: GPS data combined with video, heat maps, pressing triggers, transition speed analysis. Physical data informing tactical decisions — high-load players tactically rotated in high-press sequences to manage acute workload and minimise injury risk during congested match schedules.',
      },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function FieldHockeySciencePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');

        :root {
          --fh-dark:   #0a1a08;
          --fh-orange: #ea580c;
          --fh-green:  #15803d;
          --fh-grass:  #bbf7d0;
          --fh-text:   #fff7ed;
        }

        .fh-root {
          font-family: 'Montserrat', sans-serif;
          background: var(--fh-dark);
          color: var(--fh-text);
          min-height: 100vh;
        }

        /* ── hero ── */
        .fh-hero {
          position: relative;
          overflow: hidden;
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(160deg, #050f04 0%, #0a1a08 45%, #0f2a0c 100%);
        }

        .fh-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 65% 45% at 15% 50%, rgba(21,128,61,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 55% 40% at 85% 45%, rgba(234,88,12,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        /* turf line decoration */
        .fh-hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--fh-green), var(--fh-orange), var(--fh-green), transparent);
          opacity: 0.6;
        }

        .fh-hero-svg {
          position: absolute;
          right: 3%;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.09;
          width: min(380px, 42vw);
          pointer-events: none;
        }

        .fh-back {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--fh-grass);
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          margin-bottom: 1.8rem;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .fh-back:hover { opacity: 1; }

        .fh-eyebrow {
          position: relative;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--fh-orange);
          margin-bottom: 0.8rem;
        }

        .fh-hero-title {
          position: relative;
          font-size: clamp(2.4rem, 6.5vw, 4.2rem);
          font-weight: 800;
          line-height: 1.03;
          letter-spacing: -0.025em;
          margin: 0 0 1rem;
          background: linear-gradient(135deg, var(--fh-text) 0%, var(--fh-grass) 45%, var(--fh-orange) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .fh-hero-sub {
          position: relative;
          max-width: 560px;
          margin: 0 auto 2.5rem;
          font-size: 0.93rem;
          line-height: 1.72;
          color: rgba(255,247,237,0.65);
          font-weight: 400;
          font-style: italic;
        }

        /* ── key stats grid ── */
        .fh-stats-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          max-width: 560px;
          margin: 0 auto;
          border: 1px solid rgba(21,128,61,0.45);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(21,128,61,0.12);
        }

        .fh-stat-cell {
          padding: 1.15rem 0.9rem;
          text-align: center;
          background: rgba(10,26,8,0.65);
          backdrop-filter: blur(8px);
        }

        .fh-stat-val {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          background: linear-gradient(135deg, var(--fh-orange), #f97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.3rem;
        }

        .fh-stat-lbl {
          font-size: 0.63rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,247,237,0.5);
        }

        /* ── sections ── */
        .fh-section {
          max-width: 880px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        .fh-section-title {
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--fh-green);
          margin-bottom: 1.5rem;
        }

        /* ── chart card ── */
        .fh-chart-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(21,128,61,0.28);
          border-radius: 16px;
          padding: 1.8rem 1.6rem;
        }

        .fh-chart-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--fh-text);
          margin-bottom: 0.28rem;
        }

        .fh-chart-sub {
          font-size: 0.7rem;
          color: rgba(255,247,237,0.4);
          margin-bottom: 1.6rem;
        }

        .fh-bar-row {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.95rem;
        }

        .fh-bar-pos {
          width: 100px;
          font-size: 0.74rem;
          font-weight: 600;
          color: rgba(255,247,237,0.78);
          flex-shrink: 0;
          text-align: right;
        }

        .fh-bar-track {
          flex: 1;
          height: 24px;
          background: rgba(255,255,255,0.05);
          border-radius: 6px;
          overflow: hidden;
        }

        .fh-bar-fill {
          height: 100%;
          border-radius: 6px;
          display: flex;
          align-items: center;
          padding-left: 9px;
          font-size: 0.67rem;
          font-weight: 700;
          color: rgba(255,255,255,0.92);
          transition: width 0.8s ease;
        }

        /* ── science cards grid ── */
        .fh-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
          gap: 1.25rem;
        }

        .fh-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(21,128,61,0.22);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s;
        }
        .fh-card:hover {
          border-color: rgba(234,88,12,0.35);
        }

        .fh-card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 1.4rem 1.4rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .fh-card-num {
          font-size: 0.63rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: rgba(255,247,237,0.28);
          margin-bottom: 0.2rem;
        }

        .fh-card-title {
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--fh-text);
          line-height: 1.25;
        }

        .fh-card-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .fh-findings {
          padding: 0.8rem 1.4rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .fh-finding {
          padding-bottom: 1.1rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .fh-finding:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .fh-finding-citation {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,247,237,0.32);
          margin-bottom: 0.35rem;
        }

        .fh-finding-stat-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
          flex-wrap: wrap;
        }

        .fh-finding-stat {
          font-size: 1.28rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .fh-finding-stat-lbl {
          font-size: 0.71rem;
          font-weight: 600;
          color: rgba(255,247,237,0.52);
        }

        .fh-finding-detail {
          font-size: 0.77rem;
          line-height: 1.67;
          color: rgba(255,247,237,0.6);
          font-style: italic;
          font-weight: 400;
        }

        /* ── turf stripe decoration ── */
        .fh-turf-stripe {
          height: 6px;
          background: repeating-linear-gradient(
            90deg,
            var(--fh-green) 0px,
            var(--fh-green) 24px,
            rgba(21,128,61,0.3) 24px,
            rgba(21,128,61,0.3) 48px
          );
          opacity: 0.35;
          margin: 0;
        }

        /* ── footer ── */
        .fh-footer {
          text-align: center;
          padding: 2.5rem 1.5rem 4rem;
          font-size: 0.66rem;
          color: rgba(255,247,237,0.22);
          letter-spacing: 0.07em;
          line-height: 1.85;
          border-top: 1px solid rgba(21,128,61,0.15);
        }

        @media (min-width: 640px) {
          .fh-stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .fh-bar-pos {
            width: 120px;
          }
        }
      `}</style>

      <div className="fh-root">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <header className="fh-hero">

          {/* Field hockey stick, ball, and turf lines SVG */}
          <svg
            className="fh-hero-svg"
            viewBox="0 0 280 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Turf horizontal lines */}
            <line x1="20" y1="480" x2="260" y2="480" stroke="white" strokeWidth="2" opacity="0.3"/>
            <line x1="20" y1="500" x2="260" y2="500" stroke="white" strokeWidth="2" opacity="0.3"/>
            <line x1="20" y1="520" x2="260" y2="520" stroke="white" strokeWidth="2" opacity="0.3"/>
            <line x1="20" y1="540" x2="260" y2="540" stroke="white" strokeWidth="2" opacity="0.2"/>

            {/* Stick shaft — angled slightly */}
            <rect
              x="128"
              y="130"
              width="14"
              height="340"
              rx="7"
              fill="white"
              transform="rotate(-4 140 300)"
            />

            {/* J-hook head */}
            <path
              d="M 112 440 Q 85 460 88 490 Q 91 515 118 520 Q 148 523 158 498 Q 165 478 152 462 L 138 445"
              stroke="white"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Ball — upper area with motion trail */}
            <circle cx="158" cy="68" r="26" fill="white" opacity="0.92"/>
            {/* Ball dimple lines */}
            <path d="M 140 60 Q 158 74 176 60" stroke="#0a1a08" strokeWidth="2.5" fill="none"/>
            <path d="M 140 76 Q 158 62 176 76" stroke="#0a1a08" strokeWidth="2.5" fill="none"/>
            <line x1="158" y1="42" x2="158" y2="94" stroke="#0a1a08" strokeWidth="2" opacity="0.6"/>

            {/* Motion trail behind ball */}
            <ellipse cx="130" cy="68" rx="18" ry="5" fill="white" opacity="0.12"/>
            <ellipse cx="108" cy="68" rx="10" ry="3" fill="white" opacity="0.07"/>

            {/* Grip tape lines on shaft */}
            <line x1="126" y1="200" x2="140" y2="198" stroke="white" strokeWidth="3" opacity="0.4"/>
            <line x1="124" y1="215" x2="138" y2="213" stroke="white" strokeWidth="3" opacity="0.4"/>
            <line x1="122" y1="230" x2="136" y2="228" stroke="white" strokeWidth="3" opacity="0.4"/>
            <line x1="120" y1="245" x2="134" y2="243" stroke="white" strokeWidth="3" opacity="0.4"/>
          </svg>

          <Link href="/" className="fh-back">
            <ArrowLeft size={13} />
            Back
          </Link>

          <p className="fh-eyebrow">Sport Science Series</p>
          <h1 className="fh-hero-title">Field Hockey Science</h1>
          <p className="fh-hero-sub">
            The physiology of the world's fastest team sport on turf — from 13 km GPS match
            demands and 150 km/h drag-flick biomechanics to ACL prevention science
            and the tactical physics of the modern 3D game.
          </p>

          {/* Key stats */}
          <div className="fh-stats-grid">
            {KEY_STATS.map(s => (
              <div key={s.label} className="fh-stat-cell">
                <div className="fh-stat-val">{s.value}</div>
                <div className="fh-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Turf stripe ──────────────────────────────────────────────────── */}
        <div className="fh-turf-stripe" aria-hidden="true" />

        {/* ── Distance Chart ────────────────────────────────────────────────── */}
        <section className="fh-section">
          <p className="fh-section-title">GPS Analysis</p>
          <div className="fh-chart-card">
            <p className="fh-chart-title">Distance Covered by Position Per Match</p>
            <p className="fh-chart-sub">Elite field hockey GPS data — Jennings 2012, MacLeod 2007</p>
            {POSITION_DISTANCE.map(d => (
              <div key={d.pos} className="fh-bar-row">
                <div className="fh-bar-pos">{d.pos}</div>
                <div className="fh-bar-track">
                  <div
                    className="fh-bar-fill"
                    style={{
                      width: `${d.barPct}%`,
                      background: `linear-gradient(90deg, ${d.color}bb, ${d.color})`,
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
        <section className="fh-section" style={{ paddingTop: 0 }}>
          <p className="fh-section-title">Evidence-Based Findings</p>
          <div className="fh-cards-grid">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="fh-card">
                <div className="fh-card-header">
                  <div>
                    <div className="fh-card-num">{card.number}</div>
                    <div className="fh-card-title">{card.title}</div>
                  </div>
                  <div className="fh-card-icon" role="img" aria-label={card.title}>
                    {card.icon}
                  </div>
                </div>
                <div className="fh-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="fh-finding">
                      <div className="fh-finding-citation">{f.citation}</div>
                      <div className="fh-finding-stat-row">
                        <span className="fh-finding-stat" style={{ color: card.accent }}>
                          {f.stat}
                        </span>
                        <span className="fh-finding-stat-lbl">{f.statLabel}</span>
                      </div>
                      <p className="fh-finding-detail">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="fh-footer">
          <p>
            Sources: Jennings 2012 (GPS, International Field Hockey) · Macutkiewicz 2011 (Elite Sprint Analysis) ·
            MacLeod 2007 (Physiological Demands of Elite Field Hockey) · Chivers 2011 (Drag-Flick Biomechanics) ·
            Malisoux 2015 (Synthetic Turf & ACL Risk) · FIH Self-Pass Rule 2009 · Penalty Corner Physiology Research ·
            3D Game Transition Analysis — Elite International Hockey
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            KQuarks Sport Science · Data is educational only and does not constitute medical advice.
          </p>
        </footer>

      </div>
    </>
  )
}
