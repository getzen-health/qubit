import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const TABLES = [
  'daily_summaries', 'sleep_records', 'workouts', 'food_diary_entries',
  'mood_entries', 'water_entries', 'blood_glucose_entries', 'body_measurements',
  'supplements', 'scan_history', 'user_goals', 'user_streaks', 'coach_conversations',
  'meal_plans', 'user_preferences',
]

export const DELETE = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true },
  async (request, { user, supabase }) => {
    const { confirmation } = await request.json()
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return secureErrorResponse('Please type DELETE MY ACCOUNT to confirm', 400)
    }

    // Delete all data belonging to the authenticated user only
    await Promise.all(TABLES.map(table =>
      supabase.from(table).delete().eq('user_id', user!.id)
    ))

    await supabase.auth.signOut()
    return secureJsonResponse({ success: true, message: 'All data deleted and signed out' })
  }
)
