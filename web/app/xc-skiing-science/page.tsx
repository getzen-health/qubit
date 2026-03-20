// XC Skiing Science — static server component
// Evidence-based cross-country skiing science covering VO₂max physiology,
// polarized training, technique biomechanics, and altitude hematology.

export const metadata = { title: 'Cross-Country Skiing Science' }

// ─── VO₂max Comparison Data ───────────────────────────────────────────────────

const VO2MAX_SPORTS = [
  { sport: 'XC Skiing', value: 96, display: '96', color: '#00d4ff', elite: 'Dæhlie (Ingjer 1991)', barPct: 100 },
  { sport: 'Cycling', value: 88, display: '88', color: '#3b82f6', elite: 'Tour de France climbers', barPct: 92 },
  { sport: 'Running', value: 85, display: '85', color: '#6366f1', elite: 'Marathon world record', barPct: 89 },
  { sport: 'Rowing', value: 80, display: '80', color: '#8b5cf6', elite: 'Olympic scullers', barPct: 83 },
  { sport: 'Biathlon', value: 78, display: '78', color: '#a78bfa', elite: 'Elite competitors', barPct: 81 },
  { sport: 'Swimming', value: 70, display: '70', color: '#c4b5fd', elite: 'Olympic distance', barPct: 73 },
  { sport: 'Triathlon', value: 68, display: '68', color: '#ddd6fe', elite: 'Ironman world class', barPct: 71 },
  { sport: 'Sedentary', value: 35, display: '35', color: 'rgba(148,163,184,0.5)', elite: 'Untrained adult male', barPct: 36 },
]

// ─── Training Week Structure ──────────────────────────────────────────────────

