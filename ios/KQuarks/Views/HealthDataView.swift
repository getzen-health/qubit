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
                        NavigationLink(destination: HabitsView()) {
                            Image(systemName: "checklist")
                        }
                        NavigationLink(destination: CheckinView()) {
                            Image(systemName: "face.smiling")
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
