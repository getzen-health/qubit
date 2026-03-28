import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How KQuarks collects, uses, and protects your health data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective date: April 1, 2026</p>

        <Section title="1. Introduction">
          <p>
            KQuarks (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, and safeguard your information when you use
            the KQuarks iOS app and web dashboard. By using KQuarks you agree to the practices
            described here.
          </p>
        </Section>

        <Section title="2. What Data We Collect">
          <h3 className="font-semibold mt-4 mb-1">Apple Health Data</h3>
          <p>
            With your explicit permission, we read health metrics from Apple HealthKit including:
            steps, distance, active energy, flights climbed, heart rate, resting heart rate, heart
            rate variability (HRV), sleep analysis (stages: awake, REM, core, deep), workouts,
            body mass, body fat percentage, blood pressure, respiratory rate, and blood oxygen
            saturation. This data is synced to your private account and is never used for
            advertising or shared with third parties.
          </p>

          <h3 className="font-semibold mt-4 mb-1">Account Information</h3>
          <p>
            When you create an account we collect your email address and a securely hashed
            password. We may also store a display name and optional profile photo if you choose to
            provide them.
          </p>

          <h3 className="font-semibold mt-4 mb-1">User-Generated Content</h3>
          <p>
            Content you create within the app — including food diary entries, journal notes, mood
            check-ins, custom goals, and supplement logs — is stored in your account and is visible
            only to you.
          </p>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Sync &amp; storage:</strong> to back up and surface your health metrics across
              devices through your personal account.
            </li>
            <li>
              <strong>AI-powered insights:</strong> when you opt in, aggregated health context is
              sent to a third-party AI provider (Anthropic or OpenAI, your choice) to generate
              personalized insights. See Section&nbsp;5 for details.
            </li>
            <li>
              <strong>App improvement:</strong> anonymised, aggregated usage analytics help us
              identify bugs and prioritise features. No individual health records are used for this
              purpose.
            </li>
            <li>
              <strong>We never sell your data</strong> to advertisers, data brokers, or any third
              party.
            </li>
          </ul>
        </Section>

        <Section title="4. HealthKit Data — Apple Guidelines">
          <p>
            KQuarks complies with Apple&apos;s HealthKit guidelines. HealthKit data is:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Never used for advertising or ad targeting.</li>
            <li>Never shared with third parties except as required to operate the service (e.g., your own cloud storage).</li>
            <li>Never sold.</li>
            <li>Only used for health and fitness purposes you have authorised.</li>
          </ul>
        </Section>

        <Section title="5. AI Insights">
          <p>
            If you enable AI health insights, a summary of recent health metrics (e.g., average
            sleep duration, step count, HRV trend) is sent to the AI provider you select — either
            Anthropic (Claude) or OpenAI. You can configure this in Settings &gt; AI Coach.
          </p>
          <p className="mt-2">
            We do <strong>not</strong> store your AI prompts or the raw responses on our servers.
            Each AI provider&apos;s own privacy policy governs their handling of data sent to their
            APIs. Anthropic: <a href="https://www.anthropic.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a>.
            OpenAI: <a href="https://openai.com/policies/privacy-policy" className="text-primary underline" target="_blank" rel="noopener noreferrer">openai.com/policies/privacy-policy</a>.
          </p>
        </Section>

        <Section title="6. Data Sharing">
          <p>
            We do not sell or rent your personal data. We may share data with:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Supabase</strong> — our database and auth provider, acting as a data
              processor on our behalf under a Data Processing Agreement.
            </li>
            <li>
              <strong>AI providers</strong> — only when you explicitly enable AI insights (see
              Section&nbsp;5).
            </li>
            <li>
              <strong>Law enforcement</strong> — only when required by a valid legal process.
            </li>
          </ul>
        </Section>

        <Section title="7. Data Retention & Deletion">
          <p>
            Your data is retained for as long as your account is active. You can permanently
            delete your account and all associated health data at any time from{' '}
            <strong>Settings &gt; Account &gt; Delete Account</strong>. Deletion is irreversible
            and typically completes within 30 days across all backup systems.
          </p>
        </Section>

        <Section title="8. Data Export">
          <p>
            You can export a complete copy of your health data in JSON format at any time by
            visiting the{' '}
            <a href="/export" className="text-primary underline">
              /export
            </a>{' '}
            page or by calling <code className="bg-muted px-1 rounded text-sm">/api/export</code>.
          </p>
        </Section>

        <Section title="9. GDPR & CCPA Rights">
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your
            personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Right to access</strong> — request a copy of your data at any time via the
              export feature.
            </li>
            <li>
              <strong>Right to rectification</strong> — correct inaccurate data from within the
              app.
            </li>
            <li>
              <strong>Right to erasure</strong> — delete your account and all data from Settings.
            </li>
            <li>
              <strong>Right to portability</strong> — export your data in a machine-readable
              format.
            </li>
            <li>
              <strong>Right to object</strong> — opt out of any processing beyond core service
              delivery at any time.
            </li>
            <li>
              <strong>CCPA / California residents</strong> — you have the right to know, delete,
              and opt out of the sale of personal information. We do not sell personal information.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@kquarks.app" className="text-primary underline">
              privacy@kquarks.app
            </a>
            .
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            We use industry-standard security measures including TLS encryption in transit,
            AES-256 encryption at rest for sensitive fields, and Row-Level Security (RLS) policies
            that ensure each user can only access their own data.
          </p>
        </Section>

        <Section title="11. Children">
          <p>
            KQuarks is not directed at children under 13. We do not knowingly collect personal
            information from children. If you believe we have inadvertently collected such
            information, contact us immediately.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Material changes will be
            communicated via in-app notification or email. Continued use of KQuarks after changes
            take effect constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            Questions or concerns about this Privacy Policy? Reach out to:{' '}
            <a href="mailto:privacy@kquarks.app" className="text-primary underline">
              privacy@kquarks.app
            </a>
          </p>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-3 text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-7 space-y-2">{children}</div>
    </section>
  )
}
