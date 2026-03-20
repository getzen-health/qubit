'use client'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sessions', value: '112', sub: 'past 12 months' },
  { label: 'Avg Duration', value: '78 min', sub: 'per session' },
  { label: 'Avg Kcal Burned', value: '624 kcal', sub: 'per session' },
]

const SESSION_TYPES = [
  { name: 'Long Endurance', desc: '≥ 2 h', pct: 22, color: '#ca8a04' },
  { name: 'Group Ride / Race', desc: '1 – 3 h', pct: 31, color: '#d97706' },
  { name: 'Interval / Threshold', desc: '45 – 90 min', pct: 34, color: '#f59e0b' },
  { name: 'Indoor / Trainer', desc: '< 90 min', pct: 13, color: '#fbbf24' },
]

const WEEKLY_CALORIES = [
  { week: 'Wk 1', kcal: 4210 },
  { week: 'Wk 2', kcal: 6380 },
  { week: 'Wk 3', kcal: 3140 },
  { week: 'Wk 4', kcal: 7520 },
  { week: 'Wk 5', kcal: 5860 },
  { week: 'Wk 6', kcal: 4490 },
  { week: 'Wk 7', kcal: 6970 },
  { week: 'Wk 8', kcal: 5230 },
]

const MAX_WEEKLY_KCAL = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const POWER_ZONES = [
  { zone: 'Z1', name: 'Recovery', ftpRange: '< 55%', color: '#6b7280', barColor: '#374151', watts: '< 165 W' },
  { zone: 'Z2', name: 'Aerobic Base', ftpRange: '56 – 75%', color: '#3b82f6', barColor: '#1d4ed8', watts: '168–225 W' },
  { zone: 'Z3', name: 'Tempo', ftpRange: '76 – 90%', color: '#10b981', barColor: '#059669', watts: '228–270 W' },
  { zone: 'Z4', name: 'Threshold', ftpRange: '91 – 105%', color: '#f59e0b', barColor: '#d97706', watts: '273–315 W' },
  { zone: 'Z5', name: 'VO₂max', ftpRange: '106 – 120%', color: '#f97316', barColor: '#ea580c', watts: '318–360 W' },
  { zone: 'Z6', name: 'Anaerobic', ftpRange: '121 – 150%', color: '#ef4444', barColor: '#dc2626', watts: '363–450 W' },
  { zone: 'Z7', name: 'Neuromuscular', ftpRange: '> 150%', color: '#a855f7', barColor: '#9333ea', watts: '> 450 W' },
]

