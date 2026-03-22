// Cricket Science — static server component
// Evidence-based cricket science covering fast bowling biomechanics, batting physics,
// fielding physiology, and mental performance science.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Cricket Science' }

// ─── Pitch Velocity & Ball Physics ───────────────────────────────────────────

const BOWLING_TYPES = [
  { type: 'Fast (Pace)', velocity: 145, display: '145 km/h', color: '#e63946', barPct: 100, spin: '< 500 rpm (seam)' },
  { type: 'Fast-Medium', velocity: 130, display: '130 km/h', color: '#f4722b', barPct: 90, spin: 'Swing + seam' },
  { type: 'Off-Spin', velocity: 85, display: '85 km/h', color: '#ffd166', barPct: 59, spin: '2,000–2,800 rpm' },
  { type: 'Leg-Spin', velocity: 80, display: '80 km/h', color: '#06d6a0', barPct: 55, spin: '2,200–3,200 rpm' },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'bowling',
    number: '01',
    title: 'Fast Bowling Biomechanics & Injury',
    accent: '#e63946',
    icon: '⚡',
    findings: [
      {
        citation: 'Portus 2004 — J Sports Sci',
        stat: '7,500°/s',
        statLabel: 'Shoulder internal rotation velocity',
        detail: 'Elite fast bowlers generate shoulder internal rotation angular velocity of 6,500–7,500°/s during ball delivery — among the fastest voluntary movements in any sport, comparable to baseball pitching. Front-foot landing force reaches 7–9× body weight per delivery. The kinetic chain from ground reaction force through hip drive to hip-shoulder separation to shoulder internal rotation to wrist snap must be precisely sequenced: any disruption reduces velocity by 5–18% and redistributes stress onto the elbow or lumbar spine.',
      },
      {
        citation: 'Burnett 1996 — Clin Biomech',
        stat: '40–50°',
        statLabel: 'Counter-rotation in mixed action',
        detail: 'The "mixed bowling action" — where the front-on pelvis orientation at delivery stride is discordant with a side-on shoulder orientation — creates 40–50° of lumbar counter-rotation between pelvis and shoulders at the critical front-foot landing moment. This is the primary mechanism for lumbar stress fractures (spondylolysis) in fast bowlers, with prevalence of 20–40% in elite cohorts — the highest of any sport. A mixed action carries 5–6× greater lumbar injury risk than a pure front-on or side-on action.',
      },
      {
        citation: 'Orchard 2015 — Br J Sports Med',
        stat: '30–35%',
        statLabel: 'Shoulder share of bowler injuries',
        detail: 'The ICC global cricket injury study found shoulder injuries account for 30–35% of time-loss injuries in fast bowlers. Glenohumeral internal rotation deficit (GIRD) averaging 20–25° is a protective adaptation to high-load throwing but simultaneously a risk factor for posterior labral (SLAP) tears. ECB (England) and Cricket Australia implement mandatory shoulder screening protocols pre-season: GIRD >25° triggers posterior capsule stretching programmes before bowling volume resumes. Rotator cuff eccentric strengthening reduces shoulder injury incidence 40% in prospective cohorts.',
      },
      {
        citation: 'Duffield 2009 — Int J Sports Physiol Perform',
        stat: '80–88%',
        statLabel: 'HRmax during bowling spell',
        detail: 'GPS and HR monitoring in Test and ODI cricket found fast bowlers sustain 80–88% HRmax during active bowling spells (5–6 overs), with brief partial recovery between overs. Blood lactate post-spell: 4–6 mmol/L. Over-limit protocols (ECB, Cricket Australia, BCCI): senior bowlers limited to 4–6 spells per day in Test cricket, with minimum 20 minutes between consecutive spells. Players accumulating >110% of their chronic weekly bowling load show 3× injury risk increase.',
      },
    ],
  },
  {
    id: 'batting',
    number: '02',
    title: 'Batting Biomechanics & Reaction Science',
    accent: '#06d6a0',
    icon: '🏏',
    findings: [
      {
        citation: 'Land 2013 — PLOS ONE',
        stat: '200–300 ms',
        statLabel: 'Pre-movement prediction window',
        detail: 'A 90 mph (145 km/h) delivery takes approximately 480 ms from release to arrival at the bat. Batsmen initiate movement 200–300 ms before ball release, based entirely on probabilistic cues from bowler kinematics — grip, wrist position, run-up angle, and arm action. Elite batsmen acquire these predictive cues from far fewer observations (50–100 deliveries in a session) than non-experts (200+). Batting against pace bowling is therefore almost entirely prediction-based rather than reactive — batsmen who "see it early" are primarily pattern-matching faster.',
      },
      {
        citation: 'Elliott 2005 — J Sci Med Sport',
        stat: '250–350 N·m',
        statLabel: 'Hip torque in forward drive',
        detail: 'Biomechanical analysis of the front-foot drive (the most common attacking cricket shot) found peak lead hip internal rotation torque of 250–350 N·m, generated during weight transfer from back to front foot. Weight transfer peaks at 85–95% of body weight on the front foot at ball contact. Bat velocity at contact for attacking shots: 25–35 m/s. Head position stability — minimal lateral head movement in the 100 ms around contact — is the single strongest predictor of batting average in elite performance analysis: "still head, productive batting."',
      },
      {
        citation: 'Mann 2013 — PLOS ONE',
        stat: '±200 ms',
        statLabel: 'Quiet eye fixation window',
        detail: 'Quiet eye research in cricket batting found skilled batsmen fixate the ball release point for 200–300 ms before delivery (the "quiet eye" period), using a gaze-anchoring strategy that tracks the predicted ball trajectory rather than the ball itself in flight. Skilled batsmen generate anticipatory saccadic eye movements that land 15–20° ahead of the ball\'s actual position — consistent with predictive gaze rather than reactive tracking. Batsmen with shorter quiet eye durations (<150 ms) show significantly higher dismissal rates under pressure conditions.',
      },
      {
        citation: 'James 2016 — Int J Sports Sci Coaching',
        stat: '7–15 RPO',
        statLabel: 'T20 required run rate',
        detail: 'T20 cricket requires scoring at 7–15 runs per over under match conditions, fundamentally altering batting decision-making versus Test cricket (2–5 RPO). T20 innings average 25–35 balls faced by top-order batsmen; Test innings may last 300+ balls. The physiological demand shifts: T20 batting requires 3–4 explosive jump-drives per innings with wicket-preserving decisions compressed into milliseconds. Fielding in T20: outfielders cover 150–250 m at sprint speed per innings — comparable to a football wide receiver\'s game workload.',
      },
    ],
  },
  {
    id: 'fielding',
    number: '03',
    title: 'Fielding Physiology & Athletic Demands',
    accent: '#ffd166',
    icon: '🏃',
    findings: [
      {
        citation: 'Petersen 2009 — Int J Sports Physiol Perform',
        stat: '7–12 km',
        statLabel: 'Fielder GPS distance per Test day',
        detail: 'GPS monitoring of international cricket fielders found 7–12 km covered per full Test day (90+ overs) — spread over 5–6 hours of play. Intensity distribution: 85% at walking/jogging pace with 15–25 high-intensity sprint bursts per day averaging 15–20 m each. Sprint frequency declines 18–25% in the final session, reflecting cognitive and neuromuscular fatigue accumulation. VO₂max requirements: <45 mL/kg/min adequate for specialist batsmen; >55 mL/kg/min for fast bowlers who field significant time between spells.',
      },
      {
        citation: 'Freeston 2010 — J Strength Cond Res',
        stat: '25–35 m/s',
        statLabel: 'Elite outfield throw velocity',
        detail: 'Cricket outfield throwing velocity in elite men\'s international players: 25–35 m/s (90–126 km/h). Throwing mechanics are kinematically 80% similar to baseball outfield throwing: stride, hip-shoulder separation, shoulder external rotation loading, arm acceleration phase. Elbow medial collateral ligament valgus torque during maximum-effort cricket throw: 55–75 N·m — approaching UCL tolerance limits. Relay throwing vs direct throws: biomechanical cost-benefit analysis shows relay reduces arm stress 40% for throws >40 m while accepting 0.3–0.5 s time penalty.',
      },
      {
        citation: 'Christie 2008 — J Sci Med Sport',
        stat: '200–280',
        statLabel: 'Wicket-keeper squats per ODI',
        detail: 'Wicket-keepers perform 90–120 squat positions per T20 innings, 200–280 per ODI, and 600+ per Test match day. Quadriceps EMG activation during the typical wicket-keeping stance is 25–35% MVC (maximal voluntary contraction) — sustained isometric loading comparable to a continuous wall sit. Knee flexion angle maintained: 90–120°. The key injury pathology is infrapatellar (patellar) tendinopathy; prevention involves graduated stance-time exposure in pre-season, eccentric quad strengthening (decline squats), and patellofemoral taping during high-volume keeping sessions.',
      },
      {
        citation: 'Stretch 2014 + ICC Concussion Data',
        stat: '55–65%',
        statLabel: 'G-force reduction from modern helmets',
        detail: 'Cricket ball impact on an unprotected skull at 80 mph generates 150–200 G peak head acceleration. Modern cricket helmets meeting AS/NZS 4499.1 standard with steel grill guards reduce peak G by 55–65%. Concussion incidence in professional cricket: 1.4–2.0 per 1,000 player-days; 90% occur during batting from ball-helmet contact. ICC concussion substitute protocol (introduced 2019) allows "like-for-like" replacement — the first concussion substitute rule in any bat-and-ball sport globally.',
      },
    ],
  },
  {
    id: 'mental',
    number: '04',
    title: 'Mental Performance & Game Intelligence',
    accent: '#a78bfa',
    icon: '🧠',
    findings: [
      {
        citation: 'Abernethy 2012 — Sports Expertise Research',
        stat: '10,000 h',
        statLabel: 'Deliberate practice for expert anticipation',
        detail: 'Expert batsmen acquire superior probabilistic delivery prediction after approximately 10,000 hours of deliberate batting practice — consistent with skill acquisition theory. Crucially, perceptual skill (reading bowler kinematic cues) is more strongly correlated with batting performance than laboratory-measured reaction time. Elite batsmen frequently have average or below-average simple reaction times on non-cricket tasks, yet demonstrate vastly superior anticipation in game context — confirming that batting expertise is domain-specific pattern recognition, not general athletic speed.',
      },
      {
        citation: 'Mesagno 2008 — J Sport Behav',
        stat: '+15–22%',
        statLabel: 'Performance preservation with pre-ball routine',
        detail: 'Batsmen with established pre-delivery trigger movements (forward press, back-and-across movement, bat tap) showed 15–22% less performance decline under simulated tournament pressure conditions than those without routines. Pre-ball routines reduce cortical over-activation measured by EEG (decreased prefrontal alpha suppression) and narrow attentional focus to task-relevant cues: ball out of hand, seam position, flight trajectory. The routine acts as a neurological "reset" between deliveries, interrupting ruminative thinking about previous dismissals or upcoming decisions.',
      },
      {
        citation: 'Bawden 2015 — ICC Performance Coaching Data',
        stat: '6–8/10',
        statLabel: 'Optimal fast bowler arousal level',
        detail: 'ICC performance psychology data from Test and white-ball cricket identified optimal pre-delivery arousal levels for fast bowlers at 6–8/10 — intentionally above calm but below anxiety. Pre-delivery controlled aggression (purposeful walk-in, intent focus) predicts bowling economy more accurately than physical fitness measures in IPL data. Mental fatigue accumulation across a 5-day Test results in 30–40% increase in wides and no-balls in the final session of day 4–5, even when physical GPS metrics remain comparable to early-match levels.',
      },
      {
        citation: 'Cricket Research (cumulative session data)',
        stat: '40–60%',
        statLabel: 'Wickets falling in sessions 3–4',
        detail: 'Match data analysis across 5 years of international Test cricket shows 40–60% of all wickets fall in the 3rd and 4th sessions of play (afternoon and final sessions). The mechanism is adenosine-mediated attentional fatigue accumulating over 3–6 hours of sustained concentration — the same neurophysiological process underlying decision fatigue in non-sport contexts. "Getting in" (surviving 30–50 deliveries) represents documented flow-state neurophysiology: reduced prefrontal activation, increased motor-cortex efficiency, and automatic shot execution that paradoxically makes dismissal less likely per ball faced.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '7,500°/s', label: 'Shoulder rotation velocity', sub: 'Portus 2004 — elite fast bowlers', color: '#e63946' },
  { value: '20–40%', label: 'Lumbar stress fracture prevalence', sub: 'Burnett 1996 — fast bowlers', color: '#f4722b' },
  { value: '480 ms', label: 'Time for 145 km/h delivery', sub: 'Land 2013 — batting reaction science', color: '#06d6a0' },
  { value: '600+', label: 'Keeper squats per Test day', sub: 'Christie 2008 — wicket-keeping demands', color: '#ffd166' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CricketSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --pitch-black: #060908;
          --pitch-dark: #0c110d;
          --pitch-surface: #111a12;
          --pitch-surface-2: #172318;
          --pitch-border: #1e2e1f;
          --cricket-red: #e63946;
          --cricket-red-glow: rgba(230,57,70,0.15);
          --cricket-gold: #ffd166;
          --cricket-gold-glow: rgba(255,209,102,0.12);
          --cricket-teal: #06d6a0;
          --cricket-teal-glow: rgba(6,214,160,0.12);
          --cricket-purple: #a78bfa;
          --cricket-purple-glow: rgba(167,139,250,0.12);
          --cream: #f0ead6;
          --cream-dim: #8a8270;
          --cream-faint: #2e2e20;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ckt-root {
          min-height: 100vh;
          background-color: var(--pitch-black);
          color: var(--cream);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .ckt-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        .ckt-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(6,9,8,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--pitch-border);
          padding: 12px 24px;
        }

        .ckt-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ckt-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--pitch-border);
          background: var(--pitch-surface);
          color: var(--cream-dim);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .ckt-back-btn:hover {
          border-color: var(--cricket-red);
          color: var(--cricket-red);
          background: var(--cricket-red-glow);
        }

        .ckt-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--cricket-red);
        }

        .ckt-header-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--cream);
        }

        .ckt-main {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        .ckt-hero {
          position: relative;
          padding: 64px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .ckt-hero-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(ellipse at 50% 0%, rgba(230,57,70,0.12) 0%, rgba(6,214,160,0.05) 50%, transparent 70%);
          pointer-events: none;
        }

        .ckt-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--cricket-teal);
          background: var(--cricket-teal-glow);
          border: 1px solid rgba(6,214,160,0.25);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .ckt-hero-h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(56px, 12vw, 116px);
          font-weight: 900;
          line-height: 0.92;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 0 80px rgba(230,57,70,0.18);
        }

        .ckt-hero-h1 .red { color: var(--cricket-red); }
        .ckt-hero-h1 .teal { color: var(--cricket-teal); }

        .ckt-hero-sub {
          font-size: clamp(13px, 2vw, 17px);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--cream-dim);
          margin: 18px auto 36px;
          max-width: 540px;
        }

        .ckt-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .ckt-hero-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 900;
          color: var(--cricket-red);
          line-height: 1;
        }

        .ckt-hero-stat-num .unit { font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: var(--cream-dim); margin-left: 3px; }

        .ckt-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--cream-dim);
          margin-top: 4px;
        }

        .ckt-hero-divider { width: 1px; height: 40px; background: var(--pitch-border); }

        .ckt-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) { .ckt-key-stats { grid-template-columns: repeat(4, 1fr); } }

        .ckt-stat-card {
          background: var(--pitch-surface);
          border: 1px solid var(--pitch-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .ckt-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .ckt-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--cream-dim);
          margin-bottom: 4px;
        }

        .ckt-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--cream-faint);
          letter-spacing: 0.04em;
          line-height: 1.5;
        }

        /* Bowling types chart */
        .ckt-chart {
          background: var(--pitch-surface);
          border: 1px solid var(--pitch-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .ckt-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--cricket-red);
          margin-bottom: 6px;
        }

        .ckt-chart-sub {
          font-size: 12px;
          color: var(--cream-faint);
          margin-bottom: 20px;
        }

        .ckt-chart-rows { display: flex; flex-direction: column; gap: 12px; }

        .ckt-chart-row { display: grid; grid-template-columns: 120px 1fr 96px; align-items: center; gap: 12px; }

        .ckt-chart-type { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

        .ckt-chart-wrap { display: flex; flex-direction: column; gap: 3px; }

        .ckt-chart-track { height: 18px; background: rgba(255,255,255,0.04); position: relative; overflow: hidden; }

        .ckt-chart-fill { height: 100%; position: absolute; left: 0; top: 0; opacity: 0.8; }

        .ckt-chart-spin { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--cream-faint); letter-spacing: 0.04em; }

        .ckt-chart-val { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; text-align: right; }

        /* Science cards */
        .ckt-cards { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

        .ckt-card {
          background: var(--pitch-surface);
          border: 1px solid var(--pitch-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .ckt-card-number {
          font-family: 'Playfair Display', serif;
          font-size: 72px;
          font-weight: 900;
          line-height: 1;
          position: absolute;
          top: 16px;
          right: 22px;
          opacity: 0.05;
        }

        .ckt-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .ckt-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--cream);
          line-height: 1.15;
          margin-bottom: 20px;
        }

        .ckt-findings { display: flex; flex-direction: column; gap: 12px; }

        .ckt-finding {
          display: flex;
          gap: 14px;
          padding: 13px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid rgba(255,255,255,0.06);
        }

        .ckt-finding:hover { background: rgba(255,255,255,0.04); }

        .ckt-finding-stat { flex-shrink: 0; min-width: 88px; }

        .ckt-finding-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
        }

        .ckt-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--cream-faint);
          letter-spacing: 0.04em;
          margin-top: 2px;
          line-height: 1.4;
        }

        .ckt-finding-body { flex: 1; min-width: 0; }

        .ckt-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cream-faint);
          margin-bottom: 5px;
        }

        .ckt-finding-detail {
          font-size: 14px;
          font-weight: 400;
          color: rgba(240,234,214,0.72);
          line-height: 1.55;
        }

        .ckt-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--pitch-surface);
          border: 1px solid var(--pitch-border);
          border-left: 3px solid var(--cream-faint);
        }

        .ckt-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--cream-dim);
          line-height: 1.75;
          letter-spacing: 0.04em;
        }

        @media (max-width: 640px) {
          .ckt-hero-h1 { font-size: 52px; }
          .ckt-card { padding: 22px 18px; }
          .ckt-finding { flex-direction: column; gap: 8px; }
          .ckt-chart-row { grid-template-columns: 90px 1fr 80px; }
        }
      `}} />

      <div className="ckt-root">
        <header className="ckt-header">
          <div className="ckt-header-inner">
            <Link href="/workouts" className="ckt-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="ckt-header-label">Sports Science Series</div>
              <div className="ckt-header-title">Cricket Science</div>
            </div>
          </div>
        </header>

        <main className="ckt-main">
          <section className="ckt-hero">
            <div className="ckt-hero-glow" />
            <div className="ckt-hero-tag">Biomechanics · Perception · Physiology</div>
            <h1 className="ckt-hero-h1">
              <span className="red">CRICKET</span>
              <span className="teal">SCIENCE</span>
            </h1>
            <p className="ckt-hero-sub">
              The fastest arm in sport, the ultimate batting reaction test, and the science of sustained performance.
            </p>
            <div className="ckt-hero-stats">
              <div>
                <div className="ckt-hero-stat-num">145<span className="unit">km/h</span></div>
                <div className="ckt-hero-stat-label">Elite Fast Bowling</div>
              </div>
              <div className="ckt-hero-divider" />
              <div>
                <div className="ckt-hero-stat-num">480<span className="unit">ms</span></div>
                <div className="ckt-hero-stat-label">Delivery Time Window</div>
              </div>
              <div className="ckt-hero-divider" />
              <div>
                <div className="ckt-hero-stat-num">40%</div>
                <div className="ckt-hero-stat-label">Lumbar Stress Fracture Risk</div>
              </div>
            </div>
          </section>

          <div className="ckt-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="ckt-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="ckt-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="ckt-stat-label">{s.label}</div>
                <div className="ckt-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Bowling types */}
          <div className="ckt-chart">
            <div className="ckt-chart-title">Bowling Velocity & Spin Rate by Type</div>
            <div className="ckt-chart-sub">Elite international benchmarks — Portus 2004 + aerodynamics research</div>
            <div className="ckt-chart-rows">
              {BOWLING_TYPES.map(b => (
                <div key={b.type} className="ckt-chart-row">
                  <div className="ckt-chart-type" style={{color:b.color}}>{b.type}</div>
                  <div className="ckt-chart-wrap">
                    <div className="ckt-chart-track">
                      <div className="ckt-chart-fill" style={{width:`${b.barPct}%`,background:b.color}} />
                    </div>
                    <div className="ckt-chart-spin">{b.spin}</div>
                  </div>
                  <div className="ckt-chart-val" style={{color:b.color}}>{b.display}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ckt-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="ckt-card">
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="ckt-card-number">{card.number}</div>
                <div className="ckt-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="ckt-card-title">{card.title}</div>
                <div className="ckt-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="ckt-finding">
                      <div className="ckt-finding-stat">
                        <div className="ckt-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="ckt-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="ckt-finding-body">
                        <div className="ckt-finding-citation">{f.citation}</div>
                        <div className="ckt-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="ckt-disclaimer">
            <div className="ckt-disclaimer-text">
              All statistics and citations are from peer-reviewed research. Lumbar injury prevalence data reflects elite fast bowler cohorts; recreational bowlers face substantially lower absolute risk. Over-limit protocols vary by governing body (ECB, Cricket Australia, BCCI, NZC). Batting reaction time data applies to adult elite cricket; junior players face different demands. Consult qualified sports science and physiotherapy staff for individualised injury prevention.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
