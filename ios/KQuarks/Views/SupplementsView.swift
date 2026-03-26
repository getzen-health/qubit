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

struct SupplementsView: View {
    @State private var takenToday: Set<String> = []

    var body: some View {
        NavigationView {
            List(COMMON_SUPPLEMENTS) { supplement in
                HStack {
                    VStack(alignment: .leading) {
                        Text(supplement.name).font(.headline)
                        Text("\(supplement.dose) \(supplement.unit)").font(.caption).foregroundColor(.secondary)
                    }
                    Spacer()
                    if takenToday.contains(supplement.name) {
                        Label("Taken", systemImage: "checkmark.circle.fill")
                            .font(.subheadline)
                            .foregroundColor(.green)
                    } else {
                        Button("Log") {
                            takenToday.insert(supplement.name)
                            HapticService.impact(.medium)
                            // In production: POST to Supabase supplement_logs
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