const SCIENCE_CARDS = [
  {
    emoji: '⚡',
    title: 'Power & FTP Science',
    accent: '#ca8a04',
    accentBg: 'rgba(202,138,4,0.12)',
    accentBorder: 'rgba(202,138,4,0.3)',
    facts: [
      {
        label: 'Allen 2010: FTP defined as 95% of peak 20-min maximal sustained power; gold standard for training prescription in cycling performance research',
        value: 'FTP = 95% × 20-min max',
      },
      {
        label: 'Coggan 2003: TSS (Training Stress Score), CTL (Chronic Training Load), ATL (Acute Training Load), and TSB (Form) model — optimal race readiness at TSB +10 to +25',
        value: 'Peak TSB +10 to +25',
      },
      {
        label: 'Pinot 2014: Critical Power (CP) model and W′ (anaerobic work capacity) depletion above CP predict time-to-exhaustion; pros maintain 330–380 W CP with W′ 18–26 kJ',
        value: 'W′ 18–26 kJ elite',
      },
      {
        label: 'Coggan zones target distinct physiological adaptations: Z2 mitochondrial density, Z4 lactate clearance enzymes, Z5 central cardiac output; pros 5.5–6.5 W/kg FTP, Cat 3 3.5–4.2 W/kg',
        value: 'Pros 5.5–6.5 W/kg FTP',
      },
    ],
  },
  {
    emoji: '🦵',
    title: 'Pedaling Biomechanics',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.3)',
    facts: [
      {
        label: 'Dorel 2010: peak pedal force 500–900 N occurs at 90–100° crank angle (3 o\'clock position); oval chainrings reduce dead-spot inefficiency and improve average torque by ~20%',
        value: 'Peak force 500–900 N at 90°',
      },
      {
        label: 'Leirdal 2011: cadence of 90 RPM reduces type II (fast-twitch) muscle fiber activation by 18% vs. 60 RPM — lower neuromuscular fatigue and improved endurance economy',
        value: '90 RPM −18% type II activation',
      },
      {
        label: 'McDaniel 2002: pedaling effectiveness (index of effectiveness) is 20–22% in elite cyclists vs. 14–17% in amateurs — elite riders apply more tangential force throughout the pedal stroke',
        value: 'Elite effectiveness 20–22%',
      },
      {
        label: 'Divert 2005: knee angle of 25–35° at bottom dead center is biomechanically optimal; 1 cm too-low saddle increases vastus lateralis activation by ~4% and patellar compression force',
        value: 'Optimal knee BDC 25–35°',
      },
    ],
  },
  {
    emoji: '🫀',
    title: 'Physiology & Adaptation',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.3)',
    facts: [
      {
        label: 'Bassett 2000: elite road cyclists achieve VO₂max of 75–90 mL/kg/min; VO₂max sets the ceiling, but cycling economy and fractional utilisation determine race performance at sub-maximal intensities',
        value: 'Elite VO₂max 75–90 mL/kg/min',
      },
      {
        label: 'Coyle 1991: cycling economy improves 5–10% with years of training through increased type I slow-twitch fiber recruitment and reduced energy cost per watt at sub-threshold intensities',
        value: 'Economy +5–10% with training',
      },
      {
        label: 'Iaia 2009: speed endurance training (10 × 30 s all-out with 3 min recovery, 3×/week) improves 40 km TT performance by ~4% in 4 weeks via enhanced oxidative enzyme capacity',
        value: '40 km TT +4% in 4 weeks',
      },
      {
        label: 'Mujika 2000: altitude training (2,000–2,500 m) increases hemoglobin mass by +3–6%, and 40 km TT performance by +3.5% upon return to sea level; live-high train-low optimal protocol',
        value: 'Altitude +3–6% hemoglobin',
      },
    ],
  },
  {
    emoji: '🩺',
    title: 'Injury Prevention',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.12)',
    accentBorder: 'rgba(168,85,247,0.3)',
    facts: [
      {
        label: 'Bini 2014: 85% of competitive cyclists sustain at least one overuse injury per season; anterior knee pain 28%, iliotibial band syndrome 24%, lower back pain 23% of all reported injuries',
        value: '85% cyclists injured/season',
      },
      {
        label: 'Dettori 2006: cleat fore-aft positioning affects patellar tendon strain by up to 30%; floating cleats reduce lateral knee stress 15% vs. fixed; saddle height ±3% FTP alters injury risk',
        value: 'Cleat alignment ±30% tendon strain',
      },
      {
        label: 'Wilber 1995: cyclist\'s palsy (ulnar neuropathy) affects ~30% of long-distance cyclists; padded gloves and bar tape reduce peak handlebar pressure by ~35% and symptom incidence',
        value: 'Padded gloves −35% pressure',
      },
      {
        label: 'Priego Quesada 2014: anterior saddle tilt (nose-down > 10°) increases perineal pressure by 3×; level or slight nose-up saddle reduces soft tissue numbness and vascular compression',
        value: 'Anterior tilt 3× perineal pressure',
      },
    ],
  },
]

const RECENT_SESSIONS = [
  { id: '1', date: 'Thu, Mar 19', type: 'Interval / Threshold', duration: '82 min', kcal: 748 },
  { id: '2', date: 'Mon, Mar 16', type: 'Indoor / Trainer', duration: '65 min', kcal: 531 },
  { id: '3', date: 'Sat, Mar 14', type: 'Long Endurance', duration: '3 h 12 min', kcal: 1842 },
  { id: '4', date: 'Wed, Mar 11', type: 'Group Ride / Race', duration: '2 h 5 min', kcal: 1320 },
  { id: '5', date: 'Sun, Mar 8', type: 'Interval / Threshold', duration: '75 min', kcal: 694 },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        padding: '20px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <p style={{ fontSize: 26, fontWeight: 800, color: '#ca8a04', margin: 0, letterSpacing: '-0.5px' }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', margin: '4px 0 2px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{sub}</p>
    </div>
  )
}

