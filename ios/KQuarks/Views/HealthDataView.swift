import SwiftUI

struct HealthDataView: View {
    @State private var selectedCategory: HealthCategory = .activity

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category picker
                Picker("Category", selection: $selectedCategory) {
                    ForEach(HealthCategory.allCases, id: \.self) { category in
                        Text(category.title).tag(category)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                ScrollView {
                    LazyVStack(spacing: 16) {
                        if selectedCategory == .sleep {
                            NavigationLink(destination: SleepView()) {
                                HStack {
                                    Image(systemName: "moon.fill")
                                        .font(.title2)
                                        .foregroundStyle(.indigo)
                                        .frame(width: 44, height: 44)
                                        .background(Color.indigo.opacity(0.1))
                                        .cornerRadius(10)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Sleep History")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Last 30 nights")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: WristTemperatureView()) {
                                HStack {
                                    Image(systemName: "thermometer.medium")
                                        .font(.title2)
                                        .foregroundStyle(.orange)
                                        .frame(width: 44, height: 44)
                                        .background(Color.orange.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Wrist Temperature")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Nightly deviation (Series 8+)")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)
                        } else if selectedCategory == .body {
                            NavigationLink(destination: BodyCompositionView()) {
                                HStack {
                                    Image(systemName: "scalemass.fill")
                                        .font(.title2)
                                        .foregroundStyle(.mint)
                                        .frame(width: 44, height: 44)
                                        .background(Color.mint.opacity(0.1))
                                        .cornerRadius(10)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Body Weight")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Trend chart and history")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Blood Glucose (CGM)
                            NavigationLink(destination: BloodGlucoseView()) {
                                HStack {
                                    Image(systemName: "drop.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Blood Glucose")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("CGM, time in range & est. A1C")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            ForEach(selectedCategory.dataTypes.filter { $0 != .weight }, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        } else if selectedCategory == .heart {
                            // VO2 Max / Cardio Fitness
                            NavigationLink(destination: VO2MaxView()) {
                                HStack {
                                    Image(systemName: "lungs.fill")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Cardio Fitness (VO₂ Max)")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Trend and fitness level")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Race Predictor
                            NavigationLink(destination: RacePredictorView()) {
                                HStack {
                                    Image(systemName: "stopwatch.fill")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Race Predictor")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("5K, 10K, half & full marathon")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Respiratory Rate
                            NavigationLink(destination: RespiratoryRateView()) {
                                HStack {
                                    Image(systemName: "wind")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Respiratory Rate")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Breathing rate during sleep")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Blood Oxygen (SpO₂)
                            NavigationLink(destination: BloodOxygenView()) {
                                HStack {
                                    Image(systemName: "lungs")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Blood Oxygen (SpO₂)")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("30-day trend & low alerts")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Resting Heart Rate trend
                            NavigationLink(destination: RHRTrendView()) {
                                HStack {
                                    Image(systemName: "heart.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Resting Heart Rate")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("6-month trend & fitness zone")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // HRV deep-dive
                            NavigationLink(destination: HRVDetailView()) {
                                HStack {
                                    Image(systemName: "waveform.path.ecg")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("HRV Analysis")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Baseline, trends, patterns")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Cardiac Events (AFib, high HR, low HR)
                            NavigationLink(destination: CardiacEventsView()) {
                                HStack {
                                    Image(systemName: "heart.text.clipboard.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Cardiac Events")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("High HR, low HR & irregular rhythm")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            // Blood pressure gets its own detailed view
                            NavigationLink(destination: BloodPressureView()) {
                                HStack {
                                    Image(systemName: "heart.text.clipboard")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.1))
                                        .cornerRadius(10)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Blood Pressure")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Log and track readings")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        } else if selectedCategory == .activity {
                            NavigationLink(destination: ActivityRingsHistoryView()) {
                                HStack {
                                    Image(systemName: "rays")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Activity Rings")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("30-day ring close history")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: ActivityHeatmapView()) {
                                HStack {
                                    Image(systemName: "calendar.badge.clock")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Activity Calendar")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("365-day heatmap")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: MobilityView()) {
                                HStack {
                                    Image(systemName: "figure.walk.motion")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Mobility")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Walking speed, step length & gait")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: DaylightExposureView()) {
                                HStack {
                                    Image(systemName: "sun.max.fill")
                                        .font(.title2)
                                        .foregroundStyle(.orange)
                                        .frame(width: 44, height: 44)
                                        .background(Color.orange.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Daylight Exposure")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Outdoor light for circadian health")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: HearingHealthView()) {
                                HStack {
                                    Image(systemName: "ear")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.1))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Hearing Health")
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text("Noise & headphone exposure")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)
                            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        } else {
                            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Health Data")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 4) {
                        NavigationLink(destination: HistoryView()) {
                            Image(systemName: "calendar")
                        }
                        NavigationLink(destination: HabitsView()) {
                            Image(systemName: "checklist")
                        }
                        NavigationLink(destination: RecordsView()) {
                            Image(systemName: "trophy")
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Health Category

enum HealthCategory: CaseIterable {
    case activity
    case heart
    case sleep
    case body

    var title: String {
        switch self {
        case .activity: return "Activity"
        case .heart: return "Heart"
        case .sleep: return "Sleep"
        case .body: return "Body"
        }
    }

    var dataTypes: [HealthDataType] {
        switch self {
        case .activity:
            return [.steps, .distance, .activeCalories, .floorsClimbed]
        case .heart:
            return [.heartRate, .restingHeartRate, .hrv]
        case .sleep:
            return [] // Sleep has its own view
        case .body:
            return [.weight, .bodyFat]
        }
    }
}

// MARK: - Health Data Row

struct HealthDataRow: View {
    let dataType: HealthDataType
    @State private var latestValue: Double?
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    var body: some View {
        NavigationLink(destination: HealthMetricDetailView(dataType: dataType)) {
            HStack {
                Image(systemName: dataType.icon)
                    .font(.title2)
                    .foregroundColor(.accentColor)
                    .frame(width: 44, height: 44)
                    .background(Color.accentColor.opacity(0.1))
                    .cornerRadius(10)

                VStack(alignment: .leading, spacing: 4) {
                    Text(dataType.displayName)
                        .font(.headline)

                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else if let value = latestValue {
                        Text(formatValue(value, for: dataType))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    } else {
                        Text("No data")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
        .task {
            await loadData()
        }
    }

    private func loadData() async {
        isLoading = true

        do {
            let identifier = dataType.healthKitIdentifier
            if let id = identifier {
                latestValue = try await healthKit.fetchLatest(for: id)
            }
        } catch {
            // Silently fail
        }

        isLoading = false
    }

    private func formatValue(_ value: Double, for type: HealthDataType) -> String {
        switch type {
        case .steps, .floorsClimbed:
            return "\(Int(value))"
        case .distance:
            return String(format: "%.2f km", value / 1000)
        case .activeCalories, .totalCalories:
            return "\(Int(value)) kcal"
        case .heartRate, .restingHeartRate:
            return "\(Int(value)) bpm"
        case .hrv:
            return "\(Int(value)) ms"
        case .weight:
            return String(format: "%.1f kg", value)
        case .bodyFat:
            return String(format: "%.1f%%", value * 100)
        default:
            return String(format: "%.1f", value)
        }
    }
}

// MARK: - HealthKit Identifier Extension

extension HealthDataType {
    var healthKitIdentifier: HKQuantityTypeIdentifier? {
        switch self {
        case .steps: return .stepCount
        case .distance: return .distanceWalkingRunning
        case .activeCalories: return .activeEnergyBurned
        case .totalCalories: return .basalEnergyBurned
        case .floorsClimbed: return .flightsClimbed
        case .heartRate: return .heartRate
        case .restingHeartRate: return .restingHeartRate
        case .hrv: return .heartRateVariabilitySDNN
        case .weight: return .bodyMass
        case .bodyFat: return .bodyFatPercentage
        case .oxygenSaturation: return .oxygenSaturation
        case .respiratoryRate: return .respiratoryRate
        case .bloodPressureSystolic: return .bloodPressureSystolic
        case .bloodPressureDiastolic: return .bloodPressureDiastolic
        }
    }
}

import HealthKit

#Preview {
    HealthDataView()
}
