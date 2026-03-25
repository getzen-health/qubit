import SwiftUI

enum HealthCardType {
    case workout(type: String, duration: Int, calories: Int, avgHR: Int)
    case sleep(hours: Double, efficiency: Int, deepMinutes: Int)
    case milestone(title: String, value: String, date: Date)
}

struct HealthShareCardView: View {
    let cardType: HealthCardType
    
    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(hex: "#1a1a2e"), Color(hex: "#16213e")],
                          startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: "k.circle.fill")
                        .foregroundColor(.purple)
                        .font(.title2)
                    Text("KQuarks")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    Text(Date(), style: .date)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                cardContent
                Spacer()
                Text("kquarks.app")
                    .font(.caption2)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            .padding(20)
        }
        .frame(width: 320, height: 180)
        .cornerRadius(16)
    }
    
    @ViewBuilder
    var cardContent: some View {
        switch cardType {
        case .workout(let type, let duration, let calories, let avgHR):
            HStack(spacing: 24) {
                VStack {
                    Text("\(duration / 60)m")
                        .font(.title).bold().foregroundColor(.white)
                    Text("Duration").font(.caption).foregroundColor(.gray)
                }
                VStack {
                    Text("\(calories)")
                        .font(.title).bold().foregroundColor(.orange)
                    Text("Cal").font(.caption).foregroundColor(.gray)
                }
                VStack {
                    Text("\(avgHR)")
                        .font(.title).bold().foregroundColor(.red)
                    Text("Avg BPM").font(.caption).foregroundColor(.gray)
                }
                Spacer()
                Text(type).font(.headline).foregroundColor(.purple)
            }
        case .sleep(let hours, let efficiency, let deepMinutes):
            HStack(spacing: 24) {
                VStack {
                    Text(String(format: "%.1fh", hours))
                        .font(.title).bold().foregroundColor(.white)
                    Text("Sleep").font(.caption).foregroundColor(.gray)
                }
                VStack {
                    Text("\(efficiency)%")
                        .font(.title).bold().foregroundColor(.blue)
                    Text("Efficiency").font(.caption).foregroundColor(.gray)
                }
                VStack {
                    Text("\(deepMinutes)m")
                        .font(.title).bold().foregroundColor(.indigo)
                    Text("Deep").font(.caption).foregroundColor(.gray)
                }
            }
        case .milestone(let title, let value, _):
            VStack(alignment: .leading, spacing: 8) {
                Text("🏆 \(title)").font(.headline).foregroundColor(.yellow)
                Text(value).font(.largeTitle).bold().foregroundColor(.white)
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
