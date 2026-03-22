// Rugby Science — static server component
// Evidence-based rugby physiology covering collision demands, energy systems,
// concussion science, and union/league/sevens comparison.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Rugby Science' }

// ─── Position Distance Data ───────────────────────────────────────────────────

const POSITION_DATA = [
  { pos: 'Winger', dist: 8.5, speed: '9.8 m/s', color: '#4caf50', barPct: 100 },
  { pos: 'Centre / Fly-half', dist: 8.2, speed: '9.5 m/s', color: '#66bb6a', barPct: 96 },
  { pos: 'Loose Forward', dist: 7.5, speed: '8.8 m/s', color: '#f9a825', barPct: 88 },
  { pos: 'Scrum-half', dist: 7.2, speed: '8.5 m/s', color: '#ffd54f', barPct: 85 },
  { pos: 'Prop / Hooker', dist: 5.8, speed: '7.2 m/s', color: '#ff7043', barPct: 68 },
  { pos: 'Lock', dist: 6.2, speed: '7.5 m/s', color: '#ef5350', barPct: 73 },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'demands',
    number: '01',
    title: 'Physical Demands by Position',
    accent: '#4caf50',
    icon: '🏉',
    findings: [
      {
        citation: 'Roberts 2008 — Int J Sports Physiol Perform',
        stat: '7–9 km',
        statLabel: 'Back distance per match',
        detail: 'GPS analysis across a full Super Rugby season found backs cover 7–9 km per match with significantly more high-intensity running distance (>5.5 m/s) than forwards; tight forwards cover 5–7 km with far more high-intensity collision events per metre covered. Loose forwards (flankers, No. 8) represent a physiological hybrid: 7–8 km distance combined with both high collision frequency and high-intensity running demands — requiring simultaneous conditioning of aerobic capacity, explosive power, and collision tolerance. VO₂max norms: backs 55–62 mL/kg/min; tight forwards 48–54 mL/kg/min.',
      },
      {
        citation: 'Quarrie 2007 — J Sci Med Sport',
        stat: '15–25',
        statLabel: 'Tackles per forward per match',
        detail: 'Position-stratified tackle frequency: forwards 15–25 per match; backs 8–14 per match. Each tackle produces mean collision G-force of 2.5–4.5 G for the ball carrier, 2.0–3.5 G for the tackler. Momentum (mass × velocity) predicts tackle outcome — both win probability and injury risk — better than isolated strength measurements. Low centre of mass at tackle initiation (hip-knee flexion depth) reduces tackler injury risk 35% and increases tackle completion probability 28% versus upright techniques.',
      },
      {
        citation: 'Milburn 1990 — Clin Biomech',
        stat: '800–1,200 N',
        statLabel: 'Peak scrum force per prop',
        detail: 'Laboratory scrum simulation with force transducers measured peak compressive forces of 800–1,200 N per front-row prop during sustained engagement phases. Spinal compressive load at lumbar L4/L5 reaches 3,000–5,000 N during maximum scrum effort — within range of vertebral fracture thresholds for chronic loading. The World Rugby crouch-bind-set engagement protocol (replacing "crouch-touch-pause-engage") reduced cervical spine injuries 40% in the 5 years post-introduction. Front-row technique coaching must address thoracic extension, hip-knee synchronised drive, and horizontal force application.',
      },
      {
        citation: 'Austin 2011 — Eur J Sport Sci',
        stat: '20–30',
        statLabel: 'Sprint efforts per match',
        detail: 'Rugby union players complete 20–30 high-speed running efforts (>5 m/s) per match with individual sprint durations of 2–8 seconds. Elite winger acceleration from standing to top speed: 0–20 m in 3.0–3.5 s. Top speed reached by elite wingers: 9–10 m/s (32–36 km/h). Positional sprint demand ranges enormously: wingers 30+ sprint efforts vs. tightheads 8–12 per match. Training prescription must reflect these positional distributions — volume and intensity targets require individual contextualisation rather than squad-wide standards.',
      },
    ],
  },
  {
    id: 'concussion',
    number: '02',
    title: 'Collision Science & Head Injury',
    accent: '#ef5350',
    icon: '🧠',
    findings: [
      {
        citation: 'Fuller 2015 — Br J Sports Med',
        stat: '4.7 / 1,000h',
        statLabel: 'Concussion rate in professional rugby',
        detail: 'World Rugby epidemiology data established professional rugby union concussion incidence at 4.7 per 1,000 player-hours — the most commonly reported time-loss injury across all rugby World Cup tournaments studied. Tackles cause 76% of all concussions; rucks and mauls account for the majority of the remaining 24%. Rugby World Cup data shows concussion incidence 4–5× higher in matches than in training sessions, reflecting the amplified collision intensity and competitive pace. World Rugby mandatory Head Injury Assessment (HIA) protocol: 7-step graduated return-to-play, minimum 7 days symptom-free.',
      },
      {
        citation: 'Headey 2007 — Am J Sports Med',
        stat: '22–28%',
        statLabel: 'Shoulder share of time-loss injuries',
        detail: 'Professional rugby union shoulder injury prevalence: 22–28% of all time-loss injuries. Anterior glenohumeral dislocation is the most common pattern, arising from tackle or ruck contact. First-time dislocation recurrence rate in young rugby players without surgical stabilisation: 70–90% — strongly supporting early Bankart repair in athletes <25 years old. Acromioclavicular joint sprains (grade I–III) are prevalent in front-row players from scrum engagement and rucking body positions. Prevention: posterior shoulder strength balance (ER:IR ratio >0.75), rotator cuff pre-activation protocols, and tackle technique coaching.',
      },
      {
        citation: 'King 2010 — Br J Sports Med',
        stat: '0.7–1.5/1,000h',
        statLabel: 'ACL injury incidence',
        detail: 'ACL injury incidence in rugby union: 0.7–1.5 per 1,000 player-hours. Tackle mechanism accounts for 60–65% of all ACL injuries — typically non-contact forced knee valgus as the ball carrier attempts to sidecut while being contacted at the knee by a tackler. Return-to-play post-surgical reconstruction: 10–16 months. Adapted FIFA 11+ warm-up protocols (Copenhagen adductor exercise, Nordic hamstring curl, single-leg balance, and cutting technique drills) reduce lower extremity injury rates 30–40% in rugby union cohorts from prospective trials.',
      },
      {
        citation: 'Quarrie 2014 — Br J Sports Med',
        stat: '−40%',
        statLabel: 'Cervical spine injuries post front-row reform',
        detail: 'New Zealand\'s RugbySmart programme — mandatory front-row certification, referee education on legal scrum engagement, and annual coach certification — reduced cervical spine injuries in scrummaging by 40% within 5 years of implementation. Programme elements include required scrum technique coaching for all youth props before contact rugby clearance. Independent biomechanical findings confirm that neck flexor and extensor strengthening (targeting sternocleidomastoid, splenius capitis, semispinalis) reduces head angular acceleration 20–30% under equivalent collision force — particularly protective against rotational concussion mechanisms.',
      },
    ],
  },
  {
    id: 'energy',
    number: '03',
    title: 'Energy Systems & Recovery Science',
    accent: '#f9a825',
    icon: '⚡',
    findings: [
      {
        citation: 'Deutsch 1998 — Med Sci Sports Exerc',
        stat: '75–85%',
        statLabel: 'Aerobic energy contribution',
        detail: 'Energy system analysis using GPS velocity data found rugby union is 75–85% aerobic by total energy contribution across a full match — but the critical match-winning moments (tackles, scrum drives, sprint breaks) are 100% anaerobic and PCr-dependent. Blood lactate during active play: 4–7 mmol/L, reflecting significant glycolytic contribution. Backs sustain 70–85% HRmax during extended play periods; forwards peak at 75–90% HRmax during collision sequences. This dual demand profile requires simultaneous development of both aerobic base (for sustained play and recovery) and repeat-sprint anaerobic capacity (for critical actions).',
      },
      {
        citation: 'McLellan 2011 — Int J Sports Physiol Perform',
        stat: '72–96 h',
        statLabel: 'Full muscle recovery post-match',
        detail: 'Creatine kinase (CK) — a biomarker of skeletal muscle damage — peaks at 24–36 hours post-match in professional rugby players and returns to baseline by 72–96 hours. Post-match CK values range from 2,000–8,000 IU/L (vs. resting baseline <200 IU/L), reflecting extreme mechanical muscle disruption from collision events. Evidence-based recovery: cold water immersion (10–15°C, 10 min) reduces CK 22% vs passive recovery at 24 hours; compression garments reduce perceived soreness 30%; sleep extension to ≥9 h/night accelerates glycogen restoration and growth hormone secretion for muscle repair.',
      },
      {
        citation: 'Gabbett 2014 — Br J Sports Med',
        stat: '0.8–1.3',
        statLabel: 'Safe ACWR "sweet spot"',
        detail: 'Acute:chronic workload ratio (ACWR) management in rugby: ACWR of 0.8–1.3 is associated with minimal injury risk and optimal performance ("the sweet spot"). ACWR >1.5 correlates with 3–4× injury risk elevation. GPS-based weekly periodisation structure for competition phase: post-match days 1–2 passive and active recovery; days 3–5 progressive training build; day 6 pre-match taper at 70% volume. Research shows 45–60% of rugby injuries occur during the highest-load training weeks when ACWR is highest — periodisation matters as much as physical preparation.',
      },
      {
        citation: 'Burke 2011 (Applied Rugby Nutrition)',
        stat: '1.8–2.4 g/kg',
        statLabel: 'Daily protein target for forwards',
        detail: 'Forward positions require 1.8–2.4 g/kg/day protein to maintain muscle mass under the combined stimulus of high collision training and session volume. Pre-match carbohydrate loading: 7–10 g/kg body weight in the 24 hours before match day; 1–2 g/kg in the 3–4 hours immediately before. In-match fuelling: 30–60 g/hour carbohydrate (gels, sports drinks) for matches exceeding 60 minutes, particularly critical in second halves when glycogen depletion impairs decision-making and collision technique. Creatine monohydrate supplementation (5 g/day maintenance) increases PCr stores 15–20%, meaningfully benefiting repeated-sprint and scrum endurance in forwards.',
      },
    ],
  },
  {
    id: 'formats',
    number: '04',
    title: 'Rugby Formats: Union vs League vs Sevens',
    accent: '#a78bfa',
    icon: '📊',
    findings: [
      {
        citation: 'King 2012 — Eur J Sport Sci',
        stat: '8–11 km',
        statLabel: 'Rugby League distance per match',
        detail: 'GPS comparison found Rugby League players cover 8–11 km per match — greater absolute distance than Union — with significantly higher high-intensity running distance (2.5–3.5 km vs 1.8–2.5 km in Union). NRL players perform 30–40 high-intensity efforts per match vs 20–30 in Union, reflecting league\'s continuous play without contested rucks and mauls providing brief rest intervals. Blood lactate during NRL matches: 6–10 mmol/L — substantially higher than Union. VO₂max requirements for NRL backs: 56–64 mL/kg/min, placing them in the top tier of field sport athletes.',
      },
      {
        citation: 'Higham 2012 — J Sci Med Sport',
        stat: '35–45%',
        statLabel: 'High-intensity running proportion in Sevens',
        detail: 'Rugby Sevens players cover 1.5–2.0 km per 7-minute half (14-minute game) with high-intensity running comprising 35–45% of total distance — far exceeding both 15-a-side formats. Heart rate is sustained at 90–95% HRmax for nearly the entire game duration. Sevens tournament format (3–4 games per day) imposes cumulative fatigue that exponentially amplifies after game 2; in-tournament nutritional strategy and 90-minute between-game recovery protocols are the dominant performance differentiators. Sevens VO₂max requirements: >62 mL/kg/min for competitive international performance.',
      },
      {
        citation: 'Deutsch 2007 — J Sci Med Sport',
        stat: '90–95%',
        statLabel: 'Anaerobic contribution during scrum',
        detail: 'Metabolic analysis of scrum sequences — engagement plus sustained pushing phase (3–8 s) — shows 90–95% anaerobic energy contribution, with PCr as the primary fuel. Blood lactate measured immediately post-scrum series: 3–5 mmol/L, indicating significant glycolytic contribution from sequential scrum engagements within a match. Front-row training should incorporate weighted sled push intervals (matching scrum force × duration), isometric wall-push circuits (simulating sustained engagement), and scrum machine repetitions with progressive resistance to develop both neuromuscular force and metabolic tolerance.',
      },
      {
        citation: 'World Rugby 2023 Annual Report',
        stat: '3–4×',
        statLabel: 'ACL rate elevation in women\'s rugby',
        detail: 'Women\'s rugby is the fastest-growing team sport globally (World Rugby 2023). Physiological profiles for elite women\'s rugby union: backs VO₂max 50–58 mL/kg/min; forwards 44–52 mL/kg/min. Tackle frequency patterns mirror men\'s game but collision impact forces are lower due to body mass differences. Critical finding: ACL injury rates in women\'s rugby are 3–4× higher than in men\'s rugby per 1,000 exposure hours — consistent with female ACL injury risk patterns across field sports. Hip abductor strengthening, neuromuscular jump-landing training, and ACL-specific prevention programmes are especially critical in women\'s rugby pathways.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '9 km', label: 'Back GPS distance per match', sub: 'Roberts 2008 — Super Rugby GPS analysis', color: '#4caf50' },
  { value: '4.7/1k', label: 'Concussions per 1,000 player-hours', sub: 'Fuller 2015 — World Rugby epidemiology', color: '#ef5350' },
  { value: '72–96h', label: 'Full muscle recovery post-match', sub: 'McLellan 2011 — CK biomarker data', color: '#f9a825' },
  { value: '−40%', label: 'Cervical injuries after scrum reform', sub: 'Quarrie 2014 — RugbySmart NZ programme', color: '#a78bfa' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RugbySciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,400;0,600;0,700;0,800;0,900;1,900&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --turf-black: #060a06;
          --turf-dark: #0a0f0a;
          --turf-surface: #0f1a0f;
          --turf-surface-2: #152215;
          --turf-border: #1c2e1c;
          --rugby-green: #4caf50;
          --rugby-green-glow: rgba(76,175,80,0.15);
          --rugby-red: #ef5350;
          --rugby-red-glow: rgba(239,83,80,0.15);
          --rugby-gold: #f9a825;
          --rugby-gold-glow: rgba(249,168,37,0.15);
          --rugby-purple: #a78bfa;
          --rugby-purple-glow: rgba(167,139,250,0.12);
          --chalk: #e8f0e4;
          --chalk-dim: #7a9470;
          --chalk-faint: #2c3c28;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rg-root {
          min-height: 100vh;
          background-color: var(--turf-black);
          color: var(--chalk);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .rg-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Field line pattern */
        .rg-root::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 70px,
            rgba(76,175,80,0.025) 70px,
            rgba(76,175,80,0.025) 71px
          );
        }

        .rg-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(6,10,6,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--turf-border);
          padding: 12px 24px;
        }

        .rg-header-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 14px; }

        .rg-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--turf-border);
          background: var(--turf-surface);
          color: var(--chalk-dim);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .rg-back-btn:hover { border-color: var(--rugby-green); color: var(--rugby-green); background: var(--rugby-green-glow); }

        .rg-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--rugby-green);
        }

        .rg-header-title { font-family: 'Kanit', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--chalk); }

        .rg-main { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; padding: 0 24px 80px; }

        .rg-hero { position: relative; padding: 64px 0 52px; text-align: center; overflow: hidden; }

        .rg-hero-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(ellipse at 50% 0%, rgba(76,175,80,0.15) 0%, rgba(239,83,80,0.05) 50%, transparent 70%);
          pointer-events: none;
        }

        .rg-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--rugby-green);
          background: var(--rugby-green-glow);
          border: 1px solid rgba(76,175,80,0.28);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .rg-hero-h1 {
          font-family: 'Kanit', sans-serif;
          font-size: clamp(60px, 13vw, 128px);
          font-weight: 900;
          font-style: italic;
          line-height: 0.9;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 6px;
          text-shadow: 0 0 80px rgba(76,175,80,0.20);
        }

        .rg-hero-h1 .green { color: var(--rugby-green); text-shadow: 0 0 60px rgba(76,175,80,0.55); }
        .rg-hero-h1 .red { color: var(--rugby-red); }

        .rg-hero-sub { font-size: clamp(13px, 2vw, 17px); font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--chalk-dim); margin: 18px auto 36px; max-width: 540px; }

        .rg-hero-stats { display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap; }

        .rg-hero-stat-num { font-family: 'Kanit', sans-serif; font-size: 44px; font-weight: 900; color: var(--rugby-green); line-height: 1; }
        .rg-hero-stat-num .unit { font-size: 18px; color: var(--chalk-dim); margin-left: 3px; }
        .rg-hero-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--chalk-dim); margin-top: 4px; }
        .rg-hero-divider { width: 1px; height: 40px; background: var(--turf-border); }

        .rg-key-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 40px; }
        @media (min-width: 600px) { .rg-key-stats { grid-template-columns: repeat(4, 1fr); } }

        .rg-stat-card { background: var(--turf-surface); border: 1px solid var(--turf-border); padding: 16px 14px; position: relative; overflow: hidden; }
        .rg-stat-val { font-family: 'Kanit', sans-serif; font-size: 28px; font-weight: 700; line-height: 1.1; margin-bottom: 4px; }
        .rg-stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--chalk-dim); margin-bottom: 4px; }
        .rg-stat-sub { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--chalk-faint); letter-spacing: 0.04em; line-height: 1.5; }

        .rg-chart { background: var(--turf-surface); border: 1px solid var(--turf-border); padding: 24px; margin-bottom: 40px; }
        .rg-chart-title { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--rugby-green); margin-bottom: 6px; }
        .rg-chart-sub { font-size: 12px; color: var(--chalk-faint); margin-bottom: 20px; }
        .rg-chart-rows { display: flex; flex-direction: column; gap: 12px; }
        .rg-chart-row { display: grid; grid-template-columns: 130px 1fr 100px; align-items: center; gap: 12px; }
        .rg-chart-pos { font-family: 'Kanit', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .rg-chart-wrap { display: flex; flex-direction: column; gap: 3px; }
        .rg-chart-track { height: 18px; background: rgba(255,255,255,0.04); position: relative; overflow: hidden; }
        .rg-chart-fill { height: 100%; position: absolute; left: 0; top: 0; opacity: 0.8; }
        .rg-chart-meta { display: flex; gap: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--chalk-faint); }
        .rg-chart-val { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; text-align: right; }

        .rg-cards { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

        .rg-card { background: var(--turf-surface); border: 1px solid var(--turf-border); padding: 28px 24px; position: relative; overflow: hidden; }
        .rg-card-number { font-family: 'Kanit', sans-serif; font-size: 72px; font-weight: 900; font-style: italic; line-height: 1; position: absolute; top: 16px; right: 22px; opacity: 0.055; }
        .rg-card-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px; }
        .rg-card-title { font-family: 'Kanit', sans-serif; font-size: 26px; font-weight: 700; text-transform: uppercase; color: var(--chalk); line-height: 1.1; margin-bottom: 20px; }

        .rg-findings { display: flex; flex-direction: column; gap: 12px; }
        .rg-finding { display: flex; gap: 14px; padding: 13px; background: rgba(255,255,255,0.025); border-left: 2px solid rgba(255,255,255,0.06); }
        .rg-finding:hover { background: rgba(255,255,255,0.04); }
        .rg-finding-stat { flex-shrink: 0; min-width: 88px; }
        .rg-finding-stat-val { font-family: 'Kanit', sans-serif; font-size: 22px; font-weight: 700; line-height: 1; }
        .rg-finding-stat-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: var(--chalk-faint); letter-spacing: 0.04em; margin-top: 2px; line-height: 1.4; }
        .rg-finding-body { flex: 1; min-width: 0; }
        .rg-finding-citation { font-family: 'IBM Plex Mono', monospace; font-size: 8px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--chalk-faint); margin-bottom: 5px; }
        .rg-finding-detail { font-size: 14px; font-weight: 400; color: rgba(232,240,228,0.72); line-height: 1.55; }

        .rg-disclaimer { margin-top: 40px; padding: 18px 22px; background: var(--turf-surface); border: 1px solid var(--turf-border); border-left: 3px solid var(--chalk-faint); }
        .rg-disclaimer-text { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--chalk-dim); line-height: 1.75; letter-spacing: 0.04em; }

        @media (max-width: 640px) {
          .rg-hero-h1 { font-size: 52px; }
          .rg-card { padding: 22px 18px; }
          .rg-finding { flex-direction: column; gap: 8px; }
          .rg-chart-row { grid-template-columns: 100px 1fr 70px; }
        }
      `}} />

      <div className="rg-root">
        <header className="rg-header">
          <div className="rg-header-inner">
            <Link href="/workouts" className="rg-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="rg-header-label">Sports Science Series</div>
              <div className="rg-header-title">Rugby Science</div>
            </div>
          </div>
        </header>

        <main className="rg-main">
          <section className="rg-hero">
            <div className="rg-hero-glow" />
            <div className="rg-hero-tag">Union · League · Sevens — Collision Sport Physiology</div>
            <h1 className="rg-hero-h1">
              <span className="green">RUGBY</span>
              <span className="red">SCIENCE</span>
            </h1>
            <p className="rg-hero-sub">
              The biomechanics of the tackle, the physiology of collision, and the science of recovery.
            </p>
            <div className="rg-hero-stats">
              <div>
                <div className="rg-hero-stat-num">9<span className="unit">km</span></div>
                <div className="rg-hero-stat-label">Back GPS Distance</div>
              </div>
              <div className="rg-hero-divider" />
              <div>
                <div className="rg-hero-stat-num">4.5<span className="unit">G</span></div>
                <div className="rg-hero-stat-label">Peak Tackle Force</div>
              </div>
              <div className="rg-hero-divider" />
              <div>
                <div className="rg-hero-stat-num">96<span className="unit">h</span></div>
                <div className="rg-hero-stat-label">Full Recovery Time</div>
              </div>
            </div>
          </section>

          <div className="rg-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="rg-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="rg-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="rg-stat-label">{s.label}</div>
                <div className="rg-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Position distance chart */}
          <div className="rg-chart">
            <div className="rg-chart-title">GPS Distance by Position — Roberts 2008 (Super Rugby)</div>
            <div className="rg-chart-sub">Per match average with top speed</div>
            <div className="rg-chart-rows">
              {POSITION_DATA.map(p => (
                <div key={p.pos} className="rg-chart-row">
                  <div className="rg-chart-pos" style={{color:p.color}}>{p.pos}</div>
                  <div className="rg-chart-wrap">
                    <div className="rg-chart-track">
                      <div className="rg-chart-fill" style={{width:`${p.barPct}%`,background:p.color}} />
                    </div>
                    <div className="rg-chart-meta">
                      <span>TOP SPEED {p.speed}</span>
                    </div>
                  </div>
                  <div className="rg-chart-val" style={{color:p.color}}>{p.dist} km</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rg-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="rg-card">
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="rg-card-number">{card.number}</div>
                <div className="rg-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="rg-card-title">{card.title}</div>
                <div className="rg-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="rg-finding">
                      <div className="rg-finding-stat">
                        <div className="rg-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="rg-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="rg-finding-body">
                        <div className="rg-finding-citation">{f.citation}</div>
                        <div className="rg-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rg-disclaimer">
            <div className="rg-disclaimer-text">
              All data from peer-reviewed research. CK and concussion data reflects professional rugby cohorts; amateur players face lower absolute risk. Injury prevention protocols (FIFA 11+, RugbySmart) are format-specific and should be adapted by qualified sports science staff. Women&apos;s rugby physiology research is rapidly expanding; consult current World Rugby guidelines for up-to-date recommendations.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
