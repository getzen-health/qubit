import { apiLogger } from '@/lib/api-logger'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const USER_SCOPED_TABLES = [
  'health_records',
  'meals',
  'meal_items',
  'workout_records',
  'sleep_records',
  'product_scans',
  'product_favorites',
  'vo2max_estimates',
  'predictions',
  'chat_messages',
  'briefings',
  'anomalies',
  'daily_checkins',
  'user_preferences',
  'strength_sessions',
  'strength_sets',
  'ecg_records',
  'water_logs',
  'habit_completions',
  'habits',
  'daily_summaries',
  'daily_heart_rate',
  'daily_water',
  'daily_nutrition',
  'fasting_sessions',
  'heart_rate_samples',
  'user_achievements',
  'user_ai_settings',
  'user_devices',
  'user_nutrition_settings',
  'user_encryption_keys',
  'health_insights',
  'users',
] as const

export const DELETE = createSecureApiHandler(
  {
    requireAuth: true,
    skipRateLimit: true,
    auditAction: 'DELETE',
    auditResource: 'user_data',
  },
  async (_req: NextRequest, { user }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return secureErrorResponse('Server not configured', 500)
    }

    const userId = user!.id
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Delete all user-scoped data in order before removing the auth user
    for (const table of USER_SCOPED_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId)
      if (error) {
        apiLogger(`Failed to delete from ${table}:`, error instanceof Error ? error.message : 'Unknown error')
        // Continue — the auth.users cascade will clean up any remainder
      }
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      apiLogger('Failed to delete auth user:', deleteUserError instanceof Error ? deleteUserError.message : 'Unknown error')
      return secureErrorResponse('Failed to delete account', 500)
    }

    return secureJsonResponse({ success: true })
  }
)
