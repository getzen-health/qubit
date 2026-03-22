// Motor Sports Science — server component
// G-force physiology, reaction time, driver conditioning, and racing preparation science.

// ─── G-Force Chart Data ───────────────────────────────────────────────────────

const GFORCE_DATA = [
  { label: 'F1 High-Speed Corner', g: 5.5, color: '#dc2626', barColor: '#b91c1c', desc: 'Silverstone Copse — lateral G' },
  { label: 'F1 Braking', g: 5.0, color: '#dc2626', barColor: '#991b1b', desc: '300→80 km/h in 1.5 s' },
  { label: 'MotoGP Braking', g: 6.0, color: '#f97316', barColor: '#ea580c', desc: 'Peak deceleration — arms only' },
  { label: 'NASCAR Banking', g: 2.5, color: '#9ca3af', barColor: '#6b7280', desc: 'Oval superspeedway banking' },
  { label: 'Rally Bump', g: 3.5, color: '#9ca3af', barColor: '#6b7280', desc: 'Airborne landing impact' },
]

const MAX_G = 7.0

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'gforce',
    number: '01',
    title: 'G-Force & Physical Demands',
    accent: '#dc2626',
    accentDim: 'rgba(220,38,38,0.10)',
    accentBorder: 'rgba(220,38,38,0.28)',
    findings: [
      {
        citation: 'FIA Technical Regulations + Côté 2003 — F1 Physiological Demands',
        stat: '5.5 G',
        statLabel: 'F1 corner lateral',
        detail:
          'Formula 1 cornering G-forces: Silverstone Copse corner generates 5.5 G lateral load — braking from 300 km/h to 80 km/h generates 5 G deceleration in 1.5 s. Neck muscles must support a 6 kg helmet experiencing forces up to 30 kg. Neck hypertrophy is the most distinctive physical adaptation in F1 drivers, visible even in profile photographs. Drivers describe sustained high-G cornering as like holding a heavy weight sideways against your head for 2–4 seconds at a time, repeated 50+ times per race.',
      },
      {
        citation: 'Côté 2003 — F1 physiological demands; Watkins 1998 — The Science of Formula 1 Design',
        stat: '4–5×',
        statLabel: 'Driver neck strength vs. general pop.',
        detail:
          'Neck extensor and lateral flexor strength requirements are extreme: isometric neck holds at 5 G require sustained force production impossible without specific hypertrophy. Training protocols include neck harness work, cable neck flexion/extension/lateral flexion in all planes, and simulator time at high-G. Aerodynamicist Adrian Newey\'s low-rake chassis philosophy forced cockpit positions requiring extreme neck angles, further increasing demands. Elite F1 drivers typically have neck circumference 42–46 cm vs. 36–38 cm in untrained males.',
      },
      {
        citation: 'Racinot 2012 — Singapore GP thermal analysis; F1 medical team data',
        stat: '41°C',
        statLabel: 'Cockpit air temperature',
        detail:
          'Thermal stress in F1 cockpits: cockpit temperature 40–50°C at Singapore GP, driver core temperature rising 1.5–2.0°C during a 90-minute race. Sweat loss: 2–3 kg (L) per race — dehydration of this magnitude reduces cognitive processing speed by 5–8% and reaction time by 3–5%. Pre-cooling strategies (ice vest worn on grid, cold towels at pit stops) used by all F1 teams. Driver fluid intake during race: 1.0–1.5 L delivered via drink bottle through helmet straw.',
      },
      {
        citation: 'Biral 2005 — MotoGP biomechanical analysis; Cossalter 2004 — Motorcycle Dynamics',
        stat: '6.0 G',
        statLabel: 'MotoGP peak braking G',
        detail:
          'Motorcycle racing G-forces are generated without the structural support of a car chassis — riders hang off the bike in corners at extreme lean angles (>60°) and absorb braking forces through arms and core alone. Physical demands include forearm and grip fatigue (\'arm pump\' — acute exertional compartment syndrome in forearms), where forearm compartment pressure exceeds perfusion pressure causing progressive grip weakness. Treatment: fasciotomy in severe cases. Core engagement for high-G position changes is critical; MotoGP riders typically deadlift 2.0–2.5× bodyweight in preparation.',
      },
    ],
  },
  {
    id: 'cognition',
    number: '02',
    title: 'Reaction Time & Cognitive Demands',
    accent: '#f97316',
    accentDim: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    findings: [
      {
        citation: 'FIA Race Data 2022–2024 — Lights-Out Reaction Analysis',
        stat: '0.20 s',
        statLabel: 'Lights-out reaction time',
        detail:
          'F1 start reaction times (2022–2024 data): optimal window 0.18–0.22 s. False start threshold: <0.10 s (anticipation rather than reaction). Sensory processing chain: retinal latency 40 ms + cognitive processing 80 ms + motor execution 60 ms = ~180 ms minimum. Visual cortex processes the sequential extinction of 5 red lights; drivers track the onset of darkness rather than individual lights. Practice effect: professional reaction time at race start is approximately 15% faster than untrained subjects performing equivalent visual reaction tasks, reflecting neural efficiency from thousands of repetitions.',
      },
      {
        citation: 'Williams 2018 — Cognitive Load in Motorsport; Stanton 2009 — Driver Decision Making',
        stat: '200+',
        statLabel: 'Critical decisions per lap',
        detail:
          'Cognitive load analysis in F1: gear selection (8 gears, 50+ shifts per lap at Monaco), braking point selection (10+ heavy braking zones per lap), traction and throttle management, fuel-saving mode adjustments, radio communication from engineer, competitor positioning across 19 other drivers. Each decision must be executed within a narrow temporal window at speeds where an error means missing a braking zone at 300 km/h. Mental fatigue over a 90-minute race measurably degrades late-race decision making; F1 drivers train cognitive endurance through 3–4 hour simulator sessions.',
      },
      {
        citation: 'Abernethy 2001 — Expert-Novice Perception Research; Land & Tatler 2001 — Gaze in driving',
        stat: '3×',
        statLabel: 'Info perceived per second vs. novice',
        detail:
          'Proprioception and spatial awareness in racing drivers: simultaneously updating mental model of 20 competitors while managing car balance, calculating closing speeds of 50+ m/s from mirrors, and processing radar-derived gap information. Expert racing drivers perceive effectively 3× more information per second vs. novice drivers — a well-documented phenomenon in sport expertise research (Abernethy 2001). Gaze tracking studies show experts use far fewer fixation points while extracting superior situational information, reflecting pattern-recognition chunking developed over years.',
      },
      {
        citation: 'Abernethy 2001 — Dual Task in Expert Athletes; Tenenbaum 2003 — Sport Cognition',
        stat: '8+',
        statLabel: 'Simultaneous management tasks',
        detail:
          'F1 drivers simultaneously manage: optimal racing line, braking points, tyre temperature management (tyres operate best at 80–110°C), fuel management (saving fuel by lift-and-coast reduces drag), competitor responses and defensive positioning, team radio information processing, and weather/track condition monitoring. Research on expert-novice differences in motor sport (Abernethy 2001) demonstrates that this apparent dual-tasking represents genuine parallel processing in experts rather than rapid task-switching — lower-level vehicle control is fully automatised, freeing attentional resources for tactical decisions.',
      },
    ],
  },
  {
    id: 'physiology',
    number: '03',
    title: 'Physiology of Racing Drivers',
    accent: '#dc2626',
    accentDim: 'rgba(220,38,38,0.10)',
    accentBorder: 'rgba(220,38,38,0.28)',
    findings: [
      {
        citation: 'Watkins 1998 — The Science of Formula 1; Klarica 2012 — F1 Fitness Report',
        stat: '60 mL/kg',
        statLabel: 'F1 driver VO₂max average',
        detail:
          'F1 driver aerobic fitness: VO₂max 55–65 mL/kg/min required for race endurance — comparable to middle-distance runners and road cyclists. Heart rate during race: 140–180 bpm sustained for 90 minutes (70–90% HRmax) despite no traditional aerobic locomotion. This is driven by isometric muscle contraction, thermal stress, and sympathetic activation (adrenaline). Michael Schumacher\'s reported resting HR: 36 bpm — elite endurance athlete level. Jenson Button competed as a triathlete to develop his aerobic base.',
      },
      {
        citation: 'Ricard 2002 — Steering Force Research; FIA Technical Working Group Data',
        stat: '25–35 kg',
        statLabel: 'Steering force at fast corners',
        detail:
          'Steering force requirements: F1 steering wheel at fast corners (Copse, Eau Rouge, 130R Suzuka) requires 25–35 kg force from driver, 8–12 kg through slow corners. Combined with G-force amplification of arm mass (at 5 G, a 4 kg arm weighs 20 kg), forearm and shoulder endurance becomes critical. Hydraulic power steering is permitted from 2022 regulations with strict limits; drivers previously managed entirely manually. Training: steering simulator with load cell resistance, cable isometric exercises, farmer\'s carry progressions for grip endurance.',
      },
      {
        citation: 'FIA 2023 Technical Regulations — Article 4.6 (Driver + Seat Weight); Hamilton vs. Verstappen Data',
        stat: '80 kg',
        statLabel: 'Minimum driver + seat weight (FIA)',
        detail:
          'FIA weight ballast system ensures lighter drivers carry ballast, equalising the mechanical advantage of low body mass. Racing weight maintained: 68–72 kg. Training implications: F1 drivers face the paradox of needing high strength-to-weight ratio while minimising total mass. Dehydration is sometimes used to meet weight targets, but >2% dehydration measurably impairs cognitive performance in the heat — counterproductive. Muscle mass is preserved through resistance training while aerobic training controls fat mass.',
      },
      {
        citation: 'Pope 2003 — Vibration and Spinal Health; Mansfield 2005 — Whole-Body Vibration in Vehicles',
        stat: '4–8 Hz',
        statLabel: 'Resonant spinal frequency in rally cars',
        detail:
          'Road vibration transmission through racing car chassis to spine presents cumulative injury risk. Rally car drivers are particularly affected — WRC cars generate whole-body vibration at 4–8 Hz, which resonates with lumbar spinal structures. Spinal disc degeneration documented in long-career rally drivers. Formula 1 kerb-riding creates brief high-magnitude impacts. Seat design and damping systems mitigate but cannot eliminate vibration. Core stability and lumbar muscular endurance training is essential for vibration absorption and force attenuation.',
      },
    ],
  },
  {
    id: 'training',
    number: '04',
    title: 'Training & Preparation Science',
    accent: '#f97316',
    accentDim: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    findings: [
      {
        citation: 'Klarica 2012 — Elite F1 Driver Preparation; Hamilton & Verstappen Training Programmes',
        stat: '6–8 hr',
        statLabel: 'Daily preparation at race peaks',
        detail:
          'Physical training programme for F1 drivers: neck work (daily, multiple sets), core stability (plank variations, pallof press, anti-rotation), cardiovascular fitness (cycling preferred for joint-sparing cardio, swimming, running), reaction/coordination training (boxing, table tennis, video games — documented by Nikita Mazepin\'s reaction training), simulator work (2–4 hours), and mental preparation with sport psychologist. Total preparation 6–8 hours/day during intensive pre-season periods. Race weekends: simulator debrief, physical maintenance, PR obligations reduce available training time.',
      },
      {
        citation: 'FIA Simulator Report 2023; Mercedes AMG F1 Technical Brief (public); Correlation Studies 2019–2024',
        stat: '95%',
        statLabel: 'F1 testing now virtual',
        detail:
          'Formula 1 simulator technology has replaced physical testing: full-motion 6-DOF hexapod simulator used for setup work and novel circuit learning; static high-fidelity sim for driving style development and team strategy. Validity coefficient 0.87–0.92 correlation with real-lap time sector performance. New circuit learning: 50+ laps on simulator before physical track time means drivers arrive with accurate mental models. Cost: $10–15M USD per simulator for works teams (Mercedes, Red Bull, Ferrari). Teams also use iRacing-based tools for junior driver development.',
      },
      {
        citation: 'Gibson 2010 — Heat Acclimatisation for Sport; F1 Medical Commission — Singapore Protocol',
        stat: '10–14 days',
        statLabel: 'Heat acclimatisation before Singapore/Abu Dhabi',
        detail:
          'Pre-race heat adaptation protocol: 10–14 days of training in hot conditions (typically Bahrain or UAE training camp) increases plasma volume 8–12%, reduces thermal perception, lowers heart rate response to equivalent exercise intensity, and improves whole-body cooling efficiency. Specifically for Singapore GP (30–34°C, 80–90% humidity) and Abu Dhabi (35–40°C, low humidity), all top F1 teams implement formal heat camp protocols. Core temperature ceiling during race: 39.5°C optimal; >40°C produces measurable cognitive impairment.',
      },
      {
        citation: 'Soracco 2018 — Dakar Physiology; WRC Medical Services Data; Peugeot/Toyota Rally Report',
        stat: '8,000 km',
        statLabel: 'Dakar Rally total distance',
        detail:
          'Rally driving presents unique physical and mental demands distinct from circuit racing: co-driver pace notes delivery at 220 km/h on gravel roads requires simultaneous navigation and safety management, 100% co-driver concentration across 15–30 stage kilometres with zero room for distraction. Night stage visual adaptation: rhodopsin recovery becomes critical after pace car headlights. Mental endurance across 14-day rallies produces cumulative cognitive fatigue. Dakar Rally: 8,000 km in 14 stages through desert at sustained high intensity. Physical demands include vibration management, sleep restriction (4–6 hr/night), and altitude variation on mountain stages.',
      },
    ],
  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '5.5 G', label: 'F1 Corner G-Force', sub: 'Silverstone Copse — lateral load', color: '#dc2626' },
  { value: '0.20 s', label: 'Lights-Out Reaction', sub: 'Optimal window 0.18–0.22 s', color: '#f97316' },
  { value: '41°C', label: 'Cockpit Temperature', sub: 'Singapore GP cockpit air temp', color: '#fbbf24' },
  { value: '4–5×', label: 'Driver Neck Strength', sub: 'vs. general population (Côté 2003)', color: '#9ca3af' },
]

