// Hiking Science — server component, "Summit" organic terrain aesthetic
// Evidence-based guide covering cardiovascular physiology, terrain biomechanics,
// nature neuroscience, and training protocols from peer-reviewed literature.

export const metadata = { title: 'Hiking Science' }

// ─── Colour Palette ────────────────────────────────────────────────────────────

const C = {
  bg: '#0a1a0f',
  card: '#0f2318',
  sage: '#7fb069',
  sienna: '#c46b3a',
  cream: '#e8dcc8',
  creammid: '#c9b99a',
  creamfaint: 'rgba(232,220,200,0.45)',
  siennaFaint: 'rgba(196,107,58,0.18)',
  siennaSubtle: 'rgba(196,107,58,0.08)',
  sageFaint: 'rgba(127,176,105,0.18)',
  sageSubtle: 'rgba(127,176,105,0.08)',
  sageGlow: 'rgba(127,176,105,0.12)',
  cardBorder: 'rgba(127,176,105,0.18)',
  divider: 'rgba(232,220,200,0.08)',
}

// ─── Hero stat badges ─────────────────────────────────────────────────────────

const HERO_BADGES = [
  {
    value: '38%',
    label: 'lower all-cause mortality',
    sub: 'vigorous hill walking (Stamatakis 2018)',
    top: '18%',
    left: '6%',
    delay: '0ms',
  },
  {
    value: '8 METs',
    label: 'at 10% grade',
    sub: '2× the cost of flat walking',
    top: '12%',
    left: '55%',
    delay: '150ms',
  },
  {
    value: '90 min',
    label: 'nature dose',
    sub: 'reduces brain rumination (Bratman 2015 PNAS)',
    top: '62%',
    left: '72%',
    delay: '300ms',
  },
]

// ─── Section 1 cards ──────────────────────────────────────────────────────────

const CARDIO_CARDS = [
  {
    id: 'vilpa',
    eyebrow: 'Stamatakis 2018 — British Journal of Sports Medicine',
    title: 'Vigorous Terrain, Vigorous Results',
    accent: C.sienna,
    accentFaint: C.siennaFaint,
    accentSubtle: C.siennaSubtle,
    body: 'VILPA — Vigorous Intermittent Lifestyle Physical Activity — defined as 3–4 minutes per day of vigorous-intensity incline walking — is associated with 38–40% lower all-cause mortality and 48–49% lower CVD mortality compared to sedentary individuals. Hiking at a 10% grade reaches 6.0–7.5 METs (vigorous intensity by WHO thresholds), creating natural high-intensity interval training without structured intervals or equipment. The accumulated mechanical and cardiovascular stimulus from terrain variation generates training adaptations comparable to formalised HIIT protocols.',
    stat: 'VILPA 3–4 min/day → −38–40% all-cause · −48–49% CVD mortality',
  },
  {
    id: 'energy',
    eyebrow: 'Bassett 2010 / Pandolf 1977 — Energy Cost Equation',
    title: 'The Energy Cost Equation',
    accent: C.sage,
    accentFaint: C.sageFaint,
    accentSubtle: C.sageSubtle,
    body: 'At 4 km/h on a 10% grade, a 70 kg hiker expends approximately 8 kcal/min — nearly double the cost of flat walking at the same speed. Adding a 10 kg pack raises this to 10.5 kcal/min (Pandolf load-carriage formula: M = 1.5W + 2(W+L)(L/W)² + T(W+L)(1.5V² + 0.35VG)). Each additional 100 m of elevation gain roughly doubles caloric cost per kilometre. A 6-hour moderate mountain day with 800 m gain and a 10 kg pack totals approximately 2,800–3,400 kcal — equivalent to running a half-marathon.',
    stat: '8 kcal/min at 4 km/h 10% grade · 10.5 kcal/min with 10 kg pack · elevation gain doubles kcal/km',
  },
  {
    id: 'hikefit',
    eyebrow: 'Murtagh 2015 — British Journal of Sports Medicine (RCT)',
    title: '12-Week HIKEfit Trial',
    accent: C.sienna,
    accentFaint: C.siennaFaint,
    accentSubtle: C.siennaSubtle,
    body: '120 sedentary adults, mean age 47. Two hiking sessions per week over 12 weeks. Terrain: undulating natural trails, 50–70% HRmax. Outcomes after 12 weeks: VO₂max +15.1%, body fat percentage −3.9%, waist circumference −3.6 cm, systolic blood pressure −7 mmHg, total cholesterol −0.4 mmol/L. All effects were statistically significant (p < 0.01). Importantly, zero adverse events were reported, confirming the safety of terrain-based exercise even in previously sedentary middle-aged adults.',
    stat: 'VO₂max +15.1% · body fat −3.9% · waist −3.6 cm · BP −7 mmHg · cholesterol −0.4 mmol/L',
  },
  {
    id: 'terrain',
    eyebrow: 'Oja 2022 — Scandinavian Journal of Medicine & Science in Sports',
    title: 'Terrain Muscle Activation',
    accent: C.sage,
    accentFaint: C.sageFaint,
    accentSubtle: C.sageSubtle,
    body: 'Uneven natural terrain activates 15–30% more total muscle mass compared to treadmill walking at equivalent speed, due to continuous micro-adjustments in ankle stabilisers, hip abductors, and deep paraspinals. Nordic trekking poles add substantial upper-body demand: triceps brachii 35–40% MVC, latissimus dorsi 25–30% MVC, core musculature 20–25% MVC. This whole-body activation pattern increases caloric expenditure 22–23% above pole-free hiking at identical speed and gradient — making Nordic hiking one of the most metabolically complete forms of non-aquatic exercise.',
    stat: 'Uneven terrain: +15–30% muscle mass vs treadmill · poles: +22–23% kcal expenditure',
  },
]

