import SwiftUI

/// Screen 5 of 5 — Animated first sync; sets `hasCompletedOnboarding` on success.
struct OnboardingFirstSyncView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    @State private var syncPhase: SyncPhase = .idle
    @State private var phaseIndex = 0
    @State private var showRetry = false
    @State private var errorMessage: String?

    private let syncService = SyncService.shared

    private let phases: [SyncPhase] = [
        .reading("Reading steps..."),
        .reading("Loading sleep data..."),
        .reading("Analyzing workouts..."),
        .reading("Almost done..."),
    ]

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Animated icon
            ZStack {
                Circle()
                    .fill(Color.accentColor.opacity(0.12))
                    .frame(width: 120, height: 120)

                Image(systemName: syncPhase.icon)
                    .font(.system(size: 52))
                    .foregroundStyle(syncPhase.iconColor)
                    .symbolEffect(.pulse, options: .repeating, isActive: syncPhase.isActive)
            }

            Spacer().frame(height: 32)

            Text("Syncing Your Health Data")
                .font(.title2.bold())

            Spacer().frame(height: 12)

            Text(syncPhase.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .animation(.easeInOut, value: syncPhase.description)

            Spacer().frame(height: 32)

            // Progress indicator
            if syncPhase.isActive {
                ProgressView()
                    .scaleEffect(1.2)
            } else if case .done = syncPhase {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(.green)
                    .transition(.scale.combined(with: .opacity))
            } else if case .failed = syncPhase {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(.red)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.top, 16)
            }

            Spacer()

            // Retry button (only shown on error)
            if showRetry {
                Button(action: startSync) {
                    Text("Retry")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .padding(.horizontal, 24)

                Button {
                    hasCompletedOnboarding = true
                } label: {
                    Text("Skip sync for now")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 12)
            }

            Spacer().frame(height: 48)
        }
        .task {
            await startSyncAsync()
        }
    }

    // MARK: - Sync logic

    private func startSync() {
        showRetry = false
        errorMessage = nil
        Task { await startSyncAsync() }
    }

    private func startSyncAsync() async {
        await updatePhase(phases[0])

        // Cycle through reading phases while sync runs in parallel
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.runPhaseAnimation() }
            group.addTask { await self.runSync() }
        }
    }

    private func runPhaseAnimation() async {
        for index in phases.indices {
            await updatePhase(phases[index])
            try? await Task.sleep(nanoseconds: 900_000_000) // ~0.9 s per phase
        }
    }

    private func runSync() async {
        await syncService.performFullSync()

        await MainActor.run {
            if syncService.syncError != nil {
                let message = syncService.syncError?.localizedDescription
                    ?? "Something went wrong. You can retry or continue without syncing."
                syncPhase = .failed(message)
                errorMessage = message
                showRetry = true
            } else {
                withAnimation {
                    syncPhase = .done
                }
                // Brief pause before completing onboarding
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    hasCompletedOnboarding = true
                }
            }
        }
    }

    @MainActor
    private func updatePhase(_ phase: SyncPhase) {
        withAnimation(.easeInOut(duration: 0.3)) {
            syncPhase = phase
        }
    }
}

// MARK: - SyncPhase

private enum SyncPhase: Equatable {
    case idle
    case reading(String)
    case done
    case failed(String)

    var description: String {
        switch self {
        case .idle: return "Preparing..."
        case .reading(let msg): return msg
        case .done: return "All done! Welcome to KQuarks."
        case .failed(let msg): return msg
        }
    }

    var icon: String {
        switch self {
        case .idle, .reading: return "arrow.triangle.2.circlepath"
        case .done: return "checkmark.circle.fill"
        case .failed: return "exclamationmark.circle.fill"
        }
    }

    var iconColor: Color {
        switch self {
        case .idle, .reading: return .accentColor
        case .done: return .green
        case .failed: return .red
        }
    }

    var isActive: Bool {
        switch self {
        case .reading: return true
        default: return false
        }
    }
}

#Preview {
    OnboardingFirstSyncView()
}
