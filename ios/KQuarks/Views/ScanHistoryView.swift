import SwiftUI

struct ScanHistoryItem: Identifiable, Decodable {
    let id: String
    let product_name: String
    let brand: String?
    let score: Int?
    let image_url: String?
    let scanned_at: String
}

struct ScanHistoryResponse: Decodable {
    let data: [ScanHistoryItem]
}

struct ScanHistoryView: View {
    @State private var items: [ScanHistoryItem] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading history...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if items.isEmpty {
                    VStack(spacing: 16) {
                        Text("📦")
                            .font(.system(size: 60))
                        Text("No scans yet")
                            .font(.headline)
                        Text("Scan a product barcode to see it here")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    List { ForEach(items, id: \.id) { item in
                        HStack(spacing: 12) {
                            // Score badge
                            if let score = item.score {
                                ZStack {
                                    Circle()
                                        .fill(scoreColor(score))
                                        .frame(width: 44, height: 44)
                                    Text("\(score)")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                            } else {
                                Circle()
                                    .fill(Color.secondary.opacity(0.2))
                                    .frame(width: 44, height: 44)
                                    .overlay(Text("?").font(.headline).foregroundStyle(.secondary))
                            }
                            
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.product_name)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .lineLimit(2)
                                if let brand = item.brand {
                                    Text(brand)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                if let date = ISO8601DateFormatter().date(from: item.scanned_at) {
                                    Text(date, style: .relative)
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            Spacer()
                            let shareText = "I just checked \(item.product_name) on KQuarks — it scored \(item.score ?? 0)/100 for health!"
                            ShareLink(item: shareText) {
                                Image(systemName: "square.and.arrow.up")
                                    .foregroundStyle(Color.accentColor)
                            }
                        }
                        .padding(.vertical, 4)
                    }  // end ForEach
                     }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Scan History")
            .navigationBarTitleDisplayMode(.large)
            .task { await loadHistory() }
        }
    }
    
    func scoreColor(_ score: Int) -> Color {
        if score >= 75 { return .green }
        if score >= 50 { return .orange }
        return .red
    }
    
    func loadHistory() async {
        isLoading = true
        defer { isLoading = false }
        
        guard let baseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ProcessInfo.processInfo.environment["SUPABASE_URL"],
              let url = URL(string: "\(baseURL)/api/scanner/history") else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(ScanHistoryResponse.self, from: data)
            await MainActor.run { items = response.data }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
        }
    }
}

#Preview { ScanHistoryView() }
