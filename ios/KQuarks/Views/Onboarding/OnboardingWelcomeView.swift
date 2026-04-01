import SwiftUI

/// Screen 1 of 5 — Hero screen with value proposition.
struct OnboardingWelcomeView: View {
    let onNext: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Hero icon with gradient background
            ZStack {
                LinearGradient(
                    colors: [.pink, .red],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(width: 120, height: 120)
                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))

                Image(systemName: "heart.text.square.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(.white)
            }
            .shadow(color: .pink.opacity(0.4), radius: 20, x: 0, y: 10)

            Spacer().frame(height: 32)

            // Title
            Text("GetZen")
                .font(.largeTitle.bold())

            Spacer().frame(height: 8)

            // Tagline
            Text("Your health. Deeper.")
                .font(.title3)
                .foregroundStyle(.secondary)

            Spacer().frame(height: 48)

            // Value proposition bullets
            VStack(alignment: .leading, spacing: 20) {
                ValuePropRow(
                    emoji: "📊",
                    title: "All your health data in one place",
                    description: "Steps, heart rate, sleep, workouts and more—unified."
                )

                ValuePropRow(
                    emoji: "🤖",
                    title: "AI-powered morning briefings",
                    description: "Claude analyzes your trends and delivers a daily summary."
                )

                ValuePropRow(
                    emoji: "⌚",
                    title: "Apple Watch companion",
                    description: "Glanceable metrics and complications on your wrist."
                )
            }
            .padding(.horizontal, 32)

            Spacer()

            // CTA
            Button(action: onNext) {
                Text("Get Started")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(
                            colors: [.pink, .red],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .padding(.horizontal, 24)

            // Privacy policy link
            NavigationLink {
                PrivacyPolicyView()
            } label: {
                Text("Privacy Policy")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 12)
            .padding(.bottom, 48)
        }
    }
}

// MARK: - Supporting subview

private struct ValuePropRow: View {
    let emoji: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Text(emoji)
                .font(.title2)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

#Preview {
    NavigationStack {
        OnboardingWelcomeView(onNext: {})
    }
}
