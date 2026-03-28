import SwiftUI

struct RecoveryView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                Spacer(minLength: 40)

                Image(systemName: "bolt.heart.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    Text("Recovery")
                        .font(.title2.bold())

                    Text("Monitor your recovery score based on HRV, sleep, and resting heart rate")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }

                Label("Coming Soon", systemImage: "clock")
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.accentColor, in: Capsule())

                Spacer(minLength: 40)
            }
        }
        .navigationTitle("Recovery")
        .navigationBarTitleDisplayMode(.large)
    }
}

#Preview {
    NavigationStack {
        RecoveryView()
    }
}