const TRAINING_WEEK = [
  {
    day: 'MON',
    label: 'Long Distance',
    zone: 'Zone 1',
    zoneNum: 1,
    duration: '2.5–3 h',
    intensity: 'Low aerobic',
    color: '#00d4ff',
    barH: 40,
    type: 'Base',
  },
  {
    day: 'TUE',
    label: 'Strength + Short Ski',
    zone: 'Zone 1–2',
    zoneNum: 1,
    duration: '1.5 h',
    intensity: 'Gym + easy skiing',
    color: '#00b4d8',
    barH: 22,
    type: 'Support',
  },
  {
    day: 'WED',
    label: 'Threshold Intervals',
    zone: 'Zone 3',
    zoneNum: 3,
    duration: '90 min total',
    intensity: '4×8 min @ LT2',
    color: '#ef4444',
    barH: 70,
    type: 'Quality',
  },
  {
    day: 'THU',
    label: 'Recovery Ski',
    zone: 'Zone 1',
    zoneNum: 1,
    duration: '1–1.5 h',
    intensity: 'Easy movement',
    color: '#00d4ff',
    barH: 18,
    type: 'Recovery',
  },
  {
    day: 'FRI',
    label: 'VO₂max Intervals',
    zone: 'Zone 3',
    zoneNum: 3,
    duration: '75 min total',
    intensity: '5×5 min @ 95% HRmax',
    color: '#f97316',
    barH: 65,
    type: 'Quality',
  },
  {
    day: 'SAT',
    label: 'Long Endurance',
    zone: 'Zone 1–2',
    zoneNum: 2,
    duration: '3–4 h',
    intensity: 'Varying terrain',
    color: '#22c55e',
    barH: 55,
    type: 'Base',
  },
  {
    day: 'SUN',
    label: 'Rest / Mobility',
    zone: '—',
    zoneNum: 0,
    duration: '0–45 min',
    intensity: 'Full rest or yoga',
    color: 'rgba(148,163,184,0.4)',
    barH: 6,
    type: 'Rest',
  },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'vo2max',
    symbol: 'V',
    symbolSub: 'O₂',
    title: "World's Highest VO₂max Sport",
    accent: '#00d4ff',
    accentBg: 'rgba(0,212,255,0.07)',
    accentBorder: 'rgba(0,212,255,0.22)',
    iconBg: 'rgba(0,212,255,0.12)',
    iconBorder: 'rgba(0,212,255,0.3)',
    iconColor: '#7ee8fa',
    facts: [
      {
        citation: 'Ingjer 1991 (J Sports Sci)',
        text: 'Bjørn Dæhlie measured 96 mL/kg/min — the highest reliably documented VO₂max ever recorded in a human — in a Norwegian laboratory setting. XC skiing recruits the largest total muscle mass of any sport: arms, legs, core, and back activate simultaneously in double-pole technique, placing maximal demand on the cardiovascular system. Ingjer\'s cohort of elite Norwegian skiers averaged 82–88 mL/kg/min for males and 72–76 mL/kg/min for females, both far exceeding elite values in any other sport category.',
        stat: 'Dæhlie: 96 mL/kg/min — highest ever recorded',
      },
      {
        citation: 'Holmberg 2005 (Med Sci Sports Exerc)',
        text: 'Whole-body oxygen demand during double-poling at race pace reaches 90–95% of VO₂max, with peak upper-body power outputs of 500–700 W sustained over 30–60 second pole cycles on steep terrain. Unlike cycling or running which are lower-body dominant, the XC skiing skeleton integrates six major muscle groups in coordinated propulsion. Holmberg\'s motion-capture analysis showed that during the pole plant phase, trunk extensor muscles generate 40–45% of total propulsive impulse — uniquely taxing the entire muscular system.',
        stat: 'Race-pace O₂ demand: 90–95% VO₂max; double-pole peak power 500–700 W',
      },
      {
        citation: 'Scharhag 2002 (J Am Coll Cardiol)',
        text: 'Elite XC skiers exhibit the most pronounced "athlete\'s heart" of any sport. Echocardiographic studies show left ventricular internal diameter of 60–66 mm (normal 45–55 mm) and LV diastolic volume of 175–220 mL — exceeding even elite cyclists and rowers by 15–20%. Wall thickness is moderate (10–12 mm), representing a pure eccentric remodeling pattern from sustained high-volume aerobic demand. Right ventricular dimensions are similarly expanded, with biventricular hypertrophy reflecting the extraordinary cardiac output requirements of the sport.',
        stat: 'LV volume 175–220 mL; eccentric cardiac hypertrophy greatest of any sport',
      },
      {
        citation: 'Rusko 2003 (Blackwell Science)',
        text: 'Elite XC skiers sustain exercise at the second lactate threshold (LT2) at 92% of VO₂max — the highest LT2/VO₂max ratio documented across any endurance sport. This "right shift" of the lactate curve results from both extreme VO₂max development and exceptional mitochondrial density in type I muscle fibers. Race-pace blood lactate in XC skiing is only 4–6 mmol/L despite output near VO₂max, reflecting unparalleled metabolic efficiency. This LT2 ratio is the primary determinant of elite XC skiing performance across race distances from sprint (1.5 km) to 50 km.',
        stat: 'LT2 at 92% VO₂max — highest lactate threshold ratio in any endurance sport',
      },
    ],
  },
  {
    id: 'polarized',
    symbol: '80',
    symbolSub: '/20',
    title: 'Polarized Training & 80/20 Method',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.07)',
    accentBorder: 'rgba(34,197,94,0.22)',
    iconBg: 'rgba(34,197,94,0.12)',
    iconBorder: 'rgba(34,197,94,0.3)',
    iconColor: '#86efac',
    facts: [
      {
        citation: 'Seiler 2009 (Int J Sports Physiol Perform)',
        text: 'Analysis of Norwegian national team XC skiers\' training logs across 8+ years revealed a consistent polarized distribution: 80% of training volume in Zone 1 (below first ventilatory threshold, <75% HRmax) and approximately 20% in Zone 3 (above second ventilatory threshold, >87% HRmax), with almost zero time at moderate "threshold" intensities. This polarized model outperformed threshold-dominant models in multiple RCTs, with 3.5% greater VO₂max improvement in 9-week training blocks. Seiler coined the term "polarized training" from this Norwegian skiing data.',
        stat: '80% Zone 1, ~20% Zone 3; 0% moderate intensity; +3.5% VO₂max vs threshold model',
      },
      {
        citation: 'Rusko 2003 (Blackwell Science)',
        text: 'Finnish Institute of Sport analysis documented elite XC skiers accumulating 600–900 hours of annual training volume — the highest of any endurance sport except rowing (which is comparable). Weekly volume during base phases reaches 20–25 hours, with 85–88% conducted at conversational pace. Volume is the primary driver of capillary and mitochondrial density adaptations; Finnish national team data showed that athletes achieving >750 annual hours consistently outperformed those with <600 hours at the same intensity distribution, even when controlling for VO₂max.',
        stat: '600–900 hours/year; 20–25 h/week base phase; volume predicts LT2 independently of VO₂max',
      },
      {
        citation: 'Helgerud 2007 (Med Sci Sports Exerc)',
        text: 'The 4×8-minute interval protocol, refined at NTNU Trondheim through work with elite XC skiers, targets 90–95% HRmax over four 8-minute efforts with 3-minute active recovery. This protocol generates greater cardiac stroke volume adaptation (+10.8% vs +2.3% for threshold training) and superior VO₂max gains in trained athletes. Critically, the 8-minute duration (vs shorter 4-minute Tabata-type work) provides sufficient time for full VO₂max activation — producing ~6 minutes of each interval at true maximal oxygen uptake. The XC skiing community was the testing ground for this now globally-adopted protocol.',
        stat: '4×8 min @ 90–95% HRmax; SV +10.8% vs threshold; originated in Norwegian XC skiing',
      },
      {
        citation: 'Tonnessen 2014 (Int J Sports Physiol Perform)',
        text: 'Norwegian cross-country skiing uses double periodization: a spring/summer block (March–September) emphasizing volume base-building on roller skis and running at 85–90% Zone 1, followed by an autumn/winter competition block (October–March) with maintained volume but increased intensity fraction. The spring mesocycle increases annual VO₂max by ~3–5% before competition season. Tonnessen\'s longitudinal tracking of 14 national team athletes over 4 years found that athletes who maintained high summer volume (>500 h) showed continued VO₂max improvement even at the elite level, where gains typically plateau.',
        stat: 'Double periodization: spring volume base → winter quality; +3–5% VO₂max per annual cycle',
      },
    ],
  },
  {
    id: 'technique',
    symbol: '≋',
    symbolSub: 'SKI',
    title: 'Classical vs. Skating Technique',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.07)',
    accentBorder: 'rgba(167,139,250,0.22)',
    iconBg: 'rgba(167,139,250,0.12)',
    iconBorder: 'rgba(167,139,250,0.3)',
    iconColor: '#c4b5fd',
    facts: [
      {
        citation: 'Hoffman 1994 (Med Sci Sports Exerc)',
        text: 'Skating technique is 15–20% faster than classical diagonal-stride skiing at equivalent oxygen cost on groomed terrain — a decisive advantage that led to the creation of separate FIS disciplines after the 1985 World Championships. The velocity advantage derives from the V-shaped push angle generating better forward propulsion efficiency (θ = 15–25°) compared to classical\'s backward kick. Mechanical efficiency (work output/energy expenditure) is 27–32% in skating vs 23–27% in classical skiing. On steep uphills, the advantage narrows; in flat terrain, skating dominance is most pronounced.',
        stat: 'Skating 15–20% faster than classical at same O₂ cost; mechanical efficiency 27–32%',
      },
      {
        citation: 'Holmberg 2005 (Med Sci Sports Exerc)',
        text: 'Double-poling (DP) — using only poles without leg kick — has undergone a revolution since the 2000s. In sprint races and flat classical races, elite skiers now use DP for 60–80% of the course, abandoning the diagonal stride that dominated for a century. Holmberg\'s 3D kinematic analysis revealed optimal DP mechanics: pole plant at 68–72° from horizontal, elbow angle 80–95° at peak force, and trunk flexion of 35–40° generating peak vertical ground reaction forces of 1.4–1.8× body weight. Core power (not arm strength) is the primary limiter of DP performance.',
        stat: 'Double-poling now dominant: 60–80% of flat classical races; core power primary limiter',
      },
      {
        citation: 'Smith 2003 (J Appl Biomech)',
        text: 'The V2 skate technique (one pole plant per skate cycle) is optimal for flat to moderate uphill terrain, generating peak propulsive forces of 0.45–0.60× body weight per stride. V1 (asymmetric; two strides per double pole) is preferred on steep uphills above 8–10° grade. V2 Alternate (one pole per skate cycle, alternating sides) is rarely used by elites due to coordination demands. Transition between sub-techniques occurs within 0.3–0.5 s of reading terrain change — a neuromuscular skill requiring 5,000–8,000 hours of deliberate practice for automaticity at race pace.',
        stat: 'V2 optimal flat–moderate; V1 for >8–10° grade; sub-technique auto-switching after 5–8K hours',
      },
      {
        citation: 'Breitschädel 2010 (Cold Regions Sci Technol)',
        text: 'Wax selection in classical skiing is the technical dark art of the sport: fluorocarbon kick wax must match snow crystal form, temperature, humidity, and age within ±2°C for optimal glide-kick balance. Incorrect wax costs 3–8% velocity on race day. Glide wax (applied across the full ski base outside the kick zone) has undergone dramatic fluorocarbon bans (FIS 2023), increasing focus on structuring — microscale ski base texture from 0.3 μm to 2.5 μm Rₐ roughness tuned to snow water content. Stone grinding with computer-controlled linear structures now accounts for 40–60% of glide performance at World Cup level.',
        stat: 'Wax error = 3–8% velocity penalty; structure Ra 0.3–2.5 μm tuned to snow water content',
      },
    ],
  },
  {
    id: 'altitude',
    symbol: '↑',
    symbolSub: 'ALT',
    title: 'Altitude, Hematology & Recovery',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.07)',
    accentBorder: 'rgba(249,115,22,0.22)',
    iconBg: 'rgba(249,115,22,0.12)',
    iconBorder: 'rgba(249,115,22,0.3)',
    iconColor: '#fdba74',
    facts: [
      {
        citation: 'Stray-Gundersen 1992 (J Appl Physiol)',
        text: 'Live High–Train Low (LHTL) — sleeping at 2,500–3,000 m altitude while training at 1,200–1,500 m — produces a 5% increase in hemoglobin mass and 3–5% improvement in sea-level VO₂max after 4 weeks. The mechanism is EPO secretion from renal cells responding to hypoxia, stimulating erythropoiesis over 2–4 weeks. Norwegian and Finnish XC programs began systematic altitude camp implementation in the late 1980s, with athletes spending 8–12 weeks annually at altitude. The performance gain from 4 weeks LHTL equals approximately 18 months of sea-level training in elite athletes.',
        stat: 'LHTL 4 weeks: +5% hemoglobin mass, +3–5% VO₂max at sea level',
      },
      {
        citation: 'Mørkeberg 2014 (Drug Test Anal)',
        text: 'The Athlete Biological Passport (ABP) — longitudinal hematological monitoring — was specifically developed in response to historical EPO doping in XC skiing, which was catastrophic in the 1990s. The ABP tracks hemoglobin concentration, reticulocyte percentage, and derived OFF-score across years, detecting abnormal variations from individual baseline rather than fixed thresholds. Sensitivity is 75–85% for single moderate EPO doses; combined with population priors, Bayesian ABP models detect approximately 65% of micro-dose EPO regimens that evade direct urine testing. XC skiing now has among the most comprehensive blood testing programs in Olympic sport.',
        stat: 'ABP: 75–85% sensitivity for EPO; Bayesian model detects 65% of micro-dose protocols',
      },
      {
        citation: 'McArdle 2000 (Exercise Physiology, 5th ed.)',
        text: 'Cold environment physiology creates unique metabolic demands for XC skiers. At −10°C to −20°C race temperatures, basal metabolic rate increases 10–15% to maintain core temperature, while cold air requires humidification in the upper airways — consuming 15–25% of respiratory energy budget at high ventilation rates (150–180 L/min at VO₂max). Muscle viscosity increases at cold temperatures, reducing mechanical efficiency by 4–8% below −5°C. Elite skiers\' ability to maintain peripheral skin temperature while channeling maximal blood flow to working muscles is a physiological feat requiring adapted thermoregulatory reflexes developed over years of cold training.',
        stat: 'Cold air: +10–15% BMR; respiratory heating costs 15–25% at 150–180 L/min ventilation',
      },
      {
        citation: 'Kenttä 1996 (Sports Med)',
        text: 'The extreme training volumes of elite XC skiing create overreaching risk without careful recovery periodization. Kenttä\'s overtraining framework — developed with Swedish national team athletes — identifies a 3:1 loading ratio (three weeks volume/intensity → one recovery week) as the minimum protective structure. Hormonal markers of overreaching: testosterone/cortisol ratio below 0.35 (normal >0.70); salivary IgA below 100 μg/mL (immune suppression). Norwegian team\'s internal data (published 2018) showed that athletes with ≥2 recovery weeks per 8-week block had 40% fewer illness episodes, extending uninterrupted training by an average of 23 days per competitive season.',
        stat: 'T/C ratio <0.35 signals overreaching; 3:1 loading:recovery ratio minimum; +23 days uninterrupted training',
      },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function XCSkiingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        /* ── CSS Variables ── */
        :root {
          --navy-900: #020b18;
          --navy-800: #041224;
          --navy-700: #071e36;
          --navy-600: #0a2a4a;
          --navy-500: #0d3660;
          --cyan-bright: #00d4ff;
          --cyan-mid: #00b4d8;
          --cyan-pale: #7ee8fa;
          --cyan-ghost: rgba(0,212,255,0.08);
          --white: #f0f8ff;
          --white-dim: rgba(224,240,255,0.75);
          --white-faint: rgba(224,240,255,0.45);
          --slate: rgba(148,163,184,0.6);
          --font-display: 'Raleway', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --font-mono: 'DM Mono', monospace;
        }

        /* ── Reset & Base ── */
        .xcs-root {
          font-family: var(--font-body);
          background: var(--navy-900);
          color: var(--white);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        /* ── Snowfall Canvas ── */
        .xcs-snow-canvas {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        /* Individual snowflakes via CSS animation */
        .snowflake {
          position: absolute;
          top: -10px;
          border-radius: 50%;
          background: rgba(200,235,255,0.55);
          animation: snowfall linear infinite;
          pointer-events: none;
        }

        @keyframes snowfall {
          0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 0.6; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
        }

        /* ── Background Mesh ── */
        .xcs-bg-mesh {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 15% 20%, rgba(0,60,110,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 80%, rgba(0,40,80,0.45) 0%, transparent 55%),
            radial-gradient(ellipse 40% 35% at 50% 50%, rgba(0,100,150,0.12) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Grid overlay ── */
        .xcs-grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,180,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,180,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Content wrapper ── */
        .xcs-content {
          position: relative;
          z-index: 1;
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Hero ── */
        .xcs-hero {
          position: relative;
          padding: 100px 0 80px;
          overflow: hidden;
        }

        .xcs-hero-overline {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--cyan-bright);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .xcs-hero-overline::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: var(--cyan-bright);
          opacity: 0.7;
        }

        .xcs-hero-title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: clamp(52px, 8vw, 96px);
          line-height: 0.92;
          letter-spacing: -3px;
          color: var(--white);
          margin: 0 0 8px;
        }

        .xcs-hero-title .accent {
          color: var(--cyan-bright);
          display: block;
        }

        .xcs-hero-subtitle {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: clamp(18px, 2.5vw, 28px);
          letter-spacing: 1px;
          color: var(--white-dim);
          margin: 24px 0 48px;
          max-width: 640px;
        }

        /* Big stat display */
        .xcs-hero-stat-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(0,180,255,0.15);
          border: 1px solid rgba(0,180,255,0.2);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 80px;
          max-width: 780px;
        }

        .xcs-hero-stat {
          background: rgba(4,18,36,0.8);
          padding: 28px 32px;
          position: relative;
        }

        .xcs-hero-stat::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, var(--cyan-bright), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .xcs-hero-stat:hover::after {
          opacity: 1;
        }

        .xcs-hero-stat-value {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 44px;
          line-height: 1;
          letter-spacing: -2px;
          color: var(--cyan-bright);
          margin-bottom: 6px;
        }

        .xcs-hero-stat-unit {
          font-size: 18px;
          font-weight: 600;
          opacity: 0.7;
        }

        .xcs-hero-stat-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--white-dim);
          margin-bottom: 4px;
        }

        .xcs-hero-stat-sub {
          font-size: 11px;
          color: var(--white-faint);
          line-height: 1.4;
        }

        /* Decorative elevation profile */
        .xcs-elevation {
          position: absolute;
          bottom: 0; right: -40px;
          width: 55%;
          height: 200px;
          opacity: 0.18;
          pointer-events: none;
        }

        /* ── Section Header ── */
        .xcs-section-header {
          display: flex;
          align-items: baseline;
          gap: 20px;
          margin-bottom: 40px;
        }

        .xcs-section-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--cyan-bright);
          opacity: 0.7;
          white-space: nowrap;
        }

        .xcs-section-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 3vw, 32px);
          letter-spacing: -0.5px;
          color: var(--white);
        }

        .xcs-section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(0,180,255,0.3), transparent);
        }

        /* ── VO₂max Chart ── */
        .xcs-vo2-section {
          margin-bottom: 100px;
        }

        .xcs-vo2-chart {
          background: rgba(4,18,36,0.6);
          border: 1px solid rgba(0,180,255,0.15);
          border-radius: 4px;
          padding: 40px 40px 32px;
          backdrop-filter: blur(8px);
        }

        .xcs-vo2-chart-title {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--cyan-bright);
          margin-bottom: 36px;
          opacity: 0.8;
        }

        .xcs-vo2-row {
          display: grid;
          grid-template-columns: 160px 1fr 80px;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }

        .xcs-vo2-sport {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.3px;
          color: var(--white-dim);
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .xcs-vo2-sport.highlight {
          color: var(--cyan-bright);
        }

        .xcs-vo2-bar-track {
          position: relative;
          height: 28px;
          background: rgba(255,255,255,0.04);
          border-radius: 2px;
          overflow: hidden;
        }

        .xcs-vo2-bar-fill {
          position: absolute;
          left: 0; top: 0;
          height: 100%;
          border-radius: 2px;
          display: flex;
          align-items: center;
          padding-left: 10px;
          transition: width 0.3s;
        }

        .xcs-vo2-elite-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
          overflow: hidden;
        }

        .xcs-vo2-value {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16px;
          text-align: right;
          color: var(--white-dim);
        }

        .xcs-vo2-value.highlight {
          color: var(--cyan-bright);
          font-size: 20px;
        }

        .xcs-vo2-unit {
          font-size: 10px;
          font-weight: 400;
          opacity: 0.6;
        }

        .xcs-vo2-axis {
          display: grid;
          grid-template-columns: 160px 1fr 80px;
          gap: 16px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(0,180,255,0.1);
        }

        .xcs-vo2-axis-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--slate);
          letter-spacing: 1px;
        }

        /* ── Science Cards ── */
        .xcs-cards-section {
          margin-bottom: 100px;
        }

        .xcs-card {
          background: rgba(4,18,36,0.7);
          border: 1px solid rgba(0,180,255,0.12);
          border-radius: 4px;
          margin-bottom: 40px;
          overflow: hidden;
          backdrop-filter: blur(6px);
          transition: border-color 0.3s;
        }

        .xcs-card:hover {
          border-color: rgba(0,180,255,0.3);
        }

        .xcs-card-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 28px 32px 24px;
          border-bottom: 1px solid rgba(0,180,255,0.08);
        }

        .xcs-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 4px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          flex-shrink: 0;
          flex-direction: column;
          padding-bottom: 6px;
        }

        .xcs-card-icon-sym {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 20px;
          line-height: 1;
          letter-spacing: -1px;
        }

        .xcs-card-icon-sub {
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 1px;
          opacity: 0.7;
          line-height: 1;
        }

        .xcs-card-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          letter-spacing: -0.3px;
          color: var(--white);
        }

        .xcs-card-body {
          padding: 0 32px 28px;
        }

        .xcs-fact {
          padding: 28px 0;
          border-bottom: 1px solid rgba(0,180,255,0.06);
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .xcs-fact:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .xcs-fact-citation {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--cyan-bright);
          opacity: 0.75;
        }

        .xcs-fact-text {
          font-size: 14px;
          line-height: 1.75;
          color: var(--white-dim);
          font-weight: 300;
        }

        .xcs-fact-stat {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 2px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.5px;
          line-height: 1.4;
          align-self: flex-start;
        }

        .xcs-fact-stat::before {
          content: '▸';
          flex-shrink: 0;
          opacity: 0.7;
        }

        /* ── Training Week ── */
        .xcs-week-section {
          margin-bottom: 100px;
        }

        .xcs-week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          align-items: end;
        }

        .xcs-week-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .xcs-week-bar-wrap {
          height: 200px;
          display: flex;
          align-items: flex-end;
          background: rgba(255,255,255,0.02);
          border-radius: 2px 2px 0 0;
          overflow: hidden;
          position: relative;
        }

        .xcs-week-bar {
          width: 100%;
          border-radius: 2px 2px 0 0;
          position: relative;
          transition: opacity 0.2s;
        }

        .xcs-week-bar:hover {
          opacity: 0.85;
        }

        .xcs-week-type-badge {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-mono);
          font-size: 7px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          white-space: nowrap;
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }

        .xcs-week-meta {
          padding: 10px 6px 0;
        }

        .xcs-week-day {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--cyan-bright);
          margin-bottom: 4px;
        }

        .xcs-week-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--white-dim);
          line-height: 1.3;
          margin-bottom: 3px;
        }

        .xcs-week-zone {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .xcs-week-duration {
          font-size: 10px;
          color: var(--white-faint);
        }

        .xcs-week-legend {
          display: flex;
          gap: 20px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .xcs-week-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--white-faint);
        }

        .xcs-week-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 1px;
        }

        /* ── Polarized zone visual ── */
        .xcs-zone-visual {
          background: rgba(4,18,36,0.6);
          border: 1px solid rgba(0,180,255,0.15);
          border-radius: 4px;
          padding: 32px 36px;
          margin-bottom: 40px;
          backdrop-filter: blur(6px);
        }

        .xcs-zone-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--cyan-bright);
          opacity: 0.8;
          margin-bottom: 24px;
        }

        .xcs-zone-bar {
          height: 44px;
          border-radius: 3px;
          display: flex;
          overflow: hidden;
          gap: 3px;
          margin-bottom: 12px;
        }

        .xcs-zone-segment {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16px;
          letter-spacing: -0.5px;
          color: rgba(255,255,255,0.9);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .xcs-zone-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--white-faint);
        }

        .xcs-zone-detail {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(0,180,255,0.08);
          margin-top: 20px;
        }

        .xcs-zone-detail-item {
          background: rgba(4,18,36,0.8);
          padding: 14px 16px;
        }

        .xcs-zone-detail-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .xcs-zone-detail-value {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          line-height: 1;
          margin-bottom: 3px;
        }

        .xcs-zone-detail-desc {
          font-size: 11px;
          color: var(--white-faint);
        }

        /* ── Snowflake geometric motif ── */
        .xcs-motif {
          position: absolute;
          pointer-events: none;
          opacity: 0.04;
        }

        /* ── Footer ── */
        .xcs-footer {
          border-top: 1px solid rgba(0,180,255,0.1);
          padding: 40px 0 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .xcs-footer-brand {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--cyan-bright);
          opacity: 0.6;
        }

        .xcs-footer-note {
          font-size: 11px;
          color: var(--white-faint);
          max-width: 480px;
          line-height: 1.6;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .xcs-hero-overline { animation: fadeUp 0.6s ease 0.1s both; }
        .xcs-hero-title { animation: fadeUp 0.7s ease 0.2s both; }
        .xcs-hero-subtitle { animation: fadeUp 0.7s ease 0.35s both; }
        .xcs-hero-stat-strip { animation: fadeUp 0.7s ease 0.5s both; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .xcs-hero-stat-strip {
            grid-template-columns: 1fr;
          }
          .xcs-vo2-row {
            grid-template-columns: 100px 1fr 56px;
          }
          .xcs-week-grid {
            grid-template-columns: repeat(7, 1fr);
            gap: 3px;
          }
          .xcs-week-meta {
            padding: 6px 3px 0;
          }
          .xcs-week-label {
            font-size: 9px;
          }
          .xcs-zone-detail {
            grid-template-columns: 1fr;
          }
          .xcs-card-header {
            padding: 20px 20px 16px;
          }
          .xcs-card-body {
            padding: 0 20px 20px;
          }
        }
      `}} />

      <div className="xcs-root">
        {/* Background layers */}
        <div className="xcs-bg-mesh" />
        <div className="xcs-grid-overlay" />

        {/* Animated snowfall */}
        <div className="xcs-snow-canvas" aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => {
            const size = 1 + (i % 4) * 0.8
            const left = (i * 37 + i * i * 13) % 100
            const delay = (i * 0.73) % 12
            const duration = 8 + (i % 7) * 2.5
            const drift = ((i % 5) - 2) * 40
            return (
              <div
                key={i}
                className="snowflake"
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  '--drift': `${drift}px`,
                  opacity: 0.4 + (i % 4) * 0.1,
                } as React.CSSProperties}
              />
            )
          })}
        </div>

        <div className="xcs-content">
          {/* ── Hero ─────────────────────────────────────────── */}
          <section className="xcs-hero">
            {/* Decorative elevation SVG */}
            <svg className="xcs-elevation" viewBox="0 0 600 200" preserveAspectRatio="none" fill="none">
              <polyline
                points="0,190 40,175 80,160 110,120 145,95 175,80 210,55 240,40 275,30 305,18 335,25 360,15 390,35 420,50 450,70 475,85 505,110 530,140 560,160 600,170 600,200 0,200"
                fill="rgba(0,180,255,0.15)"
                stroke="rgba(0,180,255,0.5)"
                strokeWidth="1.5"
              />
              <polyline
                points="0,200 0,190 40,175 80,160 110,120 145,95 175,80 210,55 240,40 275,30 305,18 335,25 360,15 390,35 420,50 450,70 475,85 505,110 530,140 560,160 600,170 600,200"
                fill="rgba(0,100,160,0.08)"
              />
            </svg>

            <p className="xcs-hero-overline">Elite Sport Physiology</p>
            <h1 className="xcs-hero-title">
              Cross-Country
              <span className="accent">Skiing Science</span>
            </h1>
            <p className="xcs-hero-subtitle">
              The world's most demanding aerobic sport — where Scandinavian precision meets extreme human physiology.
            </p>

            <div className="xcs-hero-stat-strip">
              <div className="xcs-hero-stat">
                <div className="xcs-hero-stat-label">Bjørn Dæhlie — Ingjer 1991</div>
                <div className="xcs-hero-stat-value">
                  96 <span className="xcs-hero-stat-unit">mL/kg/min</span>
                </div>
                <div className="xcs-hero-stat-sub">Highest VO₂max ever reliably measured in a human athlete</div>
              </div>
              <div className="xcs-hero-stat">
                <div className="xcs-hero-stat-label">Elite LT2 Ratio — Rusko 2003</div>
                <div className="xcs-hero-stat-value">
                  92 <span className="xcs-hero-stat-unit">% VO₂max</span>
                </div>
                <div className="xcs-hero-stat-sub">Lactate threshold 2 — highest in any endurance discipline</div>
              </div>
              <div className="xcs-hero-stat">
                <div className="xcs-hero-stat-label">Annual Training — Rusko 2003</div>
                <div className="xcs-hero-stat-value">
                  900 <span className="xcs-hero-stat-unit">hrs/yr</span>
                </div>
                <div className="xcs-hero-stat-sub">Elite Norwegian training volume at peak base-building phase</div>
              </div>
            </div>
          </section>

          {/* ── VO₂max Comparison Chart ────────────────────── */}
          <section className="xcs-vo2-section">
            <div className="xcs-section-header">
              <span className="xcs-section-label">01</span>
              <h2 className="xcs-section-title">VO₂max by Sport</h2>
              <div className="xcs-section-line" />
            </div>

            <div className="xcs-vo2-chart">
              <div className="xcs-vo2-chart-title">Elite male VO₂max — mL·kg⁻¹·min⁻¹</div>

              {VO2MAX_SPORTS.map((item) => (
                <div key={item.sport + item.display} className="xcs-vo2-row">
                  <div className={`xcs-vo2-sport${item.barPct === 100 ? ' highlight' : ''}`}>
                    {item.sport}
                  </div>
                  <div className="xcs-vo2-bar-track">
                    <div
                      className="xcs-vo2-bar-fill"
                      style={{
                        width: `${item.barPct}%`,
                        background: item.barPct === 100
                          ? `linear-gradient(90deg, ${item.color}, rgba(0,212,255,0.6))`
                          : `linear-gradient(90deg, ${item.color}55, ${item.color}22)`,
                      }}
                    >
                      <span className="xcs-vo2-elite-label">{item.elite}</span>
                    </div>
                  </div>
                  <div className={`xcs-vo2-value${item.barPct === 100 ? ' highlight' : ''}`}>
                    {item.display}
                    <span className="xcs-vo2-unit"> mL</span>
                  </div>
                </div>
              ))}

              <div className="xcs-vo2-axis">
                <div />
                <div className="xcs-vo2-axis-labels">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>96</span>
                </div>
                <div />
              </div>
            </div>
          </section>

          {/* ── Polarized Zone Visual ─────────────────────── */}
          <section style={{ marginBottom: 40 }}>
            <div className="xcs-zone-visual">
              <div className="xcs-zone-label">Polarized Training Distribution — Seiler 2009</div>
              <div className="xcs-zone-bar">
                <div
                  className="xcs-zone-segment"
                  style={{
                    width: '80%',
                    background: 'linear-gradient(90deg, #00d4ff22, #00b4d844)',
                    border: '1px solid rgba(0,212,255,0.3)',
                    color: '#00d4ff',
                  }}
                >
                  80% Zone 1
                </div>
                <div
                  className="xcs-zone-segment"
                  style={{
                    width: '3%',
                    background: 'rgba(100,100,120,0.3)',
                  }}
                />
                <div
                  className="xcs-zone-segment"
                  style={{
                    width: '17%',
                    background: 'linear-gradient(90deg, #ef444422, #ef444455)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#fca5a5',
                    fontSize: 13,
                  }}
                >
                  20% Z3
                </div>
              </div>
              <div className="xcs-zone-row">
                <span style={{ color: '#00d4ff', fontSize: 11 }}>Below VT1 · &lt;75% HRmax · Conversational</span>
                <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: 11 }}>VT1–VT2 · "Threshold" — nearly zero</span>
                <span style={{ color: '#fca5a5', fontSize: 11 }}>Above VT2 · &gt;87% HRmax · Race-pace intervals</span>
              </div>
              <div className="xcs-zone-detail">
                <div className="xcs-zone-detail-item">
                  <div className="xcs-zone-detail-label" style={{ color: '#00d4ff' }}>Zone 1 Weekly Hours</div>
                  <div className="xcs-zone-detail-value" style={{ color: '#00d4ff' }}>17–20 h</div>
                  <div className="xcs-zone-detail-desc">Easy skiing, roller skiing, running — base volume</div>
                </div>
                <div className="xcs-zone-detail-item">
                  <div className="xcs-zone-detail-label" style={{ color: 'rgba(148,163,184,0.6)' }}>Zone 2 Weekly Hours</div>
                  <div className="xcs-zone-detail-value" style={{ color: 'rgba(148,163,184,0.6)' }}>&lt;0.5 h</div>
                  <div className="xcs-zone-detail-desc">Moderate intensity — intentionally avoided</div>
                </div>
                <div className="xcs-zone-detail-item">
                  <div className="xcs-zone-detail-label" style={{ color: '#fca5a5' }}>Zone 3 Weekly Hours</div>
                  <div className="xcs-zone-detail-value" style={{ color: '#fca5a5' }}>4–6 h</div>
                  <div className="xcs-zone-detail-desc">4×8 min intervals, 5×5 min VO₂max work</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Science Cards ─────────────────────────────── */}
          <section className="xcs-cards-section">
            <div className="xcs-section-header" style={{ marginBottom: 48 }}>
              <span className="xcs-section-label">02</span>
              <h2 className="xcs-section-title">Research Deep-Dives</h2>
              <div className="xcs-section-line" />
            </div>

            {SCIENCE_CARDS.map((card) => (
              <div key={card.id} className="xcs-card">
                <div
                  className="xcs-card-header"
                  style={{ borderBottomColor: card.accentBorder }}
                >
                  <div
                    className="xcs-card-icon"
                    style={{
                      background: card.iconBg,
                      border: `1px solid ${card.iconBorder}`,
                    }}
                  >
                    <span className="xcs-card-icon-sym" style={{ color: card.iconColor }}>
                      {card.symbol}
                    </span>
                    <span className="xcs-card-icon-sub" style={{ color: card.iconColor }}>
                      {card.symbolSub}
                    </span>
                  </div>
                  <h3 className="xcs-card-title">{card.title}</h3>
                </div>

                <div className="xcs-card-body">
                  {card.facts.map((fact, fi) => (
                    <div key={fi} className="xcs-fact">
                      <span className="xcs-fact-citation" style={{ color: card.accent }}>
                        {fact.citation}
                      </span>
                      <p className="xcs-fact-text">{fact.text}</p>
                      <span
                        className="xcs-fact-stat"
                        style={{
                          background: card.accentBg,
                          border: `1px solid ${card.accentBorder}`,
                          color: card.iconColor,
                        }}
                      >
                        {fact.stat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* ── Norwegian Training Week ─────────────────── */}
          <section className="xcs-week-section">
            <div className="xcs-section-header">
              <span className="xcs-section-label">03</span>
              <h2 className="xcs-section-title">Norwegian Elite Training Week</h2>
              <div className="xcs-section-line" />
            </div>

            <div
              style={{
                background: 'rgba(4,18,36,0.6)',
                border: '1px solid rgba(0,180,255,0.15)',
                borderRadius: 4,
                padding: '40px 32px 32px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--cyan-bright)', opacity: 0.8, marginBottom: 32 }}>
                Base phase structure — Seiler 2009, Tonnessen 2014
              </div>

              <div className="xcs-week-grid">
                {TRAINING_WEEK.map((day) => (
                  <div key={day.day} className="xcs-week-col">
                    <div className="xcs-week-bar-wrap">
                      <div
                        className="xcs-week-bar"
                        style={{
                          height: `${day.barH}%`,
                          background: day.zoneNum === 3
                            ? `linear-gradient(180deg, ${day.color}cc, ${day.color}55)`
                            : day.zoneNum === 0
                            ? day.color
                            : `linear-gradient(180deg, ${day.color}88, ${day.color}33)`,
                          borderTop: `2px solid ${day.color}`,
                        }}
                      >
                        {day.barH > 30 && (
                          <span className="xcs-week-type-badge">{day.type}</span>
                        )}
                      </div>
                    </div>
                    <div className="xcs-week-meta">
                      <div className="xcs-week-day">{day.day}</div>
                      <div className="xcs-week-label">{day.label}</div>
                      <div
                        className="xcs-week-zone"
                        style={{
                          color: day.zoneNum === 3
                            ? '#fca5a5'
                            : day.zoneNum === 0
                            ? 'var(--slate)'
                            : '#00d4ff',
                        }}
                      >
                        {day.zone}
                      </div>
                      <div className="xcs-week-duration">{day.duration}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="xcs-week-legend">
                {[
                  { color: '#00d4ff', label: 'Zone 1 — Low aerobic base' },
                  { color: '#22c55e', label: 'Zone 1–2 — Moderate aerobic' },
                  { color: '#ef4444', label: 'Zone 3 — High intensity intervals' },
                  { color: 'rgba(148,163,184,0.4)', label: 'Rest / Regeneration' },
                ].map((l) => (
                  <div key={l.label} className="xcs-week-legend-item">
                    <div className="xcs-week-legend-dot" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Footer ───────────────────────────────────── */}
          <footer className="xcs-footer">
            <div className="xcs-footer-brand">KQuarks · XC Skiing Science</div>
            <p className="xcs-footer-note">
              Data synthesized from peer-reviewed literature. Key references: Ingjer 1991, Holmberg 2005, Scharhag 2002, Rusko 2003, Seiler 2009, Helgerud 2007, Tonnessen 2014, Hoffman 1994, Smith 2003, Breitschädel 2010, Stray-Gundersen 1992, Mørkeberg 2014, McArdle 2000, Kenttä 1996.
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
