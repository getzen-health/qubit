'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignInWithApple = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error signing in:', error)
      }
      setIsLoading(false)
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
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <div className="text-center">
          <h2 className="font-semibold text-text-primary">Welcome back</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in with Apple to sync your health data
          </p>
        </div>

        <button
          onClick={handleSignInWithApple}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-text-primary text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          <span>{isLoading ? 'Signing in…' : 'Sign in with Apple'}</span>
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
