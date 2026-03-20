// Power-to-Weight Ratio Science — server component
// W/kg: the fundamental cycling & endurance performance metric

export const metadata = { title: 'Power-to-Weight Ratio Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '6.4',
    unit: 'W/kg',
    label: 'Tour de France Climbers',
    sub: 'Lucia 2001 — Grand Tour sustained climb benchmarks',
    accent: '#f5c518',
  },
  {
    value: '1 kg',
    unit: 'saved',
    label: 'Saves 40–60s on Alpe d\'Huez',
    sub: 'Coggan sensitivity analysis — climbing simulator model',
    accent: '#ff6b35',
  },
  {
    value: '2.0–6.0+',
    unit: 'W/kg',
    label: 'Coggan Classification Range',
    sub: 'Coggan 2003 — amateur to world-class FTP tiers',
    accent: '#00d4ff',
  },
]

const WKG_TIERS = [
  { tier: 'Fair', range: '2.0–2.5', label: 'Recreational', color: '#6b7280', barWidth: '22%', desc: 'Casual fitness rider, occasional commuter' },
  { tier: 'Moderate', range: '2.5–3.2', label: 'Regular Trainer', color: '#3b82f6', barWidth: '35%', desc: 'Consistent training 3–4×/week, club rides' },
  { tier: 'Good', range: '3.2–4.0', label: 'Category 4/5', color: '#10b981', barWidth: '50%', desc: 'Cat 4–5 racing, competitive amateur events' },
  { tier: 'Very Good', range: '4.0–4.7', label: 'Category 3', color: '#84cc16', barWidth: '63%', desc: 'Cat 3 racing, regional podium contender' },
  { tier: 'Excellent', range: '4.7–5.3', label: 'Category 1–2', color: '#f59e0b', barWidth: '76%', desc: 'National-level amateur, elite domestic' },
  { tier: 'Exceptional', range: '5.3–5.8', label: 'Pro Continental', color: '#f97316', barWidth: '88%', desc: 'Pro continental, Grand Tour domestique' },
  { tier: 'World Class', range: '5.8–6.4+', label: 'WorldTour GC / Climber', color: '#f5c518', barWidth: '100%', desc: 'Tour de France GC contender, summit finisher' },
]

