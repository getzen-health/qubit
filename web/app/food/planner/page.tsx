import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { PlannerClient } from './planner-client'

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default async function MealPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const weekParam =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : null
  const weekStart = getMondayOfWeek(weekParam ? new Date(weekParam + 'T00:00:00') : new Date())
  const startDate = toDateStr(weekStart)
  const endDate = toDateStr(new Date(weekStart.getTime() + 7 * 86400000))

  const { data: plans } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .gte('plan_date', startDate)
    .lt('plan_date', endDate)
    .order('plan_date', { ascending: true })

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/food/diary"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Meal Planner</h1>
            <p className="text-xs text-text-secondary">Plan your week ahead</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 py-4">
        <PlannerClient initialPlans={plans ?? []} startDate={startDate} />
      </main>

      <BottomNav />
    </div>
  )
}
