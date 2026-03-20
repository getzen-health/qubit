// Sleep Science — server component (no interactivity needed for static content)
// Caffeine half-life calculator and sleep cycle diagram are rendered statically
// with pre-computed data for common wake times.

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'Adult Sleep Need',
    value: '7–9h',
    sub: 'per night (Walker 2017)',
    accent: '#6366f1',
  },
  {
    label: 'Slow-Wave Sleep',
    value: '20–25%',
    sub: 'of total sleep time',
    accent: '#3b82f6',
  },
  {
    label: 'REM Sleep',
    value: '20–25%',
    sub: 'of total sleep time',
    accent: '#8b5cf6',
  },
  {
    label: 'Circadian Period',
    value: '24.18h',
    sub: 'intrinsic SCN rhythm (Czeisler 1999)',
    accent: '#a78bfa',
  },
]

// Sleep cycles across an 8-hour night
// Each cycle ≈ 90 min; early cycles are SWS-heavy, late cycles are REM-heavy
const SLEEP_CYCLES = [
  {
    cycle: 1,
    startMin: 0,
    endMin: 90,
    stages: [
      { name: 'N1', mins: 5, color: '#334155' },
      { name: 'N2', mins: 25, color: '#1e3a8a' },
      { name: 'SWS', mins: 45, color: '#1d4ed8' },
      { name: 'REM', mins: 15, color: '#7c3aed' },
    ],
  },
  {
    cycle: 2,
    startMin: 90,
    endMin: 180,
    stages: [
      { name: 'N1', mins: 5, color: '#334155' },
      { name: 'N2', mins: 30, color: '#1e3a8a' },
      { name: 'SWS', mins: 35, color: '#1d4ed8' },
      { name: 'REM', mins: 20, color: '#7c3aed' },
    ],
  },
  {
    cycle: 3,
    startMin: 180,
    endMin: 270,
    stages: [
      { name: 'N1', mins: 3, color: '#334155' },
      { name: 'N2', mins: 32, color: '#1e3a8a' },
      { name: 'SWS', mins: 20, color: '#1d4ed8' },
      { name: 'REM', mins: 35, color: '#7c3aed' },
    ],
  },
  {
    cycle: 4,
    startMin: 270,
    endMin: 360,
    stages: [
      { name: 'N1', mins: 2, color: '#334155' },
      { name: 'N2', mins: 23, color: '#1e3a8a' },
      { name: 'SWS', mins: 5, color: '#1d4ed8' },
      { name: 'REM', mins: 60, color: '#7c3aed' },
    ],
  },
  {
    cycle: 5,
    startMin: 360,
    endMin: 480,
    stages: [
      { name: 'N1', mins: 2, color: '#334155' },
      { name: 'N2', mins: 28, color: '#1e3a8a' },
      { name: 'SWS', mins: 5, color: '#1d4ed8' },
      { name: 'REM', mins: 85, color: '#7c3aed' },
    ],
  },
]

// Caffeine cutoff data — half-life ~5h, target <25 mg residual at bedtime
// Formula: last_cup_time = bedtime - hours_to_clear_to_safe_level
// With 200mg cup, 4.5 half-lives (~22.5h) to reach <12.5mg — practically:
// common guidance is 6–8h before bed; we show a range of popular wake times
const CAFFEINE_CUTOFFS = [
  { wakeTime: '05:00', bedtime: '21:00', cutoff: '14:00', cutoffLabel: '2:00 PM' },
  { wakeTime: '06:00', bedtime: '22:00', cutoff: '15:00', cutoffLabel: '3:00 PM' },
  { wakeTime: '06:30', bedtime: '22:30', cutoff: '15:30', cutoffLabel: '3:30 PM' },
  { wakeTime: '07:00', bedtime: '23:00', cutoff: '16:00', cutoffLabel: '4:00 PM' },
  { wakeTime: '07:30', bedtime: '23:30', cutoff: '16:30', cutoffLabel: '4:30 PM' },
  { wakeTime: '08:00', bedtime: '00:00', cutoff: '17:00', cutoffLabel: '5:00 PM' },
  { wakeTime: '09:00', bedtime: '01:00', cutoff: '18:00', cutoffLabel: '6:00 PM' },
]

