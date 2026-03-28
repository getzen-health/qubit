import { NextResponse } from 'next/server'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { logger } from '@/lib/logger'

export const POST = createSecureApiHandler(
  { requireAuth: true },
  async (_request, context) => {
    const { user, supabase } = context

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user!.id)
      .eq('provider', 'strava')

    if (error) {
      logger.error('Failed to disconnect Strava:', error)
      return secureErrorResponse('Failed to disconnect', 500)
    }

    return secureJsonResponse({ success: true })
  }
)
