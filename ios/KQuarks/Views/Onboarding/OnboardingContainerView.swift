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

                OnboardingHealthKitView(onNext: advance)
                    .tag(1)

                OnboardingNotificationsView(onNext: advance)
                    .tag(2)

                OnboardingProfileView(onNext: advance)
                    .tag(3)

                OnboardingFirstSyncView()
                    .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentPage)

            // Dot indicators (visible on pages 0–3; FirstSync manages its own footer)
            if currentPage < 4 {
                pageIndicator
                    .padding(.bottom, 20)
            }
        }
        .ignoresSafeArea(edges: .bottom)
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<4) { index in
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
            currentPage = min(currentPage + 1, 4)
        }
    }
}

#Preview {
    OnboardingContainerView()
        .environment(AppState())
}
