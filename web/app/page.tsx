const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Quarks',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'iOS, Web',
  description: 'Your health data. Your cloud. Your AI. A privacy-first health tracking platform.',
  url: 'https://kquarks.com',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-black text-white">
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight mb-6">
              Quarks
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-400 font-light mb-12 max-w-xl mx-auto">
              Your health data. Your cloud. Your AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-colors"
              >
                Get Started
              </a>
              <a
                href="#why"
                className="px-8 py-4 border border-zinc-700 text-white font-medium rounded-full hover:border-zinc-500 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
          </div>
        </section>

        {/* Why Different */}
        <section id="why" className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-24">
              Health tracking, reimagined.
            </h2>

            <div className="space-y-32">
              {/* Privacy */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-4">
                    Privacy First
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
                    Your data stays yours.
                  </h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    Connect to your own Supabase instance. Your health records never touch our servers.
                    Full encryption. Full control. No compromises.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Your Cloud */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:order-2">
                  <div className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-4">
                    Your Infrastructure
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
                    Bring your own cloud.
                  </h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    Store health records in your personal database.
                    Migrate anytime. Export everything.
                    No vendor lock-in, ever.
                  </p>
                </div>
                <div className="flex justify-center md:order-1">
                  <div className="w-32 h-32 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Your AI */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-4">
                    Your Intelligence
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
                    Use your own AI.
                  </h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    Plug in your API key. Claude, GPT, or any provider you trust.
                    Your queries stay between you and your AI.
                    We never see them.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Features */}
        <section className="py-32 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-16">
              Everything you need.
            </h2>

            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div className="p-8">
                <div className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Sync</div>
                <p className="text-lg">Apple Health integration</p>
              </div>
              <div className="p-8">
                <div className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Visualize</div>
                <p className="text-lg">Clean, intuitive dashboard</p>
              </div>
              <div className="p-8">
                <div className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Understand</div>
                <p className="text-lg">AI-powered insights</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-6">
              Take control of your health data.
            </h2>
            <p className="text-zinc-400 text-lg mb-12">
              Open source. Self-hostable. Free.
            </p>
            <a
              href="/login"
              className="inline-block px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-zinc-500 text-sm">
              Quarks
            </div>
            <div className="flex gap-8 text-zinc-500 text-sm">
              <a href="https://github.com/qxlsz/kquarks" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