const SCIENCE_CARDS = [
  {
    id: 'physics',
    number: '01',
    title: 'W/kg Physics & Classification',
    accentColor: '#f5c518',
    facts: [
      {
        citation: 'di Prampero 1979 (J Exp Biol)',
        text: 'The foundational biomechanical model proving that climbing speed is directly proportional to power-to-weight ratio. On a 8% grade at 10 km/h, roughly 95% of total resistance is gravitational — meaning absolute wattage matters almost nothing; only W/kg determines who reaches the summit first. A 70 kg rider at 350 W (5.0 W/kg) will beat a 90 kg rider producing 400 W (4.4 W/kg) on every climb above ~3% gradient.',
        stat: 'Climbing resistance: ~95% gravitational on 8% grade — W/kg is destiny',
      },
      {
        citation: 'Coggan 2003 — FTP W/kg Classification Tiers',
        text: 'The definitive W/kg classification system, derived from FTP (Functional Threshold Power), now the universal currency of cycling fitness. Tiers span from 2.0 W/kg (fair, recreational) through 3.5 W/kg (good, Cat 3–4 racer) to 5.5+ W/kg (exceptional, pro) and 6.0+ (world class, Grand Tour climber). Each tier represents meaningful physiological distinctions in mitochondrial density, lactate threshold, and VO₂max fractional utilization. A single tier improvement (~0.5 W/kg) requires approximately 6–18 months of structured training.',
        stat: 'Fair 2.0 → Good 3.5 → Excellent 4.7 → World Class 6.0+ W/kg',
      },
      {
        citation: 'Coyle 1991 (J Appl Physiol)',
        text: 'Landmark study establishing the W/kg-to-VO₂max relationship in elite cyclists. VO₂max is necessary but not sufficient — the critical variable is cycling efficiency (W produced per L O₂ consumed). Elite cyclists convert 23–25% of metabolic energy to mechanical power vs 18–20% in well-trained amateurs. A 1% improvement in gross efficiency is equivalent in performance terms to a ~2.5% improvement in VO₂max, meaning economy training (long Z2, high-cadence work) directly improves effective W/kg without changing body weight.',
        stat: 'Elite cycling efficiency 23–25% vs amateur 18–20%; +1% efficiency ≈ +2.5% VO₂max',
      },
      {
        citation: 'Borszcz 2018 (Int J Sports Physiol Perf)',
        text: 'Systematic review of FTP testing protocols — the gateway measurement to W/kg classification. The 20-minute all-out test (FTP = 95% of 20-min average power) carries ±5–10 W inter-session variability and may overestimate FTP by 3–8% in less-trained athletes. The ramp test (1-minute step increases until failure) predicts FTP as 75% of peak 1-minute power — faster to execute and shows strong validity (r=0.95 with metabolic cart MAP). Borszcz recommends ≥3 min warm-up and standardized pre-test nutrition for reproducible W/kg baselines.',
        stat: 'FTP ramp test: 75% × peak 1-min power; r=0.95 with lab MAP; ±5–10 W repeatability',
      },
    ],
  },
  {
    id: 'racing',
    number: '02',
    title: 'Racing Applications',
    accentColor: '#ff6b35',
    facts: [
      {
        citation: 'Lucia 2001 (Med Sci Sports Exerc)',
        text: 'The definitive Grand Tour physiology study, analyzing 7 professional cyclists across three-week Grand Tours (Tour de France, Vuelta, Giro). GC contenders and mountain stage specialists sustained 5.7–6.4 W/kg for climbs lasting 20–45 minutes. Flat-stage specialists and domestiques operated at 4.8–5.4 W/kg over the same events. Key finding: VO₂max among GC riders averaged 82 mL/kg/min, but VO₂max fractional utilization at threshold was the discriminating variable — GC riders held 88–92% VO₂max at threshold vs 78–84% for domestiques.',
        stat: 'Grand Tour GC climbers: 5.7–6.4 W/kg; VO₂max 82 mL/kg/min; 88–92% threshold utilization',
      },
      {
        citation: 'Broker 2003 (USCF Cycling Biomechanics)',
        text: 'Flat-course vs climbing trade-off analysis resolving the classic "puncheur vs climber" dilemma. On flat roads, aerodynamic drag dominates — frontal area and CdA matter far more than W/kg; a heavier, more powerful rider generates higher absolute speed. At gradients above 4%, this reverses sharply: every additional kilogram of body mass extracts a measurable time penalty. On a 10 km, 7% climb, reducing body weight by 3 kg with constant power saves approximately 90 seconds — equivalent to a 30-watt power increase. Track sprinters (W/kg 16–22 peak) need entirely different optimization than climbers.',
        stat: '7% grade, 10 km: −3 kg body mass saves ~90 seconds = equivalent to +30 W absolute power',
      },
      {
        citation: 'Jones 2017 (J Sports Sci) — Running W/kg',
        text: 'Running power-to-weight dynamics differ critically from cycling. In running, body weight is both a load (penalty) and a spring (elastic energy return via tendons). Jones demonstrates that running economy (mL O₂/kg/km) is the running equivalent of cycling W/kg — lighter runners are faster only if economy is preserved. The Kenyan running elite maintain 57–64 kg at 5′10″ average height, yielding low leg inertia and exceptional elastic energy storage. Critical finding: below 5% body fat in male runners, further weight loss impairs economy and recovery faster than it improves W/kg — the "diminishing returns cliff" of body composition optimization.',
        stat: 'Running: <5% BF in males impairs economy — W/kg optimization has a body fat floor',
      },
      {
        citation: 'Slater 2011 (J Sports Sci)',
        text: 'Weight vs power trade-off systematic review for endurance athletes. Reducing 1 kg of fat mass increases effective W/kg proportionally (e.g., 70 kg → 69 kg at 300 W: 4.286 → 4.348 W/kg, +1.4% improvement). Critically, muscle mass loss reduces absolute power: 1 kg of lean mass typically contributes 8–12 W to FTP. The optimal cutting strategy preserves power by timing caloric restriction to off-season base training, not during high-intensity race prep blocks when muscle protein synthesis is highest. Slater identifies relative energy deficiency (RED-S) as the primary risk of aggressive weight management in weight-sensitive endurance sports.',
        stat: 'Fat loss +W/kg safely; muscle loss: 1 kg lean mass = −8–12 W FTP — net loss in most cases',
      },
    ],
  },
  {
    id: 'body',
    number: '03',
    title: 'Body Composition Optimization',
    accentColor: '#00d4ff',
    facts: [
      {
        citation: 'Lucia 2000 (Int J Sports Med)',
        text: 'Body composition profiling of professional Tour de France cyclists: mean body fat 7.5–11% (DXA-measured), BMI 20–22, lean mass index superior to general population despite lower total mass. The elite cyclist archetype is lean but not depleted — key discriminator from underfueling. Critically, body fat below 5% in male cyclists correlates with increased cortisol, suppressed testosterone, elevated injury risk, and impaired immune function. The "race weight" sweet spot is the body fat % at which power output, recovery rate, and health markers are simultaneously optimized — not the lowest achievable weight.',
        stat: 'Elite pro body fat: 7.5–11% (DXA); below 5% = hormonal disruption + immune suppression',
      },
      {
        citation: 'Coggan Climbing Simulator — W/kg Sensitivity Analysis',
        text: 'Widely-used simulation modeling time savings per unit of W/kg change on benchmark climbs. On Alpe d\'Huez (13.8 km, 8.1% avg grade), going from 4.5 to 5.0 W/kg saves approximately 6 minutes of climbing time. Losing 1 kg body weight (constant power) saves 40–60 seconds on a 45-min climb. Gaining 10W of FTP (constant weight) saves similar time. The crossover point — where training for power is equivalent to losing weight — depends on current body composition. For riders already at race weight (<10% BF), power development offers greater ROI; for riders above 15% BF, targeted fat loss is more efficient per training hour.',
        stat: 'Alpe d\'Huez: 4.5→5.0 W/kg saves ~6 min; −1 kg = 40–60 s; +10 W FTP = similar gain',
      },
      {
        citation: 'Levine 1997 (J Appl Physiol) — Altitude & W/kg',
        text: 'Live-high train-low (LHLT) protocol at 2,500 m increases hemoglobin mass by 3–6%, erythropoietin by 30–50%, and VO₂max by 3–5% upon return to sea level. Critically for W/kg: the hemoglobin increase raises O₂-carrying capacity, effectively improving power output at a given body weight without any change in training-derived mechanical power. The LHLT advantage translates to a 1–3% improvement in 40 km TT performance and an estimated +0.2–0.4 W/kg effective improvement — achieved purely through blood physiology, not increased muscle mass.',
        stat: 'LHLT at 2,500 m: +3–5% VO₂max, +3–6% hemoglobin mass; effective +0.2–0.4 W/kg at sea level',
      },
      {
        citation: 'Rønnestad 2019 (Int J Sports Physiol Perf) — Heat Training as W/kg Strategy',
        text: 'Heat acclimation (5–10 sessions, 90 min in 40°C, 60% RH) induces plasma volume expansion of 4–8%, increases cardiac stroke volume, and lowers core temperature at sub-maximal intensities — without any change in body weight or power output per se. Net effect: an improvement in heat-environment W/kg equivalent performance. In temperate conditions post-acclimatization, VO₂max improves 3–5% due to plasma expansion. Rønnestad validated heat training as a legal, low-cost altitude training surrogate for athletes without access to elevation — a W/kg-strategy requiring no dietary change.',
        stat: 'Heat acclimation: plasma +4–8%, SV ↑, VO₂max +3–5% temperate; equivalent to altitude block',
      },
    ],
  },
  {
    id: 'female',
    number: '04',
    title: 'Female Athletes & W/kg',
    accentColor: '#d946ef',
    facts: [
      {
        citation: 'Female W/kg Benchmarks — Coggan Adapted Norms',
        text: 'Female athlete W/kg classifications are meaningfully lower than male equivalents due to hormonal differences in muscle fiber type distribution, lean mass ratios, and hemoglobin concentration (~12% lower). Elite female road cyclists operate at 4.5–5.5 W/kg for 20-minute efforts; Grand Tour women\'s racing climbers reach 5.0–5.8 W/kg. Women\'s VO₂max averages 10–15% lower than males at comparable training loads due to lower hemoglobin concentration (13.5 vs 15.5 g/dL average). Female W/kg norms: Fair 1.8–2.2, Good 3.0–3.6, Excellent 4.0–4.6, World Class 5.0+',
        stat: 'Elite women climbers 4.5–5.8 W/kg; Hb ~12% lower than males — absolute W/kg benchmarks differ',
      },
      {
        citation: 'Wouters-Adriaens 2013 (Eur J Appl Physiol) — Menstrual Cycle Effects',
        text: 'Menstrual cycle phase significantly affects W/kg-relevant physiology. Late follicular phase (days 8–14, pre-ovulation) is characterized by peak estrogen, elevated strength (+3–8%), optimal anaerobic power, and fastest neuromuscular response — optimal timing for high-intensity testing. Luteal phase (days 15–28) shows elevated progesterone, increased core temperature, and reduced glycogen storage capacity. Wouters-Adriaens quantified a 4–7% variation in peak power output across the cycle, suggesting that W/kg testing and race scheduling should account for menstrual phase when possible.',
        stat: 'Peak power 4–7% higher in late follicular phase; luteal phase: ↑ core temp, ↓ glycogen efficiency',
      },
      {
        citation: 'Mountjoy 2018 (Br J Sports Med) — RED-S & W/kg',
        text: 'Relative Energy Deficiency in Sport (RED-S) — the updated Female Athlete Triad framework — is the primary clinical risk of W/kg obsession in female athletes. Energy availability below 30 kcal/kg LBM/day (danger threshold: 45 kcal/kg LBM/day recommended) suppresses reproductive hormones, impairs bone density, reduces immune function, and paradoxically decreases power output by 8–15% as muscle catabolism accelerates. Mountjoy documents that 45–60% of female endurance athletes show one or more RED-S indicators. The "W/kg ceiling" for female athletes is determined by energy availability, not willpower.',
        stat: 'RED-S threshold <30 kcal/kg LBM/day; power loss −8–15%; 45–60% female endurance athletes affected',
      },
      {
        citation: 'Speechly 1996 (Med Sci Sports Exerc) — Ultra-Endurance Advantages',
        text: 'One of the most important findings in sex-differentiated endurance physiology: female athletes show significantly superior fat oxidation at equivalent W/kg relative intensities. At 65% VO₂max, female athletes oxidize 25–35% more fat per unit of carbohydrate than males matched for fitness. This translates to superior substrate economy in ultra-endurance events (>4 hours), where glycogen conservation is performance-limiting. The W/kg disadvantage in female athletes narrows progressively with event duration — at 24-hour races, sex-based performance differences are negligible, and female-specific physiological advantages (fuel economy, lower physiological stress response) emerge.',
        stat: 'Females: +25–35% fat oxidation at 65% VO₂max; W/kg sex gap narrows to near-zero in ultra events',
      },
    ],
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PowerToWeightSciencePage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,900&family=Barlow:wght@400;500;600&display=swap');

            :root {
              --gold: #f5c518;
              --gold-dim: #c9a614;
              --gold-glow: rgba(245,197,24,0.18);
              --gold-border: rgba(245,197,24,0.28);
              --orange: #ff6b35;
              --cyan: #00d4ff;
              --magenta: #d946ef;
              --bg: #0a0a08;
              --surface: #111110;
              --surface2: #181816;
              --border: #252520;
              --text: #f0ede0;
              --text-muted: #7a7870;
              --text-dim: #4a4840;
            }

            * { box-sizing: border-box; }

            .ptw-page {
              min-height: 100vh;
              background: var(--bg);
              color: var(--text);
              font-family: 'Barlow', sans-serif;
              font-size: 15px;
              line-height: 1.6;
            }

            /* ── Speed lines background ── */
            .ptw-hero {
              position: relative;
              overflow: hidden;
              background: linear-gradient(170deg, #0f0e08 0%, #0a0a08 50%, #0d0b0a 100%);
              border-bottom: 1px solid var(--border);
              padding: 0 0 56px;
            }

            .ptw-hero::before {
              content: '';
              position: absolute;
              inset: 0;
              background:
                repeating-linear-gradient(
                  -12deg,
                  transparent,
                  transparent 60px,
                  rgba(245,197,24,0.02) 60px,
                  rgba(245,197,24,0.02) 61px
                );
              pointer-events: none;
            }

            .ptw-hero-glow {
              position: absolute;
              top: -120px;
              left: 50%;
              transform: translateX(-50%);
              width: 800px;
              height: 500px;
              background: radial-gradient(ellipse at 50% 30%, rgba(245,197,24,0.13) 0%, transparent 65%);
              pointer-events: none;
            }

            .ptw-hero-stripe {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--orange) 70%, transparent 100%);
            }

            .ptw-hero-content {
              position: relative;
              z-index: 1;
              max-width: 860px;
              margin: 0 auto;
              padding: 64px 24px 0;
              text-align: center;
            }

            .ptw-overline {
              display: inline-block;
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 3.5px;
              text-transform: uppercase;
              color: var(--gold);
              margin-bottom: 20px;
              padding: 5px 14px;
              border: 1px solid var(--gold-border);
              border-radius: 3px;
              background: var(--gold-glow);
            }

            .ptw-hero-title {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: clamp(58px, 12vw, 108px);
              font-weight: 900;
              line-height: 0.9;
              letter-spacing: -2px;
              text-transform: uppercase;
              margin: 0 0 8px;
              color: var(--gold);
              text-shadow: 0 0 60px rgba(245,197,24,0.3), 0 2px 0 rgba(0,0,0,0.8);
              animation: heroSlide 0.7s cubic-bezier(0.22,1,0.36,1) both;
            }

            .ptw-hero-subtitle-unit {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: clamp(26px, 5vw, 42px);
              font-weight: 700;
              font-style: italic;
              letter-spacing: 1px;
              text-transform: uppercase;
              color: rgba(240,237,224,0.55);
              margin: 0 0 28px;
              animation: heroSlide 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both;
            }

            .ptw-hero-desc {
              font-size: 16px;
              color: #8a8880;
              max-width: 560px;
              margin: 0 auto 40px;
              line-height: 1.7;
              animation: fadeUp 0.6s 0.25s ease both;
            }

            /* ── Diagonal accent bar ── */
            .ptw-diagonal-bar {
              display: inline-flex;
              align-items: center;
              gap: 0;
              animation: fadeUp 0.6s 0.35s ease both;
            }

            .ptw-diag-item {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 8px 18px;
              position: relative;
            }

            .ptw-diag-item::after {
              content: '›';
              position: absolute;
              right: -6px;
              top: 50%;
              transform: translateY(-50%);
              color: var(--text-dim);
              font-size: 16px;
              z-index: 1;
            }

            .ptw-diag-item:last-child::after { display: none; }

            /* ── Stats strip ── */
            .ptw-stats-strip {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0;
              border: 1px solid var(--border);
              border-radius: 0;
              overflow: hidden;
              animation: fadeUp 0.6s 0.45s ease both;
            }

            @media (max-width: 640px) {
              .ptw-stats-strip { grid-template-columns: 1fr; }
            }

            .ptw-stat-cell {
              padding: 28px 24px;
              border-right: 1px solid var(--border);
              position: relative;
              overflow: hidden;
              transition: background 0.2s;
            }

            .ptw-stat-cell:last-child { border-right: none; }


            .ptw-stat-value {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 44px;
              font-weight: 900;
              line-height: 1;
              letter-spacing: -1px;
              margin: 0 0 2px;
            }

            .ptw-stat-unit {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 18px;
              font-weight: 700;
              font-style: italic;
              opacity: 0.6;
              margin-left: 4px;
            }

            .ptw-stat-label {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: var(--text);
              margin: 6px 0 4px;
            }

            .ptw-stat-sub {
              font-size: 12px;
              color: var(--text-muted);
              line-height: 1.4;
            }

            /* ── Tier table ── */
            .ptw-tier-wrap {
              background: var(--surface);
              border: 1px solid var(--border);
              overflow: hidden;
              animation: fadeUp 0.6s 0.55s ease both;
            }

            .ptw-tier-header {
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 18px 24px;
              border-bottom: 1px solid var(--border);
              background: linear-gradient(90deg, rgba(245,197,24,0.07) 0%, transparent 60%);
              border-left: 4px solid var(--gold);
            }

            .ptw-tier-header-icon {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 28px;
              font-weight: 900;
              color: var(--gold);
              line-height: 1;
            }

            .ptw-tier-header-title {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: var(--text);
              margin: 0;
            }

            .ptw-tier-header-sub {
              font-size: 12px;
              color: var(--text-muted);
              margin: 2px 0 0;
            }

            .ptw-tier-row {
              display: grid;
              grid-template-columns: 110px 90px 1fr;
              align-items: center;
              gap: 16px;
              padding: 14px 24px;
              border-bottom: 1px solid #1a1a18;
              transition: background 0.15s;
            }

            .ptw-tier-row:last-child { border-bottom: none; }

            .ptw-tier-row:hover { background: rgba(255,255,255,0.02); }

            .ptw-tier-badge {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              padding: 4px 10px;
              border-radius: 2px;
              text-align: center;
              white-space: nowrap;
            }

            .ptw-tier-wkg {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 17px;
              font-weight: 900;
              letter-spacing: -0.5px;
              white-space: nowrap;
            }

            .ptw-tier-right { flex: 1; min-width: 0; }

            .ptw-tier-label {
              font-size: 12px;
              font-weight: 700;
              color: var(--text);
              margin-bottom: 5px;
            }

            .ptw-tier-bar-track {
              height: 6px;
              background: #1e1e1c;
              border-radius: 1px;
              overflow: hidden;
              margin-bottom: 5px;
            }

            .ptw-tier-bar-fill {
              height: 100%;
              border-radius: 1px;
            }

            .ptw-tier-desc {
              font-size: 11px;
              color: var(--text-muted);
            }

            /* ── Science section ── */
            .ptw-section-label {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 3px;
              text-transform: uppercase;
              color: var(--text-dim);
              margin: 0 0 6px;
            }

            .ptw-section-title {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 32px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: -0.5px;
              color: var(--text);
              margin: 0;
            }

            /* ── Science card ── */
            .ptw-science-card {
              background: var(--surface);
              border: 1px solid var(--border);
              overflow: hidden;
            }

            .ptw-card-header {
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 20px 24px;
              border-bottom: 1px solid var(--border);
              position: relative;
              overflow: hidden;
            }


            .ptw-card-number {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 52px;
              font-weight: 900;
              line-height: 1;
              opacity: 0.12;
              flex-shrink: 0;
              letter-spacing: -2px;
            }

            .ptw-card-title {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 22px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              color: var(--text);
              margin: 0;
              flex: 1;
            }

            .ptw-card-pill {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              padding: 4px 12px;
              border-radius: 2px;
              flex-shrink: 0;
            }

            /* ── Fact row ── */
            .ptw-fact {
              padding: 20px 24px;
              border-bottom: 1px solid #1a1a18;
            }

            .ptw-fact:last-child { border-bottom: none; }

            .ptw-fact-citation {
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.2px;
              color: var(--text-muted);
              margin: 0 0 8px;
            }

            .ptw-fact-text {
              font-size: 13.5px;
              color: #b8b5a8;
              line-height: 1.7;
              margin: 0 0 12px;
            }

            .ptw-fact-stat {
              display: inline-block;
              font-family: 'Barlow Condensed', sans-serif;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.3px;
              padding: 6px 14px;
              border-radius: 2px;
              border-left: 3px solid;
            }

            /* ── Animations ── */
            @keyframes heroSlide {
              from {
                opacity: 0;
                transform: translateY(24px) skewY(-1deg);
              }
              to {
                opacity: 1;
                transform: translateY(0) skewY(0);
              }
            }

            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }

            .ptw-card-anim-1 { animation: fadeUp 0.55s 0.1s ease both; }
            .ptw-card-anim-2 { animation: fadeUp 0.55s 0.2s ease both; }
            .ptw-card-anim-3 { animation: fadeUp 0.55s 0.3s ease both; }
            .ptw-card-anim-4 { animation: fadeUp 0.55s 0.4s ease both; }

            /* ── Disclaimer ── */
            .ptw-disclaimer {
              font-size: 12px;
              color: var(--text-dim);
              line-height: 1.65;
              padding: 18px 22px;
              background: var(--surface);
              border: 1px solid var(--border);
              border-left: 3px solid #2a2a28;
            }
          `,
        }}
      />

      <div className="ptw-page">

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <div className="ptw-hero">
          <div className="ptw-hero-stripe" />
          <div className="ptw-hero-glow" />

          <div className="ptw-hero-content">
            <div className="ptw-overline">Cycling &amp; Endurance Performance Science</div>

            <h1 className="ptw-hero-title">W/kg</h1>
            <p className="ptw-hero-subtitle-unit">Power-to-Weight Ratio</p>

            <p className="ptw-hero-desc">
              The single number that determines who crests the summit first. Watts mean nothing without the kilogram.
              This is the fundamental metric of cycling — and endurance — performance.
            </p>

            <div className="ptw-diagonal-bar">
              {['Physics', 'Racing', 'Body Composition', 'Female Athletes'].map((item, i) => (
                <div
                  key={item}
                  className="ptw-diag-item"
                  style={{
                    color: i === 0 ? '#f5c518' : i === 1 ? '#ff6b35' : i === 2 ? '#00d4ff' : '#d946ef',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-5 pb-24">

          {/* ── Key stats strip ─────────────────────────────────────────────── */}
          <div className="mt-10 ptw-stats-strip" style={{ background: 'var(--surface)' }}>
            {KEY_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="ptw-stat-cell"
                style={{
                  borderRight: i < KEY_STATS.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Top accent bar — replaces ::before pseudo-element */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: stat.accent,
                  }}
                />
                <div className="ptw-stat-value" style={{ color: stat.accent }}>
                  {stat.value}
                  <span className="ptw-stat-unit">{stat.unit}</span>
                </div>
                <div className="ptw-stat-label">{stat.label}</div>
                <div className="ptw-stat-sub">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* ── W/kg Tier Classification ─────────────────────────────────────── */}
          <div className="mt-8 ptw-tier-wrap">
            <div className="ptw-tier-header">
              <div className="ptw-tier-header-icon">W/kg</div>
              <div>
                <h2 className="ptw-tier-header-title">Coggan W/kg Classification Tiers</h2>
                <p className="ptw-tier-header-sub">FTP-based — 20-min sustained power effort · Coggan 2003</p>
              </div>
            </div>

            {WKG_TIERS.map((tier) => (
              <div key={tier.tier} className="ptw-tier-row">
                <div
                  className="ptw-tier-badge"
                  style={{
                    color: tier.color,
                    background: `${tier.color}18`,
                    border: `1px solid ${tier.color}35`,
                  }}
                >
                  {tier.tier}
                </div>

                <div className="ptw-tier-wkg" style={{ color: tier.color }}>
                  {tier.range}
                </div>

                <div className="ptw-tier-right">
                  <div className="ptw-tier-label">{tier.label}</div>
                  <div className="ptw-tier-bar-track">
                    <div
                      className="ptw-tier-bar-fill"
                      style={{
                        width: tier.barWidth,
                        background: `linear-gradient(90deg, ${tier.color}66, ${tier.color})`,
                      }}
                    />
                  </div>
                  <div className="ptw-tier-desc">{tier.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Section heading ──────────────────────────────────────────────── */}
          <div className="mt-12 mb-6">
            <p className="ptw-section-label">Evidence-Based Research</p>
            <h2 className="ptw-section-title">The Science Behind the Number</h2>
          </div>

          {/* ── Science cards ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {SCIENCE_CARDS.map((card, cardIdx) => (
              <div key={card.id} className={`ptw-science-card ptw-card-anim-${cardIdx + 1}`}>
                {/* Card header */}
                <div
                  className="ptw-card-header"
                  style={{
                    background: `linear-gradient(90deg, ${card.accentColor}09 0%, transparent 60%)`,
                    borderLeft: `4px solid ${card.accentColor}`,
                  }}
                >
                  <div className="ptw-card-number" style={{ color: card.accentColor }}>
                    {card.number}
                  </div>
                  <h3 className="ptw-card-title">{card.title}</h3>
                  <div
                    className="ptw-card-pill"
                    style={{
                      color: card.accentColor,
                      background: `${card.accentColor}18`,
                      border: `1px solid ${card.accentColor}35`,
                    }}
                  >
                    {card.facts.length} studies
                  </div>
                </div>

                {/* Facts */}
                {card.facts.map((fact, i) => (
                  <div key={i} className="ptw-fact">
                    <div className="ptw-fact-citation">{fact.citation}</div>
                    <p className="ptw-fact-text">{fact.text}</p>
                    <div
                      className="ptw-fact-stat"
                      style={{
                        color: card.accentColor,
                        background: `${card.accentColor}0d`,
                        borderLeftColor: card.accentColor,
                      }}
                    >
                      {fact.stat}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Disclaimer ───────────────────────────────────────────────────── */}
          <div className="mt-10 ptw-disclaimer">
            <strong style={{ color: 'var(--text-muted)' }}>Disclaimer:</strong> This page summarises
            peer-reviewed research and validated models. W/kg benchmarks are population-level references;
            individual performance varies with training history, body composition, and genetics. Body weight
            and body composition interventions carry health risks — consult a qualified sports dietitian and
            physician before altering race weight strategies, especially if you have a history of disordered eating.
          </div>

        </div>
      </div>
    </>
  )
}
