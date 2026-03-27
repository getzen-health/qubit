'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/AvatarUpload'

interface AccountFormProps {
  email: string
  displayName: string
  avatarUrl: string | null
  userId: string
  biologicalSex: string
  age: string
  fitnessGoal: string
  heightCm: string
  weightKg: string
}

const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_sleep', label: 'Improve Sleep' },
  { value: 'reduce_stress', label: 'Reduce Stress' },
  { value: 'eat_healthier', label: 'Eat Healthier' },
  { value: 'improve_fitness', label: 'Improve Fitness' },
  { value: 'manage_condition', label: 'Manage Condition' },
  { value: 'general_wellness', label: 'General Wellness' },
]

export function AccountForm({ email, displayName, avatarUrl, userId, biologicalSex, age, fitnessGoal, heightCm, weightKg }: AccountFormProps) {
  const [name, setName] = useState(displayName)
  const [avatar, setAvatar] = useState(avatarUrl)
  const [sex, setSex] = useState(biologicalSex)
  const [ageVal, setAgeVal] = useState(age)
  const [goal, setGoal] = useState(fitnessGoal)
  const [height, setHeight] = useState(heightCm)
  const [weight, setWeight] = useState(weightKg)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    setStatus('saving')
    const { error } = await supabase
      .from('users')
      .update({
        display_name: name.trim() || null,
        biological_sex: sex || null,
        age: ageVal ? parseInt(ageVal) : null,
        fitness_goal: goal || null,
        height_cm: height ? parseFloat(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setStatus(error ? 'error' : 'saved')
    if (!error) {
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteStatus('deleting')
    setDeleteError(null)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setDeleteStatus('error')
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Account</h1>
          {status === 'saving' && (
            <span className="ml-auto text-sm text-text-secondary">Saving...</span>
          )}
          {status === 'saved' && (
            <span className="ml-auto text-sm text-accent">Saved</span>
          )}
          {status === 'error' && (
            <span className="ml-auto text-sm text-red-400">Failed to save</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Profile Photo</label>
          <AvatarUpload
            userId={userId}
            avatarUrl={avatar}
            onUpdate={(url) => setAvatar(url)}
          />
        </section>

        {/* Email (read-only) */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Email</label>
          <div className="px-4 py-3 bg-surface rounded-lg border border-border text-text-secondary">
            {email}
          </div>
          <p className="text-xs text-text-secondary">Email cannot be changed here.</p>
        </section>

        {/* Display Name */}
        <section className="space-y-2">
          <label htmlFor="display-name" className="text-sm font-medium text-text-primary">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-xs text-text-secondary">
            Shown as a greeting on your dashboard.
          </p>
        </section>

        {/* Biological Sex */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Biological Sex</label>
          <p className="text-xs text-text-secondary">Used for health calculations (VO2max norms, alcohol metabolism, HR zones).</p>
          <div className="grid grid-cols-3 gap-2">
            {[['male','Male'],['female','Female'],['other','Other']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setSex(v)}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${sex === v ? 'bg-accent/20 border-accent text-accent' : 'border-border text-text-secondary hover:bg-surface-secondary'}`}>
                {l}
              </button>
            ))}
          </div>
        </section>

        {/* Age, Height, Weight */}
        <section className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Age</label>
            <input type="number" min="13" max="120" value={ageVal}
              onChange={(e) => setAgeVal(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2.5 bg-surface rounded-lg border border-border text-text-primary focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Height (cm)</label>
            <input type="number" min="100" max="250" value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2.5 bg-surface rounded-lg border border-border text-text-primary focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Weight (kg)</label>
            <input type="number" min="20" max="500" value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2.5 bg-surface rounded-lg border border-border text-text-primary focus:outline-none focus:border-accent transition-colors" />
          </div>
        </section>

        {/* Fitness Goal */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Fitness Goal</label>
          <div className="grid grid-cols-2 gap-2">
            {FITNESS_GOALS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setGoal(value)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-colors ${goal === value ? 'bg-accent/20 border-accent text-accent' : 'border-border text-text-secondary hover:bg-surface-secondary'}`}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Danger Zone */}
        <section className="rounded-lg border-2 border-red-500/40 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h2>
          <p className="text-sm text-text-secondary">
            Permanently delete your account and all associated health data. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null); setDeleteStatus('idle') }}
            className="px-4 py-2 rounded-lg border border-red-500 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Delete my account and all data
          </button>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Delete Account</h2>
            <p className="text-sm text-text-secondary">
              This will permanently delete your account and all data. Type{' '}
              <span className="font-mono font-semibold text-red-500">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-3 bg-surface rounded-lg border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-red-500 transition-colors font-mono"
            />
            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteStatus === 'deleting'}
                className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteStatus === 'deleting'}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {deleteStatus === 'deleting' ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
