import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using GetZen.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective date: April 1, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By downloading the GetZen iOS app or using the GetZen web dashboard
            (&quot;Service&quot;), you agree to these Terms of Service (&quot;Terms&quot;). If you
            do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            GetZen provides tools to sync Apple Health data to a personal cloud account,
            visualise health trends, and generate AI-powered wellness insights. The Service is
            provided for informational and personal wellness purposes only.
          </p>
        </Section>

        <Section title="3. Not Medical Advice">
          <p>
            <strong>GetZen is not a medical device and does not provide medical advice.</strong>{' '}
            All content, insights, recommendations, and health scores provided by the Service are
            for general informational purposes only and are not a substitute for professional
            medical advice, diagnosis, or treatment. Always consult a qualified healthcare
            provider with any questions regarding a medical condition. Never disregard professional
            medical advice or delay seeking it because of something you read or saw in GetZen.
          </p>
        </Section>

        <Section title="4. Accounts & Eligibility">
          <p>
            You must be at least 13 years old to create an account. You are responsible for
            maintaining the confidentiality of your login credentials and for all activity that
            occurs under your account. Notify us immediately at{' '}
            <a href="mailto:legal@kquarks.app" className="text-primary underline">
              legal@kquarks.app
            </a>{' '}
            if you suspect unauthorised access.
          </p>
        </Section>

        <Section title="5. Subscription & Billing">
          <p>
            GetZen offers a free tier with core features and an optional Pro subscription.
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Pro subscription:</strong> $4.99&nbsp;/&nbsp;month (or local equivalent),
              billed monthly through the Apple App Store.
            </li>
            <li>
              <strong>Cancel anytime:</strong> manage or cancel your subscription via{' '}
              <strong>App Store &gt; Subscriptions</strong>. Cancellation takes effect at the end
              of the current billing period.
            </li>
            <li>
              <strong>Refunds:</strong> governed by Apple&apos;s refund policy. Contact Apple
              Support for billing disputes.
            </li>
            <li>
              We reserve the right to change Pro pricing with 30 days&apos; notice to active
              subscribers.
            </li>
          </ul>
        </Section>

        <Section title="6. Your Data & Ownership">
          <p>
            <strong>You own your health data.</strong> GetZen claims no intellectual property
            rights over the health metrics, food logs, journal entries, or other content you
            contribute to the Service. We store your data to provide the Service and will never
            sell it. You can export or delete your data at any time (see our{' '}
            <a href="/privacy" className="text-primary underline">
              Privacy Policy
            </a>
            ).
          </p>
        </Section>

        <Section title="7. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Scrape, crawl, or systematically extract data from the Service.</li>
            <li>Share your account credentials with others.</li>
            <li>Attempt to reverse-engineer, decompile, or tamper with any part of the Service.</li>
            <li>Use the Service to store or transmit malware, spam, or illegal content.</li>
            <li>
              Use the Service in any way that violates applicable local, national, or international
              law or regulation.
            </li>
          </ul>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            The GetZen brand, logos, app design, and proprietary algorithms are the intellectual
            property of GetZen and its licensors. Nothing in these Terms grants you a right to
            use our trademarks without prior written consent.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            The Service is provided <strong>&quot;as is&quot;</strong> and{' '}
            <strong>&quot;as available&quot;</strong> without warranties of any kind, either
            express or implied, including but not limited to warranties of merchantability, fitness
            for a particular purpose, or non-infringement. We do not warrant that the Service will
            be uninterrupted, error-free, or completely secure.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, GetZen and its affiliates, directors,
            employees, and agents shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of or inability to use the
            Service. Our total liability for any claim arising from these Terms shall not exceed
            the amount you paid us in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            We may suspend or terminate your account at any time for violation of these Terms or
            for other reasons including extended inactivity. You may delete your account at any
            time from <strong>Settings &gt; Account &gt; Delete Account</strong>. Upon termination,
            your right to use the Service ceases immediately.
          </p>
        </Section>

        <Section title="12. Governing Law & Dispute Resolution">
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of
            California, without regard to its conflict of law provisions. Any dispute arising from
            or relating to these Terms shall be resolved in the state or federal courts located in
            San Francisco County, California.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>
            We may revise these Terms at any time. Material changes will be communicated via
            in-app notification or email at least 14 days in advance. Continued use of the Service
            after the effective date of any changes constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Questions about these Terms? Email us at{' '}
            <a href="mailto:legal@kquarks.app" className="text-primary underline">
              legal@kquarks.app
            </a>
            .
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
