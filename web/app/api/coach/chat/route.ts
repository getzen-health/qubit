import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import Anthropic from '@anthropic-ai/sdk'
import { compileHealthContext, formatContextForClaude } from '@/lib/health-context'

type CoachMode = 'chat' | 'morning_checkin' | 'weekly_review' | 'goal_coach'

const BASE_SYSTEM_PROMPT = (formattedContext: string) =>
  `You are a warm, science-literate personal health coach for KQuarks. You have access to the user's real health data shown below. Always reference specific numbers when giving advice. Distinguish between data-backed insights and general guidance. Flag when data suggests seeing a doctor.

[HEALTH CONTEXT]
${formattedContext}
[/HEALTH CONTEXT]

Guidelines:
- Be encouraging but honest
- Cite which metrics you're referencing (e.g., "Based on your 6.2h sleep last night...")
- Keep responses concise (3-5 sentences for most responses, longer for weekly review)
- Never be preachy or lecture repeatedly about the same thing
- Always end with one specific, actionable recommendation`

const MODE_SYSTEM_ADDITIONS: Partial<Record<CoachMode, string>> = {
  morning_checkin: `For morning check-ins: Focus on last night's sleep and this week's recovery trend. Keep it warm, motivating, and under 120 words. Include: (1) sleep assessment, (2) readiness for today, (3) one specific action for today.`,
  weekly_review: `For the weekly review, structure your response with these sections:\n## 🏆 Wins This Week\n[2-3 specific achievements with numbers]\n\n## 📈 Areas to Improve\n[1-2 specific metrics needing attention]\n\n## 🎯 Top Recommendation\n[One specific, actionable recommendation for next week]`,
  goal_coach: `Focus exclusively on the user's active health goals. Reference specific goal names and progress percentages. Help strategize to make progress on top goals.`,
}

const MODE_TRIGGER_MESSAGES: Record<'morning_checkin' | 'weekly_review', string> = {
  morning_checkin: 'Please give me my personalized morning health check-in for today.',
  weekly_review: 'Please give me my comprehensive 7-day health review with wins, areas to improve, and top recommendation.',
}

export const POST = createSecureApiHandler(
  { rateLimit: 'aiChat', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const {
      message,
      sessionId,
      mode = 'chat' as CoachMode,
      messages: clientMessages,
    }: {
      message?: string
      sessionId?: string
      mode?: CoachMode
      messages?: { role: 'user' | 'assistant'; content: string }[]
    } = body

    const isAutoMode = mode === 'morning_checkin' || mode === 'weekly_review'
    if (!isAutoMode && !message?.trim()) {
      return secureErrorResponse('Message required', 400)
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return secureErrorResponse('AI service not configured', 503)

    // Compile rich health context from all tracked dimensions
    const ctx = await compileHealthContext(user!.id, supabase)
    const formattedContext = formatContextForClaude(ctx)

    const modeAddition = MODE_SYSTEM_ADDITIONS[mode]
    const systemPrompt = BASE_SYSTEM_PROMPT(formattedContext) +
      (modeAddition ? `\n\n${modeAddition}` : '')

    const anthropic = new Anthropic({ apiKey })

    // Auto-generated modes: Claude responds to a synthetic trigger without history
    if (isAutoMode) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: mode === 'weekly_review' ? 800 : 300,
          system: systemPrompt,
          messages: [{ role: 'user', content: MODE_TRIGGER_MESSAGES[mode] }],
        })
        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        return secureJsonResponse({ message: text })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI request failed'
        return secureErrorResponse(msg, 500)
      }
    }

    // Chat modes: build conversation history
    let history: { role: 'user' | 'assistant'; content: string }[] = []

    if (clientMessages && clientMessages.length > 0) {
      // Use history provided by client (localStorage-based)
      history = clientMessages.slice(-8)
    } else if (sessionId) {
      // Fallback: fetch session history from DB
      const { data } = await supabase
        .from('coach_conversations')
        .select('role, content')
        .eq('user_id', user!.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(8)
      history = (data ?? []) as { role: 'user' | 'assistant'; content: string }[]
    }

    const claudeMessages = [
      ...history,
      { role: 'user' as const, content: message! },
    ]

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        system: systemPrompt,
        messages: claudeMessages,
      })
      const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

      // Persist for session-based continuity when sessionId provided
      if (sessionId) {
        await Promise.all([
          supabase.from('coach_conversations').insert({
            user_id: user!.id,
            session_id: sessionId,
            role: 'user',
            content: message!,
          }),
          supabase.from('coach_conversations').insert({
            user_id: user!.id,
            session_id: sessionId,
            role: 'assistant',
            content: assistantMessage,
          }),
        ])
      }

      return secureJsonResponse({ message: assistantMessage })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI request failed'
      return secureErrorResponse(msg, 500)
    }
  }
)

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) return secureJsonResponse({ data: [] })

    const { data } = await supabase
      .from('coach_conversations')
      .select('id, role, content, created_at')
      .eq('user_id', user!.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    return secureJsonResponse({ data: data ?? [] })
  }
)
