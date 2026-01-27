'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // TODO: Send to backend
      setSubmitted(true)
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400&display=swap');

        html, body {
          height: 100%;
          overflow: hidden;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <main className="h-screen bg-black text-white font-[Inter] flex flex-col items-center justify-center px-6">

        {/* Logo */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-extralight tracking-[-0.03em]">
            KQuarks
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-zinc-500 font-extralight text-center mb-12 max-w-sm">
          Health tracking that respects your privacy.
        </p>

        {/* Email form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <div className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-5 py-3 bg-transparent border border-zinc-800 rounded-full text-sm font-extralight text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                type="submit"
                className="w-full px-5 py-3 bg-white text-black text-sm font-light tracking-wide rounded-full hover:bg-zinc-200 transition-colors"
              >
                Request Access
              </button>
            </div>
          </form>
        ) : (
          <p className="text-zinc-500 font-extralight text-sm">
            We&apos;ll be in touch.
          </p>
        )}

        {/* Status */}
        <div className="absolute bottom-8 flex items-center gap-2 text-xs text-zinc-600 font-extralight tracking-wide">
          <span className="dot w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          Building
        </div>

      </main>
    </>
  )
}
