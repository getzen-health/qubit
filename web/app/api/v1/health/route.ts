import { versionedHeaders } from '@/lib/api-version'

export async function GET() {
  return new Response(
    JSON.stringify({ version: "v1", status: "ok", timestamp: new Date().toISOString() }),
    { headers: versionedHeaders() }
  )
}