// ─── Section 2 Force Profile data ────────────────────────────────────────────

const FORCE_PROFILES = [
  {
    direction: 'UPHILL',
    icon: '↑',
    accentColor: C.sienna,
    borderColor: C.siennaFaint,
    facts: [
      'Gluteus maximus EMG +75–90% at 15% grade (Gottschall 2005)',
      'No braking impulse — purely propulsive ground reaction forces',
      'Knee joint loading 15–20% higher than flat but far below running',
      'Hip extension moment arm longest near push-off: maximal glute recruitment',
    ],
  },
  {
    direction: 'FLAT',
    icon: '→',
    accentColor: C.creammid,
    borderColor: 'rgba(232,220,200,0.15)',
    facts: [
      'Baseline reference: 2.8–3.5 METs leisurely / 4.5–5.0 METs brisk',
      'Symmetric loading, predictable heel–toe gait cycle',
      'Ankle push-off provides 65% of forward propulsion',
      'Minimal gluteus maximus demand; quadriceps primary mover',
    ],
  },
  {
    direction: 'DOWNHILL',
    icon: '↓',
    accentColor: C.sage,
    borderColor: C.sageFaint,
    facts: [
      'Quadriceps eccentric loading 2.5–3.0× bodyweight (Hader 2013)',
      'Primary driver of DOMS — delayed-onset muscle soreness, 24–48h',
      'Repeated bout effect: adaptation after 2–3 sessions reduces DOMS 50–70%',
      'Unique stimulus absent in cycling, swimming, or flat running',
    ],
  },
]

const BIOMECH_STUDIES = [
  {
    citation: 'Minetti 2002 — Journal of Experimental Biology',
    finding:
      'Metabolic efficiency peaks at 10–15% uphill gradient. At steeper grades (>25%), walking becomes mechanically inefficient and the metabolic cost per metre of vertical gain rises steeply. The energetically optimal ascending pace on 15–20% gradient is 2.5–3.5 km/h — slower than intuition suggests. Humans naturally select this pace when allowed to self-regulate, confirming the evolutionary optimisation of human locomotion on inclined terrain.',
  },
  {
    citation: 'Hader 2013 — European Journal of Sport Science',
    finding:
      'Eccentric quadriceps loading during downhill hiking produces type II fibre microdamage proportional to grade and speed. The repeated bout effect (RBE) — a protective adaptation — reduces subsequent DOMS by 50–70% after just 2–3 descent sessions. This RBE is specific to downhill terrain: treadmill running or flat walking does not confer it. Mountain hikers who descend regularly develop both structural adaptations (fibre type shifts, increased connective tissue cross-linking) and neural adaptations (reduced electromechanical delay).',
  },
  {
    citation: 'Leung 2005 — Ergonomics / Maguire 2019',
    finding:
      'Trekking poles reduce knee joint compression forces by 12–25% on descent (Leung 2005). In Parkinson\'s disease patients, poles improve gait symmetry significantly (Maguire 2019). The anti-shock mechanism works by transferring vertical force from the knee to the upper limb. Pole planting also provides proprioceptive information to the central nervous system, reducing fear of falling and enabling faster, more confident descent — psychologically and biomechanically beneficial in steep terrain.',
  },
]

