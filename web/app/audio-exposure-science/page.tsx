'use client'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const weeklyExposure = [
  { week: 'Feb 3', avg: 67, peak: 82 },
  { week: 'Feb 10', avg: 71, peak: 88 },
  { week: 'Feb 17', avg: 69, peak: 79 },
  { week: 'Feb 24', avg: 78, peak: 95 },
  { week: 'Mar 3', avg: 74, peak: 91 },
  { week: 'Mar 10', avg: 70, peak: 84 },
  { week: 'Mar 17', avg: 73, peak: 89 },
  { week: 'Mar 20', avg: 72, peak: 98 },
]

const currentStats = {
  avgWeekly: 72,
  peakExposure: 98,
  highRiskDays: 2,
  safeListeningScore: 74,
  headphoneHours: 3.2,
  environmentHours: 8.5,
}

const exposureScale = [
  { label: 'Whisper / Rustling leaves', db: 30, color: '#22c55e' },
  { label: 'Library / Quiet office', db: 45, color: '#4ade80' },
  { label: 'Normal conversation', db: 60, color: '#a3e635' },
  { label: 'Restaurant / TV', db: 70, color: '#facc15' },
  { label: 'Traffic / Busy street', db: 85, color: '#fb923c' },
  { label: 'Subway / Power tools', db: 90, color: '#f97316' },
  { label: 'Concert / Nightclub', db: 100, color: '#ef4444' },
  { label: 'Stadium / Rock concert', db: 110, color: '#dc2626' },
  { label: 'Live music front-row', db: 120, color: '#b91c1c' },
  { label: 'Jet engine at 100 ft', db: 150, color: '#7f1d1d' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskColor(db: number): string {
  if (db >= 85) return '#ef4444'
  if (db >= 75) return '#f97316'
  return '#22c55e'
}

function getRiskLabel(db: number): string {
  if (db >= 85) return 'High Risk'
  if (db >= 75) return 'Moderate'
  return 'Safe'
}

function getRiskBg(db: number): string {
  if (db >= 85) return 'rgba(239,68,68,0.12)'
  if (db >= 75) return 'rgba(249,115,22,0.12)'
  return 'rgba(34,197,94,0.12)'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  accentColor,
  accentBg,
  emoji,
  bullets,
}: {
  title: string
  accentColor: string
  accentBg: string
  emoji: string
  bullets: { label: string; detail: string }[]
}) {
  return (
    <div
      style={{
        background: '#111',
        border: `1px solid ${accentColor}33`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentColor}33`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span
          style={{
            color: accentColor,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </span>
      </div>

      {/* Bullet rows */}
      <div style={{ padding: '4px 0' }}>
        {bullets.map((b, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              padding: '13px 20px',
              borderBottom:
                i < bullets.length - 1 ? '1px solid #1a1a1a' : 'none',
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: accentColor,
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <div>
              <span
                style={{ color: '#e5e5e5', fontWeight: 600, fontSize: 13 }}
              >
                {b.label}
              </span>
              {b.detail && (
                <p style={{ color: '#888', fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
                  {b.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AudioExposureSciencePage() {
  const riskColor = getRiskColor(currentStats.avgWeekly)
  const riskLabel = getRiskLabel(currentStats.avgWeekly)
  const riskBg = getRiskBg(currentStats.avgWeekly)

  // Chart dimensions
  const chartHeight = 180
  const minDb = 55
  const maxDb = 105
  const whoLimit = 80

  // WHO line position (from bottom)
  const whoLineY =
    chartHeight -
    ((whoLimit - minDb) / (maxDb - minDb)) * chartHeight

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        paddingBottom: 80,
      }}
    >
      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a0533 0%, #0a0a0a 60%)',
          borderBottom: '1px solid #1f1f1f',
          padding: '40px 20px 36px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🎧</div>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: '#fff',
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          Audio Exposure Science
        </h1>
        <p
          style={{
            color: '#a78bfa',
            fontSize: 14,
            marginTop: 8,
            marginBottom: 0,
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}
        >
          Cochlear damage mechanisms, noise dose limits, tinnitus research, and
          evidence-based safe listening strategies — grounded in peer-reviewed
          science.
        </p>
      </div>

      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* ── Current Exposure Status Card ──────────────────────────────────── */}
        <div
          style={{
            background: '#111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
              Current Exposure Status
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#555' }}>
              Past 7 days
            </span>
          </div>

          {/* Risk banner */}
          <div
            style={{
              background: riskBg,
              borderBottom: `1px solid ${riskColor}22`,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: riskColor,
                boxShadow: `0 0 8px ${riskColor}`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: riskColor, fontWeight: 700, fontSize: 14 }}>
              {riskLabel}
            </span>
            <span style={{ color: '#888', fontSize: 13 }}>
              — weekly average is within{' '}
              {currentStats.avgWeekly < 75
                ? 'safe'
                : currentStats.avgWeekly < 85
                ? 'moderate-risk'
                : 'high-risk'}{' '}
              range
            </span>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              borderTop: 'none',
            }}
          >
            {[
              {
                label: 'Avg Weekly',
                value: `${currentStats.avgWeekly} dB`,
                sub: 'LA,eq 7-day',
                color: getRiskColor(currentStats.avgWeekly),
              },
              {
                label: 'Peak',
                value: `${currentStats.peakExposure} dB`,
                sub: 'Impulse max',
                color: getRiskColor(currentStats.peakExposure),
              },
              {
                label: 'High-Risk Days',
                value: `${currentStats.highRiskDays}`,
                sub: '≥ 85 dB days',
                color: currentStats.highRiskDays > 0 ? '#ef4444' : '#22c55e',
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: '18px 16px',
                  borderRight: i < 2 ? '1px solid #1a1a1a' : 'none',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: stat.color,
                    letterSpacing: -0.5,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Risk scale bar */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 10,
                color: '#666',
              }}
            >
              <span>55 dB</span>
              <span style={{ color: '#22c55e' }}>Safe &lt;75</span>
              <span style={{ color: '#f97316' }}>Moderate 75–84</span>
              <span style={{ color: '#ef4444' }}>High ≥85</span>
              <span>105 dB</span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background:
                  'linear-gradient(to right, #22c55e 0%, #22c55e 38%, #facc15 52%, #f97316 65%, #ef4444 100%)',
                position: 'relative',
              }}
            >
              {/* Indicator needle */}
              <div
                style={{
                  position: 'absolute',
                  left: `${((currentStats.avgWeekly - 55) / (105 - 55)) * 100}%`,
                  top: -4,
                  transform: 'translateX(-50%)',
                  width: 3,
                  height: 16,
                  background: '#fff',
                  borderRadius: 2,
                  boxShadow: '0 0 6px rgba(255,255,255,0.6)',
                }}
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: '#888' }}>
              Current avg:{' '}
              <span style={{ color: riskColor, fontWeight: 700 }}>
                {currentStats.avgWeekly} dB
              </span>
            </div>
          </div>
        </div>

        {/* ── Weekly Exposure Chart ─────────────────────────────────────────── */}
        <div
          style={{
            background: '#111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>📈</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
              8-Week Exposure Trend
            </span>
          </div>

          <div style={{ padding: '20px 20px 16px' }}>
            {/* Y-axis labels + chart */}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Y-axis */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: chartHeight,
                  paddingBottom: 0,
                  fontSize: 10,
                  color: '#555',
                  textAlign: 'right',
                  minWidth: 32,
                }}
              >
                <span>105</span>
                <span>90</span>
                <span>80</span>
                <span>70</span>
                <span>55</span>
              </div>

              {/* Chart area */}
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Grid lines */}
                {[55, 70, 80, 90, 105].map((db) => {
                  const yPct =
                    ((db - minDb) / (maxDb - minDb)) * chartHeight
                  const fromTop = chartHeight - yPct
                  return (
                    <div
                      key={db}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: fromTop,
                        height: 1,
                        background:
                          db === 80 ? 'rgba(249,115,22,0.4)' : '#1a1a1a',
                        zIndex: db === 80 ? 2 : 1,
                      }}
                    />
                  )
                })}

                {/* WHO limit label */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: whoLineY - 14,
                    fontSize: 10,
                    color: '#f97316',
                    fontWeight: 600,
                    zIndex: 3,
                    background: '#111',
                    padding: '1px 4px',
                    borderRadius: 3,
                  }}
                >
                  WHO 80 dB limit
                </div>

                {/* Bars */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    height: chartHeight,
                    gap: 6,
                    position: 'relative',
                    zIndex: 3,
                  }}
                >
                  {weeklyExposure.map((w, i) => {
                    const barH =
                      ((w.avg - minDb) / (maxDb - minDb)) * chartHeight
                    const isLatest = i === weeklyExposure.length - 1
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: chartHeight,
                          justifyContent: 'flex-end',
                        }}
                      >
                        {/* dB label above bar */}
                        <div
                          style={{
                            fontSize: 9,
                            color: getRiskColor(w.avg),
                            fontWeight: 700,
                            marginBottom: 2,
                          }}
                        >
                          {w.avg}
                        </div>
                        {/* Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: barH,
                            background: getRiskColor(w.avg),
                            borderRadius: '4px 4px 2px 2px',
                            opacity: isLatest ? 1 : 0.75,
                            boxShadow: isLatest
                              ? `0 0 10px ${getRiskColor(w.avg)}66`
                              : 'none',
                            position: 'relative',
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* X-axis labels */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginTop: 8,
                paddingLeft: 40,
              }}
            >
              {weeklyExposure.map((w, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 9,
                    color: i === weeklyExposure.length - 1 ? '#a78bfa' : '#555',
                    fontWeight: i === weeklyExposure.length - 1 ? 700 : 400,
                  }}
                >
                  {w.week}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 14,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {[
                { color: '#22c55e', label: 'Safe (< 75 dB)' },
                { color: '#f97316', label: 'Moderate (75–84 dB)' },
                { color: '#ef4444', label: 'High Risk (≥ 85 dB)' },
                { color: '#f97316', label: 'WHO 80 dB limit', dashed: true },
              ].map((l, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {l.dashed ? (
                    <div
                      style={{
                        width: 18,
                        height: 2,
                        background: l.color,
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: l.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span style={{ fontSize: 10, color: '#777' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Exposure Level Reference Scale ────────────────────────────────── */}
        <div
          style={{
            background: '#111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>🔊</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
              Sound Level Reference Scale
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {exposureScale.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 20px',
                  borderBottom:
                    i < exposureScale.length - 1
                      ? '1px solid #161616'
                      : 'none',
                }}
              >
                {/* dB badge */}
                <div
                  style={{
                    minWidth: 44,
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.db}
                </div>
                <span style={{ color: '#888', fontSize: 12 }}>dB</span>
                {/* Bar fill */}
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: '#1a1a1a',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${((item.db - 30) / (150 - 30)) * 100}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                {/* Label */}
                <div
                  style={{
                    minWidth: 150,
                    fontSize: 12,
                    color: '#bbb',
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(239,68,68,0.06)',
              borderTop: '1px solid #1a1a1a',
              fontSize: 11,
              color: '#888',
              lineHeight: 1.5,
            }}
          >
            ⚠️ Every 10 dB increase represents a 10× increase in sound intensity (perceived as ~2× louder).
            At 150 dB, immediate permanent hearing damage occurs.
          </div>
        </div>

        {/* ── Science Cards ─────────────────────────────────────────────────── */}
        <SectionCard
          emoji="📐"
          title="Noise Dose & Exposure Limits"
          accentColor="#3b82f6"
          accentBg="rgba(59,130,246,0.08)"
          bullets={[
            {
              label: 'WHO 2015: 80 dB safe for 40 h/week',
              detail:
                'Every 3 dB increase halves the permissible exposure time — a fundamental principle of equal-energy noise dose.',
            },
            {
              label: 'OSHA limits: 90 dB = 8 h, 95 dB = 4 h, 100 dB = 2 h',
              detail:
                'Occupational Safety & Health Administration uses a 5 dB exchange rate; many audiologists prefer the stricter 3 dB WHO standard.',
            },
            {
              label: 'Decibel scale: 10 dB = 10× intensity, perceived as ~2× louder',
              detail:
                'The logarithmic scale means small numerical differences correspond to large physical energy differences at high levels.',
            },
            {
              label: 'Apple Watch uses LA,eq A-weighted 7-day rolling average',
              detail:
                'A-weighting filters low frequencies to match human hearing sensitivity; the 7-day rolling metric aligns with WHO weekly dose recommendations.',
            },
          ]}
        />

        <SectionCard
          emoji="🧬"
          title="Cochlear Damage Mechanisms"
          accentColor="#f97316"
          accentBg="rgba(249,115,22,0.08)"
          bullets={[
            {
              label:
                'Saunders 1991: NIHL via OHC deflection and glutamate excitotoxicity — OHC loss is permanent',
              detail:
                'Outer hair cell stereocilia are mechanically deflected beyond elastic limits. Glutamate excitotoxicity further destroys auditory nerve terminals. Mammals cannot regenerate OHCs.',
            },
            {
              label:
                "Kujawa 2009: Cochlear synaptopathy — 'hidden hearing loss' destroys nerve synapses before audiogram changes",
              detail:
                'Noise exposures that cause only temporary threshold shifts can silently eliminate 40–50% of cochlear nerve synapses. Standard audiograms cannot detect this damage.',
            },
            {
              label:
                'Henderson 2006: TTS recovers in 12–16 h; repeated TTS cycles cause permanent threshold shift (PTS)',
              detail:
                'Temporary threshold shift (TTS) appears as muffled hearing or tinnitus after loud exposure. Cumulative TTS events accelerate permanent sensorineural hearing loss.',
            },
            {
              label:
                'Liberman 2015: 30–50% synapse loss in young adults with normal audiograms',
              detail:
                'Post-mortem human cochlea studies reveal extensive synaptopathy in individuals with lifetime recreational noise exposure — decades before clinical hearing loss presents.',
            },
          ]}
        />

        <SectionCard
          emoji="🛡️"
          title="Protection & Safe Listening"
          accentColor="#22c55e"
          accentBg="rgba(34,197,94,0.08)"
          bullets={[
            {
              label: "WHO 60/60 rule: max 60% volume for max 60 minutes",
              detail:
                'Simple behavioral guideline to keep personal listening device exposure below 80 dB LA,eq — validated in population-level WHO safe listening recommendations (2022).',
            },
            {
              label:
                'Berger 2003: Real-world foam earplugs reduce ~17 dB vs. rated 33 dB NRR',
              detail:
                'Improper insertion, failure to roll-down fully, or poor fit reduces attenuation by half. Custom-molded plugs and triple-flange designs outperform foam in sustained use.',
            },
            {
              label:
                'Noise-canceling headphones allow lower volume in noisy environments',
              detail:
                'Active noise cancellation reduces the need to raise volume to overcome background noise — a major driver of recreational overexposure on commutes and flights.',
            },
            {
              label:
                'Rawool 2012: 16–24 hours quiet recovery after > 85 dB exposure',
              detail:
                'Cochlear metabolic processes require extended quiet to restore blood flow, replenish glutathione antioxidants, and repair cytoskeletal damage in hair cells.',
            },
          ]}
        />

        <SectionCard
          emoji="🔬"
          title="Tinnitus, Recovery & Future Therapies"
          accentColor="#a855f7"
          accentBg="rgba(168,85,247,0.08)"
          bullets={[
            {
              label:
                'Bhatt 2016: 50 M Americans have tinnitus; unprotected gun use = 2.4× risk',
              detail:
                'Tinnitus affects ~15% of the US population. Impulse noise from firearms is a leading preventable cause, with risk doubling without hearing protection.',
            },
            {
              label:
                'Shore 2016: Bimodal stimulation partially reverses cortical tinnitus changes',
              detail:
                'Paired auditory-somatosensory stimulation (sound + mild electrical nerve stimulation) induces cortical plasticity that suppresses tinnitus in animal models and early human trials.',
            },
            {
              label:
                'Kujawa 2019: FX-322 and gene therapy clinical trials ongoing',
              detail:
                'FX-322 (Frequency Therapeutics) targets Wnt/Notch pathways to regenerate cochlear hair cells. ATOH1 gene therapy aims to restore OHCs — Phase 2 trials underway.',
            },
            {
              label:
                'CBT reduces tinnitus distress 40–50% (Martinez 2013)',
              detail:
                'Cognitive behavioral therapy is currently the highest-evidence intervention for tinnitus-related distress, reducing anxiety, sleep disruption, and perceived loudness through neural habituation.',
            },
          ]}
        />

        {/* ── Your Listening Habits Card ────────────────────────────────────── */}
        <div
          style={{
            background: '#111',
            border: '1px solid #2d1f5e',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(124,58,237,0.1)',
              borderBottom: '1px solid #2d1f5e',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>🎵</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>
              Your Listening Habits
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>
              Today's breakdown
            </span>
          </div>

          {/* Headphone + Environment rows */}
          {[
            {
              label: 'Headphone Listening',
              hours: currentStats.headphoneHours,
              icon: '🎧',
              maxH: 8,
              color: '#7c3aed',
              sub: 'Avg ~71 dB • 3 sessions',
            },
            {
              label: 'Environmental Exposure',
              hours: currentStats.environmentHours,
              icon: '🌆',
              maxH: 16,
              color: '#3b82f6',
              sub: 'Commute + office + street',
            },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>{row.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>
                  {row.label}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 18,
                    fontWeight: 800,
                    color: row.color,
                  }}
                >
                  {row.hours}h
                </span>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  background: '#1a1a1a',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: `${Math.min((row.hours / row.maxH) * 100, 100)}%`,
                    height: '100%',
                    background: row.color,
                    borderRadius: 3,
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>{row.sub}</div>
            </div>
          ))}

          {/* Safe Listening Score */}
          <div style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: '#e5e5e5' }}
                >
                  Safe Listening Score
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  Based on dose, duration & recovery
                </div>
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color:
                    currentStats.safeListeningScore >= 80
                      ? '#22c55e'
                      : currentStats.safeListeningScore >= 60
                      ? '#f97316'
                      : '#ef4444',
                  letterSpacing: -1,
                }}
              >
                {currentStats.safeListeningScore}
              </div>
            </div>
            {/* Score bar */}
            <div
              style={{
                height: 10,
                background: '#1a1a1a',
                borderRadius: 5,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${currentStats.safeListeningScore}%`,
                  height: '100%',
                  background:
                    currentStats.safeListeningScore >= 80
                      ? 'linear-gradient(to right, #22c55e, #4ade80)'
                      : currentStats.safeListeningScore >= 60
                      ? 'linear-gradient(to right, #f97316, #facc15)'
                      : 'linear-gradient(to right, #ef4444, #f97316)',
                  borderRadius: 5,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 5,
                fontSize: 10,
                color: '#555',
              }}
            >
              <span>0 — High Risk</span>
              <span>100 — Optimal</span>
            </div>

            {/* Tip */}
            <div
              style={{
                marginTop: 14,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 12,
                color: '#c4b5fd',
                lineHeight: 1.6,
              }}
            >
              💡 <strong>Tip:</strong> You have {currentStats.highRiskDays} high-risk exposure
              day{currentStats.highRiskDays !== 1 ? 's' : ''} this week. Allow 16–24 hours of
              quiet recovery (Rawool 2012) and keep headphone volume below 60% tomorrow.
            </div>
          </div>
        </div>

        {/* ── Footer note ───────────────────────────────────────────────────── */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#444',
            lineHeight: 1.6,
            padding: '4px 0 8px',
          }}
        >
          References: WHO (2015, 2022) · OSHA · Saunders 1991 · Kujawa &amp; Liberman 2009, 2015, 2019
          <br />
          Henderson 2006 · Berger 2003 · Bhatt 2016 · Shore 2016 · Rawool 2012 · Martinez 2013
          <br />
          Not medical advice. Consult an audiologist for personalized hearing health guidance.
        </div>
      </div>
    </div>
  )
}
