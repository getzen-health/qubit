import { apiResponse } from '@/lib/api-response'
import { trackApiCall } from '@/lib/monitoring'

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    const duration = Date.now() - startTime
    void trackApiCall({
      endpoint: '/api/v1/health',
      duration_ms: duration,
      status_code: 200,
    })
    return apiResponse({
      version: "1.0",
      status: "ok",
      timestamp: new Date().toISOString()
    }, 200)
  } catch (err) {
    const duration = Date.now() - startTime
    void trackApiCall({
      endpoint: '/api/v1/health',
      duration_ms: duration,
      status_code: 500,
    })
    throw err
  }
}
