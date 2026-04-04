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
        ZStack {
            PremiumBackgroundView()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 20) {
                    statusSection
                    quickAddSection
                    weekSection
                    todaySection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 100)
            }
        }
        .navigationTitle("Caffeine")
        .navigationBarTitleDisplayMode(.large)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .sheet(isPresented: $showCustom) {
            customAddSheet
        }
        .preferredColorScheme(.dark)
    }

    private func caffeineSectionHeader(_ title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.brown.opacity(0.6))
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.5))
                .textCase(.uppercase)
                .tracking(0.8)
        }
        .padding(.leading, 4)
    }

    // MARK: - Sections

    private var statusSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.06), lineWidth: 14)
                    .frame(width: 130, height: 130)
                Circle()
                    .trim(from: 0, to: min(CGFloat(vm.todayTotal) / CGFloat(vm.safeLimit), 1.0))
                    .stroke(
                        LinearGradient(
                            colors: [vm.statusColor, vm.statusColor.opacity(0.5)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .frame(width: 130, height: 130)
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.8, dampingFraction: 0.7), value: vm.todayTotal)
                Circle()
                    .trim(from: 0, to: min(CGFloat(vm.todayTotal) / CGFloat(vm.safeLimit), 1.0))
                    .stroke(vm.statusColor.opacity(0.3), lineWidth: 20)
                    .frame(width: 130, height: 130)
                    .rotationEffect(.degrees(-90))
                    .blur(radius: 10)
                VStack(spacing: 2) {
                    Text("\(vm.todayTotal)")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [vm.statusColor, vm.statusColor.opacity(0.6)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                    Text("mg today")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.35))
                        .textCase(.uppercase)
                        .tracking(1)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 16)

            HStack(spacing: 24) {
                statPill(label: "Status", value: vm.statusLabel, color: vm.statusColor)
                statPill(label: "In system", value: String(format: "%.0f mg", vm.currentCaffeineInSystem), color: .blue)
                statPill(label: "Last caffeine\nbefore sleep", value: vm.sleepCutoffMessage, color: .purple)
            }

            Text("Daily limit: \(vm.safeLimit) mg (FDA recommendation)")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.3))
        }
        .padding(.vertical, 12)
        .premiumCard(cornerRadius: 20, tint: vm.statusColor, tintOpacity: 0.03, gradientBorder: true)
    }

    private var quickAddSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            caffeineSectionHeader("Quick Add", icon: "plus.circle.fill")

            VStack(spacing: 12) {
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
                                Text(LocalizedStringKey(preset.rawValue))
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.6))
                                    .multilineTextAlignment(.center)
                                    .lineLimit(2)
                                Text("\(preset.mg)mg")
                                    .font(.system(size: 10, weight: .bold, design: .rounded))
                                    .foregroundStyle(preset.color.opacity(0.8))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(preset.color.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(preset.color.opacity(0.15), lineWidth: 0.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                Button {
                    showCustom = true
                } label: {
                    HStack {
                        Image(systemName: "plus.circle")
                            .foregroundStyle(.brown.opacity(0.6))
                        Text("Add Custom")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.cardSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                }
                .buttonStyle(.plain)
            }
            .premiumCard(cornerRadius: 18, tint: .brown, tintOpacity: 0.02)
        }
    }

    private var weekSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            caffeineSectionHeader("Last 7 Days", icon: "chart.bar.fill")

            VStack {
                Chart(vm.last7Days, id: \.date) { day in
                    BarMark(
                        x: .value("Day", day.date, unit: .day),
                        y: .value("mg", day.mg)
                    )
                    .foregroundStyle(
                        day.mg >= vm.safeLimit
                            ? LinearGradient(colors: [.red, .red.opacity(0.5)], startPoint: .top, endPoint: .bottom)
                            : LinearGradient(colors: [.brown, .brown.opacity(0.4)], startPoint: .top, endPoint: .bottom)
                    )
                    .cornerRadius(4)
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.white.opacity(0.4))
                    }
                }
                .chartYAxis {
                    AxisMarks { value in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.3))
                            .foregroundStyle(.white.opacity(0.06))
                        AxisValueLabel()
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.white.opacity(0.3))
                    }
                }
                .chartPlotStyle { plotArea in
                    plotArea.background(Color.clear)
                }
                .frame(height: 100)
                .padding(.vertical, 8)
                .padding(.horizontal, 4)
            }
            .premiumCard(cornerRadius: 18, tint: .brown, tintOpacity: 0.02)
        }
    }

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            caffeineSectionHeader("Today's Log", icon: "list.bullet")

            VStack(spacing: 0) {
                let todayEntries = vm.entries.filter { Calendar.current.isDateInToday($0.timestamp) }
                if todayEntries.isEmpty {
                    Text("No caffeine logged today")
                        .foregroundStyle(.white.opacity(0.35))
                        .font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 24)
                } else {
                    ForEach(Array(todayEntries.enumerated()), id: \.element.id) { index, entry in
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(entry.name)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.85))
                                Text(entry.timestamp.kqFormatted(dateStyle: .none, timeStyle: .short))
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.3))
                            }
                            Spacer()
                            Text("\(entry.mgCaffeine) mg")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(.brown)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .contextMenu {
                            Button(role: .destructive) {
                                vm.remove(entry)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }

                        if index < todayEntries.count - 1 {
                            Color.premiumDivider
                                .frame(height: 0.5)
                                .padding(.leading, 16)
                        }
                    }
                }
            }
            .premiumCard(cornerRadius: 18, tint: .brown, tintOpacity: 0.02)
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
            Text(value)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(color)
                .multilineTextAlignment(.center)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.white.opacity(0.35))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    NavigationStack { CaffeineView() }
}
