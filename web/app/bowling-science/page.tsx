// Bowling Science — server component
// Ball dynamics, delivery biomechanics, injury prevention, and mental game science.

// ─── Hook Trajectory Data ─────────────────────────────────────────────────────

const HOOK_DATA = [
  { label: 'Stroker',      rpm: '150 rpm',  boards: 5,  color: '#6b7280', barColor: '#4b5563', desc: 'Walter Ray Williams style' },
  { label: 'Medium Rev',   rpm: '300 rpm',  boards: 12, color: '#92400e', barColor: '#78350f', desc: 'Most house-shot bowlers' },
  { label: 'High Rev',     rpm: '450 rpm',  boards: 20, color: '#dc2626', barColor: '#b91c1c', desc: 'Elite competitive bowlers' },
  { label: 'Cranker',      rpm: '500+ rpm', boards: 28, color: '#dc2626', barColor: '#991b1b', desc: 'Kyle Traber — maximum hook' },
]

const MAX_BOARDS = 32

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'ball-dynamics',
    number: '01',
    title: 'Ball Dynamics & Lane Physics',
    accent: '#9333ea',
    accentDim: 'rgba(147,51,234,0.09)',
    accentBorder: 'rgba(147,51,234,0.26)',
    findings: [
      {
        citation: 'USBC Equipment Specifications 2024; PBA Tour Speed Analysis 2019–2023',
        stat: '18–19 mph',
        statLabel: 'PBA tour average speed',
        detail:
          'Professional bowling ball speed optimal range: 17–22 mph (27–35 km/h). Speed effects on pin action are significant — too fast (>22 mph) produces a "deflection through" pattern where the ball lacks time to generate friction and hook, reducing entry angle and pin scatter; too slow (<16 mph) creates over-hook, arriving at the pocket from an extreme angle. The 4–6° entry angle into the 1–3 pocket (right-handed) maximises pin scatter geometry. PBA tour average: 18–19 mph. Maximum ball weight by USBC rules: 16 lbs (7.26 kg). Most professionals use 14–16 lb balls.',
      },
      {
        citation: 'Stremler 2009 — USBC Bowling Academy; Schlegel 2018 — PBA Rev Rate Analysis',
        stat: '300–450 rpm',
        statLabel: 'Elite hook ball revolution rate',
        detail:
          'Hook ball revolution mechanics: revolution rate (rpm) directly determines hook potential by increasing the gyroscopic torque the ball exerts on the lane surface. Axis rotation (angle of ball\'s spin axis relative to forward direction): 0° = end-over-end roll, 90° = pure side-roll. Axis tilt: angle above horizontal plane. Reactive resin coverstocks generate 3–5× the friction of polyester, amplifying hook from rpm. Flare potential (migration of oil track on ball surface) indicates internal mass asymmetry. High-rev player Kyle Traber: ~500 rpm. Stroker Walter Ray Williams: ~150 rpm — both have won multiple PBA titles through different delivery systems.',
      },
      {
        citation: 'USBC Lane Maintenance Study 2015; PBA Sport Bowling Committee Oil Pattern Research',
        stat: '41–44 ft',
        statLabel: 'Standard house oil pattern length',
        detail:
          'Lane conditioning science: house patterns (41–44 ft) place more oil in the centre and less in the outside boards (gutters), creating a "funnel" effect that guides balls toward the pocket — making recreational scoring more accessible. Sport patterns (USBC-certified) apply oil more uniformly, requiring precise ball placement. Oil pattern length determines hook point location: shorter patterns (35 ft) hook earlier; longer patterns (47 ft) create later, sharper hooks. Oil breakdown across a 3-game block typically causes balls to start hooking earlier and more aggressively, requiring bowlers to move feet and target left (for right-handers) as competition progresses.',
      },
      {
        citation: 'Huston 2011 — Physics of Bowling; USBC Pin Action Research 2008',
        stat: '4–6°',
        statLabel: 'Optimal pocket entry angle',
        detail:
          'Pin physics: bowling pins weigh exactly 1.50 kg (3 lb 6 oz) and are arranged in a triangular 10-pin rack with the 1-pin at the apex. Entry angle physics for maximum pin scatter: pocket entry at 4–6° optimises the ball\'s trajectory through the pin deck, allowing the ball to carry through the 5-pin and generating maximum pin-to-pin collisions. Thin hits (1-2 pocket entry, too straight) leave the 10-pin standing. High hits (1-1-3 or Brooklyn, too much angle) leave corner pins. Deflection through pin deck: an 8+ rpm ball with higher entry angle maintains deflection path longer, increasing strike probability on marginal hits.',
      },
    ],
  },
  {
    id: 'biomechanics',
    number: '02',
    title: 'Biomechanics of the Delivery',
    accent: '#2563eb',
    accentDim: 'rgba(37,99,235,0.09)',
    accentBorder: 'rgba(37,99,235,0.26)',
    findings: [
      {
        citation: 'Lam 2012 — Bowling biomechanics review; ITRC Timing Research 2016',
        stat: '4–5 step',
        statLabel: 'Standard approach length',
        detail:
          'Bowling delivery timing mechanics: the 4-step approach sequence is push-down-back-slide, with the pendulum swing synchronised to arrive at the release point at the moment the slide foot contacts the foul line. The 5-step adds an initial timing step (ball remains stationary) to allow players with longer or shorter natural strides to synchronise. Timing quality — the ball\'s position at slide foot contact — predicts 96% of professional delivery consistency. Late timing (ball behind the body at slide) adds revolutions; early timing (ball ahead) reduces them. Swing plane consistency across multiple deliveries is the distinguishing characteristic of hall-of-fame bowlers.',
      },
      {
        citation: 'Goodwin 2018 — Wrist Position Science; USBC Coaching Manual 2020',
        stat: 'Cupped vs. flat',
        statLabel: 'Wrist position controls rev rate',
        detail:
          'Wrist position science in the bowling release: a cupped wrist (palm faces up and backward at backswing peak) places the hand under and behind the ball, enabling forward-axis rotation at release — generating higher revolution rates. A relaxed or "broken-back" wrist position reduces the hand\'s ability to impart rotation, resulting in lower revs. Wrist devices (legal USBC accessories) lock the wrist in a chosen position, maintaining consistency across 100+ deliveries. Fingertip grip (fingers inserted to first knuckle) allows more rotation than conventional grip (inserted to second knuckle), which is the primary reason competitive bowlers use fingertip grip.',
      },
      {
        citation: 'Hamill 1997 — Biomechanics of Sport; USBC Delivery Analysis Project 2014',
        stat: '10–20 ms',
        statLabel: 'Thumb-before-fingers exit timing',
        detail:
          'Ball release sequence: the thumb exits the thumb hole 10–20 ms before the ring and middle fingers exit their finger holes. This differential creates the physical lift and rotation imparted to the ball. Early thumb exit (ball still swinging forward) allows the fingers to stay in contact longer, generating more rotation. Late thumb exit reduces rotation and can cause dropped deliveries. Finger position at release: right-handed bowler fingers start at 4–5 o\'clock position, rotating through to 2–3 o\'clock to generate hook. Axis rotation from this motion: typically 30–50° for medium hook players, up to 70–80° for crankers.',
      },
      {
        citation: 'Lam 2012 — Footwork biomechanics; USBC Coaching Certification Program',
        stat: '3–6 inch',
        statLabel: 'Slide distance at release',
        detail:
          'Footwork mechanics at release: the non-dominant (slide) foot slides 3–6 inches on the approach surface as momentum is transferred from walking tempo to a controlled stop. Balance preservation through the shot requires the body\'s centre of mass to remain over the slide foot. Elbow height at release point should remain above hip level — dropping the elbow reduces ball speed and creates inconsistent entry angles. Follow-through direction (arm pointing at target arrow, not at the pins) encodes the delivery direction. Bowling shoes: the slide shoe (left foot for right-handers) uses a smooth microfibre sole; the brake shoe (right foot) has a rubber grip sole to control the approach walk.',
      },
    ],
  },
  {
    id: 'injury',
    number: '03',
    title: 'Physical Demands & Injury',
    accent: '#9333ea',
    accentDim: 'rgba(147,51,234,0.09)',
    accentBorder: 'rgba(147,51,234,0.26)',
    findings: [
      {
        citation: 'PBA Tour Event Structure; Beyer 2006 — Repetitive Motion in Bowling',
        stat: '70–100+ games',
        statLabel: 'Elite weekly volume',
        detail:
          'Elite bowler training and competition volume: professional practice typically involves 30–50 games per week in off-season preparation, with competition weeks adding 6 games per day × 4 qualifying days + match play = 26–30 competition games. Total: 70–100+ deliveries per week across competition blocks. Low cardiovascular demand (bowling\'s metabolic rate: 3–4 METs, comparable to easy walking) but extreme repetitive motion demand concentrated in one side of the body. Physical fatigue effects on accuracy: ball speed decreases 1.5–2.0 mph after 8+ games without rest, and axis tilt becomes less consistent as forearm muscles fatigue.',
      },
      {
        citation: 'Rettig 1994 — Bowler\'s Thumb; AAFP 2001 — Bowling Injuries Review',
        stat: 'Digital nerve',
        statLabel: "Bowler's thumb mechanism",
        detail:
          'Repetitive thumb hole pressure causing ulnar digital nerve neuropathy of the thumb — "bowler\'s thumb" — is the most distinctive overuse injury in bowling. The ulnar digital nerve runs superficially on the medial aspect of the thumb; thumb hole friction and compression across thousands of repetitions causes neuropathy, presenting as pain, numbness, or tingling along the thumb\'s ulnar border. Management: thumb hole resizing, skin tape (pre-wrap or friction tape) to redistribute pressure, anti-vibration inserts. Ring and middle finger tendinopathy from repeated fingertip grip loading presents as A1 pulley irritation or FDP tendinopathy at the fingertip.',
      },
      {
        citation: 'Bowling Orthopaedics 2009 — Lumbosacral demands; Amin 2011 — Asymmetric loading',
        stat: '35–45%',
        statLabel: 'Pro bowlers with back pain',
        detail:
          'Trunk rotation with ball momentum creates highly asymmetrical spinal loading: a right-handed bowler performs hundreds of repetitions of left trunk rotation under load, generating cumulative loading asymmetry on the lumbar spine. Lumbar extension during the release phase creates compressive disc loading from the 14–16 lb ball acting at end-of-range lumbar extension. Core strengthening (anti-rotation pallof press, side plank, bird-dog) and bilateral balance training (single-leg stance, hip hinge with non-dominant loading) reduce asymmetrical loading risk. Annual warm-up compliance in competitive bowlers: only 38% report consistent pre-competition dynamic warm-up.',
      },
      {
        citation: 'Rettig 2002 — Shoulder Injuries in Throwing Sports; USBC Medical Advisory Board',
        stat: '20–25%',
        statLabel: 'Elite injuries at shoulder',
        detail:
          'Pendulum swing shoulder loading: the backswing peak imposes posterior capsule stress as the arm reaches maximum external rotation, while the forward swing generates infraspinatus eccentric demand to decelerate internal rotation at ball release. Acromioclavicular joint stress from the weight of the ball (14–16 lb) at end-range positions contributes to AC joint arthrosis in long-career bowlers. Prevention: posterior capsule stretching (sleeper stretch), rotator cuff eccentric strengthening (ER side-lying, cable ER), and scapular stabilisation work (Y-T-W on incline). Season-ending shoulder injuries represent approximately 20–25% of elite bowling injury incidence.',
      },
    ],
  },
  {
    id: 'mental',
    number: '04',
    title: 'Mental Game & Strategy',
    accent: '#2563eb',
    accentDim: 'rgba(37,99,235,0.09)',
    accentBorder: 'rgba(37,99,235,0.26)',
    findings: [
      {
        citation: 'USBC Bowling Academy Statistics; PBA Scoring Analysis 2015–2023',
        stat: '85–90%',
        statLabel: 'Scoring from spares',
        detail:
          'Statistical analysis of bowling scoring demonstrates that spare conversion rate contributes more to average improvement than strike rate for bowlers below a 200 average. Leaving a single pin after the first ball and converting the spare yields 10 + (first ball pinfall) points — often 17–19. Missing the spare yields only first-ball pinfall. The 10-pin spare conversion rate: elite PBA professionals convert 95%+ of single-pin spares (using a straight ball to eliminate hook variability); recreational bowlers average ~60%. This 35-point difference in a 10-frame game represents 12–15 pins per missed single spare, compounding to the difference between a 140 and 180 game.',
      },
      {
        citation: 'USBC Lane Adjustment Research 2018; Stremler 2009 — Arrow System',
        stat: '1 board',
        statLabel: '= ~3 boards at pins from foul line',
        detail:
          'Bowling adjustment science: the relationship between feet position on the approach (measured in boards, 1 inch wide) and ball position at the arrows (7 feet from the foul line) and at the pins (60 feet) follows a geometric amplification factor. A 1-board adjustment at the foul line changes ball position approximately 3 boards at the pin deck for a straight ball, slightly more for a hooking delivery. Counterintuitive direction rule: right-handed bowlers move their feet LEFT when they need the ball to track RIGHT (toward the pocket), and vice versa. Oil breakdown reading involves noticing where the ball begins to hook and when previous ball tracks indicate friction change.',
      },
      {
        citation: 'Boutcher 2011 — Pre-Performance Routines in Sport; Lidor 2007 — Routines and Accuracy',
        stat: '6–8 sec',
        statLabel: 'Standard professional approach duration',
        detail:
          'Pre-delivery routine in professional bowling: finding marker position on approach dots, locking visual focus on target arrow (10–15 feet from the foul line, not the 60-foot pins), controlled breathing to lower arousal, and brief mental rehearsal of delivery path. Elite PBA professionals time their routines within ±0.5 seconds across 30 consecutive deliveries — temporal consistency is an objective measure of mental routine quality. Interruption of the pre-shot routine by crowd noise, lane vibration, or external distraction produces performance decrements of 5–10% in controlled studies. This is why the shot clock (in some PBA formats) causes above-average disruption to slower-routine bowlers.',
      },
      {
        citation: 'Beilock 2010 — Choke: What the Secrets of the Brain Reveal; Lees 2002 — Automaticity',
        stat: '12 strikes',
        statLabel: 'Perfect game — automaticity under pressure',
        detail:
          'A perfect game (12 consecutive strikes, score 300) creates a unique psychological pressure that escalates geometrically from frame 9. By frame 10, TV cameras focus on the bowler, crowd falls silent, and conscious attention turns to the normally automatic delivery mechanics. Choking mechanism (Beilock 2010): explicit conscious monitoring of well-learned procedural skills disrupts the automatic neural routines that generate them, producing the same performance degradation as a beginner. Post-300 game anecdotes are striking: many bowlers report a subjective "can\'t remember" experience of frames 10–12, suggesting successful automaticity — they performed best when attention was least focused on the mechanics.',
      },
    ],
  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '17–22 mph', label: 'Optimal Ball Speed', sub: 'PBA tour average: 18–19 mph', color: '#9333ea' },
  { value: '450 rpm',   label: 'Elite Revolution Rate', sub: 'High-rev player benchmark', color: '#dc2626' },
  { value: '95%+',      label: 'Pro 10-Pin Spare %', sub: 'PBA single-pin conversion rate', color: '#2563eb' },
  { value: '4–6°',      label: 'Optimal Entry Angle', sub: 'Pocket entry for maximum carry', color: '#92400e' },
]

