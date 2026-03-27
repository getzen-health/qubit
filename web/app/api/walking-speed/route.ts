import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data, error } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, workout_type')
    .eq('user_id', user.id)
    .ilike('workout_type', '%walk%')
    .gte('start_time', since.toISOString())
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const readings = (data ?? [])
    .filter((w) => w.duration_minutes > 0 && (w.avg_pace_per_km ?? w.distance_meters))
    .map((w) => {
      // avg_pace_per_km is seconds/km → 1000m / seconds = m/s
      const speed = w.avg_pace_per_km
        ? 1000 / w.avg_pace_per_km
        : (w.distance_meters ?? 0) / (w.duration_minutes * 60)
      return {
        date: new Date(w.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        speed: Math.round(speed * 1000) / 1000,
      }
    })
    .filter((r) => r.speed > 0.2 && r.speed < 5) // sanity-filter impossible values

  return NextResponse.json({ data: readings })
}
