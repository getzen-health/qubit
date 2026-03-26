import SwiftUI

struct WaterEntry: Identifiable, Codable {
    let id: String
    let amount_ml: Int
    let logged_at: String
}

@Observable
class WaterIntakeViewModel {
    var totalMl: Int = 0
    var logs: [WaterEntry] = []
    var isLoading = false
    let goalMl = 2000

    var percentage: Double { min(1.0, Double(totalMl) / Double(goalMl)) }

    func loadToday() async {
        isLoading = true
        // In production: fetch from Supabase
        isLoading = false
    }

    func addWater(_ ml: Int) async {
        totalMl += ml
        logs.insert(WaterEntry(
            id: UUID().uuidString,
            amount_ml: ml,
            logged_at: ISO8601DateFormatter().string(from: Date())
        ), at: 0)
        HapticService.impact(.light)
        // In production: POST to /api/water or Supabase directly
    }
}

struct WaterIntakeView: View {
    @State private var viewModel = WaterIntakeViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Progress ring
                    ZStack {
                        Circle()
                            .stroke(Color.blue.opacity(0.15), lineWidth: 16)
                            .frame(width: 160, height: 160)
                        Circle()
                            .trim(from: 0, to: viewModel.percentage)
                            .stroke(Color.blue, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                            .frame(width: 160, height: 160)
                            .rotationEffect(.degrees(-90))
                            .animation(.spring(), value: viewModel.percentage)
                        VStack(spacing: 2) {
                            Text("\(viewModel.totalMl)")
                                .font(.title.bold())
                                .foregroundColor(.blue)
                            Text("of \(viewModel.goalMl)ml")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.top)

                    // Quick add buttons
                    HStack(spacing: 10) {
                        ForEach([150, 250, 350, 500], id: \.self) { ml in
                            Button(action: {
                                Task { await viewModel.addWater(ml) }
                            }) {
                                Text("+\(ml)ml")
                                    .font(.subheadline.weight(.medium))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(12)
                            }
                        }
                    }
                    .padding(.horizontal)

                    // Today's log
                    if !viewModel.logs.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Today's Log")
                                .font(.headline)
                                .padding(.horizontal)
                            ForEach(viewModel.logs) { log in
                                HStack {
                                    Text("+\(log.amount_ml)ml")
                                        .font(.subheadline.weight(.medium))
                                    Spacer()
                                    Text(log.logged_at.prefix(10))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal)
                                .padding(.vertical, 4)
                                Divider().padding(.horizontal)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Water Intake")
            .task { await viewModel.loadToday() }
        }
    }
}
