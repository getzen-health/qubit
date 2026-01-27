'use client'

import { useEffect, useRef } from 'react'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'KQuarks',
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

function useIntersectionObserver() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = document.querySelectorAll('.fade-up')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return ref
}

export default function Home() {
  useIntersectionObserver()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fade-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .fade-up:nth-child(2) { transition-delay: 0.1s; }
        .fade-up:nth-child(3) { transition-delay: 0.2s; }
        .fade-up:nth-child(4) { transition-delay: 0.3s; }

        .glow {
          box-shadow: 0 0 60px rgba(255, 255, 255, 0.03);
        }

        .text-gradient {
          background: linear-gradient(to bottom, #ffffff, #a1a1aa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .line-glow {
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent);
        }

        .icon-box {
          background: linear-gradient(135deg, rgba(39, 39, 42, 0.5), rgba(24, 24, 27, 0.8));
          backdrop-filter: blur(10px);
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <main className="min-h-screen bg-black text-white font-[Inter] antialiased">
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h1 className="text-6xl sm:text-8xl font-semibold tracking-[-0.04em] mb-8 text-gradient">
              KQuarks
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-500 font-light tracking-tight mb-16 max-w-lg mx-auto leading-relaxed">
              Your health data. Your cloud. Your AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="group px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-zinc-100 transition-all duration-300 hover:scale-[1.02]"
              >
                <span className="tracking-tight">Get Started</span>
              </a>
              <a
                href="#why"
                className="px-8 py-4 border border-zinc-800 text-zinc-300 font-medium rounded-full hover:border-zinc-600 hover:text-white transition-all duration-300"
              >
                <span className="tracking-tight">Learn More</span>
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
            <div className="w-px h-20 line-glow" />
          </div>
        </section>

        {/* Why Different */}
        <section id="why" className="py-40 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="fade-up text-3xl sm:text-5xl font-semibold text-center mb-32 tracking-[-0.03em] text-gradient">
              Health tracking, reimagined.
            </h2>

            <div className="space-y-40">
              {/* Privacy */}
              <div className="fade-up grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="text-zinc-600 text-xs font-medium uppercase tracking-[0.2em] mb-6">
                    Privacy First
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-semibold mb-6 tracking-[-0.02em] leading-tight">
                    Your data stays yours.
                  </h3>
                  <p className="text-zinc-500 text-lg leading-relaxed font-light">
                    Connect to your own Supabase instance. Your health records never touch our servers.
                    Full encryption. Full control.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-36 h-36 rounded-3xl icon-box border border-zinc-800/50 flex items-center justify-center glow">
                    <svg className="w-14 h-14 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Your Cloud */}
              <div className="fade-up grid md:grid-cols-2 gap-16 items-center">
                <div className="md:order-2">
                  <div className="text-zinc-600 text-xs font-medium uppercase tracking-[0.2em] mb-6">
                    Your Infrastructure
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-semibold mb-6 tracking-[-0.02em] leading-tight">
                    Bring your own cloud.
                  </h3>
                  <p className="text-zinc-500 text-lg leading-relaxed font-light">
                    Store health records in your personal database.
                    Migrate anytime. Export everything.
                    No vendor lock-in.
                  </p>
                </div>
                <div className="flex justify-center md:order-1">
                  <div className="w-36 h-36 rounded-3xl icon-box border border-zinc-800/50 flex items-center justify-center glow">
                    <svg className="w-14 h-14 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Your AI */}
              <div className="fade-up grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="text-zinc-600 text-xs font-medium uppercase tracking-[0.2em] mb-6">
                    Your Intelligence
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-semibold mb-6 tracking-[-0.02em] leading-tight">
                    Use your own AI.
                  </h3>
                  <p className="text-zinc-500 text-lg leading-relaxed font-light">
                    Plug in your API key. Claude, GPT, or any provider.
                    Your queries stay between you and your AI.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-36 h-36 rounded-3xl icon-box border border-zinc-800/50 flex items-center justify-center glow">
                    <svg className="w-14 h-14 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Features */}
        <section className="py-40 px-6 border-t border-zinc-900/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="fade-up text-3xl sm:text-5xl font-semibold text-center mb-24 tracking-[-0.03em] text-gradient">
              Everything you need.
            </h2>

            <div className="fade-up grid sm:grid-cols-3 gap-4">
              <div className="p-10 rounded-2xl bg-zinc-900/30 border border-zinc-800/30 text-center">
                <div className="text-zinc-600 text-xs uppercase tracking-[0.2em] mb-3">Sync</div>
                <p className="text-lg font-light tracking-tight">Apple Health</p>
              </div>
              <div className="p-10 rounded-2xl bg-zinc-900/30 border border-zinc-800/30 text-center">
                <div className="text-zinc-600 text-xs uppercase tracking-[0.2em] mb-3">Visualize</div>
                <p className="text-lg font-light tracking-tight">Clean dashboard</p>
              </div>
              <div className="p-10 rounded-2xl bg-zinc-900/30 border border-zinc-800/30 text-center">
                <div className="text-zinc-600 text-xs uppercase tracking-[0.2em] mb-3">Understand</div>
                <p className="text-lg font-light tracking-tight">AI insights</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 px-6">
          <div className="fade-up max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-semibold mb-8 tracking-[-0.03em] text-gradient">
              Take control.
            </h2>
            <p className="text-zinc-500 text-lg mb-16 font-light">
              Open source. Self-hostable. Free.
            </p>
            <a
              href="/login"
              className="inline-block px-10 py-5 bg-white text-black font-medium rounded-full hover:bg-zinc-100 transition-all duration-300 hover:scale-[1.02] tracking-tight"
            >
              Get Started
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-zinc-900/50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-zinc-600 text-sm tracking-tight">
              KQuarks
            </div>
            <div className="flex gap-10 text-zinc-600 text-sm">
              <a href="https://github.com/qxlsz/kquarks" className="hover:text-white transition-colors duration-300 tracking-tight">
                GitHub
              </a>
              <a href="/dashboard" className="hover:text-white transition-colors duration-300 tracking-tight">
                Dashboard
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
