'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts'
import {
  analyzeSentiment, getWritingPrompts, getMoodShift,
  SENTIMENT_COLORS, SENTIMENT_LABELS, JOURNAL_TYPE_LABELS, JOURNAL_TYPE_ICONS,
  type JournalEntry, type JournalType, type GratitudeItem, type CBTRecord,
  type SentimentLevel,
} from '@/lib/journaling'

// ─── Mood helpers ────────────────────────────────────────────────────────────
const MOOD_EMOJIS: Record<number, string> = {
  1: '😔', 2: '😞', 3: '😟', 4: '😐', 5: '🙂',
  6: '😊', 7: '😄', 8: '🥰', 9: '🌟', 10: '💫',
}

function MoodSlider({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-2xl">{MOOD_EMOJIS[value]}</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        aria-label={label}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-text-secondary">
        <span>😔 Low</span><span>💫 High</span>
      </div>
    </div>
  )
}

// ─── Sentiment indicator ──────────────────────────────────────────────────────
function SentimentBadge({ level, score }: { level?: SentimentLevel | null; score?: number | null }) {
  if (level == null || score == null) return null
  const color = SENTIMENT_COLORS[level]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '22', color }}
    >
      {SENTIMENT_LABELS[level]}
      <span className="opacity-70">({score > 0 ? '+' : ''}{score.toFixed(1)})</span>
    </span>
  )
}

// ─── Journal type selector ────────────────────────────────────────────────────
const TYPES: JournalType[] = ['free', 'gratitude', 'cbt', 'morning_pages']

