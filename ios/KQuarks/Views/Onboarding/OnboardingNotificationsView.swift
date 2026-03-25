import SwiftUI
import UserNotifications

/// Screen 3 of 5 — Opt in to morning AI health briefings.
struct OnboardingNotificationsView: View {
    let onNext: () -> Void

    @State private var isRequesting = false
    @State private var didGrant = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Icon
            Image(systemName: "bell.badge.fill")
                .font(.system(size: 64))
                .foregroundStyle(.orange, .yellow.opacity(0.3))

            Spacer().frame(height: 24)

            Text("Morning Health Briefings")
                .font(.title2.bold())
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            Spacer().frame(height: 12)

            Text("Your personalized health summary, every morning at 7am")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Spacer().frame(height: 36)

            // Mock notification card
            MockNotificationCard()
                .padding(.horizontal, 24)

            Spacer()

            // Enable button
            Button(action: requestNotifications) {
                HStack(spacing: 10) {
                    if isRequesting {
                        ProgressView()
                            .tint(.white)
                    } else if didGrant {
                        Image(systemName: "checkmark")
                    } else {
                        Image(systemName: "bell.fill")
                    }
                    Text(didGrant ? "Notifications Enabled" : "Enable Notifications")
                        .font(.headline)
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(didGrant ? Color.green : Color.orange)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .disabled(isRequesting || didGrant)
            .padding(.horizontal, 24)

            // Skip
            Button {
                onNext()
            } label: {
                Text("No Thanks")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 12)
            .padding(.bottom, 48)
        }
        .onChange(of: didGrant) { _, granted in
            if granted {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                    onNext()
                }
            }
        }
    }

    // MARK: - Private

    private func requestNotifications() {
        isRequesting = true

        Task {
            let center = UNUserNotificationCenter.current()
            let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false

            await MainActor.run {
                didGrant = granted
                isRequesting = false
                // Advance even if denied — we respect the user's choice
                if !granted {
                    onNext()
                }
            }
        }
    }
}

// MARK: - Mock notification preview card

private struct MockNotificationCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "heart.text.square.fill")
                    .foregroundStyle(.red)

                VStack(alignment: .leading, spacing: 1) {
                    Text("KQuarks")
                        .font(.caption.weight(.semibold))
                    Text("now")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }

            Text("Good morning! Your HRV is up 12% this week — great recovery. You averaged 7h 34m of sleep. Ready for a hard effort today.")
                .font(.subheadline)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.secondary.opacity(0.15), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 4)
    }
}

#Preview {
    OnboardingNotificationsView(onNext: {})
}
