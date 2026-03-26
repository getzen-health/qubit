import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const TABLES = [
  'daily_summaries', 'sleep_records', 'workouts', 'food_diary_entries',
  'mood_entries', 'water_entries', 'blood_glucose_entries', 'body_measurements',
  'supplements', 'medications', 'scan_history', 'user_goals', 'user_streaks',
  'blood_pressure_records', 'stress_entries'
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exportData: Record<string, unknown[]> = {
    exported_at: [new Date().toISOString()],
    user_id: [user.id],
  }

  await Promise.all(
    TABLES.map(async (table) => {
      const { data } = await supabase.from(table).select('*').eq('user_id', user.id)
      exportData[table] = data ?? []
    })
  )

  const json = JSON.stringify(exportData, null, 2)
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="kquarks-health-data-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