// ─── SVG Chart Dimensions ─────────────────────────────────────────────────────

const CHART_W = 540
const CHART_H = 200
const CHART_PAD_L = 150
const CHART_PAD_R = 70
const CHART_PAD_T = 14
const CHART_PAD_B = 26
const CHART_PLOT_W = CHART_W - CHART_PAD_L - CHART_PAD_R
const CHART_PLOT_H = (CHART_H - CHART_PAD_T - CHART_PAD_B) / GFORCE_DATA.length

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MotorSportsSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --moto-dark: #050505;
          --moto-red: #dc2626;
          --moto-silver: #9ca3af;
          --moto-fire: #f97316;
          --moto-text: #f9fafb;
          --moto-card: #0d0d0d;
          --moto-card2: #111111;
          --moto-border: rgba(255,255,255,0.07);
          --moto-dim: rgba(220,38,38,0.08);
          --moto-mono: ui-monospace, 'SF Mono', monospace;
          --moto-body: 'Titillium Web', sans-serif;
        }

        .moto-page {
          min-height: 100vh;
          background: var(--moto-dark);
          color: var(--moto-text);
          font-family: var(--moto-body);
          position: relative;
          overflow-x: hidden;
        }

        /* ── Carbon fibre texture overlay ── */
        .moto-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.012) 0px,
              rgba(255,255,255,0.012) 1px,
              transparent 1px,
              transparent 8px
            ),
            repeating-linear-gradient(
              -45deg,
              rgba(255,255,255,0.012) 0px,
              rgba(255,255,255,0.012) 1px,
              transparent 1px,
              transparent 8px
            );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Hero ── */
        .moto-hero {
          position: relative;
          overflow: hidden;
          background: #030303;
          border-bottom: 2px solid #1a0000;
        }

        .moto-hero::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--moto-red), var(--moto-fire), var(--moto-red), transparent);
        }

        .moto-hero-glow {
          position: absolute;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 1000px; height: 700px;
          background: radial-gradient(ellipse at 50% 15%, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0.06) 40%, transparent 65%);
          pointer-events: none;
        }

        .moto-hero-glow-side {
          position: absolute;
          top: 0; right: -80px;
          width: 400px; height: 100%;
          background: radial-gradient(ellipse at 100% 50%, rgba(249,115,22,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Speed stripe decorations */
        .moto-speed-stripe {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.20) 20%, rgba(220,38,38,0.40) 50%, rgba(249,115,22,0.20) 80%, transparent 100%);
        }

        .moto-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 72px 24px 60px;
          text-align: center;
        }

        .moto-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--moto-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--moto-red);
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.28);
          padding: 7px 18px;
          margin-bottom: 28px;
        }

        .moto-hero-eyebrow::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          background: var(--moto-red);
          border-radius: 50%;
          animation: moto-pulse 2s ease-in-out infinite;
        }

        @keyframes moto-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.65); }
        }

        .moto-hero-title {
          font-family: var(--moto-body);
          font-size: clamp(52px, 11vw, 110px);
          font-weight: 700;
          line-height: 0.90;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0 0 6px;
          text-shadow: 0 0 60px rgba(220,38,38,0.25), 0 2px 0 #1a0000;
        }

        .moto-hero-title span {
          color: var(--moto-red);
          display: block;
          text-shadow: 0 0 50px rgba(220,38,38,0.55), 0 2px 0 #1a0000;
        }

        .moto-hero-sub {
          font-family: var(--moto-body);
          font-size: clamp(13px, 2vw, 17px);
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--moto-silver);
          margin: 22px 0 8px;
        }

        .moto-hero-desc {
          font-family: var(--moto-body);
          font-size: 14px;
          font-weight: 400;
          color: rgba(249,250,251,0.38);
          max-width: 560px;
          margin: 0 auto 32px;
          line-height: 1.70;
          letter-spacing: 0.01em;
        }

        .moto-hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .moto-hero-tag {
          font-family: var(--moto-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--moto-silver);
          background: rgba(156,163,175,0.07);
          border: 1px solid rgba(156,163,175,0.18);
          padding: 5px 12px;
        }

        /* ── Main layout ── */
        .moto-main {
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
        .moto-section-label {
          font-family: var(--moto-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--moto-red);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .moto-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(220,38,38,0.35), transparent);
        }

        /* ── Stats grid ── */
        .moto-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          border: 1px solid rgba(220,38,38,0.18);
          background: rgba(220,38,38,0.08);
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .moto-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .moto-stat-cell {
          background: var(--moto-card);
          padding: 22px 16px;
          position: relative;
          overflow: hidden;
        }

        .moto-stat-value {
          font-family: var(--moto-body);
          font-size: clamp(26px, 5vw, 40px);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.01em;
          display: block;
          margin-bottom: 6px;
        }

        .moto-stat-label {
          font-family: var(--moto-body);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--moto-silver);
          margin-bottom: 4px;
          display: block;
        }

        .moto-stat-sub {
          font-family: var(--moto-mono);
          font-size: 9px;
          color: rgba(156,163,175,0.50);
          letter-spacing: 0.02em;
          line-height: 1.4;
        }

        /* ── Chart ── */
        .moto-chart-wrap {
          background: var(--moto-card);
          border: 1px solid var(--moto-border);
          overflow: hidden;
          position: relative;
        }

        .moto-chart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--moto-red), transparent);
        }

        .moto-chart-header {
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .moto-chart-title {
          font-family: var(--moto-body);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--moto-text);
          margin: 0 0 3px;
        }

        .moto-chart-citation {
          font-family: var(--moto-mono);
          font-size: 10px;
          color: rgba(156,163,175,0.40);
        }

        /* ── Science cards ── */
        .moto-science-card {
          border: 1px solid var(--moto-border);
          background: var(--moto-card);
          overflow: hidden;
          position: relative;
        }

        .moto-card-number {
          font-family: var(--moto-body);
          font-size: 90px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          right: 16px;
          top: 4px;
          opacity: 0.05;
          letter-spacing: -0.04em;
          pointer-events: none;
          user-select: none;
        }

        .moto-card-header {
          padding: 18px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          position: relative;
        }

        .moto-card-accent-bar {
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 3px;
        }

        .moto-card-title {
          font-family: var(--moto-body);
          font-size: clamp(16px, 3vw, 22px);
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          line-height: 1.10;
          margin: 0;
          padding-left: 12px;
        }

        .moto-finding-row {
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          position: relative;
        }

        @media (min-width: 580px) {
          .moto-finding-row { grid-template-columns: 96px 1fr; }
        }

        .moto-finding-stat-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex-shrink: 0;
        }

        .moto-finding-stat {
          font-family: var(--moto-body);
          font-size: clamp(18px, 3.5vw, 26px);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.01em;
        }

        .moto-finding-stat-label {
          font-family: var(--moto-mono);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(156,163,175,0.55);
          line-height: 1.3;
        }

        .moto-finding-citation {
          font-family: var(--moto-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .moto-finding-detail {
          font-family: var(--moto-body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.72;
          color: rgba(249,250,251,0.46);
          letter-spacing: 0.01em;
        }

        /* ── Footer ── */
        .moto-footer-note {
          font-family: var(--moto-mono);
          font-size: 10px;
          color: #2a2a2a;
          line-height: 1.7;
          border-top: 1px solid #181818;
          padding-top: 24px;
        }
      `}} />

      <div className="moto-page">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="moto-hero">
          <div className="moto-hero-glow" />
          <div className="moto-hero-glow-side" />
          <div className="moto-speed-stripe" style={{ top: '30%' }} />
          <div className="moto-speed-stripe" style={{ top: '55%', opacity: 0.6 }} />
          <div className="moto-speed-stripe" style={{ top: '78%', opacity: 0.3 }} />

          <div className="moto-hero-inner">
            <div>
              <span className="moto-hero-eyebrow">Motorsport Science</span>
            </div>

            <h1 className="moto-hero-title">
              Motor Sports
              <span>Science</span>
            </h1>

            <div style={{ margin: '28px auto 32px', maxWidth: 460 }}>
              <svg
                viewBox="0 0 460 120"
                style={{ width: '100%', height: 'auto', display: 'block', opacity: 0.85 }}
                aria-label="F1 car top-down silhouette with G-force arrows"
              >
                {/* Speed lines left */}
                <line x1="10" y1="40" x2="90" y2="50" stroke="rgba(220,38,38,0.25)" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="5" y1="55" x2="80" y2="60" stroke="rgba(220,38,38,0.18)" strokeWidth="1" strokeDasharray="5 4" />
                <line x1="10" y1="70" x2="85" y2="72" stroke="rgba(220,38,38,0.12)" strokeWidth="1" strokeDasharray="3 5" />
                <line x1="15" y1="85" x2="90" y2="84" stroke="rgba(220,38,38,0.08)" strokeWidth="1" strokeDasharray="6 4" />

                {/* Speed lines right */}
                <line x1="450" y1="40" x2="370" y2="50" stroke="rgba(220,38,38,0.25)" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="455" y1="55" x2="380" y2="60" stroke="rgba(220,38,38,0.18)" strokeWidth="1" strokeDasharray="5 4" />
                <line x1="450" y1="70" x2="375" y2="72" stroke="rgba(220,38,38,0.12)" strokeWidth="1" strokeDasharray="3 5" />
                <line x1="445" y1="85" x2="370" y2="84" stroke="rgba(220,38,38,0.08)" strokeWidth="1" strokeDasharray="6 4" />

                {/* F1 car — top-down silhouette */}
                {/* Nose cone */}
                <path d="M 230 8 L 215 28 L 245 28 Z" fill="#9ca3af" opacity="0.80" />
                {/* Front wing */}
                <rect x="170" y="24" width="120" height="8" rx="2" fill="#6b7280" opacity="0.70" />
                {/* Front wing endplates */}
                <rect x="168" y="22" width="6" height="12" rx="1" fill="#4b5563" opacity="0.80" />
                <rect x="286" y="22" width="6" height="12" rx="1" fill="#4b5563" opacity="0.80" />
                {/* Monocoque / tub */}
                <path d="M 215 28 L 205 90 L 220 96 L 230 98 L 240 96 L 255 90 L 245 28 Z" fill="#e5e7eb" opacity="0.22" />
                {/* Sidepods left */}
                <path d="M 205 42 L 168 50 L 165 80 L 205 82 Z" fill="#9ca3af" opacity="0.55" />
                {/* Sidepods right */}
                <path d="M 255 42 L 292 50 L 295 80 L 255 82 Z" fill="#9ca3af" opacity="0.55" />
                {/* Engine cover / roll hoop */}
                <rect x="220" y="36" width="20" height="12" rx="3" fill="#dc2626" opacity="0.70" />
                {/* Rear bodywork */}
                <path d="M 205 82 L 215 100 L 245 100 L 255 82 Z" fill="#6b7280" opacity="0.60" />
                {/* Rear wing */}
                <rect x="175" y="100" width="110" height="7" rx="2" fill="#6b7280" opacity="0.65" />
                {/* Rear wing endplates */}
                <rect x="173" y="98" width="5" height="11" rx="1" fill="#4b5563" opacity="0.75" />
                <rect x="282" y="98" width="5" height="11" rx="1" fill="#4b5563" opacity="0.75" />
                {/* Front-left tyre */}
                <ellipse cx="173" cy="36" rx="10" ry="6" fill="#374151" opacity="0.85" />
                {/* Front-right tyre */}
                <ellipse cx="287" cy="36" rx="10" ry="6" fill="#374151" opacity="0.85" />
                {/* Rear-left tyre */}
                <ellipse cx="170" cy="86" rx="13" ry="7" fill="#374151" opacity="0.85" />
                {/* Rear-right tyre */}
                <ellipse cx="290" cy="86" rx="13" ry="7" fill="#374151" opacity="0.85" />

                {/* Lateral G-force arrow — left */}
                <defs>
                  <marker id="moto-arrow-l" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" />
                  </marker>
                  <marker id="moto-arrow-r" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto-start-reverse">
                    <path d="M6,0 L0,3 L6,6 Z" fill="#dc2626" />
                  </marker>
                  <marker id="moto-arrow-up" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
                    <path d="M0,6 L3,0 L6,6 Z" fill="#f97316" />
                  </marker>
                </defs>
                <line x1="120" y1="60" x2="162" y2="60" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moto-arrow-l)" opacity="0.80" />
                <text x="95" y="57" fontFamily="ui-monospace, monospace" fontSize="9" fill="#dc2626" opacity="0.80" fontWeight="700">5.5G</text>
                <text x="91" y="67" fontFamily="ui-monospace, monospace" fontSize="8" fill="rgba(220,38,38,0.50)">LATERAL</text>

                {/* Lateral G-force arrow — right */}
                <line x1="340" y1="60" x2="298" y2="60" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moto-arrow-l)" opacity="0.80" style={{ transform: 'scaleX(-1)', transformOrigin: '319px 60px' }} />
                <line x1="300" y1="60" x2="340" y2="60" stroke="#dc2626" strokeWidth="2" markerEnd="url(#moto-arrow-l)" opacity="0.00" />
                {/* Just draw the right arrow manually */}
                <line x1="340" y1="60" x2="302" y2="60" stroke="#dc2626" strokeWidth="2" opacity="0.80" />
                <polygon points="298,57 298,63 304,60" fill="#dc2626" opacity="0.80" />

                {/* Braking G-force arrow — front */}
                <line x1="230" y1="8" x2="230" y2="26" stroke="#f97316" strokeWidth="2" markerEnd="url(#moto-arrow-up)" opacity="0.75" style={{ transform: 'scaleY(-1)', transformOrigin: '230px 17px' }} />
                <line x1="230" y1="26" x2="230" y2="6" stroke="#f97316" strokeWidth="2" opacity="0.75" />
                <polygon points="226,8 234,8 230,2" fill="#f97316" opacity="0.75" />
                <text x="236" y="14" fontFamily="ui-monospace, monospace" fontSize="9" fill="#f97316" opacity="0.80" fontWeight="700">5G</text>
                <text x="234" y="23" fontFamily="ui-monospace, monospace" fontSize="8" fill="rgba(249,115,22,0.50)">BRAKE</text>
              </svg>
            </div>

            <p className="moto-hero-sub">G-Force · Cognition · Physiology · Preparation Science</p>

            <p className="moto-hero-desc">
              The peer-reviewed science behind F1 driver demands, reaction time,
              thermal physiology, and elite motorsport preparation.
            </p>

            <div className="moto-hero-tags">
              {['5.5G Lateral Load', 'Neck Hypertrophy', '0.20s Reaction', 'Arm Pump', 'Heat Acclimatisation', 'Sim Validity 0.92'].map((tag) => (
                <span key={tag} className="moto-hero-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="moto-main">

          {/* ── Key Stats ── */}
          <div>
            <div className="moto-section-label">Key Metrics</div>
            <div className="moto-stats-grid">
              {KEY_STATS.map((stat) => (
                <div key={stat.label} className="moto-stat-cell">
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.color }} />
                  <span className="moto-stat-value" style={{ color: stat.color, textShadow: `0 0 24px ${stat.color}44` }}>
                    {stat.value}
                  </span>
                  <span className="moto-stat-label">{stat.label}</span>
                  <span className="moto-stat-sub">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── G-Force Chart ── */}
          <div>
            <div className="moto-section-label">Peak G-Forces by Racing Category</div>
            <div className="moto-chart-wrap">
              <div className="moto-chart-header">
                <div>
                  <div className="moto-chart-title">Peak G-Forces by Racing Category</div>
                  <div className="moto-chart-citation">FIA Technical Data · Biral 2005 · NASCAR Race Engineering · WRC Technical Reports</div>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#dc2626', fontWeight: 700, letterSpacing: '0.08em' }}>
                  PEAK: 6.0 G
                </div>
              </div>

              <div style={{ padding: '20px 20px 16px', overflowX: 'auto' }}>
                <svg
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  style={{ width: '100%', minWidth: 280, height: CHART_H, display: 'block' }}
                  aria-label="Peak G-forces by racing category"
                >
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((g) => {
                    const x = CHART_PAD_L + (g / MAX_G) * CHART_PLOT_W
                    return (
                      <g key={g}>
                        <line
                          x1={x} y1={CHART_PAD_T}
                          x2={x} y2={CHART_H - CHART_PAD_B}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth={1}
                        />
                        <text
                          x={x} y={CHART_H - 7}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.18)"
                          fontSize={9}
                          fontFamily="ui-monospace, monospace"
                        >
                          {g}G
                        </text>
                      </g>
                    )
                  })}

                  {/* Danger threshold at 5.5G */}
                  {(() => {
                    const x = CHART_PAD_L + (5.5 / MAX_G) * CHART_PLOT_W
                    return (
                      <line
                        x1={x} y1={CHART_PAD_T}
                        x2={x} y2={CHART_H - CHART_PAD_B}
                        stroke="rgba(220,38,38,0.40)"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                      />
                    )
                  })()}

                  {/* Bars */}
                  {GFORCE_DATA.map((row, i) => {
                    const y = CHART_PAD_T + i * CHART_PLOT_H
                    const bw = (row.g / MAX_G) * CHART_PLOT_W
                    const isHigh = row.g >= 4.5
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
                          fill={isHigh ? '#dc2626' : '#5a6270'}
                          fontSize={10}
                          fontFamily="'Titillium Web', sans-serif"
                          fontWeight={700}
                          letterSpacing="0.04em"
                        >
                          {row.label.toUpperCase()}
                        </text>
                        <text
                          x={CHART_PAD_L - 8}
                          y={y + CHART_PLOT_H / 2 + 10}
                          textAnchor="end"
                          fill="#2d3240"
                          fontSize={9}
                          fontFamily="ui-monospace, monospace"
                        >
                          {row.desc}
                        </text>
                        <rect
                          x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                          width={CHART_PLOT_W} height={16}
                          fill="rgba(255,255,255,0.03)"
                        />
                        <defs>
                          <linearGradient id={`moto-bar-${i}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={row.barColor} stopOpacity="0.75" />
                            <stop offset="100%" stopColor={row.color} />
                          </linearGradient>
                        </defs>
                        <rect
                          x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                          width={bw} height={16}
                          fill={`url(#moto-bar-${i})`}
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
                          fill={isHigh ? row.color : '#4a5060'}
                          fontSize={13}
                          fontFamily="'Titillium Web', sans-serif"
                          fontWeight={700}
                        >
                          {row.g} G
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* ── Science Cards ── */}
          <div>
            <div className="moto-section-label">Research Deep-Dive</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SCIENCE_CARDS.map((card) => (
                <div key={card.id} className="moto-science-card">
                  <div className="moto-card-number" style={{ color: card.accent }}>{card.number}</div>
                  <div
                    className="moto-card-header"
                    style={{ background: card.accentDim, borderBottom: `1px solid ${card.accentBorder}` }}
                  >
                    <div className="moto-card-accent-bar" style={{ background: card.accent }} />
                    <h2 className="moto-card-title" style={{ color: card.accent }}>
                      {card.title}
                    </h2>
                  </div>
                  <div>
                    {card.findings.map((finding, fi) => (
                      <div
                        key={fi}
                        className="moto-finding-row"
                        style={{
                          borderBottomColor: fi === card.findings.length - 1 ? 'transparent' : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className="moto-finding-stat-block">
                          <span className="moto-finding-stat" style={{ color: card.accent }}>
                            {finding.stat}
                          </span>
                          <span className="moto-finding-stat-label">{finding.statLabel}</span>
                        </div>
                        <div>
                          <span className="moto-finding-citation" style={{ color: card.accent }}>
                            {finding.citation}
                          </span>
                          <p className="moto-finding-detail">{finding.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer note ── */}
          <div className="moto-footer-note">
            Science content references peer-reviewed literature and FIA/motorsport technical sources. G-force values represent peak measurements from instrumented vehicles. Individual physiological responses vary. This page is for educational purposes only.
          </div>

        </main>
      </div>
    </>
  )
}
