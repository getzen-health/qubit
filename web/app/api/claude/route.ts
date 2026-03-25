import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeRequestBody {
  messages: ChatMessage[]
  systemPrompt: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaudeRequestBody = await request.json()
    const { messages, systemPrompt } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return NextResponse.json({ error: 'systemPrompt is required' }, { status: 400 })
    }

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
    console.error('Claude API error:', error)

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
