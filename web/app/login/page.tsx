'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

type OAuthProvider = 'apple' | 'google'
type LoadingState = OAuthProvider | null

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState<LoadingState>(null)

  const handleSignInWithOAuth = async (provider: OAuthProvider) => {
    setLoading(provider)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error signing in:', error)
      }
      setLoading(null)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">KQuarks</h1>
        <p className="mt-1 text-sm text-text-secondary">Health tracking, privately.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-sm text-red-400 text-center">
            {error === 'auth_callback_error'
              ? 'Sign-in failed. Please try again.'
              : 'An error occurred. Please try again.'}
          </p>
        </div>
      )}

      {/* Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <h2 className="font-semibold text-text-primary">Welcome back</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in to sync your health data
          </p>
        </div>

        {/* Continue with Apple */}
        <button
          onClick={() => handleSignInWithOAuth('apple')}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-text-primary text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'apple' ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          <span>{loading === 'apple' ? 'Signing in…' : 'Continue with Apple'}</span>
        </button>

        {/* Continue with Google */}
        <button
          onClick={() => handleSignInWithOAuth('google')}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-[#3c4043] border border-[#dadce0] rounded-xl font-medium text-sm hover:bg-[#f8f9fa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'google' ? (
            <div className="w-5 h-5 border-2 border-[#3c4043] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span>{loading === 'google' ? 'Signing in…' : 'Continue with Google'}</span>
        </button>

        <p className="text-xs text-center text-text-secondary">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-accent hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>
        </p>
      </div>

      <div className="text-center">
        <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to home
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Suspense fallback={<div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />}>
        <LoginContent />
      </Suspense>
    </main>
  )
}
