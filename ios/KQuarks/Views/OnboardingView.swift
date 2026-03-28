import SwiftUI

struct OnboardingView: View {
    @Environment(AppState.self) private var appState
    @State private var currentPage = 0
    @State private var isRequestingPermission = false
    @State private var permissionGranted = false
    @State private var error: String?

    private let healthKit = HealthKitService.shared

    var body: some View {
        VStack(spacing: 0) {
            TabView(selection: $currentPage) {
                WelcomePage()
                    .tag(0)

                FeaturesPage()
                    .tag(1)

                PermissionPage(
                    isRequesting: $isRequestingPermission,
                    permissionGranted: $permissionGranted,
                    error: $error,
                    onRequestPermission: requestHealthKitPermission
                )
                .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentPage)

            // Page indicators and buttons
            VStack(spacing: 24) {
                // Page dots
                HStack(spacing: 8) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(index == currentPage ? Color.accentColor : Color.gray.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }

                // Navigation buttons
                if currentPage < 2 {
                    Button {
                        withAnimation {
                            currentPage += 1
                        }
                    } label: {
                        Text("Continue")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor)
                            .cornerRadius(12)
                    }
                } else if permissionGranted {
                    Button {
                        appState.completeOnboarding()
                    } label: {
                        Text("Get Started")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .cornerRadius(12)
                    }
                } else if error != nil {
                    Button {
                        appState.completeOnboarding()
                    } label: {
                        Text("Continue Anyway")
                            .font(.headline)
                            .foregroundStyle(.accentColor)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor.opacity(0.12))
                            .cornerRadius(12)
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .background(Color(.systemBackground))
    }

    private func requestHealthKitPermission() {
        isRequestingPermission = true
        error = nil

        Task {
            do {
                try await healthKit.requestAuthorization()
                await MainActor.run {
                    permissionGranted = true
                    isRequestingPermission = false
                }
            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                    isRequestingPermission = false
                }
            }
        }
    }
}

// MARK: - Welcome Page

struct WelcomePage: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "atom")
                .font(.system(size: 80))
                .foregroundStyle(.purple, .indigo.opacity(0.3))

            Text("KQuarks")
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)

            Text("Your health, down to the smallest detail. Track everything and get AI-powered insights.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
        .padding()
    }
}

// MARK: - Features Page

struct FeaturesPage: View {
    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Text("Everything You Need")
                .font(.title.bold())

            VStack(alignment: .leading, spacing: 24) {
                FeatureRow(
                    icon: "figure.walk",
                    color: .green,
                    title: "Activity Tracking",
                    description: "Steps, distance, calories, and more"
                )

                FeatureRow(
                    icon: "heart.fill",
                    color: .red,
                    title: "Heart Health",
                    description: "Heart rate, HRV, and trends"
                )

                FeatureRow(
                    icon: "moon.fill",
                    color: .indigo,
                    title: "Sleep Analysis",
                    description: "Sleep stages and quality scoring"
                )

                FeatureRow(
                    icon: "sparkles",
                    color: .orange,
                    title: "AI Insights",
                    description: "Personalized health recommendations"
                )

                FeatureRow(
                    icon: "globe",
                    color: .blue,
                    title: "Web Dashboard",
                    description: "Access your data from anywhere"
                )
            }
            .padding(.horizontal, 24)

            Spacer()
            Spacer()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let color: Color
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.15))
                .cornerRadius(10)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Permission Page

struct PermissionPage: View {
    @Binding var isRequesting: Bool
    @Binding var permissionGranted: Bool
    @Binding var error: String?
    let onRequestPermission: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: permissionGranted ? "checkmark.shield.fill" : "heart.text.square")
                .font(.system(size: 80))
                .foregroundStyle(permissionGranted ? .green : .red, .pink.opacity(0.3))

            Text(permissionGranted ? "You're All Set!" : "Connect Apple Health")
                .font(.title.bold())

            Text(permissionGranted
                 ? "Your health data will sync automatically."
                 : "We need access to your health data to show you insights and sync to the cloud.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            if !permissionGranted {
                Button {
                    onRequestPermission()
                } label: {
                    HStack {
                        if isRequesting {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "heart.fill")
                        }
                        Text("Connect Health")
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .padding()
                    .padding(.horizontal, 24)
                    .background(Color.red)
                    .cornerRadius(12)
                }
                .disabled(isRequesting)
            }

            Spacer()
            Spacer()
        }
    }
}

#Preview {
    OnboardingView()
        .environment(AppState())
}
