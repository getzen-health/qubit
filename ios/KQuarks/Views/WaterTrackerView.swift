import SwiftUI

struct WaterTrackerView: View {
    @State private var totalMl: Int = 0
    @State private var entries: [WaterEntry] = []
    @State private var customAmount: String = ""
    @State private var isLoading = true
    
    private let goalMl = 2500
    private let quickAmounts = [200, 300, 500, 750]
    
    struct WaterEntry: Identifiable, Decodable {
        let id: String
        let amount_ml: Int
        let logged_at: String
    }
    
    var progress: Double { Double(totalMl) / Double(goalMl) }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Progress ring
                ZStack {
                    Circle()
                        .stroke(Color.blue.opacity(0.2), lineWidth: 16)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(Color.blue, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.5), value: progress)
                    VStack(spacing: 4) {
                        Image(systemName: "drop.fill")
                            .foregroundColor(.blue)
                        Text(String(format: "%.1fL", Double(totalMl)/1000))
                            .font(.title2.bold())
                        Text("of \(goalMl/1000)L")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 160, height: 160)
                .padding(.top)
                
                // Quick add buttons
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 12) {
                    ForEach(quickAmounts, id: \ .self) { ml in
                        Button {
                            Task { await addWater(ml: ml) }
                        } label: {
                            VStack(spacing: 4) {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(.blue)
                                Text("\(ml)ml")
                                    .font(.caption.bold())
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Today's entries
                VStack(alignment: .leading, spacing: 8) {
                    Text("Today's Log")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    if entries.isEmpty {
                        Text("No entries yet")
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        ForEach(entries) { entry in
                            HStack {
                                Image(systemName: "drop.fill")
                                    .foregroundColor(.blue)
                                Text("\(entry.amount_ml) ml")
                                    .font(.subheadline.bold())
                                Spacer()
                                Text(formatTime(entry.logged_at))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal)
                            .padding(.vertical, 8)
                        }
                    }
                }
            }
        }
        .navigationTitle("Water Tracker")
        .task { await loadData() }
    }
    
    private func loadData() async {
        guard let url = URL(string: "\(supabaseURL)/functions/v1/water") else { return }
        // Use the API endpoint - simplified for now
        isLoading = false
    }
    
    private func addWater(ml: Int) async {
        // POST to /api/water
        guard let supaURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let url = URL(string: "\(supaURL)/functions/v1/water-log") else { return }
        _ = url // Will be integrated with full API when backend is deployed
        
        // Optimistic update
        totalMl += ml
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    
    private func formatTime(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: isoString) else { return "" }
        let tf = DateFormatter()
        tf.timeStyle = .short
        return tf.string(from: date)
    }
    
    private var supabaseURL: String {
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
    }
}
