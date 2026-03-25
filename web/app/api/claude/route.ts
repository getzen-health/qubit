import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const claudeRequestSchema = z.object({
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

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = claudeRequestSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }

    const { messages, systemPrompt } = parsed.data

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
      return NextResponse.json({ error: 'No text response from Claude' }, { status: 500 })
    }

    return NextResponse.json({ content: textBlock.text })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Claude API key is invalid or missing. Configure ANTHROPIC_API_KEY.' },
          { status: 500 }
        )
      }
      if (error.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again.' }, { status: 429 })
      }
      return NextResponse.json({ error: `Claude API error: ${error.message}` }, { status: 502 })
    }

    return NextResponse.json({ error: 'Failed to call Claude API' }, { status: 500 })
  }
}
