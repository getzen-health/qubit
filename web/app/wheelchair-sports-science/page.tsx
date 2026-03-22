// Wheelchair Sports Science — static server component
// Evidence-based para sport physiology covering wheelchair racing, basketball,
// tennis, and rugby with classification science and Paralympic biomechanics.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Wheelchair Sports Science' }

// ─── VO₂peak by Sport Chart Data ──────────────────────────────────────────────

const VO2_BY_SPORT = [
  { sport: 'Wheelchair Racing T54', vo2: 52, display: '52 mL/kg/min', color: '#0055a4', barPct: 100, desc: 'Highest aerobic demand — elite road & track' },
  { sport: 'Wheelchair Basketball', vo2: 43, display: '43 mL/kg/min', color: '#60a5fa', barPct: 83, desc: 'Intermittent court demands, anaerobic bursts' },
  { sport: 'Wheelchair Tennis',     vo2: 38, display: '38 mL/kg/min', color: '#93c5fd', barPct: 73, desc: 'Rally-based aerobic-anaerobic interplay' },
  { sport: 'Wheelchair Rugby',      vo2: 35, display: '35 mL/kg/min', color: '#ef4444', barPct: 67, desc: 'Quad sport — reduced active muscle mass' },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '13.63 s',  label: '100m World Record',      sub: 'Marcel Hug — T54 sprint wheelchair',   color: '#0055a4' },
  { value: '1:20:14',  label: 'Marathon World Record',  sub: 'T54 class — 42.195 km wheelchair',      color: '#60a5fa' },
  { value: '3.5 Hz',   label: 'Push Frequency',         sub: 'Sprint events — propulsion cadence',    color: '#0055a4' },
  { value: '30–40%',   label: 'Less Rolling Resistance', sub: 'Carbon frame vs. standard wheelchair', color: '#ef4444' },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    number: '01',
    title: 'Wheelchair Racing Biomechanics',
    accent: '#0055a4',
    icon: '♿',
    findings: [
      {
        citation: 'Veeger 1992 — J Biomech / IPC World Records',
        stat: '13.63 s',
        statLabel: 'T54 100m world record — Marcel Hug',
        detail: 'Paralympic sprint wheelchair racing generates push frequencies of 2.5–3.5 Hz during sprint events, with propulsive force per stroke of 150–300 N. The aerodynamic tuck position — head low, trunk horizontal, elbows tucked — minimises frontal area and drag coefficient at competition speed. Carbon fibre racing chairs weigh 7–9 kg with rigid monocoque or tube-and-lug frames. Veeger 1992 established foundational wheelchair propulsion biomechanics, identifying shoulder internal rotation and elbow extension as the primary force-generating joint actions in the propulsive phase. Racing chair design has evolved to optimise push rim geometry, seat height, and wheel camber for each athlete\'s specific anthropometry and impairment level.',
      },
      {
        citation: 'Veeger 1992 — J Biomech',
        stat: '50–80 ms',
        statLabel: 'Hand contact duration per stroke',
        detail: 'The propulsive arc spans 10°–80° behind the wheel axle. Hand contact duration of 50–80 ms per stroke is shorter than recreational wheelchair propulsion (100–150 ms) due to higher cadence and optimised wrist supination for grip initiation. The recovery phase — the non-contact return of the hand to the top of the push rim — represents approximately 70% of the stroke cycle. Shoulder impingement risk is highest during this phase due to the abducted, internally rotated return trajectory under fatigue. Cumulative shoulder loads in T54 marathon athletes exceed those found in any ambulatory overhead sport, making rotator cuff conditioning a primary long-term athlete development priority.',
      },
      {
        citation: 'IPC Athletics — Elite Performance Data',
        stat: '< 1:20:00',
        statLabel: 'Elite T54 marathon time',
        detail: 'T54 marathon racing demands sustained aerobic output at 85–92% VO₂peak across 42.195 km. Aerodynamic drafting behind another racing chair provides approximately 30% drag reduction — comparable to road cycling drafting — making tactical positioning and breakaway timing critical strategic decisions. Gear ratio selection (via wheel size and push frequency modulation) is dynamically adapted: uphill gradients demand increased push frequency with reduced per-stroke force; flat sections favour lower cadence with higher individual stroke power output. Elite T54 athletes sustain average speeds greater than 30 km/h, completing kilometres in under two minutes, with sub-pacing precision within ±2 s per km required for record attempts.',
      },
      {
        citation: 'Wheelchair Racing Equipment Science',
        stat: '0.3–0.6',
        statLabel: 'Push glove friction coefficient',
        detail: 'Push glove materials range from leather to synthetic composites with friction coefficients optimised at 0.3–0.6 for effective energy transfer from hand to push rim. Insufficient friction causes hand slip and propulsive energy loss; excessive friction increases shear forces, blister risk, and skin breakdown over the thenar eminence and fingertip contact zones. Elite athletes customise glove thickness, palm padding, and cut based on event distance: sprint events favour thin gloves for tactile feedback and contact precision; marathon events require additional padding to protect against 3,000+ repetitive push rim contacts. Glove design integrates pressure distribution principles from wheelchair seating science.',
      },
    ],
  },
  {
    id: 'court-sports',
    number: '02',
    title: 'Wheelchair Basketball & Court Sports',
    accent: '#60a5fa',
    icon: '🏀',
    findings: [
      {
        citation: 'Vanlandewijck 2004 — Sports Med',
        stat: '4–6 km',
        statLabel: 'Court distance per basketball game',
        detail: 'Wheelchair basketball movement demands include sprint velocities of 12–15 km/h, rapid turning within the minimum radius determined by chair configuration, and high-frequency direction changes under defensive pressure. Vanlandewijck 2004 established that wheelchair basketball performance is strongly moderated by the functional classification system (1.0–4.5 points, based on trunk control and upper limb function). Higher-classified players exhibit greater chair manoeuvrability, shot arc, and dribbling capability. Competitive teams must field no more than 14 classification points among five players on court simultaneously, creating strategic team composition decisions that parallel salary-cap management in professional sport.',
      },
      {
        citation: 'Wheelchair Basketball Biomechanics Research',
        stat: 'Trunk extension',
        statLabel: 'Replaces lower body drive in shooting',
        detail: 'Wheelchair basketball shooting biomechanics differ fundamentally from standing basketball — trunk extension and shoulder elevation during the shot motion replace the lower-body drive phase that generates upward force in ambulatory players. Elbow guide alignment at the shooting shoulder remains the primary accuracy determinant. Chair position relative to the basket must be optimised pre-shot: players brake, position, and stabilise the chair before release, adding a chair-control skill component absent in ambulatory play. Seating classification directly affects shooting arc and release point — lower-classified athletes with reduced trunk stability adopt compensatory shooting styles with altered trajectories and lower release height.',
      },
      {
        citation: 'Wheelchair Tennis ITF Research',
        stat: '2.5–4 km',
        statLabel: 'Distance covered per set',
        detail: 'Court coverage demands in wheelchair tennis include lateral chair drives, forward net approaches, and backward recovery — all executed during active ball-striking without the ability to decelerate with leg planting. The two-bounce rule (the ball may bounce twice before return) fundamentally alters court positioning strategy versus standing tennis, enabling wider coverage of baseline angles. Top spin generation without leg drive relies on compensatory shoulder internal rotation velocity and wrist flexion rate during contact. Elite wheelchair tennis serve velocities average 120–145 km/h, compared to 180–200 km/h for standing servers — the differential reflects the inability to transfer ground reaction force upward through a kinetic chain from feet to racket.',
      },
      {
        citation: 'Wheelchair Rugby — Paralympic Sport Science',
        stat: '0.5–3.5',
        statLabel: 'Quad classification point range',
        detail: 'Wheelchair rugby is the only Paralympic team sport for athletes with impairment affecting all four limbs, creating the most heterogeneous classification range in para sport (0.5–3.5 points). Chair-to-chair contact mechanics involve deliberate blocking and picking manoeuvres; rugby wheelchairs are purpose-built with wing guards and front bumpers engineered for high-impact collisions. Ball-handling capability varies enormously across the classification range: 0.5-classified athletes rely primarily on chair-to-chair blocking, while 3.5-classified players serve as primary ball carriers with near-full hand function. The physiology of repeated impact in wheelchair rugby demands upper-body collision stabilisation training — neck, shoulder, and upper trunk — not required in non-contact wheelchair sports.',
      },
    ],
  },
  {
    id: 'physiology',
    number: '03',
    title: 'Physiological Demands',
    accent: '#0055a4',
    icon: '❤️',
    findings: [
      {
        citation: 'Upper-Body Exercise Physiology — Para Sport Research',
        stat: '30–55 mL/kg/min',
        statLabel: 'VO₂peak — upper-body aerobic ceiling',
        detail: 'Upper-body aerobic limitation in wheelchair athletes results from the substantially smaller active muscle mass of the arms and shoulder girdle compared to the legs plus trunk in ambulatory sport. When VO₂peak is expressed per kilogram of estimated active muscle mass rather than total body mass, values in elite wheelchair athletes approach or match those of elite able-bodied endurance athletes, demonstrating equivalent aerobic adaptability per unit of muscle. Training targets brachial cardiovascular adaptations: increased cardiac stroke volume, elevated arm capillarisation density, and enhanced oxidative enzyme capacity in the deltoid, pectoralis major, triceps, and latissimus dorsi — the primary propulsive muscle group in wheelchair propulsion.',
      },
      {
        citation: 'SCI Autonomic Physiology Research',
        stat: '110–145 bpm',
        statLabel: 'HR max in high-level SCI athletes',
        detail: 'Autonomic dysreflexia risk during maximal exercise is a key safety concern for athletes with SCI at T6 and above, where sympathetic innervation to the heart is partially or fully interrupted. HR max is substantially reduced from age-predicted values — athletes with complete C5–T5 injuries typically cannot exceed 130–145 bpm via volitional exercise. Classification of autonomic nervous system function (American Spinal Injury Association Impairment Scale grade) directly predicts the degree of cardiac response limitation. During combined thermoregulatory and exercise stress, these athletes cannot mount a compensatory heart rate increase, making cardiac output entirely dependent on stroke volume augmentation. HRV-based training monitoring requires impairment-specific reference ranges for meaningful interpretation.',
      },
      {
        citation: 'Para Athlete Thermoregulation Research',
        stat: 'Absent sweating',
        statLabel: 'Below SCI level — heat illness risk',
        detail: 'Absent sweating below the SCI level eliminates evaporative cooling from the majority of body surface area during exercise, creating severe heat illness risk in warm outdoor environments. Cooling strategies for wheelchair athletes include pre-cooling ice vests targeting the upper body and neck, cold-water immersion of functioning upper extremities during breaks, head and neck cooling towels, and aggressive shade and microclimate management. Environmental modification — scheduling competition during cooler parts of the day and enforcing WBGT limits — is codified in Paralympic competition guidelines. Core temperature monitoring via ingestible thermistors is used in elite para sport heat management. Athletes with complete cervical injuries face the highest risk due to the greatest proportion of impaired sweating surface.',
      },
      {
        citation: 'Para Sport Medicine — Seating & Tissue Health',
        stat: '15–30%',
        statLabel: 'Annual pressure injury prevalence',
        detail: 'Ischial tuberosity loading during competition is affected by seating position, chair tilt angle, and activity intensity. Sustained seated posture during long events — marathon racing, extended tennis matches — increases pressure injury risk at bony prominences lacking protective sensation. Sports-specific seat cushion design uses pressure mapping technology to identify peak-pressure zones and redistribute load across broader contact surfaces. Competitive transfer protocols between sport chair and everyday wheelchair minimise cumulative tissue loading from position changes. Pressure injury prevalence in Paralympic athletes is estimated at 15–30% annually, with competition-related injuries concentrated in multi-hour events. Regular weight-relief pressure lifts every 15–30 minutes during non-competitive intervals are standard athlete education and chair management practice.',
      },
    ],
  },
  {
    id: 'classification',
    number: '04',
    title: 'Classification Science & Para Sport',
    accent: '#ef4444',
    icon: '📋',
    findings: [
      {
        citation: 'Tweedy 2011 — Br J Sports Med',
        stat: 'Evidence-based',
        statLabel: 'IPC classification code framework',
        detail: 'Tweedy 2011 established the modern evidence-based framework for Paralympic classification: sport class assignment based on activity limitation testing specific to each sport\'s movement demands; minimum disability criteria excluding athletes without sufficient impairment; and within-class performance variance minimisation as the primary validity criterion. Classification error rates — incorrect placement of athletes into sport classes — have quantifiable impacts on competition fairness that can be modelled statistically. The IPC Classification Code (2015) mandated all Paralympic sports to develop evidence-based classification systems by 2024, replacing historical clinical-judgement approaches with sport-specific field testing. Classification research is among the highest-priority areas in Paralympic science funding.',
      },
      {
        citation: 'Wheelchair Technology & Materials Science',
        stat: '30–40%',
        statLabel: 'Rolling resistance reduction — carbon frame',
        detail: 'Racing wheelchair materials science progression from aluminium to aerospace-grade carbon fibre has reduced frame weight while increasing stiffness-to-weight ratio, reducing energy loss in frame flex during each push stroke. Spoke tension optimisation minimises lateral wheel deflection during cornering at competition speed. Cambered rear wheels at 15–20° widen the stability base without excessively increasing the chair\'s competition corridor width. Anti-tip wheels prevent backward capsizing on steep gradients. Sports chairs differ from everyday wheelchairs in frame rigidity, camber angle, seat position, and wheel specification — everyday chairs are engineered for multi-surface versatility and durability; sports chairs sacrifice versatility entirely for peak event-specific performance metrics.',
      },
      {
        citation: 'IPC Anti-Doping — Boosting Prohibition',
        stat: '> 250 mmHg',
        statLabel: 'Systolic BP during boosting — stroke risk',
        detail: 'Autonomic dysreflexia — a dangerous hypertensive crisis triggered by noxious stimuli below the SCI level — can transiently increase heart rate, blood pressure, and exercise performance in high-level SCI athletes. Deliberate induction through tight leg strapping, bladder distension, or other noxious techniques is termed \'boosting\' and is prohibited under IPC strict liability rules. Physiological mechanism: the noxious stimulus triggers a mass sympathetic discharge below the injury level, elevating systolic blood pressure to 250+ mmHg and creating acute stroke and hypertensive encephalopathy risk. Detection: pre-competition resting blood pressure >20 mmHg above the athlete\'s established baseline triggers investigation. Anonymous survey data indicates up to 15% of eligible SCI Paralympic athletes have reported historical boosting use — highlighting the need for both deterrence and athlete education.',
      },
      {
        citation: 'Para Sport Periodisation Research',
        stat: 'Mirror principles',
        statLabel: 'Para periodisation = able-bodied science',
        detail: 'Evidence increasingly demonstrates that para athletes\' periodisation, strength training, and tapering principles mirror able-bodied sport science when appropriately adjusted for active muscle mass, classification constraints, and impairment-specific physiological responses. Progressive overload, supercompensation, and competition-period peaking protocols all apply directly. Required adjustments include: scaling training volume targets to active muscle mass rather than total body mass; using impairment-specific HRV reference ranges for readiness monitoring; replacing lower-body plyometrics and power training with validated upper-body equivalents; and integrating pressure injury prevention into recovery protocols as a primary health metric. The evidence gap between para and able-bodied sport science is narrowing rapidly, driven by IPC-funded research programmes since 2012.',
      },
    ],
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WheelchairSportsSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Open+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --wc-dark: #050a1a;
          --wc-blue: #0055a4;
          --wc-red: #ef4444;
          --wc-ageis: #60a5fa;
          --wc-text: #f0f4ff;
          --wc-surface: #0b1427;
          --wc-surface-2: #0f1c35;
          --wc-border: #1a2c4a;
          --wc-blue-glow: rgba(0,85,164,0.18);
          --wc-red-glow: rgba(239,68,68,0.15);
          --wc-ageis-glow: rgba(96,165,250,0.12);
          --wc-text-dim: #7a90b8;
          --wc-text-faint: #2e4060;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .wc-root {
          min-height: 100vh;
          background-color: var(--wc-dark);
          color: var(--wc-text);
          font-family: 'Open Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle grain overlay */
        .wc-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Deep blue background radial glow */
        .wc-root::after {
          content: '';
          position: fixed;
          top: 10vh;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(0,85,164,0.06) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .wc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5,10,26,0.93);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--wc-border);
          padding: 12px 24px;
        }

        .wc-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .wc-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--wc-border);
          background: var(--wc-surface);
          color: var(--wc-text-dim);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .wc-back-btn:hover {
          border-color: var(--wc-ageis);
          color: var(--wc-ageis);
          background: var(--wc-ageis-glow);
        }

        .wc-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--wc-ageis);
        }

        .wc-header-title {
          font-family: 'Anton', sans-serif;
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--wc-text);
        }

        .wc-main {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* ── Hero ── */
        .wc-hero {
          position: relative;
          padding: 64px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .wc-hero-glow-b {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-55%);
          width: 700px;
          height: 450px;
          background: radial-gradient(ellipse, rgba(0,85,164,0.16) 0%, transparent 65%);
          pointer-events: none;
        }

        .wc-hero-glow-r {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-35%);
          width: 500px;
          height: 350px;
          background: radial-gradient(ellipse, rgba(239,68,68,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .wc-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--wc-ageis);
          background: var(--wc-ageis-glow);
          border: 1px solid rgba(96,165,250,0.28);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .wc-hero-h1 {
          font-family: 'Anton', sans-serif;
          font-size: clamp(52px, 11vw, 110px);
          font-weight: 400;
          line-height: 0.92;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 10px;
          text-shadow: 0 0 80px rgba(0,85,164,0.22);
        }

        .wc-hero-h1 .blue-accent { color: var(--wc-ageis); text-shadow: 0 0 60px rgba(96,165,250,0.55); }
        .wc-hero-h1 .red-accent  { color: var(--wc-red);   text-shadow: 0 0 40px rgba(239,68,68,0.50); }

        .wc-hero-sub {
          font-size: clamp(13px, 1.9vw, 16px);
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--wc-text-dim);
          margin: 18px auto 36px;
          max-width: 560px;
          line-height: 1.55;
        }

        /* Hero SVG */
        .wc-hero-svg {
          display: block;
          margin: 0 auto 36px;
          max-width: 420px;
          width: 100%;
        }

        .wc-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
        }

        .wc-hero-stat-num {
          font-family: 'Anton', sans-serif;
          font-size: 42px;
          font-weight: 400;
          color: var(--wc-ageis);
          line-height: 1;
          letter-spacing: 0.02em;
        }

        .wc-hero-stat-num .unit { font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--wc-text-dim); margin-left: 4px; }

        .wc-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--wc-text-dim);
          margin-top: 4px;
        }

        .wc-hero-divider { width: 1px; height: 40px; background: var(--wc-border); }

        /* ── Key stats grid ── */
        .wc-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) { .wc-key-stats { grid-template-columns: repeat(4, 1fr); } }

        .wc-stat-card {
          background: var(--wc-surface);
          border: 1px solid var(--wc-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .wc-stat-val {
          font-family: 'Anton', sans-serif;
          font-size: 26px;
          font-weight: 400;
          letter-spacing: 0.02em;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .wc-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--wc-text-dim);
          margin-bottom: 4px;
        }

        .wc-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--wc-text-faint);
          letter-spacing: 0.04em;
          line-height: 1.5;
        }

        /* ── VO₂peak chart ── */
        .wc-chart {
          background: var(--wc-surface);
          border: 1px solid var(--wc-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .wc-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--wc-ageis);
          margin-bottom: 6px;
        }

        .wc-chart-sub {
          font-size: 12px;
          color: var(--wc-text-faint);
          margin-bottom: 20px;
        }

        .wc-chart-rows { display: flex; flex-direction: column; gap: 14px; }

        .wc-chart-row { display: grid; grid-template-columns: 190px 1fr 110px; align-items: center; gap: 12px; }

        @media (max-width: 600px) { .wc-chart-row { grid-template-columns: 120px 1fr 80px; } }

        .wc-chart-sport {
          font-family: 'Open Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .wc-chart-wrap { display: flex; flex-direction: column; gap: 4px; }

        .wc-chart-track { height: 22px; background: rgba(255,255,255,0.04); position: relative; overflow: hidden; }

        .wc-chart-fill { height: 100%; position: absolute; left: 0; top: 0; opacity: 0.85; }

        .wc-chart-desc { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--wc-text-faint); letter-spacing: 0.04em; }

        .wc-chart-val { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; text-align: right; }

        /* ── Science cards ── */
        .wc-cards { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

        .wc-card {
          background: var(--wc-surface);
          border: 1px solid var(--wc-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .wc-card-number {
          font-family: 'Anton', sans-serif;
          font-size: 80px;
          font-weight: 400;
          line-height: 1;
          position: absolute;
          top: 14px;
          right: 20px;
          opacity: 0.05;
          letter-spacing: 0.02em;
        }

        .wc-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .wc-card-title {
          font-family: 'Anton', sans-serif;
          font-size: 28px;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--wc-text);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .wc-findings { display: flex; flex-direction: column; gap: 12px; }

        .wc-finding {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: rgba(255,255,255,0.022);
          border-left: 2px solid rgba(255,255,255,0.06);
          transition: background 0.15s ease;
        }

        .wc-finding:hover { background: rgba(255,255,255,0.038); }

        .wc-finding-stat { flex-shrink: 0; min-width: 92px; }

        .wc-finding-stat-val {
          font-family: 'Anton', sans-serif;
          font-size: 20px;
          font-weight: 400;
          letter-spacing: 0.02em;
          line-height: 1.05;
        }

        .wc-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--wc-text-faint);
          letter-spacing: 0.04em;
          margin-top: 2px;
          line-height: 1.4;
        }

        .wc-finding-body { flex: 1; min-width: 0; }

        .wc-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--wc-text-faint);
          margin-bottom: 5px;
        }

        .wc-finding-detail {
          font-size: 14px;
          font-weight: 400;
          color: rgba(240,244,255,0.70);
          line-height: 1.6;
        }

        /* ── Paralympic flag accent banner ── */
        .wc-paralympic-bar {
          display: flex;
          gap: 0;
          height: 4px;
          margin-bottom: 40px;
          overflow: hidden;
        }

        .wc-paralympic-bar span {
          flex: 1;
        }

        /* ── Disclaimer ── */
        .wc-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--wc-surface);
          border: 1px solid var(--wc-border);
          border-left: 3px solid var(--wc-text-faint);
        }

        .wc-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--wc-text-dim);
          line-height: 1.75;
          letter-spacing: 0.04em;
        }

        @media (max-width: 640px) {
          .wc-hero-h1 { font-size: 50px; }
          .wc-card { padding: 22px 18px; }
          .wc-finding { flex-direction: column; gap: 8px; }
          .wc-finding-stat { min-width: unset; }
        }
      `}} />

      <div className="wc-root">
        {/* Header */}
        <header className="wc-header">
          <div className="wc-header-inner">
            <Link href="/workouts" className="wc-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="wc-header-label">Paralympic Science Series</div>
              <div className="wc-header-title">Wheelchair Sports Science</div>
            </div>
          </div>
        </header>

        <main className="wc-main">
          {/* Hero */}
          <section className="wc-hero">
            <div className="wc-hero-glow-b" />
            <div className="wc-hero-glow-r" />

            <div className="wc-hero-tag">Para Sport · Racing · Basketball · Tennis · Rugby</div>

            <h1 className="wc-hero-h1">
              <span className="blue-accent">WHEELCHAIR</span>
              <br />
              <span className="red-accent">SPORTS</span>
              {' '}SCIENCE
            </h1>

            {/* Hero SVG: Racing wheelchair in aerodynamic tuck with speed lines */}
            <svg
              className="wc-hero-svg"
              viewBox="0 0 420 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Racing wheelchair athlete in aerodynamic tuck position"
            >
              {/* Speed lines — left */}
              <line x1="10" y1="90"  x2="80"  y2="90"  stroke="#0055a4" strokeWidth="2" strokeOpacity="0.5" />
              <line x1="20" y1="108" x2="75"  y2="108" stroke="#0055a4" strokeWidth="1.5" strokeOpacity="0.35" />
              <line x1="5"  y1="72"  x2="65"  y2="72"  stroke="#0055a4" strokeWidth="1" strokeOpacity="0.22" />
              <line x1="15" y1="126" x2="70"  y2="126" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.20" />
              <line x1="25" y1="58"  x2="60"  y2="58"  stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.15" />

              {/* Rear large wheel */}
              <circle cx="160" cy="148" r="46" stroke="#0055a4" strokeWidth="3" fill="none" />
              <circle cx="160" cy="148" r="38" stroke="#0055a4" strokeWidth="1" fill="none" strokeOpacity="0.3" />
              {/* Spokes */}
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={160}
                    y1={148}
                    x2={160 + Math.cos(rad) * 45}
                    y2={148 + Math.sin(rad) * 45}
                    stroke="#0055a4"
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                  />
                )
              })}
              <circle cx="160" cy="148" r="5" fill="#0055a4" />

              {/* Small front wheel */}
              <circle cx="300" cy="162" r="22" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
              <circle cx="300" cy="162" r="16" stroke="#60a5fa" strokeWidth="0.8" fill="none" strokeOpacity="0.3" />
              {[0,60,120,180,240,300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={300}
                    y1={162}
                    x2={300 + Math.cos(rad) * 21}
                    y2={162 + Math.sin(rad) * 21}
                    stroke="#60a5fa"
                    strokeWidth="1"
                    strokeOpacity="0.55"
                  />
                )
              })}
              <circle cx="300" cy="162" r="4" fill="#60a5fa" />

              {/* Racing chair frame — low-slung seat tube */}
              <path
                d="M 185 145 L 210 130 L 255 118 L 290 142"
                stroke="#60a5fa"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* Seat back / backrest */}
              <path
                d="M 208 130 L 218 98 L 228 95"
                stroke="#60a5fa"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Athlete body — aerodynamic tuck */}
              {/* Trunk — deeply angled forward */}
              <path
                d="M 228 95 C 238 88, 260 78, 285 72"
                stroke="#f0f4ff"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              {/* Head — tucked low */}
              <circle cx="291" cy="68" r="12" fill="#1a2c4a" stroke="#f0f4ff" strokeWidth="2" />
              {/* Helmet detail */}
              <path d="M 281 63 Q 291 55 301 63" stroke="#ef4444" strokeWidth="1.5" fill="none" />

              {/* Arms reaching to push rim — left arm */}
              <path
                d="M 255 80 C 245 100, 215 125, 190 140"
                stroke="#f0f4ff"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Push glove / hand */}
              <circle cx="190" cy="141" r="5" fill="#ef4444" />

              {/* Arms reaching to push rim — right arm visible */}
              <path
                d="M 268 84 C 255 105, 222 128, 198 143"
                stroke="#f0f4ff"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeOpacity="0.5"
              />

              {/* Speed glow lines — right of chair */}
              <line x1="345" y1="82"  x2="415" y2="82"  stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.45" />
              <line x1="350" y1="100" x2="410" y2="100" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.30" />
              <line x1="355" y1="64"  x2="405" y2="64"  stroke="#0055a4" strokeWidth="1" strokeOpacity="0.22" />
              <line x1="340" y1="118" x2="400" y2="118" stroke="#0055a4" strokeWidth="1" strokeOpacity="0.18" />

              {/* Ground shadow */}
              <ellipse cx="220" cy="193" rx="130" ry="5" fill="#0055a4" fillOpacity="0.12" />
            </svg>

            <p className="wc-hero-sub">
              13.63 s for 100 m. Under 1:21 for the marathon.<br/>
              The biomechanics and physiology of elite wheelchair sport.
            </p>

            <div className="wc-hero-stats">
              <div>
                <div className="wc-hero-stat-num">13.63<span className="unit">s</span></div>
                <div className="wc-hero-stat-label">T54 100m record</div>
              </div>
              <div className="wc-hero-divider" />
              <div>
                <div className="wc-hero-stat-num">3.5<span className="unit">Hz</span></div>
                <div className="wc-hero-stat-label">Sprint push frequency</div>
              </div>
              <div className="wc-hero-divider" />
              <div>
                <div className="wc-hero-stat-num">52<span className="unit">mL/kg/min</span></div>
                <div className="wc-hero-stat-label">T54 racer VO₂peak</div>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="wc-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="wc-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="wc-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="wc-stat-label">{s.label}</div>
                <div className="wc-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Paralympic colours accent bar */}
          <div className="wc-paralympic-bar">
            <span style={{background:'#0085c7'}} />
            <span style={{background:'#f4c300'}} />
            <span style={{background:'#009f6b'}} />
            <span style={{background:'#ef4444'}} />
            <span style={{background:'#ffffff',opacity:0.15}} />
          </div>

          {/* VO₂peak by sport chart */}
          <div className="wc-chart">
            <div className="wc-chart-title">Para Sport VO₂peak by Sport — Upper-Body Aerobic Capacity</div>
            <div className="wc-chart-sub">mL/kg/min — elite competition level, adapted from para sport physiology literature</div>
            <div className="wc-chart-rows">
              {VO2_BY_SPORT.map(s => (
                <div key={s.sport} className="wc-chart-row">
                  <div className="wc-chart-sport" style={{color:s.color}}>{s.sport}</div>
                  <div className="wc-chart-wrap">
                    <div className="wc-chart-track">
                      <div className="wc-chart-fill" style={{width:`${s.barPct}%`,background:s.color}} />
                    </div>
                    <div className="wc-chart-desc">{s.desc}</div>
                  </div>
                  <div className="wc-chart-val" style={{color:s.color}}>{s.display}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science cards */}
          <div className="wc-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="wc-card">
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="wc-card-number">{card.number}</div>
                <div className="wc-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="wc-card-title">{card.title}</div>
                <div className="wc-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="wc-finding" style={{borderLeftColor: `${card.accent}33`}}>
                      <div className="wc-finding-stat">
                        <div className="wc-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="wc-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="wc-finding-body">
                        <div className="wc-finding-citation">{f.citation}</div>
                        <div className="wc-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="wc-disclaimer">
            <div className="wc-disclaimer-text">
              All performance data, physiological statistics, and classification information are drawn from peer-reviewed para sport research and International Paralympic Committee publications. Performance values reflect elite Paralympic competition level unless otherwise noted. Physiological responses vary substantially by impairment level, SCI completeness, and sport classification. VO₂peak values are total-body-mass normalised; per-active-muscle-mass values are substantially higher. This content is for educational purposes only; consult qualified para sport medical staff and certified classifiers for individual athlete assessment and programme design.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