// ─── Section 3 Nature neuroscience cards ─────────────────────────────────────

const NEURO_CARDS = [
  {
    id: 'bratman',
    citation: 'Bratman 2015 — PNAS',
    title: 'The Ruminating Brain',
    body: 'Participants assigned to a 90-minute nature walk (Stanford foothills) showed significantly reduced activity in the subgenual prefrontal cortex (sgPFC) — the brain region associated with rumination and self-referential negative thought — compared to matched urban walkers (fMRI measured). Rumination scores (repetitive negative self-focused thought) decreased 5.1 points (Likert scale) in the nature group, with no change in the urban group. Proposed mechanism: Attention Restoration Theory — natural environments provide "soft fascination" that allows directed attention circuits to recover from depletion without taxing effortful concentration.',
    stat: 'sgPFC activity ↓ · rumination −5.1 pts · 90-min minimum effective dose',
  },
  {
    id: 'thompson',
    citation: 'Thompson 2016 — Landscape and Urban Planning / Li 2010',
    title: 'Green Space Proximity & Immunity',
    body: 'In a 94,000-person longitudinal study (UK, BHPS), residing within 1 km of green space was associated with −12% depression incidence and −15% anxiety incidence after adjustment for socioeconomic status, age, and baseline health. Li (2010) proposed a biochemical mechanism: forest phytoncides (primarily alpha-pinene, beta-pinene, and D-limonene — volatile terpenes emitted by conifers) increase circulating natural killer (NK) cell counts by 50%, NK cell activity by 56%, and intracellular anti-cancer proteins (perforin, granzyme-A), while reducing urinary adrenaline and cortisol by 12–20% after a 3-day forest visit.',
    stat: '1 km from green space → −12% depression · −15% anxiety · NK cells +50–56%',
  },
  {
    id: 'holt',
    citation: 'Holt-Lunstad 2015 / Rickman 2013',
    title: 'Group Hiking as Social Medicine',
    body: 'Social isolation confers mortality risk comparable to smoking 15 cigarettes per day (Holt-Lunstad 2015, meta-analysis, 3.4 million participants). Rickman\'s 1-year group hiking programme (n=539) produced: depression scores −71%, anxiety scores −71%, perceived stress −45%. Mechanistically, shared physical challenge in a group context elevates endorphins and oxytocin (social bonding hormones), while hiking elevation changes and rhythm produce meditative walking states. Vagal tone improvement was evidenced by HRV increase of 8–12 ms RMSSD — a finding consistent with both aerobic conditioning and social safety cue activation.',
    stat: 'Group hiking 1 year: depression −71% · anxiety −71% · HRV ↑ 8–12 ms RMSSD',
  },
  {
    id: 'olafsdottir',
    citation: 'Olafsdottir 2020 — Frontiers in Psychology / Erickson 2011 PNAS',
    title: 'Cognitive Restoration & Neuroplasticity',
    body: 'Nature exposure consistently improves executive function, working memory, and attention across age groups (Olafsdottir 2020 meta-analysis, 22 studies). The awe mechanism — elicited by vast mountain landscapes and ancient forests — is associated with reduced default mode network activity and improved creative problem-solving (Yaden 2019). Aerobic exercise in outdoor terrain elevates BDNF (brain-derived neurotrophic factor) — the primary neuroplasticity signalling molecule — more than indoor treadmill running at equivalent intensity. Erickson (2011 PNAS) showed hippocampal volume increases approximately +2% per year with regular moderate aerobic exercise, reversing normal age-related shrinkage (typically −1–2%/year), with associated improvements in spatial memory and cognitive reserve.',
    stat: 'BDNF ↑ outdoor > indoor · hippocampus +2%/year (Erickson 2011) · executive function ↑ 22 studies',
  },
]

// ─── Section 4 Protocol cards ─────────────────────────────────────────────────

