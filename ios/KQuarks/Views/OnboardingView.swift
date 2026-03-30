import SwiftUI

/// 3-screen first-launch onboarding: Welcome → HealthKit permissions → Goals.
struct OnboardingView: View {
    @State private var currentPage = 0

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $currentPage) {
                OnboardingScreen1(onNext: { advance() })
                    .tag(0)

                OnboardingScreen2(onNext: { advance() })
                    .tag(1)

                OnboardingScreen3()
                    .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentPage)
            .ignoresSafeArea(edges: .bottom)

            // Page dot indicators (hidden on the final screen which has its own CTA)
            if currentPage < 2 {
                HStack(spacing: 8) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(index == currentPage ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 8, height: 8)
                            .animation(.easeInOut, value: currentPage)
                    }
                }
                .padding(.bottom, 24)
            }
        }
        .background(Color.premiumBackground)
    }

    private func advance() {
        withAnimation { currentPage = min(currentPage + 1, 2) }
    }
}

#Preview {
    OnboardingView()
        .environment(AppState())
}
