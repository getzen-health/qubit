import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Explore' }

interface FeatureCard {
  label: string
  desc: string
  href: string
  emoji: string
}

interface Section {
  title: string
  features: FeatureCard[]
}

const SECTIONS: Section[] = [
  {
    title: 'Heart & Vitals',
    features: [
      { label: 'Heart Rate', desc: 'Resting HR trends and daily averages', href: '/heartrate', emoji: '❤️' },
      { label: 'Daily HR Pattern', desc: '24-hour circadian heart rate rhythm', href: '/heartrate/patterns', emoji: '🕐' },
      { label: 'HRV Analysis', desc: 'Variability trends, baselines, and recovery', href: '/hrv', emoji: '💗' },
      { label: 'HRV Calendar', desc: '365-day recovery heatmap vs baseline', href: '/hrv/calendar', emoji: '📆' },
      { label: 'HRV Recovery Zones', desc: 'Green / yellow / orange zone history based on personal baseline', href: '/hrv/zones', emoji: '🟢' },
      { label: 'Training Zones', desc: 'Time in each HR zone across workouts', href: '/zones', emoji: '🎯' },
      { label: 'Oxygen (SpO2)', desc: 'Blood oxygen saturation day and night', href: '/oxygen', emoji: '🫁' },
      { label: 'Respiratory Rate', desc: 'Breathing rate trends and patterns', href: '/respiratory', emoji: '🌬️' },
      { label: 'Blood Pressure', desc: 'Systolic and diastolic readings over time', href: '/bloodpressure', emoji: '🩺' },
      { label: 'BP Patterns', desc: 'DOW trends, time-of-day, monthly progression & hypertension stage breakdown', href: '/bloodpressure/patterns', emoji: '📊' },
      { label: 'Resting HR Analysis', desc: '6-month RHR trend, fitness classification & HRV correlation', href: '/heartrate/resting', emoji: '🫀' },
      { label: 'Cardio Health', desc: 'HRV + RHR + VO₂ Max + HR Recovery combined overview', href: '/heartrate/cardio', emoji: '🫀' },
      { label: 'HR Recovery', desc: 'Post-workout HR drop rate & fitness classification', href: '/heartrate/recovery', emoji: '📉' },
      { label: 'Cardiac Events', desc: 'AFib, high, and low heart rate alerts', href: '/cardiac', emoji: '⚡' },
    ],
  },
  {
    title: 'Activity',
    features: [
      { label: 'Steps & Activity', desc: 'Daily step counts, distance, and goals', href: '/steps', emoji: '🚶' },
      { label: 'Step Patterns', desc: 'When you walk most: day-of-week, seasonal & distribution', href: '/steps/patterns', emoji: '📊' },
      { label: 'Calories Burned', desc: 'Active calorie history and trends', href: '/calories', emoji: '🔥' },
      { label: 'Calorie Patterns', desc: 'When you burn most: day-of-week, seasonal & distribution', href: '/calories/patterns', emoji: '📊' },
      { label: 'Floors Climbed', desc: 'Elevation and stair-climbing stats', href: '/floors', emoji: '🏗️' },
      { label: 'Activity Calendar', desc: 'GitHub-style workout heatmap grid', href: '/calendar', emoji: '📅' },
      { label: 'Year View', desc: 'Full year of daily step data at a glance', href: '/year', emoji: '📊' },
      { label: 'Activity Rings', desc: 'Apple Watch ring closure history', href: '/rings', emoji: '⭕' },
      { label: 'Training Load', desc: 'ATL, CTL, and TSB form analysis', href: '/training-load', emoji: '📈' },
      { label: 'Streaks', desc: 'Consecutive days of goal completion', href: '/streaks', emoji: '🔥' },
    ],
  },
  {
    title: 'Workouts',
    features: [
      { label: 'All Workouts', desc: 'Complete workout log and stats', href: '/workouts', emoji: '🏋️' },
      { label: 'Running', desc: 'Pace trends, distance, and VDOT', href: '/running', emoji: '🏃' },
      { label: 'Running Efficiency', desc: 'Aerobic efficiency index and HR vs pace trends', href: '/running/efficiency', emoji: '⚡' },
      { label: 'Running Form', desc: 'Cadence, stride & biomechanics analysis', href: '/running/form', emoji: '🦶' },
      { label: 'Pace Zones', desc: '80/20 easy vs hard training distribution', href: '/running/zones', emoji: '⏱️' },
      { label: 'Training Calendar', desc: 'Monthly workout calendar with type coloring', href: '/workouts/calendar', emoji: '🗓️' },
      { label: 'Yearly Progress', desc: '12-month training volume & year-over-year comparison', href: '/workouts/yearly', emoji: '📈' },
      { label: 'Workout Impact', desc: 'How training timing affects HRV recovery', href: '/workouts/impact', emoji: '🔋' },
      { label: 'Cycling', desc: 'Speed, distance, and ride history', href: '/cycling', emoji: '🚴' },
      { label: 'Strength Training', desc: 'Session frequency and recovery HRV', href: '/strength', emoji: '💪' },
      { label: 'HIIT', desc: 'Intensity, frequency, and recovery impact', href: '/hiit', emoji: '⚡' },
      { label: 'Rowing', desc: '500m splits, watts, and distance', href: '/rowing', emoji: '🚣' },
      { label: 'Swimming', desc: 'Distance, HR, and session trends', href: '/swimming', emoji: '🏊' },
      { label: 'Hiking', desc: 'Distance, elevation, and pace', href: '/hiking', emoji: '🥾' },
      { label: 'Running Progression', desc: '12-month pace trend, monthly volume & quarterly comparison', href: '/running/progression', emoji: '📈' },
      { label: 'Workout Patterns', desc: 'Day-of-week, time-of-day & weekly volume analysis', href: '/workouts/patterns', emoji: '📆' },
      { label: 'Workout Efficiency', desc: 'kcal/min by type — compare intensity across all sports', href: '/workouts/efficiency', emoji: '⚡' },
      { label: 'Race Predictor', desc: 'Predict race times with Riegel formula', href: '/race-predictor', emoji: '🏁' },
      { label: 'Workout Variety', desc: 'Balance across workout types', href: '/variety', emoji: '🎨' },
      { label: 'Personal Records', desc: 'All-time bests across every metric', href: '/records', emoji: '🏆' },
      { label: 'Achievements', desc: 'Milestones and badges earned', href: '/achievements', emoji: '🎖️' },
    ],
  },
  {
    title: 'Sleep',
    features: [
      { label: 'Sleep Analysis', desc: 'Stages, quality, and 30-night trends', href: '/sleep', emoji: '😴' },
      { label: 'Sleep Patterns', desc: 'When you sleep best: day-of-week, seasonal & duration histogram', href: '/sleep/patterns', emoji: '🌙' },
      { label: 'Sleep Stages', desc: 'Deep, REM, core & awake breakdown', href: '/sleep/stages', emoji: '🌊' },
      { label: 'Sleep Efficiency', desc: 'Time asleep vs time in bed (CBT-I)', href: '/sleep/efficiency', emoji: '💯' },
      { label: 'Sleep Schedule', desc: 'Bedtime consistency and chronotype', href: '/sleep/schedule', emoji: '🕐' },
      { label: 'Sleep Debt', desc: 'Cumulative debt, repayment tracking', href: '/sleep/debt', emoji: '💤' },
      { label: 'Sleep Breathing', desc: 'Overnight respiratory rate & SpO₂ patterns', href: '/sleep/breathing', emoji: '🌬️' },
      { label: 'Chronotype', desc: 'Early bird vs night owl + social jet lag', href: '/sleep/chronotype', emoji: '🦉' },
      { label: 'Sleep Impact', desc: 'How sleep duration shapes next-day HRV & activity', href: '/sleep/impact', emoji: '⚡' },
      { label: 'Sleep Quality Score', desc: 'Nightly 0–100 score: duration + stages + efficiency', href: '/sleep/score', emoji: '⭐' },
      { label: 'Wrist Temperature', desc: 'Nightly skin temperature deviations', href: '/temperature', emoji: '🌡️' },
      { label: 'Temperature Insights', desc: 'HRV correlation & illness signal detection', href: '/temperature/insights', emoji: '🔬' },
    ],
  },
  {
    title: 'Body & Composition',
    features: [
      { label: 'Body Weight', desc: 'Weight trends and body fat percentage', href: '/body', emoji: '⚖️' },
      { label: 'Body Weight Trends', desc: 'Rate of change, DOW patterns, monthly progression & body fat tracking', href: '/body/trends', emoji: '📉' },
      { label: 'VO₂ Max', desc: 'Cardiorespiratory fitness trend', href: '/vo2max', emoji: '🫀' },
      { label: 'Glucose', desc: 'Blood glucose readings over time', href: '/glucose', emoji: '🩸' },
      { label: 'Glucose Patterns', desc: 'Time-in-range, DOW trends, time-of-day & monthly glucose progression', href: '/glucose/patterns', emoji: '📊' },
      { label: 'Walking Steadiness', desc: 'Gait stability score, fall risk & 90-day trend', href: '/walking-steadiness', emoji: '🚶' },
      { label: 'Mobility', desc: 'Flexibility and mobility tracking', href: '/mobility', emoji: '🤸' },
    ],
  },
  {
    title: 'Nutrition & Lifestyle',
    features: [
      { label: 'Nutrition', desc: 'Meal logging and daily calorie intake', href: '/nutrition', emoji: '🥗' },
      { label: 'Nutrition Patterns', desc: 'When you eat most: macro split, DOW trends & calorie distribution', href: '/nutrition/patterns', emoji: '📊' },
      { label: 'Macros', desc: 'Protein, carbs, and fat breakdown', href: '/macros', emoji: '📊' },
      { label: 'Hydration', desc: 'Daily water intake and targets', href: '/water', emoji: '💧' },
      { label: 'Hydration Patterns', desc: 'When you drink most: day-of-week, monthly & goal streaks', href: '/water/patterns', emoji: '📊' },
      { label: 'Fasting', desc: 'Intermittent fasting sessions and streaks', href: '/fasting', emoji: '⏳' },
      { label: 'Fasting Insights', desc: 'Protocol breakdown, streaks, duration trends & timing analysis', href: '/fasting/insights', emoji: '📊' },
      { label: 'Mindfulness', desc: 'Meditation and mindfulness minutes', href: '/mindfulness', emoji: '🧘' },
      { label: 'Mindfulness Patterns', desc: 'When you meditate most: DOW trends, session duration & monthly volume', href: '/mindfulness/patterns', emoji: '📊' },
      { label: 'Mindfulness Impact', desc: 'How meditation sessions affect next-day HRV and recovery', href: '/mindfulness/impact', emoji: '✨' },
      { label: 'Daylight', desc: 'Time in natural light per day', href: '/daylight', emoji: '☀️' },
      { label: 'Hearing Health', desc: 'Noise exposure and headphone audio', href: '/hearing', emoji: '👂' },
    ],
  },
  {
    title: 'Analytics & Insights',
    features: [
      { label: 'Health Timeline', desc: 'Chronological feed of workouts, sleep & key events', href: '/timeline', emoji: '📜' },
      { label: "Today's Readiness", desc: 'HRV + sleep + load → training recommendation', href: '/ready', emoji: '🎯' },
      { label: 'Training Advisor', desc: 'HRV-guided weekly training plan', href: '/training-advisor', emoji: '🧠' },
      { label: 'Vitality Score', desc: 'Multi-metric longevity index', href: '/longevity', emoji: '⭐' },
      { label: 'Weekly Report', desc: 'This week vs last week comparison', href: '/week', emoji: '📅' },
      { label: 'Health Score', desc: 'Composite daily health score', href: '/score', emoji: '🌟' },
      { label: 'Recovery & Strain', desc: 'Training stress and recovery balance', href: '/recovery', emoji: '⚡' },
      { label: 'Trends', desc: 'Long-term patterns across metrics', href: '/trends', emoji: '📉' },
      { label: 'Correlations', desc: 'How your metrics influence each other', href: '/correlations', emoji: '🔗' },
      { label: 'Compare Weeks', desc: 'This week vs last week comparison', href: '/compare', emoji: '↔️' },
      { label: 'Monthly Review', desc: 'Month-by-month summary view', href: '/monthly', emoji: '📆' },
      { label: 'Year in Review', desc: 'Annual health highlights and records', href: '/year', emoji: '🎊' },
      { label: 'Habits', desc: 'Daily habit tracking with streaks', href: '/habits', emoji: '🎯' },
      { label: 'Daily Check-in', desc: 'Log energy, mood, and stress each day', href: '/checkin', emoji: '📋' },
      { label: 'Check-in Patterns', desc: 'When you feel best: DOW mood trends, stress peaks & score distributions', href: '/checkin/patterns', emoji: '📊' },
      { label: 'Fitness Profile', desc: '6-dimension health fingerprint: HRV, sleep, activity, cardiac, recovery & VO₂', href: '/fitness-profile', emoji: '🎯' },
      { label: 'AI Insights', desc: 'Claude-powered health analysis', href: '/insights', emoji: '✨' },
      { label: 'Smart Nudges', desc: 'Algorithmic health recommendations from your data', href: '/nudges', emoji: '🎯' },
      { label: 'Health Heatmap', desc: '90-day multi-metric grid: steps, sleep, HRV, calories & recovery', href: '/heatmap', emoji: '🗓️' },
      { label: 'Sync Status', desc: 'Data coverage and device health', href: '/sync', emoji: '🔄' },
    ],
  },
]

export default async function ExplorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Explore</h1>
            <p className="text-sm text-text-secondary">All analytics and insights</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {section.features.map((feature) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors"
                >
                  <span className="text-xl shrink-0 mt-0.5">{feature.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-tight">
                      {feature.label}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-tight opacity-70">
                      {feature.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-2 pb-4 text-center text-xs text-text-secondary opacity-40">
          {SECTIONS.reduce((n, s) => n + s.features.length, 0)} analytics pages
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
