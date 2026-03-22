// Australian Football (AFL) Science — static server component
// Evidence-based AFL physiology covering running demands, kick biomechanics,
// injury epidemiology, and position-specific physical development.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Australian Football Science' }

// ─── Distance by Position ─────────────────────────────────────────────────────

const POSITION_DISTANCE = [
  { pos: 'Midfielder', dist: 17, display: '17 km', color: '#e63946', barPct: 100, desc: 'Highest; 72 direction changes/km' },
  { pos: 'Wing', dist: 15, display: '15 km', color: '#f4722b', barPct: 88, desc: 'High-running transitional role' },
  { pos: 'Defender', dist: 13, display: '13 km', color: '#f9a23a', barPct: 76, desc: 'Zone-based, reactive running' },
  { pos: 'Forward', dist: 11, display: '11 km', color: '#ffd166', barPct: 65, desc: 'Lead running + contested marking' },
  { pos: 'Ruckman', dist: 12.5, display: '12.5 km', color: '#a8dadc', barPct: 73, desc: 'Unique aerial contest demands' },
]

// ─── Draft Combine Benchmarks ─────────────────────────────────────────────────

const COMBINE_BENCHMARKS = [
  { test: '20 m Sprint', elite: '< 3.00 s', color: '#e63946' },
  { test: 'Vertical Jump', elite: '> 75 cm', color: '#f4722b' },
  { test: '2-km Time Trial', elite: '< 6:15 min', color: '#f9a23a' },
  { test: '5-0-5 Agility', elite: '< 2.65 s', color: '#ffd166' },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'demands',
    number: '01',
    title: "The World's Most Demanding Team Sport",
    accent: '#e63946',
    icon: '🏉',
    findings: [
      {
        citation: 'Coutts 2010 — Int J Sports Physiol Perform',
        stat: '16–18 km',
        statLabel: 'Midfielder distance per game',
        detail: 'GPS analysis of 22 AFL players across an entire home-and-away season found midfielders cover 16–18 km per game and perform 72 direction changes greater than 45° per kilometre — the highest multidirectional demand of any team field sport. Defenders average 12–14 km; forwards 10–13 km; ruckmen 11–14 km depending on individual ruck rotation schemes. Total physical effort exceeds 100 minutes across 4 × 20-minute quarters (plus time-on from stoppages), making AFL the longest continuous team sport in terms of absolute running distance per player per match.',
      },
      {
        citation: 'Gastin 2013 — Int J Sports Physiol Perform',
        stat: '88–90%',
        statLabel: 'Aerobic energy contribution',
        detail: 'Energy expenditure analysis using GPS-derived velocity data found AFL is 88–90% aerobic by total energy contribution — the highest aerobic proportion of any field team sport, marginally exceeding soccer (88–90%) and substantially exceeding rugby union (75–85%) and basketball (80%). Elite AFL VO₂max benchmarks: 55–65 mL/kg/min for senior list players. Pre-season fitness testing standards: 2-km time trial <6:30 for midfielders, or Yo-Yo IR2 level 18+ (equivalent to ~60 mL/kg/min VO₂max). Players below standard face delisting risk.',
      },
      {
        citation: 'Johnston 2012 — J Strength Cond Res',
        stat: '60–80',
        statLabel: 'High-speed efforts per game',
        detail: 'AFL players complete 60–80 high-speed running efforts (>5.5 m/s) and 20–30 sprints (>7 m/s) per game. Individual sprint duration: 2–4 seconds. Recovery between sprint efforts is frequently only 3–8 seconds of continued moderate-high intensity running — creating extreme aerobic-anaerobic interplay that requires simultaneous development of both systems. Central midfielders face the highest sprint frequency; their training programmes must balance high VO₂max (for aerobic recovery) with maximum sprint velocity (for contest-winning acceleration).',
      },
      {
        citation: 'Ball 2008 — J Sports Sci',
        stat: '70–90 cm',
        statLabel: 'Vertical jump for contested marking',
        detail: 'Contested aerial marking in AFL requires peak vertical jump heights of 70–90 cm for senior players competing against opponents. Hip extension velocity and dorsiflexion strength in the gather (approach to jump) predict mark success more accurately than isolated vertical jump height. During ruck contests, collision forces of 300–400 N are recorded at peak aerial impact. Elite contested mark percentage for senior players: 45–55%, reflecting the near-equal outcomes in high-quality aerial contests despite individual physical advantages.',
      },
    ],
  },
  {
    id: 'biomechanics',
    number: '02',
    title: 'Kick Biomechanics & Ball Skills',
    accent: '#f4722b',
    icon: '⚽',
    findings: [
      {
        citation: 'Ball 2008 — J Sports Sci',
        stat: '570–620°/s',
        statLabel: 'Punt kick hip rotation velocity',
        detail: 'The AFL drop punt — the primary kicking technique in Australian football — generates hip internal rotation angular velocity of 570–620°/s, placing it among the fastest rotational movements in sport alongside baseball pitching and elite tennis serves. The approach is 3–5 steps; ball-foot contact duration is 5–8 milliseconds. Ball exit velocity in elite senior players: 25–30 m/s (90–108 km/h). Kicking accuracy under match pressure: 85% within 30 m, declining to 62% at 50 m — distance accuracy represents the dominant performance discriminator between VFL/state-level and AFL-standard kickers.',
      },
      {
        citation: 'Peacock 2017 — J Sports Sci',
        stat: '900–1,200°/s',
        statLabel: 'Shank angular velocity at foot contact',
        detail: 'Optimal drop punt mechanics follow a strict proximal-to-distal segmental sequencing: pelvis rotates first (approximately 50° of hip internal rotation), followed by hip flexion, knee extension, and ankle plantarflexion — each segment accelerates in sequence to transfer momentum distally. Shank angular velocity at ball contact for elite kicks: 900–1,200°/s, measured by inertial measurement units (IMU) worn at the shin. Disruption of sequencing — particularly early knee extension before peak hip flexion — reduces ball velocity 8–15% and dramatically reduces accuracy under fatigue.',
      },
      {
        citation: 'Wheeler 2011 — Int J Sports Sci Coaching',
        stat: '80–120 km/h',
        statLabel: 'Elite handball velocity',
        detail: 'The AFL handball — a unique ball-delivery technique using a fist strike — achieves exit velocities of 80–120 km/h (22–33 m/s) in elite players. Dominant-hand advantage over non-dominant hand: 15–25 km/h for elite players. Handball accuracy under defensive pressure declines 30–40% versus uncontested delivery. Systematic non-dominant hand handball training — incorporated in junior pathways since 2010 — reduces differential and builds game adaptability, particularly critical in congested inside-50 situations where dominant-side trapping is common.',
      },
      {
        citation: 'Robertson 2019 — J Sports Sci',
        stat: '±50 ms',
        statLabel: 'Timing window for optimal marking',
        detail: 'Marking performance is predicted by three independent factors of near-equal weighting: (1) vertical jump height, (2) timing accuracy within ±50 ms of the theoretically optimal jump moment, and (3) shoulder and arm position for aerial contact. Contested marking under defensive pressure: 40–60% of attempts result in conceding possession. High-performance marking training emphasises jump timing and shoulder stabilisation rather than jump height alone, as timing precision is more trainable in elite athletes who have already optimised their jumping strength.',
      },
    ],
  },
  {
    id: 'injury',
    number: '03',
    title: 'Injury Epidemiology & Prevention',
    accent: '#2a9d8f',
    icon: '🩺',
    findings: [
      {
        citation: 'Orchard 2013 — Br J Sports Med',
        stat: '7.4/club',
        statLabel: 'Hamstring injuries per season',
        detail: 'The 25-year AFL injury registry (Orchard et al., the most comprehensive sport injury dataset in any code globally) established hamstring strain as the most common AFL injury at 7.4 per club per season, causing 32–40 missed game-equivalents per club annually. Primary risk factors: prior hamstring injury (3× increased re-injury risk), age ≥30 years, wet ground conditions, and high pre-season sprint volume accumulation. The Nordic hamstring curl (eccentric knee flexion exercise) reduces hamstring injury incidence 51% in RCT-level evidence (Petersen 2011) — now mandated in AFL club injury prevention protocols.',
      },
      {
        citation: 'Waldén 2011 (adapted for AFL) + AFL data',
        stat: '2–3/club',
        statLabel: 'ACL tears per season',
        detail: 'AFL clubs average 2–3 ACL ruptures per season per club. Return-to-play: 10–12 months (surgical reconstruction + rehabilitation). Re-injury rate in the first season back: 20–25%. Preventive interventions: FIFA 11+ adapted for AFL (land mechanics, hip abductor activation, Nordic curl, single-leg balance drills) reduces ACL incidence 30–50% in prospective trials. Female AFL (AFLW) ACL rates are approximately 3× higher per 1,000 hours than AFL men, consistent with females\' higher ACL risk across all field sports.',
      },
      {
        citation: 'Makdissi 2016 — Br J Sports Med',
        stat: '60–70',
        statLabel: 'Concussions per season (league-wide)',
        detail: 'AFL reports approximately 60–70 clinically diagnosed concussions per season league-wide (18 clubs × ~38 players on extended lists). AFL concussion return-to-play protocol since 2021: minimum 12 days following complete symptom resolution, with mandatory independent medical officer sign-off. Sub-concussive exposure per player per season: estimated 200–500 impacts >10 G based on accelerometer data from helmet-mounted devices in selected studies. Growing research into serum biomarkers (GFAP, UCH-L1) as same-day concussion objective adjunct diagnostics.',
      },
      {
        citation: 'Aughey 2014 — Int J Sports Physiol Perform',
        stat: '39.5°C',
        statLabel: 'Peak core temp in summer sessions',
        detail: 'AFL pre-season training conducted in Australian summer conditions (December–February, 30–42°C ambient) elevates core temperature above 39.5°C in multiple players per session. Wet bulb globe temperature (WBGT) >28°C triggers AFL/PA heat modification protocols: mandatory extended rest periods between drills, cooling vests during recovery, active shade requirements, and reduced intensity activities. Sweat rate in elite AFL players under heat stress: 1.5–2.5 L/hour; fluid replacement targets 80% of sweat loss to maintain performance and prevent heat illness. Heat acclimatisation: 10–14 exposures needed for full adaptation.',
      },
    ],
  },
  {
    id: 'development',
    number: '04',
    title: 'Physical Development & Position Demands',
    accent: '#ffd166',
    icon: '📊',
    findings: [
      {
        citation: 'Keogh 2013 — J Strength Cond Res',
        stat: '< 3.00 s',
        statLabel: 'Draft Combine 20m sprint target',
        detail: 'AFL National Draft Combine physical benchmarks (normative data for AFL-rated prospects): 20 m sprint <3.00 s, vertical jump >75 cm, 2-km time trial <6:15 min, and 5-0-5 agility <2.65 s. International Scholarship players from the US-based USAFL pipeline are evaluated against these normative percentile tables with raw athleticism weighted above skill development, reflecting the coachability of game skills vs. the heritability of elite athleticism. Draft age range: 17–25 years, with the modal age of debut at 18–19.',
      },
      {
        citation: 'Russell 2016 — J Sports Sci',
        stat: '195–210 cm',
        statLabel: 'Ruckman height profile',
        detail: 'AFL ruckmen represent the most physically distinctive positional group: height 195–210 cm, body mass 100–115 kg, vertical jump 65–80 cm (lower than midfielders despite height advantage, due to mass penalty). Ruckmen complete 11–14 km/game with unique high-intensity aerial contest frequency and must combine repeated maximal-effort jumps with contested ground-level leverage duels at stoppages. They are the most consistently high-volume gym users in AFL clubs, prioritising vertical power development (hang cleans, jump squats) alongside ruck-craft training (timing, spoiling, boundary coordination).',
      },
      {
        citation: 'Clarke 2020 — J Sci Med Sport',
        stat: '8–12 km',
        statLabel: 'AFLW distance per game',
        detail: 'Inaugural AFLW season physiology research found players cover 8–12 km per game — approximately 30–35% less than AFL men, reflecting game format differences (18-minute quarters, fewer interchanges). Top speed: 7.5 m/s (vs. 9.5 m/s for AFL men). Elite AFLW VO₂max: 48–55 mL/kg/min. Injury patterns closely parallel AFL men with hamstring strain and ACL rupture dominant. Critical finding: direct extrapolation from AFL male performance norms to AFLW planning overestimates appropriate training loads by 15–25% — AFLW-specific normative data is now actively being developed.',
      },
      {
        citation: 'Gabbett 2016 — Br J Sports Med',
        stat: '1.5 ACWR',
        statLabel: 'Injury risk threshold (workload ratio)',
        detail: 'The acute:chronic workload ratio (ACWR) — developed largely in AFL GPS research contexts — identifies a threshold of 1.5 at which injury risk increases 2–4× compared to ACWR 0.8–1.3 (the "sweet spot"). AFL clubs now integrate real-time GPS data (PlayerLoad, high-speed running distance, decelerations) into daily training load management. The 10% weekly volume rule remains a useful heuristic, but ACWR provides individualised load guidance accounting for each player\'s recent chronic training history rather than arbitrary calendar increments. Recovery and adaptation demands are highest in the 72 hours following a high-collision game.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '17 km', label: 'Midfielder distance/game', sub: 'Coutts 2010 — GPS analysis', color: '#e63946' },
  { value: '88–90%', label: 'Aerobic energy share', sub: 'Gastin 2013 — highest in team sport', color: '#f4722b' },
  { value: '7.4', label: 'Hamstring injuries/club/season', sub: 'Orchard 2013 — 25-year registry', color: '#2a9d8f' },
  { value: '1,200°/s', label: 'Shank velocity at kick', sub: 'Peacock 2017 — elite drop punt', color: '#ffd166' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AustralianFootballSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --oval-black: #070a08;
          --oval-dark: #0c1009;
          --oval-surface: #121a10;
          --oval-surface-2: #182215;
          --oval-border: #1e2e1a;
          --afl-red: #e63946;
          --afl-red-bright: #ff4d5a;
          --afl-red-dim: #9a1e28;
          --afl-red-glow: rgba(230,57,70,0.15);
          --afl-orange: #f4722b;
          --afl-orange-glow: rgba(244,114,43,0.15);
          --afl-gold: #ffd166;
          --afl-gold-glow: rgba(255,209,102,0.12);
          --afl-teal: #2a9d8f;
          --afl-teal-glow: rgba(42,157,143,0.15);
          --grass: #e8f0e5;
          --grass-dim: #7a9470;
          --grass-faint: #2e3e28;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .au-root {
          min-height: 100vh;
          background-color: var(--oval-black);
          color: var(--grass);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain overlay */
        .au-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Oval field background glow */
        .au-root::after {
          content: '';
          position: fixed;
          top: 20vh;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(42,157,143,0.04) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .au-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(7,10,8,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--oval-border);
          padding: 12px 24px;
        }

        .au-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .au-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--oval-border);
          background: var(--oval-surface);
          color: var(--grass-dim);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .au-back-btn:hover {
          border-color: var(--afl-red);
          color: var(--afl-red);
          background: var(--afl-red-glow);
        }

        .au-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--afl-red);
        }

        .au-header-title {
          font-family: 'Exo 2', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--grass);
        }

        .au-main {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        .au-hero {
          position: relative;
          padding: 64px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .au-hero-glow-r {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-60%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(230,57,70,0.14) 0%, transparent 65%);
          pointer-events: none;
        }

        .au-hero-glow-g {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-30%);
          width: 500px;
          height: 350px;
          background: radial-gradient(ellipse, rgba(42,157,143,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        .au-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--afl-red);
          background: var(--afl-red-glow);
          border: 1px solid rgba(230,57,70,0.26);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .au-hero-h1 {
          font-family: 'Exo 2', sans-serif;
          font-size: clamp(56px, 12vw, 120px);
          font-weight: 900;
          font-style: italic;
          line-height: 0.9;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 0 80px rgba(230,57,70,0.20);
        }

        .au-hero-h1 .red { color: var(--afl-red); text-shadow: 0 0 60px rgba(230,57,70,0.55); }
        .au-hero-h1 .gold { color: var(--afl-gold); text-shadow: 0 0 40px rgba(255,209,102,0.40); }

        .au-hero-sub {
          font-size: clamp(13px, 2vw, 17px);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--grass-dim);
          margin: 18px auto 36px;
          max-width: 540px;
          line-height: 1.5;
        }

        .au-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .au-hero-stat-num {
          font-family: 'Exo 2', sans-serif;
          font-size: 44px;
          font-weight: 900;
          color: var(--afl-red);
          line-height: 1;
        }

        .au-hero-stat-num .unit { font-size: 18px; color: var(--grass-dim); margin-left: 3px; }

        .au-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--grass-dim);
          margin-top: 4px;
        }

        .au-hero-divider { width: 1px; height: 40px; background: var(--oval-border); }

        .au-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) { .au-key-stats { grid-template-columns: repeat(4, 1fr); } }

        .au-stat-card {
          background: var(--oval-surface);
          border: 1px solid var(--oval-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .au-stat-val {
          font-family: 'Exo 2', sans-serif;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .au-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--grass-dim);
          margin-bottom: 4px;
        }

        .au-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--grass-faint);
          letter-spacing: 0.04em;
          line-height: 1.5;
        }

        /* Position distance chart */
        .au-chart {
          background: var(--oval-surface);
          border: 1px solid var(--oval-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .au-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--afl-red);
          margin-bottom: 6px;
        }

        .au-chart-sub {
          font-size: 12px;
          color: var(--grass-faint);
          margin-bottom: 20px;
        }

        .au-chart-rows { display: flex; flex-direction: column; gap: 12px; }

        .au-chart-row { display: grid; grid-template-columns: 100px 1fr 72px; align-items: center; gap: 12px; }

        .au-chart-pos {
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .au-chart-wrap { display: flex; flex-direction: column; gap: 3px; }

        .au-chart-track { height: 20px; background: rgba(255,255,255,0.04); position: relative; overflow: hidden; }

        .au-chart-fill { height: 100%; position: absolute; left: 0; top: 0; opacity: 0.8; }

        .au-chart-desc { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--grass-faint); letter-spacing: 0.04em; }

        .au-chart-val { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; text-align: right; }

        /* Science cards */
        .au-cards { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

        .au-card {
          background: var(--oval-surface);
          border: 1px solid var(--oval-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .au-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
        }

        .au-card-number {
          font-family: 'Exo 2', sans-serif;
          font-size: 72px;
          font-weight: 900;
          line-height: 1;
          position: absolute;
          top: 16px;
          right: 22px;
          opacity: 0.055;
          letter-spacing: -0.02em;
        }

        .au-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .au-card-title {
          font-family: 'Exo 2', sans-serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--grass);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .au-findings { display: flex; flex-direction: column; gap: 12px; }

        .au-finding {
          display: flex;
          gap: 14px;
          padding: 13px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid rgba(255,255,255,0.06);
        }

        .au-finding:hover { background: rgba(255,255,255,0.04); }

        .au-finding-stat { flex-shrink: 0; min-width: 88px; }

        .au-finding-stat-val {
          font-family: 'Exo 2', sans-serif;
          font-size: 21px;
          font-weight: 800;
          line-height: 1;
        }

        .au-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--grass-faint);
          letter-spacing: 0.04em;
          margin-top: 2px;
          line-height: 1.4;
        }

        .au-finding-body { flex: 1; min-width: 0; }

        .au-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--grass-faint);
          margin-bottom: 5px;
        }

        .au-finding-detail {
          font-size: 14px;
          font-weight: 400;
          color: rgba(232,240,229,0.72);
          line-height: 1.55;
        }

        /* Combine benchmarks */
        .au-combine {
          background: var(--oval-surface);
          border: 1px solid var(--oval-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .au-combine-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--afl-gold);
          margin-bottom: 6px;
        }

        .au-combine-sub { font-size: 12px; color: var(--grass-faint); margin-bottom: 20px; }

        .au-combine-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 500px) { .au-combine-grid { grid-template-columns: repeat(4, 1fr); } }

        .au-combine-item {
          background: var(--oval-surface-2);
          border: 1px solid var(--oval-border);
          padding: 14px 12px;
          text-align: center;
        }

        .au-combine-test {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--grass-faint);
          margin-bottom: 8px;
        }

        .au-combine-standard {
          font-family: 'Exo 2', sans-serif;
          font-size: 20px;
          font-weight: 800;
        }

        .au-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--oval-surface);
          border: 1px solid var(--oval-border);
          border-left: 3px solid var(--grass-faint);
        }

        .au-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--grass-dim);
          line-height: 1.75;
          letter-spacing: 0.04em;
        }

        @media (max-width: 640px) {
          .au-hero-h1 { font-size: 52px; }
          .au-card { padding: 22px 18px; }
          .au-finding { flex-direction: column; gap: 8px; }
          .au-chart-row { grid-template-columns: 80px 1fr 60px; }
        }
      `}} />

      <div className="au-root">
        {/* Header */}
        <header className="au-header">
          <div className="au-header-inner">
            <Link href="/workouts" className="au-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="au-header-label">Sports Science Series</div>
              <div className="au-header-title">Australian Football Science</div>
            </div>
          </div>
        </header>

        <main className="au-main">
          {/* Hero */}
          <section className="au-hero">
            <div className="au-hero-glow-r" />
            <div className="au-hero-glow-g" />
            <div className="au-hero-tag">AFL · The World&apos;s Most Demanding Team Sport</div>
            <h1 className="au-hero-h1">
              <span className="red">AFL</span>
              <span className="gold">SCIENCE</span>
            </h1>
            <p className="au-hero-sub">
              17 km per game. 88% aerobic. 72 direction changes per km.<br/>
              The physiology of the world&apos;s most demanding field sport.
            </p>
            <div className="au-hero-stats">
              <div>
                <div className="au-hero-stat-num">17<span className="unit">km</span></div>
                <div className="au-hero-stat-label">Midfielder per game</div>
              </div>
              <div className="au-hero-divider" />
              <div>
                <div className="au-hero-stat-num">88<span className="unit">%</span></div>
                <div className="au-hero-stat-label">Aerobic Energy</div>
              </div>
              <div className="au-hero-divider" />
              <div>
                <div className="au-hero-stat-num">620<span className="unit">°/s</span></div>
                <div className="au-hero-stat-label">Punt kick hip rotation</div>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="au-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="au-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="au-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="au-stat-label">{s.label}</div>
                <div className="au-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Distance by position chart */}
          <div className="au-chart">
            <div className="au-chart-title">GPS Running Distance by Position — Coutts 2010</div>
            <div className="au-chart-sub">Per game average, elite AFL senior competition</div>
            <div className="au-chart-rows">
              {POSITION_DISTANCE.map(p => (
                <div key={p.pos} className="au-chart-row">
                  <div className="au-chart-pos" style={{color:p.color}}>{p.pos}</div>
                  <div className="au-chart-wrap">
                    <div className="au-chart-track">
                      <div className="au-chart-fill" style={{width:`${p.barPct}%`,background:p.color}} />
                    </div>
                    <div className="au-chart-desc">{p.desc}</div>
                  </div>
                  <div className="au-chart-val" style={{color:p.color}}>{p.display}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science cards */}
          <div className="au-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="au-card">
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="au-card-number">{card.number}</div>
                <div className="au-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="au-card-title">{card.title}</div>
                <div className="au-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="au-finding">
                      <div className="au-finding-stat">
                        <div className="au-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="au-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="au-finding-body">
                        <div className="au-finding-citation">{f.citation}</div>
                        <div className="au-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Draft combine benchmarks */}
          <div className="au-combine">
            <div className="au-combine-title">AFL National Draft Combine — Elite Benchmarks (Keogh 2013)</div>
            <div className="au-combine-sub">Physical standards for AFL-listed player prospects</div>
            <div className="au-combine-grid">
              {COMBINE_BENCHMARKS.map(b => (
                <div key={b.test} className="au-combine-item">
                  <div className="au-combine-test">{b.test}</div>
                  <div className="au-combine-standard" style={{color:b.color}}>{b.elite}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="au-disclaimer">
            <div className="au-disclaimer-text">
              All performance data and injury statistics are drawn from peer-reviewed AFL-specific research and the AFL Injury Report registry. GPS and physiological data reflect elite senior male AFL competition unless otherwise noted. AFLW data is presented separately where available. Individual athlete requirements vary significantly by position, playing style, and developmental phase. This content is for educational purposes; consult qualified sports science staff for individualised programming.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
