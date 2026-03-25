import SwiftUI

struct PredictiveInsightsView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ContentUnavailableView(
                    "Week Ahead",
                    systemImage: "calendar.badge.clock",
                    description: Text("Predictive health insights are coming soon.")
                )
                .padding(.top, 60)
            }
            .padding(.horizontal, 16)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Week Ahead")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        PredictiveInsightsView()
    }
}
