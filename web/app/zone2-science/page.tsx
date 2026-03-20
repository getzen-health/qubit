// Zone 2 Science — "The Aerobic Engine Room"
// Deep, verdant, cellular design. Evidence-based Zone 2 physiology and training science.
// Server component — no "use client".

export const metadata = { title: 'Zone 2 Training Science' }

// ─── Color / token constants ──────────────────────────────────────────────────

const C = {
  bg: '#061208',
  card: '#0a1c0f',
  acid: '#7fff00',
  acidDim: 'rgba(127,255,0,0.12)',
  acidBorder: 'rgba(127,255,0,0.25)',
  acidGlow: 'rgba(127,255,0,0.08)',
  sage: '#9dc08b',
  sageDim: 'rgba(157,192,139,0.12)',
  sageBorder: 'rgba(157,192,139,0.25)',
  cream: '#f5f0e8',
  text: '#e8ede4',
  textSub: '#7a9b72',
  textMuted: '#2d4a28',
  border: '#122310',
  borderLight: '#1a3318',
  serif: "'Libre Baskerville', Georgia, serif",
  display: "'Archivo Black', 'Impact', sans-serif",
  mono: "'Courier Prime', 'Courier New', monospace",
} as const

// ─── Inline styles ─────────────────────────────────────────────────────────────

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Archivo+Black&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  body {
    background: ${C.bg};
    color: ${C.text};
  }

  .z2-card {
    background: ${C.card};
    border: 1px solid ${C.borderLight};
    border-left: 2px solid ${C.acid};
    border-radius: 14px;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  .z2-card:hover {
    box-shadow: 0 0 32px rgba(127,255,0,0.09), 0 0 8px rgba(127,255,0,0.06);
  }

  .z2-card-sage {
    background: ${C.card};
    border: 1px solid ${C.borderLight};
    border-left: 2px solid ${C.sage};
    border-radius: 14px;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  .z2-card-sage:hover {
    box-shadow: 0 0 32px rgba(157,192,139,0.09), 0 0 8px rgba(157,192,139,0.06);
  }

  @keyframes countUp100 {
    from { content: '0%'; }
    to   { content: '100%'; }
  }

  @keyframes mito-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%       { opacity: 0.85; transform: scale(1.04); }
  }

  @keyframes mito-drift {
    0%   { transform: translateY(0px) rotate(0deg); }
    50%  { transform: translateY(-8px) rotate(4deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }

  @keyframes counter-up {
    0%   { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .mito-blob {
    animation: mito-pulse 4s ease-in-out infinite, mito-drift 7s ease-in-out infinite;
  }
  .mito-blob:nth-child(2) {
    animation-delay: 1.4s, 2.1s;
    animation-duration: 5s, 9s;
  }
  .mito-blob:nth-child(3) {
    animation-delay: 2.7s, 0.5s;
    animation-duration: 3.5s, 6s;
  }
  .mito-blob:nth-child(4) {
    animation-delay: 0.8s, 4s;
    animation-duration: 6s, 11s;
  }

  .hero-stat { animation: counter-up 0.7s ease both; }
  .hero-stat:nth-child(1) { animation-delay: 0.1s; }
  .hero-stat:nth-child(2) { animation-delay: 0.25s; }
  .hero-stat:nth-child(3) { animation-delay: 0.4s; }

  @keyframes mito-count {
    0%   { --mito-n: 0; }
    100% { --mito-n: 100; }
  }
  @property --mito-n {
    syntax: '<integer>';
    initial-value: 0;
    inherits: false;
  }
  .mito-counter {
    animation: mito-count 2.5s ease-out forwards;
    counter-reset: mito var(--mito-n);
  }
  .mito-counter::after {
    content: counter(mito) '%';
    font-family: ${C.display};
    font-size: 5rem;
    color: ${C.acid};
    letter-spacing: -3px;
  }

  .intensity-bar-segment {
    transition: filter 0.3s ease;
  }
  .intensity-bar-segment:hover {
    filter: brightness(1.2);
  }

  .practice-col {
    background: ${C.card};
    border: 1px solid ${C.borderLight};
    border-left: 2px solid ${C.acid};
    border-radius: 14px;
    padding: 24px;
    flex: 1 1 320px;
  }

  .practice-col-sage {
    background: ${C.card};
    border: 1px solid ${C.borderLight};
    border-left: 2px solid ${C.sage};
    border-radius: 14px;
    padding: 24px;
    flex: 1 1 320px;
  }

  .longevity-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid ${C.border};
  }
  .longevity-row:last-child { border-bottom: none; }
`

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_METRICS = [
  {
    value: '100%',
    label: 'Mitochondrial Density Increase',
    sub: '12-week training — Holloszy 1967, J Biol Chem',
  },
  {
    value: '80%',
    label: 'Elite Training Volume at Zone 2',
    sub: 'Of total endurance training below LT1 — Seiler 2010',
  },
  {
    value: '150min',
    label: 'Weekly Zone 2 Minimum',
    sub: 'For significant longevity benefit — WHO + Ekelund 2019',
  },
]

const PHYSIOLOGY_CARDS = [
  {
    citation: 'Holloszy 1967 (J Biol Chem)',
    title: 'The Foundational Study',
    text: 'The landmark paper in exercise biochemistry. A single 12-week progressive training program in rats produced a 100% increase in mitochondrial density in skeletal muscle. The mechanistic pathway: sustained aerobic stress → AMPK activation → PGC-1α upregulation → mitochondrial biogenesis. Zone 2 is the critical intensity: high enough to sustain AMPK activation continuously, low enough to avoid excessive glycolytic flux that blunts the PGC-1α signal. No other intensity zone reliably sustains this pathway for 45–90 minutes.',
    stat: '+100% mitochondrial density in 12 weeks; AMPK → PGC-1α → biogenesis',
  },
  {
    citation: 'Brooks 2018 (Cell Metabolism) + San-Millan collaboration',
    title: 'The Lactate Shuttle & Zone 2 Precision',
    text: 'Zone 2 is defined by stable blood lactate of 1.7–2.0 mmol/L — the exact sweet spot where MCT1 (monocarboxylate transporter 1) operates at maximal capacity. MCT1 shuttles lactate from fast-twitch fibres to slow-twitch Type I fibres for oxidation (the lactate shuttle, Brooks 1984). Type I slow-twitch fibres are maximally recruited. Below Zone 1: insufficient mitochondrial stimulus. Above Zone 3: lactate production overwhelms MCT1 clearance, lactate climbs, metabolic stress spikes. Zone 2 is the only zone where MCT1-mediated clearance is maximally active and sustainable for >30 minutes.',
    stat: 'Stable lactate 1.7–2.0 mmol/L; MCT1 maximal; Type I fibres fully recruited',
  },
  {
    citation: 'San-Millan & Brooks 2018 (Front Physiol)',
    title: '24-Week Adaptation Results',
    text: 'A 24-week Zone 2 training study produced +45% mitochondrial enzyme capacity (citrate synthase, β-hydroxyacyl-CoA dehydrogenase) and +15–20% capillary density. Critically, Zone 1 alone is insufficient — it does not generate adequate mitochondrial stimulus. Zone 3 ("tempo") does not produce the same adaptations per unit of training stress because the high lactate environment blunts fat oxidation enzyme expression. Zone 2 uniquely maximises the signal-to-stress ratio for mitochondrial biogenesis.',
    stat: '+45% mitochondrial enzymes; +15–20% capillary density in 24 weeks',
  },
  {
    citation: 'Lanza 2012 (J Gerontol) + Attia longevity protocol',
    title: 'Reversing Mitochondrial Aging',
    text: 'Mitochondrial function declines 35–50% from age 25 to 75 in sedentary individuals. In a landmark intervention, 12 weeks of Zone 2 training in 65-year-olds restored mitochondrial function to levels equivalent to inactive 40-year-olds — a 25-year functional reversal. Peter Attia\'s longevity framework prescribes 150–180 minutes per week of Zone 2 as the cornerstone of healthspan extension, citing its unmatched dose-response relationship for mitochondrial health, insulin sensitivity, and cardiovascular risk reduction.',
    stat: '12-week Zone 2 in 65-year-olds → restored to inactive 40-year-old levels',
  },
]

const FAT_CARDS = [
  {
    citation: 'Achten 2003 (Med Sci Sports Exerc)',
    title: 'Maximal Fat Oxidation Zone',
    text: 'Fatmax — the exercise intensity eliciting maximal fat oxidation — occurs at 40–65% VO₂max, precisely overlapping with Zone 2. Trained athletes oxidise 0.5–0.8 g/min of fat at this intensity; elite endurance athletes achieve 1.0–1.5 g/min; untrained individuals only 0.2–0.4 g/min. After 12 weeks of training, fat oxidation at this intensity increases 40–60%. As intensity increases above Zone 2, fat contribution drops precipitously as carbohydrate becomes the dominant substrate.',
    stat: 'Elite fat oxidation: 1.0–1.5 g/min at Zone 2; +40–60% after 12 weeks training',
  },
  {
    citation: 'Galgani 2008 + Bajpeyi 2011',
    title: 'Metabolic Flexibility',
    text: 'Metabolic flexibility is the ability to shift fuel utilisation between fat and carbohydrate in response to physiological demand. Insulin resistance presents as metabolic inflexibility — an inability to effectively oxidise fat. Zone 2 training directly restores this flexibility: fat oxidation increases +38% and insulin sensitivity improves +27% (Bajpeyi 2011). The mechanism is PGC-1α-driven upregulation of fat oxidation enzymes (CPT-1, HADH, LCAD) and mitochondrial beta-oxidation capacity. This is the cellular definition of "becoming a fat-burning machine."',
    stat: 'Fat oxidation +38%, insulin sensitivity +27% (Bajpeyi 2011)',
  },
  {
    citation: 'Holloszy 1996 + Snowling 2006 meta-analysis',
    title: 'GLUT4 and Insulin Sensitivity',
    text: 'Zone 2 training increases GLUT4 expression 50–200% in trained muscle — the transporter responsible for insulin-stimulated glucose uptake. This effect persists 24–48 hours post-exercise. Three Zone 2 sessions per week creates near-continuous insulin sensitivity improvement across the week. A 2006 meta-analysis (Snowling) found aerobic exercise equivalent to metformin for glycemic control in type 2 diabetes. This is why Zone 2 is foundational in metabolic disease reversal protocols.',
    stat: 'GLUT4 +50–200%; effect lasts 24–48h; equivalent to metformin (Snowling 2006)',
  },
  {
    citation: 'Coyle 1986 (J Appl Physiol)',
    title: 'Glycogen Sparing — The Wall, Explained',
    text: 'Trained athletes burn 60–70% fat at marathon race pace; untrained athletes burn 60–70% carbohydrate at the same relative intensity. "The wall" — the notorious collapse at mile 20 of a marathon — is glycogen depletion caused by insufficient fat oxidation capacity. Zone 2 training delays glycogen depletion by 45–60 minutes in 3-hour endurance events by upregulating fat utilisation at submaximal intensities, preserving glycogen for late-race surges when only carbohydrate can fuel the required intensity.',
    stat: 'Glycogen depletion delayed 45–60 min in 3-hour events; trained burn 70% fat at marathon pace',
  },
]

const ELITE_CARDS = [
  {
    citation: 'Seiler 2010 (IJSPP) — The definitive polarized training paper',
    title: 'Olympic Medalists, Decades of Data',
    text: 'Stephen Seiler\'s landmark analysis of training intensity distribution across Olympic medalists and world-record holders in cross-country skiing, rowing, biathlon, cycling, and running, across multiple decades, found a consistent pattern: 75–80% of training volume is performed at low intensity (Zone 1–2, below LT1). Approximately 5% at Zone 2 specifically. 15–20% at high intensity (Zone 3, above LT2). This is not a choice — it is what the physiology demands for optimal long-term adaptation.',
    stat: '75–80% low intensity, 5% Zone 2, 15–20% high intensity — across all elite endurance sports',
  },
  {
    citation: 'Stöggl & Sperlich 2014 (Front Physiol) — 48-athlete RCT',
    title: 'Polarized Training Beats All Alternatives',
    text: 'A randomised controlled trial of 48 well-trained athletes across 9 weeks compared four training distributions: polarized, high-intensity, pyramidal, and high-volume low-intensity. Results: Polarized training produced +11.7% VO₂max increase and +5.1% performance gains. Pyramidal: +7.4%. High-volume low-intensity: +8.7%. High-intensity only: limited gains with elevated overtraining markers. Polarized training is not just different — it is demonstrably superior for simultaneous VO₂max and performance development.',
    stat: 'Polarized: +11.7% VO₂max, +5.1% performance vs +7.4% pyramidal (9-week RCT)',
  },
  {
    citation: 'Professional volume norms — Tour, Ironman, Elite Marathon',
    title: 'Real-World Elite Volume',
    text: 'Tour de France cyclists accumulate 8–15 hours of Zone 2 per week during the racing season, plus base phases at even higher volumes. Ironman triathletes complete 80–85% of training at Zone 2 intensity. Elite marathoners run 80% of their 110–130 km/week at genuinely easy pace — the same conversational effort that most recreational runners feel is "too slow." The common thread: elite athletes are disciplined about keeping easy days easy, which allows the rare hard sessions to be truly hard.',
    stat: 'Tour de France: 8–15h Zone 2/week; Ironman: 80–85% Zone 2; Marathon: 80% of 110–130 km/week',
  },
  {
    citation: 'Muñoz 2014 + Apple Watch HR monitoring',
    title: 'The Black Hole — Why Recreational Athletes Fail',
    text: 'Muñoz 2014 quantified why recreational athletes drift to threshold: moderate intensity (65–80% HRmax) "feels productive" and generates perceived effort. But it creates enough stress to impair full recovery while not providing the high-intensity stimulus needed for VO₂max adaptation nor the volume of low-intensity work needed for mitochondrial development. The result is chronic fatigue with sub-optimal adaptation — the "black hole." Apple Watch heart rate alerts are the practical solution: set an upper Zone 2 alarm at ~77% HRmax and never let it beep.',
    stat: 'Black hole: 40% recreational volume in threshold zone; elite: only 5%',
  },
]

const LONGEVITY_ROWS = [
  {
    dose: '150 min/week',
    benefit: '−35% cardiovascular mortality',
    source: 'Mandsager 2018, Ekelund 2019',
    pct: 35,
  },
  {
    dose: '300 min/week',
    benefit: '−50–55% vs sedentary',
    source: 'Ekelund 2019 (Peter Attia recommendation)',
    pct: 55,
  },
  {
    dose: '+1 MET fitness',
    benefit: '−13% all-cause mortality',
    source: 'Kodama 2009 (JAMA), N=102,980',
    pct: 13,
  },
]

const CITATIONS = [
  'Holloszy JO (1967). Biochemical adaptations in muscle. J Biol Chem. 242(9):2278–2282.',
  'Brooks GA (1984). Lactate: glycolytic end product and oxidative substrate. Can J Appl Sport Sci.',
  'Brooks GA & San-Millan I (2018). Mammalian fuel utilization during sustained exercise. Comprehens Physiol.',
  'San-Millan I & Brooks GA (2018). Assessment of metabolic flexibility via mitochondrial function in athletes. Front Physiol.',
  'Seiler S (2010). What is best practice for training intensity and duration distribution in endurance athletes? IJSPP. 5(3):276–291.',
  'Stöggl TL & Sperlich B (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. Front Physiol. 5:33.',
  'Achten J & Jeukendrup AE (2003). Maximal fat oxidation during exercise in trained men. IJSPP. 35(1):65–73.',
  'Galgani JE & Ravussin E (2008). Energy metabolism, fuel selection and body weight regulation. IJOB. 32:S109–S119.',
  'Bajpeyi S et al. (2011). Effect of exercise intensity and volume on persistence of insulin sensitivity during training cessation. J Appl Physiol.',
  'Coyle EF et al. (1986). Muscle glycogen utilization during prolonged strenuous exercise. J Appl Physiol. 61(1):165–172.',
  'Holloszy JO & Hansen PA (1996). Regulation of glucose transport into skeletal muscle. Rev Physiol Biochem Pharmacol.',
  'Snowling NJ & Hopkins WG (2006). Effects of different modes of exercise training on glucose control. Diabetes Care. 29(11):2518–2527.',
  'Lanza IR et al. (2012). Endurance exercise as a countermeasure for aging. Diabetes. 57(11):2933–2942.',
  'Mandsager K et al. (2018). Association of cardiorespiratory fitness with long-term mortality. JAMA Netw Open.',
  'Ekelund U et al. (2019). Dose-response associations between accelerometry measured physical activity and sedentary time and all cause mortality. BMJ.',
  'Muñoz I et al. (2014). Does polarized training improve performance in recreational runners? IJSPP. 9(2):265–272.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function MitoBlobs() {
  const blobs = [
    {
      width: 220,
      height: 140,
      top: '8%',
      left: '3%',
      rx: '60% 40% 55% 45% / 50% 60% 40% 50%',
      color: 'rgba(127,255,0,0.04)',
      borderColor: 'rgba(127,255,0,0.08)',
      delay: '0s',
    },
    {
      width: 160,
      height: 100,
      top: '55%',
      left: '1%',
      rx: '45% 55% 40% 60% / 55% 45% 65% 35%',
      color: 'rgba(157,192,139,0.04)',
      borderColor: 'rgba(157,192,139,0.07)',
      delay: '1.5s',
    },
    {
      width: 190,
      height: 120,
      top: '20%',
      right: '2%',
      rx: '55% 45% 60% 40% / 40% 60% 50% 50%',
      color: 'rgba(127,255,0,0.035)',
      borderColor: 'rgba(127,255,0,0.07)',
      delay: '2.8s',
    },
    {
      width: 140,
      height: 90,
      top: '70%',
      right: '4%',
      rx: '40% 60% 45% 55% / 60% 40% 55% 45%',
      color: 'rgba(157,192,139,0.03)',
      borderColor: 'rgba(157,192,139,0.06)',
      delay: '0.7s',
    },
  ]

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="mito-blob"
          style={{
            position: 'absolute',
            width: blob.width,
            height: blob.height,
            top: blob.top,
            left: (blob as any).left,
            right: (blob as any).right,
            borderRadius: blob.rx,
            background: `radial-gradient(ellipse at 40% 40%, ${blob.color}, transparent 70%)`,
            border: `1px solid ${blob.borderColor}`,
            animationDelay: blob.delay,
          }}
        />
      ))}
    </div>
  )
}

function HeroMetric({ value, label, sub, idx }: { value: string; label: string; sub: string; idx: number }) {
  return (
    <div
      className="hero-stat"
      style={{
        flex: '1 1 200px',
        padding: '24px 20px',
        background: 'rgba(127,255,0,0.04)',
        border: '1px solid rgba(127,255,0,0.14)',
        borderRadius: 14,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: C.display,
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: C.acid,
          margin: '0 0 6px',
          letterSpacing: '-2px',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: C.display,
          fontSize: 12,
          color: C.cream,
          margin: '0 0 6px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: C.mono,
          fontSize: 11,
          color: C.textSub,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {sub}
      </p>
    </div>
  )
}

function IntensityBar() {
  const segments = [
    {
      label: 'ZONE 1',
      sublabel: 'Light / Recovery',
      note: 'Below LT1',
      lactate: '<1.7 mmol/L',
      pct: '80%',
      flex: 80,
      color: '#2d8a50',
      textColor: '#7ecf9a',
    },
    {
      label: 'ZONE 2',
      sublabel: 'Aerobic Base Target',
      note: 'Fat max / Lactate stable',
      lactate: '1.7–2.0 mmol/L',
      pct: '5%',
      flex: 5,
      color: C.acid,
      textColor: C.bg,
    },
    {
      label: 'ZONE 3+',
      sublabel: 'Threshold & Above',
      note: 'Above LT2',
      lactate: '>4.0 mmol/L',
      pct: '15%',
      flex: 15,
      color: '#e07b39',
      textColor: '#f5c09a',
    },
  ]

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.borderLight}`,
        borderLeft: `2px solid ${C.acid}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.border}`,
          background: C.acidGlow,
        }}
      >
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            fontWeight: 700,
            color: C.acid,
            margin: '0 0 3px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Elite Training Intensity Distribution
        </p>
        <p style={{ fontFamily: C.serif, fontSize: 15, color: C.text, margin: 0 }}>
          Zone 2 represents only 5% of elite volume — but unlocks 100% of the mitochondrial signal.
        </p>
      </div>

      {/* Visual bar */}
      <div style={{ padding: '22px 22px 8px' }}>
        <div
          style={{
            display: 'flex',
            height: 52,
            borderRadius: 10,
            overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}
        >
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="intensity-bar-segment"
              style={{
                flex: seg.flex,
                background: seg.color === C.acid
                  ? `linear-gradient(135deg, ${C.acid} 0%, #a0ff40 100%)`
                  : seg.color === '#2d8a50'
                  ? 'linear-gradient(135deg, #1a4d2e 0%, #2d8a50 100%)'
                  : 'linear-gradient(135deg, #7a3a15 0%, #e07b39 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontFamily: C.display,
                  fontSize: seg.flex >= 15 ? 13 : seg.flex >= 5 ? 10 : 12,
                  color: seg.textColor,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                }}
              >
                {seg.pct}
              </span>
            </div>
          ))}
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', marginTop: 12, gap: 4 }}>
          {segments.map((seg) => (
            <div
              key={seg.label}
              style={{
                flex: seg.flex,
                minWidth: 0,
              }}
            >
              <p
                style={{
                  fontFamily: C.display,
                  fontSize: 10,
                  color: seg.color === C.acid ? C.acid : seg.textColor,
                  margin: '0 0 2px',
                  letterSpacing: '0.5px',
                  whiteSpace: seg.flex < 10 ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {seg.label}
              </p>
              {seg.flex >= 10 && (
                <>
                  <p style={{ fontFamily: C.serif, fontSize: 11, color: C.textSub, margin: '0 0 1px' }}>
                    {seg.note}
                  </p>
                  <p style={{ fontFamily: C.mono, fontSize: 10, color: C.textMuted, margin: 0 }}>
                    {seg.lactate}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '6px 22px 16px' }}>
        <p style={{ fontFamily: C.mono, fontSize: 11, color: C.textMuted, margin: 0, fontStyle: 'italic' }}>
          Distribution reflects Seiler 2010 IJSPP analysis of Olympic-level endurance athletes across multiple sports.
        </p>
      </div>
    </div>
  )
}

function ScienceCard({
  citation,
  title,
  text,
  stat,
  variant = 'acid',
}: {
  citation: string
  title: string
  text: string
  stat: string
  variant?: 'acid' | 'sage'
}) {
  const isAcid = variant === 'acid'
  const accentColor = isAcid ? C.acid : C.sage
  const accentDim = isAcid ? C.acidDim : C.sageDim
  const accentBorder = isAcid ? C.acidBorder : C.sageBorder

  return (
    <div className={isAcid ? 'z2-card' : 'z2-card-sage'}>
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.border}`,
          background: accentDim,
        }}
      >
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            color: accentColor,
            margin: '0 0 4px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {citation}
        </p>
        <h3
          style={{
            fontFamily: C.display,
            fontSize: 16,
            color: C.cream,
            margin: 0,
            letterSpacing: '0.3px',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '18px 22px 16px' }}>
        <p
          style={{
            fontFamily: C.serif,
            fontSize: 14,
            color: C.text,
            lineHeight: 1.75,
            margin: '0 0 16px',
          }}
        >
          {text}
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: `${accentColor}10`,
            border: `1px solid ${accentBorder}`,
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 12,
              fontWeight: 700,
              color: accentColor,
            }}
          >
            {stat}
          </span>
        </div>
      </div>
    </div>
  )
}

function MitoCounter() {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.borderLight}`,
        borderLeft: `2px solid ${C.acid}`,
        borderRadius: 14,
        padding: '32px 28px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background cellular motif */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 180,
          height: 120,
          borderRadius: '55% 45% 60% 40% / 45% 55% 45% 55%',
          background: 'radial-gradient(ellipse, rgba(127,255,0,0.05), transparent 70%)',
          border: '1px solid rgba(127,255,0,0.06)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -20,
          left: -20,
          width: 140,
          height: 90,
          borderRadius: '40% 60% 55% 45% / 60% 40% 50% 50%',
          background: 'radial-gradient(ellipse, rgba(127,255,0,0.04), transparent 70%)',
          border: '1px solid rgba(127,255,0,0.05)',
        }}
      />

      <p
        style={{
          fontFamily: C.mono,
          fontSize: 10,
          color: C.acid,
          margin: '0 0 8px',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
        }}
      >
        Mitochondrial Density Increase
      </p>

      <div
        className="mito-counter"
        style={{
          minHeight: '5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />

      <p
        style={{
          fontFamily: C.serif,
          fontSize: 14,
          color: C.textSub,
          margin: '12px 0 0',
          lineHeight: 1.6,
          maxWidth: 440,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        After 12 weeks of Zone 2 training — the single most powerful stimulus for mitochondrial biogenesis.
        <br />
        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textMuted }}>
          Holloszy 1967, J Biol Chem. Replicated in humans — San-Millan & Brooks 2018.
        </span>
      </p>
    </div>
  )
}

function FuelGauge() {
  const intensities = [
    { label: 'Rest', fat: 60, carb: 40, zone: '' },
    { label: 'Zone 1', fat: 70, carb: 30, zone: 'Light' },
    { label: 'Zone 2', fat: 75, carb: 25, zone: 'Fat max', highlight: true },
    { label: 'Zone 3', fat: 45, carb: 55, zone: 'Threshold' },
    { label: 'Zone 4', fat: 20, carb: 80, zone: 'Hard' },
    { label: 'Zone 5', fat: 5, carb: 95, zone: 'Max' },
  ]

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.borderLight}`,
        borderLeft: `2px solid ${C.acid}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.border}`,
          background: C.acidGlow,
        }}
      >
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            color: C.acid,
            margin: '0 0 3px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Fuel Utilization by Intensity
        </p>
        <p style={{ fontFamily: C.serif, fontSize: 15, color: C.text, margin: 0 }}>
          Zone 2 maximises fat oxidation — then carbohydrate takes over above threshold.
        </p>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: C.mono, fontSize: 11, color: C.textSub }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: C.acid, opacity: 0.85 }} />
            Fat
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: C.mono, fontSize: 11, color: C.textSub }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#e07b39', opacity: 0.85 }} />
            Carbohydrate
          </span>
        </div>

        {intensities.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              padding: row.highlight ? '6px 10px' : '0',
              background: row.highlight ? 'rgba(127,255,0,0.04)' : 'transparent',
              borderRadius: row.highlight ? 8 : 0,
              border: row.highlight ? `1px solid rgba(127,255,0,0.12)` : '1px solid transparent',
            }}
          >
            <div style={{ width: 60, flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: C.display,
                  fontSize: 11,
                  color: row.highlight ? C.acid : C.textSub,
                  letterSpacing: '0.5px',
                }}
              >
                {row.label}
              </span>
              {row.zone && (
                <span
                  style={{
                    display: 'block',
                    fontFamily: C.mono,
                    fontSize: 9,
                    color: C.textMuted,
                  }}
                >
                  {row.zone}
                </span>
              )}
            </div>

            <div style={{ flex: 1, height: 22, display: 'flex', borderRadius: 6, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${row.fat}%`,
                  background: `linear-gradient(90deg, ${C.acid}60, ${C.acid}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {row.fat >= 30 && (
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.bg, fontWeight: 700 }}>
                    {row.fat}%
                  </span>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  background: `linear-gradient(90deg, #e07b3960, #e07b39cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {row.carb >= 20 && (
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.bg, fontWeight: 700 }}>
                    {row.carb}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <p style={{ fontFamily: C.mono, fontSize: 11, color: C.textMuted, margin: '8px 0 0', fontStyle: 'italic' }}>
          Values are approximate % substrate contribution at each intensity. Trained athletes show higher fat % at all intensities.
        </p>
      </div>
    </div>
  )
}

