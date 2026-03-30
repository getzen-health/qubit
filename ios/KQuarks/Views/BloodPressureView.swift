import SwiftUI
import Charts

// MARK: - BloodPressureView

struct BloodPressureView: View {
    @State private var readings: [HealthKitService.BPReading] = []
    @State private var isLoading = true
    @State private var showLogSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView().padding(.top, 40)
                } else if readings.isEmpty {
                    emptyState
                } else {
                    latestCard
                    if readings.count >= 3 {
                        trendChart
                    }
                    historyList
                }
            }
            .padding()
        }
        .background(Color.premiumBackground)
        .navigationTitle("Blood Pressure")
        .toolbarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                HStack {
                    NavigationLink(destination: BloodPressurePatternView()) {
                        Image(systemName: "chart.bar.xaxis")
                    }
                    Button {
                        showLogSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showLogSheet, onDismiss: {
            Task { await load() }
        }) {
            LogBPView()
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Latest Card

    private var latestCard: some View {
        VStack(spacing: 4) {
            if let latest = readings.first {
                let category = BPCategory.from(systolic: latest.systolic, diastolic: latest.diastolic)
                VStack(spacing: 8) {
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text("\(Int(latest.systolic))")
                            .font(.system(size: 56, weight: .thin, design: .rounded))
                        Text("/")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                        Text("\(Int(latest.diastolic))")
                            .font(.system(size: 56, weight: .thin, design: .rounded))
                        Text("mmHg")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 4)
                    }
                    .foregroundStyle(category.color)

                    Label(category.label, systemImage: category.icon)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(category.color)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 5)
                        .background(category.color.opacity(0.1))
                        .clipShape(Capsule())

                    Text(latest.date.formatted(date: .abbreviated, time: .shortened))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(20)
                .background(Color.premiumBackground)
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }
        }
    }

    // MARK: - Chart

    private var bpChartDomain: ClosedRange<Double> {
        let allValues = readings.flatMap { [$0.diastolic, $0.systolic] }
        let lo = allValues.min().map { max(50.0, $0 - 10) } ?? 50
        let hi = allValues.max().map { max(180.0, $0 + 10) } ?? 180
        return lo...hi
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("30-Day Trend")
                .font(.headline)

            Chart {
                ForEach(readings.reversed()) { reading in
                    LineMark(
                        x: .value("Date", reading.date),
                        y: .value("mmHg", reading.systolic)
                    )
                    .foregroundStyle(.red.opacity(0.7))
                    .symbol(.circle)
                    .symbolSize(30)

                    LineMark(
                        x: .value("Date", reading.date),
                        y: .value("mmHg", reading.diastolic)
                    )
                    .foregroundStyle(.blue.opacity(0.7))
                    .symbol(.circle)
                    .symbolSize(30)
                }

                // Normal range reference bands
                RuleMark(y: .value("Systolic Normal", 120))
                    .foregroundStyle(.red.opacity(0.2))
                    .lineStyle(StrokeStyle(dash: [4]))
                RuleMark(y: .value("Diastolic Normal", 80))
                    .foregroundStyle(.blue.opacity(0.2))
                    .lineStyle(StrokeStyle(dash: [4]))
            }
            .frame(height: 200)
            .chartYScale(domain: bpChartDomain)

            HStack(spacing: 16) {
                Label("Systolic", systemImage: "circle.fill")
                    .font(.caption)
                    .foregroundStyle(.red.opacity(0.7))
                Label("Diastolic", systemImage: "circle.fill")
                    .font(.caption)
                    .foregroundStyle(.blue.opacity(0.7))
            }
        }
        .padding()
        .background(Color.premiumBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - History List

    private var historyList: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("History")
                .font(.headline)
                .padding(.horizontal)
                .padding(.bottom, 8)

            VStack(spacing: 0) {
                ForEach(Array(readings.prefix(20).enumerated()), id: \.offset) { (idx, reading) in
                    let category = BPCategory.from(systolic: reading.systolic, diastolic: reading.diastolic)
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(Int(reading.systolic))/\(Int(reading.diastolic)) mmHg")
                                .font(.subheadline.weight(.medium))
                            Text(reading.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(category.label)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(category.color)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(category.color.opacity(0.1))
                            .clipShape(Capsule())
                    }
                    .padding()
                    if idx < min(readings.count, 20) - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .background(Color.premiumBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "heart.text.clipboard")
                .font(.system(size: 48))
                .foregroundStyle(.red.opacity(0.5))
            Text("No Readings Yet")
                .font(.title3.bold())
            Text("Tap + to log your blood pressure manually or connect a compatible device through Apple Health.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Log Reading") { showLogSheet = true }
                .buttonStyle(.borderedProminent)
                .tint(.red)
                .padding(.top, 4)
        }
        .padding(.top, 60)
    }

    private func load() async {
        isLoading = true
        readings = (try? await HealthKitService.shared.fetchBloodPressureReadings(days: 30)) ?? []
        isLoading = false
    }
}

