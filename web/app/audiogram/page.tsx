import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Audiogram | KQuarks' }

// Frequency labels for the x-axis
const FREQS = ['250', '500', '1k', '2k', '3k', '4k', '6k', '8k']

// Example audiogram data: [leftEar_dBHL, rightEar_dBHL] per frequency
// Intentional noise notch dip at 4–6 kHz
const AUDIOGRAM_DATA: { freq: string; left: number; right: number }[] = [
  { freq: '250',  left: 5,  right: 5  },
  { freq: '500',  left: 8,  right: 7  },
  { freq: '1k',   left: 10, right: 10 },
  { freq: '2k',   left: 12, right: 13 },
  { freq: '3k',   left: 18, right: 20 },
  { freq: '4k',   left: 35, right: 38 },
  { freq: '6k',   left: 42, right: 45 },
  { freq: '8k',   left: 22, right: 25 },
]

// Chart dimensions
const CHART_W = 560
const CHART_H = 280
const PAD_LEFT = 52
const PAD_TOP = 16
const PAD_RIGHT = 20
const PAD_BOTTOM = 36
const PLOT_W = CHART_W - PAD_LEFT - PAD_RIGHT
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM
const DB_MIN = 0
const DB_MAX = 70

function dbToY(db: number): number {
  return PAD_TOP + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * PLOT_H
}

function idxToX(i: number): number {
  return PAD_LEFT + (i / (FREQS.length - 1)) * PLOT_W
}

function buildPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

const leftPoints = AUDIOGRAM_DATA.map((d, i) => ({ x: idxToX(i), y: dbToY(d.left) }))
const rightPoints = AUDIOGRAM_DATA.map((d, i) => ({ x: idxToX(i), y: dbToY(d.right) }))

const Y_TICKS = [0, 10, 20, 30, 40, 50, 60, 70]

const CLASSIFICATION_BANDS = [
  { label: 'Normal',           range: '0–15',  color: 'bg-green-500',  textColor: 'text-green-400',  border: 'border-green-500/30', bg: 'bg-green-500/10' },
  { label: 'Slight Loss',      range: '16–25', color: 'bg-blue-500',   textColor: 'text-blue-400',   border: 'border-blue-500/30',  bg: 'bg-blue-500/10'  },
  { label: 'Mild Loss',        range: '26–40', color: 'bg-yellow-500', textColor: 'text-yellow-400', border: 'border-yellow-500/30',bg: 'bg-yellow-500/10'},
  { label: 'Moderate Loss',    range: '41–55', color: 'bg-orange-500', textColor: 'text-orange-400', border: 'border-orange-500/30',bg: 'bg-orange-500/10'},
  { label: 'Significant Loss', range: '>55',   color: 'bg-red-500',    textColor: 'text-red-400',    border: 'border-red-500/30',   bg: 'bg-red-500/10'   },
]

const KEY_FREQUENCIES = [
  { range: '250–500 Hz', band: 'Low',      detects: 'Vowel sounds, environmental noise' },
  { range: '1–2 kHz',    band: 'Mid',      detects: 'Critical speech range' },
  { range: '3–4 kHz',    band: 'High-mid', detects: 'Consonants, first noise damage zone' },
  { range: '6–8 kHz',    band: 'High',     detects: 'Noise notch detection zone' },
]

const PROTECTION_TIPS = [
  'Keep headphone volume below 75 dB — roughly 60% max on iPhone.',
  'Use noise-cancelling headphones to reduce background noise so you never need to turn up the volume.',
  'Wear ear protection above 85 dB: concerts, power tools, firearms.',
  'Give your ears 16 hours of quiet after any loud exposure.',
  'Test annually with the iPhone Hearing Test (iOS 18+, AirPods Pro 2).',
]

