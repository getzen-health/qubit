import SwiftUI
import Charts

struct HRZoneDonutChart: View {
    let zones: [(name: String, minutes: Int, color: Color)]
    
    var totalMinutes: Int {
        zones.reduce(0) { $0 + $1.minutes }
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Donut chart
            Chart(zones.filter { $0.minutes > 0 }, id: \.name) { zone in
                SectorMark(
                    angle: .value("Minutes", zone.minutes),
                    innerRadius: .ratio(0.6),
                    angularInset: 1.5
                )
                .foregroundStyle(zone.color)
            }
            .frame(height: 180)
            
            // Legend
            VStack(spacing: 8) {
                ForEach(zones.filter { $0.minutes > 0 }, id: \.name) { zone in
                    let percentage = totalMinutes > 0 ? Double(zone.minutes) / Double(totalMinutes) * 100 : 0
                    HStack(spacing: 10) {
                        Circle()
                            .fill(zone.color)
                            .frame(width: 8, height: 8)
                        
                        Text(zone.name)
                            .font(.caption)
                            .foregroundStyle(.primary)
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(String(format: "%.0f min", Double(zone.minutes)))
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.primary)
                            Text(String(format: "%.1f%%", percentage))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.horizontal, 8)
                }
            }
            .padding(.vertical, 8)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    HRZoneDonutChart(zones: [
        ("Zone 1", 10, .blue),
        ("Zone 2", 25, .green),
        ("Zone 3", 20, .yellow),
        ("Zone 4", 30, .orange),
        ("Zone 5", 15, .red),
    ])
    .padding()
}
