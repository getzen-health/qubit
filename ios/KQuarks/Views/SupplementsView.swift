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
        if let (_, response) = try? await URLSession.shared.data(for: request),
           let http = response as? HTTPURLResponse, http.statusCode == 201 {
            takenToday.insert(name)
        } else {
            takenToday.insert(name) // Still mark locally for UX
            errorMessage = "Saved locally — sync pending"
        }
    }
}

struct SupplementsView: View {
    @State private var viewModel = SupplementsViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                PremiumBackgroundView()
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 20) {
                        VStack(alignment: .leading, spacing: 10) {
                            PremiumSectionHeader(title: "DAILY SUPPLEMENTS", icon: "pill.fill", tint: .green)
                            VStack(spacing: 0) {
                                ForEach(Array(COMMON_SUPPLEMENTS.enumerated()), id: \.element.id) { index, supplement in
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text(supplement.name)
                                                .font(.system(size: 16, weight: .semibold))
                                                .foregroundStyle(.white.opacity(0.85))
                                            Text("\(supplement.dose) \(supplement.unit)")
                                                .font(.system(size: 13))
                                                .foregroundStyle(.white.opacity(0.4))
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
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 6)
                                            .background(LinearGradient(colors: [.green, .green.opacity(0.7)], startPoint: .leading, endPoint: .trailing))
                                            .clipShape(Capsule())
                                        }
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 10)
                                    if index < COMMON_SUPPLEMENTS.count - 1 {
                                        Color.premiumDivider.frame(height: 0.5)
                                    }
                                }
                            }
                            .premiumCard(cornerRadius: 18, tint: .green, tintOpacity: 0.02)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Supplements")
            .toolbarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .preferredColorScheme(.dark)
    }
}
