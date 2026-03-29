import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  createSecureApiHandler,
  secureErrorResponse,
} from '@/lib/security'

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
  context: z
    .object({
      steps: z.number().nonnegative().optional(),
      sleep: z.number().nonnegative().optional(),
      heartRate: z.number().positive().optional(),
      recentInsight: z.string().max(500).optional(),
    })
    .optional(),
})

function buildSystemPrompt(ctx: z.infer<typeof bodySchema>['context']): string {
  const steps = ctx?.steps != null ? `${ctx.steps.toLocaleString()}` : 'unknown'
  const sleep = ctx?.sleep != null ? `${ctx.sleep.toFixed(1)}` : 'unknown'
  const heartRate = ctx?.heartRate != null ? `${ctx.heartRate}` : 'unknown'
  const insight = ctx?.recentInsight ? ctx.recentInsight : ''

  return `You are a personal health coach for KQuarks. You help users understand their health data and make positive lifestyle changes. You are encouraging, evidence-based, and concise. The user's recent data: ${steps} steps today, ${sleep}h sleep last night, resting HR ${heartRate}bpm. ${insight}
Respond conversationally in 2-4 sentences. Be specific to their data.`
}

export const POST = createSecureApiHandler(
  { rateLimit: 'aiChat', requireAuth: true, bodySchema },
  async (_request: NextRequest, { user, body, supabase }) => {
    const { message, sessionId, context } = body as z.infer<typeof bodySchema>

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return secureErrorResponse('AI service not configured', 503)

    const resolvedSessionId =
      sessionId ?? crypto.randomUUID()
    const systemPrompt = buildSystemPrompt(context)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 512,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text().catch(() => 'Claude API error')
      return secureErrorResponse(err, 502)
    }

    const encoder = new TextEncoder()
    let fullAssistantText = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = claudeRes.body!.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (!data || data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data) as Record<string, unknown>
                if (
                  parsed.type === 'content_block_delta' &&
                  parsed.delta != null &&
                  typeof parsed.delta === 'object' &&
                  (parsed.delta as Record<string, unknown>).type === 'text_delta'
                ) {
                  const text = (parsed.delta as Record<string, unknown>).text as string
                  if (text) {
                    fullAssistantText += text
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                    )
                  }
                }
              } catch {
                // ignore malformed SSE lines
              }
            }
          }

          // Persist both turns after stream completes
          const { error: insertError } = await supabase.from('coaching_messages').insert([
            {
              user_id: user!.id,
              role: 'user',
              content: message,
              session_id: resolvedSessionId,
            },
            {
              user_id: user!.id,
              role: 'assistant',
              content: fullAssistantText,
              session_id: resolvedSessionId,
            },
          ])
          if (insertError) {
            console.error('Failed to persist coaching messages:', insertError.message)
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, sessionId: resolvedSessionId })}\n\n`
            )
          )
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }) as unknown as NextResponse
  }
)
