import SwiftUI
import HealthKit

/// Screen 2 of 5 — Explain HealthKit permissions and request them.
struct OnboardingHealthKitView: View {
    let onNext: () -> Void

    @State private var isRequesting = false
    @State private var didGrant = false
    @State private var errorMessage: String?
    @State private var showingReducedFunctionalityAlert = false

    private let healthKit = HealthKitService.shared

    // Data types surfaced to the user
    private let dataTypes: [HealthDataTypeRow] = [
        HealthDataTypeRow(icon: "figure.walk", color: .green,
                          name: "Steps & Distance", detail: "Daily step count and walking/running distance"),
        HealthDataTypeRow(icon: "heart.fill", color: .red,
                          name: "Heart Rate & HRV", detail: "Resting HR, real-time HR, and heart rate variability"),
        HealthDataTypeRow(icon: "moon.fill", color: .indigo,
                          name: "Sleep", detail: "Sleep stages: core, REM, deep, and awake time"),
        HealthDataTypeRow(icon: "figure.run", color: .orange,
                          name: "Workouts", detail: "All workout types, duration, and calories burned"),
        HealthDataTypeRow(icon: "waveform.path.ecg", color: .pink,
                          name: "Vitals", detail: "Blood oxygen, respiratory rate, and blood pressure"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 48)

                // Icon
                Image(systemName: "heart.text.square.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.red, .pink.opacity(0.25))

                Spacer().frame(height: 24)

                Text("Connect Your Health Data")
                    .font(.title2.bold())
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                Spacer().frame(height: 12)

                Text("KQuarks reads from Apple Health to give you deep insights. Your data stays private and is only uploaded to your personal cloud account.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 36)

                // Data types list
                VStack(spacing: 0) {
                    ForEach(dataTypes) { row in
                        HealthDataTypeRowView(row: row)

                        if row.id != dataTypes.last?.id {
                            Divider()
                                .padding(.leading, 72)
                        }
                    }
                }
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(.horizontal, 24)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.top, 16)
                }

                Spacer().frame(height: 36)

                // Allow button
                Button(action: requestAuthorization) {
                    HStack(spacing: 10) {
                        if isRequesting {
                            ProgressView()
                                .tint(.white)
                        } else if didGrant {
                            Image(systemName: "checkmark")
                        } else {
                            Image(systemName: "heart.fill")
                        }
                        Text(didGrant ? "Access Granted" : "Allow Health Access")
                            .font(.headline)
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(didGrant ? Color.green : Color.red)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .disabled(isRequesting || didGrant)
                .padding(.horizontal, 24)

                // Skip
                Button {
                    showingReducedFunctionalityAlert = true
                } label: {
                    Text("Maybe Later")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 12)
                .padding(.bottom, 48)
            }
        }
        .onChange(of: didGrant) { _, granted in
            if granted {
                // Short pause so the user sees the "Access Granted" state, then advance
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                    onNext()
                }
            }
        }
        .alert("Limited Functionality", isPresented: $showingReducedFunctionalityAlert) {
            Button("Skip Anyway", role: .destructive) { onNext() }
            Button("Allow Access", role: .cancel) { requestAuthorization() }
        } message: {
            Text("Without Health access, KQuarks cannot display your stats or generate insights. You can grant access later in Settings > Health > KQuarks.")
        }
    }

    // MARK: - Private

    private func requestAuthorization() {
        isRequesting = true
        errorMessage = nil

        Task {
            do {
                try await healthKit.requestAuthorization()
                await MainActor.run {
                    didGrant = true
                    isRequesting = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isRequesting = false
                }
            }
        }
    }
}

// MARK: - Supporting types

private struct HealthDataTypeRow: Identifiable {
    let id = UUID()
    let icon: String
    let color: Color
    let name: String
    let detail: String
}

private struct HealthDataTypeRowView: View {
    let row: HealthDataTypeRow

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: row.icon)
                .font(.title3)
                .foregroundStyle(row.color)
                .frame(width: 44, height: 44)
                .background(row.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(row.name)
                    .font(.subheadline.weight(.semibold))
                Text(row.detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

#Preview {
    OnboardingHealthKitView(onNext: {})
}
