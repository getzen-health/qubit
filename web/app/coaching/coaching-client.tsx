'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

interface HealthContext {
  steps?: number
  sleep?: number
  heartRate?: number
  recentInsight?: string
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function CoachingClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID())
  const [context, setContext] = useState<HealthContext>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch today's health context from Supabase on mount
  useEffect(() => {
    async function loadContext() {
      const supabase = createClient()
      if (!supabase) return

      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const since7d = new Date(Date.now() - 7 * 86400000).toISOString()

      const [{ data: stepsData }, { data: sleepData }, { data: hrData }, { data: insightData }] =
        await Promise.all([
          supabase
            .from('health_records')
            .select('value')
            .eq('metric_type', 'stepCount')
            .gte('recorded_at', `${today}T00:00:00`)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('sleep_records')
            .select('duration_minutes')
            .eq('date', yesterday)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('health_records')
            .select('value')
            .eq('metric_type', 'restingHeartRate')
            .gte('recorded_at', since7d)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('ai_insights')
            .select('insight_text')
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
        ])

      setContext({
        steps: stepsData ? Number(stepsData.value) : undefined,
        sleep: sleepData ? Number(sleepData.duration_minutes) / 60 : undefined,
        heartRate: hrData ? Number(hrData.value) : undefined,
        recentInsight: insightData?.insight_text ?? undefined,
      })
    }

    loadContext()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    setInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '', streaming: true },
    ])
    setIsStreaming(true)

    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, context }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            text: 'Something went wrong. Please try again.',
          }
          return updated
        })
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const parsed = JSON.parse(raw) as {
              text?: string
              done?: boolean
              sessionId?: string
              error?: string
            }
            if (parsed.error) {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  text: `Error: ${parsed.error}`,
                }
                return updated
              })
            } else if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + parsed.text!,
                  streaming: true,
                }
                return updated
              })
            } else if (parsed.done) {
              if (parsed.sessionId) setSessionId(parsed.sessionId)
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  streaming: false,
                }
                return updated
              })
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } finally {
      setIsStreaming(false)
      setMessages((prev) => {
        const updated = [...prev]
        if (updated[updated.length - 1]?.streaming) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            streaming: false,
          }
        }
        return updated
      })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function newConversation() {
    setMessages([])
    setSessionId(crypto.randomUUID())
    setInput('')
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/90 backdrop-blur-md">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">AI Health Coach</h1>
          <p className="text-xs text-text-secondary">Powered by Claude</p>
        </div>
        <button
          onClick={newConversation}
          className="text-xs text-accent hover:underline font-medium px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors"
          aria-label="Start new conversation"
        >
          New conversation
        </button>
      </div>

      {/* Context panel */}
      {(context.steps != null || context.sleep != null || context.heartRate != null) && (
        <div className="flex gap-3 px-4 py-2 bg-surface border-b border-border overflow-x-auto">
          {context.steps != null && (
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-text-secondary">
              <span>👟</span>
              <span className="font-medium text-text-primary">{context.steps.toLocaleString()}</span>
              <span>steps</span>
            </div>
          )}
          {context.sleep != null && (
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-text-secondary">
              <span>💤</span>
              <span className="font-medium text-text-primary">{context.sleep.toFixed(1)}h</span>
              <span>sleep</span>
            </div>
          )}
          {context.heartRate != null && (
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-text-secondary">
              <span>❤️</span>
              <span className="font-medium text-text-primary">{context.heartRate}</span>
              <span>bpm resting</span>
            </div>
          )}
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-4xl">🤖</span>
            <p className="text-text-secondary text-sm max-w-xs">
              Ask your AI health coach anything about your health data, habits, or goals.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
              }`}
            >
              {msg.streaming && msg.text === '' ? (
                <TypingIndicator />
              ) : (
                <>
                  {msg.text}
                  {msg.streaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse align-middle" />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border bg-background/90 backdrop-blur-md safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your health coach…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent/60 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-medium transition-colors"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-text-secondary mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
