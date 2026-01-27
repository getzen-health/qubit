'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');

        html, body {
          height: 100%;
        }
      `}</style>

      <main className="min-h-screen bg-[#fafafa] text-zinc-900 font-[Inter]">

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <span className="text-sm font-medium tracking-tight">KQuarks</span>
            <a
              href="https://github.com/qxlsz/kquarks"
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </nav>

        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
          <div className="max-w-2xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs text-zinc-600 mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Private Beta
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.1] mb-6">
              Your health data,
              <br />
              <span className="text-zinc-400">finally private.</span>
            </h1>

            {/* Subhead */}
            <p className="text-lg text-zinc-500 font-light max-w-md mx-auto mb-12 leading-relaxed">
              AI-powered health insights. Your own database.
              Your own AI. Zero data sharing.
            </p>

            {/* Form */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-lg text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Join
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  Early access. No spam.
                </p>
              </form>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-lg px-6 py-4 inline-block">
                <p className="text-sm text-zinc-600">
                  You&apos;re on the list. We&apos;ll be in touch.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 bg-white border-t border-zinc-100">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">

              <div>
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">Privacy First</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Connect your own Supabase. Your health data never touches our servers.
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">Your AI</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Use your own API key. Claude, GPT, or any provider. Your queries stay private.
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">Health Insights</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Sync Apple Health. Get personalized insights from AI that understands your data.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-6 border-t border-zinc-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-medium mb-4">How it works</h2>
            <p className="text-zinc-500 mb-12">Three simple steps to private health tracking.</p>

            <div className="space-y-8 text-left">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</div>
                <div>
                  <h3 className="font-medium mb-1">Connect your database</h3>
                  <p className="text-sm text-zinc-500">Set up a free Supabase instance. Your data, your control.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</div>
                <div>
                  <h3 className="font-medium mb-1">Add your AI key</h3>
                  <p className="text-sm text-zinc-500">Bring your own Claude or OpenAI API key. We never see your queries.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</div>
                <div>
                  <h3 className="font-medium mb-1">Sync & explore</h3>
                  <p className="text-sm text-zinc-500">Connect Apple Health. Get insights. Everything stays private.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 bg-zinc-900 text-white">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-medium mb-4">Ready to take control?</h2>
            <p className="text-zinc-400 mb-8">Join the private beta. Open source. Self-hostable.</p>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-zinc-400 text-sm">You&apos;re on the list.</p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto flex justify-between items-center text-xs text-zinc-500">
            <span>KQuarks</span>
            <span>Privacy-first health tracking</span>
          </div>
        </footer>

      </main>
    </>
  )
}
