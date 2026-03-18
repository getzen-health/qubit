import SwiftUI

struct BiometricLockView: View {
    private let biometric = BiometricService.shared

    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                Image(systemName: "atom")
                    .font(.system(size: 64))
                    .foregroundStyle(.purple, .indigo.opacity(0.4))

                VStack(spacing: 8) {
                    Text("KQuarks")
                        .font(.largeTitle.bold())
                    Text("Locked")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack(spacing: 16) {
                    Button {
                        Task { await biometric.unlock() }
                    } label: {
                        Label("Unlock with \(biometric.biometryName)", systemImage: biometric.biometryIcon)
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor)
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal, 32)

                    Button("Use Passcode") {
                        Task { await biometric.unlockWithPasscode() }
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                .padding(.bottom, 48)
            }
        }
        .task {
            // Automatically trigger unlock on appear
            await biometric.unlock()
        }
    }
}