function EliteVsRecreational() {
  const cols = [
    {
      title: 'ELITE ATHLETES',
      subtitle: 'Olympic / World-class',
      segments: [
        { zone: 'Zone 1–2', pct: 75, color: '#2d8a50' },
        { zone: 'Zone 2 spec.', pct: 5, color: C.acid },
        { zone: 'Zone 3+', pct: 20, color: '#e07b39' },
      ],
      note: 'Polarized model — hard days are very hard, easy days are truly easy',
      borderColor: C.acid,
    },
    {
      title: 'RECREATIONAL ATHLETES',
      subtitle: 'Amateur / Fitness training',
      segments: [
        { zone: 'Zone 1', pct: 40, color: '#2d8a50' },
        { zone: 'Zone 2', pct: 40, color: '#9b9b00' },
        { zone: 'Zone 3+', pct: 20, color: '#e07b39' },
      ],
      note: 'Black hole model — 40% stuck in unproductive threshold zone',
      borderColor: '#9b9b00',
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {cols.map((col) => (
        <div
          key={col.title}
          style={{
            flex: '1 1 280px',
            background: C.card,
            border: `1px solid ${C.borderLight}`,
            borderLeft: `2px solid ${col.borderColor}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: `${col.borderColor}08`,
            }}
          >
            <p
              style={{
                fontFamily: C.display,
                fontSize: 13,
                color: col.borderColor,
                margin: '0 0 2px',
                letterSpacing: '1px',
              }}
            >
              {col.title}
            </p>
            <p style={{ fontFamily: C.serif, fontSize: 12, color: C.textSub, margin: 0 }}>
              {col.subtitle}
            </p>
          </div>

          <div style={{ padding: '18px 20px' }}>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 44, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              {col.segments.map((seg) => (
                <div
                  key={seg.zone}
                  style={{
                    flex: seg.pct,
                    background: seg.color,
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {seg.pct >= 15 && (
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: '#fff', fontWeight: 700 }}>
                      {seg.pct}%
                    </span>
                  )}
                </div>
              ))}
            </div>

            {col.segments.map((seg) => (
              <div key={seg.zone} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textSub }}>{seg.zone}</span>
                <span style={{ marginLeft: 'auto', fontFamily: C.mono, fontSize: 11, color: seg.color, fontWeight: 700 }}>{seg.pct}%</span>
              </div>
            ))}

            <p
              style={{
                fontFamily: C.serif,
                fontSize: 12,
                color: C.textSub,
                margin: '14px 0 0',
                lineHeight: 1.5,
                fontStyle: 'italic',
                borderTop: `1px solid ${C.border}`,
                paddingTop: 12,
              }}
            >
              {col.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PracticeSection() {
  const identifiers = [
    { icon: '🗣', label: 'Talk Test', detail: 'Full sentences with slight effort, 1–2 word pause per 10 words' },
    { icon: '👃', label: 'Nose Breathing', detail: 'Possible but requires mild concentration — not gasping' },
    { icon: '🔢', label: 'MAF Formula', detail: 'HR = 180 − age (Maffetone Method)' },
    { icon: '📱', label: 'Apple Watch Alert', detail: 'Set alarm at 77% HRmax — estimated LT1' },
    { icon: '🩸', label: 'Blood Lactate', detail: '1.7–2.0 mmol/L — the gold standard' },
  ]

  const sessionDesign = [
    { label: 'Minimum duration', value: '30–45 min (shorter = insufficient mitochondrial stimulus)' },
    { label: 'Optimal duration', value: '45–90 min continuous' },
    { label: 'Frequency', value: '3–4 sessions/week OR 2 × 90 min/week' },
    { label: 'Best modality', value: 'Cycling → Running → Swimming (joint impact order)' },
    { label: 'Key discipline', value: 'STAY EASY — HR alarm prevents Zone 3 drift' },
  ]

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {/* Left col */}
      <div className="practice-col">
        <p
          style={{
            fontFamily: C.display,
            fontSize: 16,
            color: C.acid,
            margin: '0 0 16px',
            letterSpacing: '0.5px',
          }}
        >
          Identify Your Zone 2
        </p>
        <p
          style={{
            fontFamily: C.serif,
            fontSize: 13,
            color: C.textSub,
            margin: '0 0 18px',
            lineHeight: 1.6,
          }}
        >
          Multiple methods triangulate the same intensity — use at least two to confirm.
        </p>

        {identifiers.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 0',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
            <div>
              <p style={{ fontFamily: C.display, fontSize: 13, color: C.cream, margin: '0 0 3px' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: C.serif, fontSize: 13, color: C.textSub, margin: 0, lineHeight: 1.5 }}>
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Right col */}
      <div className="practice-col-sage">
        <p
          style={{
            fontFamily: C.display,
            fontSize: 16,
            color: C.sage,
            margin: '0 0 16px',
            letterSpacing: '0.5px',
          }}
        >
          Zone 2 Session Design
        </p>
        <p
          style={{
            fontFamily: C.serif,
            fontSize: 13,
            color: C.textSub,
            margin: '0 0 18px',
            lineHeight: 1.6,
          }}
        >
          Structure matters. Zone 2 requires duration and discipline — short or drifted sessions forfeit the adaptation.
        </p>

        {sessionDesign.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '12px 0',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.sage, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {item.label}
            </p>
            <p style={{ fontFamily: C.serif, fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LongevityDoseResponse() {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.borderLight}`,
        borderLeft: `2px solid ${C.acid}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.border}`,
          background: C.acidGlow,
        }}
      >
        <p
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            color: C.acid,
            margin: '0 0 3px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Longevity Dose-Response
        </p>
        <p style={{ fontFamily: C.serif, fontSize: 15, color: C.text, margin: 0 }}>
          Mandsager 2018 + Ekelund 2019 — cardiovascular mortality reduction by weekly Zone 2 dose.
        </p>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {LONGEVITY_ROWS.map((row) => (
          <div key={row.dose} className="longevity-row">
            <div style={{ width: 110, flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: C.display,
                  fontSize: 14,
                  color: C.acid,
                  letterSpacing: '-0.5px',
                }}
              >
                {row.dose}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ height: 24, background: C.border, borderRadius: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${row.pct}%`,
                    background: `linear-gradient(90deg, ${C.acid}60, ${C.acid})`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 10,
                  }}
                >
                  <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.bg }}>
                    {row.benefit}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: 160, flexShrink: 0, paddingLeft: 12 }}>
              <span style={{ fontFamily: C.mono, fontSize: 10, color: C.textMuted, display: 'block' }}>
                {row.source}
              </span>
            </div>
          </div>
        ))}

        <p style={{ fontFamily: C.mono, fontSize: 11, color: C.textMuted, margin: '12px 0 0', fontStyle: 'italic' }}>
          Each 1 MET increase in peak aerobic fitness = −13% all-cause mortality (Kodama 2009, JAMA, N=102,980). No upper threshold of benefit identified.
        </p>
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontFamily: C.mono,
          fontSize: 10,
          fontWeight: 700,
          color: C.acid,
          margin: '0 0 6px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: C.display,
          fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
          color: C.cream,
          margin: 0,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Zone2SciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONT_IMPORT }} />

      <div
        style={{
          minHeight: '100vh',
          background: `radial-gradient(ellipse at 30% 0%, #0d2415 0%, ${C.bg} 50%, #020904 100%)`,
          color: C.text,
          fontFamily: C.serif,
        }}
      >
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            paddingTop: 64,
            paddingBottom: 56,
            borderBottom: `1px solid ${C.border}`,
            background: `linear-gradient(180deg, #0d2415 0%, ${C.bg} 100%)`,
          }}
        >
          <MitoBlobs />

          {/* Giant watermark text */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: C.display,
              fontSize: 'clamp(8rem, 22vw, 18rem)',
              color: '#061208',
              letterSpacing: '-8px',
              lineHeight: 0.85,
              userSelect: 'none',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textShadow: '0 0 80px rgba(127,255,0,0.04)',
              WebkitTextStroke: '1px rgba(127,255,0,0.06)',
            }}
          >
            ZONE 2
          </div>

          {/* Foreground content */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: 860,
              margin: '0 auto',
              padding: '0 24px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                fontWeight: 700,
                color: C.acid,
                margin: '0 0 14px',
                letterSpacing: '3.5px',
                textTransform: 'uppercase',
              }}
            >
              Aerobic Science — The Engine Room
            </p>

            <h1
              style={{
                fontFamily: C.display,
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                color: C.cream,
                margin: '0 0 16px',
                letterSpacing: '-1.5px',
                lineHeight: 1.05,
              }}
            >
              Zone 2 Training Science
            </h1>

            <p
              style={{
                fontFamily: C.serif,
                fontStyle: 'italic',
                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                color: C.sage,
                margin: '0 auto 40px',
                maxWidth: 580,
                lineHeight: 1.7,
              }}
            >
              The engine room of human performance. Where mitochondria multiply, fat burns cleanly, and longevity begins.
            </p>

            {/* Hero metrics */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {HERO_METRICS.map((m, i) => (
                <HeroMetric key={m.label} {...m} idx={i} />
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 1: PHYSIOLOGY ──────────────────────────────────────── */}
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '56px 20px 0' }}>
          <SectionHeading
            eyebrow="Section 01 — Cellular Physiology"
            title="What Happens Inside the Muscle"
          />

          {/* Intensity spectrum bar */}
          <div style={{ marginBottom: 24 }}>
            <IntensityBar />
          </div>

          {/* Mitochondria counter */}
          <div style={{ marginBottom: 24 }}>
            <MitoCounter />
          </div>

          {/* Physiology cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PHYSIOLOGY_CARDS.map((card) => (
              <ScienceCard key={card.citation} {...card} variant="acid" />
            ))}
          </div>
        </div>

        {/* ── SECTION 2: FAT BURNING ──────────────────────────────────────── */}
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '56px 20px 0' }}>
          <SectionHeading
            eyebrow="Section 02 — Substrate Metabolism"
            title="The Fat Engine"
          />

          {/* Fuel gauge */}
          <div style={{ marginBottom: 24 }}>
            <FuelGauge />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAT_CARDS.map((card) => (
              <ScienceCard key={card.citation} {...card} variant="sage" />
            ))}
          </div>
        </div>

        {/* ── SECTION 3: ELITE EVIDENCE ───────────────────────────────────── */}
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '56px 20px 0' }}>
          <SectionHeading
            eyebrow="Section 03 — Elite Training Evidence"
            title="The 80/20 Rule — Proven, Not Guessed"
          />

          {/* Elite vs recreational comparison */}
          <div style={{ marginBottom: 24 }}>
            <EliteVsRecreational />
          </div>

          {/* Black hole annotation */}
          <div
            style={{
              marginBottom: 24,
              padding: '16px 22px',
              background: 'rgba(155,155,0,0.06)',
              border: '1px solid rgba(155,155,0,0.2)',
              borderLeft: '2px solid #9b9b00',
              borderRadius: 14,
            }}
          >
            <p
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                color: '#c4c400',
                margin: '0 0 6px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              The Black Hole — Muñoz 2014
            </p>
            <p style={{ fontFamily: C.serif, fontSize: 14, color: C.text, margin: 0, lineHeight: 1.7 }}>
              Recreational athletes over-train in the threshold zone that provides <em>neither</em> the recovery benefits of Zone 1
              nor the VO₂max stimulus of Zone 3. This "black hole" (65–80% HRmax) feels productive but generates chronic fatigue
              without specific adaptation. Elite athletes avoid it by ruthless discipline: easy days are genuinely conversational,
              hard days are genuinely hard.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ELITE_CARDS.map((card) => (
              <ScienceCard key={card.citation} {...card} variant="acid" />
            ))}
          </div>
        </div>

        {/* ── SECTION 4: HOW TO PRACTICE ──────────────────────────────────── */}
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '56px 20px 0' }}>
          <SectionHeading
            eyebrow="Section 04 — Applied Practice"
            title="Building Your Base"
          />

          <div style={{ marginBottom: 24 }}>
            <PracticeSection />
          </div>

          <LongevityDoseResponse />
        </div>

        {/* ── FOOTER — CITATIONS ──────────────────────────────────────────── */}
        <div style={{ maxWidth: 920, margin: '56px auto 0', padding: '0 20px 80px' }}>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderLeft: `2px solid ${C.textMuted}`,
              borderRadius: 14,
              padding: '22px 24px',
            }}
          >
            <p
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                color: C.textSub,
                margin: '0 0 14px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Primary Literature
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CITATIONS.map((cite, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: C.mono,
                    fontSize: 11,
                    color: C.textMuted,
                    margin: 0,
                    lineHeight: 1.55,
                    paddingBottom: 6,
                    borderBottom: i < CITATIONS.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  {cite}
                </p>
              ))}
            </div>

            <p
              style={{
                fontFamily: C.serif,
                fontSize: 12,
                color: C.textMuted,
                margin: '16px 0 0',
                lineHeight: 1.6,
                fontStyle: 'italic',
                borderTop: `1px solid ${C.border}`,
                paddingTop: 14,
              }}
            >
              This page summarises peer-reviewed population studies and controlled trials. Effect sizes reflect
              relative risk reductions from observational and RCT data; individual results will vary.
              Consult a physician before beginning any structured exercise program.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
