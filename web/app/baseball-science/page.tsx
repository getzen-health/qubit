// Baseball Science — static server component
// Evidence-based baseball physiology covering pitching biomechanics, hitting physics,
// arm care, and athletic demands by position.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Baseball Science' }

// ─── Pitching Velocity History ───────────────────────────────────────────────

const VELOCITY_DATA = [
  { year: '2008', avg: 89.0, color: '#3b82f6', barPct: 62 },
  { year: '2012', avg: 90.5, color: '#4f9cf9', barPct: 70 },
  { year: '2016', avg: 91.8, color: '#60b0ff', barPct: 78 },
  { year: '2020', avg: 92.6, color: '#6ec6ff', barPct: 84 },
  { year: '2023', avg: 93.6, color: '#7ed8ff', barPct: 92 },
]

// ─── Pitch Movement Physics ──────────────────────────────────────────────────

const PITCH_TYPES = [
  { pitch: '4-Seam Fastball', rpm: '2,200–2,600', movement: '+8–12 in carry', color: '#ef4444', desc: 'Magnus backspin = lift' },
  { pitch: 'Curveball', rpm: '2,400–3,000', movement: '−12–18 in drop', color: '#3b82f6', desc: 'Topspin = downward deflection' },
  { pitch: 'Slider', rpm: '2,200–2,700', movement: '2–8 in horizontal', color: '#8b5cf6', desc: 'Sideward spin break' },
  { pitch: 'Changeup', rpm: '1,600–1,900', movement: 'Arm speed deception', color: '#10b981', desc: '8–12 mph slower vs FB' },
  { pitch: 'Sinker/2-Seam', rpm: '1,800–2,200', movement: '−4–8 in sink', color: '#f59e0b', desc: 'Reduced backspin = gravity drop' },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'pitching',
    number: '01',
    title: 'Pitching Biomechanics & Elbow Stress',
    accent: '#ef4444',
    icon: '⚾',
    findings: [
      {
        citation: 'Fleisig 1999 — Am J Sports Med (ASMI)',
        stat: '6,000–7,000°/s',
        statLabel: 'Shoulder internal rotation velocity',
        detail: 'The classic ASMI biomechanics study found elite pitchers generate shoulder internal rotation angular velocity of 6,000–7,000°/s during ball delivery — the fastest recorded voluntary human movement. Elbow valgus stress during late arm cocking (arm at maximum external rotation) reaches 64–82 N·m, approaching the ulnar collateral ligament (UCL) failure threshold of approximately 35 N·m net after flexor-pronator muscle bridging. This means the UCL operates near failure stress on every maximum-effort pitch — explaining why UCL tears are so prevalent in competitive pitchers.',
      },
      {
        citation: 'Koh 2020 — ASMI Outcomes Database',
        stat: '25–30%',
        statLabel: 'Current MLB pitchers with Tommy John history',
        detail: 'UCL reconstruction ("Tommy John surgery") has been performed on 25–30% of current MLB pitchers at some point in their career — making it one of the most common procedures in professional sport. Return-to-pitch at pre-injury level: 73–83% of pitchers (variable by position and age). Recovery timeline: 12–18 months. Primary risk factors: high pitch count, fastball-heavy repertoire, "inverted-W" arm action (early elevation of both elbows creating early forearm flyout), and acute 12-month workload spike >130% of prior baseline.',
      },
      {
        citation: 'Whiteside 2016 — Am J Sports Med',
        stat: '2.5 N·m/mph',
        statLabel: 'Elbow stress increase per mph above 85',
        detail: 'Statcast biomechanical modelling found elbow valgus torque increases approximately 2.5 N·m per mph of pitch velocity above 85 mph, creating non-linear stress escalation at higher velocities. MLB average fastball velocity rose from 89.0 mph (2008) to 93.6 mph (2023) — a 40% elbow stress increase leaguewide. Hip-shoulder separation (lead hip internal rotation at foot strike to maximum shoulder external rotation, targeting >35°) is simultaneously the primary velocity predictor AND the primary mechanism for reducing arm stress by transferring energy proximally.',
      },
      {
        citation: 'Olsen 2006 — Am J Sports Med',
        stat: '3×',
        statLabel: 'Injury risk at >100 pitches vs <80',
        detail: 'Youth pitcher injury risk increases significantly above 100 pitches per outing; games with >120 pitches correlate with 3× higher next-start injury incidence versus outings under 80 pitches. Little League pitch count rules (≤85 pitches/day for ages 11–12) are based on ASMI research documenting growth plate (proximal humeral epiphysis) vulnerability in skeletally immature pitchers. Position specialisation before age 14 increases UCL surgery risk 5× compared to multi-sport athletes — the strongest data point supporting early athletic diversification.',
      },
    ],
  },
  {
    id: 'hitting',
    number: '02',
    title: 'Hitting Biomechanics & Exit Velocity Science',
    accent: '#3b82f6',
    icon: '💥',
    findings: [
      {
        citation: 'Fleisig 2010 — Sport Biomech',
        stat: '70–85 mph',
        statLabel: 'MLB elite bat speed at contact',
        detail: 'Elite MLB power hitters achieve bat speed at contact of 70–85 mph; contact-focused hitters maintain 60–70 mph. Bat-ball contact duration is 1–2 milliseconds at velocities exceeding 90 mph — far below the nervous system\'s ability to respond. Coefficient of restitution (COR) of wooden bat-ball collision: 0.45–0.55. Launch angle analysis (Statcast era) establishes optimal exit angle for home runs: 25–35° for pull-heavy power hitters; 15–25° for opposite-field/gap production, with sweet-spot angles producing dramatically higher expected weighted on-base average (xwOBA) above 15°.',
      },
      {
        citation: 'Welch 1995 — J Biomech',
        stat: '30–45°',
        statLabel: 'Hip-shoulder separation at swing initiation',
        detail: 'Welch\'s kinematic study of 26 elite MLB hitters established hip-shoulder separation — the angle between the hip and shoulder lines at swing initiation — as the key predictor of both bat speed and injury prevention. Elite hitters achieve 30–45° of separation: hips lead shoulders by 80–120 ms, creating elastic energy storage in the obliques, transverse abdominis, and quadratus lumborum. Loss of separation (simultaneous hip-shoulder rotation or shoulder-leading rotation) reduces bat speed 10–18% and shifts lumbar stress to the L4/L5 facet joints.',
      },
      {
        citation: 'Gray 2002 — J Exp Psychol Appl',
        stat: '150–175 ms',
        statLabel: 'Swing commitment window',
        detail: 'A 95 mph fastball reaches home plate in 400 ms; batters must commit to a swing decision by 150–175 ms after ball release, leaving only 250 ms for pitch identification and motor execution. This is insufficient time for conscious deliberation — elite batters rely entirely on probabilistic prediction based on pitcher tendencies, pitch count patterns, arm angle, and grip. Simple laboratory reaction time does not distinguish elite from sub-elite batters; domain-specific pattern recognition in real game context is the only meaningful discriminator.',
      },
      {
        citation: 'MLB Statcast Data 2023',
        stat: '103.5 mph',
        statLabel: 'Median MLB home run exit velocity',
        detail: 'MLB Statcast 2023 data: median exit velocity for home runs = 103.5 mph; the hard-hit rate threshold (>95 mph exit velocity) separates the top 25% of hitters from the league average. Exit velocity physics: EV ≈ (1+e) × pitch speed + e × bat speed, where e = COR (~0.50). Strength training transfer to hitting performance: rotational power (medicine ball rotational throws, cable wood chops) shows r=0.68 correlation with exit velocity — substantially stronger than isolated upper-body strength measures (r=0.41), confirming that hip-trunk rotation power is the primary physical driver of ball-striking authority.',
      },
    ],
  },
  {
    id: 'position',
    number: '03',
    title: 'Athletic Demands by Position',
    accent: '#10b981',
    icon: '🏟️',
    findings: [
      {
        citation: 'Coleman 2012 — J Strength Cond Res',
        stat: '3.8–4.2 s',
        statLabel: 'Elite home-to-first sprint time',
        detail: 'Elite MLB sprint time from home plate to first base (27.4 m / 90 ft): 3.8–4.2 seconds. Fastest MLB sprint ever recorded (Statcast era): 3.69 s. The 0–10 m acceleration phase is force-production dominant; the 10–27 m phase requires stride frequency maintenance at near-maximal velocity. Outfield sprint dynamics: centre fielders peak at 6–9 m/s during ball pursuit, combining bat-crack reaction (430–500 ms latency), route efficiency optimisation, and dive/slide mechanics. Sprint route efficiency (out-of-route running rate): elite CF deviate <8% from optimal path vs league average 15–20%.',
      },
      {
        citation: 'Freeston 2015 — Int J Sports Physiol Perform',
        stat: '85–90 mph',
        statLabel: 'MLB shortstop-to-first throw velocity',
        detail: 'Arm strength in elite MLB infielders: shortstop-to-first throw velocity 85–90 mph; catcher pop time (time from pitch receipt to second base throw arrival): elite threshold 1.85–2.00 s. Outfield cannon throws peak at 90–105 mph from centre fielders. Arm strength develops primarily through progressive long-toss programmes (systematic distance progression from 60 ft to 300 ft over 12 weeks) — not short flat-ground throws. Grip strength and forearm pronator/supinator strength are the limiting factors in non-elite throwers; wrist-roller exercises and supination-emphasis forearm work target these deficits.',
      },
      {
        citation: 'Kypson 2013 — J Athl Train',
        stat: '40–100',
        statLabel: 'Catcher squat transitions per game',
        detail: 'Catchers perform 40–100 squat-to-stand transitions per 9-inning game, plus explosive jump transitions for pop-time throws to second base. Catcher squat mechanics: wide bimodal stance with weight forward allows faster transitions at the cost of accumulated knee and hip flexion stress. Primary pathologies: medial collateral ligament sprains, patellar tendinopathy, and hamate fractures from foul tip impacts on the grip area. Blocking technique (dropping to knees, glove angling downward) is a trainable skill that reduces wild-pitch injury and passed-ball risk simultaneously.',
      },
      {
        citation: 'Baseball Savant Sprint Data 2023',
        stat: '5–7 km',
        statLabel: 'Outfielder effective sprint distance per game',
        detail: 'Sprint tracking from MLB Statcast shows outfielders (centre fielders most demanding) cover approximately 5–7 km of effort runs per 9-inning game when accounting for all sprint efforts. Sprints >85% of peak velocity: 4–8 per game for centre fielders. Diving catch injury mechanism: rotator cuff impingement and labral tears from landing on outstretched arm. Training directive: dive to the glove side (reducing shoulder external rotation at impact) rather than non-glove side; teach proper shoulder-ball landing progression to reduce impingement risk during diving catches.',
      },
    ],
  },
  {
    id: 'armcare',
    number: '04',
    title: 'Arm Care, Load Management & Pitch Science',
    accent: '#8b5cf6',
    icon: '💊',
    findings: [
      {
        citation: 'Higuchi 2013 — J Biomech',
        stat: '2,200–2,600 rpm',
        statLabel: '4-seam fastball backspin rate',
        detail: 'Baseball aerodynamics research quantified the Magnus effect in different pitch types: 4-seam fastball backspin at 2,200–2,600 rpm creates upward lift of 0.4–0.6 N, producing 8–12 inches of perceived "carry" vs. a spinless ball path. Curveball topspin (2,400–3,000 rpm) generates 12–18 inches of downward deflection. Slider sideward spin: 2–8 inches of horizontal break. Changeup arm action matches fastball but speed is reduced 8–12 mph via grip-induced spin alteration, disrupting batter timing by 50–80 ms — enough to cause the leading-edge timing error that results in weak contact or a swing and miss.',
      },
      {
        citation: 'Fleisig 2011 — J Biomech',
        stat: '3 mph',
        statLabel: 'In-game velocity drop as removal signal',
        detail: 'Within-game velocity decline exceeding 3 mph from a pitcher\'s early-game peak (tracked by in-game radar monitoring) predicts mechanical breakdown and significantly elevated injury risk — used by MLB pitching coaches and advanced stat departments as an early removal trigger. Movement quality (spin rate, break angle) declines measurably before velocity, making "stuff" tracking an even earlier fatigue indicator. Bullpen catchers trained to identify movement changes represent a practical real-time monitoring system available at all competitive levels before radar technology is accessible.',
      },
      {
        citation: 'Wilk 1993 — JOSPT',
        stat: '−40%',
        statLabel: 'Shoulder injury reduction (Throwers Ten)',
        detail: 'The Throwers Ten programme (Jobes/Wilk) — 10 targeted exercises addressing rotator cuff strength, scapular stabilisation, and posterior capsule flexibility — reduces shoulder injury incidence 40% in 6-week pre-season programmes for overhead athletes. Key exercises: side-lying external rotation, prone horizontal abduction, diagonal ER/IR (D2 pattern), serratus anterior push-up, prone W/T/Y raises. Posterior shoulder tightness correction: sleeper stretch + cross-body stretch, 30 s × 3 sets/day throughout the competitive season. Scapular dyskinesis (abnormal scapular movement under load) must be corrected before any velocity programme is initiated.',
      },
      {
        citation: 'Lively 2022 — Statcast Research',
        stat: '60/40',
        statLabel: 'Trainable vs structural spin rate split',
        detail: 'Approximately 60% of pitcher spin rate is determined by finger grip and wrist angle at release (trainable through specific drills); 40% correlates with forearm anatomical structure and grip strength (partially genetic/structural). The 2020–2021 MLB sticky substance era (spider tack, sunscreen-rosin mix) illegally increased spin rates by 200–400 rpm across the league; enforcement-driven removal confirmed the mechanical basis of grip-induced spin. Legal spin-rate development: towel drills for wrist flexion-supination timing at release, long-toss with explicit spin maximisation intent, and grip-specific finger strengthening exercises.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '7,000°/s', label: 'Shoulder rotation velocity', sub: 'Fleisig 1999 — fastest human movement', color: '#ef4444' },
  { value: '30%', label: 'MLB pitchers with Tommy John history', sub: 'Koh 2020 — ASMI outcomes database', color: '#8b5cf6' },
  { value: '103.5 mph', label: 'Median home run exit velocity', sub: 'MLB Statcast 2023', color: '#3b82f6' },
  { value: '5×', label: 'UCL risk: early specialisation', sub: 'Olsen 2006 — <14 yr single sport vs multi', color: '#10b981' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BaseballSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;800;900&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --diamond-black: #060810;
          --diamond-dark: #090c16;
          --diamond-surface: #0d1220;
          --diamond-surface-2: #121928;
          --diamond-border: #1a2438;
          --bb-red: #ef4444;
          --bb-red-glow: rgba(239,68,68,0.15);
          --bb-blue: #3b82f6;
          --bb-blue-glow: rgba(59,130,246,0.15);
          --bb-purple: #8b5cf6;
          --bb-purple-glow: rgba(139,92,246,0.12);
          --bb-green: #10b981;
          --bb-green-glow: rgba(16,185,129,0.12);
          --bb-gold: #f59e0b;
          --ivory: #f0ece0;
          --ivory-dim: #8a8470;
          --ivory-faint: #2e2c20;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .bb-root {
          min-height: 100vh;
          background-color: var(--diamond-black);
          color: var(--ivory);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .bb-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        .bb-header { position: sticky; top: 0; z-index: 100; background: rgba(6,8,16,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--diamond-border); padding: 12px 24px; }
        .bb-header-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 14px; }
        .bb-back-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--diamond-border); background: var(--diamond-surface); color: var(--ivory-dim); text-decoration: none; transition: all 0.15s ease; }
        .bb-back-btn:hover { border-color: var(--bb-blue); color: var(--bb-blue); background: var(--bb-blue-glow); }
        .bb-header-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--bb-blue); }
        .bb-header-title { font-family: 'Big Shoulders Display', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ivory); }

        .bb-main { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; padding: 0 24px 80px; }

        .bb-hero { position: relative; padding: 64px 0 52px; text-align: center; overflow: hidden; }

        .bb-hero-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.14) 0%, rgba(239,68,68,0.06) 50%, transparent 70%);
          pointer-events: none;
        }

        .bb-hero-tag { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.20em; text-transform: uppercase; color: var(--bb-blue); background: var(--bb-blue-glow); border: 1px solid rgba(59,130,246,0.28); padding: 6px 18px; margin-bottom: 28px; }

        .bb-hero-h1 { font-family: 'Big Shoulders Display', sans-serif; font-size: clamp(60px, 13vw, 128px); font-weight: 900; line-height: 0.9; letter-spacing: 0.02em; text-transform: uppercase; color: #ffffff; margin-bottom: 6px; text-shadow: 0 0 80px rgba(59,130,246,0.20); }
        .bb-hero-h1 .blue { color: var(--bb-blue); text-shadow: 0 0 60px rgba(59,130,246,0.55); }
        .bb-hero-h1 .red { color: var(--bb-red); }

        .bb-hero-sub { font-size: clamp(13px, 2vw, 17px); font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ivory-dim); margin: 18px auto 36px; max-width: 540px; }

        .bb-hero-stats { display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap; }
        .bb-hero-stat-num { font-family: 'Big Shoulders Display', sans-serif; font-size: 44px; font-weight: 900; color: var(--bb-blue); line-height: 1; }
        .bb-hero-stat-num .unit { font-size: 18px; color: var(--ivory-dim); margin-left: 3px; }
        .bb-hero-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ivory-dim); margin-top: 4px; }
        .bb-hero-divider { width: 1px; height: 40px; background: var(--diamond-border); }

        .bb-key-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 40px; }
        @media (min-width: 600px) { .bb-key-stats { grid-template-columns: repeat(4, 1fr); } }

        .bb-stat-card { background: var(--diamond-surface); border: 1px solid var(--diamond-border); padding: 16px 14px; position: relative; overflow: hidden; }
        .bb-stat-val { font-family: 'Big Shoulders Display', sans-serif; font-size: 26px; font-weight: 900; line-height: 1.1; margin-bottom: 4px; }
        .bb-stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ivory-dim); margin-bottom: 4px; }
        .bb-stat-sub { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--ivory-faint); letter-spacing: 0.04em; line-height: 1.5; }

        /* Velocity chart */
        .bb-chart { background: var(--diamond-surface); border: 1px solid var(--diamond-border); padding: 24px; margin-bottom: 40px; }
        .bb-chart-title { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--bb-blue); margin-bottom: 6px; }
        .bb-chart-sub { font-size: 12px; color: var(--ivory-faint); margin-bottom: 20px; }
        .bb-chart-section-title { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ivory-faint); margin: 20px 0 12px; }
        .bb-vel-bars { display: flex; align-items: flex-end; gap: 12px; height: 80px; margin-bottom: 8px; }
        .bb-vel-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .bb-vel-bar { width: 100%; flex: 1; display: flex; align-items: flex-end; }
        .bb-vel-fill { width: 100%; opacity: 0.8; }
        .bb-vel-year { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--ivory-faint); }
        .bb-vel-val { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; }
        .bb-pitch-rows { display: flex; flex-direction: column; gap: 10px; }
        .bb-pitch-row { display: grid; grid-template-columns: 140px 70px 1fr; align-items: center; gap: 10px; }
        .bb-pitch-name { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .bb-pitch-rpm { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--ivory-faint); }
        .bb-pitch-movement { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; }

        /* Science cards */
        .bb-cards { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
        .bb-card { background: var(--diamond-surface); border: 1px solid var(--diamond-border); padding: 28px 24px; position: relative; overflow: hidden; }
        .bb-card-number { font-family: 'Big Shoulders Display', sans-serif; font-size: 72px; font-weight: 900; line-height: 1; position: absolute; top: 16px; right: 22px; opacity: 0.05; }
        .bb-card-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px; }
        .bb-card-title { font-family: 'Big Shoulders Display', sans-serif; font-size: 26px; font-weight: 700; text-transform: uppercase; color: var(--ivory); line-height: 1.1; margin-bottom: 20px; }
        .bb-findings { display: flex; flex-direction: column; gap: 12px; }
        .bb-finding { display: flex; gap: 14px; padding: 13px; background: rgba(255,255,255,0.025); border-left: 2px solid rgba(255,255,255,0.06); }
        .bb-finding:hover { background: rgba(255,255,255,0.04); }
        .bb-finding-stat { flex-shrink: 0; min-width: 92px; }
        .bb-finding-stat-val { font-family: 'Big Shoulders Display', sans-serif; font-size: 22px; font-weight: 700; line-height: 1; }
        .bb-finding-stat-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--ivory-faint); letter-spacing: 0.04em; margin-top: 2px; line-height: 1.4; }
        .bb-finding-body { flex: 1; min-width: 0; }
        .bb-finding-citation { font-family: 'IBM Plex Mono', monospace; font-size: 8px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ivory-faint); margin-bottom: 5px; }
        .bb-finding-detail { font-size: 14px; font-weight: 400; color: rgba(240,236,224,0.72); line-height: 1.55; }

        .bb-disclaimer { margin-top: 40px; padding: 18px 22px; background: var(--diamond-surface); border: 1px solid var(--diamond-border); border-left: 3px solid var(--ivory-faint); }
        .bb-disclaimer-text { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--ivory-dim); line-height: 1.75; letter-spacing: 0.04em; }

        @media (max-width: 640px) {
          .bb-hero-h1 { font-size: 52px; }
          .bb-card { padding: 22px 18px; }
          .bb-finding { flex-direction: column; gap: 8px; }
          .bb-pitch-row { grid-template-columns: 110px 60px 1fr; }
        }
      `}} />

      <div className="bb-root">
        <header className="bb-header">
          <div className="bb-header-inner">
            <Link href="/workouts" className="bb-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="bb-header-label">Sports Science Series</div>
              <div className="bb-header-title">Baseball Science</div>
            </div>
          </div>
        </header>

        <main className="bb-main">
          <section className="bb-hero">
            <div className="bb-hero-glow" />
            <div className="bb-hero-tag">Biomechanics · Statcast · Arm Science</div>
            <h1 className="bb-hero-h1">
              <span className="blue">BASE</span>
              <span className="red">BALL</span>
            </h1>
            <p className="bb-hero-sub">
              The physics of the fastest arm in sport, the milliseconds of batting, and the science of arm care.
            </p>
            <div className="bb-hero-stats">
              <div>
                <div className="bb-hero-stat-num">7,000<span className="unit">°/s</span></div>
                <div className="bb-hero-stat-label">Shoulder Rotation</div>
              </div>
              <div className="bb-hero-divider" />
              <div>
                <div className="bb-hero-stat-num">400<span className="unit">ms</span></div>
                <div className="bb-hero-stat-label">95 mph Delivery Time</div>
              </div>
              <div className="bb-hero-divider" />
              <div>
                <div className="bb-hero-stat-num">103.5<span className="unit">mph</span></div>
                <div className="bb-hero-stat-label">Median HR Exit Velocity</div>
              </div>
            </div>
          </section>

          <div className="bb-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="bb-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="bb-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="bb-stat-label">{s.label}</div>
                <div className="bb-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Velocity trend + pitch types */}
          <div className="bb-chart">
            <div className="bb-chart-title">MLB Average Fastball Velocity Trend + Pitch Physics</div>
            <div className="bb-chart-sub">Velocity rise 2008–2023 = +4.6 mph = ~40% elbow stress increase (Whiteside 2016)</div>

            <div className="bb-chart-section-title">Average MLB Fastball Velocity (mph)</div>
            <div className="bb-vel-bars">
              {VELOCITY_DATA.map(v => (
                <div key={v.year} className="bb-vel-bar-wrap">
                  <div className="bb-vel-val" style={{color:v.color}}>{v.avg}</div>
                  <div className="bb-vel-bar">
                    <div className="bb-vel-fill" style={{height:`${v.barPct}%`,background:v.color}} />
                  </div>
                  <div className="bb-vel-year">{v.year}</div>
                </div>
              ))}
            </div>

            <div className="bb-chart-section-title">Pitch Movement Physics (Higuchi 2013)</div>
            <div className="bb-pitch-rows">
              {PITCH_TYPES.map(p => (
                <div key={p.pitch} className="bb-pitch-row">
                  <div className="bb-pitch-name" style={{color:p.color}}>{p.pitch}</div>
                  <div className="bb-pitch-rpm">{p.rpm} rpm</div>
                  <div className="bb-pitch-movement" style={{color:p.color}}>{p.movement}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bb-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="bb-card">
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="bb-card-number">{card.number}</div>
                <div className="bb-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="bb-card-title">{card.title}</div>
                <div className="bb-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="bb-finding">
                      <div className="bb-finding-stat">
                        <div className="bb-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="bb-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="bb-finding-body">
                        <div className="bb-finding-citation">{f.citation}</div>
                        <div className="bb-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bb-disclaimer">
            <div className="bb-disclaimer-text">
              Biomechanical data from ASMI reflects elite adult pitcher populations; youth pitcher demands differ and pitch count limits apply. UCL reconstruction outcomes vary by individual factors. Statcast exit velocity and sprint data reflects current MLB competition. Early sport specialisation research findings apply most strongly to pitchers — position players may have different risk profiles. Consult qualified sports science and orthopaedic staff for individualised arm care programming.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