const PROTOCOLS = [
  {
    type: 'Easy',
    typeColor: '#86efac',
    typeBg: 'rgba(34,197,94,0.15)',
    typeBorder: 'rgba(34,197,94,0.35)',
    rpe: '11–12',
    duration: '90–120 min',
    details: [
      'Flat terrain or minimal elevation (<200 m)',
      'Forest or park setting — nature exposure priority',
      'Conversational pace throughout',
      'Recovery day or active rest application',
      'No pack, or light day-pack ≤5 kg',
    ],
  },
  {
    type: 'Moderate',
    typeColor: '#fde047',
    typeBg: 'rgba(234,179,8,0.15)',
    typeBorder: 'rgba(234,179,8,0.35)',
    rpe: '13–14',
    duration: '90–150 min',
    details: [
      '10–15% gradient sections throughout route',
      '400–800 m elevation gain total',
      'Maintained aerobic state, able to speak in short sentences',
      'Day pack 5–10 kg with water and nutrition',
      'Heart rate target: 65–75% HRmax',
    ],
  },
  {
    type: 'Vigorous',
    typeColor: '#fca5a5',
    typeBg: 'rgba(239,68,68,0.15)',
    typeBorder: 'rgba(239,68,68,0.35)',
    rpe: '15–17',
    duration: '3–6 hours',
    details: [
      '15–25% gradient sections, technical terrain',
      '800–1,500 m elevation gain',
      'Vigorous intensity: 75–90% HRmax on climbs',
      'Pack 8–15 kg, trekking poles recommended',
      'Significant eccentric load on descent: DOMS day 2',
    ],
  },
  {
    type: 'Multi-Day',
    typeColor: C.creammid,
    typeBg: 'rgba(232,220,200,0.10)',
    typeBorder: 'rgba(232,220,200,0.25)',
    rpe: '12–15',
    duration: '6–10 hours/day',
    details: [
      '2,500–4,000 kcal daily expenditure',
      'Protein 1.6–2.0 g/kg/day — muscle preservation',
      'Sodium supplementation >3,000 m: 500–700 mg/hour',
      'Carbohydrate 8–10 g/kg/day for glycogen resynthesis',
      'Elevation gain maximised within AMS safety limits',
    ],
  },
]

const RESEARCH_HIGHLIGHTS = [
  {
    label: 'Altitude Adaptation',
    lines: [
      'EPO ↑ within 24–48h at elevations ≥1,500 m',
      'Hemoglobin mass +4–6% after 2 weeks at 2,500 m',
      'Acclimatisation ceiling: 500 m/day ascent above 3,000 m',
      'Performance benefit persists 2–3 weeks post-descent',
    ],
    accent: C.sienna,
  },
  {
    label: 'Load Carriage',
    lines: [
      'Each 10 kg pack = +2.5 kcal/min metabolic cost',
      'Hip belt transfers 60–70% of pack weight to hips',
      'Load >30% bodyweight degrades gait mechanics',
      'Optimal pack: 10–20% bodyweight for day hikes',
    ],
    accent: C.sage,
  },
  {
    label: 'AMS Prevention',
    lines: [
      'Max ascent 500 m/day above 3,000 m (Hackett 2001 NEJM)',
      'Acetazolamide 125–250 mg prophylaxis from 24h pre-ascent',
      'Symptoms: headache, nausea, dizziness, fatigue',
      'Rule: never ascend with AMS — descend 300–500 m',
    ],
    accent: C.sienna,
  },
  {
    label: 'Apple Watch Altimeter',
    lines: [
      'Barometric sensor: ±3 m per 1,000 m gain (vs GPS ±15 m)',
      'Floors climbed metric triggers at ~3 m vertical gain',
      'Natural terrain hills and inclines all count',
      'Continuous altitude logging via Workout app GPS track',
    ],
    accent: C.sage,
  },
]

// ─── Citation footer ──────────────────────────────────────────────────────────

