import SwiftUI

struct ExportDataView: View {
    @State private var isExporting = false
    @State private var exportError: String?
    @State private var showingShareSheet = false
    @State private var exportURL: URL?

    @State private var includeHealthRecords = true
    @State private var includeWorkouts = true
    @State private var includeSleep = true
    @State private var includeFoodDiary = true
    @State private var includeBodyMeasurements = true

    private let supabase = SupabaseService.shared

    var body: some View {
        Form {
            Section {
                dataTypeToggle(
                    title: "Health Records",
                    subtitle: "Steps, heart rate, HRV, and more",
                    icon: "heart.text.square",
                    isIncluded: $includeHealthRecords
                )
                dataTypeToggle(
                    title: "Workouts",
                    subtitle: "Activity sessions and metrics",
                    icon: "figure.run",
                    isIncluded: $includeWorkouts
                )
                dataTypeToggle(
                    title: "Sleep",
                    subtitle: "Sleep stages and quality scores",
                    icon: "bed.double",
                    isIncluded: $includeSleep
                )
                dataTypeToggle(
                    title: "Food Diary",
                    subtitle: "Meals, calories, and nutrition",
                    icon: "fork.knife",
                    isIncluded: $includeFoodDiary
                )
                dataTypeToggle(
                    title: "Body Measurements",
                    subtitle: "Weight, body fat, and daily summaries",
                    icon: "scalemass",
                    isIncluded: $includeBodyMeasurements
                )
            } header: {
                Text("Select Data to Export")
            } footer: {
                Text("Your data will be exported as a JSON file that you can save, share, or import into other apps.")
            }

            if let errorMsg = exportError {
                Section {
                    Text(errorMsg)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button(action: startExport) {
                    HStack {
                        Spacer()
                        if isExporting {
                            ProgressView()
                                .padding(.trailing, 8)
                            Text("Preparing Export…")
                        } else {
                            Label("Export Selected Data", systemImage: "square.and.arrow.up")
                        }
                        Spacer()
                    }
                }
                .disabled(isExporting || !anySelected)
            }
        }
        .navigationTitle("Export Data")
        .toolbarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingShareSheet, onDismiss: cleanupExportFile) {
            if let url = exportURL {
                ShareSheet(items: [url])
            }
        }
    }

    private var anySelected: Bool {
        includeHealthRecords || includeWorkouts || includeSleep || includeFoodDiary || includeBodyMeasurements
    }

    @ViewBuilder
    private func dataTypeToggle(title: String, subtitle: String, icon: String, isIncluded: Binding<Bool>) -> some View {
        Toggle(isOn: isIncluded) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: icon)
            }
        }
    }

    private func startExport() {
        isExporting = true
        exportError = nil

        Task {
            do {
                let selection = ExportSelection(
                    healthRecords: includeHealthRecords,
                    workouts: includeWorkouts,
                    sleep: includeSleep,
                    foodDiary: includeFoodDiary,
                    bodyMeasurements: includeBodyMeasurements
                )
                let jsonData = try await supabase.exportAllUserData(selection: selection)

                let filename = "getzen-export-\(Date().kqFormat("yyyy-MM-dd")).json"
                guard let documentDir = FileManager.default
                    .urls(for: .documentDirectory, in: .userDomainMask).first else {
                    throw NSError(domain: "ExportData", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot access document directory"])
                }
                let fileURL = documentDir.appendingPathComponent(filename)
                try jsonData.write(to: fileURL)

                await MainActor.run {
                    exportURL = fileURL
                    isExporting = false
                    showingShareSheet = true
                }
            } catch {
                await MainActor.run {
                    exportError = error.localizedDescription
                    isExporting = false
                }
            }
        }
    }

    private func cleanupExportFile() {
        guard let url = exportURL else { return }
        try? FileManager.default.removeItem(at: url)
        exportURL = nil
    }
}

#Preview {
    NavigationStack {
        ExportDataView()
    }
}
