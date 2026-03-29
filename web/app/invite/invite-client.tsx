'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReferralCode {
  code: string
  uses: number
  maxUses: number
}

interface ReferralStats {
  totalReferrals: number
  rewardedReferrals: number
  isPro: boolean
  proExpiresAt: string | null
}

export function InviteClient() {
  const [referral, setReferral] = useState<ReferralCode | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [applyCode, setApplyCode] = useState('')
  const [applyStatus, setApplyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [applyMessage, setApplyMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadError, setLoadError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [codeRes, statsRes] = await Promise.all([
        fetch('/api/referral'),
        fetch('/api/referral/stats'),
      ])
      if (codeRes.ok) setReferral(await codeRes.json() as ReferralCode)
      else setLoadError('Could not load your referral code.')
      if (statsRes.ok) setStats(await statsRes.json() as ReferralStats)
    } catch {
      setLoadError('Network error loading referral data.')
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const shareText = referral
    ? `Join me on KQuarks — the health app that actually shows you useful data. Use my code ${referral.code} for 1 free month of Pro! kquarks.app`
    : ''

  async function handleCopy() {
    if (!referral) return
    await navigator.clipboard.writeText(referral.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (!shareText) return
    if (navigator.share) {
      await navigator.share({ title: 'Join KQuarks', text: shareText })
    } else {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!applyCode.trim()) return
    setApplyStatus('loading')
    setApplyMessage('')
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: applyCode.trim().toUpperCase() }),
      })
      const data = await res.json() as { message?: string; error?: string }
      if (res.ok) {
        setApplyStatus('success')
        setApplyMessage(data.message ?? 'Code applied! You both get 1 month Pro 🎉')
        setApplyCode('')
        void loadData()
      } else {
        setApplyStatus('error')
        setApplyMessage(data.error ?? 'Failed to apply code.')
      }
    } catch {
      setApplyStatus('error')
      setApplyMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invite Friends</h1>
          <p className="text-sm text-text-secondary mt-1">
            Share your code — you <span className="font-medium text-accent">both</span> get 1 month of KQuarks Pro free.
          </p>
        </div>

        {loadError && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">{loadError}</p>
        )}

        {/* Referral code card */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Your Referral Code</p>
          {referral ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black tracking-[0.15em] text-accent font-mono">
                  {referral.code}
                </span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-surface hover:bg-surface-secondary transition-colors text-text-primary"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-secondary">
                Used {referral.uses} / {referral.maxUses} times
              </p>
            </>
          ) : (
            <div className="h-10 w-32 bg-surface-secondary rounded-lg animate-pulse" />
          )}
        </div>

        {/* Share text */}
        {referral && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Share Message</p>
            <p className="text-sm text-text-primary leading-relaxed">{shareText}</p>
            <button
              onClick={() => { void navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="text-xs font-medium text-accent hover:underline"
            >
              {copied ? '✓ Copied message' : 'Copy message'}
            </button>
          </div>
        )}

        {/* Reward explanation */}
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm font-semibold text-text-primary">Both you and your friend get 1 month Pro</p>
              <p className="text-xs text-text-secondary mt-1">
                Includes AI insights, data exports, and the Doctor Report feature.
              </p>
            </div>
          </div>
        </div>

        {/* Apply code */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Have a Friend&apos;s Code?</p>
          <form onSubmit={handleApply} className="flex gap-2">
            <input
              type="text"
              placeholder="HLTH7X"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              maxLength={20}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/60 transition-colors font-mono tracking-wider uppercase"
            />
            <button
              type="submit"
              disabled={applyStatus === 'loading' || !applyCode.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applyStatus === 'loading' ? 'Applying…' : 'Apply'}
            </button>
          </form>
          {applyMessage && (
            <p className={`text-xs ${applyStatus === 'success' ? 'text-green-500' : 'text-destructive'}`}>
              {applyMessage}
            </p>
          )}
        </div>

        {/* Stats card */}
        {stats && (
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Your Referrals</p>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.totalReferrals}</p>
                <p className="text-xs text-text-secondary">Friends invited</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.rewardedReferrals}</p>
                <p className="text-xs text-text-secondary">Rewarded</p>
              </div>
              {stats.isPro && (
                <div>
                  <p className="text-sm font-semibold text-accent">Pro Active</p>
                  {stats.proExpiresAt && (
                    <p className="text-xs text-text-secondary">
                      Until {new Date(stats.proExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
