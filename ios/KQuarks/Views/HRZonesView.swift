import SwiftUI

struct HRZone: Identifiable {
    let id: Int
    let name: String
    let minPct: Double
    let maxPct: Double
    let color: Color
    let benefit: String
}

let hrZones: [HRZone] = [
    HRZone(id: 1, name: "Recovery", minPct: 50, maxPct: 60, color: .blue, benefit: "Active recovery, fat burning"),
    HRZone(id: 2, name: "Aerobic Base", minPct: 60, maxPct: 70, color: .green, benefit: "Endurance, fat metabolism"),
    HRZone(id: 3, name: "Aerobic", minPct: 70, maxPct: 80, color: .yellow, benefit: "Cardio fitness"),
    HRZone(id: 4, name: "Threshold", minPct: 80, maxPct: 90, color: .orange, benefit: "Speed, lactate threshold"),
    HRZone(id: 5, name: "VO₂ Max", minPct: 90, maxPct: 100, color: .red, benefit: "Max performance"),
]

struct HRZonesView: View {
    @State private var age: Double = 30
    @State private var restingHR: Double = 60

    var maxHR: Int { 220 - Int(age) }
    var hrReserve: Double { Double(maxHR) - restingHR }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Age: \(Int(age))").font(.caption)
                    Slider(value: $age, in: 15...80, step: 1)
                    Text("Resting HR: \(Int(restingHR)) bpm").font(.caption)
                    Slider(value: $restingHR, in: 40...90, step: 1)
                    Text("Max HR: \(maxHR) bpm").font(.headline).foregroundColor(.red)
                }
                .padding()
                .background(Color(.systemGroupedBackground))
                .cornerRadius(12)

                ForEach(hrZones) { zone in
                    let minBPM = Int(restingHR + hrReserve * zone.minPct / 100)
                    let maxBPM = Int(restingHR + hrReserve * zone.maxPct / 100)
                    HStack(spacing: 12) {
                        Rectangle().fill(zone.color).frame(width: 6).cornerRadius(3)
                        VStack(alignment: .leading) {
                            HStack {
                                Text("Zone \(zone.id): \(zone.name)").fontWeight(.semibold)
                                Spacer()
                                Text("\(minBPM)–\(maxBPM) bpm").font(.caption).foregroundColor(.secondary)
                            }
                            Text(zone.benefit).font(.caption).foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.systemGroupedBackground))
                    .cornerRadius(12)
                }
            }
            .padding()
        }
        .navigationTitle("HR Zones")
    }
}
