'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, RotateCcw } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are a personal health coach with access to the user's Apple Health data synced through GetZen. You help users understand their health metrics, spot patterns, and make actionable improvements to their fitness, sleep, recovery, and nutrition.

Be specific, encouraging, and concise. When you don't have enough data context, ask clarifying questions. Focus on insights the user can act on today.`

const STARTER_QUESTIONS = [
  'Why is my HRV low this week?',
  'Am I overtraining?',
  'When should I do my next hard workout?',
  'How can I improve my sleep quality?',
  'What does my resting heart rate trend mean?',
  'How do my steps compare to my goal this week?',
]

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isLoading) return

      const userMessage: Message = { role: 'user', content: trimmed }
      const nextMessages = [...messages, userMessage]

      setMessages(nextMessages)
      setInput('')
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages,
            systemPrompt: SYSTEM_PROMPT,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
        }

        const data = await res.json() as { content: string }
        setMessages([...nextMessages, { role: 'assistant', content: data.content }])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        // Remove the optimistic user message on error
        setMessages(messages)
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary leading-tight">Health Coach</h1>
              <p className="text-[10px] text-text-tertiary leading-tight">Powered by Claude</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-secondary"
            >
              <RotateCcw className="w-3 h-3" />
              New chat
            </button>
          )}
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center pt-8 pb-4 gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/10 flex items-center justify-center border border-purple-500/20">
              <Sparkles className="w-7 h-7 text-purple-500" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-text-primary">Ask your health coach</h2>
              <p className="text-sm text-text-secondary mt-1 max-w-xs">
                Get personalized insights based on your Apple Health data.
              </p>
            </div>

            {/* Starter chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-secondary border border-border text-text-secondary hover:text-text-primary hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-sm'
                  : 'bg-surface-secondary text-text-primary border border-border rounded-tl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-surface-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-center">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-t border-border px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your health data..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0',
              input.trim() && !isLoading
                ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                : 'bg-surface-secondary text-text-tertiary border border-border cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
