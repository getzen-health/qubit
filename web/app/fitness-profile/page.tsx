import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const FitnessProfileClient = dynamic(() => import('./profile-client').then(m => ({ default: m.FitnessProfileClient })))
import type { FitnessProfileData, DimensionScore } from './profile-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Fitness Profile' }

// Clamp to 0–100
function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))) }

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export default async function FitnessProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  // Last 60 days of daily summaries (30 = this month, 31-60 = last month)
  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [{ data: summaries }, { data: vo2Records }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv, resting_heart_rate, recovery_score, sleep_efficiency_percent, deep_sleep_minutes, rem_sleep_minutes')
      .eq('user_id', user.id)
      .gte('date', sixtyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'vo2_max')
      .gte('start_time', sixtyDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
  ])

  const rows = summaries ?? []
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)

  const thisPeriod = rows.filter((r) => r.date >= thirtyDaysAgoStr)
  const prevPeriod = rows.filter((r) => r.date < thirtyDaysAgoStr)

  // ── HRV Score ─────────────────────────────────────────────────────────────
  // Score = how current 30d avg compares to 60d baseline, normalized 0-100
  // A ratio of 1.0 (at baseline) = 60; above = higher; below = lower
  const allHrvs = rows.map((r) => r.avg_hrv).filter((v) => v && v > 0) as number[]
  const thisHrvs = thisPeriod.map((r) => r.avg_hrv).filter((v) => v && v > 0) as number[]
  const prevHrvs = prevPeriod.map((r) => r.avg_hrv).filter((v) => v && v > 0) as number[]
  const baseline60 = avg(allHrvs)
  const thisHrvAvg = avg(thisHrvs)
  const prevHrvAvg = avg(prevHrvs)

  function hrvScore(hrv: number, base: number): number {
    if (base <= 0 || hrv <= 0) return 50
    const ratio = hrv / base  // 1.0 = at baseline
    return clamp(50 + (ratio - 1) * 100)  // ±50 pts for ±50% deviation
  }
  const hrvCurrent = hrvScore(thisHrvAvg, baseline60)
  const hrvPrev = hrvScore(prevHrvAvg, baseline60)
  const hrvValue = thisHrvAvg > 0 ? `${Math.round(thisHrvAvg)} ms avg` : 'No data'

  // ── Sleep Score ───────────────────────────────────────────────────────────
  // Optimal = 7.5h; score based on how close to 7.5h + sleep efficiency if available
  function sleepHrScore(mins: number, eff: number): number {
    if (mins <= 0) return 0
    const hours = mins / 60
    const optimalHours = 7.5
    const durationScore = Math.max(0, 100 - Math.abs(hours - optimalHours) * 25)
    const effScore = eff > 0 ? clamp((eff - 70) * 2.5) : durationScore
    return clamp(durationScore * 0.6 + effScore * 0.4)
  }
  const thisSleepMins = avg(thisPeriod.map((r) => r.sleep_duration_minutes ?? 0).filter((v) => v > 0))
  const prevSleepMins = avg(prevPeriod.map((r) => r.sleep_duration_minutes ?? 0).filter((v) => v > 0))
  const thisSleepEff = avg(thisPeriod.map((r) => r.sleep_efficiency_percent ?? 0).filter((v) => v > 0))
  const prevSleepEff = avg(prevPeriod.map((r) => r.sleep_efficiency_percent ?? 0).filter((v) => v > 0))
  const sleepCurrent = sleepHrScore(thisSleepMins, thisSleepEff)
  const sleepPrev = sleepHrScore(prevSleepMins, prevSleepEff)
  const sleepHours = thisSleepMins > 0 ? `${(thisSleepMins / 60).toFixed(1)}h avg` : 'No data'

  // ── Activity Score ────────────────────────────────────────────────────────
  // Steps target: 10,000; score = (avg steps / 10000) * 100, capped at 100
  const thisSteps = avg(thisPeriod.map((r) => r.steps ?? 0).filter((v) => v > 0))
  const prevSteps = avg(prevPeriod.map((r) => r.steps ?? 0).filter((v) => v > 0))
  const activityCurrent = clamp((thisSteps / 10000) * 100)
  const activityPrev = clamp((prevSteps / 10000) * 100)
  const stepsValue = thisSteps > 0 ? `${Math.round(thisSteps).toLocaleString()} steps/day` : 'No data'

  // ── Cardiac Score ─────────────────────────────────────────────────────────
  // RHR: excellent < 50, good 50-60, fair 60-70, poor > 80
  // Score = clamp(100 - (rhr - 40) * 2.5, 0, 100)
  function rhrScore(rhr: number): number {
    if (rhr <= 0) return 50
    return clamp(100 - (rhr - 40) * 2.5)
  }
  const thisRhr = avg(thisPeriod.map((r) => r.resting_heart_rate ?? 0).filter((v) => v > 0))
  const prevRhr = avg(prevPeriod.map((r) => r.resting_heart_rate ?? 0).filter((v) => v > 0))
  const cardiacCurrent = rhrScore(thisRhr)
  const cardiacPrev = rhrScore(prevRhr)
  const rhrValue = thisRhr > 0 ? `${Math.round(thisRhr)} bpm resting HR` : 'No data'

  // ── Recovery Score ────────────────────────────────────────────────────────
  // Direct 0-100 metric
  const thisRec = avg(thisPeriod.map((r) => r.recovery_score ?? 0).filter((v) => v > 0))
  const prevRec = avg(prevPeriod.map((r) => r.recovery_score ?? 0).filter((v) => v > 0))
  const recCurrent = clamp(thisRec)
  const recPrev = clamp(prevRec)
  const recValue = thisRec > 0 ? `${Math.round(thisRec)}% avg recovery` : 'No data'

  // ── Aerobic Fitness Score (VO2 Max) ───────────────────────────────────────
  // VO2 max percentile vs population norms (using general adult thresholds)
  // Poor < 35, Fair 35-40, Good 40-45, Excellent 45-50, Superior > 50
  function vo2Score(vo2: number): number {
    if (vo2 <= 0) return 50
    return clamp((vo2 - 25) * (100 / 35))  // 25→0, 60→100
  }
  const vo2Rows = vo2Records ?? []
  const recentVo2 = vo2Rows.filter((r) => r.start_time >= thirtyDaysAgoStr).map((r) => r.value as number)
  const prevVo2 = vo2Rows.filter((r) => r.start_time < thirtyDaysAgoStr).map((r) => r.value as number)
  const thisVo2 = recentVo2.length > 0 ? recentVo2[recentVo2.length - 1] : (vo2Rows.length > 0 ? (vo2Rows[vo2Rows.length - 1].value as number) : 0)
  const lastVo2 = prevVo2.length > 0 ? prevVo2[prevVo2.length - 1] : thisVo2
  const aerobicCurrent = vo2Score(thisVo2)
  const aerobicPrev = vo2Score(lastVo2)
  const vo2Value = thisVo2 > 0 ? `${thisVo2.toFixed(1)} mL/kg/min` : 'No Apple Health data'

  // ── Build dimensions ───────────────────────────────────────────────────────
  const dimensions: DimensionScore[] = [
    {
      name: 'HRV & Recovery',
      shortName: 'HRV',
      score: hrvCurrent,
      prevScore: hrvPrev,
      value: hrvValue,
      label: 'Current 30d HRV avg vs your 60d baseline. Above baseline = high score.',
      color: 'text-purple-400',
      icon: '💗',
    },
    {
      name: 'Sleep Quality',
      shortName: 'Sleep',
      score: sleepCurrent,
      prevScore: sleepPrev,
      value: sleepHours,
      label: 'Based on average sleep duration (optimal 7–8h) and sleep efficiency.',
      color: 'text-blue-400',
      icon: '😴',
    },
    {
      name: 'Activity Level',
      shortName: 'Activity',
      score: activityCurrent,
      prevScore: activityPrev,
      value: stepsValue,
      label: 'Average daily steps vs 10,000 target. Includes all movement.',
      color: 'text-green-400',
      icon: '🚶',
    },
    {
      name: 'Cardiac Health',
      shortName: 'Cardiac',
      score: cardiacCurrent,
      prevScore: cardiacPrev,
      value: rhrValue,
      label: 'Resting heart rate vs fitness norms. Lower RHR = better score.',
      color: 'text-red-400',
      icon: '❤️',
    },
    {
      name: 'Recovery Rate',
      shortName: 'Recovery',
      score: recCurrent,
      prevScore: recPrev,
      value: recValue,
      label: 'Average daily recovery score. Reflects HRV, sleep, and strain balance.',
      color: 'text-orange-400',
      icon: '⚡',
    },
    {
      name: 'Aerobic Fitness',
      shortName: 'VO₂ Max',
      score: aerobicCurrent,
      prevScore: aerobicPrev,
      value: vo2Value,
      label: 'VO₂ max from Apple Health. Reflects cardiovascular efficiency.',
      color: 'text-cyan-400',
      icon: '🫀',
    },
  ]

  // ── Overall score ──────────────────────────────────────────────────────────
  const scoredDims = dimensions.filter((d) => d.score > 0)
  const overallScore = scoredDims.length > 0
    ? clamp(scoredDims.reduce((s, d) => s + d.score, 0) / scoredDims.length)
    : 50
  const prevScoredDims = dimensions.filter((d) => d.prevScore > 0)
  const prevOverallScore = prevScoredDims.length > 0
    ? clamp(prevScoredDims.reduce((s, d) => s + d.prevScore, 0) / prevScoredDims.length)
    : 50

  // ── Strengths & improvements ───────────────────────────────────────────────
  const strengthItems = dimensions
    .filter((d) => d.score >= 70)
    .map((d) => `${d.icon} ${d.name} is strong at ${d.score}/100`)
  const improvementItems = dimensions
    .filter((d) => d.score < 50 && d.value !== 'No data' && d.value !== 'No Apple Health data')
    .map((d) => {
      if (d.name === 'Sleep Quality') return `Aim for 7–8h of sleep consistently to boost your score`
      if (d.name === 'Activity Level') return `Increase daily steps — you\'re at ${d.value}`
      if (d.name === 'Cardiac Health') return `Work to lower resting heart rate through consistent cardio`
      if (d.name === 'HRV & Recovery') return `Your HRV is below baseline — prioritize recovery`
      if (d.name === 'Recovery Rate') return `Focus on sleep and reducing training load to improve recovery`
      if (d.name === 'Aerobic Fitness') return `Increase Zone 2 running/cycling to boost VO₂ max`
      return `${d.name} has room to improve`
    })
    .slice(0, 3)

  const profileData: FitnessProfileData = {
    dimensions,
    overallScore,
    prevOverallScore,
    strengths: strengthItems.slice(0, 3),
    improvements: improvementItems,
  }

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
            <h1 className="text-xl font-bold text-text-primary">Fitness Profile</h1>
            <p className="text-sm text-text-secondary">6-dimension health fingerprint · last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <FitnessProfileClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
