import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Fitness Gaming | GetZen' }

const MET_TABLE = [
  {
    game: 'Ring Fit Adventure',
    mets: '~5.9',
    equivalent: 'Jogging (~5.5 METs)',
    intensity: 'moderate',
  },
  {
    game: 'Beat Saber (Hard)',
    mets: '~7.5',
    equivalent: 'Cycling moderate (7 METs)',
    intensity: 'vigorous',
  },
  {
    game: 'VR Boxing',
    mets: '8–10',
    equivalent: 'Running 9 km/h (9.8 METs)',
    intensity: 'extreme',
  },
  {
    game: 'Just Dance',
    mets: '~4.5',
    equivalent: 'Aerobics class (4.8 METs)',
    intensity: 'moderate',
  },
  {
    game: 'Wii Tennis',
    mets: '~3.8',
    equivalent: 'Brisk walking (3.5 METs)',
    intensity: 'light',
  },
]

const ZONES = [
  {
    label: 'Light',
    range: '<4 kcal/min',
    mets: '2–4 METs',
    examples: 'Casual games, Wii Sports bowling',
    color: 'blue',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  {
    label: 'Moderate',
    range: '4–7 kcal/min',
    mets: '4–7 METs',
    examples: 'Ring Fit, Just Dance',
    color: 'green',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    dot: 'bg-green-400',
  },
  {
    label: 'Vigorous',
    range: '7–10 kcal/min',
    mets: '7–10 METs',
    examples: 'Beat Saber Hard, Supernatural',
    color: 'orange',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
  },
  {
    label: 'Extreme',
    range: '>10 kcal/min',
    mets: '>10 METs',
    examples: 'Beat Saber Expert+, VR boxing',
    color: 'red',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
]

function metRowClass(intensity: string) {
  if (intensity === 'extreme') return 'bg-violet-500/10 border-l-2 border-l-violet-500'
  if (intensity === 'vigorous') return 'bg-orange-500/5 border-l-2 border-l-orange-500'
  if (intensity === 'moderate') return 'bg-green-500/5 border-l-2 border-l-green-500'
  return 'bg-gray-800/40 border-l-2 border-l-gray-600'
}

function metLabelClass(intensity: string) {
  if (intensity === 'extreme') return 'text-violet-400 font-bold'
  if (intensity === 'vigorous') return 'text-orange-400 font-semibold'
  if (intensity === 'moderate') return 'text-green-400'
  return 'text-gray-400'
}

export default async function FitnessGamingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Fitness Gaming</h1>
            <p className="text-sm text-gray-400">Exergaming analytics</p>
          </div>
          <span className="text-2xl" aria-hidden="true">🎮</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-950/60 via-gray-900 to-gray-900 border border-violet-500/30 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">🎮</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Fitness Gaming</h2>
              <p className="text-violet-400 font-medium text-sm mt-0.5">Real cardio. Virtual world.</p>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Ring Fit, Beat Saber, VR workouts — real cardio in a virtual world. Apple Watch tracks your heart
            rate, calories, and movement automatically during every session, giving you the same data you'd get
            from any gym workout — but with a much higher fun factor.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Ring Fit Adventure', 'Beat Saber', 'Supernatural', 'FitXR', 'VR Boxing'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 text-xs font-medium border border-violet-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* What Counts as Fitness Gaming */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-violet-400">01</span>
            What Counts as Fitness Gaming
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Apple Watch records any workout tagged as <span className="text-violet-400 font-medium">Fitness Gaming</span> — a
            dedicated workout type in HealthKit. During these sessions, the watch tracks heart rate, active calories,
            and movement continuously, just like any other workout.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Included game types</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { emoji: '💪', name: 'Ring Fit Adventure', note: 'Full-body resistance + cardio' },
                { emoji: '🗡️', name: 'Beat Saber', note: 'Rhythm + upper body + cardio' },
                { emoji: '🥊', name: 'Supernatural', note: 'VR boxing & archery' },
                { emoji: '🕹️', name: 'FitXR', note: 'VR boxing & dance workouts' },
                { emoji: '🎮', name: 'VR Fitness Apps', note: 'Thrill of the Fight, Pistol Whip' },
                { emoji: '🕹️', name: 'Active Switch Games', note: '1-2-Switch, Nintendo Sports' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
                >
                  <span className="text-xl shrink-0" aria-hidden="true">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-3">
            Apple Watch HR monitoring, calorie estimation, and movement sensing work identically to traditional
            workouts — the only difference is the environment.
          </p>
        </div>

        {/* MET Comparison Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400">02</span>
              MET Comparison
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              How exergaming compares to traditional exercise by metabolic equivalent of task (MET)
            </p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
            <span>Game / Activity</span>
            <span className="text-center">METs</span>
            <span>Equivalent Exercise</span>
          </div>

          <div className="space-y-1.5">
            {MET_TABLE.map((row) => (
              <div
                key={row.game}
                className={`grid grid-cols-3 gap-2 items-center px-3 py-2.5 rounded-xl text-sm ${metRowClass(row.intensity)}`}
              >
                <span className={metLabelClass(row.intensity)}>{row.game}</span>
                <span className="text-center font-bold text-white">{row.mets}</span>
                <span className="text-gray-400 text-xs">{row.equivalent}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 pt-1">
            Sources: Peng et al. 2011 (Cyberpsychol Behav Soc Netw); Viggiano et al. 2015. Purple highlight = high-intensity.
          </p>
        </div>

        {/* Intensity Zones */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400">03</span>
              Intensity Zones
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              How GetZen classifies your gaming sessions by calorie burn rate
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ZONES.map((zone) => (
              <div
                key={zone.label}
                className={`rounded-xl p-4 border ${zone.bg} ${zone.border} space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${zone.dot} shrink-0`} />
                  <span className={`font-bold text-sm ${zone.text}`}>{zone.label}</span>
                </div>
                <p className="text-white font-semibold text-base leading-tight">{zone.range}</p>
                <p className="text-xs text-gray-400">{zone.mets}</p>
                <p className="text-xs text-gray-500 leading-snug">{zone.examples}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The Science of Exergaming */}
        <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400">04</span>
              The Science of Exergaming
            </h2>
            <p className="text-sm text-violet-400/80 mt-1">Peer-reviewed evidence for gaming as exercise</p>
          </div>
          <div className="space-y-4">
            {[
              {
                citation: 'Peng et al. 2011 — Cyberpsychol Behav Soc Netw',
                finding:
                  'Active video games increase energy expenditure 2–3× resting metabolic rate, comparable to moderate-intensity walking. Exergaming is physiologically legitimate exercise.',
              },
              {
                citation: 'Staiano & Calvert 2011 — Psychol Bull',
                finding:
                  'Exergaming improves cardiorespiratory fitness comparably to traditional exercise, with 30–50% lower dropout rates due to the inherently engaging nature of gameplay.',
              },
              {
                citation: 'Muro-De-La-Herran et al. 2014 — Sensors',
                finding:
                  'VR exergaming reaches 60–80% HRmax in fit adults — sufficient for cardiovascular adaptation. ACSM guidelines require ≥50% HRmax for aerobic benefit.',
              },
              {
                citation: 'LeBlanc et al. 2013 — Pediatrics',
                finding:
                  'Meta-analysis of 38 studies found a net positive effect of exergaming on physical activity (effect size d = 0.32), consistent across age groups and game types.',
              },
            ].map((study) => (
              <div key={study.citation} className="flex gap-3">
                <div className="w-1 rounded-full bg-violet-500/50 shrink-0 mt-1" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-violet-400">{study.citation}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{study.finding}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adherence Advantage */}
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-green-400">05</span>
              The Adherence Advantage
            </h2>
            <p className="text-sm text-green-400/80 mt-1">The most important finding from the research</p>
          </div>

          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
            <p className="text-green-300 font-semibold text-base">
              People stick with exergaming longer than traditional exercise.
            </p>
            <p className="text-sm text-gray-400 mt-1.5">
              Staiano & Calvert 2011: 30–50% lower dropout rates vs structured exercise programs.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Why it works</p>
            {[
              { icon: '🔄', title: 'Immediate feedback loops', desc: 'Score, streaks, and in-game rewards reinforce behavior instantly' },
              { icon: '📈', title: 'Progression systems', desc: 'Unlockable content and difficulty scaling maintain engagement over time' },
              { icon: '👥', title: 'Social features', desc: 'Multiplayer and leaderboards add accountability and competition' },
              { icon: '🎯', title: 'Intrinsic motivation', desc: 'The goal is winning, not exercising — effort feels purposeful' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-200">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-2">
            <p className="text-sm font-semibold text-white">Meeting WHO guidelines with gaming</p>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 rounded-lg bg-gray-900 border border-gray-700">
                <p className="text-2xl font-bold text-green-400">150</p>
                <p className="text-xs text-gray-400 mt-1">min/week moderate exergaming</p>
              </div>
              <div className="flex items-center text-gray-500 font-bold">OR</div>
              <div className="flex-1 text-center p-3 rounded-lg bg-gray-900 border border-gray-700">
                <p className="text-2xl font-bold text-orange-400">75</p>
                <p className="text-xs text-gray-400 mt-1">min/week vigorous exergaming</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">= Full WHO physical activity target met</p>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-3">
            For people who struggle with exercise adherence, exergaming is clinically valid physical activity —
            not a consolation prize. The best workout is the one you'll actually do.
          </p>
        </div>

        {/* Heart Rate During Gaming */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400">06</span>
              Heart Rate During Gaming
            </h2>
            <p className="text-sm text-gray-400 mt-1">What your Apple Watch actually sees</p>
          </div>

          {/* HR zones visual */}
          <div className="space-y-2">
            {[
              { label: 'Beat Saber Expert+', pct: 90, color: 'bg-red-500', note: 'HIIT territory' },
              { label: 'VR Boxing / Supernatural', pct: 75, color: 'bg-orange-500', note: 'Vigorous aerobic' },
              { label: 'Ring Fit Adventure', pct: 65, color: 'bg-violet-500', note: 'Aerobic training zone' },
              { label: 'Just Dance / Rhythm games', pct: 55, color: 'bg-green-500', note: 'Moderate aerobic' },
              { label: 'Wii Sports / Casual VR', pct: 40, color: 'bg-blue-500', note: 'Light activity' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{item.label}</span>
                  <span className="text-gray-500">{item.pct}% HRmax · {item.note}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 text-center">
              <p className="text-violet-400 font-bold text-lg">60–80%</p>
              <p className="text-xs text-gray-400 mt-1">HRmax in VR fitness games</p>
              <p className="text-xs text-gray-600">Muro-De-La-Herran 2014</p>
            </div>
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
              <p className="text-green-400 font-bold text-lg">50–85%</p>
              <p className="text-xs text-gray-400 mt-1">ACSM aerobic training zone</p>
              <p className="text-xs text-gray-600">Recommended target</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            Apple Watch HR monitoring during gaming gives you real-time feedback you'd get in a gym — without
            paying a gym membership. Beat Saber Expert+ can spike to 90%+ HRmax, approaching HIIT intensity.
          </p>
        </div>

        {/* Tips for Maximizing Fitness Gaming */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400">07</span>
              Maximizing Your Fitness Gaming
            </h2>
            <p className="text-sm text-gray-400 mt-1">Science-backed tips to get more from every session</p>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: '🤸',
                title: 'Use full range of motion',
                desc: 'Larger room-scale movements over minimal wrist flicks — the physical effort is the point.',
              },
              {
                icon: '📈',
                title: 'Apply progressive overload',
                desc: 'Increase difficulty levels as fitness improves. Same principle as adding weight in the gym.',
              },
              {
                icon: '🎲',
                title: 'Mix game types',
                desc: 'Rhythm games (cardio), boxing games (upper body + cardio), platformers (coordination + balance).',
              },
              {
                icon: '📅',
                title: 'Schedule 3–5 sessions/week',
                desc: 'Consistent training stimulus requires regular frequency — same as any exercise program.',
              },
              {
                icon: '❤️',
                title: 'Track your HR zones',
                desc: 'Check Apple Health after each session to confirm you reached your target intensity zone.',
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/40"
              >
                <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{tip.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{tip.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-xs text-gray-500 space-y-1.5">
          <p className="font-medium text-gray-400">Research references</p>
          <p>Peng W et al. (2011). Using active video games for physical activity promotion. Cyberpsychol Behav Soc Netw.</p>
          <p>Staiano AE, Calvert SL. (2011). Exergames for physical education courses. Psychol Bull.</p>
          <p>Muro-De-La-Herran A et al. (2014). Electroencephalography in Exergames. Sensors.</p>
          <p>LeBlanc AG et al. (2013). Active video games and health indicators in children and youth. Pediatrics.</p>
          <p>Viggiano A et al. (2015). Kaledo, a game for nutrition education. Eur J Clin Nutr.</p>
          <p className="pt-1 opacity-60">
            This data is for personal awareness only and is not a medical diagnosis. Consult a healthcare provider
            with any health concerns.
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
