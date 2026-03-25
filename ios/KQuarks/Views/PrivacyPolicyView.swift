import SwiftUI

/// In-app privacy policy — required for HealthKit apps on the App Store.
struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 6) {
                    Text("KQuarks Privacy Policy")
                        .font(.title2.bold())
                    Text("Effective date: March 24, 2026")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                PolicySection(title: "Overview",
                    """
                    KQuarks is a personal health analytics app. We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights over it.
                    """)

                PolicySection(title: "Data We Collect",
                    """
                    KQuarks reads the following data from Apple Health (HealthKit), with your explicit permission:

                    • Activity: steps, distance, active calories, flights climbed
                    • Heart: heart rate, resting heart rate, heart rate variability (HRV)
                    • Sleep: sleep stages (core, REM, deep, awake)
                    • Workouts: type, duration, energy burned, average heart rate
                    • Body: weight, height, body fat percentage
                    • Vitals: blood oxygen (SpO2), respiratory rate, blood pressure
                    • Wrist temperature (Apple Watch Series 8+ only)

                    We also collect:
                    • Your name and birth year, if you voluntarily provide them during onboarding
                    • An anonymous user identifier created by Sign In with Apple
                    """)

                PolicySection(title: "How We Use Your Data",
                    """
                    Your health data is used exclusively to provide KQuarks features:

                    1. Local display — data is processed on your iPhone to power the 170+ metric views inside the app.

                    2. Cloud sync (Supabase) — your health summaries are uploaded to your personal Supabase database so you can access them via the KQuarks web dashboard. Data is associated with your user account and protected by Row Level Security; no other user can access your data.

                    3. AI insights (Claude API) — with your permission, daily summaries (not raw samples) are sent to Anthropic's Claude API to generate your morning briefings and anomaly alerts. These requests are proxied through Supabase Edge Functions. We do not store your data with Anthropic beyond the duration of a single API call.

                    We do not use your health data for advertising, profiling, or any purpose other than providing KQuarks features to you.
                    """)

                PolicySection(title: "Data Storage & Security",
                    """
                    • Local storage: raw HealthKit data stays on your device and in Apple Health. KQuarks stores aggregated summaries locally via SwiftData.

                    • Cloud storage: aggregated daily summaries are stored in Supabase Postgres, hosted on infrastructure that complies with SOC 2 Type II. All data is encrypted in transit (TLS 1.3) and at rest (AES-256).

                    • Your API key (if you provide your own Claude or OpenAI key): stored encrypted in your Supabase row, never in plain text.
                    """)

                PolicySection(title: "Third-Party Services",
                    """
                    KQuarks uses the following third-party services:

                    • Supabase (supabase.com) — database, authentication, and edge functions. Supabase processes data on your behalf under their Privacy Policy.
                    • Anthropic Claude API (anthropic.com) — AI model used for health briefings and insights. Data sent: aggregated daily summaries only. No raw samples. Anthropic's API usage policy applies.
                    • Apple HealthKit — the source of all health data. KQuarks is a read-only consumer of HealthKit; we never write data back to Apple Health.

                    We do not sell, rent, or share your personal data with any third party for their own purposes.
                    """)

                PolicySection(title: "Your Rights",
                    """
                    You have the right to:

                    • Access your data — export your summaries from the KQuarks web dashboard at any time.
                    • Delete your data — delete your account from Settings > Account > Delete Account. This permanently removes all your data from our servers within 30 days.
                    • Revoke Health access — in iOS Settings > Health > Data Access & Devices > KQuarks, you can revoke HealthKit permissions at any time. The app will continue to work for data already synced.
                    • Opt out of AI features — disable morning briefings in KQuarks Settings > Notifications. No health data will be sent to Claude.
                    """)

                PolicySection(title: "Children's Privacy",
                    """
                    KQuarks is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us data, please contact us immediately.
                    """)

                PolicySection(title: "Changes to This Policy",
                    """
                    We may update this privacy policy from time to time. We will notify you of significant changes via an in-app notice and update the effective date above. Continued use of the app after changes constitutes acceptance of the revised policy.
                    """)

                PolicySection(title: "Contact Us",
                    """
                    If you have questions about this privacy policy or your data, contact us at:

                    privacy@kquarks.app

                    We aim to respond within 5 business days.
                    """)

                Spacer().frame(height: 32)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
        }
        .navigationTitle("Privacy Policy")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Supporting subview

private struct PolicySection: View {
    let title: String
    let content: String

    init(title: String, _ content: String) {
        self.title = title
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)

            Text(content)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

#Preview {
    NavigationStack {
        PrivacyPolicyView()
    }
}
