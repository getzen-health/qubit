import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const NutritionPatternsClient = dynamic(() => import('./nutrition-patterns-client').then(m => ({ default: m.NutritionPatternsClient })))
import type { NutritionPatternData } from './nutrition-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Nutrition Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function NutritionPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const startIso = oneYearAgo.toISOString()

  const [{ data: records }, { data: settings }] = await Promise.all([
    supabase
      .from('health_records')
      .select('type, value, start_time')
      .eq('user_id', user.id)
      .in('type', ['dietary_energy', 'dietary_protein', 'dietary_carbs', 'dietary_fat', 'dietary_fiber'])
      .gte('start_time', startIso)
      .gt('value', 0)
      .order('start_time', { ascending: true }),
    supabase
      .from('user_nutrition_settings')
      .select('calorie_target, protein_target_g, carbs_target_g, fat_target_g')
      .eq('user_id', user.id)
      .single(),
  ])

  const calTarget = settings?.calorie_target ?? 2000
  const protTarget = settings?.protein_target_g ?? 150
  const carbTarget = settings?.carbs_target_g ?? 250
  const fatTarget = settings?.fat_target_g ?? 65

  // Aggregate by calendar day
  type DayMacros = {
    date: string
    energy: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    count: number
  }
  const byDay: Record<string, DayMacros> = {}
  for (const r of records ?? []) {
    const date = r.start_time.slice(0, 10)
    if (!byDay[date]) byDay[date] = { date, energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, count: 0 }
    byDay[date].count++
    if (r.type === 'dietary_energy') byDay[date].energy += r.value
    if (r.type === 'dietary_protein') byDay[date].protein += r.value
    if (r.type === 'dietary_carbs') byDay[date].carbs += r.value
    if (r.type === 'dietary_fat') byDay[date].fat += r.value
    if (r.type === 'dietary_fiber') byDay[date].fiber += r.value
  }

  const days = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
  const daysWithCals = days.filter((d) => d.energy > 100) // filter clearly incomplete days

  if (daysWithCals.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/nutrition" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Nutrition Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🥗</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Log meals for at least 5 days to see nutrition patterns.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // DOW averages
  const dowBuckets: DayMacros[][] = Array.from({ length: 7 }, () => [])
  for (const d of daysWithCals) {
    const dow = new Date(d.date + 'T12:00:00').getDay()
    dowBuckets[dow].push(d)
  }
  const dowData = dowBuckets.map((bucket, i) => {
    const n = bucket.length
    return {
      label: DOW_LABELS[i],
      count: n,
      avgCals: n > 0 ? Math.round(bucket.reduce((s, d) => s + d.energy, 0) / n) : 0,
      avgProtein: n > 0 ? Math.round(bucket.reduce((s, d) => s + d.protein, 0) / n) : 0,
      avgCarbs: n > 0 ? Math.round(bucket.reduce((s, d) => s + d.carbs, 0) / n) : 0,
      avgFat: n > 0 ? Math.round(bucket.reduce((s, d) => s + d.fat, 0) / n) : 0,
      hitRate: n > 0 ? Math.round(bucket.filter((d) => d.energy >= calTarget * 0.85 && d.energy <= calTarget * 1.15).length / n * 100) : 0,
    }
  })

  // Monthly averages
  const monthBuckets: Record<string, DayMacros[]> = {}
  for (const d of daysWithCals) {
    const key = d.date.slice(0, 7)
    if (!monthBuckets[key]) monthBuckets[key] = []
    monthBuckets[key].push(d)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, bucket]) => {
      const n = bucket.length
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        count: n,
        avgCals: Math.round(bucket.reduce((s, d) => s + d.energy, 0) / n),
        avgProtein: Math.round(bucket.reduce((s, d) => s + d.protein, 0) / n),
        avgCarbs: Math.round(bucket.reduce((s, d) => s + d.carbs, 0) / n),
        avgFat: Math.round(bucket.reduce((s, d) => s + d.fat, 0) / n),
      }
    })

  // Macro split (overall averages)
  const totalN = daysWithCals.length
  const overallCals = daysWithCals.reduce((s, d) => s + d.energy, 0) / totalN
  const overallProtein = daysWithCals.reduce((s, d) => s + d.protein, 0) / totalN
  const overallCarbs = daysWithCals.reduce((s, d) => s + d.carbs, 0) / totalN
  const overallFat = daysWithCals.reduce((s, d) => s + d.fat, 0) / totalN
  const overallFiber = daysWithCals.reduce((s, d) => s + d.fiber, 0) / totalN

  // Calorie distribution buckets (200 kcal bands from 0 to 4000+)
  const calBuckets: { label: string; min: number; max: number; count: number; pct: number }[] = []
  for (let min = 0; min < 4000; min += 200) {
    const max = min + 200
    const count = daysWithCals.filter((d) => d.energy >= min && d.energy < max).length
    if (count > 0) {
      calBuckets.push({
        label: `${min}–${max}`,
        min,
        max,
        count,
        pct: Math.round(count / totalN * 100),
      })
    }
  }
  const count4000 = daysWithCals.filter((d) => d.energy >= 4000).length
  if (count4000 > 0) {
    calBuckets.push({ label: '4000+', min: 4000, max: 9999, count: count4000, pct: Math.round(count4000 / totalN * 100) })
  }

  // Weekday vs weekend
  const weekdayDays = daysWithCals.filter((d) => {
    const dow = new Date(d.date + 'T12:00:00').getDay()
    return dow >= 1 && dow <= 5
  })
  const weekendDays = daysWithCals.filter((d) => {
    const dow = new Date(d.date + 'T12:00:00').getDay()
    return dow === 0 || dow === 6
  })
  const weekdayAvgCals = weekdayDays.length > 0 ? Math.round(weekdayDays.reduce((s, d) => s + d.energy, 0) / weekdayDays.length) : null
  const weekendAvgCals = weekendDays.length > 0 ? Math.round(weekendDays.reduce((s, d) => s + d.energy, 0) / weekendDays.length) : null

  const profileData: NutritionPatternData = {
    totalDays: totalN,
    calTarget,
    protTarget,
    carbTarget,
    fatTarget,
    overallCals: Math.round(overallCals),
    overallProtein: Math.round(overallProtein),
    overallCarbs: Math.round(overallCarbs),
    overallFat: Math.round(overallFat),
    overallFiber: Math.round(overallFiber),
    dowData,
    monthData,
    calBuckets,
    weekdayAvgCals,
    weekendAvgCals,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/nutrition"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to nutrition"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Nutrition Patterns</h1>
            <p className="text-sm text-text-secondary">{totalN} days of data · avg {Math.round(overallCals)} kcal/day</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <NutritionPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
