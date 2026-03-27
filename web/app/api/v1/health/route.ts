import {
  createSecureApiHandler,
  secureJsonResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { requireAuth: false, skipRateLimit: true },
  async () =>
    secureJsonResponse({
      version: '1.0',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
)
