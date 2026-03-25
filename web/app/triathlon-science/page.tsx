// Triathlon Science — static server component
// Multi-sport physiology, brick adaptation, and race strategy
// Three discipline colors: cyan (swim), blue-green (bike), orange-red (run)

export const metadata = { title: 'Triathlon Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '+12%',
    label: 'Swim→Bike VO₂ Boost',
    sub: 'Buchheit 2010 — post-swim elevated oxygen kinetics on the bike',
    accent: '#06b6d4',
    discipline: 'SWIM→BIKE',
  },
  {
    value: '8–15%',
    label: 'Quad Recruitment Drop',
    sub: 'Hausswirth 1997 — first 2 km off the bike, brick run adaptation',
    accent: '#22d3ee',
    discipline: 'T2 BRICK',
  },
  {
    value: '82%',
    label: 'VO₂max at Run',
    sub: 'Etxebarria 2014 — highest discipline utilization in triathlon',
    accent: '#f97316',
    discipline: 'RUN',
  },
  {
    value: '68–72%',
    label: 'Optimal Bike FTP',
    sub: 'Laursen 2012 — pacing intensity that preserves run capacity',
    accent: '#10b981',
    discipline: 'BIKE',
  },
]

const DISCIPLINES = [
  {
    id: 'swim',
    name: 'SWIM',
    symbol: '~',
    color: '#06b6d4',
    colorDim: 'rgba(6,182,212,0.15)',
    colorBorder: 'rgba(6,182,212,0.35)',
    colorGlow: 'rgba(6,182,212,0.12)',
    vo2Pct: 79,
    typical: 'Open water or pool · wetsuit legal ≤24.5°C',
    sprintDist: '750m',
    olympicDist: '1500m',
    dist703: '1.9km',
    ironmanDist: '3.8km',
    keyFact: 'Wetsuit buoyancy improves velocity 4–8%',
  },
  {
    id: 'bike',
    name: 'BIKE',
    symbol: '∞',
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.15)',
    colorBorder: 'rgba(16,185,129,0.35)',
    colorGlow: 'rgba(16,185,129,0.12)',
    vo2Pct: 73,
    typical: 'Road cycling · aero position · drafting illegal (ITU: legal)',
    sprintDist: '20km',
    olympicDist: '40km',
    dist703: '90km',
    ironmanDist: '180km',
    keyFact: 'Aero tuck saves 60–90W at 40 km/h vs upright',
  },
  {
    id: 'run',
    name: 'RUN',
    symbol: '↗',
    color: '#f97316',
    colorDim: 'rgba(249,115,22,0.15)',
    colorBorder: 'rgba(249,115,22,0.35)',
    colorGlow: 'rgba(249,115,22,0.12)',
    vo2Pct: 82,
    typical: 'Road running · highest physiological demand · run off bike',
    sprintDist: '5km',
    olympicDist: '10km',
    dist703: '21.1km',
    ironmanDist: '42.2km',
    keyFact: 'T-run pace 10–15 s/km slower than standalone',
  },
]

