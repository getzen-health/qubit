'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, User, Send, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react'
import type { HealthContext } from '@/lib/health-context'

type Mode = 'chat' | 'morning_checkin' | 'weekly_review' | 'goal_coach'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts?: number
}

const HISTORY_KEY = 'getzen_coach_history'
const MORNING_DATE_KEY = 'getzen_morning_checkin_date'
const MAX_HISTORY = 20

function loadHistory(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as Message[]) : []
  } catch {
    return []
  }
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)))
  } catch { /* quota exceeded — silently skip */ }
}

const MODES: { id: Mode; emoji: string; label: string }[] = [
  { id: 'chat', emoji: '💬', label: 'Chat' },
  { id: 'morning_checkin', emoji: '🌅', label: 'Morning' },
  { id: 'weekly_review', emoji: '📊', label: 'Weekly' },
  { id: 'goal_coach', emoji: '🎯', label: 'Goals' },
]

function getContextItems(ctx: HealthContext): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = []
  if (ctx.avg_steps !== undefined) items.push({ label: 'Avg Steps', value: `${ctx.avg_steps.toLocaleString()}/day` })
  if (ctx.avg_sleep_hours !== undefined) items.push({ label: 'Sleep', value: `${ctx.avg_sleep_hours}h avg` })
  if (ctx.avg_hrv !== undefined) items.push({ label: 'HRV', value: `${ctx.avg_hrv}ms` })
  if (ctx.avg_resting_hr !== undefined) items.push({ label: 'Resting HR', value: `${ctx.avg_resting_hr}bpm` })
  if (ctx.recovery_score !== undefined) items.push({ label: 'Recovery', value: `${ctx.recovery_score}/100` })
  if (ctx.avg_water_ml !== undefined) items.push({ label: 'Water', value: `${(ctx.avg_water_ml / 1000).toFixed(1)}L/day` })
  if (ctx.avg_mood !== undefined) items.push({ label: 'Mood', value: `${ctx.avg_mood}/5` })
  if (ctx.avg_stress !== undefined) items.push({ label: 'Stress', value: `${ctx.avg_stress}/5` })
  if (ctx.biological_age !== undefined) items.push({ label: 'Bio Age', value: `${ctx.biological_age} yrs` })
  if (ctx.active_goals && ctx.active_goals.length > 0) items.push({ label: 'Goals', value: `${ctx.active_goals.length} active` })
  if (ctx.current_supplements && ctx.current_supplements.length > 0) items.push({ label: 'Supplements', value: `${ctx.current_supplements.length} tracked` })
  if (ctx.chronotype) items.push({ label: 'Chronotype', value: ctx.chronotype.charAt(0).toUpperCase() + ctx.chronotype.slice(1) })
  if (ctx.avg_quark_score !== undefined) items.push({ label: 'QuarkScore', value: `${ctx.avg_quark_score}/100` })
  if (ctx.current_fasting_protocol) items.push({ label: 'Fasting', value: ctx.current_fasting_protocol })
  return items
}

function getQuickPrompts(ctx: HealthContext): string[] {
  const prompts: string[] = []
  if (ctx.avg_hrv !== undefined) prompts.push('Why was my HRV low this week?')
  if (ctx.avg_sleep_hours !== undefined && ctx.avg_sleep_hours < 7) prompts.push('How can I improve my sleep quality?')
  if (ctx.active_goals && ctx.active_goals.length > 0) prompts.push(`How do I make progress on my ${ctx.active_goals[0].title} goal?`)
  if (ctx.current_supplements && ctx.current_supplements.length > 0) prompts.push('Are my supplements optimally timed?')
  if (ctx.avg_steps !== undefined && ctx.avg_steps < 8000) prompts.push('Tips to hit 10,000 steps daily')
  prompts.push('What should I eat to boost recovery?')
  prompts.push('Should I work out today?')
  return prompts.slice(0, 5)
}