function ScienceCard({
  emoji,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: {
  emoji: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { label: string; value: string }[]
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
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#f1f5f9',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {facts.map((fact, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
              {fact.label}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: accent,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function sessionTypeColor(type: string): string {
  if (type === 'Long Endurance') return '#ca8a04'
  if (type === 'Group Ride / Race') return '#d97706'
  if (type === 'Interval / Threshold') return '#f59e0b'
  if (type === 'Indoor / Trainer') return '#fbbf24'
  return '#ca8a04'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CyclingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1000 0%, #0f0900 40%, #0a0a0a 100%)',
          borderBottom: '1px solid #1f1f1f',
          padding: '48px 24px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 440,
            height: 440,
            background: 'radial-gradient(circle, rgba(202,138,4,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(202,138,4,0.15)',
              border: '1px solid rgba(202,138,4,0.35)',
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            🚴
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #ca8a04, #d97706, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Cycling Science
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              margin: '0 auto 16px',
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            Power output &amp; FTP methodology · pedaling biomechanics &amp; efficiency ·
            cycling physiology &amp; adaptation · injury prevention research
          </p>

          {/* FTP calculator note */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(202,138,4,0.1)',
              border: '1px solid rgba(202,138,4,0.25)',
              borderRadius: 20,
              padding: '6px 14px',
            }}
          >
            <span style={{ fontSize: 13 }}>🧮</span>
            <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 500 }}>
              FTP estimate: ride 20 min all-out solo, multiply average power by 0.95
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 880,
          margin: '0 auto',
          padding: '32px 16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {STATS.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </div>

        {/* ── Session type breakdown ─────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Session Type Breakdown
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Distribution of cycling session formats over the past 90 days
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SESSION_TYPES.map((s) => (
              <div key={s.name}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: s.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#475569',
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: 4,
                        padding: '1px 6px',
                      }}
                    >
                      {s.desc}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                </div>
                <div
                  style={{
                    height: 7,
                    background: '#1a1a1a',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${s.pct}%`,
                      background: s.color,
                      borderRadius: 999,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly calorie chart ───────────────────────────────────────────── */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            padding: '20px 20px 24px',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
            Weekly Calorie Output
          </h3>
          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 20px' }}>
            Total active calories burned across all cycling sessions — last 8 weeks
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              height: 150,
            }}
          >
            {WEEKLY_CALORIES.map((w) => {
              const heightPct = (w.kcal / MAX_WEEKLY_KCAL) * 100
              return (
                <div
                  key={w.week}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                    {w.kcal >= 1000 ? `${(w.kcal / 1000).toFixed(1)}k` : w.kcal}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #fbbf24 0%, #ca8a04 100%)',
                      borderRadius: '5px 5px 3px 3px',
                      minHeight: 4,
                      boxShadow: '0 0 10px rgba(202,138,4,0.35)',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{w.week}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Power Zones Reference Card ─────────────────────────────────────── */}
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
              background: 'rgba(202,138,4,0.1)',
              borderBottom: '1px solid rgba(202,138,4,0.2)',
              borderLeft: '3px solid #ca8a04',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Coggan Power Zones
              </h3>
            </div>
            <span style={{ fontSize: 11, color: '#92400e', background: 'rgba(202,138,4,0.15)', border: '1px solid rgba(202,138,4,0.25)', borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>
              Based on estimated FTP 300 W
            </span>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {POWER_ZONES.map((z, i) => {
              // Visual bar width: scale by zone order for a gradient feel
              const barWidths = [30, 50, 62, 74, 82, 90, 98]
              return (
                <div
                  key={z.zone}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Zone badge */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${z.color}22`,
                      border: `1px solid ${z.color}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: z.color }}>{z.zone}</span>
                  </div>

                  {/* Name + bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{z.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{z.ftpRange} FTP</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: z.color }}>{z.watts}</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: '#1a1a1a', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidths[i]}%`,
                          background: `linear-gradient(90deg, ${z.barColor}, ${z.color})`,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <p style={{ fontSize: 11, color: '#334155', margin: '6px 0 0', textAlign: 'center' }}>
              Zone widths are illustrative · actual watts scale linearly with your FTP
            </p>
          </div>
        </div>

        {/* ── Science cards ──────────────────────────────────────────────────── */}
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {SCIENCE_CARDS.map((card) => (
              <ScienceCard
                key={card.title}
                emoji={card.emoji}
                title={card.title}
                accent={card.accent}
                accentBg={card.accentBg}
                accentBorder={card.accentBorder}
                facts={card.facts}
              />
            ))}
          </div>
        </div>

        {/* ── Recent sessions ────────────────────────────────────────────────── */}
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
              padding: '16px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Recent Sessions
            </h3>
            <span style={{ fontSize: 11, color: '#475569' }}>last 5 rides</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {RECENT_SESSIONS.map((session, i) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < RECENT_SESSIONS.length - 1 ? '1px solid #141414' : 'none',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sessionTypeColor(session.type),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#e2e8f0',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.type}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{session.date}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                      {session.duration}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>duration</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#ca8a04', margin: 0 }}>
                      {session.kcal.toLocaleString()} kcal
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>burned</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
