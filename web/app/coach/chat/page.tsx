'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Bot, User, RefreshCw } from 'lucide-react'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

function generateSessionId() {
  return crypto.randomUUID()
}

export default function CoachChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => generateSessionId())
  const bottomRef = useRef<HTMLDivElement>(null)

  const scroll = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scroll() }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-text-primary">Health Coach</h1>
        </div>
        <button onClick={() => window.location.reload()} className="text-text-secondary hover:text-text-primary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="font-semibold text-text-primary">Hi! I&apos;m your GetZen Health Coach</p>
            <p className="text-sm text-text-secondary mt-1">Ask me about your health data, workout tips, nutrition, or sleep optimization.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['How were my steps this week?', 'Tips to improve my sleep', 'Should I work out today?', 'What supplements help with recovery?'].map(q => (
                <button key={q} onClick={() => { setInput(q) }}
                  className="text-xs px-3 py-1.5 bg-surface border border-border rounded-full text-text-secondary hover:text-text-primary hover:border-primary transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-surface border border-border'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface border border-border text-text-primary rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask your health coach..."
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-text-secondary mt-1.5 text-center">Not medical advice. Consult a doctor for health concerns.</p>
      </div>
    </div>
  )
}
