import SwiftUI

/// Screen 2 — HealthKit permissions with data-type grid.
struct OnboardingScreen2: View {
    let onNext: () -> Void

    @State private var isRequesting = false
    @State private var errorMessage: String?

    private let healthKit = HealthKitService.shared

    private let dataTypes: [(icon: String, color: Color, label: String)] = [
        ("figure.walk",     .green,  "Steps"),
        ("moon.fill",       .indigo, "Sleep"),
        ("heart.fill",      .red,    "Heart Rate"),
        ("waveform.path.ecg", .pink, "HRV"),
        ("figure.run",      .orange, "Workouts"),
        ("scalemass.fill",  .blue,   "Body Measurements"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 60)

                Image(systemName: "heart.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(.red)
                    .padding(.bottom, 28)

                Text("Connect Apple Health")
                    .font(.largeTitle.bold())
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                Spacer().frame(height: 12)

                Text("KQuarks reads your health data to sync it to your personal dashboard. Your data is private and never sold.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 32)

                LazyVGrid(
                    columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())],
                    spacing: 16
                ) {
                    ForEach(dataTypes, id: \.label) { item in
                        VStack(spacing: 8) {
                            Image(systemName: item.icon)
                                .font(.title2)
                                .foregroundStyle(item.color)
                                .frame(width: 44, height: 44)
                                .background(item.color.opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                            Text(item.label)
                                .font(.caption.weight(.medium))
                                .multilineTextAlignment(.center)
                        }
                    }
                }
                .padding(.horizontal, 32)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.top, 16)
                }

                Spacer().frame(height: 40)

                Button(action: grantAccess) {
                    HStack(spacing: 10) {
                        if isRequesting {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "heart.fill")
                        }
                        Text("Grant Access")
                            .font(.headline)
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(.red)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .disabled(isRequesting)
                .padding(.horizontal, 24)

                Button(action: onNext) {
                    Text("Skip for now")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 16)
                .padding(.bottom, 80)
            }
        }
    }

    private func grantAccess() {
        isRequesting = true
        errorMessage = nil

        Task {
            do {
                try await healthKit.requestAuthorization()
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run {
                isRequesting = false
                onNext()
            }
        }
    }
}

#Preview {
    OnboardingScreen2(onNext: {})
}
