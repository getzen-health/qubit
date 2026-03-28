import SwiftUI

/// Screen 1 — Welcome hero with feature bullets and "Get Started" CTA.
struct OnboardingScreen1: View {
    let onNext: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 60)

                Image(systemName: "heart.text.square.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.purple)
                    .padding(.bottom, 32)

                Text("Welcome to KQuarks")
                    .font(.largeTitle.bold())
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                Spacer().frame(height: 12)

                Text("Your personal health dashboard — powered by Apple Health and AI")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 48)

                VStack(alignment: .leading, spacing: 24) {
                    OnboardingBulletRow(
                        icon: "figure.walk",
                        color: .green,
                        text: "Sync steps, sleep, workouts automatically"
                    )
                    OnboardingBulletRow(
                        icon: "barcode.viewfinder",
                        color: .orange,
                        text: "Scan food with QuarkScore™ analysis"
                    )
                    OnboardingBulletRow(
                        icon: "brain.head.profile",
                        color: .purple,
                        text: "AI-powered weekly health insights"
                    )
                }
                .padding(.horizontal, 32)

                Spacer().frame(height: 60)

                Button(action: onNext) {
                    Text("Get Started")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(.purple)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 80)
            }
        }
    }
}

// MARK: - Shared bullet row

struct OnboardingBulletRow: View {
    let icon: String
    let color: Color
    let text: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            Text(text)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

#Preview {
    OnboardingScreen1(onNext: {})
}
