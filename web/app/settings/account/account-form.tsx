'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AccountFormProps {
  email: string
  displayName: string
  userId: string
}

export function AccountForm({ email, displayName, userId }: AccountFormProps) {
  const [name, setName] = useState(displayName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const supabase = createClient()

  const handleSave = async () => {
    setStatus('saving')
    const { error } = await supabase
      .from('users')
      .update({ display_name: name.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', userId)

    setStatus(error ? 'error' : 'saved')
    if (!error) {
      setTimeout(() => setStatus('idle'), 2000)
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

        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
      </main>
    </div>
  )
}
