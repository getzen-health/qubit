import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MacrosClient } from './macros-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Macro Nutrients' }

export default async function MacrosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startIso = thirtyDaysAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('type, value, start_time')
    .eq('user_id', user.id)
    .in('type', ['dietary_energy', 'dietary_protein', 'dietary_carbs', 'dietary_fat', 'dietary_fiber', 'dietary_water'])
    .gte('start_time', startIso)
    .gt('value', 0)
    .order('start_time', { ascending: true })

  // Aggregate by day
  type DayMacros = {
    date: string
    energy?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    water?: number
  }
  const byDay: Record<string, DayMacros> = {}

  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    if (!byDay[day]) byDay[day] = { date: day }
    const typeMap: Record<string, keyof DayMacros> = {
      dietary_energy: 'energy',
      dietary_protein: 'protein',
      dietary_carbs: 'carbs',
      dietary_fat: 'fat',
      dietary_fiber: 'fiber',
      dietary_water: 'water',
    }
    const key = typeMap[r.type]
    if (key) byDay[day][key] = Math.round(r.value)
  }

  const days = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))

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
            <h1 className="text-xl font-bold text-text-primary">Macro Nutrients</h1>
            <p className="text-sm text-text-secondary">From Apple Health · Last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MacrosClient days={days} />
      </main>
      <BottomNav />
    </div>
  )
}
