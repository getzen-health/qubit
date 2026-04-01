'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    q: 'How do I connect Apple Health?',
    a: 'Open the GetZen iOS app, go to Settings → Health Permissions, then tap "Grant Access". Make sure to enable all the categories you want to sync. Changes take effect on the next background sync.',
  },
  {
    q: "Why isn't my data syncing?",
    a: 'Check that Health Permissions are still granted (iOS Settings → Privacy & Security → Health → GetZen). Also ensure Background App Refresh is enabled for GetZen (iOS Settings → General → Background App Refresh). A manual sync can be triggered from the iOS app Settings → Sync Now.',
  },
  {
    q: 'How do I delete my data?',
    a: 'Go to Settings → Account → Delete Account. This permanently removes your account and all associated health data within 30 days. This action cannot be undone.',
  },
  {
    q: 'Is my data private?',
    a: (
      <>
        Yes. Your health data is stored privately in your personal account and is never sold or
        shared with third parties for advertising. HealthKit data is never used for advertising per
        Apple guidelines.{' '}
        <Link href="/privacy" className="text-primary underline">
          Read our full Privacy Policy.
        </Link>
      </>
    ),
  },
  {
    q: 'What is the AI health coach?',
    a: 'The AI health coach generates personalised insights from your recent health trends. You choose which AI provider powers it — either Anthropic (Claude) or OpenAI — in Settings → AI Coach. A summary of your recent metrics is sent to the provider; we do not store prompts or responses on our servers.',
  },
  {
    q: 'How do I cancel my Pro subscription?',
    a: 'Subscriptions are managed through Apple. Go to App Store → tap your profile photo → Subscriptions → GetZen → Cancel Subscription. Your Pro access continues until the end of the current billing period.',
  },
  {
    q: 'Which devices are supported?',
    a: 'The GetZen iOS app requires an iPhone running iOS 16 or later. The web dashboard works in any modern browser (Chrome, Safari, Firefox, Edge). Apple Watch support is on our roadmap.',
  },
  {
    q: 'How do I export my data?',
    a: (
      <>
        Visit the{' '}
        <Link href="/export" className="text-primary underline">
          Export page
        </Link>{' '}
        to download a complete JSON copy of all your health data. You can also call the{' '}
        <code className="bg-muted px-1 rounded text-sm">/api/export</code> endpoint directly.
      </>
    ),
  },
  {
    q: 'Does GetZen provide medical advice?',
    a: 'No. GetZen provides informational insights and trend analysis only. Nothing in the app constitutes medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.',
  },
  {
    q: 'My health score looks wrong — what should I do?',
    a: 'The health score is calculated from data available in Apple Health. Make sure all relevant categories are synced (Settings → Health Permissions) and that your Apple Health data is up to date. If the issue persists, contact support below.',
  },
]

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Support</h1>
        <p className="text-muted-foreground mb-12">
          Find answers to common questions or send us a message.
        </p>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  <span>{faq.q}</span>
                  <span
                    className="ml-4 shrink-0 text-muted-foreground transition-transform duration-200"
                    aria-hidden
                    style={{ transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    +
                  </span>
                </button>
                {open === i && (
                  <div className="px-5 pb-5 text-muted-foreground leading-7 text-sm">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Can&apos;t find an answer above? Fill in the form and we&apos;ll get back to you.
          </p>

          {status === 'sent' ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-5 text-green-600 dark:text-green-400">
              ✓ Message received! We&apos;ll be in touch within 1-2 business days.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="Describe your issue or question..."
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-500">
                  Something went wrong. Please try again or email{' '}
                  <a href="mailto:support@kquarks.app" className="underline">
                    support@kquarks.app
                  </a>
                  .
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