export function AICoachHub({ initialContext }: { initialContext: HealthContext }) {
  const [mode, setMode] = useState<Mode>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const [morningInsight, setMorningInsight] = useState<string | null>(null)
  const [morningLoading, setMorningLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages(loadHistory())
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const callAPI = useCallback(async (opts: {
    message?: string
    mode: Mode
    history?: Message[]
  }) => {
    const { message, mode: reqMode, history = [] } = opts
    const res = await fetch('/api/coach/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        mode: reqMode,
        messages: history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Request failed')
    return data.message as string
  }, [])

  const loadMorningCheckin = useCallback(async () => {
    setMorningLoading(true)
    try {
      const text = await callAPI({ mode: 'morning_checkin' })
      setMorningInsight(text)
      localStorage.setItem(MORNING_DATE_KEY, new Date().toISOString().split('T')[0])
    } catch {
      setMorningInsight('Unable to load check-in. Please try again.')
    } finally {
      setMorningLoading(false)
    }
  }, [callAPI])

  const loadWeeklyReview = useCallback(async () => {
    setLoading(true)
    setMessages([])
    try {
      const text = await callAPI({ mode: 'weekly_review' })
      const msg: Message = { role: 'assistant', content: text, ts: Date.now() }
      setMessages([msg])
    } catch {
      const errMsg: Message = { role: 'assistant', content: 'Failed to generate review. Please try again.', ts: Date.now() }
      setMessages([errMsg])
    } finally {
      setLoading(false)
    }
  }, [callAPI])

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text ?? input).trim()
    if (!msgText || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msgText, ts: Date.now() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    saveHistory(nextMessages)
    setLoading(true)

    try {
      const reply = await callAPI({ message: msgText, mode, history: messages })
      const assistantMsg: Message = { role: 'assistant', content: reply, ts: Date.now() }
      const final = [...nextMessages, assistantMsg]
      setMessages(final)
      saveHistory(final)
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        ts: Date.now(),
      }
      const final = [...nextMessages, errMsg]
      setMessages(final)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, mode, callAPI])

  // Switch mode and auto-trigger auto modes
  const switchMode = useCallback((next: Mode) => {
    setMode(next)
    if (next === 'morning_checkin') {
      const today = new Date().toISOString().split('T')[0]
      const last = typeof window !== 'undefined' ? localStorage.getItem(MORNING_DATE_KEY) : null
      if (!morningInsight && last !== today) loadMorningCheckin()
    }
    if (next === 'weekly_review') {
      loadWeeklyReview()
    }
  }, [morningInsight, loadMorningCheckin, loadWeeklyReview])

  const contextItems = getContextItems(initialContext)
  const quickPrompts = getQuickPrompts(initialContext)
  const isChatMode = mode === 'chat' || mode === 'goal_coach'

  return (
    <div className="container mx-auto py-6 max-w-4xl px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Health Coach</h1>
          <p className="text-sm text-text-secondary">Personalized guidance from your real health data</p>
        </div>
        <button
          onClick={() => setContextOpen(o => !o)}
          aria-expanded={contextOpen}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          📊 {contextOpen ? 'Hide data' : 'View data'}
          {contextOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible context panel */}
      {contextOpen && (
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Health data your coach can see
          </p>
          {contextItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {contextItems.map(item => (
                <div key={item.label} className="bg-muted/40 rounded-xl p-2.5">
                  <p className="text-[10px] text-text-secondary">{item.label}</p>
                  <p className="text-sm font-semibold text-text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">
              No health data synced yet. Connect Apple Health to unlock personalized AI coaching.
            </p>
          )}
          {initialContext.current_supplements && initialContext.current_supplements.length > 0 && (
            <p className="text-xs text-text-secondary mt-3">
              <span className="font-medium">Supplements:</span> {initialContext.current_supplements.join(', ')}
            </p>
          )}
          {initialContext.active_goals && initialContext.active_goals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {initialContext.active_goals.map(g => (
                <span key={g.title} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {g.title}: {g.progress}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4 bg-muted/30 rounded-xl p-1">
        {MODES.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchMode(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === tab.id
                ? 'bg-surface shadow-sm text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Morning Check-In mode ── */}
      {mode === 'morning_checkin' && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌅</span>
              <p className="font-semibold text-text-primary">Morning Check-In</p>
            </div>
            <button
              onClick={loadMorningCheckin}
              disabled={morningLoading}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${morningLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {morningLoading && (
            <div className="flex gap-1 py-3">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {!morningInsight && !morningLoading && (
            <button
              onClick={loadMorningCheckin}
              className="text-sm text-primary hover:underline"
            >
              Load today&apos;s personalized check-in →
            </button>
          )}

          {morningInsight && !morningLoading && (
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{morningInsight}</p>
          )}
        </div>
      )}

      {/* ── Weekly Review mode ── */}
      {mode === 'weekly_review' && messages.length === 0 && !loading && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-3xl mb-3">📊</p>
          <p className="font-semibold text-text-primary mb-1">7-Day Health Review</p>
          <p className="text-sm text-text-secondary mb-4">AI-generated analysis of your week</p>
          <button
            onClick={loadWeeklyReview}
            className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Generate Weekly Review
          </button>
        </div>
      )}

      {/* ── Chat interface (Chat, Goal Coach, and Weekly Review with generated content) ── */}
      {(isChatMode || (mode === 'weekly_review' && (messages.length > 0 || loading))) && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {/* Messages area */}
          <div className="max-h-[460px] min-h-[200px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center py-10">
                <Bot className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="font-semibold text-text-primary">
                  {mode === 'goal_coach' ? 'Goal Coach' : "Hi! I'm your GetZen Health Coach"}
                </p>
                <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
                  {mode === 'goal_coach'
                    ? "I'll help you make progress on your active health goals."
                    : 'Ask me anything about your health data, training, sleep, or nutrition.'}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary' : 'bg-muted border border-border'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-muted/40 border border-border text-text-primary rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted/40 border border-border rounded-2xl rounded-tl-sm px-3.5 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={mode === 'goal_coach' ? 'Ask about your goals...' : 'Ask your health coach...'}
                className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary placeholder:text-text-secondary"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); saveHistory([]) }}
                className="mt-1.5 text-[10px] text-text-secondary hover:text-text-primary transition-colors"
              >
                Clear conversation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick prompts (shown when chat is empty) */}
      {isChatMode && messages.length === 0 && quickPrompts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 bg-surface border border-border rounded-full text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-secondary mt-3 text-center">
        Not medical advice. Consult a doctor for health concerns.
      </p>
    </div>
  )
}
