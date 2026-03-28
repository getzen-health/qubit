import SwiftUI
import Charts

// MARK: - Models

struct CaffeineEntry: Identifiable, Codable {
    var id: UUID = UUID()
    var name: String
    var mgCaffeine: Int
    var timestamp: Date
}

// MARK: - ViewModel

@Observable
class CaffeineViewModel {
    var entries: [CaffeineEntry] = []
    var todayTotal: Int { entries.filter { Calendar.current.isDateInToday($0.timestamp) }.map(\.mgCaffeine).reduce(0, +) }
    var sleepCutoffMessage: String {
        let cutoff = Calendar.current.date(byAdding: .hour, value: 14, to: sleepTime) ?? sleepTime
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: cutoff)
    }

    var sleepTime: Date = Calendar.current.date(from: DateComponents(hour: 22, minute: 30)) ?? Date()
    var showAddSheet = false
    var selectedDrink: DrinkPreset?

    enum DrinkPreset: String, CaseIterable, Identifiable {
        case espresso = "Espresso"
        case coffee = "Coffee"
        case latte = "Latte"
        case greenTea = "Green Tea"
        case blackTea = "Black Tea"
        case energyDrink = "Energy Drink"
        case preworkout = "Pre-workout"
        case matcha = "Matcha"

        var id: String { rawValue }

        var mg: Int {
            switch self {
            case .espresso: return 63
            case .coffee: return 95
            case .latte: return 63
            case .greenTea: return 29
            case .blackTea: return 47
            case .energyDrink: return 80
            case .preworkout: return 200
            case .matcha: return 70
            }
        }

        var icon: String {
            switch self {
            case .espresso, .coffee, .latte: return "cup.and.saucer.fill"
            case .greenTea, .blackTea, .matcha: return "leaf.fill"
            case .energyDrink, .preworkout: return "bolt.fill"
            }
        }

        var color: Color {
            switch self {
            case .espresso, .coffee: return .brown
            case .latte: return Color(red: 0.8, green: 0.6, blue: 0.4)
            case .greenTea, .matcha: return .green
            case .blackTea: return Color(red: 0.6, green: 0.4, blue: 0.2)
            case .energyDrink: return .yellow
            case .preworkout: return .orange
            }
        }
    }

    var safeLimit: Int { 400 }
    var warningLevel: Int { 300 }

    var statusColor: Color {
        if todayTotal >= safeLimit { return .red }
        if todayTotal >= warningLevel { return .orange }
        return .green
    }

    var statusLabel: String {
        if todayTotal >= safeLimit { return "Over limit" }
        if todayTotal >= warningLevel { return "Near limit" }
        return "Good"
    }

    func add(_ preset: DrinkPreset) {
        entries.insert(CaffeineEntry(name: preset.rawValue, mgCaffeine: preset.mg, timestamp: Date()), at: 0)
    }

    func remove(_ entry: CaffeineEntry) {
        entries.removeAll { $0.id == entry.id }
    }

    // Half-life decay: caffeine half-life ~5-6h
    var currentCaffeineInSystem: Double {
        let now = Date()
        return entries.reduce(0.0) { acc, entry in
            let hoursAgo = now.timeIntervalSince(entry.timestamp) / 3600
            let remaining = Double(entry.mgCaffeine) * pow(0.5, hoursAgo / 5.5)
            return acc + remaining
        }
    }

    var last7Days: [(date: Date, mg: Int)] {
        let calendar = Calendar.current
        return (0..<7).reversed().map { daysAgo in
            let day = calendar.date(byAdding: .day, value: -daysAgo, to: Date())!
            let total = entries
                .filter { calendar.isDate($0.timestamp, inSameDayAs: day) }
                .map(\.mgCaffeine).reduce(0, +)
            return (date: day, mg: total)
        }
    }
}

// MARK: - Main View

struct CaffeineView: View {
    @State private var vm = CaffeineViewModel()
    @State private var customMg = 100
    @State private var customName = ""
    @State private var showCustom = false