// MARK: - Log BP Sheet

struct LogBPView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var systolicText = ""
    @State private var diastolicText = ""
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMsg = ""

    var isValid: Bool {
        guard let sys = Int(systolicText), let dia = Int(diastolicText) else { return false }
        return sys >= 60 && sys <= 250 && dia >= 40 && dia <= 150
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Label("Systolic", systemImage: "arrow.up.heart")
                            .foregroundStyle(.red)
                        Spacer()
                        TextField("120", text: $systolicText)
                            #if os(iOS)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            #endif
                            .frame(width: 60)
                        Text("mmHg")
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        Label("Diastolic", systemImage: "arrow.down.heart")
                            .foregroundStyle(.blue)
                        Spacer()
                        TextField("80", text: $diastolicText)
                            #if os(iOS)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            #endif
                            .frame(width: 60)
                        Text("mmHg")
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("Reading")
                } footer: {
                    if let sys = Int(systolicText), let dia = Int(diastolicText), isValid {
                        let cat = BPCategory.from(systolic: Double(sys), diastolic: Double(dia))
                        Label(cat.label + " — " + cat.advice, systemImage: cat.icon)
                            .foregroundStyle(cat.color)
                    }
                }

                Section("Reference") {
                    BPReferenceRow(label: "Normal", range: "< 120 / < 80", color: .green)
                    BPReferenceRow(label: "Elevated", range: "120–129 / < 80", color: .yellow)
                    BPReferenceRow(label: "High Stage 1", range: "130–139 / 80–89", color: .orange)
                    BPReferenceRow(label: "High Stage 2", range: "≥ 140 / ≥ 90", color: .red)
                }
            }
            .navigationTitle("Log Blood Pressure")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .bold()
                    .disabled(!isValid || isSaving)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: { Text(errorMsg) }
        }
    }

    private func save() async {
        guard let sys = Double(systolicText), let dia = Double(diastolicText) else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            try await HealthKitService.shared.saveBloodPressure(systolic: sys, diastolic: dia)
            #if os(iOS)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            #endif
            dismiss()
        } catch {
            errorMsg = error.localizedDescription
            showError = true
        }
    }
}

private struct BPReferenceRow: View {
    let label: String
    let range: String
    let color: Color

    var body: some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(.subheadline)
            Spacer()
            Text(range)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - BP Category

struct BPCategory {
    let label: String
    let icon: String
    let color: Color
    let advice: String

    static func from(systolic: Double, diastolic: Double) -> BPCategory {
        if systolic >= 180 || diastolic >= 120 {
            return BPCategory(label: "Crisis", icon: "exclamationmark.triangle.fill", color: .red, advice: "Seek medical attention immediately")
        }
        if systolic >= 140 || diastolic >= 90 {
            return BPCategory(label: "High Stage 2", icon: "heart.slash.fill", color: .red, advice: "Consult a doctor soon")
        }
        if systolic >= 130 || diastolic >= 80 {
            return BPCategory(label: "High Stage 1", icon: "heart.fill", color: .orange, advice: "Monitor closely and consider lifestyle changes")
        }
        if systolic >= 120 && diastolic < 80 {
            return BPCategory(label: "Elevated", icon: "arrow.up.heart.fill", color: .yellow, advice: "Healthy habits can prevent hypertension")
        }
        return BPCategory(label: "Normal", icon: "checkmark.circle.fill", color: .green, advice: "Great! Keep up the healthy lifestyle")
    }
}

#Preview {
    NavigationStack {
        BloodPressureView()
    }
}
