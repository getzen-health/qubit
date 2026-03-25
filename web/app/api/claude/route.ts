import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(5000),
      })
    )
    .min(1, 'messages array is required')
    .max(50, 'Too many messages (max 50)'),
  systemPrompt: z.string().min(1).max(2000),
})

export const POST = createSecureApiHandler(
  {
    rateLimit: 'aiChat',
    requireAuth: true,
    bodySchema,
    auditAction: 'CREATE',
    auditResource: 'ai_chat',
  },
  async (_request: NextRequest, { body }) => {
    const { messages, systemPrompt } = body as z.infer<typeof bodySchema>

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })

      const textBlock = response.content.find((block) => block.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        return secureErrorResponse('No text response from Claude', 500)
      }

      return secureJsonResponse({ content: textBlock.text })
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          return secureErrorResponse('Rate limit exceeded. Please try again.', 429)
        }
        return secureErrorResponse('AI service temporarily unavailable', 502)
      }
      return secureErrorResponse('Failed to call AI API', 500)
    }
  }
)