    var body: some View {
        List {
            statusSection
            quickAddSection
            weekSection
            todaySection
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Caffeine")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showCustom) {
            customAddSheet
        }
    }

    // MARK: - Sections

    private var statusSection: some View {
        Section {
            VStack(spacing: 16) {
                // Gauge
                ZStack {
                    Circle()
                        .stroke(Color.secondary.opacity(0.2), lineWidth: 12)
                        .frame(width: 120, height: 120)
                    Circle()
                        .trim(from: 0, to: min(CGFloat(vm.todayTotal) / CGFloat(vm.safeLimit), 1.0))
                        .stroke(vm.statusColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut, value: vm.todayTotal)
                    VStack(spacing: 2) {
                        Text("\(vm.todayTotal)")
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                        Text("mg today")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

                HStack(spacing: 24) {
                    statPill(label: "Status", value: vm.statusLabel, color: vm.statusColor)
                    statPill(label: "In system", value: String(format: "%.0f mg", vm.currentCaffeineInSystem), color: .blue)
                    statPill(label: "Last caffeine\nbefore sleep", value: vm.sleepCutoffMessage, color: .purple)
                }

                Text("Daily limit: \(vm.safeLimit) mg (FDA recommendation)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 8)
        }
    }

    private var quickAddSection: some View {
        Section("Quick Add") {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(CaffeineViewModel.DrinkPreset.allCases) { preset in
                    Button {
                        vm.add(preset)
                        let impact = UIImpactFeedbackGenerator(style: .medium)
                        impact.impactOccurred()
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: preset.icon)
                                .font(.title2)
                                .foregroundStyle(preset.color)
                            Text(preset.rawValue)
                                .font(.caption2)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                            Text("\(preset.mg)mg")
                                .font(.caption2)
                                .bold()
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(preset.color.opacity(0.1))
                        .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 4)

            Button {
                showCustom = true
            } label: {
                Label("Add Custom", systemImage: "plus.circle")
            }
        }
    }

    private var weekSection: some View {
        Section("Last 7 Days") {
            Chart(vm.last7Days, id: \.date) { day in
                BarMark(
                    x: .value("Day", day.date, unit: .day),
                    y: .value("mg", day.mg)
                )
                .foregroundStyle(day.mg >= vm.safeLimit ? Color.red : Color.brown)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { value in
                    AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                }
            }
            .frame(height: 100)
        }
    }

    private var todaySection: some View {
        Section("Today's Log") {
            if vm.entries.filter({ Calendar.current.isDateInToday($0.timestamp) }).isEmpty {
                Text("No caffeine logged today")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)
            } else {
                ForEach(vm.entries.filter { Calendar.current.isDateInToday($0.timestamp) }) { entry in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(entry.name).font(.subheadline)
                            Text(entry.timestamp.kqFormatted(dateStyle: .none, timeStyle: .short))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(entry.mgCaffeine) mg").font(.subheadline).bold()
                    }
                }
                .onDelete { indexSet in
                    let todayEntries = vm.entries.filter { Calendar.current.isDateInToday($0.timestamp) }
                    indexSet.forEach { i in vm.remove(todayEntries[i]) }
                }
            }
        }
    }

    private var customAddSheet: some View {
        NavigationStack {
            Form {
                Section("Drink Name") {
                    TextField("e.g. Iced Coffee", text: $customName)
                }
                Section("Caffeine (mg)") {
                    Stepper("\(customMg) mg", value: $customMg, in: 1...1000, step: 5)
                }
            }
            .navigationTitle("Custom Drink")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let entry = CaffeineEntry(name: customName.isEmpty ? "Custom" : customName, mgCaffeine: customMg, timestamp: Date())
                        vm.entries.insert(entry, at: 0)
                        showCustom = false
                    }
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showCustom = false }
                }
            }
        }
    }

    @ViewBuilder
    private func statPill(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.caption).bold().foregroundStyle(color).multilineTextAlignment(.center)
            Text(label).font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    NavigationStack { CaffeineView() }
}