// ─── SVG Chart Dimensions ─────────────────────────────────────────────────────

const CHART_W = 520
const CHART_H = 170
const CHART_PAD_L = 120
const CHART_PAD_R = 70
const CHART_PAD_T = 14
const CHART_PAD_B = 26
const CHART_PLOT_W = CHART_W - CHART_PAD_L - CHART_PAD_R
const CHART_PLOT_H = (CHART_H - CHART_PAD_T - CHART_PAD_B) / HOOK_DATA.length

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BowlingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Lato:wght@400;700;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --bowl-dark: #1a0f05;
          --bowl-maple: #92400e;
          --bowl-red: #dc2626;
          --bowl-cream: #fef3c7;
          --bowl-pin: #f9fafb;
          --bowl-card: #220f04;
          --bowl-card2: #2a1508;
          --bowl-border: rgba(146,64,14,0.20);
          --bowl-mono: ui-monospace, 'SF Mono', monospace;
          --bowl-display: 'Alfa Slab One', serif;
          --bowl-body: 'Lato', sans-serif;
        }

        .bowl-page {
          min-height: 100vh;
          background: var(--bowl-dark);
          color: var(--bowl-cream);
          font-family: var(--bowl-body);
          position: relative;
          overflow-x: hidden;
        }

        /* ── Lane wood grain texture overlay ── */
        .bowl-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 18px,
              rgba(146,64,14,0.04) 18px,
              rgba(146,64,14,0.04) 19px
            );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Hero ── */
        .bowl-hero {
          position: relative;
          overflow: hidden;
          background: #0f0700;
          border-bottom: 3px solid var(--bowl-maple);
        }

        .bowl-hero-glow {
          position: absolute;
          bottom: -100px; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 500px;
          background: radial-gradient(ellipse at 50% 100%, rgba(146,64,14,0.30) 0%, rgba(146,64,14,0.10) 40%, transparent 65%);
          pointer-events: none;
        }

        .bowl-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 64px 24px 56px;
          text-align: center;
        }

        .bowl-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--bowl-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--bowl-maple);
          background: rgba(146,64,14,0.12);
          border: 1px solid rgba(146,64,14,0.35);
          padding: 7px 18px;
          margin-bottom: 28px;
        }

        .bowl-hero-eyebrow::before {
          content: '●';
          font-size: 8px;
          color: var(--bowl-red);
          animation: bowl-blink 2.2s ease-in-out infinite;
        }

        @keyframes bowl-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        .bowl-hero-title {
          font-family: var(--bowl-display);
          font-size: clamp(52px, 11vw, 108px);
          line-height: 0.88;
          color: var(--bowl-pin);
          margin: 0 0 6px;
          letter-spacing: 0.01em;
          text-shadow: 0 4px 0 #0a0500, 0 0 60px rgba(220,38,38,0.18);
        }

        .bowl-hero-title span {
          color: var(--bowl-red);
          display: block;
          text-shadow: 0 4px 0 #0a0500, 0 0 50px rgba(220,38,38,0.45);
        }

        .bowl-hero-sub {
          font-family: var(--bowl-body);
          font-size: clamp(13px, 2vw, 16px);
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--bowl-maple);
          margin: 22px 0 8px;
        }

        .bowl-hero-desc {
          font-family: var(--bowl-body);
          font-size: 14px;
          font-weight: 400;
          color: rgba(254,243,199,0.42);
          max-width: 540px;
          margin: 0 auto 32px;
          line-height: 1.72;
        }

        .bowl-hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .bowl-hero-tag {
          font-family: var(--bowl-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--bowl-maple);
          background: rgba(146,64,14,0.10);
          border: 1px solid rgba(146,64,14,0.28);
          padding: 5px 12px;
        }

        /* ── Main layout ── */
        .bowl-main {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 44px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        /* ── Section labels ── */
        .bowl-section-label {
          font-family: var(--bowl-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--bowl-maple);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bowl-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(146,64,14,0.40), transparent);
        }

        /* ── Stats grid ── */
        .bowl-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          border: 1px solid rgba(146,64,14,0.25);
          background: rgba(146,64,14,0.10);
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .bowl-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .bowl-stat-cell {
          background: var(--bowl-card);
          padding: 22px 16px;
          position: relative;
          overflow: hidden;
        }

        .bowl-stat-value {
          font-family: var(--bowl-display);
          font-size: clamp(22px, 4.5vw, 34px);
          line-height: 1;
          display: block;
          margin-bottom: 7px;
        }

        .bowl-stat-label {
          font-family: var(--bowl-body);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(254,243,199,0.60);
          margin-bottom: 4px;
          display: block;
        }

        .bowl-stat-sub {
          font-family: var(--bowl-mono);
          font-size: 9px;
          color: rgba(146,64,14,0.60);
          letter-spacing: 0.02em;
          line-height: 1.4;
        }

        /* ── Chart ── */
        .bowl-chart-wrap {
          background: var(--bowl-card);
          border: 1px solid var(--bowl-border);
          overflow: hidden;
          position: relative;
        }

        .bowl-chart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--bowl-maple), transparent);
        }

        .bowl-chart-header {
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(146,64,14,0.15);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .bowl-chart-title {
          font-family: var(--bowl-body);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--bowl-cream);
          margin: 0 0 3px;
        }

        .bowl-chart-citation {
          font-family: var(--bowl-mono);
          font-size: 10px;
          color: rgba(146,64,14,0.55);
        }

        /* ── Science cards ── */
        .bowl-science-card {
          border: 1px solid var(--bowl-border);
          background: var(--bowl-card);
          overflow: hidden;
          position: relative;
        }

        .bowl-card-number {
          font-family: var(--bowl-display);
          font-size: 90px;
          line-height: 1;
          position: absolute;
          right: 16px;
          top: 4px;
          opacity: 0.05;
          pointer-events: none;
          user-select: none;
        }

        .bowl-card-header {
          padding: 18px 20px 16px;
          border-bottom: 1px solid rgba(146,64,14,0.15);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          position: relative;
        }

        .bowl-card-accent-bar {
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 3px;
        }

        .bowl-card-title {
          font-family: var(--bowl-display);
          font-size: clamp(16px, 3vw, 21px);
          line-height: 1.10;
          margin: 0;
          padding-left: 12px;
          letter-spacing: 0.01em;
        }

        .bowl-finding-row {
          padding: 18px 20px;
          border-bottom: 1px solid rgba(146,64,14,0.10);
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          position: relative;
        }

        @media (min-width: 580px) {
          .bowl-finding-row { grid-template-columns: 100px 1fr; }
        }

        .bowl-finding-stat-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex-shrink: 0;
        }

        .bowl-finding-stat {
          font-family: var(--bowl-display);
          font-size: clamp(16px, 3vw, 22px);
          line-height: 1;
        }

        .bowl-finding-stat-label {
          font-family: var(--bowl-mono);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(146,64,14,0.70);
          line-height: 1.3;
        }

        .bowl-finding-citation {
          font-family: var(--bowl-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .bowl-finding-detail {
          font-family: var(--bowl-body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.72;
          color: rgba(254,243,199,0.48);
          letter-spacing: 0.01em;
        }

        /* ── Footer ── */
        .bowl-footer-note {
          font-family: var(--bowl-mono);
          font-size: 10px;
          color: rgba(146,64,14,0.30);
          line-height: 1.7;
          border-top: 1px solid rgba(146,64,14,0.15);
          padding-top: 24px;
        }
      `}} />

      <div className="bowl-page">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bowl-hero">
          <div className="bowl-hero-glow" />

          <div className="bowl-hero-inner">
            <div>
              <span className="bowl-hero-eyebrow">Bowling Science</span>
            </div>

            <h1 className="bowl-hero-title">
              Bowling
              <span>Science</span>
            </h1>

            {/* Lane perspective SVG */}
            <div style={{ margin: '28px auto 32px', maxWidth: 440 }}>
              <svg
                viewBox="0 0 440 130"
                style={{ width: '100%', height: 'auto', display: 'block', opacity: 0.88 }}
                aria-label="Bowling lane perspective view with arrows, foul line, and pins"
              >
                <defs>
                  <linearGradient id="bowl-lane-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#78350f" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#92400e" stopOpacity="0.60" />
                  </linearGradient>
                  <linearGradient id="bowl-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.70" />
                    <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.10" />
                  </linearGradient>
                </defs>

                {/* Lane surface — perspective trapezoid */}
                <path
                  d="M 60 125 L 380 125 L 310 10 L 130 10 Z"
                  fill="url(#bowl-lane-grad)"
                  stroke="rgba(146,64,14,0.40)"
                  strokeWidth="1"
                />

                {/* Lane board lines (vertical perspective lines) */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                  const totalBoards = 8
                  const t = i / totalBoards
                  const xBottom = 60 + t * 320
                  const xTop = 130 + t * 180
                  return (
                    <line
                      key={i}
                      x1={xBottom} y1={125}
                      x2={xTop} y2={10}
                      stroke="rgba(146,64,14,0.18)"
                      strokeWidth="0.5"
                    />
                  )
                })}

                {/* Foul line */}
                <line x1="75" y1="108" x2="365" y2="108" stroke="#dc2626" strokeWidth="2" opacity="0.80" />
                <text x="370" y="112" fontFamily="ui-monospace, monospace" fontSize="8" fill="#dc2626" opacity="0.70" fontWeight="700">FOUL LINE</text>

                {/* Approach dots — 2 rows */}
                {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
                  const x = 75 + t * 290
                  return (
                    <circle key={i} cx={x} cy={118} r={2.5} fill="#fef3c7" opacity="0.45" />
                  )
                })}
                {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
                  const x = 75 + t * 290
                  return (
                    <circle key={i} cx={x} cy={122} r={2} fill="#fef3c7" opacity="0.25" />
                  )
                })}

                {/* Target arrows — 7 boards across lane in perspective */}
                {[0.1, 0.22, 0.34, 0.50, 0.66, 0.78, 0.90].map((t, i) => {
                  const progress = 0.55  // arrows are about 55% of the way up
                  const xBottom = 60 + t * 320
                  const xTop = 130 + t * 180
                  const x = xBottom + progress * (xTop - xBottom)
                  const y = 125 - progress * (125 - 10)
                  const arrowH = 6 - progress * 2
                  return (
                    <polygon
                      key={i}
                      points={`${x},${y - arrowH} ${x - 3},${y + arrowH * 0.5} ${x + 3},${y + arrowH * 0.5}`}
                      fill={i === 2 ? '#fbbf24' : 'rgba(254,243,199,0.35)'}
                      opacity={i === 2 ? 0.85 : 0.55}
                    />
                  )
                })}

                {/* Pin arrangement at far end (perspective-scaled) */}
                {/* Row 1 — 1 pin */}
                <circle cx={220} cy={16} r={5} fill="#f9fafb" opacity="0.90" />
                {/* Row 2 — 2 pins */}
                <circle cx={212} cy={23} r={5} fill="#f9fafb" opacity="0.88" />
                <circle cx={228} cy={23} r={5} fill="#f9fafb" opacity="0.88" />
                {/* Row 3 — 3 pins */}
                <circle cx={204} cy={30} r={5} fill="#f9fafb" opacity="0.85" />
                <circle cx={220} cy={30} r={5} fill="#f9fafb" opacity="0.85" />
                <circle cx={236} cy={30} r={5} fill="#f9fafb" opacity="0.85" />
                {/* Row 4 — 4 pins */}
                <circle cx={196} cy={37} r={5} fill="#f9fafb" opacity="0.82" />
                <circle cx={212} cy={37} r={5} fill="#f9fafb" opacity="0.82" />
                <circle cx={228} cy={37} r={5} fill="#f9fafb" opacity="0.82" />
                <circle cx={244} cy={37} r={5} fill="#f9fafb" opacity="0.82" />

                {/* Ball trajectory line */}
                <path
                  d="M 218 125 Q 200 80 215 50 Q 218 42 220 37"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.65"
                />

                {/* Entry angle label */}
                <text x="155" y="55" fontFamily="ui-monospace, monospace" fontSize="8" fill="rgba(220,38,38,0.75)" fontWeight="700">4–6° ENTRY</text>
                <line x1="185" y1="53" x2="210" y2="46" stroke="rgba(220,38,38,0.50)" strokeWidth="1" />
              </svg>
            </div>

            <p className="bowl-hero-sub">Ball Dynamics · Biomechanics · Injury Science · Mental Game</p>

            <p className="bowl-hero-desc">
              The physics, biomechanics, and psychology behind elite bowling performance,
              from reactive-resin hook trajectories to perfect-game automaticity.
            </p>

            <div className="bowl-hero-tags">
              {['Reactive Resin Physics', 'Oil Pattern Science', '450 rpm Hook', 'Thumb Release Timing', 'Spare Conversion', '300 Game Psychology'].map((tag) => (
                <span key={tag} className="bowl-hero-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="bowl-main">

          {/* ── Key Stats ── */}
          <div>
            <div className="bowl-section-label">Key Metrics</div>
            <div className="bowl-stats-grid">
              {KEY_STATS.map((stat) => (
                <div key={stat.label} className="bowl-stat-cell">
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.color }} />
                  <span className="bowl-stat-value" style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}44` }}>
                    {stat.value}
                  </span>
                  <span className="bowl-stat-label">{stat.label}</span>
                  <span className="bowl-stat-sub">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Hook Trajectory Chart ── */}
          <div>
            <div className="bowl-section-label">Hook Trajectory by Revolution Rate</div>
            <div className="bowl-chart-wrap">
              <div className="bowl-chart-header">
                <div>
                  <div className="bowl-chart-title">Hook Boards by Player Style</div>
                  <div className="bowl-chart-citation">Stremler 2009 — USBC Bowling Academy · Schlegel 2018 — PBA Rev Rate Analysis</div>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#dc2626', fontWeight: 700, letterSpacing: '0.08em' }}>
                  MAX: 28 BOARDS
                </div>
              </div>

              <div style={{ padding: '20px 20px 16px', overflowX: 'auto' }}>
                <svg
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  style={{ width: '100%', minWidth: 260, height: CHART_H, display: 'block' }}
                  aria-label="Hook trajectory boards by revolution rate"
                >
                  {/* Grid lines */}
                  {[0, 5, 10, 15, 20, 25, 30].map((b) => {
                    const x = CHART_PAD_L + (b / MAX_BOARDS) * CHART_PLOT_W
                    return (
                      <g key={b}>
                        <line
                          x1={x} y1={CHART_PAD_T}
                          x2={x} y2={CHART_H - CHART_PAD_B}
                          stroke="rgba(146,64,14,0.15)"
                          strokeWidth={1}
                        />
                        <text
                          x={x} y={CHART_H - 7}
                          textAnchor="middle"
                          fill="rgba(146,64,14,0.45)"
                          fontSize={9}
                          fontFamily="ui-monospace, monospace"
                        >
                          {b}
                        </text>
                      </g>
                    )
                  })}

                  {/* Bars */}
                  {HOOK_DATA.map((row, i) => {
                    const y = CHART_PAD_T + i * CHART_PLOT_H
                    const bw = (row.boards / MAX_BOARDS) * CHART_PLOT_W
                    const isHigh = row.boards >= 20
                    return (
                      <g key={row.label}>
                        <rect
                          x={0} y={y + 2}
                          width={CHART_W} height={CHART_PLOT_H - 4}
                          fill={isHigh ? 'rgba(220,38,38,0.04)' : 'transparent'}
                        />
                        <text
                          x={CHART_PAD_L - 8}
                          y={y + CHART_PLOT_H / 2 - 4}
                          textAnchor="end"
                          fill={isHigh ? '#dc2626' : '#5a4535'}
                          fontSize={11}
                          fontFamily="'Lato', sans-serif"
                          fontWeight={900}
                          letterSpacing="0.04em"
                        >
                          {row.label.toUpperCase()}
                        </text>
                        <text
                          x={CHART_PAD_L - 8}
                          y={y + CHART_PLOT_H / 2 + 9}
                          textAnchor="end"
                          fill="rgba(146,64,14,0.40)"
                          fontSize={9}
                          fontFamily="ui-monospace, monospace"
                        >
                          {row.rpm}
                        </text>
                        <rect
                          x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                          width={CHART_PLOT_W} height={16}
                          fill="rgba(146,64,14,0.06)"
                        />
                        <defs>
                          <linearGradient id={`bowl-bar-${i}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={row.barColor} stopOpacity="0.70" />
                            <stop offset="100%" stopColor={row.color} />
                          </linearGradient>
                        </defs>
                        <rect
                          x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                          width={bw} height={16}
                          fill={`url(#bowl-bar-${i})`}
                        />
                        {isHigh && (
                          <rect
                            x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                            width={bw} height={16}
                            fill="none"
                            stroke={`${row.color}44`}
                            strokeWidth={1}
                          />
                        )}
                        <text
                          x={CHART_PAD_L + bw + 8}
                          y={y + CHART_PLOT_H / 2 + 5}
                          fill={isHigh ? row.color : '#5a4535'}
                          fontSize={12}
                          fontFamily="'Alfa Slab One', serif"
                        >
                          {row.boards} boards
                        </text>
                      </g>
                    )
                  })}

                  {/* X-axis label */}
                  <text
                    x={CHART_PAD_L + CHART_PLOT_W / 2}
                    y={CHART_H - 1}
                    textAnchor="middle"
                    fill="rgba(146,64,14,0.40)"
                    fontSize={9}
                    fontFamily="ui-monospace, monospace"
                  >
                    boards of hook (left of release point)
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* ── Science Cards ── */}
          <div>
            <div className="bowl-section-label">Research Deep-Dive</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SCIENCE_CARDS.map((card) => (
                <div key={card.id} className="bowl-science-card">
                  <div className="bowl-card-number" style={{ color: card.accent }}>{card.number}</div>
                  <div
                    className="bowl-card-header"
                    style={{ background: card.accentDim, borderBottom: `1px solid ${card.accentBorder}` }}
                  >
                    <div className="bowl-card-accent-bar" style={{ background: card.accent }} />
                    <h2 className="bowl-card-title" style={{ color: card.accent }}>
                      {card.title}
                    </h2>
                  </div>
                  <div>
                    {card.findings.map((finding, fi) => (
                      <div
                        key={fi}
                        className="bowl-finding-row"
                        style={{
                          borderBottomColor: fi === card.findings.length - 1 ? 'transparent' : 'rgba(146,64,14,0.10)',
                        }}
                      >
                        <div className="bowl-finding-stat-block">
                          <span className="bowl-finding-stat" style={{ color: card.accent }}>
                            {finding.stat}
                          </span>
                          <span className="bowl-finding-stat-label">{finding.statLabel}</span>
                        </div>
                        <div>
                          <span className="bowl-finding-citation" style={{ color: card.accent }}>
                            {finding.citation}
                          </span>
                          <p className="bowl-finding-detail">{finding.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer note ── */}
          <div className="bowl-footer-note">
            Science content references peer-reviewed literature, USBC research, and PBA performance data. Individual bowling results vary based on equipment, technique, and lane conditions. This page is for educational purposes only.
          </div>

        </main>
      </div>
    </>
  )
}
