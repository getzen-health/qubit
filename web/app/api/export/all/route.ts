import { NextResponse } from 'next/server'
import { createSecureApiHandler } from '@/lib/security'

const TABLES = [
  'daily_summaries', 'sleep_records', 'workouts', 'food_diary_entries',
  'mood_entries', 'water_entries', 'blood_glucose_entries', 'body_measurements',
  'supplements', 'medications', 'scan_history', 'user_goals', 'user_streaks',
  'blood_pressure_records', 'stress_entries',
]

export const GET = createSecureApiHandler(
  { rateLimit: 'export', requireAuth: true },
  async (_req, { user, supabase }) => {
    const exportData: Record<string, unknown[]> = {
      exported_at: [new Date().toISOString()],
      user_id: [user!.id],
    }

    await Promise.all(
      TABLES.map(async (table) => {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', user!.id)
        if (error) throw new Error(`Failed to export ${table}: ${error.message}`)
        exportData[table] = data ?? []
      })
    )

    const json = JSON.stringify(exportData, null, 2)
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="getzen-health-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  }
)
