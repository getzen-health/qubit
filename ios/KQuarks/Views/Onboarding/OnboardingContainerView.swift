import SwiftUI

/// Root onboarding container. Shown on first launch; swaps to main app once
/// `hasCompletedOnboarding` flips to `true`.
struct OnboardingContainerView: View {
    @AppStorage("hasCompletedOnboarding") var hasCompletedOnboarding = false
    @State private var currentPage = 0
    
    /// When true, skip the welcome screen and start from goal-setting
    let isReplay: Bool

    init(isReplay: Bool = false) {
        self.isReplay = isReplay
    }

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
                if !isReplay {
                    OnboardingWelcomeView(onNext: advance)
                        .tag(0)
                }

                OnboardingGoalSettingView(onNext: advance)
                    .tag(isReplay ? 0 : 1)

                OnboardingHealthKitView(onNext: advance)
                    .tag(isReplay ? 1 : 2)

                OnboardingNotificationsView(onNext: advance)
                    .tag(isReplay ? 2 : 3)

                OnboardingProfileView(onNext: advance)
                    .tag(isReplay ? 3 : 4)

                OnboardingFirstSyncView()
                    .tag(isReplay ? 4 : 5)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentPage)

            // Dot indicators (visible only on pages 0–4 when not replaying; FirstSync manages its own footer)
            if currentPage < (isReplay ? 4 : 5) {
                pageIndicator
                    .padding(.bottom, 20)
            }
        }
        .ignoresSafeArea(edges: .bottom)
    }

    private var pageIndicator: some View {
        let dotCount = isReplay ? 4 : 5
        return HStack(spacing: 8) {
            ForEach(0..<dotCount) { index in
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
        let maxPage = isReplay ? 4 : 5
        withAnimation {
            currentPage = min(currentPage + 1, maxPage)
        }
    }
}

#Preview {
    OnboardingContainerView()
        .environment(AppState())
}
