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

                // Lockout countdown banner
                if biometric.isInLockout {
                    VStack(spacing: 6) {
                        Text("Too many failed attempts")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.red)
                        Text("Try again in \(biometric.lockoutCountdownText)")
                            .font(.title2.monospacedDigit().bold())
                            .foregroundStyle(.red)
                        Text("Use passcode to unlock now")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 32)
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
                            .background(biometric.isInLockout ? Color.secondary.opacity(0.3) : Color.accentColor)
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .disabled(biometric.isInLockout)
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
            // Automatically trigger biometric prompt on appear (skipped during lockout)
            await biometric.unlock()
        }
    }
}
