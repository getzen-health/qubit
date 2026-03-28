import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { getUserApiKey } from '@/lib/get-user-api-key'

const bodySchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  insightType: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  context: z.string().max(2000).optional(),
})

// POST /api/generate-insights — generate AI-powered health insights for a user
export const POST = createSecureApiHandler(
  {
    rateLimit: 'aiChat',
    requireAuth: true,
    bodySchema,
    auditAction: 'CREATE',
    auditResource: 'ai_chat',
  },
  async (_request, { user, body, supabase }) => {
    const { userId, insightType, context } = body as z.infer<typeof bodySchema>

    // Validate that the userId in the body matches the authenticated user
    if (userId !== user!.id) {
      return secureErrorResponse('Forbidden: userId does not match authenticated user', 403)
    }

    // Fetch recent health summary for context
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, avg_hrv, resting_heart_rate, recovery_score')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7)

    const summaryText = summary && summary.length > 0
      ? `Recent health data (last ${summary.length} days):\n${JSON.stringify(summary, null, 2)}`
      : 'No recent health data available.'

    const systemPrompt = `You are a personal health coach analyzing health metrics data. 
Provide concise, actionable ${insightType} insights based on the user's health data. 
Focus on patterns, improvements, and specific recommendations. Keep responses under 300 words.`

    const userMessage = [
      summaryText,
      context ? `\nAdditional context: ${context}` : '',
      `\nPlease provide ${insightType} health insights.`,
    ].join('')

    const userApiKey = await getUserApiKey(userId, supabase)
    const apiKey = userApiKey ?? process.env.ANTHROPIC_API_KEY
    if (!apiKey) return secureErrorResponse('AI service not configured', 503)

    const anthropic = new Anthropic({ apiKey })

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })

      const textBlock = response.content.find((block) => block.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        return secureErrorResponse('No text response from AI', 500)
      }

      return secureJsonResponse({
        insight: textBlock.text,
        insightType,
        generatedAt: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) return secureErrorResponse('Rate limit exceeded. Please try again.', 429)
        return secureErrorResponse('AI service temporarily unavailable', 502)
      }
      return secureErrorResponse('Failed to generate insights', 500)
    }
  }
)
