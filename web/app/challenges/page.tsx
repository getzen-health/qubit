"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

const ICONS: Record<string, string> = {
  steps: '🚶‍♂️',
  active_minutes: '🏃‍♀️',
  workouts: '🏋️',
  water: '💧',
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLeaderboard, setShowLeaderboard] = useState<string|null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', description: '', type: 'steps', target_value: 10000, duration_days: 7, is_public: true })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    fetchChallenges()
  }, [])

  async function fetchChallenges() {
    setLoading(true)
    const res = await fetch('/api/challenges')
    const data = await res.json()
    setChallenges(data.challenges || [])
    setLoading(false)
  }

  async function joinChallenge(id: string) {
    await fetch(`/api/challenges/${id}/join`, { method: 'POST' })
    fetchChallenges()
  }

  async function openLeaderboard(id: string) {
    setShowLeaderboard(id)
    const res = await fetch(`/api/challenges/${id}/leaderboard`)
    const data = await res.json()
    setLeaderboard(data.leaderboard || [])
  }

  async function createChallenge(e: any) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setCreateError(err.error || 'Failed to create challenge. Please try again.')
        return
      }
      setForm({ title: '', description: '', type: 'steps', target_value: 10000, duration_days: 7, is_public: true })
      fetchChallenges()
    } catch {
      setCreateError('Network error. Please check your connection.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <main role="main" aria-label="Community Challenges" id="main-content">
      <div className="container mx-auto py-8">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border -mx-4 px-4 py-3 mb-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Challenges</h1>
        </div>
        <Breadcrumbs items={[{label:'Dashboard',href:'/dashboard'},{label:'Challenges'}]} />
        <h1 className="text-2xl font-bold mb-2">Community Challenges <span className="ml-2">🏆</span></h1>
        <p className="text-muted-foreground mb-8">Compete with the community and stay motivated.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {loading
            ? <div className="col-span-full flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" /></div>
            : challenges.length === 0
              ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No challenges yet</h3>
                  <p className="text-sm text-text-secondary mb-4">Create your first challenge to start building healthy habits with friends.</p>
                </div>
              )
              : challenges.map((c, i) => (
            <div key={c.id} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ICONS[c.type] || '🏆'}</span>
                <p className="font-semibold text-text-primary">{c.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>👥 {c.participant_count} joined</span>
                <span>🎯 {c.target_value} {c.type.replace('_',' ')}</span>
                <span>⏱ {c.duration_days}d</span>
              </div>
              {c.joined && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.round(100 * c.current_value / c.target_value))}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-primary">Progress: {c.current_value} / {c.target_value}</span>
                    <button className="text-primary underline" onClick={() => openLeaderboard(c.id)}>Leaderboard</button>
                  </div>
                </div>
              )}
              {!c.joined && (
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity" onClick={() => joinChallenge(c.id)}>
                  Join Challenge
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border">
              <h2 className="text-xl font-bold mb-2">Leaderboard</h2>
              <ol className="mb-4">
                {leaderboard.slice(0,10).map((p, i) => (
                  <li key={i} className="flex justify-between py-1">
                    <span>{p.rank}. {p.name}</span>
                    <span className="font-mono">{p.current_value}</span>
                  </li>
                ))}
              </ol>
              <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium" onClick={() => setShowLeaderboard(null)}>Close</button>
            </div>
          </div>
        )}
        {/* Create Challenge Form */}
        <div className="mt-12 max-w-lg mx-auto bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Create Challenge</h2>
          <form className="space-y-3" onSubmit={createChallenge}>
            <input required className="w-full border border-border rounded-lg px-3 py-2" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
            <textarea className="w-full border border-border rounded-lg px-3 py-2" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            <div className="flex gap-2">
              <select className="border border-border rounded-lg px-2 py-1" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="steps">Steps</option>
                <option value="active_minutes">Active Minutes</option>
                <option value="workouts">Workouts</option>
                <option value="water">Water</option>
              </select>
              <input type="number" min={1} className="border border-border rounded-lg px-2 py-1 w-32" placeholder="Target" value={form.target_value} onChange={e=>setForm(f=>({...f,target_value:Number(e.target.value)}))} />
              <input type="number" min={1} className="border border-border rounded-lg px-2 py-1 w-20" placeholder="Days" value={form.duration_days} onChange={e=>setForm(f=>({...f,duration_days:Number(e.target.value)}))} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_public} onChange={e=>setForm(f=>({...f,is_public:e.target.checked}))} /> Public</label>
            {createError && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{createError}</p>
            )}
            <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium" disabled={creating}>{creating ? 'Creating...' : 'Create Challenge'}</button>
          </form>
        </div>
      </div>
    </main>
  )
}

