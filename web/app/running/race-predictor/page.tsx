import { createClient } from '@/lib/supabase/server'
import { RacePredictorClient } from './race-predictor-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface RunRow {
  duration_minutes: number
  distance_meters: number
  avg_pace_per_km: number | null
}

export default async function RacePredictorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let runs: RunRow[] = []
  if (user) {
    const { data } = await supabase
      .from('workout_records')
      .select('duration_minutes, distance_meters, avg_pace_per_km')
      .eq('user_id', user.id)
      .eq('workout_type', 'Running')
      .gt('distance_meters', 1000)
      .gt('duration_minutes', 5)
      .order('start_time', { ascending: false })
      .limit(50)
    runs = data ?? []
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 bg-background/80 backdrop-blur z-10 px-4 pt-safe-top pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/running" className="p-2 -ml-2 rounded-xl hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <h1 className="text-lg font-bold text-text-primary">Race Predictor</h1>
        </div>
      </div>
      <RacePredictorClient runs={runs} />
    </div>
  )
}
