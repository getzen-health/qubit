import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { calculateHormoneScores, emptyHormoneLog } from '@/lib/hormone-health'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('hormone_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', sinceStr)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch hormone logs', 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = logs?.find((l) => l.date === today) ?? emptyHormoneLog(today)
    const currentScore = calculateHormoneScores(todayLog)

    const scoredLogs = (logs ?? []).map((l) => ({
      ...l,
      scores: calculateHormoneScores(l),
    }))

    return secureJsonResponse({ logs: scoredLogs, currentScore, todayLog })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const today = body.date ?? new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('hormone_logs')
      .upsert(
        { ...body, user_id: user!.id, date: today, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save hormone log', 500)

    const score = calculateHormoneScores(data)
    return secureJsonResponse({ log: data, score })
  }
)
