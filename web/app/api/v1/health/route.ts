import { apiResponse } from '@/lib/api-response'

export async function GET() {
  return apiResponse({
    version: "1.0",
    status: "ok",
    timestamp: new Date().toISOString()
  }, 200)
}
