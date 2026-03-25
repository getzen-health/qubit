'use client'

import { useState } from 'react'
import { Trophy, Users, Plus, X, Check, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Friend {
  id: string
  display_name: string
  steps_today: number | null
  recovery_score: number | null
  sleep_minutes: number | null
}

interface Challenge {
  current_value: number
  joined_at: string
  challenges: {
    id: string
    title: string
    metric: string
    target_value: number
    starts_at: string
    ends_at: string
  } | null
}

interface SocialClientProps {
  friends: Friend[]
  activeChallenges: Challenge[]
}

type Tab = 'friends' | 'challenges'

const METRIC_LABELS: Record<string, string> = {
  steps: 'Steps',
  calories: 'Calories',
  sleep_hours: 'Sleep Hours',
  hrv: 'HRV (ms)',
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
      {initials}
    </div>
  )
}

function ReadinessRing({ score }: { score: number | null }) {
  if (score === null) return <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-text-secondary text-xs">—</div>
  const pct = Math.min(100, Math.max(0, score))
  const colour = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
  const r = 16
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-border,#333)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none"
          stroke={colour} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: colour }}>
        {pct}
      </span>
    </div>
  )
}

function ProgressBar({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0
  const colour = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-accent' : 'bg-amber-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{value.toLocaleString()} / {target.toLocaleString()}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', colour)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function SocialClient({ friends, activeChallenges }: SocialClientProps) {
  const [tab, setTab] = useState<Tab>('friends')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    metric: 'steps' as 'steps' | 'calories' | 'sleep_hours' | 'hrv',
    target_value: '',
    starts_at: new Date().toISOString().slice(0, 10),
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  })
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviteStatus('loading')
    try {
      const res = await fetch('/api/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      if (res.ok) {
        setInviteStatus('sent')
        setInviteEmail('')
        setTimeout(() => { setShowInvite(false); setInviteStatus('idle') }, 1500)
      } else {
        const d = await res.json()
        setInviteError(d.error ?? 'Failed to send invite')
        setInviteStatus('error')
      }
    } catch {
      setInviteError('Network error')
      setInviteStatus('error')
    }
  }

  async function createChallenge() {
    if (!createForm.title || !createForm.target_value) return
    setCreateStatus('loading')
    try {
      const res = await fetch('/api/social/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          target_value: parseFloat(createForm.target_value),
        }),
      })
      if (res.ok) {
        setCreateStatus('done')
        setTimeout(() => { setShowCreate(false); setCreateStatus('idle'); window.location.reload() }, 1200)
      } else {
        setCreateStatus('error')
      }
    } catch {
      setCreateStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        {(['friends', 'challenges'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors capitalize',
              tab === t
                ? 'bg-accent text-white'
                : 'bg-surface text-text-secondary hover:text-text-primary'
            )}
          >
            {t === 'friends' ? <span className="flex items-center justify-center gap-1.5"><Users className="w-4 h-4" /> Friends</span> : <span className="flex items-center justify-center gap-1.5"><Trophy className="w-4 h-4" /> Challenges</span>}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'friends' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowInvite(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-accent/50 text-accent text-sm font-medium hover:bg-accent/5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Invite a friend
          </button>

          {friends.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-secondary text-sm">
              No friends yet. Invite someone to get started!
            </div>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3">
                <AvatarInitials name={f.display_name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{f.display_name}</p>
                  <p className="text-xs text-text-secondary">
                    {f.steps_today !== null ? `${f.steps_today.toLocaleString()} steps today` : 'No data today'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {f.sleep_minutes !== null && (
                    <span className="text-xs text-text-secondary hidden sm:block">
                      {Math.floor(f.sleep_minutes / 60)}h {f.sleep_minutes % 60}m
                    </span>
                  )}
                  <ReadinessRing score={f.recovery_score} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Challenges tab */}
      {tab === 'challenges' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-accent/50 text-accent text-sm font-medium hover:bg-accent/5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create challenge
          </button>

          {activeChallenges.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-secondary text-sm">
              No active challenges. Create one or ask a friend to invite you!
            </div>
          ) : (
            activeChallenges.map((p) => {
              const c = p.challenges
              if (!c) return null
              const daysLeft = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000))
              return (
                <div key={c.id} className="bg-surface rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{c.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {METRIC_LABELS[c.metric] ?? c.metric} · {daysLeft}d left
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  </div>
                  <ProgressBar value={p.current_value} target={Number(c.target_value)} />
                  <LeaderboardPreview challengeId={c.id} />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Invite Friend</h3>
              <button onClick={() => { setShowInvite(false); setInviteStatus('idle'); setInviteError('') }} className="p-1 rounded-lg hover:bg-surface-secondary">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            {inviteStatus === 'error' && <p className="text-xs text-red-500">{inviteError}</p>}
            {inviteStatus === 'sent' && <p className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Request sent!</p>}
            <button
              onClick={sendInvite}
              disabled={inviteStatus === 'loading' || inviteStatus === 'sent'}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {inviteStatus === 'loading' ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </div>
      )}

      {/* Create challenge modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Create Challenge</h3>
              <button onClick={() => { setShowCreate(false); setCreateStatus('idle') }} className="p-1 rounded-lg hover:bg-surface-secondary">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Challenge title"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <select
                value={createForm.metric}
                onChange={(e) => setCreateForm((f) => ({ ...f, metric: e.target.value as typeof createForm.metric }))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {Object.entries(METRIC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input
                type="number"
                placeholder="Target value"
                value={createForm.target_value}
                onChange={(e) => setCreateForm((f) => ({ ...f, target_value: e.target.value }))}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Starts</label>
                  <input
                    type="date"
                    value={createForm.starts_at}
                    onChange={(e) => setCreateForm((f) => ({ ...f, starts_at: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Ends</label>
                  <input
                    type="date"
                    value={createForm.ends_at}
                    onChange={(e) => setCreateForm((f) => ({ ...f, ends_at: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
            </div>
            {createStatus === 'error' && <p className="text-xs text-red-500">Failed to create challenge. Try again.</p>}
            {createStatus === 'done' && <p className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Challenge created!</p>}
            <button
              onClick={createChallenge}
              disabled={createStatus === 'loading' || createStatus === 'done'}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {createStatus === 'loading' ? 'Creating…' : 'Create Challenge'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini leaderboard (top 3) fetched client-side per challenge
function LeaderboardPreview({ challengeId }: { challengeId: string }) {
  const [entries, setEntries] = useState<{ rank: number; display_name: string; current_value: number; progress_pct: number }[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    if (loaded) return
    setLoaded(true)
    try {
      const res = await fetch(`/api/social/leaderboard?challenge_id=${challengeId}`)
      if (res.ok) {
        const d = await res.json()
        setEntries(d.leaderboard?.slice(0, 3) ?? [])
      }
    } catch {
      // silently fail
    }
  }

  if (!loaded) {
    return (
      <button onClick={load} className="text-xs text-accent hover:underline">
        Show leaderboard
      </button>
    )
  }

  if (!entries) return <p className="text-xs text-text-secondary">Loading…</p>

  if (entries.length === 0) return <p className="text-xs text-text-secondary">No participants yet.</p>

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-1.5 pt-1 border-t border-border">
      {entries.map((e) => (
        <div key={e.rank} className="flex items-center gap-2 text-xs">
          <span className="w-5 text-center">{medals[e.rank - 1] ?? e.rank}</span>
          <span className="flex-1 text-text-primary truncate">{e.display_name}</span>
          <span className="text-text-secondary">{e.current_value.toLocaleString()}</span>
          <span className="text-accent font-medium w-9 text-right">{e.progress_pct}%</span>
        </div>
      ))}
    </div>
  )
}