function TypeSelector({
  value, onChange,
}: { value: JournalType; onChange: (t: JournalType) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {TYPES.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all text-sm font-medium ${
            value === t
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-surface border-border text-text-primary hover:border-primary/50'
          }`}
        >
          <span className="text-xl">{JOURNAL_TYPE_ICONS[t]}</span>
          <span className="text-xs leading-tight text-center">{JOURNAL_TYPE_LABELS[t]}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Free / Morning Pages textarea ───────────────────────────────────────────
function FreeWriteForm({
  content, wordCount, type, onContentChange,
}: {
  content: string
  wordCount: number
  type: 'free' | 'morning_pages'
  onContentChange: (v: string) => void
}) {
  const [promptIdx] = useState(() => Math.floor(Math.random() * 10))
  const prompts = getWritingPrompts(type)
  const prompt = prompts[promptIdx % prompts.length]
  const target = type === 'morning_pages' ? 300 : null
  const progress = target ? Math.min(100, (wordCount / target) * 100) : null

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary italic border-l-2 border-primary/40 pl-2">{prompt}</p>
      <textarea
        className="w-full rounded-2xl border border-border bg-surface p-3 text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[160px]"
        rows={7}
        value={content}
        onChange={e => onContentChange(e.target.value)}
        placeholder={type === 'morning_pages' ? 'Start writing — aim for 300 words...' : 'Write freely here...'}
      />
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{wordCount} words{target ? ` / ${target} target` : ''}</span>
        {target && (
          <div className="flex items-center gap-2 flex-1 ml-4">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{Math.round(progress!)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Three Good Things (Seligman 2005) ───────────────────────────────────────
function GratitudeForm({
  items, onChange,
}: { items: GratitudeItem[]; onChange: (items: GratitudeItem[]) => void }) {
  const update = (idx: number, field: keyof GratitudeItem, val: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary">
        Based on Seligman et al. (2005) — log three good things each day and why they happened.
      </p>
      {items.map((item, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-3 space-y-2">
          <p className="text-xs font-semibold text-primary">Good Thing {i + 1}</p>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">What happened?</label>
            <textarea
              className="w-full rounded-xl border border-border bg-background p-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              rows={2}
              value={item.event}
              onChange={e => update(i, 'event', e.target.value)}
              placeholder="Something good that happened today..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Why did it happen?</label>
            <textarea
              className="w-full rounded-xl border border-border bg-background p-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              rows={2}
              value={item.why}
              onChange={e => update(i, 'why', e.target.value)}
              placeholder="What caused it? Your effort, values, strengths..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">How did it make you feel?</label>
            <input
              type="text"
              aria-label="How did it make you feel?"
              className="w-full rounded-xl border border-border bg-background p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={item.feeling}
              onChange={e => update(i, 'feeling', e.target.value)}
              placeholder="e.g. grateful, proud, relieved..."
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── CBT Thought Record (Beck 1979) — 7-step wizard ─────────────────────────
const CBT_STEPS = [
  { key: 'situation', label: 'Situation', hint: 'What happened? Where, when, who was involved?', multiline: true },
  { key: 'automatic_thought', label: 'Automatic Thought', hint: 'What went through your mind? What did it mean to you?', multiline: true },
  { key: 'emotion', label: 'Emotion', hint: 'What emotion did you feel? (name it)', multiline: false },
  { key: 'evidence_for', label: 'Evidence For', hint: 'What facts support the automatic thought?', multiline: true },
  { key: 'evidence_against', label: 'Evidence Against', hint: 'What facts contradict or challenge the thought?', multiline: true },
  { key: 'balanced_thought', label: 'Balanced Thought', hint: 'A more realistic, balanced perspective', multiline: true },
  { key: 'outcome', label: 'Outcome', hint: 'How do you feel now after working through this?', multiline: false },
] as const

type CBTStepKey = (typeof CBT_STEPS)[number]['key']

function CBTForm({
  record, onChange,
}: { record: Partial<CBTRecord> & { outcome?: string }; onChange: (r: typeof record) => void }) {
  const [step, setStep] = useState(0)
  const current = CBT_STEPS[step]

  const updateField = (key: string, val: string | number) => onChange({ ...record, [key]: val })

  const renderIntensity = (key: 'belief_before' | 'belief_after' | 'emotion_intensity_before' | 'emotion_intensity_after', label: string) => (
    <div className="space-y-1 mt-2">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className="font-bold text-primary">{(record[key] as number) ?? 50}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={(record[key] as number) ?? 50}
        aria-label={label}
        onChange={e => updateField(key, Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary">
        CBT Thought Record — Beck (1979). Work through challenging thoughts step by step.
      </p>
      {/* Progress bar */}
      <div className="flex gap-1">
        {CBT_STEPS.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <p className="text-xs text-text-secondary text-center">Step {step + 1} of {CBT_STEPS.length}</p>

      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <p className="font-semibold text-text-primary">{current.label}</p>
        <p className="text-xs text-text-secondary">{current.hint}</p>

        {current.multiline ? (
          <textarea
            className="w-full rounded-xl border border-border bg-background p-2 text-sm text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            rows={4}
            aria-label={current.label}
            value={(record[current.key as keyof typeof record] as string) ?? ''}
            onChange={e => updateField(current.key, e.target.value)}
          />
        ) : (
          <input
            type="text"
            aria-label={current.label}
            className="w-full rounded-xl border border-border bg-background p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            value={(record[current.key as keyof typeof record] as string) ?? ''}
            onChange={e => updateField(current.key, e.target.value)}
          />
        )}

        {step === 1 && renderIntensity('belief_before', 'How strongly do you believe this thought? (0–100%)')}
        {step === 2 && renderIntensity('emotion_intensity_before', 'How intense is this emotion? (0–100%)')}
        {step === 5 && renderIntensity('belief_after', 'How strongly do you believe the balanced thought? (0–100%)')}
        {step === 6 && renderIntensity('emotion_intensity_after', 'New emotion intensity (0–100%)')}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep(s => s - 1)}
            className="flex-1 py-2 rounded-2xl border border-border text-text-primary text-sm">
            ← Back
          </button>
        )}
        {step < CBT_STEPS.length - 1 && (
          <button type="button" onClick={() => setStep(s => s + 1)}
            className="flex-1 py-2 rounded-2xl bg-primary text-white text-sm">
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tags input ───────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  const commit = () => {
    const next = input.split(',').map(t => t.trim()).filter(Boolean)
    const merged = [...new Set([...tags, ...next])]
    onChange(merged)
    setInput('')
  }
  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">Tags</label>
      <div className="flex flex-wrap gap-1 mb-1">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          aria-label="Tags"
          className="flex-1 rounded-xl border border-border bg-surface p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          placeholder="Add tags (comma separated)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        />
        <button type="button" onClick={commit}
          className="px-3 rounded-xl bg-primary/10 text-primary text-sm">
          Add
        </button>
      </div>
    </div>
  )
}

// ─── Write tab ────────────────────────────────────────────────────────────────
function WriteTab() {
  const [type, setType] = useState<JournalType>('free')
  const [content, setContent] = useState('')
  const [moodBefore, setMoodBefore] = useState(5)
  const [moodAfter, setMoodAfter] = useState(5)
  const [tags, setTags] = useState<string[]>([])
  const [gratitudeItems, setGratitudeItems] = useState<GratitudeItem[]>([
    { event: '', why: '', feeling: '' },
    { event: '', why: '', feeling: '' },
    { event: '', why: '', feeling: '' },
  ])
  const [cbtRecord, setCbtRecord] = useState<Partial<CBTRecord> & { outcome?: string }>({})
  const [sentiment, setSentiment] = useState<{ score: number; level: SentimentLevel } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wordCount = content.split(/\s+/).filter(Boolean).length

  // Real-time sentiment analysis
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const texts = [
        content,
        ...gratitudeItems.map(g => `${g.event} ${g.why} ${g.feeling}`),
        (cbtRecord as unknown as Record<string, string>).situation || '',
        (cbtRecord as unknown as Record<string, string>).balanced_thought || '',
      ].join(' ').trim()
      if (texts.length > 3) {
        const result = analyzeSentiment(texts)
        setSentiment(result)
      } else {
        setSentiment(null)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [content, gratitudeItems, cbtRecord])

  const handleTypeChange = (t: JournalType) => {
    setType(t)
    setContent('')
    setSentiment(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content: type === 'free' || type === 'morning_pages' ? content : undefined,
          mood_before: moodBefore,
          mood_after: moodAfter,
          tags,
          gratitude_items: type === 'gratitude' ? gratitudeItems : [],
          cbt_record: type === 'cbt' ? cbtRecord : undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Sentiment bar color
  const sentimentColor = sentiment ? SENTIMENT_COLORS[sentiment.level] : '#94a3b8'

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Privacy note */}
      <p className="text-xs text-text-secondary flex items-center gap-1">
        🔒 Your journal entries are private and only visible to you.
      </p>

      <TypeSelector value={type} onChange={handleTypeChange} />

      <MoodSlider label="How are you feeling before writing?" value={moodBefore} onChange={setMoodBefore} />

      {/* Dynamic form */}
      {(type === 'free' || type === 'morning_pages') && (
        <FreeWriteForm
          content={content}
          wordCount={wordCount}
          type={type}
          onContentChange={setContent}
        />
      )}
      {type === 'gratitude' && (
        <GratitudeForm items={gratitudeItems} onChange={setGratitudeItems} />
      )}
      {type === 'cbt' && (
        <CBTForm record={cbtRecord} onChange={setCbtRecord} />
      )}

      {/* Real-time sentiment indicator */}
      {sentiment && (
        <div className="flex items-center gap-2 p-2 rounded-xl border"
          style={{ borderColor: sentimentColor + '44', backgroundColor: sentimentColor + '11' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sentimentColor }} />
          <span className="text-xs text-text-secondary">Sentiment:</span>
          <SentimentBadge level={sentiment.level} score={sentiment.score} />
        </div>
      )}

      <MoodSlider label="How are you feeling after writing?" value={moodAfter} onChange={setMoodAfter} />

      <TagsInput tags={tags} onChange={setTags} />

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Entry'}
      </button>
    </form>
  )
}

// ─── Insights tab ─────────────────────────────────────────────────────────────
type InsightsData = {
  entries: JournalEntry[]
  streak: number
  avgMoodShift: number | null
  sentimentTrend: { date: string; score: number; level: string }[]
  typeBreakdown: Record<string, number>
  bestDay: string | null
  avgWordCount: number
  moodScatter: { before: number; after: number; date: string }[]
}

const PIE_COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6']
const TYPE_DISPLAY: Record<string, string> = {
  free: 'Free Write', gratitude: 'Gratitude', cbt: 'CBT', morning_pages: 'Morning',
}

function InsightsTab({ data }: { data: InsightsData | null }) {
  if (!data) return <div className="text-center py-12 text-text-secondary text-sm">Loading insights…</div>

  const { streak, avgMoodShift, sentimentTrend, typeBreakdown, bestDay, avgWordCount, moodScatter } = data

  const pieData = Object.entries(typeBreakdown).map(([name, value]) => ({
    name: TYPE_DISPLAY[name] || name, value,
  }))

  const chartData = [...sentimentTrend].reverse().map(d => ({
    date: d.date.slice(5),
    score: Number(d.score),
  }))

  return (
    <div className="space-y-5">
      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{streak}</p>
          <p className="text-xs text-text-secondary mt-0.5">🔥 Day streak</p>
        </div>
        {avgMoodShift != null && (
          <div className="bg-surface border border-border rounded-2xl p-3 text-center">
            <p className={`text-2xl font-bold ${avgMoodShift >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {avgMoodShift >= 0 ? '+' : ''}{avgMoodShift.toFixed(1)}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg mood shift</p>
          </div>
        )}
        {avgWordCount > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{avgWordCount}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg words/entry</p>
          </div>
        )}
      </div>

      {avgMoodShift != null && (
        <div className="bg-surface border border-border rounded-2xl p-3">
          <p className="text-sm text-text-secondary">
            ✍️ Writing shifts your mood{' '}
            <span className={`font-bold ${avgMoodShift >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {avgMoodShift >= 0 ? '+' : ''}{avgMoodShift.toFixed(1)} points
            </span>{' '}on average.
          </p>
        </div>
      )}

      {/* Sentiment trend */}
      {chartData.length > 1 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">30-Day Sentiment Trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.4} />
              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[-5, 5]} hide />
              <Tooltip
                formatter={(v: number) => [v.toFixed(2), 'Sentiment']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Line
                type="monotone" dataKey="score" stroke="#8b5cf6"
                strokeWidth={2} dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span style={{ color: SENTIMENT_COLORS.very_negative }}>Very Negative (-5)</span>
            <span style={{ color: SENTIMENT_COLORS.very_positive }}>Very Positive (+5)</span>
          </div>
        </div>
      )}

      {/* Mood before vs after scatter */}
      {moodScatter.length > 1 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Mood Before vs. After Writing</p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.4} />
              <XAxis dataKey="before" type="number" domain={[1, 10]} name="Before" fontSize={10} label={{ value: 'Before', position: 'insideBottom', offset: -2, fontSize: 10 }} />
              <YAxis dataKey="after" type="number" domain={[1, 10]} name="After" fontSize={10} label={{ value: 'After', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Scatter data={moodScatter} fill="#8b5cf6" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary text-center mt-1">
            Points above the diagonal = mood improved after writing
          </p>
        </div>
      )}

      {/* Type breakdown donut */}
      {pieData.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Journal Type Breakdown</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-text-secondary">{d.name}</span>
                  <span className="font-semibold text-text-primary">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patterns */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-text-primary">Your Patterns</p>
        {bestDay && (
          <p className="text-xs text-text-secondary">📅 You journal most often on <span className="font-medium text-text-primary">{bestDay}s</span></p>
        )}
        {avgWordCount > 0 && (
          <p className="text-xs text-text-secondary">📝 Average entry length: <span className="font-medium text-text-primary">{avgWordCount} words</span></p>
        )}
        {avgMoodShift != null && avgMoodShift > 0 && (
          <p className="text-xs text-text-secondary">
            💡 Journaling consistently improves your mood — research (Pennebaker & Beall 1986) shows 15–30 min of expressive writing reduces stress by up to 43%.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────
function HistoryTab({ entries }: { entries: JournalEntry[] }) {
  const [filter, setFilter] = useState<JournalType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = entries.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      const text = [
        e.content,
        ...(e.gratitude_items || []).map(g => `${g.event} ${g.why} ${g.feeling}`),
        e.cbt_record?.situation,
      ].join(' ').toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search & filter */}
      <input
        type="text"
        aria-label="Search journal entries"
        placeholder="Search entries…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <div className="flex gap-2 flex-wrap">
        {(['all', ...TYPES] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === t
                ? 'bg-primary text-white border-primary'
                : 'bg-surface border-border text-text-secondary'
            }`}
          >
            {t === 'all' ? 'All' : JOURNAL_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-text-secondary text-sm py-8">No entries found.</p>
      )}

      {filtered.map(entry => {
        const id = entry.id || entry.entry_date || ''
        const isOpen = expanded === id
        const shift = getMoodShift(entry)
        const date = (entry.entry_date || entry.date || '').toString()

        return (
          <div key={id} className="bg-surface border border-border rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              onClick={() => setExpanded(isOpen ? null : id)}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">{date.slice(0, 10)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {JOURNAL_TYPE_ICONS[entry.type as JournalType]} {JOURNAL_TYPE_LABELS[entry.type as JournalType]}
                  </span>
                  {entry.sentiment_level && (
                    <SentimentBadge level={entry.sentiment_level as SentimentLevel} score={entry.sentiment_score} />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  {entry.word_count ? <span>{entry.word_count} words</span> : null}
                  {shift !== 0 && (
                    <span className={shift > 0 ? 'text-green-500' : 'text-red-500'}>
                      Mood {shift > 0 ? '+' : ''}{shift}
                    </span>
                  )}
                  {entry.tags && (entry.tags as string[]).length > 0 && (
                    <span>{(entry.tags as string[]).join(', ')}</span>
                  )}
                </div>
              </div>
              <span className="text-text-secondary text-sm ml-2">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-border space-y-3">
                {entry.content && (
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{entry.content}</p>
                )}
                {entry.gratitude_items && (entry.gratitude_items as GratitudeItem[]).length > 0 && (
                  <div className="space-y-2">
                    {(entry.gratitude_items as GratitudeItem[]).map((g, i) => g.event ? (
                      <div key={i} className="text-xs text-text-secondary space-y-0.5">
                        <p><span className="text-primary font-medium">Good Thing {i + 1}:</span> {g.event}</p>
                        {g.why && <p><span className="text-text-primary">Why:</span> {g.why}</p>}
                        {g.feeling && <p><span className="text-text-primary">Felt:</span> {g.feeling}</p>}
                      </div>
                    ) : null)}
                  </div>
                )}
                {entry.cbt_record && (
                  <div className="text-xs text-text-secondary space-y-1">
                    {Object.entries(entry.cbt_record as unknown as Record<string, string | number>).map(([k, v]) => v ? (
                      <p key={k}><span className="text-text-primary capitalize">{k.replace(/_/g, ' ')}:</span> {v}</p>
                    ) : null)}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main exported component ─────────────────────────────────────────────────
export function JournalClient() {
  const [tab, setTab] = useState<'write' | 'insights' | 'history'>('write')
  const [data, setData] = useState<InsightsData | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/journal')
    if (res.ok) setData(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-xl mx-auto p-4 pb-24 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Journal</h1>
        <p className="text-xs text-text-secondary">
          Expressive writing · Gratitude · CBT · Morning Pages
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface border border-border rounded-2xl p-1 gap-1">
        {(['write', 'insights', 'history'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'
            }`}
          >
            {t === 'write' ? '✍️ Write' : t === 'insights' ? '📊 Insights' : '📖 History'}
          </button>
        ))}
      </div>

      {tab === 'write' && <WriteTab />}
      {tab === 'insights' && <InsightsTab data={data} />}
      {tab === 'history' && <HistoryTab entries={data?.entries || []} />}
    </div>
  )
}
