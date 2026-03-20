import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Handcycling | KQuarks' }

export default async function HandcyclingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Handcycling</h1>
            <p className="text-sm text-cyan-400">Upper-body cycling — aerobic zones, efficiency &amp; para-sport science</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-6">

        {/* Hero */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-4">
            <span className="text-2xl" role="img" aria-label="handcycling">&#x1F6B4;</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Handcycling</h2>
          <p className="text-cyan-300 text-sm leading-relaxed max-w-xl mx-auto">
            Upper-body cycling — aerobic zones, efficiency &amp; para-sport science
          </p>
        </div>

        {/* What is Handcycling */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">What is Handcycling?</h2>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Three Main Types</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                  <p className="text-sm font-medium text-white mb-1">Upright Arm-Powered</p>
                  <p className="text-xs text-gray-400">Adaptive and rehabilitation use; rider is seated upright while cranking hand levers</p>
                </div>
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                  <p className="text-sm font-medium text-white mb-1">Recumbent Prone</p>
                  <p className="text-xs text-gray-400">Para-cycling racing configuration; low aerodynamic position with forward-facing crank</p>
                </div>
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                  <p className="text-sm font-medium text-white mb-1">Attachment Front-Wheel</p>
                  <p className="text-xs text-gray-400">Add-on unit that clips to the front of a manual wheelchair for powered locomotion</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Who Uses It</h3>
              <ul className="space-y-2">
                {[
                  'Wheelchair users seeking low-impact cardiovascular exercise without repetitive shoulder strain from daily propulsion',
                  'Para-athletes competing in Paralympic road race, time trial, and criterium events',
                  'Able-bodied cyclists and athletes targeting upper-body aerobic conditioning',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-300 mb-1">Apple Watch Tracking</p>
              <p className="text-xs text-gray-400">
                Records via the <span className="text-cyan-400 font-medium">Handcycling</span> workout type, logging heart rate, active calories, and movement metrics in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Why Handcycling */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Why Handcycling?</h2>
          <div className="space-y-4">
            <div className="bg-gray-800/40 border border-cyan-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-1">Shoulder Safety — Lovell et al. 2012 (Eur J Appl Physiol)</p>
              <p className="text-sm text-gray-300">
                Handcycling produces measurably lower peak shoulder forces than wheelchair propulsion. For users already experiencing shoulder wear from daily propulsion, this makes it the preferred aerobic modality.
              </p>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-200 mb-1">Rhythmic Bilateral Cranking</p>
              <p className="text-sm text-gray-400">
                Symmetrical crank motion distributes load evenly across both shoulders, contrasting with the asymmetric push pattern of wheelchair propulsion that concentrates stress on dominant-side structures.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Full Upper-Body Aerobic Stimulus</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['Shoulders', 'Chest', 'Triceps', 'Core stabilizers'].map((muscle) => (
                  <div key={muscle} className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-center">
                    <span className="text-xs text-cyan-300 font-medium">{muscle}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">
              Suitable across all fitness goals: rehabilitation after injury, recreational fitness, and elite para-sport competition at the Paralympic level.
            </p>
          </div>
        </div>

        {/* Training Zones */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Training Zones</h2>
            <span className="text-xs text-gray-500">Tolfrey et al. 2010</span>
          </div>

          <div className="space-y-3">
            {[
              {
                zone: 'Recovery',
                vo2: '< 55%',
                kcal: '< 4 kcal/min',
                purpose: 'Active recovery, rehabilitation sessions',
                color: 'bg-blue-500',
                barWidth: 'w-[20%]',
                accent: 'text-blue-400',
              },
              {
                zone: 'Aerobic Base',
                vo2: '55 – 75%',
                kcal: '4 – 6 kcal/min',
                purpose: 'Cardiovascular adaptation, endurance foundation',
                color: 'bg-cyan-500',
                barWidth: 'w-[50%]',
                accent: 'text-cyan-400',
              },
              {
                zone: 'Threshold',
                vo2: '75 – 90%',
                kcal: '6 – 9 kcal/min',
                purpose: 'Lactate threshold development, sustained power',
                color: 'bg-teal-400',
                barWidth: 'w-[75%]',
                accent: 'text-teal-300',
              },
              {
                zone: 'Race',
                vo2: '> 90%',
                kcal: '> 9 kcal/min',
                purpose: 'Competition pace, peak power output',
                color: 'bg-emerald-400',
                barWidth: 'w-full',
                accent: 'text-emerald-300',
              },
            ].map((z) => (
              <div key={z.zone} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className={`text-sm font-semibold ${z.accent}`}>{z.zone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{z.purpose}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-white font-medium">{z.vo2} VO&#x2082;peak</p>
                    <p className="text-xs text-gray-400">{z.kcal}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                  <div className={`h-full rounded-full ${z.color} ${z.barWidth}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Science */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Efficiency Science</h2>

          <div className="space-y-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-1">Hettinga et al. 2010 (Med Sci Sports Exerc)</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Recumbent handcycling achieves <span className="text-cyan-300 font-semibold">85 – 95%</span> of the VO&#x2082; demand of upright cycling at the same absolute power output, due to reduced aerodynamic drag and improved torque application.
              </p>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-1">Abel et al. 2010 (J Sci Med Sport) — Optimal Cadence</p>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                Peak mechanical efficiency occurs at <span className="text-cyan-300 font-semibold">70 – 90 rpm</span>. Below 60 rpm, efficiency drops by 15 – 20%.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '< 60 rpm', note: '−15–20% efficiency', bad: true },
                  { label: '70–90 rpm', note: 'Optimal zone', bad: false },
                  { label: '> 90 rpm', note: 'Diminishing returns', bad: null },
                ].map((c) => (
                  <div
                    key={c.label}
                    className={`rounded-lg p-3 text-center border ${
                      c.bad === false
                        ? 'bg-cyan-500/15 border-cyan-500/40'
                        : c.bad === true
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-gray-800/60 border-gray-700'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${c.bad === false ? 'text-cyan-300' : c.bad === true ? 'text-red-400' : 'text-gray-300'}`}>
                      {c.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-cyan-400">300 – 400 W</p>
                <p className="text-xs text-gray-400 mt-1">Elite recumbent handcyclists at lactate threshold</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">Comparable to Road Cycling</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Power-to-trained-body-mass ratios rival elite leg-cycling outputs, highlighting the sport&apos;s physiological demands.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Training Adaptations */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Training Adaptations</h2>

          <div className="space-y-4">
            <div className="bg-gray-800/40 border border-cyan-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2">Fischer et al. 2014 (Spinal Cord) — 12-Week Study in SCI Participants</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-300">+16%</p>
                  <p className="text-xs text-gray-400">VO&#x2082;peak improvement</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-300">+24%</p>
                  <p className="text-xs text-gray-400">Max power improvement</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-200 mb-1">Minimum Effective Dose — Tolfrey et al. 2010</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                40% VO&#x2082;peak is the minimum intensity for lipid and cardiovascular adaptation. Recommended protocol: <span className="text-white">3 – 5 sessions per week, 20 – 40 minutes each</span>.
              </p>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-200 mb-2">VO&#x2082;peak Reference Ranges — Hettinga 2010</p>
              <div className="space-y-2">
                {[
                  { group: 'Untrained handcyclists', range: '20 – 30 ml/kg/min', color: 'bg-gray-500' },
                  { group: 'Recreationally trained', range: '30 – 38 ml/kg/min', color: 'bg-cyan-600' },
                  { group: 'Elite para-athletes', range: '35 – 50+ ml/kg/min', color: 'bg-cyan-400' },
                ].map((row) => (
                  <div key={row.group} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.color}`} />
                    <p className="text-xs text-gray-400 flex-1">{row.group}</p>
                    <p className="text-xs font-medium text-white">{row.range}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">
              Progressive overload — gradually increasing volume, intensity, or cadence over weeks — applies identically to handcycling as it does to leg-cycling or running.
            </p>
          </div>
        </div>

        {/* Para-Sport Context */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Para-Sport Context</h2>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <p className="text-sm font-semibold text-cyan-400 mb-1">Paralympic Events</p>
                <ul className="space-y-1">
                  {['Road race', 'Time trial', 'Criterium'].map((e) => (
                    <li key={e} className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-cyan-500 flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <p className="text-sm font-semibold text-cyan-400 mb-1">Classification System</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  H1 – H5 classes based on residual trunk and upper-limb function, ensuring fair competition across disability profiles.
                </p>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-cyan-500/20 rounded-xl p-4 flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-cyan-400">~ 55 km</p>
                <p className="text-xs text-gray-400">Para-cycling 1-hour world record distance</p>
              </div>
              <div className="flex-1 border-l border-gray-700 pl-4">
                <p className="text-sm font-medium text-gray-300 mb-1">Growing Recreational Scene</p>
                <p className="text-xs text-gray-400">
                  Adapted handcycles are increasingly available for trail riding and touring, making the sport accessible beyond elite competition.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips for Optimal Sessions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tips for Optimal Sessions</h2>

          <div className="space-y-3">
            {[
              {
                title: 'Target 70 – 90 rpm cadence',
                detail: 'Use a metronome app or the Apple Watch cadence alert to stay in the optimal efficiency window throughout your session.',
              },
              {
                title: 'Build your aerobic base with long sessions',
                detail: 'Sustained efforts in the aerobic zone (55 – 75% VO\u2082peak) drive cardiovascular adaptations and fat oxidation.',
              },
              {
                title: 'Reserve 20 – 30% of sessions for threshold work',
                detail: 'Interval blocks at 75 – 90% VO\u2082peak develop lactate threshold and improve sustained power output.',
              },
              {
                title: 'Shoulder warm-up before cranking',
                detail: 'Pendulum swings and external rotation exercises prepare the rotator cuff and reduce injury risk.',
              },
              {
                title: 'Cool-down shoulder mobility stretches',
                detail: 'Pec stretch and doorway chest stretch maintain shoulder range of motion and counter the anterior loading from cranking.',
              },
            ].map((tip, i) => (
              <div key={tip.title} className="flex gap-4 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">{tip.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{tip.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