const RACE_DISTANCES = [
  {
    name: 'SPRINT',
    swim: '750m',
    bike: '20km',
    run: '5km',
    eliteTime: '~55 min',
    color: '#06b6d4',
    barWidth: 14,
  },
  {
    name: 'OLYMPIC',
    swim: '1500m',
    bike: '40km',
    run: '10km',
    eliteTime: '~1:45',
    color: '#22d3ee',
    barWidth: 28,
  },
  {
    name: '70.3',
    swim: '1.9km',
    bike: '90km',
    run: '21.1km',
    eliteTime: '~3:45',
    color: '#10b981',
    barWidth: 62,
  },
  {
    name: 'IRONMAN',
    swim: '3.8km',
    bike: '180km',
    run: '42.2km',
    eliteTime: '~7:40',
    color: '#f97316',
    barWidth: 100,
  },
]

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    number: '01',
    discipline: 'MULTI-SPORT',
    title: 'Multi-Sport Physiology & Brick Adaptation',
    color: '#06b6d4',
    colorDim: 'rgba(6,182,212,0.10)',
    colorBorder: 'rgba(6,182,212,0.25)',
    colorText: '#67e8f9',
    facts: [
      {
        citation: 'Buchheit 2010 (Int J Sports Physiol Perform)',
        text: 'Swim-to-bike transition produces a paradoxical +12% VO₂ elevation in the first 4 minutes of cycling — a consequence of elevated cardiac output, warm muscle temperature, and post-swim alkalosis from hyperventilation. This transient boost allows athletes to sustain higher early-bike power outputs, but comes with a cost: premature glycogen depletion if not managed through disciplined pacing. Elite triathletes exploit this window; age-groupers often crash from it.',
        stat: 'Swim→Bike: +12% VO₂ in first 4 min of cycling · exploit with disciplined early-bike pacing',
      },
      {
        citation: 'Hausswirth 1997 (Eur J Appl Physiol)',
        text: 'Brick run (bike→run transition) causes quadriceps recruitment to drop 8–15% in the first 2 km as neural motor patterns shift from cycling\'s circular motion to running\'s linear gait. Stride frequency is initially higher (+5–8 spm) while stride length is shorter (−6–10 cm). Neuromuscular confusion peaks at the 800m mark. Training bricks 2–3×/week over 12 weeks reduces this deficit to <3%, demonstrating remarkable adaptation plasticity.',
        stat: 'Quad recruitment −8–15% in first 2 km · stride length −6–10 cm · bricks 2–3×/week normalizes within 12 weeks',
      },
      {
        citation: "O'Toole 1989 (Med Sci Sports Exerc) — Ironman Glycogen",
        text: "Ironman competition depletes muscle glycogen by 75–90% across all three disciplines combined. O'Toole's landmark biopsy study found near-complete depletion in gastrocnemius and vastus lateralis by kilometer 30 of the marathon segment. Athletes maintaining 60–90g carbohydrate/hour showed 40% higher glycogen preservation than ad-libitum feeders. Ironman is fundamentally a fueling problem wearing an endurance costume — physiology matters less than the gut.",
        stat: 'Ironman depletes muscle glycogen 75–90% · 60–90g CHO/h → 40% better preservation · run segment is a fueling race',
      },
      {
        citation: 'Etxebarria 2014 (Int J Sports Physiol Perform)',
        text: 'VO₂max utilization across disciplines in elite Olympic triathlon: swim 79%, bike 73%, run 82%. The run demands highest relative intensity despite occurring last — when glycogen is most depleted. Critically, bike intensity directly predicts run performance: every 1% increase in bike VO₂ above 75% correlates with a 45-second slower run split in Olympic distance. The bike leg is the run\'s beginning, not the run\'s predecessor.',
        stat: 'VO₂max utilization: swim 79%, bike 73%, run 82% · every +1% bike above 75% → +45 s slower run split',
      },
    ],
  },
  {
    id: 'swim',
    number: '02',
    discipline: 'SWIM',
    title: 'Swim Biomechanics & Open-Water Tactics',
    color: '#22d3ee',
    colorDim: 'rgba(34,211,238,0.10)',
    colorBorder: 'rgba(34,211,238,0.25)',
    colorText: '#a5f3fc',
    facts: [
      {
        citation: 'Toussaint 1989 (J Appl Physiol) — Wetsuit Buoyancy',
        text: 'Wetsuits increase swimming velocity 4–8% by elevating body position and reducing drag coefficient. Toussaint\'s flume studies demonstrated that wetsuit use reduces VO₂ at a given velocity by 6–12% — allowing athletes to either swim faster at the same effort or conserve energy for the bike and run. Critically, drafting position in wetsuits amplifies these benefits. Elite open-water swimmers decline wetsuits in warm conditions (>24.5°C) to avoid overheating in subsequent disciplines.',
        stat: 'Wetsuit: +4–8% velocity · −6–12% VO₂ at same speed · overheating risk >24.5°C water temp',
      },
      {
        citation: 'Chatard 1990 (Int J Sports Med) — Open-Water Drafting',
        text: 'Swimming directly behind another athlete reduces oxygen consumption 11–18% by exploiting the pressure wave and reduced frontal drag. The optimal drafting position is 0–50 cm directly behind the lead swimmer\'s feet. Side-hip drafting yields 4–7% savings — still meaningful over 1500–3800m. Elite athletes exploit mass start chaos to find draft partners of similar pace; this tactical decision can save 60–90 seconds in Ironman swim splits.',
        stat: 'Drafting behind: −11–18% VO₂ · optimal 0–50 cm from feet · side-hip position: −4–7% · 60–90 s saved over Ironman swim',
      },
      {
        citation: 'Seifert 2007 (J Strength Cond Res) — Bilateral Breathing',
        text: 'Bilateral breathing (every 3rd stroke) maintains a more symmetrical stroke and reduces lateral drift by up to 40% in open water — critical when sighting is limited. Unilateral breathing allows higher stroke rate but creates rotational imbalance and cumulative directional deviation. In choppy conditions, elite triathletes shift to 2-stroke breathing intervals on the side facing into waves, returning to bilateral when conditions calm. Sighting frequency: every 8–12 strokes in clear water, every 4–6 strokes in rough.',
        stat: 'Bilateral breathing: −40% lateral drift · sighting every 8–12 strokes (clear) · 4–6 strokes (rough)',
      },
      {
        citation: 'Renfree 2013 (Sports Med) — Negative-Split Pacing',
        text: 'Negative-split swimming (second half faster than first) reduces blood lactate accumulation by 18–22% compared to positive-split starts, resulting in lower heart rate entering T1 and preserved early-bike output. Most age-group triathletes positive-split swims by 10–25% due to mass-start adrenaline surges. Elite pacing strategy: first 200m at perceived 85% effort, then settle to race pace. The bike and run are won or lost in the first 200 meters of the swim.',
        stat: 'Negative-split swim: −18–22% blood lactate · lower HR entering T1 · age-groupers positive-split by 10–25%',
      },
    ],
  },
  {
    id: 'bike',
    number: '03',
    discipline: 'BIKE',
    title: 'Cycling Pacing, Power & Aerodynamics',
    color: '#10b981',
    colorDim: 'rgba(16,185,129,0.10)',
    colorBorder: 'rgba(16,185,129,0.25)',
    colorText: '#6ee7b7',
    facts: [
      {
        citation: 'Laursen 2012 (Sports Med) — Optimal Bike Intensity',
        text: '68–72% FTP (functional threshold power) is the evidence-based pacing zone that maximally sustains run performance in Olympic and 70.3 triathlon. Athletes riding at 75–80% FTP are 3× more likely to experience significant run degradation (>90 s/km slower than standalone). Power variability index (VI = normalized power / average power) should remain <1.05 for flat courses; exceeding 1.10 on hilly courses predicts 8–12% run performance loss independent of average power.',
        stat: 'Optimal bike: 68–72% FTP · above 75% FTP → 3× greater run degradation · VI >1.10 → 8–12% run performance loss',
      },
      {
        citation: 'Martin 1998 (J Appl Biomech) — Aero Position',
        text: 'Triathlon aero position (forearms on bars, horizontal torso) reduces frontal area by 20–26% and drag coefficient by 18–22%, saving 60–90 watts at 40 km/h versus an upright position — equivalent to approximately 2–3 km/h additional speed at the same power output. Martin\'s computational fluid dynamics modelling showed helmet selection can add a further 10–15W savings. However, extreme aero positions that compress hip angle <90° impair hip flexor recruitment and reduce run economy by 3–7%.',
        stat: 'Aero position: saves 60–90W at 40 km/h · +2–3 km/h same power · hip angle <90° → −3–7% run economy',
      },
      {
        citation: 'Vercruyssen 2005 (Med Sci Sports Exerc) — Cadence',
        text: 'Cycling at 95 RPM (versus 80 RPM at the same power) reduces glycolytic contribution by 12% and decreases post-bike blood lactate by 1.8 mmol/L — translating to meaningfully better run performance. Higher cadence shifts work toward type I (slow-twitch) oxidative fibers and away from type II glycolytic fibers, preserving the fast-twitch reserve needed for the run. Triathletes naturally select 10–15 RPM higher cadences than pure cyclists, exhibiting an endogenous protective response.',
        stat: '95 RPM vs 80 RPM: −12% glycolytic contribution · −1.8 mmol/L blood lactate post-bike · better run start',
      },
      {
        citation: 'Fudge 2008 (Br J Sports Med) — Hydration',
        text: 'Triathlon bike leg hydration target: 750–1000 mL/hour in temperate conditions, up to 1400 mL/hour in heat. Dehydration of >2% body mass reduces aerobic power by 6–7% per additional percent dehydrated. In Ironman, athletes losing 3% body mass show 15–20% slower marathon times. Sweat sodium concentration averages 40–60 mmol/L — requiring electrolyte replacement beyond plain water. Aero-mounted hydration systems (aero bottles) reduce drag versus cage-mounted bottles by 8–12W at race speeds.',
        stat: 'Bike hydration: 750–1000 mL/h · >2% dehydration: −6–7% power · 3% loss → 15–20% slower Ironman run',
      },
    ],
  },
  {
    id: 'transition',
    number: '04',
    discipline: 'T1/T2 & RUN',
    title: 'Transition & Run Strategy',
    color: '#f97316',
    colorDim: 'rgba(249,115,22,0.10)',
    colorBorder: 'rgba(249,115,22,0.25)',
    colorText: '#fdba74',
    facts: [
      {
        citation: 'Millet 2011 (J Sci Med Sport) — T-Run Pacing',
        text: 'Running immediately off the bike requires pacing 10–15 s/km slower than standalone race pace for the first 2 km — a physiologically mandated adjustment, not a strategic choice. Athletes who ignore this and run at standalone pace in the first kilometer are 4× more likely to positive-split the entire run leg. RPE-based pacing is unreliable in T2 due to elevated heart rate from cycling; power meter-based run pacing (or GPS-based pace with 15-second delay) is superior in the first 3 km.',
        stat: 'T-run: 10–15 s/km slower in first 2 km · ignore → 4× more likely to blow up · GPS-delayed pacing superior to RPE',
      },
      {
        citation: 'Millet 2000 (Med Sci Sports Exerc) — Muscle Damage',
        text: 'Post-Ironman creatine kinase (CK) levels reach 3× higher than post-marathon — indicating triple the skeletal muscle damage. Millet\'s biopsy data showed Z-disk disruption in 85% of vastus lateralis fibers post-Ironman versus 60% post-marathon. Recovery requires 3–4 weeks for CK normalization (vs 1–2 weeks post-marathon). Mechanistically, cycling\'s concentric loading followed by running\'s eccentric impact creates a dual-mechanism injury pattern not observed in single-sport endurance events.',
        stat: 'Post-Ironman CK: 3× higher than post-marathon · 85% muscle fiber disruption · 3–4 week CK recovery',
      },
      {
        citation: 'Vleck 2008 (J Sports Sci) — Elite T2 Times',
        text: 'Elite Olympic triathlon T2 times: <45 seconds (World Championship level); <90 seconds (elite national). Age-group top-10 finishers average T2 of 90–180 seconds. Vleck\'s time-motion analysis showed that 28% of age-group athletes lose more time in transitions than the performance gap between them and the next age-group category — meaning transition skill is a greater leverage point than fitness for most age-groupers. Practiced transitions are trainable to elite levels regardless of athletic background.',
        stat: 'Elite T2: <45s (WC) / <90s (national elite) · 28% of age-groupers lose entire age-group gap in transitions',
      },
      {
        citation: 'Pfeiffer 2012 (IJSNEM) — GI Distress',
        text: 'Gastrointestinal distress affects 30–50% of Ironman athletes and is the leading cause of DNF (did not finish). Pfeiffer\'s survey of 221 Ironman finishers identified nausea, bloating, and vomiting as predominant symptoms, peaking at kilometers 15–25 of the marathon. Risk factors: hyperosmolar drinks, solid food on the run, riding intensity >75% FTP, and previous GI history. Evidence-based mitigation: 60–90g/h carbohydrate in 2:1 glucose:fructose ratio, liquid-only nutrition after km 100 of bike.',
        stat: 'GI distress: 30–50% Ironman athletes · peaks at run km 15–25 · mitigation: 2:1 glu:fru, liquid-only after bike km 100',
      },
    ],
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function KeyStatCard({
  value,
  label,
  sub,
  accent,
  discipline,
}: (typeof KEY_STATS)[number]) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f1923 0%, #0d1520 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '20px 18px',
        flex: '1 1 0',
        minWidth: 170,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: `linear-gradient(180deg, ${accent}12 0%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: accent,
          margin: '0 0 10px',
          fontFamily: '"Exo 2", sans-serif',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        {discipline}
      </p>
      <p
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: accent,
          margin: 0,
          fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
          lineHeight: 1,
          letterSpacing: '-1px',
          textShadow: `0 0 20px ${accent}44`,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#e2e8f0',
          margin: '8px 0 4px',
          fontFamily: '"Exo 2", sans-serif',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.45 }}>{sub}</p>
    </div>
  )
}

function DisciplineCard({ d, index }: { d: (typeof DISCIPLINES)[number]; index: number }) {
  const distances = [d.sprintDist, d.olympicDist, d.dist703, d.ironmanDist]
  const raceNames = ['Sprint', 'Olympic', '70.3', 'Ironman']

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0f1923 0%, #0c151f 100%)',
        border: `1px solid ${d.colorBorder}`,
        borderRadius: 14,
        overflow: 'hidden',
        flex: '1 1 0',
        minWidth: 220,
        position: 'relative',
      }}
    >
      {/* Top accent stripe */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '18px 20px 14px',
          background: d.colorGlow,
          borderBottom: `1px solid ${d.colorBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Animated discipline orb */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: d.colorDim,
            border: `2px solid ${d.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 16px ${d.color}33`,
            animation: `disciplinePulse${index} 3s ease-in-out infinite`,
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: d.color,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
            }}
          >
            {d.symbol}
          </span>
        </div>
        <div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: d.color,
              margin: 0,
              fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
              letterSpacing: '2px',
              lineHeight: 1,
            }}
          >
            {d.name}
          </p>
          <p
            style={{
              fontSize: 10,
              color: d.color,
              margin: '4px 0 0',
              fontFamily: '"Exo 2", sans-serif',
              opacity: 0.75,
              letterSpacing: '0.5px',
            }}
          >
            VO₂max utilized: {d.vo2Pct}%
          </p>
        </div>
      </div>

      {/* VO2 bar */}
      <div style={{ padding: '12px 20px 0' }}>
        <div
          style={{
            height: 6,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${d.vo2Pct}%`,
              background: `linear-gradient(90deg, ${d.color}88, ${d.color})`,
              borderRadius: 3,
            }}
          />
        </div>
        <p style={{ fontSize: 10, color: '#334155', margin: '4px 0 0', fontFamily: '"Exo 2", sans-serif' }}>
          {d.vo2Pct}% of VO₂max
        </p>
      </div>

      {/* Distances by race */}
      <div style={{ padding: '12px 20px 14px' }}>
        {raceNames.map((race, i) => (
          <div
            key={race}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 0',
              borderBottom: i < raceNames.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: '#64748b',
                fontFamily: '"Exo 2", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              {race}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: d.color,
                fontFamily: '"Barlow Condensed", sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              {distances[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Key fact footer */}
      <div
        style={{
          padding: '10px 20px 16px',
          borderTop: `1px solid ${d.colorBorder}`,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: d.color,
            margin: 0,
            fontFamily: '"Exo 2", sans-serif',
            lineHeight: 1.5,
            fontStyle: 'italic',
            opacity: 0.85,
          }}
        >
          {d.keyFact}
        </p>
      </div>
    </div>
  )
}

function RaceDistanceRow({ race, i }: { race: (typeof RACE_DISTANCES)[number]; i: number }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: i < RACE_DISTANCES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
        position: 'relative',
      }}
    >
      {/* Background distance bar */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${race.barWidth}%`,
          background: `linear-gradient(90deg, ${race.color}08, transparent)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Race name */}
        <div style={{ minWidth: 90 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: race.color,
              margin: 0,
              fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
              letterSpacing: '2px',
              lineHeight: 1,
            }}
          >
            {race.name}
          </p>
          <p
            style={{
              fontSize: 10,
              color: '#475569',
              margin: '3px 0 0',
              fontFamily: '"Exo 2", sans-serif',
              letterSpacing: '0.5px',
            }}
          >
            Elite: {race.eliteTime}
          </p>
        </div>

        {/* Distances */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'SWIM', value: race.swim, color: '#06b6d4' },
            { label: 'BIKE', value: race.bike, color: '#10b981' },
            { label: 'RUN', value: race.run, color: '#f97316' },
          ].map((d) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: d.color,
                  fontFamily: '"Exo 2", sans-serif',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  minWidth: 32,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  letterSpacing: '0.5px',
                }}
              >
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FactRow({
  citation,
  text,
  stat,
  accent,
}: {
  citation: string
  text: string
  stat: string
  accent: string
}) {
  return (
    <div
      style={{
        padding: '18px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Citation chevron */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            fontSize: 12,
            color: accent,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            marginTop: 1,
            flexShrink: 0,
          }}
        >
          ▶
        </span>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#64748b',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            fontFamily: '"Exo 2", sans-serif',
          }}
        >
          {citation}
        </p>
      </div>
      <p
        style={{
          fontSize: 13,
          color: '#94a3b8',
          margin: '0 0 10px',
          lineHeight: 1.65,
          paddingLeft: 22,
        }}
      >
        {text}
      </p>
      <div style={{ paddingLeft: 22 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: accent,
            margin: 0,
            fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
            background: `rgba(0,0,0,0.4)`,
            border: `1px solid ${accent}33`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 6px 6px 0',
            padding: '6px 12px',
            display: 'inline-block',
            lineHeight: 1.5,
            letterSpacing: '0.3px',
          }}
        >
          {stat}
        </p>
      </div>
    </div>
  )
}

function ScienceCard({
  number,
  discipline,
  title,
  color,
  colorDim,
  colorBorder,
  colorText,
  facts,
}: (typeof SCIENCE_CARDS)[number]) {
  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0f1923 0%, #0c151f 100%)',
        border: `1px solid ${colorBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header stripe with diagonal chevron motif */}
      <div
        style={{
          background: colorDim,
          borderBottom: `1px solid ${colorBorder}`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Diagonal stripe decoration */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -20,
            top: -10,
            width: 120,
            height: 80,
            background: `repeating-linear-gradient(
              -55deg,
              transparent,
              transparent 6px,
              ${color}10 6px,
              ${color}10 12px
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* Card number */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: color,
              fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
              letterSpacing: '1px',
            }}
          >
            {number}
          </span>
        </div>

        <div>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: colorText,
              margin: '0 0 3px',
              fontFamily: '"Exo 2", sans-serif',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: 0.8,
            }}
          >
            {discipline}
          </p>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: '#f1f5f9',
              margin: 0,
              fontFamily: '"Exo 2", sans-serif',
              letterSpacing: '-0.3px',
            }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Facts */}
      {facts.map((fact, i) => (
        <FactRow
          key={i}
          citation={fact.citation}
          text={fact.text}
          stat={fact.stat}
          accent={color}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TriathlonSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080f18', color: '#f8fafc' }}>

      {/* ── Global styles & fonts ─────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Exo+2:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body { margin: 0; }

        /* Discipline orb pulse animations */
        @keyframes disciplinePulse0 {
          0%, 100% { box-shadow: 0 0 16px rgba(6,182,212,0.33); }
          50%       { box-shadow: 0 0 28px rgba(6,182,212,0.60), 0 0 48px rgba(6,182,212,0.18); }
        }
        @keyframes disciplinePulse1 {
          0%, 100% { box-shadow: 0 0 16px rgba(16,185,129,0.33); }
          50%       { box-shadow: 0 0 28px rgba(16,185,129,0.60), 0 0 48px rgba(16,185,129,0.18); }
        }
        @keyframes disciplinePulse2 {
          0%, 100% { box-shadow: 0 0 16px rgba(249,115,22,0.33); }
          50%       { box-shadow: 0 0 28px rgba(249,115,22,0.60), 0 0 48px rgba(249,115,22,0.18); }
        }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes disciplineFlowBar {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes raceBibFlash {
          0%, 90%, 100% { opacity: 1; }
          95%            { opacity: 0.6; }
        }
        @keyframes marqueePulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.6; }
        }

        .tri-hero-tag {
          animation: heroFadeIn 0.6s ease both;
        }
        .tri-hero-h1 {
          animation: heroFadeUp 0.7s ease 0.1s both;
        }
        .tri-hero-sub {
          animation: heroFadeUp 0.7s ease 0.25s both;
        }
        .tri-hero-flow {
          animation: heroFadeUp 0.7s ease 0.4s both;
        }
        .tri-stats-row {
          animation: heroFadeUp 0.7s ease 0.5s both;
        }

        /* Discipline flow bar animation */
        .flow-bar-inner {
          transform-origin: left center;
          animation: disciplineFlowBar 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s both;
        }

        /* Race bib flash */
        .race-bib {
          animation: raceBibFlash 4s ease-in-out infinite;
        }

        /* Ticker marquee pulse */
        .ticker-label {
          animation: marqueePulse 3s ease-in-out infinite;
        }

        /* Diagonal chevron stripes on hero */
        .hero-chevron-left {
          position: absolute;
          left: 0;
          top: 0;
          width: 220px;
          height: 100%;
          background: repeating-linear-gradient(
            -60deg,
            transparent,
            transparent 14px,
            rgba(6,182,212,0.04) 14px,
            rgba(6,182,212,0.04) 28px
          );
          pointer-events: none;
        }
        .hero-chevron-right {
          position: absolute;
          right: 0;
          top: 0;
          width: 220px;
          height: 100%;
          background: repeating-linear-gradient(
            -60deg,
            transparent,
            transparent 14px,
            rgba(249,115,22,0.04) 14px,
            rgba(249,115,22,0.04) 28px
          );
          pointer-events: none;
        }
      `}} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(175deg, #030810 0%, #080f18 30%, #080d14 60%, #030810 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 64,
          paddingBottom: 56,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Diagonal stripe decorations */}
        <div className="hero-chevron-left" aria-hidden />
        <div className="hero-chevron-right" aria-hidden />

        {/* Discipline color gradient wash at top */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 33%, #10b981 66%, #f97316 100%)',
          }}
        />

        {/* Subtle grid */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>

          {/* Race bib number tag */}
          <div className="tri-hero-tag" style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <div
              className="race-bib"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: 8,
                padding: '6px 16px',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#06b6d4',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  fontFamily: '"Exo 2", sans-serif',
                }}
              >
                Sports Science
              </span>
              <span style={{ width: 1, height: 12, background: 'rgba(6,182,212,0.3)', display: 'inline-block' }} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#0ea5e9',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontFamily: '"Exo 2", sans-serif',
                  opacity: 0.75,
                }}
              >
                Evidence-Based
              </span>
            </div>
          </div>

          <h1
            className="tri-hero-h1"
            style={{
              fontSize: 'clamp(44px, 9vw, 80px)',
              fontWeight: 900,
              margin: '0 0 6px',
              lineHeight: 0.95,
              letterSpacing: '-2px',
              fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              TRIATHLON
            </span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SCIENCE
            </span>
          </h1>

          <p
            className="tri-hero-sub"
            style={{
              fontSize: 16,
              color: '#64748b',
              margin: '18px auto 0',
              lineHeight: 1.6,
              maxWidth: 580,
              fontFamily: '"Exo 2", sans-serif',
              fontWeight: 400,
            }}
          >
            Multi-sport physiology, brick adaptation, and race strategy — decoded from peer-reviewed research.
            Swim to bike to run: every transition, every watt, every second.
          </p>

          {/* Discipline flow indicator */}
          <div
            className="tri-hero-flow"
            style={{
              marginTop: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
            }}
          >
            {[
              { label: 'SWIM', color: '#06b6d4', width: '28%' },
              { label: 'BIKE', color: '#10b981', width: '50%' },
              { label: 'RUN', color: '#f97316', width: '22%' },
            ].map((seg, i) => (
              <div key={seg.label} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: `linear-gradient(135deg, ${[
                        '#06b6d4','#10b981','#f97316'
                      ][i - 1]}, ${seg.color})`,
                      clipPath: 'polygon(0 0, 14px 50%, 0 100%, 20px 100%, 20px 0)',
                      flexShrink: 0,
                      opacity: 0.6,
                    }}
                    aria-hidden
                  />
                )}
                <div
                  style={{
                    height: 32,
                    width: `clamp(80px, ${seg.width}, 180px)`,
                    background: `${seg.color}18`,
                    border: `1px solid ${seg.color}40`,
                    borderRadius: i === 0 ? '4px 0 0 4px' : i === 2 ? '0 4px 4px 0' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    className="flow-bar-inner"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, ${seg.color}20, ${seg.color}10)`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: seg.color,
                      letterSpacing: '2.5px',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {seg.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Ticker */}
          <p
            className="tri-hero-flow ticker-label"
            style={{
              marginTop: 10,
              fontSize: 10,
              color: '#334155',
              letterSpacing: '1px',
              fontFamily: '"Exo 2", sans-serif',
              textTransform: 'uppercase',
            }}
          >
            Swim → T1 → Bike → T2 → Run
          </p>
        </div>
      </div>

      {/* ── KEY STATS ─────────────────────────────────────────────────────── */}
      <div
        className="tri-stats-row"
        style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 0' }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((s) => (
            <KeyStatCard key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* ── DISCIPLINE BREAKDOWN ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '32px auto 0', padding: '0 20px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: '#334155',
              margin: 0,
              fontFamily: '"Exo 2", sans-serif',
            }}
          >
            Discipline Overview
          </p>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {DISCIPLINES.map((d, i) => (
            <DisciplineCard key={d.id} d={d} index={i} />
          ))}
        </div>
      </div>

      {/* ── RACE DISTANCES ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '28px auto 0', padding: '0 20px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: '#334155',
              margin: 0,
              fontFamily: '"Exo 2", sans-serif',
            }}
          >
            Race Distances
          </p>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div
          style={{
            background: 'linear-gradient(160deg, #0f1923 0%, #0c151f 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.25)',
              display: 'flex',
              gap: 24,
            }}
          >
            <span style={{ minWidth: 90, fontSize: 9, fontWeight: 700, color: '#334155', fontFamily: '"Exo 2", sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Race</span>
            {['SWIM', 'BIKE', 'RUN'].map((h) => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', fontFamily: '"Exo 2", sans-serif', textTransform: 'uppercase', letterSpacing: '1.5px', minWidth: 60 }}>
                {h}
              </span>
            ))}
          </div>
          {RACE_DISTANCES.map((race, i) => (
            <RaceDistanceRow key={race.name} race={race} i={i} />
          ))}
        </div>
      </div>

      {/* ── SCIENCE CARDS ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '32px auto 0', padding: '0 20px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 4px',
                fontFamily: '"Exo 2", sans-serif',
              }}
            >
              Peer-Reviewed Research
            </p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#f1f5f9',
                margin: 0,
                fontFamily: '"Barlow Condensed", "Exo 2", sans-serif',
                letterSpacing: '-0.5px',
                textTransform: 'uppercase',
              }}
            >
              The Science, Cited
            </p>
          </div>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 4 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* Disclaimer footer */}
        <div
          style={{
            marginTop: 28,
            marginBottom: 80,
            padding: '16px 20px',
            background: 'rgba(15,25,35,0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            borderLeft: '3px solid rgba(6,182,212,0.4)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: '#334155',
              margin: 0,
              lineHeight: 1.65,
              fontFamily: '"Exo 2", sans-serif',
            }}
          >
            <span style={{ color: '#475569', fontWeight: 700 }}>Disclaimer:</span> This page
            summarises peer-reviewed research from physiology, biomechanics, and sports medicine.
            Effect sizes are from population studies and RCTs; individual variation is significant.
            Triathlon training should be progressively loaded and supervised by qualified coaches,
            particularly for brick workouts and Ironman preparation. Consult a sports physician
            before beginning multi-sport training programmes.
          </p>
        </div>
      </div>
    </div>
  )
}
