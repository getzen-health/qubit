import SwiftUI

struct CorrelationsView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                Spacer(minLength: 40)

                Image(systemName: "chart.dots.scatter")
                    .font(.system(size: 64))
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    Text("Correlations")
                        .font(.title2.bold())

                    Text("Discover relationships between your health metrics")
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
        .navigationTitle("Correlations")
        .navigationBarTitleDisplayMode(.large)
    }
}

#Preview {
    NavigationStack {
        CorrelationsView()
    }
}
