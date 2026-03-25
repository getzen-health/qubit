import SwiftUI

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Privacy Policy")
                    .font(.title2).bold()
                Text("Last updated: March 2026")
                    .font(.caption).foregroundStyle(.secondary)

                section("Data We Collect",
                    body: "KQuarks reads health data from Apple HealthKit: steps, heart rate, HRV, sleep analysis, workouts, calories, and other metrics you have authorized. No data is collected without your explicit permission.")

                section("How We Use Your Data",
                    body: "Your health data powers the analytics, charts, and AI insights shown in the app. Data is synced to your personal Supabase database account. We do not sell, share, or monetize your personal health information.")

                section("AI Processing",
                    body: "Morning briefings and health coach responses use the Claude AI API by Anthropic. Only the minimum necessary data is sent per request. Anthropic does not retain your data for model training per their API terms.")

                section("Data Storage & Security",
                    body: "Data is stored in your private Supabase project with Row Level Security enabled — only you can access your data. Connections are encrypted via TLS.")

                section("Your Rights",
                    body: "You can delete all your data at any time from Settings → Delete Account. You can revoke HealthKit access from iOS Settings → Privacy → Health at any time.")

                section("Contact",
                    body: "For privacy questions: privacy@kquarks.app")
            }
            .padding()
        }
        .navigationTitle("Privacy Policy")
        .toolbarTitleDisplayMode(.inline)
    }

    private func section(_ title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.headline)
            Text(body).foregroundStyle(.secondary)
        }
    }
}
