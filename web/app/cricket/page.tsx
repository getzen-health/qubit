import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cricket Analytics' }

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  title,
  subtitle,
  accentClass,
}: {
  title: string
  subtitle?: string
  accentClass?: string
}) {
  return (
    <div className="mb-4">
      <h2 className={`text-lg font-bold ${accentClass ?? 'text-gray-900 dark:text-gray-100'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

function CitationBadge({ text }: { text: string }) {
  return (
    <span className="inline-block text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
      {text}
    </span>
  )
}

function StatPill({
  label,
  value,
  colorClass,
}: {
  label: string
  value: string
  colorClass: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${colorClass}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="text-xs mt-1 opacity-80 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CricketPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Cricket</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              World&apos;s 2nd most popular sport · multi-role physiological demands
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── 1. Hero banner ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-2">
            Multi-discipline sport
          </p>
          <h2 className="text-2xl font-bold mb-3">Three Roles, Three Physiologies</h2>
          <p className="text-sm text-emerald-100 leading-relaxed">
            Cricket is unique among team sports: within a single match, an athlete may sprint, bowl at near-maximal
            intensity, stand in sustained concentration for hours, and then face a 150 km/h delivery with 0.15 s to
            respond. The physiological demands span anaerobic power, aerobic endurance, neurocognitive speed, and
            mental resilience.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatPill label="Estimated global fans" value="2.5B" colorClass="bg-white/15 text-white" />
            <StatPill label="MET peak — fast bowling" value="12" colorClass="bg-white/15 text-white" />
            <StatPill label="km covered — Test day" value="15" colorClass="bg-white/15 text-white" />
          </div>
        </div>

        {/* ── 2. Cricket Formats ─────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Cricket Formats"
            subtitle="Each format creates a distinct physiological profile"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Test */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-gray-100">Test Cricket</span>
                <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">5 days</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                The pinnacle of endurance and mental fortitude. Fielding athletes cover <strong className="text-gray-800 dark:text-gray-200">11–15 km</strong> per day across sustained low-to-moderate intensity effort, with repeated bursts. Concentration must be maintained for 6 hours of play.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">Endurance dominant</span>
                <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">Mental fortitude</span>
                <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">5–6 h play/day</span>
              </div>
            </div>

            {/* ODI */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-gray-100">One Day International</span>
                <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">50 overs</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Approximately 7 hours of match play demands a balanced blend of batting power and bowling intensity. Bowlers may bowl 10-over spells with partial recovery, while fielders manage aerobic load across the full innings.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg">Balanced intensity</span>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg">~7 h match</span>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg">Aerobic base critical</span>
              </div>
            </div>

            {/* T20 */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900 p-5 shadow-sm ring-1 ring-purple-200 dark:ring-purple-900">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-gray-100">T20</span>
                <span className="ml-auto text-xs text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">~3 hours</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                The most intense format. Duffield et al. (2008) measured fielding heart rates at <strong className="text-gray-800 dark:text-gray-200">80–85% HRmax</strong> throughout T20 matches — comparable to team sport intermittent exercise. Athletic fielding standards are now mandatory at the elite level.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">80–85% HRmax fielding</span>
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">Highest intensity</span>
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">Explosive demands</span>
              </div>
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                <CitationBadge text="Duffield et al. 2008" />
              </p>
            </div>

            {/* Club/Training */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-gray-100">Club & Training</span>
                <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">Practice</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Net practice and technical drills form the backbone of skill development. Bowling workload in nets must be monitored carefully — injury risk accumulates across training days just as in match play.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg">Net practice</span>
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg">Technical drills</span>
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg">Load monitoring</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── 3. Fast Bowling ────────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Fast Bowling: The Most Demanding Action in Cricket"
            subtitle="6–9× body weight ground reaction forces at delivery stride"
            accentClass="text-red-700 dark:text-red-400"
          />
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-5 space-y-4">

            {/* Key stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill
                label="Ground reaction force at delivery"
                value="6–9×"
                colorClass="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
              />
              <StatPill
                label="Peak intensity (MET)"
                value="10–12"
                colorClass="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
              />
              <StatPill
                label="Injury risk above 14 overs/day"
                value="3.4×"
                colorClass="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
              />
              <StatPill
                label="Lumbar stress fracture prevalence"
                value="15–20%"
                colorClass="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
              />
            </div>

            {/* Detail bullets */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ground Reaction Forces</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Petersen et al. (2010, IJSPP) documented <strong>6–9 times body weight</strong> GRF at the delivery
                    stride — among the highest repetitive forces recorded in any field sport. These loads are absorbed
                    predominantly by the lumbar spine, hip, and front knee.
                  </p>
                  <p className="mt-1.5">
                    <CitationBadge text="Petersen et al. 2010 — IJSPP" />
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mixed Bowling Action Risk</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Bartlett et al. (1996) demonstrated that a mixed bowling action with counter-rotation exceeding
                    <strong> 40°</strong> between shoulder and hip alignment generates the highest lumbar torsion
                    and is independently associated with the greatest injury risk.
                  </p>
                  <p className="mt-1.5">
                    <CitationBadge text="Bartlett et al. 1996" />
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Workload Threshold</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Petersen (2011) established that bowling more than <strong>14 overs per day</strong> is associated
                    with a <strong>3.4-fold increase</strong> in injury risk. This underpins modern over-limit protocols
                    used in professional cricket worldwide.
                  </p>
                  <p className="mt-1.5">
                    <CitationBadge text="Petersen 2011" />
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Intensity Profile</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Peak metabolic intensity reaches <strong>10–12 MET</strong> at the delivery stride, dropping to a
                    base of <strong>4–6 MET</strong> during fielding recovery between overs. This highly intermittent
                    profile requires both anaerobic power and aerobic recovery capacity.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recovery Prescription</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    A minimum <strong>24–48 hours</strong> between heavy bowling sessions is recommended to allow
                    musculoskeletal recovery and prevent cumulative stress fracture. Elite programs use bowling
                    tally sheets to enforce this across training and match days.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 4. Batting ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Batting: Neuroscience of Decision-Making"
            subtitle="0.15–0.20 s to read, predict, and execute against elite pace bowling"
            accentClass="text-green-700 dark:text-green-400"
          />
          <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-5 space-y-4">

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatPill
                label="Decision window (seconds)"
                value="0.15–0.20"
                colorClass="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
              />
              <StatPill
                label="Fast bowler delivery speed"
                value="130–160 km/h"
                colorClass="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
              />
              <StatPill
                label="Pre-release cues used"
                value="Grip, wrist, run-up"
                colorClass="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
              />
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">The Decision Window</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Noakes &amp; Durandt (2000) established that a batter has only <strong>0.15–0.20 seconds</strong> to
                    identify, process, and initiate a response to a fast delivery. The human saccadic eye movement alone
                    takes ~150 ms, making it physiologically impossible to react to a ball released at
                    {'>'}140 km/h using reactive cues alone.
                  </p>
                  <p className="mt-1.5">
                    <CitationBadge text="Noakes & Durandt 2000" />
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Anticipatory Perception</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Elite batters rely on <strong>pre-release cues</strong> — bowler&apos;s grip on the ball, wrist
                    position at delivery, run-up angle, and shoulder alignment — to predict delivery type and
                    trajectory before the ball is released. This predictive skill distinguishes expert from novice
                    performance far more than raw reaction speed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Anticipatory Arousal & HR</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Batters show elevated heart rate even during passive recovery between deliveries, driven by
                    anticipatory arousal. The cognitive demand of tracking field positions, pitch behavior, and
                    bowler variation constitutes a measurable physiological load — not merely mental effort.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Shot Selection Cognitive Load</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Each delivery requires integration of: field placement and gaps, current pitch behavior (seam
                    movement, spin turn), bowler&apos;s variation history, match situation, and personal
                    risk-reward calculation. This multivariate real-time optimization under time pressure is
                    cognitively taxing across long innings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Fielding Demands ────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Fielding Demands"
            subtitle="Often underestimated — fielding constitutes the bulk of match time for most players"
          />
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatPill
                label="Distance/day — Test"
                value="11–15 km"
                colorClass="bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200"
              />
              <StatPill
                label="Sprints per session (10–15 m)"
                value="50–80"
                colorClass="bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200"
              />
              <StatPill
                label="Outfielder cardio load"
                value="Highest"
                colorClass="bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200"
              />
              <StatPill
                label="Base fielding intensity"
                value="4–5 MET"
                colorClass="bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200"
              />
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Distance Coverage in Test Cricket</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Stretch et al. (1999) documented <strong>11–15 km covered per day&apos;s play</strong> in Test
                    cricket for outfield players. Over a 5-day Test, a fielder may cover more than 60 km — a
                    significant aerobic and musculoskeletal challenge often not reflected in caloric expenditure
                    calculations.
                  </p>
                  <p className="mt-1.5">
                    <CitationBadge text="Stretch et al. 1999" />
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Repeated Sprint Demands</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Players execute <strong>50–80 short sprints of 10–15 m</strong> per session, interspersed with
                    walking recovery. The random timing and direction of these sprints creates a unique
                    repeated-sprint fatigue pattern distinct from structured interval training.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">T20&apos;s Impact on Fielding Standards</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    The T20 format significantly raised the physical bar for fielding. Diving stops, boundary
                    sprints, and direct-hit throws are now baseline expectations. Fielding fitness has become a
                    core selection criterion at professional level, leading to dedicated fielding fitness
                    conditioning programs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Energy Systems ──────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Energy Systems by Role"
            subtitle="Cricket's multi-role structure means no single energy system dominates"
          />
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dominant System</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Intensity</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</span>
            </div>
            {/* Rows */}
            {[
              {
                role: 'Fast Bowling',
                system: 'Anaerobic / ATP-PCr',
                intensity: '10–12 MET peak',
                duration: '6 deliveries/over',
                accent: 'text-red-600 dark:text-red-400',
                dot: 'bg-red-500',
              },
              {
                role: 'Spin Bowling',
                system: 'Aerobic + technique',
                intensity: '5–7 MET',
                duration: 'Sustained',
                accent: 'text-amber-600 dark:text-amber-400',
                dot: 'bg-amber-500',
              },
              {
                role: 'Batting',
                system: 'Mixed + cognitive',
                intensity: 'Variable',
                duration: 'Minutes to hours',
                accent: 'text-green-600 dark:text-green-400',
                dot: 'bg-green-500',
              },
              {
                role: 'Fielding',
                system: 'Aerobic + sprints',
                intensity: '4–5 MET base',
                duration: 'Full session',
                accent: 'text-sky-600 dark:text-sky-400',
                dot: 'bg-sky-500',
              },
            ].map((row, i) => (
              <div
                key={row.role}
                className={`grid grid-cols-4 px-4 py-3.5 items-start gap-1 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''} border-b border-gray-100 dark:border-gray-800 last:border-0`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${row.dot}`} />
                  <span className={`text-sm font-semibold ${row.accent}`}>{row.role}</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{row.system}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{row.intensity}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{row.duration}</span>
              </div>
            ))}
          </div>

          {/* Visual energy bar */}
          <div className="mt-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Relative Energy System Contribution by Role</p>
            {[
              { label: 'Fast Bowling', anaerobic: 70, aerobic: 30, color: 'bg-red-500', secondColor: 'bg-red-200 dark:bg-red-900/40' },
              { label: 'Spin Bowling', anaerobic: 25, aerobic: 75, color: 'bg-amber-500', secondColor: 'bg-amber-200 dark:bg-amber-900/40' },
              { label: 'Batting', anaerobic: 45, aerobic: 55, color: 'bg-green-500', secondColor: 'bg-green-200 dark:bg-green-900/40' },
              { label: 'Fielding', anaerobic: 20, aerobic: 80, color: 'bg-sky-500', secondColor: 'bg-sky-200 dark:bg-sky-900/40' },
            ].map((item) => (
              <div key={item.label} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.anaerobic}% anaerobic / {item.aerobic}% aerobic</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full rounded-l-full`} style={{ width: `${item.anaerobic}%` }} />
                  <div className={`${item.secondColor} h-full flex-1 rounded-r-full`} />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Approximate values based on metabolic intensity profiles. Cognitive load not represented.
            </p>
          </div>
        </section>

        {/* ── 7. Workload Management ─────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Workload Management"
            subtitle="Cricket's biggest sports science challenge — particularly for fast bowlers"
          />
          <div className="space-y-4">

            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Bowling Over Limits
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Modern professional cricket enforces strict bowling limits: typically <strong>10–12 overs per spell</strong> and
                <strong> 20–30 overs per match maximum</strong> for fast bowlers. These guidelines are informed by
                the workload research of Petersen et al. and are updated based on continuous injury surveillance data.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Heart Rate Monitoring</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Used primarily for fielding fitness assessment and tracking cardiovascular load during T20 matches and training camps.
                </p>
              </div>
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Session RPE</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Session rating of perceived exertion (sRPE) × duration provides a simple, validated proxy for bowling load — used alongside over counts.
                </p>
              </div>
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Pre-season Aerobic Base</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  A strong aerobic base is critical for sustained fielding across 5-day Tests and for enabling fast bowlers to recover between spells.
                </p>
              </div>
            </div>

            {/* Warning card */}
            <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-4 flex gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  Cumulative Load Across Training and Match Days
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1 leading-relaxed">
                  Bowling load in net practice contributes to cumulative stress. Training overs must be counted
                  alongside match overs to accurately assess weekly bowling load. Many stress fractures occur
                  during pre-season when match limits are absent.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── 8. Session History Placeholder ─────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Your Cricket Sessions"
            subtitle="Match and practice history from Apple Health"
          />
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              {/* Cricket ball icon (SVG) */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-7 h-7 text-emerald-500"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  d="M12 3C9 6 9 10 9 12s0 6 3 9"
                  strokeLinecap="round"
                />
                <path
                  d="M12 3c3 3 3 7 3 9s0 6-3 9"
                  strokeLinecap="round"
                />
                <path d="M3 12h18" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Connect Apple Health to see your cricket sessions
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              Weekly load distribution, match vs practice ratio, and session heart rate trends will appear here
              once Apple Health data is synced.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full">Weekly load distribution</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full">Match vs practice ratio</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full">Session heart rate</span>
            </div>
          </div>
        </section>

        {/* References */}
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Key References</p>
          <ul className="space-y-1">
            {[
              'Petersen et al. (2010). IJSPP — Ground reaction forces in fast bowling.',
              'Bartlett et al. (1996). Mixed bowling actions and lumbar injury risk.',
              'Petersen (2011). Bowling workload thresholds and injury rate.',
              'Noakes & Durandt (2000). Decision-making time windows in batting.',
              'Duffield et al. (2008). Heart rate responses in T20 cricket fielding.',
              'Stretch et al. (1999). Distance covered by fielders in Test cricket.',
            ].map((ref) => (
              <li key={ref} className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                • {ref}
              </li>
            ))}
          </ul>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