export default async function AudiogramPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Audiogram</h1>
            <p className="text-sm text-text-secondary">Hearing threshold tracker</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero */}
        <div className="rounded-2xl bg-surface border border-border p-6 space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-purple-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18c-4.51 2-5-2-7-2" />
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M12 4a8 8 0 0 1 8 8 7.94 7.94 0 0 1-.59 3" />
                <path d="M4 12a8 8 0 0 1 8-8" />
                <path d="M12 12h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Hearing Threshold Tracking</h2>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                An audiogram maps the softest sounds you can hear at each frequency. Early detection of threshold shifts lets you protect your hearing before irreversible damage occurs.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-purple-500/8 border border-purple-500/20 px-4 py-3">
            <p className="text-sm text-purple-300 leading-relaxed">
              <span className="font-semibold">WHO 2021:</span> 1.5 billion people — nearly 1 in 5 globally — live with some degree of hearing loss. Half of all cases are preventable through early detection and protection.
            </p>
          </div>
        </div>

        {/* Hearing Classification Scale */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Hearing Classification Scale</h2>
          {/* Gradient bar */}
          <div className="h-4 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #22c55e, #3b82f6 22%, #eab308 36%, #f97316 58%, #ef4444)' }} />
          <div className="flex gap-2 flex-wrap">
            {CLASSIFICATION_BANDS.map((b) => (
              <div key={b.label} className={`flex items-center gap-2 rounded-lg ${b.bg} border ${b.border} px-3 py-1.5`}>
                <div className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                <span className={`text-xs font-medium ${b.textColor}`}>{b.label}</span>
                <span className="text-xs text-text-secondary">{b.range} dBHL</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary">
            dBHL = decibels Hearing Level. Lower is better — 0 dBHL is the threshold of normal human hearing at each frequency.
          </p>
        </div>

        {/* Standard Audiogram Chart */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Example Audiogram</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 12 12" className="w-4 h-4" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="#60a5fa" strokeWidth="1.8" />
                </svg>
                <span className="text-xs text-text-secondary">Left ear</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 12 12" className="w-4 h-4" fill="none">
                  <polygon points="6,1 11,11 1,11" stroke="#f87171" strokeWidth="1.8" fill="none" />
                </svg>
                <span className="text-xs text-text-secondary">Right ear</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              width="100%"
              style={{ maxWidth: CHART_W, display: 'block' }}
              aria-label="Audiogram chart showing hearing thresholds by frequency"
            >
              {/* Normal range shaded band: 0–15 dBHL */}
              <rect
                x={PAD_LEFT}
                y={dbToY(0)}
                width={PLOT_W}
                height={dbToY(15) - dbToY(0)}
                fill="#22c55e"
                fillOpacity={0.1}
              />

              {/* Mild threshold dashed line at 25 dBHL */}
              <line
                x1={PAD_LEFT}
                y1={dbToY(25)}
                x2={PAD_LEFT + PLOT_W}
                y2={dbToY(25)}
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="5 4"
                opacity={0.7}
              />
              <text x={PAD_LEFT + PLOT_W + 3} y={dbToY(25) + 4} fill="#f97316" fontSize={9} opacity={0.8}>25</text>

              {/* Y-axis gridlines and labels */}
              {Y_TICKS.map((db) => (
                <g key={db}>
                  <line
                    x1={PAD_LEFT}
                    y1={dbToY(db)}
                    x2={PAD_LEFT + PLOT_W}
                    y2={dbToY(db)}
                    stroke="#374151"
                    strokeWidth={0.5}
                  />
                  <text x={PAD_LEFT - 6} y={dbToY(db) + 4} textAnchor="end" fill="#6b7280" fontSize={9}>{db}</text>
                </g>
              ))}

              {/* X-axis frequency labels */}
              {FREQS.map((f, i) => (
                <text
                  key={f}
                  x={idxToX(i)}
                  y={PAD_TOP + PLOT_H + 20}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={9}
                >
                  {f}
                </text>
              ))}

              {/* Axis labels */}
              <text
                x={PAD_LEFT + PLOT_W / 2}
                y={CHART_H}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={9}
              >
                Frequency (Hz)
              </text>
              <text
                x={10}
                y={PAD_TOP + PLOT_H / 2}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={9}
                transform={`rotate(-90, 10, ${PAD_TOP + PLOT_H / 2})`}
              >
                dBHL
              </text>

              {/* Left ear line (blue) */}
              <path
                d={buildPath(leftPoints)}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Left ear circles */}
              {leftPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#1e3a5f" stroke="#60a5fa" strokeWidth={1.8} />
              ))}

              {/* Right ear line (red) */}
              <path
                d={buildPath(rightPoints)}
                fill="none"
                stroke="#f87171"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Right ear triangles */}
              {rightPoints.map((p, i) => {
                const s = 5
                const pts = `${p.x},${p.y - s} ${p.x + s * 0.87},${p.y + s * 0.5} ${p.x - s * 0.87},${p.y + s * 0.5}`
                return <polygon key={i} points={pts} fill="#3b1212" stroke="#f87171" strokeWidth={1.8} />
              })}

              {/* "Normal range" label */}
              <text x={PAD_LEFT + 6} y={dbToY(7)} fill="#22c55e" fontSize={8} opacity={0.8}>Normal range</text>

              {/* Noise notch callout arrow region label */}
              <text x={idxToX(5) - 18} y={dbToY(42)} fill="#f97316" fontSize={8} opacity={0.9}>Noise notch</text>
              <line
                x1={idxToX(5)}
                y1={dbToY(38)}
                x2={idxToX(5)}
                y2={dbToY(33)}
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="3 2"
                opacity={0.7}
              />
            </svg>
          </div>
          <p className="text-xs text-text-secondary">
            Y-axis is inverted: 0 dBHL (top) is the quietest audible sound — lower numbers are better. The dip at 4–6 kHz is the hallmark noise notch.
          </p>
        </div>

        {/* Noise Notch Explainer */}
        <div className="rounded-2xl bg-surface border border-orange-500/25 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-orange-500" />
            <h2 className="text-base font-semibold text-text-primary">The 4–6 kHz Noise Notch</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            A threshold dip concentrated at 4–6 kHz is the classic fingerprint of noise-induced hearing loss (NIHL). High-frequency outer hair cells in the basal region of the cochlea bear the highest mechanical stress during loud sound exposure, making them the first to suffer acoustic trauma.
          </p>
          <div className="rounded-xl bg-orange-500/8 border border-orange-500/20 p-3 space-y-1.5 text-sm text-text-secondary">
            <p>
              <span className="font-medium text-orange-300">Kähäri et al. 2003</span>{' '}
              <span className="text-text-secondary opacity-75">(Scand J Work Environ Health)</span>
              : musicians show 3–8 dB worse thresholds at 6 kHz compared with controls by age 40, even at normal speech frequencies.
            </p>
          </div>
          <div className="rounded-xl bg-surface-secondary border border-border px-4 py-3 text-sm text-text-secondary">
            <span className="font-medium text-orange-400">Tip:</span> Use hearing protection whenever exposure exceeds 85 dB(A). A single concert at 105 dB can permanently shift thresholds by 10–15 dB.
          </div>
        </div>

        {/* How iPhone Measures Hearing */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">How iPhone Measures Hearing</h2>
          <div className="space-y-3">
            {[
              {
                title: 'iOS 18+ Hearing Test',
                desc: 'Requires AirPods Pro 2 (or other compatible headphones). The test plays tones at each standard audiometric frequency and records the softest level you can detect — a clinical-grade pure-tone audiogram stored directly in HealthKit.',
              },
              {
                title: 'HealthKit Integration',
                desc: 'Results appear in the Health app under Hearing > Audiogram. KQuarks reads this data via HealthKit\'s HKAudiogramSample type, letting you track threshold changes over time.',
              },
              {
                title: 'Clinical Audiogram Import',
                desc: 'Clinical audiograms from an audiologist can be manually added to the Health app. Use the "Import Health Data" option or ask your provider to export in Apple\'s Health format.',
              },
              {
                title: 'Regular Retesting',
                desc: 'Re-test every 6–12 months to catch any threshold shift early. A 10 dB shift at any frequency warrants an audiologist consultation.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{title}</p>
                  <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Frequencies Table */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Key Frequencies</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-text-secondary font-medium text-xs">Frequency</th>
                  <th className="text-left py-2 pr-4 text-text-secondary font-medium text-xs">Range</th>
                  <th className="text-left py-2 text-text-secondary font-medium text-xs">What It Detects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {KEY_FREQUENCIES.map(({ range, band, detects }) => (
                  <tr key={range}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-purple-300 whitespace-nowrap">{range}</td>
                    <td className="py-2.5 pr-4 text-xs text-text-secondary whitespace-nowrap">{band}</td>
                    <td className="py-2.5 text-xs text-text-secondary">{detects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Science & References */}
        <div className="rounded-2xl bg-surface border border-purple-500/25 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-purple-500" />
            <h2 className="text-base font-semibold text-text-primary">Science & References</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-500/8 border border-purple-500/20 p-4 space-y-1">
              <p className="text-sm font-medium text-purple-300">Liberman 2015 — J Neurosci</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Cochlear synaptopathy ("hidden hearing loss"): standard audiometric thresholds can appear clinically normal while 20–50% of auditory nerve synapses are already lost. This manifests as difficulty understanding speech in noise, even with a flat audiogram.
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/8 border border-purple-500/20 p-4 space-y-1">
              <p className="text-sm font-medium text-purple-300">NIOSH 1998 — Recommended Exposure Limit</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                85 dB(A) is the safe ceiling for an 8-hour workday. Each additional 3 dB halves the permitted exposure duration: 88 dB(A) → 4 hours, 91 dB(A) → 2 hours, 94 dB(A) → 1 hour.
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/8 border border-purple-500/20 p-4 space-y-1">
              <p className="text-sm font-medium text-purple-300">WHO World Hearing Report 2021</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                430 million people require rehabilitation for disabling hearing loss. By 2050 this is projected to exceed 700 million. Noise exposure, the leading preventable cause, accounts for 16% of disabling adult hearing loss globally.
              </p>
            </div>
          </div>
          <p className="text-xs text-text-secondary opacity-60">
            This page is for personal health awareness. Consult a licensed audiologist for clinical diagnosis and treatment.
          </p>
        </div>

        {/* Daily Protection Tips */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Daily Protection Tips</h2>
          <div className="space-y-2.5">
            {PROTECTION_TIPS.map((tip, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-none w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