// Half-life decay bars — how much caffeine remains at each hour post-consumption
const HALF_LIFE_DECAY = [
  { hour: 0, pct: 100, label: 'Consumed' },
  { hour: 1, pct: 87, label: '1h' },
  { hour: 2, pct: 76, label: '2h' },
  { hour: 3, pct: 66, label: '3h' },
  { hour: 4, pct: 57, label: '4h' },
  { hour: 5, pct: 50, label: '5h' },
  { hour: 6, pct: 43, label: '6h' },
  { hour: 7, pct: 38, label: '7h' },
  { hour: 8, pct: 33, label: '8h' },
  { hour: 9, pct: 29, label: '9h' },
  { hour: 10, pct: 25, label: '10h' },
  { hour: 11, pct: 22, label: '11h' },
  { hour: 12, pct: 19, label: '12h' },
]

const SCIENCE_CARDS = [
  {
    icon: 'N',
    iconBg: 'rgba(99,102,241,0.15)',
    iconBorder: 'rgba(99,102,241,0.35)',
    iconColor: '#818cf8',
    title: 'Sleep Stages & Architecture',
    accent: '#6366f1',
    accentBg: 'rgba(99,102,241,0.10)',
    accentBorder: 'rgba(99,102,241,0.28)',
    facts: [
      {
        citation: 'Walker 2017',
        text: '90-minute NREM–REM cycles repeat 4–6 times per night. Early-night cycles are dominated by SWS (physical restoration); late-night cycles by REM (emotional memory consolidation). Cutting sleep short by 2h eliminates 20–25% of total REM — the stages disproportionately lost are the most cognitively valuable.',
        stat: 'Missing 2h → −20–25% REM',
      },
      {
        citation: 'Dijk 2010',
        text: 'SWS is characterised by delta waves at 0.5–4 Hz. 80% of growth hormone secretion is coupled to the first SWS bout of the night. SWS declines ~2% per decade after age 30. Resistance training acutely increases SWS by 12–20%, explaining muscle repair during sleep.',
        stat: '80% GH secretion in first SWS',
      },
      {
        citation: 'Tononi 2006 (Synaptic Homeostasis Hypothesis)',
        text: 'SWS restores synaptic weights via global downscaling — synapses strengthened during waking are selectively pruned to preserve signal-to-noise and energy efficiency. Xie 2013: the glymphatic system clears brain metabolic waste (including amyloid-beta and tau) 10× faster during sleep vs. waking. Alzheimer\'s plaques are cleared nightly.',
        stat: 'Glymphatic clearance 10× faster',
      },
      {
        citation: 'Carskadon 2011 + Banks 2007',
        text: 'Sleep need by age: adolescents 8–10h (biological phase delay 2–3h shifts their circadian window later); adults 7–9h; elderly 7–8h but increasingly fragmented. Banks 2007: 14 consecutive nights at 6h/night accumulates cognitive impairment equivalent to 48h of total sleep deprivation — and subjects cannot self-assess their own impairment after 6+ days.',
        stat: '6h × 14 nights = 48h deprivation',
      },
    ],
  },
  {
    icon: 'A',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#60a5fa',
    title: 'Sleep & Athletic Performance',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Mah 2011 (Sleep)',
        text: 'Stanford basketball players extended sleep to 10h/night for 5–7 weeks: sprint speed +5%, free throw accuracy +9%, 3-point shooting +9.2%, reaction time −9.2%. Effect replicated in football, tennis, and swimming cohorts. Sleep extension is arguably the most potent legal performance enhancer available to athletes.',
        stat: '3-pt shooting +9.2% with 10h sleep',
      },
      {
        citation: 'Halson 2014',
        text: 'During sleep: GH, testosterone, and IGF-1 peak; cortisol reaches its daily nadir. Even with adequate carbohydrate intake, one night of sleep deprivation reduces glycogen synthesis by 25%. Muscle protein synthesis is approximately 2× higher during sleep compared to the same duration of daytime rest.',
        stat: 'Glycogen synthesis −25% with no sleep',
      },
      {
        citation: 'Simpson 2017 (BJSM) + Czeisler 2011',
        text: 'Athletes sleeping <8h per night have 1.7× higher injury risk vs those sleeping ≥8h. Reaction time after 21 hours of wakefulness is equivalent to a blood alcohol concentration of 0.08%. Czeisler 2011: driving while sleepy is statistically more dangerous per hour than driving drunk — yet far less stigmatised.',
        stat: '<8h sleep → 1.7× injury risk',
      },
      {
        citation: 'Fullagar 2015',
        text: 'A single poor night increases perceived exertion by ~30%, reduces time-to-exhaustion by 10–30%, and decreases maximal strength output by ~20%. Notably, VO₂max is preserved — the primary mechanism is dramatically elevated central governor signalling, not peripheral muscle failure.',
        stat: 'Time-to-exhaustion −10–30%',
      },
    ],
  },
  {
    icon: 'D',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fb923c',
    title: 'Sleep Deprivation Effects',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    facts: [
      {
        citation: 'Van Dongen 2003 (Sleep)',
        text: '14 days of 6h/night produces cognitive impairment equivalent to 24h total sleep deprivation. Critically, subjects stopped perceiving worsening impairment after 6+ days — they felt stable while performance continued declining. One recovery night is insufficient: full cognitive restoration requires approximately 2 weeks.',
        stat: '14 nights × 6h = 24h deprivation',
      },
      {
        citation: 'Leproult 2010 (JAMA)',
        text: 'One week of sleep restriction to 5h/night reduces testosterone in young healthy men by 10–15% — the equivalent hormonal impact of 10–15 years of aging. Each additional hour of sleep is associated with ~15% higher testosterone the following morning.',
        stat: '5h × 1 week → −10–15% testosterone',
      },
      {
        citation: 'Spiegel 1999 (Lancet) + Taheri 2004',
        text: 'Six days at 4h/night: insulin sensitivity −30%, glucose clearance −40%. Simultaneously, leptin (satiety hormone) drops 18% and ghrelin (hunger hormone) rises 28%, driving appetite toward high-calorie, high-carbohydrate foods. Taheri 2004 (population study): each additional hour less sleep is associated with 3.7 lb higher body weight.',
        stat: 'Leptin −18%, ghrelin +28%',
      },
      {
        citation: 'Irwin 2015 + Cohen 2009',
        text: 'Four hours of sleep reduces natural killer (NK) cell activity by 72%. Cohen 2009: adults sleeping <7h per night are 3× more susceptible to rhinovirus infection. Vaccinations in sleep-deprived individuals produce 50% lower antibody titres — a clinically significant finding for seasonal flu and COVID-19 vaccine efficacy.',
        stat: 'NK cell activity −72% at 4h sleep',
      },
    ],
  },
  {
    icon: 'C',
    iconBg: 'rgba(139,92,246,0.15)',
    iconBorder: 'rgba(139,92,246,0.35)',
    iconColor: '#c4b5fd',
    title: 'Chronobiology & Circadian Rhythm',
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.10)',
    accentBorder: 'rgba(139,92,246,0.28)',
    facts: [
      {
        citation: 'Czeisler 1999',
        text: 'The suprachiasmatic nucleus (SCN) runs a 24.18-hour intrinsic period — slightly longer than a solar day, requiring daily light entrainment to stay aligned. Short-wavelength blue light (480 nm peak) suppresses melatonin via intrinsically photosensitive retinal ganglion cells (ipRGCs). Bright light exposure within 2 hours of bedtime delays sleep onset by 90–120 minutes.',
        stat: 'SCN period = 24.18h',
      },
      {
        citation: 'Zeitzer 2000',
        text: 'Chronotype performance peaks: morning types 09:00–12:00, evening types 17:00–21:00. Competing or performing cognitively outside your peak phase costs 3–7% output. Circadian adaptation to jet lag requires approximately 1 day per time zone crossed; eastward travel is harder due to phase advance.',
        stat: 'Off-peak chronotype = −3–7% performance',
      },
      {
        citation: 'Saper 2005 (Nature)',
        text: 'Two-process model of sleep regulation: Process C (circadian drive from SCN) and Process S (homeostatic adenosine buildup during waking). Caffeine competitively and reversibly blocks adenosine A1/A2A receptors — it does not eliminate adenosine, only masks it. Caffeine half-life ~5h; adenosine debt is "repaid" as a rebound on clearance, causing post-caffeine fatigue crashes.',
        stat: 'Caffeine half-life ~5h',
      },
      {
        citation: 'Potter 2016',
        text: 'Social jet lag — the difference between biological and social sleep timing — affects 87% of adults and averages >1h. Each additional hour of social jet lag is associated with 33% higher odds of obesity. Consistent sleep and wake timing (even at suboptimal durations) is more metabolically protective than variable timing with greater total sleep hours.',
        stat: 'Social jet lag +1h → +33% obesity odds',
      },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '18px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 150,
      }}
    >
      <p
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 3px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ScienceCard({
  icon,
  iconBg,
  iconBorder,
  iconColor,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  icon: string
  iconBg: string
  iconBorder: string
  iconColor: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { citation: string; text: string; stat: string }[]
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: iconColor,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {icon}
          </span>
        </div>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {facts.map((fact, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: accent,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  marginTop: 1,
                  background: `${accent}18`,
                  border: `1px solid ${accent}35`,
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                {fact.citation}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: accent,
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  textAlign: 'right',
                  maxWidth: 160,
                }}
              >
                {fact.stat}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              {fact.text}
            </p>
            {i < facts.length - 1 && (
              <div style={{ height: 1, background: '#1a1a1a', marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sleep Cycle Diagram ──────────────────────────────────────────────────────

function SleepCycleDiagram() {
  const totalMinutes = 480 // 8 hours

  const stageColors: Record<string, string> = {
    N1: '#334155',
    N2: '#1e3a8a',
    SWS: '#1d4ed8',
    REM: '#7c3aed',
  }

  const stageLabels: Record<string, string> = {
    N1: 'N1 Light',
    N2: 'N2 Core',
    SWS: 'SWS Deep',
    REM: 'REM',
  }

  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(99,102,241,0.08)',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          borderLeft: '3px solid #6366f1',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            90-Minute Sleep Cycle Architecture
          </h3>
          <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
            Walker 2017 — 5 cycles across 8h; early cycles are SWS-heavy, late cycles are REM-heavy
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 24px' }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          {Object.entries(stageLabels).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: stageColors[key],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Cycle rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SLEEP_CYCLES.map((cycle) => {
            return (
              <div key={cycle.cycle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Cycle label */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#475569',
                    flexShrink: 0,
                    width: 52,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  Cycle {cycle.cycle}
                </span>

                {/* Stage bar */}
                <div
                  style={{
                    flex: 1,
                    height: 28,
                    display: 'flex',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid #1a1a1a',
                  }}
                >
                  {cycle.stages.map((stage, i) => {
                    const cycleTotal = cycle.stages.reduce((sum, s) => sum + s.mins, 0)
                    const widthPct = (stage.mins / cycleTotal) * 100
                    return (
                      <div
                        key={i}
                        style={{
                          width: `${widthPct}%`,
                          background: stage.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                        title={`${stage.name}: ${stage.mins} min`}
                      >
                        {widthPct > 12 && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              color: 'rgba(255,255,255,0.75)',
                              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            }}
                          >
                            {stage.name}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* REM minutes label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#7c3aed',
                    flexShrink: 0,
                    width: 44,
                    textAlign: 'right',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {cycle.stages.find((s) => s.name === 'REM')?.mins}m REM
                </span>
              </div>
            )
          })}
        </div>

        {/* Time axis */}
        <div
          style={{
            display: 'flex',
            paddingLeft: 62,
            paddingRight: 56,
            marginTop: 6,
          }}
        >
          {[0, 90, 180, 270, 360, 450, 480].map((m) => (
            <div
              key={m}
              style={{
                flex: m === 480 ? 0 : 90,
                flexShrink: 0,
                fontSize: 10,
                color: '#334155',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              {m === 0 ? '0h' : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`}
            </div>
          ))}
        </div>

        {/* Callout: REM accumulation */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 8,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', margin: '0 0 4px' }}>
              Why the last 2 hours are critical (Walker 2017)
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              REM sleep accumulates disproportionately in cycles 4–5. An 8h sleeper gets ~115 min of REM;
              a 6h sleeper gets ~75 min — a 35% reduction, not the 25% proportional cut you might expect.
              Missing the last 2h doesn&apos;t cost 2/8 of all sleep stages equally: it eliminates the most
              cognitively and emotionally restorative sleep.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Caffeine Half-Life Calculator ────────────────────────────────────────────

function CaffeineCalculator() {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(139,92,246,0.08)',
          borderBottom: '1px solid rgba(139,92,246,0.2)',
          borderLeft: '3px solid #8b5cf6',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            Caffeine Cut-off Calculator
          </h3>
          <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
            Saper 2005 — half-life ~5h; last cup 7h before bed keeps residual caffeine below 12% of dose
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Half-life decay chart */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>
            Caffeine remaining after a 200 mg dose (half-life = 5h)
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
              height: 110,
            }}
          >
            {HALF_LIFE_DECAY.map((point) => {
              const isSafe = point.pct <= 25
              const barColor = isSafe
                ? 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)'
                : point.pct <= 50
                ? 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)'
                : 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)'
              return (
                <div
                  key={point.hour}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: 9, color: '#475569', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {point.pct}%
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${point.pct}%`,
                      background: barColor,
                      borderRadius: '4px 4px 2px 2px',
                      minHeight: 3,
                      boxShadow: isSafe ? '0 0 6px rgba(74,222,128,0.3)' : undefined,
                    }}
                  />
                  <span style={{ fontSize: 9, color: '#334155', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {point.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {[
              { color: '#dc2626', label: '>50% remaining — disrupts sleep architecture' },
              { color: '#d97706', label: '25–50% — delays sleep onset' },
              { color: '#16a34a', label: '<25% — generally tolerable for sleep' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cut-off table */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>
            Last-coffee cutoff by wake time (7h clearance window, Saper 2005)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                background: '#0d0d0d',
                borderBottom: '1px solid #1a1a1a',
                padding: '8px 16px',
              }}
            >
              {['Wake Time', 'Target Bedtime', 'Last Caffeine'].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#475569',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {CAFFEINE_CUTOFFS.map((row, i) => (
              <div
                key={row.wakeTime}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '10px 16px',
                  borderBottom: i < CAFFEINE_CUTOFFS.length - 1 ? '1px solid #141414' : 'none',
                  background: i % 2 === 0 ? 'transparent' : '#0d0d0d',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {row.wakeTime}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {row.bedtime}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#8b5cf6',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {row.cutoffLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Adenosine debt callout */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', margin: '0 0 4px' }}>
            The adenosine debt problem (Saper 2005)
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
            Caffeine blocks adenosine receptors but does not stop adenosine production. The sleepiness
            signal accumulates behind the caffeine blockade. When caffeine clears, the full adenosine load
            is revealed — creating the familiar &quot;afternoon crash.&quot; Regular use also upregulates adenosine
            receptors, increasing baseline tolerance and requiring more caffeine for the same alerting effect.
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SleepSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #060612 0%, #07050f 50%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a1a',
          padding: '52px 24px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glows */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: 360,
            height: 360,
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 500,
            height: 200,
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Icon cluster */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              marginBottom: 22,
            }}
          >
            {[
              { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', label: 'N', color: '#818cf8' },
              { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', label: 'A', color: '#60a5fa' },
              { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', label: 'D', color: '#fb923c' },
              { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', label: 'C', color: '#c4b5fd' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 900,
                  color: item.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  marginLeft: i > 0 ? -10 : 0,
                  boxShadow: '0 0 0 2px #0a0a0a',
                }}
              >
                {item.label}
              </div>
            ))}
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 6vw, 52px)',
              fontWeight: 900,
              margin: '0 0 14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 35%, #8b5cf6 70%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
            }}
          >
            Sleep Science
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#94a3b8',
              margin: '0 auto 20px',
              maxWidth: 580,
              lineHeight: 1.65,
            }}
          >
            The neuroscience and physiology of sleep — stages, athletic performance,
            deprivation effects, and chronobiology
          </p>

          {/* Tag row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Sleep Architecture', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' },
              { label: 'Athletic Performance', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
              { label: 'Deprivation', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
              { label: 'Chronobiology', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
            ].map((tag) => (
              <span
                key={tag.label}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: tag.color,
                  background: tag.bg,
                  border: `1px solid ${tag.border}`,
                  borderRadius: 20,
                  padding: '5px 14px',
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* ── Key stats ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              accent={s.accent}
            />
          ))}
        </div>

        {/* ── Sleep Cycle Diagram ────────────────────────────────────────────── */}
        <SleepCycleDiagram />

        {/* ── Research Deep-Dive ─────────────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#e2e8f0',
              margin: '0 0 16px',
              letterSpacing: '-0.2px',
            }}
          >
            Research Deep-Dive
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {SCIENCE_CARDS.map((card) => (
              <ScienceCard
                key={card.title}
                icon={card.icon}
                iconBg={card.iconBg}
                iconBorder={card.iconBorder}
                iconColor={card.iconColor}
                title={card.title}
                accent={card.accent}
                accentBg={card.accentBg}
                accentBorder={card.accentBorder}
                facts={card.facts}
              />
            ))}
          </div>
        </div>

        {/* ── Caffeine Half-Life Calculator ─────────────────────────────────── */}
        <CaffeineCalculator />

        {/* ── Two-process model visual ───────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(59,130,246,0.08)',
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              borderLeft: '3px solid #3b82f6',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Two-Process Sleep Regulation Model
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
              Saper 2005 (Nature) — Process S (adenosine homeostatic pressure) vs Process C (circadian drive)
            </p>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* Process bars — simulated waking and sleeping phases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Process S — adenosine buildup */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>Process S</span>
                    <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>Homeostatic sleep pressure (adenosine)</span>
                  </div>
                </div>
                <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                  {/* Waking — adenosine builds */}
                  <div
                    style={{
                      flex: 16,
                      background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 80%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Waking (16h) — adenosine accumulates</span>
                  </div>
                  {/* Sleep — adenosine clears */}
                  <div
                    style={{
                      flex: 8,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Sleep (8h) — clears</span>
                  </div>
                </div>
              </div>

              {/* Process C — circadian alerting */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>Process C</span>
                    <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>Circadian alerting signal (SCN)</span>
                  </div>
                </div>
                <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                  {/* Morning — low */}
                  <div style={{ flex: 4, background: '#2e1065', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, color: '#a78bfa' }}>06:00</span>
                  </div>
                  {/* Peak daytime alerting */}
                  <div
                    style={{
                      flex: 8,
                      background: 'linear-gradient(90deg, #4c1d95 0%, #7c3aed 40%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Peak circadian alerting</span>
                  </div>
                  {/* Evening wind-down */}
                  <div
                    style={{
                      flex: 4,
                      background: 'linear-gradient(90deg, #8b5cf6 0%, #5b21b6 60%, #2e1065 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 9, color: '#a78bfa' }}>22:00</span>
                  </div>
                  {/* Night — melatonin on */}
                  <div style={{ flex: 8, background: '#0f0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#4c1d95', fontWeight: 700 }}>Melatonin active</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Interaction note */}
            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                background: 'rgba(139,92,246,0.07)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: '#c4b5fd', margin: '0 0 4px', fontWeight: 700 }}>
                The &quot;wake maintenance zone&quot; paradox
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                In the 2 hours before habitual bedtime, the circadian alerting signal peaks to counteract
                rising adenosine pressure — making it difficult to fall asleep even when sleep-deprived.
                This is why evening alertness can feel deceptively high despite significant accumulated
                sleep debt.
              </p>
            </div>
          </div>
        </div>

        {/* ── Quick reference cards ──────────────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#e2e8f0',
              margin: '0 0 16px',
              letterSpacing: '-0.2px',
            }}
          >
            Evidence-Based Quick Reference
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {[
              {
                badge: 'LIGHT',
                title: 'Light Management',
                lines: [
                  'No bright light 2h before bed',
                  '480nm blue light blocks melatonin',
                  'Morning sunlight anchors SCN',
                ],
                color: '#f59e0b',
              },
              {
                badge: 'TIMING',
                title: 'Consistent Schedule',
                lines: [
                  'Same wake time 7 days/week',
                  'Social jet lag <1h target',
                  'Consistency > total duration',
                ],
                color: '#6366f1',
              },
              {
                badge: 'CAFFEINE',
                title: 'Caffeine Protocol',
                lines: [
                  'Last coffee ≥7h before bed',
                  'First coffee after 90–120 min awake',
                  'Half-life 5h — plan accordingly',
                ],
                color: '#8b5cf6',
              },
              {
                badge: 'ATHLETES',
                title: 'Sleep Extension',
                lines: [
                  'Aim for 9–10h during hard blocks',
                  'Naps 10–20 min (avoid SWS)',
                  '8h minimum for injury protection',
                ],
                color: '#3b82f6',
              },
              {
                badge: 'TEMP',
                title: 'Sleep Environment',
                lines: [
                  'Core temp must drop 1–2°C',
                  'Ideal room: 65–68°F (18–20°C)',
                  'Warm bath 1–2h pre-bed helps',
                ],
                color: '#06b6d4',
              },
              {
                badge: 'DEBT',
                title: 'Sleep Debt Reality',
                lines: [
                  'Full recovery takes 2 weeks',
                  'Cannot self-assess impairment',
                  '1 recovery night is not enough',
                ],
                color: '#ef4444',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#111111',
                  border: '1px solid #1f1f1f',
                  borderRadius: 12,
                  padding: '16px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: item.color,
                      background: `${item.color}18`,
                      border: `1px solid ${item.color}35`,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.badge}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#e2e8f0' }}>{item.title}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {item.lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: item.color,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chronotype performance window ──────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(139,92,246,0.08)',
              borderBottom: '1px solid rgba(139,92,246,0.2)',
              borderLeft: '3px solid #8b5cf6',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Chronotype Peak Performance Windows
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
              Zeitzer 2000 — competing outside chronotype peak costs 3–7% output; 1 day adaptation per time zone
            </p>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* 24-hour timeline */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              {/* Hour markers */}
              <div style={{ display: 'flex', marginBottom: 4 }}>
                {Array.from({ length: 13 }, (_, i) => i * 2).map((h) => (
                  <div
                    key={h}
                    style={{
                      flex: 1,
                      fontSize: 10,
                      color: '#334155',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Morning type bar */}
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  Morning type (chronotype early) — peak 09:00–12:00
                </span>
                <div style={{ height: 20, background: '#0d0d0d', borderRadius: 6, position: 'relative', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                  {/* Peak window: 09:00–12:00 out of 06:00–24:00 range (18h span displayed) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(9 / 24) * 100}%`,
                      width: `${(3 / 24) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0.7) 50%, rgba(251,191,36,0.3) 100%)',
                      borderLeft: '2px solid #fbbf24',
                      borderRight: '2px solid #fbbf24',
                    }}
                  />
                  {/* Moderate window: 07:00–09:00 */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(7 / 24) * 100}%`,
                      width: `${(2 / 24) * 100}%`,
                      height: '100%',
                      background: 'rgba(251,191,36,0.15)',
                    }}
                  />
                </div>
              </div>

              {/* Evening type bar */}
              <div>
                <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  Evening type (chronotype late) — peak 17:00–21:00
                </span>
                <div style={{ height: 20, background: '#0d0d0d', borderRadius: 6, position: 'relative', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                  {/* Peak window: 17:00–21:00 */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(17 / 24) * 100}%`,
                      width: `${(4 / 24) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(167,139,250,0.3) 0%, rgba(167,139,250,0.7) 50%, rgba(167,139,250,0.3) 100%)',
                      borderLeft: '2px solid #a78bfa',
                      borderRight: '2px solid #a78bfa',
                    }}
                  />
                  {/* Moderate window: 15:00–17:00 */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(15 / 24) * 100}%`,
                      width: `${(2 / 24) * 100}%`,
                      height: '100%',
                      background: 'rgba(167,139,250,0.15)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Jet lag note */}
            <div
              style={{
                marginTop: 16,
                padding: '11px 14px',
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                <strong style={{ color: '#a5b4fc' }}>Jet lag protocol (Zeitzer 2000):</strong> Allow 1 day of adaptation per time zone crossed.
                Eastward travel is harder (phase advance) than westward (phase delay).
                Strategic morning light exposure (eastward) or evening light exposure (westward) accelerates re-entrainment by up to 50%.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
