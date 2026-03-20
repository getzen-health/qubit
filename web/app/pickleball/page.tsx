import Link from 'next/link'
import { ArrowLeft, Zap, Heart, Brain, Shield, Target, Users, Dumbbell, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Pickleball Analytics' }

export default function PickleballPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Pickleball</h1>
            <p className="text-sm text-text-secondary">
              36.5 M US players · vigorous aerobic intensity · best mental health evidence in recreational sport
            </p>
          </div>
          <Zap className="w-5 h-5 text-yellow-500" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── 1. Hero — Why It's Surprisingly Intense ──────────────────── */}
        <section className="rounded-2xl bg-gradient-to-br from-green-500/20 via-green-400/10 to-emerald-500/10 border border-green-500/30 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-text-primary">Why Pickleball Is Surprisingly Intense</h2>
          </div>

          {/* HRmax callout */}
          <div className="flex items-center gap-4 bg-green-500/15 rounded-xl p-4">
            <div className="text-center min-w-[72px]">
              <p className="text-3xl font-extrabold text-green-500">75–85%</p>
              <p className="text-xs text-text-secondary font-medium mt-0.5">avg HRmax</p>
            </div>
            <div className="h-12 w-px bg-green-500/30" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Decker et al. 2023 <span className="font-normal text-text-secondary">(J Aging Phys Act)</span>
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                Recreational players aged 50–75 sustained vigorous-intensity heart rates throughout match play.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-background/60 border border-green-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500 mb-1">ACSM Threshold</p>
              <p className="text-2xl font-bold text-text-primary">≥ 77% HRmax</p>
              <p className="text-xs text-text-secondary mt-1">defines vigorous intensity — pickleball crosses it</p>
            </div>
            <div className="rounded-xl bg-background/60 border border-green-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500 mb-1">MET Value</p>
              <p className="text-2xl font-bold text-text-primary">4–6 METs</p>
              <p className="text-xs text-text-secondary mt-1">Ainsworth 2011 — equivalent to doubles tennis or recreational cycling</p>
            </div>
            <div className="rounded-xl bg-background/60 border border-green-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500 mb-1">CDC Aerobic Guidelines</p>
              <p className="text-2xl font-bold text-text-primary">30 min</p>
              <p className="text-xs text-text-secondary mt-1">one pickleball session satisfies vigorous-intensity guidelines</p>
            </div>
            <div className="rounded-xl bg-background/60 border border-green-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500 mb-1">Why People Are Surprised</p>
              <p className="text-sm font-semibold text-text-primary">Small court + slower ball</p>
              <p className="text-xs text-text-secondary mt-1">creates the illusion of low intensity — the constant stop-start bursts are deceptive</p>
            </div>
          </div>
        </section>

        {/* ── 2. Mental Health Evidence ─────────────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-br from-blue-500/15 via-blue-400/8 to-indigo-500/8 border border-blue-500/25 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-text-primary">Mental Health Evidence</h2>
          </div>

          <p className="text-sm text-text-secondary">
            Doose et al. 2021 <em>(Innov Aging)</em> — 6-week pickleball program, 3&times;/week, older adults:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Depression', value: '−11.7%', color: 'text-blue-400' },
              { label: 'Anxiety', value: '−12.7%', color: 'text-indigo-400' },
              { label: 'Life Satisfaction', value: 'Significant ↑', color: 'text-blue-500' },
              { label: 'Purpose & Meaning', value: 'Significant ↑', color: 'text-indigo-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-background/60 border border-blue-500/20 p-3 text-center">
                <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-background/60 border border-blue-500/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">73% 12-month retention rate</p>
                <p className="text-xs text-text-secondary">
                  Casper et al. 2021 <em>(Int J Sport Psychol)</em> — vs 40–50% for most recreational sports
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Why it works</p>
                <p className="text-xs text-text-secondary">
                  Social connection + exercise endorphins + achievable mastery progression — a rare combination in a single activity
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Vs Tennis: Joint-Friendly Advantage ───────────────────── */}
        <section className="rounded-2xl bg-surface-secondary border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-text-primary">Vs Tennis: The Joint-Friendly Advantage</h2>
          </div>
          <p className="text-xs text-text-secondary">Peng &amp; Ruddell 2018</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                aspect: 'Court Size',
                pickleball: '44 × 20 ft',
                tennis: '78-ft singles court',
                note: '¼ the area — dramatically less ground to cover',
              },
              {
                aspect: 'Lateral Demand',
                pickleball: 'Significantly reduced',
                tennis: 'High lateral load',
                note: 'less knee and ankle stress per session',
              },
              {
                aspect: 'Paddle Weight',
                pickleball: '7–8 oz',
                tennis: '10–12 oz racquet',
                note: 'lower arm and shoulder fatigue',
              },
              {
                aspect: 'Ball Speed',
                pickleball: 'Slower, less spin',
                tennis: 'Fast, heavy topspin',
                note: 'longer reaction window — more forgiving on joints',
              },
            ].map(({ aspect, pickleball, tennis, note }) => (
              <div key={aspect} className="rounded-xl bg-background/60 border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">{aspect}</p>
                <div className="flex gap-3 mb-1">
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 rounded-md px-2 py-0.5">PB: {pickleball}</span>
                  <span className="text-xs font-medium text-text-secondary bg-surface-secondary rounded-md px-2 py-0.5">Tennis: {tennis}</span>
                </div>
                <p className="text-xs text-text-secondary">{note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 space-y-1">
            <p className="text-sm font-semibold text-emerald-500">Result: significantly lower musculoskeletal injury rates</p>
            <p className="text-xs text-text-secondary">
              Pickleball injury rates per 1,000 hours are far lower than tennis and comparable to walking.
            </p>
          </div>
        </section>

        {/* ── 4. The Kitchen Game ──────────────────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-br from-orange-500/15 via-amber-400/8 to-yellow-400/8 border border-orange-500/25 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-text-primary">The Kitchen Game</h2>
          </div>
          <p className="text-xs text-text-secondary">Stork et al. 2019 <em>(J Sci Med Sport)</em></p>

          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
            <p className="text-sm font-semibold text-text-primary">Non-volley zone (NVZ) — 7 ft from net</p>
            <p className="text-xs text-text-secondary mt-1">
              Cannot volley from inside the kitchen. This single rule creates a skill domain not found in any other racquet sport — the player who controls the kitchen controls the point.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                shot: 'Dink',
                icon: '🟢',
                desc: 'Soft cross-court shot landing in the kitchen; keeps the ball low and slow to force errors',
              },
              {
                shot: 'Third Shot Drop',
                icon: '🎯',
                desc: 'Critical transition shot from the baseline to net control — the most important skill in pickleball',
              },
              {
                shot: 'Speed-Up',
                icon: '⚡',
                desc: 'Sudden power shot from a kitchen exchange; tests 300–400 ms reaction time at the elite level',
              },
              {
                shot: 'Erne',
                icon: '🏆',
                desc: 'Aggressive legal volley taken beside (not inside) the kitchen — advanced, crowd-pleasing play',
              },
            ].map(({ shot, icon, desc }) => (
              <div key={shot} className="rounded-xl bg-background/60 border border-orange-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{icon}</span>
                  <p className="text-sm font-bold text-text-primary">{shot}</p>
                </div>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Why It's Accessible + Addictive ───────────────────────── */}
        <section className="rounded-2xl bg-surface-secondary border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-text-primary">Why It's Accessible + Addictive</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Learning Curve',
                value: '1–2 sessions',
                desc: 'Basic competency achievable in a single afternoon vs weeks for tennis',
                accent: 'text-yellow-500',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
              {
                label: 'Scoring',
                value: 'Games to 11',
                desc: 'Faster victories and more variety than tennis\'s games to 6 — every point matters',
                accent: 'text-yellow-500',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
              {
                label: 'Court Advantage',
                value: 'No endurance penalty',
                desc: 'Beginners can reach every ball — removes the fitness barrier that discourages new tennis players',
                accent: 'text-yellow-500',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
              {
                label: 'Social Format',
                value: 'Mostly doubles',
                desc: 'Close-proximity play creates natural conversation and bonding — courts form tight-knit communities',
                accent: 'text-yellow-500',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
              {
                label: 'Annual Growth',
                value: '36% per year',
                desc: "America's fastest-growing sport — 36.5 M players and accelerating",
                accent: 'text-yellow-500',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
            ].map(({ label, value, desc, accent, bg }) => (
              <div key={label} className={`rounded-xl border p-4 flex items-start gap-3 ${bg}`}>
                <div className="min-w-[120px]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
                  <p className={`text-sm font-bold ${accent} mt-0.5`}>{value}</p>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Training to Improve ────────────────────────────────────── */}
        <section className="rounded-2xl bg-surface-secondary border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-text-primary">Training to Improve</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Lateral Agility',
                detail: 'Side shuffles, lateral band walks',
                why: 'Most common movement pattern in pickleball — the foundation of court coverage',
              },
              {
                title: 'Dinking Drills',
                detail: '10 min cross-court dinking before each session',
                why: 'Builds the soft-touch control that wins kitchen battles',
              },
              {
                title: 'Third Shot Drop',
                detail: '100 reps per practice session',
                why: 'The single most game-changing skill — transitions you from defense to attack',
              },
              {
                title: 'Rotator Cuff',
                detail: 'External rotation exercises',
                why: '"Pickleball shoulder" is real — prehab prevents the most common overuse injury',
              },
              {
                title: 'Reaction Training',
                detail: '300–400 ms target reaction time',
                why: 'Speed-ups at the kitchen demand elite-level reflex conditioning',
              },
              {
                title: 'Footwork',
                detail: 'Split-step timing drills',
                why: 'Ready position before every shot reduces late contact and unforced errors',
              },
            ].map(({ title, detail, why }) => (
              <div key={title} className="rounded-xl bg-background/60 border border-green-500/15 p-4">
                <p className="text-sm font-bold text-text-primary">{title}</p>
                <p className="text-xs font-semibold text-green-500 mt-0.5">{detail}</p>
                <p className="text-xs text-text-secondary mt-1">{why}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. Session History Placeholder ───────────────────────────── */}
        <section className="rounded-2xl border border-dashed border-border p-8 flex flex-col items-center text-center gap-3">
          <Activity className="w-10 h-10 text-text-secondary/40" />
          <p className="text-sm font-semibold text-text-secondary">No pickleball sessions yet</p>
          <p className="text-xs text-text-secondary max-w-xs">
            Connect Apple Health to see your pickleball sessions, weekly load, and match frequency tracked automatically.
          </p>
        </section>

      </main>
      <BottomNav />
    </div>
  )
}
