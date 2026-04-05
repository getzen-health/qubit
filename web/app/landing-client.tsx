'use client'

const features = [
  {
    icon: '🍎',
    title: 'Food Scanner',
    description: 'Scan any barcode. Get a ZenScore™ with ingredient analysis and nutritional breakdown.',
  },
  {
    icon: '🤖',
    title: 'AI Health Insights',
    description: 'Claude-powered weekly narratives from your 14-day health trends. Your data, your AI key.',
  },
  {
    icon: '💪',
    title: 'Workout Tracker',
    description: 'Log strength sessions with a 60-exercise library and progressive overload tracking.',
  },
  {
    icon: '😴',
    title: 'Sleep Analysis',
    description: 'Deep, REM, and core sleep stages with HRV correlation and recovery scoring.',
  },
  {
    icon: '🔮',
    title: 'Health Forecast',
    description: '7-day predictions using your personal trend data and machine learning models.',
  },
  {
    icon: '🔒',
    title: 'Your Data, Private',
    description: 'HealthKit data never sold. GDPR/CCPA compliant. Export anytime in any format.',
  },
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 border-b border-zinc-800/60 backdrop-blur-md bg-zinc-950/80">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-sm font-semibold tracking-tight">GetZen</span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/qxlsz/getzen"
              className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block"
            >
              GitHub
            </a>
            <a
              href="/login"
              className="text-xs px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-100 transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center">

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
            Your health,
            <br />
            <span className="text-zinc-400">beautifully understood.</span>
          </h1>

          {/* Subhead */}
          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
            Sync Apple Health, scan food, get AI insights. All in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-medium rounded-xl text-sm hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download on App Store
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-zinc-100 font-medium rounded-xl text-sm hover:bg-zinc-700 transition-colors"
            >
              Open Web App →
            </a>
          </div>

          {/* Health metrics mockup */}
          <div className="max-w-sm mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left shadow-2xl shadow-zinc-950">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Today&apos;s Summary</span>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">↑ Good</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Steps</div>
                <div className="text-2xl font-semibold tabular-nums">8,432</div>
                <div className="text-xs text-zinc-500 mt-1">+12% vs avg</div>
              </div>
              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Sleep</div>
                <div className="text-2xl font-semibold tabular-nums">7.2h</div>
                <div className="text-xs text-zinc-500 mt-1">84% quality</div>
              </div>
              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">HRV</div>
                <div className="text-2xl font-semibold tabular-nums">54ms</div>
                <div className="text-xs text-emerald-400 mt-1">↑ High</div>
              </div>
              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Recovery</div>
                <div className="text-2xl font-semibold tabular-nums">
                  78<span className="text-sm text-zinc-400">%</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">Ready to train</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats bar */}
      <section className="py-5 border-y border-zinc-800 bg-zinc-900/40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2 text-sm text-zinc-400">
            <span><span className="text-zinc-100 font-medium">100%</span> Open Source</span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span><span className="text-zinc-100 font-medium">HealthKit</span> Native</span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span><span className="text-zinc-100 font-medium">GDPR</span> Compliant</span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span><span className="text-zinc-100 font-medium">0 Ads,</span> Ever</span>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-3">Everything your health needs</h2>
          <p className="text-zinc-400 text-center mb-16 max-w-md mx-auto">
            A complete health platform built on open standards and your own data.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold mb-2 text-zinc-100">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm font-medium text-zinc-100">GetZen</span>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-500">
            <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="/support" className="hover:text-zinc-300 transition-colors">Support</a>
            <a href="https://github.com/qxlsz/getzen" className="hover:text-zinc-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