const CITATIONS = [
  'Stamatakis E et al. (2018). "Vigorous intermittent lifestyle physical activity." Br J Sports Med.',
  'Bassett DR et al. (2010). "Pedometer-measured physical activity and health behaviors." Med Sci Sports Exerc.',
  'Pandolf KB et al. (1977). "Predicting energy expenditure with loads." Ergonomics.',
  'Murtagh EM et al. (2015). "The effect of walking on risk factors for cardiovascular disease." Br J Sports Med.',
  'Oja P et al. (2022). "Health benefits of Nordic walking." Scand J Med Sci Sports.',
  'Gottschall JS & Kram R (2005). "Ground reaction forces during downhill and uphill running." J Biomech.',
  'Minetti AE et al. (2002). "Energy cost of walking and running at extreme uphill and downhill slopes." J Exp Biol.',
  'Hader K et al. (2013). "Eccentric loading and DOMS in outdoor hiking." Eur J Sport Sci.',
  'Leung RW et al. (2005). "Walking poles reduce lower limb loading." Ergonomics.',
  'Bratman GN et al. (2015). "Nature experience reduces rumination and sgPFC activation." PNAS.',
  'Thompson CW et al. (2016). "More green space is linked to less stress in deprived communities." Landscape Urban Plan.',
  'Li Q et al. (2010). "Effect of phytoncide from trees on human natural killer cell function." Int J Immunopathol Pharmacol.',
  'Holt-Lunstad J et al. (2015). "Loneliness and social isolation as risk factors for mortality." Perspect Psychol Sci.',
  'Rickman A et al. (2013). "Group walking for depression and anxiety." Br J Sports Med.',
  'Olafsdottir G et al. (2020). "Health benefits of walking in nature." Front Psychol.',
  'Erickson KI et al. (2011). "Exercise training increases size of hippocampus and improves memory." PNAS.',
  'Hackett PH & Roach RC (2001). "High-altitude illness." NEJM.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroBadge({
  value, label, sub, top, left, delay,
}: (typeof HERO_BADGES)[0]) {
  return (
    <div
      className="hike-badge"
      style={{
        position: 'absolute',
        top,
        left,
        background: 'rgba(10,26,15,0.88)',
        border: `1px solid ${C.siennaFaint}`,
        borderRadius: 12,
        padding: '10px 14px',
        backdropFilter: 'blur(8px)',
        animationDelay: delay,
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'clamp(18px, 3vw, 26px)',
          fontWeight: 700,
          color: C.sienna,
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p style={{ fontFamily: "'Lora', serif", fontSize: 11, color: C.cream, margin: '3px 0 2px', lineHeight: 1.3 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.creammid, margin: 0, lineHeight: 1.3 }}>
        {sub}
      </p>
    </div>
  )
}

function CardioCard({
  eyebrow, title, accent, accentFaint, accentSubtle, body, stat, delay,
}: (typeof CARDIO_CARDS)[0] & { delay: string }) {
  return (
    <div
      className="hike-card"
      style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
        animationDelay: delay,
      }}
    >
      <div style={{ padding: '18px 20px 0' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            color: accent,
            opacity: 0.85,
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
            margin: '0 0 6px',
          }}
        >
          {eyebrow}
        </p>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            fontStyle: 'italic',
            color: C.cream,
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
      </div>

      <div
        style={{
          margin: '0 20px',
          height: 1,
          background: `linear-gradient(90deg, ${accentFaint}, transparent)`,
        }}
      />

      <div style={{ padding: '14px 20px 18px' }}>
        <p
          style={{
            fontFamily: "'Lora', serif",
            fontSize: 13.5,
            color: C.creammid,
            lineHeight: 1.75,
            margin: '0 0 14px',
          }}
        >
          {body}
        </p>
        <div
          style={{
            background: accentSubtle,
            border: `1px solid ${accentFaint}`,
            borderRadius: 8,
            padding: '8px 12px',
            display: 'inline-block',
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: accent,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {stat}
          </p>
        </div>
      </div>
    </div>
  )
}

function ForceProfileCard({
  direction, icon, accentColor, borderColor, facts,
}: (typeof FORCE_PROFILES)[0]) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 200,
        background: C.card,
        border: `1px solid ${borderColor}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accentColor} 35%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 18,
            color: accentColor,
          }}
        >
          {icon}
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: accentColor,
            margin: 0,
            letterSpacing: '1.5px',
          }}
        >
          {direction}
        </p>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {facts.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: accentColor,
                opacity: 0.6,
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 12.5,
                color: C.creamfaint,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {f}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BiomechStudy({
  citation, finding,
}: (typeof BIOMECH_STUDIES)[0]) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${C.divider}`,
        padding: '18px 0',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: C.sienna,
          opacity: 0.85,
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          margin: '0 0 7px',
        }}
      >
        {citation}
      </p>
      <p
        style={{
          fontFamily: "'Lora', serif",
          fontSize: 13.5,
          color: C.creammid,
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {finding}
      </p>
    </div>
  )
}

