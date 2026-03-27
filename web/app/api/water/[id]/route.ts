import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createSecureApiHandler(
    { rateLimit: 'healthData', requireAuth: true },
    async (_req, { user, supabase }) => {
      const { id } = await params
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) return secureErrorResponse(error.message, 400)
      return secureJsonResponse({ success: true })
    }
  )(request)
}
