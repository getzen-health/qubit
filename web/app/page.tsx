'use client'

import { useEffect } from 'react'

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

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&display=swap');

        html { scroll-behavior: smooth; }

        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 1s ease, transform 1s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <main className="min-h-screen bg-black text-white font-[Inter] antialiased">

        {/* Hero */}
        <section className="h-screen flex flex-col items-center justify-center px-6">
          <h1 className="text-5xl sm:text-7xl font-extralight tracking-[-0.05em] mb-6">
            KQuarks
          </h1>
          <p className="text-lg sm:text-xl text-zinc-500 font-extralight tracking-wide mb-16">
            Your health data. Your cloud. Your AI.
          </p>
          <a
            href="/login"
            className="px-8 py-3 text-sm font-light tracking-widest uppercase border border-zinc-700 rounded-full hover:bg-white hover:text-black transition-all duration-500"
          >
            Enter
          </a>
        </section>

        {/* Divider */}
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-zinc-800 to-transparent mx-auto" />

        {/* Features */}
        <section className="py-32 px-6">
          <div className="max-w-2xl mx-auto space-y-32">

            <div className="reveal text-center">
              <p className="text-xs tracking-[0.3em] text-zinc-600 uppercase mb-8">Privacy</p>
              <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight mb-6">
                Your data never leaves your control
              </h2>
              <p className="text-zinc-600 font-extralight leading-relaxed">
                Connect your own database. We never see your health records.
              </p>
            </div>

            <div className="reveal text-center">
              <p className="text-xs tracking-[0.3em] text-zinc-600 uppercase mb-8">Infrastructure</p>
              <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight mb-6">
                Bring your own cloud
              </h2>
              <p className="text-zinc-600 font-extralight leading-relaxed">
                Your Supabase. Your data. Export anytime.
              </p>
            </div>

            <div className="reveal text-center">
              <p className="text-xs tracking-[0.3em] text-zinc-600 uppercase mb-8">Intelligence</p>
              <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight mb-6">
                Use your own AI
              </h2>
              <p className="text-zinc-600 font-extralight leading-relaxed">
                Your API key. Your queries stay private.
              </p>
            </div>

          </div>
        </section>

        {/* Divider */}
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-zinc-800 to-transparent mx-auto" />

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="reveal max-w-xl mx-auto text-center">
            <p className="text-xs tracking-[0.3em] text-zinc-600 uppercase mb-8">Open Source</p>
            <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight mb-12">
              Take control of your health data
            </h2>
            <a
              href="/login"
              className="inline-block px-10 py-4 text-sm font-light tracking-widest uppercase bg-white text-black rounded-full hover:bg-zinc-200 transition-all duration-500"
            >
              Get Started
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-zinc-900">
          <div className="max-w-2xl mx-auto flex justify-between items-center text-xs tracking-widest text-zinc-600">
            <span>KQuarks</span>
            <a href="https://github.com/qxlsz/kquarks" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </footer>

      </main>
    </>
  )
}