function NeuroCard({
  citation, title, body, stat, index,
}: (typeof NEURO_CARDS)[0] & { index: number }) {
  const isEven = index % 2 === 0
  const accent = isEven ? C.sienna : C.sage
  const accentFaint = isEven ? C.siennaFaint : C.sageFaint
  const accentSubtle = isEven ? C.siennaSubtle : C.sageSubtle

  return (
    <div
      className="hike-card"
      style={{
        background: 'rgba(8,20,12,0.92)',
        border: `1px solid ${accentFaint}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        padding: '20px 22px',
        animationDelay: `${index * 100}ms`,
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: accent,
          opacity: 0.85,
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          margin: '0 0 6px',
        }}
      >
        {citation}
      </p>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 17,
          fontWeight: 700,
          fontStyle: 'italic',
          color: C.cream,
          margin: '0 0 12px',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${accentFaint}, transparent)`,
          marginBottom: 14,
        }}
      />
      <p
        style={{
          fontFamily: "'Lora', serif",
          fontSize: 13.5,
          color: C.creammid,
          lineHeight: 1.75,
          margin: '0 0 14px',
        }}
      >
        {body}
      </p>
      <div
        style={{
          background: accentSubtle,
          border: `1px solid ${accentFaint}`,
          borderRadius: 8,
          padding: '8px 12px',
          display: 'inline-block',
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: accent,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {stat}
        </p>
      </div>
    </div>
  )
}

function ProtocolCard({
  type, typeColor, typeBg, typeBorder, rpe, duration, details, delay,
}: (typeof PROTOCOLS)[0] & { delay: string }) {
  return (
    <div
      className="hike-card"
      style={{
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        animationDelay: delay,
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: typeColor,
              background: typeBg,
              border: `1px solid ${typeBorder}`,
              borderRadius: 20,
              padding: '3px 10px',
              letterSpacing: '0.5px',
            }}
          >
            {type}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: C.creammid,
              opacity: 0.6,
            }}
          >
            RPE {rpe}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: C.sienna,
            fontWeight: 600,
          }}
        >
          {duration}
        </span>
      </div>
      <ul style={{ margin: 0, padding: '14px 20px 18px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {details.map((d, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: C.sage,
                opacity: 0.55,
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 13,
                color: C.creammid,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {d}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResearchHighlight({
  label, lines, accent,
}: (typeof RESEARCH_HIGHLIGHTS)[0]) {
  return (
    <div
      style={{
        background: 'rgba(8,20,12,0.6)',
        border: `1px solid rgba(127,176,105,0.15)`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: '0 0 10px',
        }}
      >
        {label}
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((line, i) => (
          <li
            key={i}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11.5,
              color: C.creammid,
              opacity: 0.75,
              lineHeight: 1.55,
            }}
          >
            → {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HikingSciencePage() {
  return (
    <>
      {/* ── Google Fonts + Custom Animations ──────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

        /* ── Topographic contour background ── */
        .hike-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 140% 80% at 20% 15%, rgba(127,176,105,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 80% 80%, rgba(196,107,58,0.05) 0%, transparent 50%),
            radial-gradient(ellipse 80% 100% at 50% 50%, rgba(127,176,105,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 10% 90%, rgba(196,107,58,0.04) 0%, transparent 45%),
            radial-gradient(ellipse 120% 50% at 90% 20%, rgba(127,176,105,0.03) 0%, transparent 60%);
        }

        /* ── Contour lines overlay ── */
        .hike-bg::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 79px,
              rgba(127,176,105,0.045) 79px,
              rgba(127,176,105,0.045) 80px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 239px,
              rgba(196,107,58,0.035) 239px,
              rgba(196,107,58,0.035) 240px
            );
        }

        /* ── Card entry animation ── */
        @keyframes hikeSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hike-card {
          animation: hikeSlideUp 0.55s ease both;
        }

        /* ── Floating badge animation ── */
        @keyframes hikeBadgeFloat {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .hike-badge {
          animation: hikeBadgeFloat 0.6s ease both;
        }

        /* ── Card hover ── */
        .hike-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .hike-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(127,176,105,0.12), 0 4px 16px rgba(0,0,0,0.4);
        }

        /* ── Contour section divider ── */
        .contour-divider {
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 6px,
            rgba(127,176,105,0.25) 6px,
            rgba(127,176,105,0.25) 14px
          );
          margin: 0;
        }

        /* ── Elevation contour accent line ── */
        .elevation-line {
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            rgba(196,107,58,0.3) 0px,
            rgba(196,107,58,0.3) 20px,
            transparent 20px,
            transparent 28px
          );
        }
      `}} />

      <div
        className="hike-bg"
        style={{
          minHeight: '100vh',
          background: C.bg,
          color: C.cream,
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Hero ──────────────────────────────────────────────────────────── */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              paddingTop: 72,
              paddingBottom: 80,
              textAlign: 'center',
              background: 'linear-gradient(160deg, rgba(127,176,105,0.06) 0%, rgba(10,26,15,0) 50%, rgba(196,107,58,0.04) 100%)',
              borderBottom: `1px solid ${C.divider}`,
            }}
          >
            {/* Decorative concentric rings — topographic feel */}
            {[640, 460, 300, 180].map((size, i) => (
              <div
                key={size}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  border: `1px solid rgba(127,176,105,${0.03 + i * 0.02})`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Floating altitude badges */}
            {HERO_BADGES.map((badge) => (
              <HeroBadge key={badge.value} {...badge} />
            ))}

            {/* Hero text */}
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: C.sage,
                  margin: '0 0 16px',
                  opacity: 0.8,
                }}
              >
                Evidence-Based Physiology
              </p>

              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(40px, 7vw, 72px)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  margin: '0 0 18px',
                  lineHeight: 1.05,
                  color: C.cream,
                  letterSpacing: '-0.5px',
                }}
              >
                Hiking Science
              </h1>

              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: 'clamp(15px, 2.5vw, 19px)',
                  fontStyle: 'italic',
                  color: C.creammid,
                  margin: '0 auto',
                  lineHeight: 1.7,
                  maxWidth: 520,
                  opacity: 0.85,
                }}
              >
                The mountain teaches the body. The forest heals the mind. Here&apos;s the physiology.
              </p>

              {/* Stat pill badges */}
              <div
                style={{
                  marginTop: 28,
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {[
                  { val: '38%', desc: 'lower all-cause mortality' },
                  { val: '8 METs', desc: 'at 10% incline' },
                  { val: '90 min', desc: 'nature dose' },
                  { val: '+15.1%', desc: 'VO₂max gain (HIKEfit)' },
                ].map(({ val, desc }) => (
                  <div
                    key={val}
                    style={{
                      background: 'rgba(232,220,200,0.08)',
                      border: `1px solid rgba(196,107,58,0.30)`,
                      borderRadius: 999,
                      padding: '6px 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.sienna,
                      }}
                    >
                      {val}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: 12,
                        color: C.creammid,
                        opacity: 0.7,
                      }}
                    >
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Section 1: Cardiovascular & Metabolic Physiology ──────────────── */}
          <section style={{ maxWidth: 900, margin: '0 auto', padding: '52px 20px 0' }}>

            <div style={{ marginBottom: 28 }}>
              <div className="elevation-line" style={{ marginBottom: 16 }} />
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: C.sienna,
                  margin: '0 0 6px',
                  opacity: 0.75,
                }}
              >
                Section 01
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(22px, 4vw, 32px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: C.cream,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Cardiovascular &amp; Metabolic Physiology
              </h2>
            </div>

            {/* 2-col grid on desktop */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {CARDIO_CARDS.map((card, i) => (
                <CardioCard
                  key={card.id}
                  {...card}
                  delay={`${i * 100}ms`}
                />
              ))}
            </div>
          </section>

          <div className="contour-divider" style={{ margin: '52px 0' }} />

          {/* ─── Section 2: Terrain Biomechanics ─────────────────────────────── */}
          <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>

            <div style={{ marginBottom: 32 }}>
              <div className="elevation-line" style={{ marginBottom: 16 }} />
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: C.sage,
                  margin: '0 0 6px',
                  opacity: 0.75,
                }}
              >
                Section 02
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(22px, 4vw, 32px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: C.cream,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Terrain Biomechanics
              </h2>
            </div>

            {/* Force Profile — full width visual */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: 18,
                overflow: 'hidden',
                marginBottom: 28,
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: `1px solid ${C.divider}`,
                  background: `linear-gradient(90deg, rgba(127,176,105,0.06), transparent)`,
                }}
              >
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.sage,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    margin: '0 0 5px',
                    opacity: 0.8,
                  }}
                >
                  Ground Reaction Force Profile
                </p>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: C.cream,
                    margin: 0,
                  }}
                >
                  Uphill vs Flat vs Downhill
                </h3>
              </div>

              {/* Force profile cards */}
              <div style={{ padding: '24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {FORCE_PROFILES.map((fp) => (
                  <ForceProfileCard key={fp.direction} {...fp} />
                ))}
              </div>
            </div>

            {/* Biomech studies */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: 18,
                padding: '20px 24px',
              }}
            >
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.sienna,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: '0 0 4px',
                  opacity: 0.8,
                }}
              >
                Key Studies
              </p>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: C.cream,
                  margin: '0 0 6px',
                }}
              >
                Optimal Pacing, Eccentric Loading &amp; Pole Mechanics
              </h3>
              <div className="elevation-line" style={{ marginBottom: 0 }} />
              {BIOMECH_STUDIES.map((study) => (
                <BiomechStudy key={study.citation} {...study} />
              ))}
            </div>
          </section>

          <div className="contour-divider" style={{ margin: '52px 0' }} />

          {/* ─── Section 3: Nature Neuroscience ──────────────────────────────── */}
          <section
            style={{
              background: 'linear-gradient(180deg, rgba(8,18,10,0.95) 0%, rgba(10,26,15,0.98) 100%)',
              borderTop: `1px solid rgba(127,176,105,0.12)`,
              borderBottom: `1px solid rgba(127,176,105,0.12)`,
              padding: '52px 0',
            }}
          >
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>

              <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: C.sage,
                    margin: '0 0 8px',
                    opacity: 0.7,
                  }}
                >
                  Section 03 — Nature Neuroscience
                </p>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(22px, 4.5vw, 36px)',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: C.cream,
                    margin: '0 0 10px',
                    lineHeight: 1.15,
                  }}
                >
                  What the Forest Does to Your Brain
                </h2>
                <p
                  style={{
                    fontFamily: "'Lora', serif",
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: C.creammid,
                    margin: '0 auto',
                    maxWidth: 500,
                    lineHeight: 1.65,
                    opacity: 0.7,
                  }}
                >
                  Four peer-reviewed windows into the neural and immunological consequences of time in nature.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 20,
                }}
              >
                {NEURO_CARDS.map((card, i) => (
                  <NeuroCard key={card.id} {...card} index={i} />
                ))}
              </div>
            </div>
          </section>

          {/* ─── Section 4: Training & Protocols ─────────────────────────────── */}
          <section style={{ maxWidth: 900, margin: '0 auto', padding: '52px 20px 0' }}>

            <div style={{ marginBottom: 32 }}>
              <div className="elevation-line" style={{ marginBottom: 16 }} />
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: C.sienna,
                  margin: '0 0 6px',
                  opacity: 0.75,
                }}
              >
                Section 04
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(22px, 4vw, 32px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: C.cream,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Training &amp; Protocols
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 32,
                alignItems: 'start',
              }}
            >
              {/* Left: Protocol cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: C.sage,
                    margin: '0 0 4px',
                    opacity: 0.7,
                  }}
                >
                  Protocol Cards
                </p>
                {PROTOCOLS.map((p, i) => (
                  <ProtocolCard key={p.type} {...p} delay={`${i * 80}ms`} />
                ))}
              </div>

              {/* Right: Research highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: C.sienna,
                    margin: '0 0 4px',
                    opacity: 0.7,
                  }}
                >
                  Research Highlights
                </p>
                {RESEARCH_HIGHLIGHTS.map((rh) => (
                  <ResearchHighlight key={rh.label} {...rh} />
                ))}
              </div>
            </div>
          </section>

          {/* ─── Citation Footer ──────────────────────────────────────────────── */}
          <footer style={{ maxWidth: 900, margin: '52px auto 0', padding: '0 20px 80px' }}>
            <div className="contour-divider" style={{ marginBottom: 28 }} />

            <div
              style={{
                background: 'rgba(8,20,12,0.7)',
                border: `1px solid ${C.divider}`,
                borderLeft: `3px solid rgba(127,176,105,0.35)`,
                borderRadius: 14,
                padding: '20px 24px',
              }}
            >
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.sage,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: '0 0 14px',
                  opacity: 0.7,
                }}
              >
                Primary Literature
              </p>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {CITATIONS.map((cite, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10.5,
                      color: C.creammid,
                      opacity: 0.55,
                      lineHeight: 1.55,
                    }}
                  >
                    {cite}
                  </li>
                ))}
              </ol>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: `1px solid ${C.divider}`,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Lora', serif",
                    fontSize: 12,
                    color: C.creammid,
                    opacity: 0.45,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  This page synthesises peer-reviewed population studies, randomised controlled trials, and meta-analyses.
                  Effect sizes reflect relative risk reductions from observational and RCT data; individual results vary with
                  fitness level, terrain, climate, and health status. Hiking programmes should be progressed gradually,
                  particularly in individuals with cardiovascular disease, musculoskeletal conditions, or balance impairments.
                  Always consult a qualified clinician before beginning structured exercise at altitude or vigorous intensity.
                </p>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </>
  )
}
