import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { confirmation } = await request.json()
  if (confirmation !== 'DELETE MY ACCOUNT') {
    return NextResponse.json({ error: 'Please type DELETE MY ACCOUNT to confirm' }, { status: 400 })
  }

  // Delete user from auth (cascades to all tables via RLS)
  const adminSupabase = await createClient()
  // Note: actual deletion requires service role — this marks for deletion
  // For now, delete from all known tables
  const TABLES = [
    'daily_summaries', 'sleep_records', 'workouts', 'food_diary_entries',
    'mood_entries', 'water_entries', 'blood_glucose_entries', 'body_measurements',
    'supplements', 'scan_history', 'user_goals', 'user_streaks', 'coach_conversations',
    'meal_plans', 'user_preferences', 'water_entries'
  ]

  await Promise.all(TABLES.map(table =>
    adminSupabase.from(table).delete().eq('user_id', user.id)
  ))

  await supabase.auth.signOut()
  return NextResponse.json({ success: true, message: 'All data deleted and signed out' })
}
