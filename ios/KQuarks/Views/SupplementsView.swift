import SwiftUI

struct Supplement: Identifiable {
    let id = UUID()
    let name: String
    let dose: String
    let unit: String
}

let COMMON_SUPPLEMENTS: [Supplement] = [
    Supplement(name: "Vitamin D3", dose: "2000", unit: "IU"),
    Supplement(name: "Vitamin B12", dose: "1000", unit: "mcg"),
    Supplement(name: "Omega-3", dose: "1000", unit: "mg"),
    Supplement(name: "Magnesium", dose: "400", unit: "mg"),
    Supplement(name: "Zinc", dose: "25", unit: "mg"),
    Supplement(name: "Iron", dose: "18", unit: "mg"),
    Supplement(name: "Calcium", dose: "500", unit: "mg"),
    Supplement(name: "Vitamin C", dose: "500", unit: "mg"),
]

@Observable
class SupplementsViewModel {
    var takenToday: Set<String> = []
    var errorMessage: String?

    func logSupplement(name: String) async {
        let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard !urlString.isEmpty, let url = URL(string: "\(urlString)/api/supplements") else {
            takenToday.insert(name)
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["name": name])
        _ = try? await URLSession.shared.data(for: request)
        takenToday.insert(name)
    }
}

struct SupplementsView: View {
    @State private var viewModel = SupplementsViewModel()

    var body: some View {
        NavigationStack {
            List(COMMON_SUPPLEMENTS) { supplement in
                HStack {
                    VStack(alignment: .leading) {
                        Text(supplement.name).font(.headline)
                        Text("\(supplement.dose) \(supplement.unit)").font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    if viewModel.takenToday.contains(supplement.name) {
                        Label("Taken", systemImage: "checkmark.circle.fill")
                            .font(.subheadline)
                            .foregroundStyle(.green)
                    } else {
                        Button("Log") {
                            Task {
                                await viewModel.logSupplement(name: supplement.name)
                                HapticService.impact(.medium)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                    }
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Supplements")
        }
    }
}
