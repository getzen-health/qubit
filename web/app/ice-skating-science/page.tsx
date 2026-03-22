// Ice Skating Science — static server component
// Evidence-based ice skating physiology covering figure skating biomechanics,
// speed skating physics, joint loading, and training science for competitive skaters.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Ice Skating Science' }

// ─── Speed Skating World Records by Distance ───────────────────────────────────

const SPEED_RECORDS = [
  { distance: '500m',   time: '33.61s',    speed: 14.9, barW: 98 },
  { distance: '1000m',  time: '1:05.69',   speed: 15.2, barW: 100 },
  { distance: '1500m',  time: '1:40.17',   speed: 15.0, barW: 99 },
  { distance: '5000m',  time: '6:01.86',   speed: 13.8, barW: 91 },
  { distance: '10000m', time: '12:33.89',  speed: 13.3, barW: 87 },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'figure-biomechanics',
    number: '01',
    title: 'Figure Skating Biomechanics',
    accent: '#67e8f9',
    accentDim: 'rgba(103,232,249,0.10)',
    accentBorder: 'rgba(103,232,249,0.28)',
    icon: '⛸️',
    findings: [
      {
        citation: 'King 2005 — J Appl Biomech; Dillman 1996 — Triple Axel kinematics analysis',
        stat: '0.65 s',
        statLabel: 'Triple Axel air time',
        detail: 'The triple Axel requires 3.5 full rotations in approximately 0.65 seconds of air time — the only jump in figure skating entered from a forward edge. Peak rotation rate reaches 5–6 revolutions per second in the tightly tucked air position, achieved by drawing arms and free leg close to the body\'s longitudinal axis (minimising moment of inertia). Entry velocity is 8–9 m/s on the left outside forward edge; angular momentum is generated via edge drive and free-leg swing at takeoff. Ground reaction forces at landing: 3–8× body weight, absorbed through >90° knee flexion which reduces peak force 30–40%. Women\'s triple Axel history: Midori Ito landed the first in competition (1988 NHK Trophy); Tonya Harding repeated at the 1991 US Championships; Elizaveta Tuktamysheva and Kaori Sakamoto have both executed clean triple Axels in Grand Prix competition in the modern era.',
      },
      {
        citation: 'Aleshinsky 1986 — Biomech of Skating Spins; Clarkson 1994 — figure skating physiology',
        stat: '4–6 rev/s',
        statLabel: 'Scratch spin rotation rate',
        detail: 'Figure skating spins exploit conservation of angular momentum: as a skater draws arms and free leg inward, moment of inertia I decreases, increasing angular velocity ω proportionally (L = Iω = constant once spinning). A layback spin in a wide, arched position has moment of inertia ≈3–4 kg·m²; transitioning to a scratch spin (arms overhead, one leg wrapped) drops I to ≈0.8–1.2 kg·m², producing a 3–4× increase in rotation rate. Typical rotation speeds: camel spin ≈1–2 rev/s (extended), layback spin ≈3–4 rev/s (arched), scratch spin ≈4–6 rev/s (fully tucked). Centripetal acceleration at the extended free leg during a 5 rev/s scratch spin (limb radius 0.4 m): a = ω²r = (31.4)² × 0.4 ≈ 395 m/s² — approximately 40 g. The death drop combines an aerial jump with back sit spin entry, merging airborne rotation physics with on-ice angular momentum mechanics.',
      },
      {
        citation: 'Lockwood 2006 — Sports Biomech; Haguenauer 2006 — J Biomech',
        stat: '6 jump types',
        statLabel: 'Edge-defined takeoff classifications',
        detail: 'Figure skating blade geometry — 3–4 mm wide, hollow-ground (typically 5/16\" to 1\" hollow radius), with toe picks and 200 cm rocker — creates two edges per blade: inside (medial) and outside (lateral). Each jump type has a specific defining edge: Lutz — left back outside; Flip — left back inside; Loop — right back outside; Salchow — left back inside; Toe loop — right back outside (toe pick assist); Axel — left forward outside. Edge errors (landing on the wrong edge, e.g. "flutz" — Lutz entered on inside edge) receive a GOE deduction under IJS. Blade hollow depth directly affects performance: a deeper hollow (e.g. 1/4\") increases edge bite for jumps and spins but increases friction, costing glide speed in crossovers. Sharpening frequency: every 10–15 hours of ice time for figure skaters. Blade rocker (curvature) determines balance point — shifted toward the toe for jumpers, more neutral for ice dancers.',
      },
      {
        citation: 'Kestnbaum 2003 — Culture on Ice; ISU Communication 2353 — Judging System',
        stat: '±5 GOE',
        statLabel: 'Grade of Execution range per element',
        detail: 'The International Judging System (IJS), introduced in 2004, separates Technical Element Score (TES) from Program Components Score (PCS). Each jump has a base value (triple Axel: 8.00 pts; quad Lutz: 13.60 pts); Grade of Execution (GOE) modifies this across a ±5 scale — for a triple Axel, ±5 GOE = ±4.62 points. GOE criteria include: takeoff edge quality, height and distance, air position, landing balance, and flow from jump. Under-rotations exceeding ¼ revolution receive a "q" notation (30% base value reduction); edge errors receive an "e" annotation (GOE cap of −3). Short programs mandate specific elements: for men, one Axel, two jump combinations, a combination spin, step sequence, and a spin with a required position. Free skating allows compositional latitude but demands up to 12 jumping passes (men) or 7 (women). PCS judges five components: skating skills, transitions, performance, composition, and interpretation of music.',
      },
    ],
  },
  {
    id: 'speed-physics',
    number: '02',
    title: 'Speed Skating Physics & Physiology',
    accent: '#3b82f6',
    accentDim: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    icon: '⚡',
    findings: [
      {
        citation: 'de Boer 1987 — J Appl Biomech; Houdijk 2000 — Med Sci Sports Exerc',
        stat: '15 m/s',
        statLabel: 'Peak speed — 500m sprint',
        detail: 'Long-track speed skating on a 400m oval demands exceptional power-to-drag efficiency. The 500m world record of 33.61 s corresponds to an average speed of 14.9 m/s (53.7 km/h), with peak velocities reaching 15 m/s in the first straight. Biomechanical determinants: push angle is 80–90° to the direction of travel (lateral push), maximising propulsive force per stroke; elite 500m stride length reaches 7–8 m; stroke frequency: 1.8–2.2 Hz. The aerodynamic tuck position — back near-horizontal, arms tucked behind the body — reduces frontal area from ≈0.58 m² (upright) to ≈0.26 m², cutting aerodynamic drag coefficient from 0.58 to 0.26. At 14 m/s, drag force in tuck ≈85 N vs. upright ≈185 N, representing a difference worth several seconds over the 500m distance. The Thialf Arena in Heerenveen, Netherlands (indoor, sea level, temperature-controlled) has hosted the majority of world record performances due to optimal ice hardness and negligible altitude penalty.',
      },
      {
        citation: 'van Ingen Schenau 1987 — J Biomech; de Boer 1992 — Int J Sports Biomech (clap skate)',
        stat: '+15–17%',
        statLabel: 'Power increase with clap skate',
        detail: 'The clap skate revolution followed decades of research by Gerrit Jan van Ingen Schenau (1987 publication). The clap skate features a hinged blade at the toe, allowing the heel to rise while the toe remains in contact with ice — enabling complete ankle plantarflexion (30–40° range vs. 5–10° in traditional fixed blade). This adds the gastrocnemius and soleus as major contributors to each push stroke, increasing total push force 15–17% compared to fixed-blade skates where the ankle was effectively braced. The characteristic "clap" sound occurs when the spring-loaded hinge snaps the blade back to the boot heel at push-off completion. Introduced competitively at the 1998 Nagano Olympics, virtually all long-track speed skaters had transitioned to clap skates by 2000. CFD and force plate analyses confirm: longer push phase duration, greater peak impulse, and consistent advantage across all long-track distances from 500m through 10,000m.',
      },
      {
        citation: 'Snyder 1989 — Med Sci Sports Exerc; Rundell 1996 — Int J Sports Med (aerobic demands)',
        stat: '72–82 mL/kg/min',
        statLabel: 'VO₂max — 5000m/10000m specialists',
        detail: 'Long-distance speed skating is among the most aerobically demanding Olympic disciplines. Elite male 5,000m/10,000m specialists show VO₂max values of 72–82 mL/kg/min, comparable to elite cross-country skiers and rowers. The aerodynamic tuck position imposes ventilatory restriction by compressing the thorax — minute ventilation in tuck is ≈10–15% lower than upright cycling at matched power output, making respiratory efficiency a key performance limiter. Energy system contributions: 10,000m ≈95% aerobic; 5,000m ≈90% aerobic; 1,500m ≈70% aerobic/30% anaerobic; 1,000m ≈55% aerobic; 500m ≈80% anaerobic alactic/lactic. Dutch dominance in long-track speed skating reflects a deeply embedded national culture: natural ice skating traditions, purpose-built indoor ovals (Thialf, Alkmaar, Rotterdam), and structured national development programmes from age 8. The Dutch team has won the majority of Olympic long-track medals since the clap skate era began.',
      },
      {
        citation: 'Smith 2000 — J Sports Sci (short track tactics); ISU Short Track Rules 2023',
        stat: '20–30%',
        statLabel: 'Drag reduction from drafting (short track)',
        detail: 'Short track speed skating uses a 111.12 m oval with 4–6 skaters competing simultaneously around 8 m radius corners. Unlike long track, physical contact between skaters is permitted and strategic — shoulder-to-shoulder pack racing, drafting in single file, and positional blocking all occur within ISU rules. Drafting reduces aerodynamic drag by 20–30% for following skaters, making tactical positioning as important as raw speed; the lead skater does disproportionately more aerodynamic work. Corner lean angles reach 30–40° from vertical to maintain centripetal force on the tight 8 m radius. Disqualification criteria include: impeding an opponent with arms or hands, causing a fall through blocking, or overtaking inside the cones. Sprint events (500m, 1000m) favour explosive anaerobic power; the 1500m demands both anaerobic capacity and tactical intelligence. South Korea and China have dominated Olympic short track through precisely engineered technical coaching systems and year-round development infrastructure.',
      },
    ],
  },
  {
    id: 'joint-loading',
    number: '03',
    title: 'Joint Loading & Injury',
    accent: '#67e8f9',
    accentDim: 'rgba(103,232,249,0.08)',
    accentBorder: 'rgba(103,232,249,0.25)',
    icon: '🦴',
    findings: [
      {
        citation: 'Lockwood 2006 — Sports Biomech; Lipetz 2000 — Clin Sports Med (figure skating injury)',
        stat: '3–8× BW',
        statLabel: 'Single-leg landing impact',
        detail: 'Every triple jump in figure skating produces a single-leg landing impact of 3–8× body weight (210–560 kg force for a 70 kg skater), concentrated through the right leg at ice contact. Competitive skaters execute 100–200 jumps per on-ice session during heavy training phases, generating substantial cumulative joint loading. Primary injury sites: hip (femoroacetabular impingement from turned-out landing position), knee (patellar tendinopathy from repetitive eccentric quadriceps loading), ankle (posterior impingement from plantarflexion at contact), and tibial shaft (cyclical impact stress fractures). Knee flexion angle at landing is the most important modifiable technical variable: angles >90° at ice contact reduce peak ground reaction force by 30–40% through eccentric muscle absorption across ankle, knee, and hip extensors. Technique coaching focused on landing mechanics — avoiding knee valgus collapse, maintaining upright trunk — is a cornerstone of injury prevention curricula at elite skating academies.',
      },
      {
        citation: 'Dubravcic-Simunjak 2003 — Am J Sports Med; Torstveit 2005 (female athlete triad)',
        stat: '20–25%',
        statLabel: 'Elite figure skaters with stress fractures',
        detail: 'Tibial and metatarsal stress fractures affect approximately 20–25% of competitive figure skaters, driven by high jump training volume, repetitive eccentric impact, and — critically — low bone mineral density (BMD) concerns linked to the Female Athlete Triad. Figure skating\'s aesthetic judging standards create body composition pressure that can drive low energy availability (LEA), menstrual dysfunction, and impaired bone remodelling. LEA below 30 kcal/kg fat-free mass/day suppresses oestrogen, directly reducing osteoblast activity and increasing bone stress injury risk. Prevention strategies: optimise calcium (1,000–1,500 mg/day) and vitamin D (target serum 25(OH)D >40 ng/mL); implement structured jump volume periodisation and load management; use DEXA-based BMD monitoring; embed registered dietitian-led nutrition education within academy programmes. Male figure skaters also show elevated stress fracture risk, primarily tibial shaft, from the same landing load repetition mechanism.',
      },
      {
        citation: 'Haguenauer 2006 — J Biomech; Denny 2008 — Int J Sports Sci Coach (blade physics)',
        stat: '1.1 mm',
        statLabel: 'Long-track speed skating blade width',
        detail: 'Ice skate blade specifications diverge dramatically by discipline. Figure skating blade: 3–4 mm wide, hollow-ground with prominent toe picks, 200 cm rocker radius, 28–30 cm total length. Long-track speed skating blade: 1.0–1.2 mm wide, completely flat (no hollow grind), 380–450 mm long — up to 16× longer than figure skating blades, providing exceptional glide efficiency and lateral stability. Short track blades: 1.2 mm wide, offset to the inside (allowing deeper lean angles in corners), 375–400 mm length. Ice hockey blades: 3 mm wide, moderate hollow (7/8\" typical), shorter profile optimised for quick directional changes. Blade sharpening frequency: figure skaters every 10–15 hours; speed skaters every 15–20 hours (flat grind is less susceptible to dullness). Hollow depth profoundly affects performance trade-off: deeper hollow (smaller radius) = more edge bite for jumps/spins; shallower hollow = lower friction, faster glide for stroking.',
      },
      {
        citation: 'Nihal 2005 — Foot Ankle Int (os trigonum); Ferkel 2010 — Clin Sports Med',
        stat: '15–20%',
        statLabel: 'Elite figure skaters with ankle impingement',
        detail: 'Posterior ankle impingement — os trigonum syndrome or "figure skater\'s ankle" — results from repetitive extreme plantarflexion compressing the posterior talus between the tibia and calcaneus. The os trigonum, an accessory ossicle present in 10–25% of the population, becomes symptomatic in figure skaters from repetitive posterior compression during jump landings (ankle plantarflexed at ice contact), layback positions, and Ina Bauer spirals. Approximately 15–20% of elite figure skaters experience clinically significant posterior ankle impingement during their careers. Synovial inflammation, posterior ankle pain on plantarflexion, and — in chronic cases — stress fracture at the posterior talocalcaneal interface characterise the syndrome. Boot stiffness is a key modifiable risk factor: strategic lace tension adjustment and custom moulding can redistribute pressure. Conservative management: activity modification, ultrasound-guided corticosteroid injection; arthroscopic os trigonum removal in refractory cases, with return-to-skating typically 8–12 weeks post-procedure.',
      },
    ],
  },
  {
    id: 'training-science',
    number: '04',
    title: 'Training Science & Artistic Performance',
    accent: '#a855f7',
    accentDim: 'rgba(168,85,247,0.10)',
    accentBorder: 'rgba(168,85,247,0.28)',
    icon: '🎭',
    findings: [
      {
        citation: 'Smith 2003 — Int J Sports Physiol Perform; Fry 2005 — figure skating training demands',
        stat: '1,200–1,500 h/year',
        statLabel: 'On-ice training hours at Olympic level',
        detail: 'Olympic-calibre figure skaters accumulate 1,200–1,500 on-ice hours per year, representing 4–6 hours of daily ice time across 300+ training days. Off-ice training adds 2–3 hours daily: jump harness work (allowing 3× more jump repetitions at reduced injury risk), ballet and contemporary dance (artistry and body awareness), strength and conditioning (Olympic lifting derivatives, plyometrics, single-leg stability work), and off-ice spin platform training. The highest-risk developmental window is the transition to triple jumps, typically occurring at ages 12–16 in girls and 14–18 in boys — when jump training volume spikes before neuromuscular maturity for landing demands is fully established. This window shows the highest incidence of tibial stress fractures and knee overuse injuries. Annual periodisation: on-season competition phase (September–April) emphasises element consistency and programme polish; off-season (May–August) prioritises new element development, technical refinement, and physical conditioning base-building.',
      },
      {
        citation: 'Henschen 1994 — Int J Sport Psychol; Gardner 2007 — The Sport Psychologist (ACT in skating)',
        stat: 'Dual demand',
        statLabel: 'Physical-artistic performance integration',
        detail: 'Figure skating is unique among Olympic sports in requiring simultaneous extreme physical difficulty and subjectively judged artistic performance — athletes must execute near-limit biomechanical skills (quad jumps, 5+ rev/s spins) while projecting musicality, emotional expression, and aesthetic grace under judging scrutiny. This dual demand creates distinctive psychological challenges: performance anxiety disrupts the fine motor control required for consistent jump landings; awareness of being judged aesthetically amplifies pre-competitive pressure and can contribute to body image concerns. Parallels with artistic gymnastics are strong — both impose appearance standards, involve subjective judging panels, and require young athletes to master skills at the intersection of athletics and artistry. Evidence-based psychological interventions used in elite skating: sport psychologist-guided attentional focus training (pre-jump routine standardisation), imagery rehearsal (complete mental programme run-throughs), self-talk protocols, and acceptance and commitment therapy (ACT) approaches for managing judging anxiety. Formal mental performance training is increasingly embedded in elite skating academies as a compulsory programme component.',
      },
      {
        citation: 'Rundell 1996 — Int J Sports Med; van Ingen Schenau 1990 — Int J Sports Med (periodisation)',
        stat: 'May → March',
        statLabel: 'Annual training cycle structure',
        detail: 'Elite long-track speed skaters follow a structured annual periodisation cycle closely mirroring cross-country skiing and cycling preparation models. May–September (general preparation): extensive aerobic endurance development via road cycling, track cycling, and in-line skating on 400m ovals — the latter almost perfectly replicating clap-skate push mechanics. Running supplements aerobic capacity but lacks sport-specificity for the deep tuck posture. October–November (on-ice general preparation): transition to ice, rebuild on-ice technical precision, develop basic ice endurance. December–March (competition phase): race-specific interval training with periodised intensity distribution; 500m/1000m specialists emphasise phosphocreatine and lactate power development; 5,000m/10,000m specialists focus on lactate threshold intervals and maximal aerobic training blocks. Heart rate monitoring in tuck position underestimates relative exercise intensity by 5–10 bpm compared to upright exercise (thoracic compression reduces cardiac stroke volume) — power-based monitoring via force-instrumented clap skates is increasingly adopted at elite level.',
      },
      {
        citation: 'Rundell 1994 — Med Sci Sports Exerc (team pursuit aerodynamics); CFD analysis — Dutch Olympic team',
        stat: '25–30%',
        statLabel: 'Lead-skater energy cost premium (team pursuit)',
        detail: 'The speed skating team pursuit (3 skaters × 8 laps, 3,200m women / 4,000m men) has the finish time determined by the third skater crossing the line. Aerodynamic drafting provides a quantifiable advantage: CFD modelling of 3-skater formations shows the lead skater expends 25–30% more aerodynamic power than the 2nd-position skater, who in turn expends approximately 10% more than the 3rd. The standard rotation strategy has the lead skater peel off to the back of the formation every 1–2 laps, equalising cumulative fatigue across all three athletes across the race. Optimal inter-skater spacing: 0.3–0.5 m gap maximises drafting benefit while keeping collision risk manageable. Formation geometry on corners: the trailing skater must lean further to follow the slightly tighter inside line at the same speed — requiring greater centripetal force generation. Elite national teams (Netherlands, Norway, Japan) apply wind tunnel testing (often using facilities shared with professional cycling teams) and CFD modelling to optimise formation positioning and rotation timing strategies. World record team pursuit performances require sub-26 s individual laps — sustaining >15 m/s average for the full distance.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '5–6 rev/s', label: 'Spin Rotation Rate',      sub: 'Scratch spin — angular momentum conservation', color: '#67e8f9' },
  { value: '3–8× BW',   label: 'Jump Landing Force',      sub: 'Single-leg GRF at triple jump landing', color: '#a5f3fc' },
  { value: '82 mL/kg/min', label: 'Speed Skater VO₂max', sub: '10,000m specialists — Dutch long-track elite', color: '#3b82f6' },
  { value: '0.65 s',    label: 'Triple Axel Air Time',     sub: '3.5 rotations at 5–6 rev/s rotation rate', color: '#a855f7' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function IceSkatingsSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --ice-dark: #020b18;
          --ice-crystal: #67e8f9;
          --ice-navy: #1e3a5f;
          --ice-silver: #cbd5e1;
          --ice-glow: #a5f3fc;
          --ice-surface: #071525;
          --ice-surface-2: #0c1e34;
          --ice-border: #1a3050;
          --ice-silver-dim: #64748b;
          --ice-silver-faint: #0f2040;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ice-root {
          min-height: 100vh;
          background-color: var(--ice-dark);
          color: #f0f9ff;
          font-family: 'Josefin Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle ice grain overlay */
        .ice-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Crystal cyan ambient glow */
        .ice-root::after {
          content: '';
          position: fixed;
          top: -20vh;
          left: -10vw;
          width: 120vw;
          height: 70vh;
          background: radial-gradient(ellipse at 50% 0%, rgba(103,232,249,0.08) 0%, rgba(165,243,252,0.03) 40%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .ice-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(2,11,24,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--ice-border);
          padding: 12px 24px;
        }

        .ice-header-inner {
          max-width: 920px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ice-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--ice-border);
          background: var(--ice-surface);
          color: var(--ice-silver-dim);
          text-decoration: none;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .ice-back-btn:hover {
          border-color: var(--ice-crystal);
          color: var(--ice-glow);
          background: rgba(103,232,249,0.08);
        }

        .ice-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ice-glow);
        }

        .ice-header-title {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: #f0f9ff;
        }

        /* Main */
        .ice-main {
          position: relative;
          z-index: 2;
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Hero */
        .ice-hero {
          position: relative;
          padding: 64px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .ice-hero-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 420px;
          background: radial-gradient(ellipse at 50% 0%, rgba(103,232,249,0.16) 0%, rgba(165,243,252,0.06) 40%, transparent 70%);
          pointer-events: none;
        }

        .ice-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ice-glow);
          background: rgba(165,243,252,0.07);
          border: 1px solid rgba(165,243,252,0.22);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .ice-hero-h1 {
          font-family: 'Josefin Sans', sans-serif;
          font-size: clamp(52px, 12vw, 110px);
          font-weight: 700;
          line-height: 0.92;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 0 80px rgba(103,232,249,0.25);
        }

        .ice-hero-h1 .accent {
          display: block;
          color: var(--ice-crystal);
          text-shadow: 0 0 60px rgba(103,232,249,0.55);
        }

        .ice-hero-sub {
          font-family: 'Josefin Sans', sans-serif;
          font-size: clamp(13px, 2.1vw, 16px);
          font-weight: 300;
          letter-spacing: 0.08em;
          color: var(--ice-silver);
          margin: 20px auto 36px;
          max-width: 520px;
          line-height: 1.6;
        }

        /* Hero SVG */
        .ice-hero-svg {
          width: 100%;
          max-width: 560px;
          margin: 0 auto 36px;
          display: block;
          opacity: 0.80;
        }

        /* Hero stats */
        .ice-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
        }

        .ice-hero-stat { text-align: center; }

        .ice-hero-stat-num {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 40px;
          font-weight: 700;
          line-height: 1;
          color: var(--ice-crystal);
        }

        .ice-hero-stat-num .unit {
          font-size: 17px;
          color: var(--ice-silver-dim);
          margin-left: 2px;
        }

        .ice-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ice-silver-dim);
          margin-top: 4px;
        }

        .ice-hero-divider {
          width: 1px;
          height: 40px;
          background: var(--ice-border);
        }

        /* Key stats grid */
        .ice-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) {
          .ice-key-stats { grid-template-columns: repeat(4, 1fr); }
        }

        .ice-stat-card {
          background: var(--ice-surface);
          border: 1px solid var(--ice-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .ice-stat-val {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
          letter-spacing: 0.03em;
        }

        .ice-stat-label {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ice-silver-dim);
          margin-bottom: 4px;
        }

        .ice-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--ice-silver-faint);
          letter-spacing: 0.04em;
          line-height: 1.4;
        }

        .ice-stat-card-glow {
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          opacity: 0.08;
          pointer-events: none;
        }

        /* Chart */
        .ice-chart {
          background: var(--ice-surface);
          border: 1px solid var(--ice-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .ice-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ice-crystal);
          margin-bottom: 6px;
        }

        .ice-chart-sub {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: var(--ice-silver-dim);
          margin-bottom: 28px;
          letter-spacing: 0.04em;
        }

        /* Horizontal bar chart */
        .ice-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ice-chart-row {
          display: grid;
          grid-template-columns: 72px 1fr 60px;
          align-items: center;
          gap: 12px;
        }

        .ice-chart-dist {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: var(--ice-crystal);
          text-align: right;
        }

        .ice-chart-bar-track {
          background: var(--ice-silver-faint);
          height: 20px;
          position: relative;
          overflow: hidden;
        }

        .ice-chart-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(103,232,249,0.60) 0%, rgba(103,232,249,0.90) 100%);
          position: relative;
          display: flex;
          align-items: center;
          padding-left: 8px;
        }

        .ice-chart-bar-time {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          color: rgba(2,11,24,0.9);
          white-space: nowrap;
        }

        .ice-chart-speed {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: var(--ice-silver);
          text-align: right;
          white-space: nowrap;
        }

        .ice-chart-axis-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ice-silver-dim);
          margin-top: 12px;
          text-align: right;
        }

        /* Science cards */
        .ice-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--ice-crystal);
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--ice-border);
        }

        .ice-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 60px;
        }

        .ice-card {
          border: 1px solid var(--ice-border);
          background: var(--ice-surface);
          overflow: hidden;
        }

        .ice-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px 16px;
          border-bottom: 1px solid var(--ice-border);
        }

        .ice-card-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: var(--ice-silver-dim);
          letter-spacing: 0.10em;
          flex-shrink: 0;
        }

        .ice-card-icon {
          font-size: 20px;
          flex-shrink: 0;
          line-height: 1;
        }

        .ice-card-title {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .ice-card-body {
          padding: 0;
        }

        .ice-finding {
          padding: 18px 20px;
          border-bottom: 1px solid var(--ice-border);
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 16px;
          align-items: start;
        }

        .ice-finding:last-child { border-bottom: none; }

        @media (max-width: 600px) {
          .ice-finding { grid-template-columns: 1fr; gap: 8px; }
        }

        .ice-finding-stat-col {
          text-align: right;
          padding-right: 16px;
          border-right: 1px solid var(--ice-border);
          padding-top: 2px;
        }

        @media (max-width: 600px) {
          .ice-finding-stat-col { text-align: left; padding-right: 0; border-right: none; border-bottom: 1px solid var(--ice-border); padding-bottom: 8px; }
        }

        .ice-finding-stat-val {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 3px;
        }

        .ice-finding-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--ice-silver-dim);
          line-height: 1.3;
        }

        .ice-finding-content {}

        .ice-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--ice-silver-dim);
          margin-bottom: 6px;
          opacity: 0.7;
        }

        .ice-finding-detail {
          font-family: 'Josefin Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          color: var(--ice-silver);
          letter-spacing: 0.02em;
        }

        /* Footer */
        .ice-footer {
          border-top: 1px solid var(--ice-border);
          padding: 28px 24px;
          text-align: center;
        }

        .ice-footer-inner {
          max-width: 920px;
          margin: 0 auto;
        }

        .ice-footer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ice-silver-dim);
        }
      `}} />

      <div className="ice-root">

        {/* Header */}
        <header className="ice-header">
          <div className="ice-header-inner">
            <Link href="/" className="ice-back-btn" aria-label="Back">
              <ArrowLeft size={15} />
            </Link>
            <div>
              <div className="ice-header-label">KQuarks Science</div>
              <div className="ice-header-title">Ice Skating Science</div>
            </div>
          </div>
        </header>

        <main className="ice-main">

          {/* Hero */}
          <section className="ice-hero">
            <div className="ice-hero-glow" />
            <div className="ice-hero-tag">Sport Science — Figure Skating &amp; Speed Skating</div>

            <h1 className="ice-hero-h1">
              Ice
              <span className="accent">Skating</span>
            </h1>

            <p className="ice-hero-sub">
              Biomechanics of triple Axels and scratch spins. Physics of clap skates and aerodynamic tucks.
              Joint loading, injury prevention, and the science of winter&#39;s most elegant sport.
            </p>

            {/* Figure skater arabesque / speed skater SVG */}
            <svg
              className="ice-hero-svg"
              viewBox="0 0 560 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Ice surface */}
              <line x1="0" y1="230" x2="560" y2="230" stroke="rgba(103,232,249,0.20)" strokeWidth="1" />

              {/* Ice sparkle marks on surface */}
              {[40, 120, 200, 280, 360, 440, 520].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1="230" x2={x + 6} y2="226" stroke="rgba(165,243,252,0.35)" strokeWidth="0.8" />
                  <line x1={x + 3} y1="228" x2={x + 3} y2="222" stroke="rgba(165,243,252,0.25)" strokeWidth="0.8" />
                </g>
              ))}

              {/* === FIGURE SKATER — arabesque/spiral position (left side) === */}
              {/* Standing leg (right) */}
              <line x1="140" y1="230" x2="148" y2="185" stroke="rgba(103,232,249,0.75)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Body torso leaning forward */}
              <line x1="148" y1="185" x2="130" y2="155" stroke="rgba(103,232,249,0.75)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Extended back leg raised (arabesque) */}
              <line x1="148" y1="185" x2="185" y2="160" stroke="rgba(103,232,249,0.70)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Extended back foot / blade */}
              <line x1="185" y1="160" x2="198" y2="155" stroke="rgba(103,232,249,0.60)" strokeWidth="1.5" strokeLinecap="round" />
              {/* Arms extended forward */}
              <line x1="130" y1="155" x2="105" y2="148" stroke="rgba(103,232,249,0.65)" strokeWidth="2" strokeLinecap="round" />
              <line x1="130" y1="155" x2="108" y2="168" stroke="rgba(103,232,249,0.55)" strokeWidth="2" strokeLinecap="round" />
              {/* Head */}
              <circle cx="126" cy="145" r="9" fill="none" stroke="rgba(103,232,249,0.70)" strokeWidth="1.8" />
              {/* Skate blade on ice */}
              <line x1="132" y1="230" x2="150" y2="230" stroke="rgba(165,243,252,0.90)" strokeWidth="2" strokeLinecap="round" />

              {/* Ice spray sparkles from skate */}
              <circle cx="138" cy="228" r="1.5" fill="rgba(165,243,252,0.70)" />
              <circle cx="145" cy="225" r="1" fill="rgba(165,243,252,0.50)" />
              <circle cx="152" cy="227" r="1.2" fill="rgba(165,243,252,0.40)" />
              <circle cx="130" cy="224" r="0.8" fill="rgba(165,243,252,0.60)" />

              {/* Rotation arc (spin indication) */}
              <path d="M 115 155 A 20 20 0 0 1 135 140" stroke="rgba(103,232,249,0.35)" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />
              <path d="M 135 140 A 20 20 0 0 1 150 155" stroke="rgba(103,232,249,0.35)" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />

              {/* === SPEED SKATER — aerodynamic tuck (right side) === */}
              {/* Torso near-horizontal */}
              <line x1="340" y1="190" x2="410" y2="182" stroke="rgba(59,130,246,0.80)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Lead leg bent */}
              <line x1="340" y1="190" x2="332" y2="215" stroke="rgba(59,130,246,0.75)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="332" y1="215" x2="340" y2="230" stroke="rgba(59,130,246,0.75)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Push leg extending laterally */}
              <line x1="340" y1="190" x2="360" y2="218" stroke="rgba(59,130,246,0.70)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="360" y1="218" x2="375" y2="230" stroke="rgba(59,130,246,0.70)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Arms tucked behind back */}
              <line x1="410" y1="182" x2="395" y2="178" stroke="rgba(59,130,246,0.65)" strokeWidth="2" strokeLinecap="round" />
              <line x1="395" y1="178" x2="378" y2="185" stroke="rgba(59,130,246,0.65)" strokeWidth="2" strokeLinecap="round" />
              {/* Head forward */}
              <circle cx="418" cy="183" r="9" fill="none" stroke="rgba(59,130,246,0.75)" strokeWidth="1.8" />
              {/* Long speed skate blades */}
              <line x1="322" y1="230" x2="358" y2="230" stroke="rgba(165,243,252,0.90)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="360" y1="230" x2="395" y2="230" stroke="rgba(165,243,252,0.80)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Speed lines */}
              <line x1="310" y1="195" x2="290" y2="195" stroke="rgba(59,130,246,0.30)" strokeWidth="1" strokeLinecap="round" />
              <line x1="315" y1="202" x2="292" y2="202" stroke="rgba(59,130,246,0.22)" strokeWidth="1" strokeLinecap="round" />
              <line x1="308" y1="209" x2="289" y2="209" stroke="rgba(59,130,246,0.18)" strokeWidth="1" strokeLinecap="round" />

              {/* Ice spray from lead skate */}
              <circle cx="328" cy="228" r="1.5" fill="rgba(165,243,252,0.70)" />
              <circle cx="322" cy="225" r="1" fill="rgba(165,243,252,0.50)" />
              <circle cx="335" cy="226" r="1.2" fill="rgba(165,243,252,0.40)" />

              {/* === Ice crystal sparkle decorations === */}
              {/* Crystal 1 — top left area */}
              <g transform="translate(60, 80)">
                <line x1="0" y1="-8" x2="0" y2="8" stroke="rgba(165,243,252,0.45)" strokeWidth="1" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="rgba(165,243,252,0.45)" strokeWidth="1" />
                <line x1="-5.6" y1="-5.6" x2="5.6" y2="5.6" stroke="rgba(165,243,252,0.30)" strokeWidth="0.8" />
                <line x1="5.6" y1="-5.6" x2="-5.6" y2="5.6" stroke="rgba(165,243,252,0.30)" strokeWidth="0.8" />
              </g>
              {/* Crystal 2 — top right */}
              <g transform="translate(490, 70)">
                <line x1="0" y1="-10" x2="0" y2="10" stroke="rgba(103,232,249,0.40)" strokeWidth="1" />
                <line x1="-10" y1="0" x2="10" y2="0" stroke="rgba(103,232,249,0.40)" strokeWidth="1" />
                <line x1="-7" y1="-7" x2="7" y2="7" stroke="rgba(103,232,249,0.25)" strokeWidth="0.8" />
                <line x1="7" y1="-7" x2="-7" y2="7" stroke="rgba(103,232,249,0.25)" strokeWidth="0.8" />
              </g>
              {/* Crystal 3 — mid */}
              <g transform="translate(260, 40)">
                <line x1="0" y1="-6" x2="0" y2="6" stroke="rgba(165,243,252,0.35)" strokeWidth="0.9" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="rgba(165,243,252,0.35)" strokeWidth="0.9" />
                <line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2" stroke="rgba(165,243,252,0.22)" strokeWidth="0.7" />
                <line x1="4.2" y1="-4.2" x2="-4.2" y2="4.2" stroke="rgba(165,243,252,0.22)" strokeWidth="0.7" />
              </g>

              {/* VS divider line between the two skaters */}
              <line x1="240" y1="130" x2="240" y2="235" stroke="rgba(165,243,252,0.12)" strokeWidth="1" strokeDasharray="4 3" />
              <text x="240" y="120" textAnchor="middle" fill="rgba(165,243,252,0.30)" fontSize="9" fontFamily="monospace" letterSpacing="2">VS</text>
            </svg>

            <div className="ice-hero-stats">
              <div className="ice-hero-stat">
                <div className="ice-hero-stat-num">3.5 <span className="unit">rev</span></div>
                <div className="ice-hero-stat-label">Triple Axel</div>
              </div>
              <div className="ice-hero-divider" />
              <div className="ice-hero-stat">
                <div className="ice-hero-stat-num">15 <span className="unit">m/s</span></div>
                <div className="ice-hero-stat-label">Peak Speed</div>
              </div>
              <div className="ice-hero-divider" />
              <div className="ice-hero-stat">
                <div className="ice-hero-stat-num">+17 <span className="unit">%</span></div>
                <div className="ice-hero-stat-label">Clap Skate</div>
              </div>
              <div className="ice-hero-divider" />
              <div className="ice-hero-stat">
                <div className="ice-hero-stat-num">8 <span className="unit">× BW</span></div>
                <div className="ice-hero-stat-label">Jump Impact</div>
              </div>
            </div>
          </section>

          {/* Key stats grid */}
          <div className="ice-key-stats">
            {KEY_STATS.map((stat) => (
              <div key={stat.label} className="ice-stat-card">
                <div className="ice-stat-val" style={{ color: stat.color }}>{stat.value}</div>
                <div className="ice-stat-label">{stat.label}</div>
                <div className="ice-stat-sub">{stat.sub}</div>
                <div
                  className="ice-stat-card-glow"
                  style={{ background: stat.color }}
                />
              </div>
            ))}
          </div>

          {/* Chart — Speed Skating World Records */}
          <div className="ice-chart">
            <div className="ice-chart-title">Speed Skating World Records by Distance</div>
            <div className="ice-chart-sub">Average speed (m/s) derived from current long-track world record times</div>
            <div className="ice-chart-rows">
              {SPEED_RECORDS.map((rec) => (
                <div key={rec.distance} className="ice-chart-row">
                  <div className="ice-chart-dist">{rec.distance}</div>
                  <div className="ice-chart-bar-track">
                    <div
                      className="ice-chart-bar-fill"
                      style={{ width: `${rec.barW}%` }}
                    >
                      <span className="ice-chart-bar-time">{rec.time}</span>
                    </div>
                  </div>
                  <div className="ice-chart-speed">{rec.speed} m/s</div>
                </div>
              ))}
            </div>
            <div className="ice-chart-axis-label">Average speed (m/s) — current ISU world records, long-track</div>
          </div>

          {/* Science cards */}
          <div className="ice-section-label">Evidence-Based Science — 4 Domains</div>
          <div className="ice-cards">
            {SCIENCE_CARDS.map((card) => (
              <div key={card.id} className="ice-card" style={{ borderColor: card.accentBorder }}>
                <div
                  className="ice-card-header"
                  style={{ background: card.accentDim, borderColor: card.accentBorder }}
                >
                  <span className="ice-card-num">{card.number}</span>
                  <span className="ice-card-icon">{card.icon}</span>
                  <h2
                    className="ice-card-title"
                    style={{ color: card.accent }}
                  >
                    {card.title}
                  </h2>
                </div>
                <div className="ice-card-body">
                  {card.findings.map((finding, fi) => (
                    <div key={fi} className="ice-finding">
                      <div className="ice-finding-stat-col">
                        <div className="ice-finding-stat-val" style={{ color: card.accent }}>{finding.stat}</div>
                        <div className="ice-finding-stat-label">{finding.statLabel}</div>
                      </div>
                      <div className="ice-finding-content">
                        <div className="ice-finding-citation">{finding.citation}</div>
                        <p className="ice-finding-detail">{finding.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </main>

        <footer className="ice-footer">
          <div className="ice-footer-inner">
            <div className="ice-footer-text">KQuarks &mdash; Ice Skating Science &mdash; Figure Skating &amp; Speed Skating Physiology</div>
          </div>
        </footer>

      </div>
    </>
  )
}
