// Paddle Sports Science — static server component
// Evidence-based guide covering kayaking, canoeing, and SUP physiology:
// biomechanics, physiological demands, injury epidemiology, and training science.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Paddle Sports Science' }

// ─── Race Duration Data ────────────────────────────────────────────────────────

const RACE_DURATIONS = [
  { discipline: 'K1 200m',      seconds: 38,  display: '38 s',   color: '#0d9488', pct: 14 },
  { discipline: 'SUP 200m',     seconds: 52,  display: '52 s',   color: '#0f766e', pct: 20 },
  { discipline: 'C1 Slalom',    seconds: 95,  display: '95 s',   color: '#134e4a', pct: 36 },
  { discipline: 'K1 500m',      seconds: 102, display: '102 s',  color: '#166534', pct: 39 },
  { discipline: 'K1 1000m',     seconds: 265, display: '265 s',  color: '#14532d', pct: 100 },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '65–75',
    label: 'Sprint Kayak VO₂max',
    sub: 'mL/kg/min — K1 500m elite paddlers',
    color: '#0d9488',
  },
  {
    value: '60–80/min',
    label: 'Stroke Rate',
    sub: 'K1 sprint race pace — Kendal 1992',
    color: '#14b8a6',
  },
  {
    value: '16 mmol/L',
    label: 'Post-race Lactate',
    sub: 'K1 500m — among highest in Olympic sport',
    color: '#0d9488',
  },
  {
    value: '50–60%',
    label: 'Shoulder Injury Share',
    sub: 'Of all elite kayak injuries',
    color: '#166534',
  },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    number: '01',
    title: 'Paddling Biomechanics',
    accent: '#0d9488',
    icon: '🚣',
    findings: [
      {
        citation: 'Kendal 1992 — Kayak Biomechanics',
        stat: '200–400 N',
        statLabel: 'Pull phase blade force',
        detail: 'Sprint kayak stroke mechanics follow a precise catch, pull, and exit sequence lasting 0.4–0.6 s per stroke at race pace of 60–80 strokes/min. Blade entry angle during the catch phase is 70–80° from horizontal to maximise early propulsive force. Pull phase generates 200–400 N of blade force in elite paddlers, peaking at approximately mid-pull. Exit timing is critical — delayed exit increases drag without additional propulsion. The definitive finding of this analysis: trunk rotation contributes 60–65% of total propulsive force, establishing kayaking as a core sport with the arms functioning primarily as force transmitters from torso to blade.',
      },
      {
        citation: 'Trunk rotation biomechanics — elite kayak physiology literature',
        stat: '60–65%',
        statLabel: 'Trunk contribution to stroke force',
        detail: 'Elite kayak paddling relies on the obliques and thoracic erector spinae as primary force generators. The kinetic chain runs from hip rotation through the torso to the blade: elite paddlers exhibit 45–55° of trunk rotation per stroke, with the contralateral hip driving initiation. This coordination protects the shoulder joint from bearing full propulsive load. Athletes with insufficient trunk engagement show markedly elevated shoulder injury incidence. Coaches assess trunk contribution using on-water force sensors and high-speed video, targeting a push-arm to pull-arm force ratio that reflects optimal trunk drive rather than predominantly arm-based paddling.',
      },
      {
        citation: 'SUP stroke mechanics — biomechanics and physiology literature',
        stat: '+8–12%',
        statLabel: 'Metabolic overhead vs. seated kayak',
        detail: 'Stand-up paddleboard (SUP) stroke mechanics differ substantially from seated kayak: paddle length optimised at 20–25 cm above head height for standing paddling; blade angle at entry 10–15° from vertical for efficient catch. The unstable board surface increases gluteal and hip stabiliser activation 30–45% compared to seated kayak, adding significant co-contraction and balance overhead. High kneeling SUP reduces balance demands while maintaining trunk rotation. The balance tax adds 8–12% metabolic cost vs. equivalent seated paddling power output — a consideration for cross-training and energy expenditure estimation in SUP athletes.',
      },
      {
        citation: 'OC-1 sprint physiology — outrigger canoe biomechanics',
        stat: '75–90/min',
        statLabel: 'OC-1 sprint stroke rate',
        detail: 'Outrigger canoe single (OC-1) paddling is inherently asymmetric: the paddle is held on one side and a J-stroke correction is required at each stroke completion to maintain course. This creates unilateral dominance in the obliques, latissimus dorsi, and contralateral hip flexors of the paddling side. Sprint OC-1 stroke rate: 75–90 strokes/min. Long-distance OC-1 racing (Molokai 2 Oahu: 52 km open ocean) requires highly efficient aerobic mechanics with minimal correction force waste — demanding years of technique refinement to manage the inherent asymmetric loading and prevent overuse injury on the dominant paddling side.',
      },
    ],
  },
  {
    id: 'physiology',
    number: '02',
    title: 'Physiological Demands',
    accent: '#0f766e',
    icon: '🫁',
    findings: [
      {
        citation: 'Sprint kayak physiology — K1 500m Olympic event',
        stat: '65–75',
        statLabel: 'VO₂max mL/kg/min (K1 500m)',
        detail: 'K1 500m sprint kayaking represents the highest aerobic demand of all paddle sports. Race duration: 90–105 s in elite competition. Athletes sustain 85–92% VO₂max throughout the race, with a supramaximal start. Post-race blood lactate reaches 12–16 mmol/L — among the highest values in Olympic sport, exceeding rowing (8–14 mmol/L) and elite cycling time trials (10–14 mmol/L). Elite male K1 500m paddlers demonstrate absolute VO₂max values of 5.5–6.5 L/min. The short race duration forces simultaneous near-maximal anaerobic and aerobic contribution, requiring training that develops both systems to world-class levels in a single athlete.',
      },
      {
        citation: 'K1 1000m race physiology — pacing and energetics',
        stat: '88–95%',
        statLabel: 'HRmax throughout K1 1000m',
        detail: 'The K1 1000m Olympic event demands a sophisticated pacing strategy: first 250m involves aggressive anaerobic establishment to claim water position; middle 500m represents aerobic steady-state at ~88–92% HRmax; final 250m sprint depletes remaining anaerobic reserves and tests lactate buffering capacity. Oxygen debt accumulates progressively through the middle section. Elite paddlers rely on 800–1,000 km/year training volumes to sustain this pacing model. Recovery between race-pace training sets requires 8–12 minutes for lactate clearance to training-relevant levels. Race pace 500m split times are the primary performance metric used in training periodisation.',
      },
      {
        citation: 'Flatwater vs. whitewater kayak physiology — comparative analysis',
        stat: '60–68',
        statLabel: 'Slalom kayak VO₂max mL/kg/min',
        detail: 'Slalom kayaking (90–110 s course, 18–25 gate manoeuvres) requires VO₂max of 60–68 mL/kg/min — approximately 10% lower than sprint kayak — reflecting intermittent gate-holding and eddy-catch manoeuvres that interrupt continuous propulsion. Whitewater slalom demands include anticipatory reading of hydraulic features, reactive steering via boat lean, and upper body isometric holds against current at gate negotiations. Sprint flatwater kayaking (K1, K2, K4) requires purely continuous propulsion with bilateral symmetry. Despite similar race durations, slalom and sprint kayaking are physiologically and technically distinct disciplines requiring specialised training approaches.',
      },
      {
        citation: 'SUP race physiology — sprint and endurance events',
        stat: '58–66',
        statLabel: 'SUP racing VO₂max mL/kg/min',
        detail: 'SUP physiology spans a wide spectrum: SUP 200m sprint (50–55 s) demands near-maximal anaerobic effort with post-race lactate 8–12 mmol/L. Long-distance SUP racing — exemplified by the Molokai 2 Oahu crossing (52 km, 4–5+ hours) — is almost purely aerobic at 65–72% VO₂max. The balance demands of standing on a moving board add a continuous stabilisation overhead of 8–12% metabolic cost, elevating caloric expenditure and proprioceptive fatigue beyond what paddling power output alone predicts. Core endurance therefore limits SUP performance across both sprint and endurance formats, distinguishing it from all other paddle sports.',
      },
    ],
  },
  {
    id: 'injury',
    number: '03',
    title: 'Upper Body Demands & Injury',
    accent: '#0d9488',
    icon: '🩺',
    findings: [
      {
        citation: 'Shoulder injury epidemiology — elite kayak medicine',
        stat: '50–60%',
        statLabel: 'Shoulder share of elite kayak injuries',
        detail: 'The shoulder is the primary injury site in competitive kayaking, accounting for 50–60% of all injuries in elite flatwater paddlers. Elite training volumes of 60,000–100,000 strokes per week create substantial cumulative rotator cuff loading. Supraspinatus impingement is the most common diagnosis, exacerbated by a high catch angle requiring maximum glenohumeral elevation at maximal force output. AC joint stress occurs during powerful pull-through. Dislocation risk is elevated in whitewater kayaking: bracing and rolling mechanics place the shoulder in the 90°-abduction, externally-rotated position identical to the anterior shoulder dislocation mechanism seen in contact sports.',
      },
      {
        citation: 'Lumbar spine injury — kayak and canoe epidemiology',
        stat: '25–35%',
        statLabel: 'Lower back injury rate in kayak/canoe',
        detail: 'Lumbar injury accounts for 25–35% of chronic complaints in kayak and canoe athletes. The seated kayak posture sustains lumbar flexion, increasing disc pressure substantially vs. neutral spine. In sprint kayaking, repetitive trunk rotation at 60–80 strokes/min over 90+ minute training sessions creates continuous torsional disc and facet loading. Disc injury risk peaks during high-volume base training phases. Interventions: adjustable seat and footrest positioning to increase lumbar lordosis, core stability programming targeting multifidus and deep abdominals, and periodised volume management to limit cumulative lumbar load across weekly training blocks.',
      },
      {
        citation: 'Wrist and forearm tendinopathy — paddle sports medicine',
        stat: '3rd most',
        statLabel: 'Common injury site in kayaking',
        detail: 'Wrist and forearm tendinopathy — extensor carpi ulnaris stress and intersection syndrome — is the third most common injury in kayaking. High stroke rates (60–80/min) maintained for hours load the wrist extensors continuously with grip cycling at the paddle shaft. Paddle grip pressure and handle diameter are key modifiable risk factors: ergonomic grip diameter of 28–34 mm reduces extensor loading vs. smaller circumference shafts. De Quervain tenosynovitis arises from incorrect grip technique — primarily failure to relax the trailing hand during the swing phase. Paddling gloves reduce friction and grip effort, lowering forearm extensor activation 15–20% during extended sessions.',
      },
      {
        citation: 'Mechanical haemolysis — kayak and paddle sports',
        stat: '↑ LDH',
        statLabel: 'Haemolysis marker in high-volume paddlers',
        detail: 'Mechanical haemolysis from repetitive foot pressure during the kayak power phase — paddlers brace hard against footrests each stroke to transmit leg force — destroys red blood cells analogously to foot-strike haemolysis in runners. Elite kayakers performing high weekly training volumes show elevated serum LDH, reduced haptoglobin, and haemoglobinuria consistent with clinically significant haemolysis. This creates a chronic iron loss pathway that, combined with high training demands, places elite paddlers at moderate risk of iron deficiency anaemia. Monitoring serum ferritin every 3–4 months and optimising dietary iron and vitamin C intake are standard practice in high-performance kayak programmes.',
      },
    ],
  },
  {
    id: 'training',
    number: '04',
    title: 'Training Science & Performance',
    accent: '#166534',
    icon: '📊',
    findings: [
      {
        citation: 'Annual training load — Olympic sprint kayak periodisation',
        stat: '800–1,000 km',
        statLabel: 'Annual paddling volume for Olympic kayakers',
        detail: 'Olympic sprint kayak athletes accumulate 800–1,000 km of on-water paddling per year, distributed across a periodised annual plan. The aerobic base phase (October–January) emphasises high volume at low intensity (UT2: < 2 mmol/L lactate), building the aerobic engine and technical foundation on the water. As competition season approaches (May–August), volume reduces while intensity increases toward race-specific intervals and time-trial efforts. This polarised distribution — approximately 70% low intensity, 15% moderate, 15% high — mirrors successful periodisation models from rowing, cycling, and cross-country skiing and is calibrated by 4–6 lactate tests annually.',
      },
      {
        citation: 'Kayak ergometer validity — training science',
        stat: '85%',
        statLabel: 'On-water demand replication by ergometer',
        detail: 'The kayak ergometer provides indoor training replicating approximately 85% of on-water biomechanical and physiological demands — a valid tool for VO₂max testing, interval training, and conditioning in adverse weather. Standard ergometer VO₂max test protocol: 4-minute stages with stepwise power increments from a 2 mmol/L baseline, with lactate sampled each stage. The primary limitation vs. on-water paddling is the absence of stroke-rate-dependent aquatic resistance (water provides quadratic resistance; ergometer load is programmable) and the lack of boat balance demand. Cross-training on ergometers during high-volume land phases maintains cardiovascular fitness while reducing accumulated on-water volume and technical fatigue.',
      },
      {
        citation: 'Strength training for paddle sports — applied physiology',
        stat: 'Lat-dominant',
        statLabel: 'Primary strength profile for catch force',
        detail: 'Paddle sports strength programming centres on lat-dominant pulling: lat pulldown, single-arm cable row, and bent-over row develop the primary propulsive musculature for the pull phase. Trunk rotation cable exercises and anti-rotation press progressions build the rotational power contributing 60–65% of stroke force. Posterior shoulder health exercises — face pulls, band external rotation, Y-T-W scapular stability — are prescribed to offset the anterior dominance of high-volume paddling and protect the rotator cuff from the impingement pattern characteristic of supraspinatus overuse. Olympic lifting derivatives (hang clean, landmine press) develop explosive force transmission for race starts and acceleration paddle phases.',
      },
      {
        citation: 'Pre-competition taper — sprint kayak race preparation',
        stat: '2–4%',
        statLabel: 'Performance gain from optimal taper',
        detail: 'Pre-competition taper for sprint kayak follows a 3-week model: week 1 reduces training volume 40–50% while maintaining intensity and session frequency; week 2 reduces volume a further 20%; week 3 focuses on race-pace activation and recovery. This progressive taper reduces accumulated training fatigue 25–30% as measured by HRV restoration and subjective well-being scores, while preserving peak aerobic fitness for 2–3 weeks before significant detraining begins. Properly executed tapers produce performance enhancements of 2–4% — meaningful at Olympic competition margins of 0.5–1.5% between medal positions. Intensity maintenance during taper is critical: reducing intensity alongside volume produces inferior performance outcomes.',
      },
    ],
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PaddleSportsSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --pad-deep: #0a2020;
          --pad-teal: #0d9488;
          --pad-foam: #f0fffe;
          --pad-forest: #166534;
          --pad-dark: #041010;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pad-root {
          min-height: 100vh;
          background-color: var(--pad-dark);
          color: var(--pad-foam);
          font-family: 'Quicksand', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Water shimmer grain overlay */
        .pad-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Deep river ambient glow */
        .pad-root::after {
          content: '';
          position: fixed;
          top: 30vh;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(13,148,136,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .pad-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(4,16,16,0.93);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(13,148,136,0.18);
          padding: 12px 24px;
        }

        .pad-header-inner {
          max-width: 920px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pad-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(13,148,136,0.22);
          background: rgba(13,148,136,0.06);
          color: rgba(240,255,254,0.5);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .pad-back-btn:hover {
          border-color: var(--pad-teal);
          color: var(--pad-teal);
          background: rgba(13,148,136,0.12);
        }

        .pad-back-btn svg { width: 16px; height: 16px; }

        .pad-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--pad-teal);
        }

        .pad-header-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--pad-foam);
        }

        /* ── Main ── */
        .pad-main {
          position: relative;
          z-index: 2;
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* ── Hero ── */
        .pad-hero {
          position: relative;
          padding: 60px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .pad-hero-glow-a {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-55%);
          width: 700px;
          height: 420px;
          background: radial-gradient(ellipse, rgba(13,148,136,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .pad-hero-glow-b {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-35%);
          width: 550px;
          height: 380px;
          background: radial-gradient(ellipse, rgba(22,101,52,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .pad-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--pad-teal);
          background: rgba(13,148,136,0.10);
          border: 1px solid rgba(13,148,136,0.28);
          padding: 6px 20px;
          border-radius: 4px;
          margin-bottom: 28px;
        }

        .pad-hero-svg {
          display: block;
          margin: 0 auto 28px;
          width: 120px;
          height: 72px;
        }

        .pad-hero-h1 {
          font-size: clamp(48px, 10vw, 100px);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .pad-hero-h1 .teal { color: var(--pad-teal); }
        .pad-hero-h1 .forest { color: #4ade80; }

        .pad-hero-sub {
          font-size: clamp(13px, 2vw, 16px);
          font-weight: 500;
          color: rgba(240,255,254,0.55);
          margin: 18px auto 38px;
          max-width: 520px;
          line-height: 1.6;
        }

        .pad-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
        }

        .pad-hero-stat-num {
          font-size: 40px;
          font-weight: 700;
          color: var(--pad-teal);
          line-height: 1;
        }

        .pad-hero-stat-num .unit {
          font-size: 16px;
          color: rgba(240,255,254,0.45);
          margin-left: 3px;
          font-weight: 500;
        }

        .pad-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240,255,254,0.4);
          margin-top: 4px;
        }

        .pad-hero-divider {
          width: 1px;
          height: 38px;
          background: rgba(13,148,136,0.20);
        }

        /* ── Key Stats Grid ── */
        .pad-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) {
          .pad-key-stats { grid-template-columns: repeat(4, 1fr); }
        }

        .pad-stat-card {
          background: rgba(13,148,136,0.06);
          border: 1px solid rgba(13,148,136,0.15);
          padding: 16px 14px;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
        }

        .pad-stat-val {
          font-size: 26px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .pad-stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: rgba(240,255,254,0.55);
          margin-bottom: 4px;
        }

        .pad-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: rgba(240,255,254,0.28);
          letter-spacing: 0.04em;
          line-height: 1.5;
        }

        /* ── Race Duration Chart ── */
        .pad-chart {
          background: rgba(13,148,136,0.05);
          border: 1px solid rgba(13,148,136,0.14);
          border-radius: 12px;
          padding: 26px;
          margin-bottom: 40px;
        }

        .pad-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--pad-teal);
          margin-bottom: 4px;
        }

        .pad-chart-sub {
          font-size: 12px;
          font-weight: 500;
          color: rgba(240,255,254,0.35);
          margin-bottom: 22px;
        }

        .pad-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .pad-chart-row {
          display: grid;
          grid-template-columns: 110px 1fr 64px;
          align-items: center;
          gap: 12px;
        }

        .pad-chart-disc {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pad-chart-track {
          height: 22px;
          background: rgba(255,255,255,0.04);
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .pad-chart-fill {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 4px;
          opacity: 0.75;
          transition: width 0.3s ease;
        }

        .pad-chart-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          text-align: right;
        }

        /* ── Science Cards ── */
        .pad-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .pad-card {
          background: rgba(13,148,136,0.05);
          border: 1px solid rgba(13,148,136,0.14);
          border-radius: 12px;
          padding: 28px 26px;
          position: relative;
          overflow: hidden;
        }

        .pad-card-accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          border-radius: 12px 0 0 12px;
        }

        .pad-card-number {
          font-size: 80px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          top: 14px;
          right: 20px;
          opacity: 0.04;
          letter-spacing: -0.03em;
          font-family: 'IBM Plex Mono', monospace;
          pointer-events: none;
        }

        .pad-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .pad-card-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--pad-foam);
          line-height: 1.15;
          margin-bottom: 20px;
        }

        .pad-findings {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .pad-finding {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: rgba(240,255,254,0.025);
          border-left: 2px solid rgba(13,148,136,0.12);
          border-radius: 0 6px 6px 0;
          transition: background 0.15s ease;
        }

        .pad-finding:hover {
          background: rgba(240,255,254,0.042);
        }

        .pad-finding-stat {
          flex-shrink: 0;
          min-width: 90px;
        }

        .pad-finding-stat-val {
          font-size: 20px;
          font-weight: 700;
          line-height: 1.1;
        }

        .pad-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 7.5px;
          color: rgba(240,255,254,0.35);
          letter-spacing: 0.04em;
          margin-top: 3px;
          line-height: 1.4;
        }

        .pad-finding-body { flex: 1; min-width: 0; }

        .pad-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 7.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,255,254,0.28);
          margin-bottom: 5px;
        }

        .pad-finding-detail {
          font-size: 13.5px;
          font-weight: 400;
          color: rgba(240,255,254,0.68);
          line-height: 1.58;
        }

        /* ── Disclaimer ── */
        .pad-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: rgba(13,148,136,0.05);
          border: 1px solid rgba(13,148,136,0.12);
          border-left: 3px solid rgba(13,148,136,0.30);
          border-radius: 8px;
        }

        .pad-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: rgba(240,255,254,0.38);
          line-height: 1.80;
          letter-spacing: 0.04em;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .pad-hero-h1 { font-size: 46px; }
          .pad-card { padding: 22px 18px; }
          .pad-finding { flex-direction: column; gap: 8px; }
          .pad-chart-row { grid-template-columns: 80px 1fr 52px; }
          .pad-hero-stats { gap: 18px; }
        }
      `}} />

      <div className="pad-root">
        {/* Header */}
        <header className="pad-header">
          <div className="pad-header-inner">
            <Link href="/workouts" className="pad-back-btn" aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <div>
              <div className="pad-header-label">Sports Science Series</div>
              <div className="pad-header-title">Paddle Sports Science</div>
            </div>
          </div>
        </header>

        <main className="pad-main">
          {/* Hero */}
          <section className="pad-hero">
            <div className="pad-hero-glow-a" />
            <div className="pad-hero-glow-b" />
            <div className="pad-hero-tag">Kayak · Canoe · SUP — Water Science</div>

            {/* Hero SVG: kayak paddle with water splash */}
            <svg
              className="pad-hero-svg"
              viewBox="0 0 120 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Paddle shaft */}
              <line x1="10" y1="62" x2="110" y2="10" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Left blade */}
              <ellipse cx="15" cy="60" rx="9" ry="5" fill="#0f766e" opacity="0.85" transform="rotate(-40 15 60)"/>
              {/* Right blade */}
              <ellipse cx="105" cy="12" rx="9" ry="5" fill="#0f766e" opacity="0.85" transform="rotate(-40 105 12)"/>
              {/* Water drip lines from left blade */}
              <line x1="9" y1="66" x2="8" y2="71" stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <line x1="14" y1="67" x2="14" y2="72" stroke="#0d9488" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
              <line x1="20" y1="65" x2="21" y2="70" stroke="#0d9488" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
              {/* Water drip from right blade */}
              <line x1="100" y1="8" x2="99" y2="2" stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
              <line x1="108" y1="9" x2="108" y2="3" stroke="#0d9488" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
              {/* Wave pattern at bottom */}
              <path d="M 0 68 Q 15 63 30 68 Q 45 73 60 68 Q 75 63 90 68 Q 105 73 120 68" stroke="#0d9488" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round"/>
              <path d="M 0 72 Q 15 67 30 72 Q 45 77 60 72 Q 75 67 90 72 Q 105 77 120 72" stroke="#166534" strokeWidth="1" fill="none" opacity="0.22" strokeLinecap="round"/>
              {/* Splash dots */}
              <circle cx="6" cy="65" r="1.2" fill="#0d9488" opacity="0.6"/>
              <circle cx="24" cy="64" r="0.9" fill="#14b8a6" opacity="0.5"/>
              <circle cx="98" cy="6" r="1.2" fill="#0d9488" opacity="0.6"/>
              <circle cx="112" cy="7" r="0.9" fill="#14b8a6" opacity="0.5"/>
            </svg>

            <h1 className="pad-hero-h1">
              <span className="teal">PADDLE</span>
              <br />
              <span className="forest">SCIENCE</span>
            </h1>
            <p className="pad-hero-sub">
              65–75 mL/kg/min VO₂max. 16 mmol/L post-race lactate.<br />
              60–65% of stroke force from the trunk. The physiology of kayak, canoe &amp; SUP.
            </p>
            <div className="pad-hero-stats">
              <div>
                <div className="pad-hero-stat-num">75<span className="unit">mL/kg/min</span></div>
                <div className="pad-hero-stat-label">Sprint Kayak VO₂max</div>
              </div>
              <div className="pad-hero-divider" />
              <div>
                <div className="pad-hero-stat-num">80<span className="unit">/min</span></div>
                <div className="pad-hero-stat-label">Race Stroke Rate</div>
              </div>
              <div className="pad-hero-divider" />
              <div>
                <div className="pad-hero-stat-num">16<span className="unit">mmol/L</span></div>
                <div className="pad-hero-stat-label">Post-race Lactate</div>
              </div>
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="pad-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="pad-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color,borderRadius:'10px 10px 0 0'}} />
                <div className="pad-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="pad-stat-label">{s.label}</div>
                <div className="pad-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Race Duration Chart */}
          <div className="pad-chart">
            <div className="pad-chart-title">Race Duration by Paddle Discipline</div>
            <div className="pad-chart-sub">Elite competition times — Olympic and international events</div>
            <div className="pad-chart-rows">
              {RACE_DURATIONS.map(d => (
                <div key={d.discipline} className="pad-chart-row">
                  <div className="pad-chart-disc" style={{color:d.color}}>{d.discipline}</div>
                  <div className="pad-chart-track">
                    <div
                      className="pad-chart-fill"
                      style={{width:`${d.pct}%`, background:d.color}}
                    />
                  </div>
                  <div className="pad-chart-val" style={{color:d.color}}>{d.display}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="pad-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="pad-card">
                <div className="pad-card-accent-bar" style={{background:card.accent}} />
                <div className="pad-card-number">{card.number}</div>
                <div className="pad-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="pad-card-title">{card.title}</div>
                <div className="pad-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="pad-finding" style={{borderLeftColor:card.accent+'30'}}>
                      <div className="pad-finding-stat">
                        <div className="pad-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="pad-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="pad-finding-body">
                        <div className="pad-finding-citation">{f.citation}</div>
                        <div className="pad-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="pad-disclaimer">
            <div className="pad-disclaimer-text">
              Performance data and physiological values reflect elite-level competitive kayaking, canoeing, and stand-up paddleboarding based on peer-reviewed sports science literature. VO₂max, lactate, and stroke rate values are representative ranges for Olympic-level sprint kayak athletes unless otherwise specified. SUP physiology data reflects competitive racing contexts. Individual physiological responses vary significantly with training history, body composition, event specialisation, and environmental conditions. This content is for educational purposes only; consult qualified sports scientists, coaches, and medical professionals for individualised training prescription and injury management.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
