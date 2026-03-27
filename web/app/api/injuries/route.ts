import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: logs } = await supabase
      .from('pain_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(100)

    const byRegion: Record<string, any> = {}
    for (const log of (logs ?? [])) {
      if (!byRegion[log.body_region]) byRegion[log.body_region] = log
    }

    const regionSummary = Object.entries(byRegion).map(([region, log]: [string, any]) => {
      const daysSince = Math.floor((Date.now() - new Date(log.logged_at).getTime()) / (1000 * 60 * 60 * 24))
      const status = log.pain_level <= 3 ? 'green' : log.pain_level <= 6 ? 'yellow' : 'red'
      return { region, latestLevel: log.pain_level, daysSince, status, log }
    })

    return secureJsonResponse({ logs: logs ?? [], regionSummary })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { data, error } = await supabase
      .from('pain_logs')
      .insert({ ...body, user_id: user!.id })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to log pain', 500)
    return secureJsonResponse({ log: data })
  }
)
