import SwiftUI

/// Root onboarding container. Shown on first launch; swaps to main app once
/// `hasCompletedOnboarding` flips to `true`.
struct OnboardingContainerView: View {
    @AppStorage("hasCompletedOnboarding") var hasCompletedOnboarding = false
    @State private var currentPage = 0

    var body: some View {
        if hasCompletedOnboarding {
            // Hand off to the regular app entry point
            ContentView()
        } else {
            onboardingFlow
        }
    }

    // MARK: - Onboarding flow

    private var onboardingFlow: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $currentPage) {
                OnboardingWelcomeView(onNext: advance)
                    .tag(0)

                OnboardingGoalSettingView(onNext: advance)
                    .tag(1)

                OnboardingHealthKitView(onNext: advance)
                    .tag(2)

                OnboardingNotificationsView(onNext: advance)
                    .tag(3)

                OnboardingProfileView(onNext: advance)
                    .tag(4)

                OnboardingFirstSyncView()
                    .tag(5)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentPage)

            // Dot indicators (visible on pages 0–4; FirstSync manages its own footer)
            if currentPage < 5 {
                pageIndicator
                    .padding(.bottom, 20)
            }
        }
        .ignoresSafeArea(edges: .bottom)
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<5) { index in
                Circle()
                    .fill(index == currentPage
                          ? Color.accentColor
                          : Color.secondary.opacity(0.3))
                    .frame(width: 8, height: 8)
                    .animation(.easeInOut, value: currentPage)
            }
        }
    }

    private func advance() {
        withAnimation {
            currentPage = min(currentPage + 1, 5)
        }
    }
}

#Preview {
    OnboardingContainerView()
        .environment(AppState())
}
