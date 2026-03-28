import SwiftUI

struct RunningView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                Spacer(minLength: 40)

                Image(systemName: "figure.run")
                    .font(.system(size: 64))
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    Text("Running Analytics")
                        .font(.title2.bold())

                    Text("Analyze your runs, pace zones, cadence, and training load")
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
        .navigationTitle("Running")
        .navigationBarTitleDisplayMode(.large)
    }
}

#Preview {
    NavigationStack {
        RunningView()
    }
}
