import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: assessments, error } = await supabase
      .from('fms_assessments')
      .select('id, assessed_at, total_score, risk_level, weak_links, asymmetries, scores, notes, created_at')
      .eq('user_id', user!.id)
      .order('assessed_at', { ascending: false })
      .limit(50)

    if (error) {
      return secureErrorResponse('Failed to fetch assessments', 500)
    }

    const trend = (assessments ?? [])
      .slice()
      .reverse()
      .map((a) => ({ date: a.assessed_at, total: a.total_score, risk_level: a.risk_level }))

    return secureJsonResponse({ assessments: assessments ?? [], trend })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    let body: {
      scores: unknown
      total_score: number
      risk_level: string
      weak_links?: string[]
      asymmetries?: string[]
      notes?: string
      assessed_at?: string
    }

    try {
      body = await req.json()
    } catch {
      return secureErrorResponse('Invalid JSON body', 400)
    }

    const { scores, total_score, risk_level, weak_links, asymmetries, notes, assessed_at } = body

    if (typeof total_score !== 'number' || total_score < 0 || total_score > 21) {
      return secureErrorResponse('Invalid total_score', 400)
    }
    if (!['Low', 'Elevated', 'High'].includes(risk_level)) {
      return secureErrorResponse('Invalid risk_level', 400)
    }

    const { data, error } = await supabase
      .from('fms_assessments')
      .insert({
        user_id: user!.id,
        assessed_at: assessed_at ?? new Date().toISOString().slice(0, 10),
        scores,
        total_score,
        risk_level,
        weak_links: weak_links ?? [],
        asymmetries: asymmetries ?? [],
        notes: notes ?? null,
      })
      .select('id, assessed_at, total_score, risk_level')
      .single()

    if (error) {
      return secureErrorResponse('Failed to save assessment', 500)
    }

    return secureJsonResponse({ assessment: data }, 201)
  }
)
