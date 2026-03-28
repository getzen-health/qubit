import SwiftUI
import HealthKit

struct GlucoseView: View {
    @State private var entries: [GlucoseEntry] = []
    @State private var showLogSheet = false
    @State private var logValue = ""
    @State private var logContext = "fasting"
    @State private var isLoading = true

    let contexts = ["fasting", "post_meal", "pre_meal", "random", "bedtime"]
    let contextLabels = ["Fasting", "Post-meal", "Pre-meal", "Random", "Bedtime"]

    struct GlucoseEntry: Identifiable, Decodable {
        let id: String
        let value_mmol: Double
        let value_mgdl: Int
        let context: String
        let logged_at: String
    }

    var body: some View {
        List {
            Section {
                if isLoading {
                    ProgressView()
                } else if entries.isEmpty {
                    Text("No glucose readings yet. Tap + to log one.")
                        .foregroundStyle(.secondary).font(.subheadline)
                } else {
                    ForEach(entries.prefix(20)) { entry in
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                HStack {
                                    Text(String(format: "%.1f mmol/L", entry.value_mmol)).font(.subheadline.bold())
                                    Text("(\(entry.value_mgdl) mg/dL)").font(.caption).foregroundStyle(.secondary)
                                    Text(statusLabel(entry.value_mmol, context: entry.context))
                                        .font(.caption.bold())
                                        .foregroundStyle(statusColor(entry.value_mmol, context: entry.context))
                                }
                                Text(contextLabel(entry.context) + " · " + formatDate(entry.logged_at))
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Blood Glucose")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button { showLogSheet = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showLogSheet) {
            NavigationStack {
                Form {
                    Section("Reading") {
                        TextField("Glucose (mmol/L)", text: $logValue).keyboardType(.decimalPad)
                        Picker("Context", selection: $logContext) {
                            ForEach(0..<contexts.count, id: \ .self) { i in
                                Text(contextLabels[i]).tag(contexts[i])
                            }
                        }
                    }
                }
                .navigationTitle("Log Glucose")
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) { Button("Cancel") { showLogSheet = false } }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Save") {
                            Task { await saveEntry(); showLogSheet = false }
                        }.disabled(logValue.isEmpty)
                    }
                }
            }
        }
        .task { await loadEntries() }
    }

    func statusLabel(_ value: Double, context: String) -> String {
        let high = context == "fasting" ? 5.6 : 7.8
        if value < 3.9 { return "Low" }
        if value <= high { return "Normal" }
        return "High"
    }

    func statusColor(_ value: Double, context: String) -> Color {
        switch statusLabel(value, context: context) {
        case "Low", "High": return .red
        case "Normal": return .green
        default: return .orange
        }
    }

    func contextLabel(_ c: String) -> String {
        let map = ["fasting":"Fasting","post_meal":"Post-meal","pre_meal":"Pre-meal","random":"Random","bedtime":"Bedtime"]
        return map[c] ?? c
    }

    func formatDate(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        guard let date = f.date(from: iso) else { return iso }
        let df = DateFormatter(); df.dateStyle = .short; df.timeStyle = .short
        return df.string(from: date)
    }

    @State private var errorMessage = ""

    func loadEntries() async {
        isLoading = true
        defer { isLoading = false }

        let baseString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard !baseString.isEmpty, let url = URL(string: "\(baseString)/api/glucose") else { return }

        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return }
            struct ResponseBody: Decodable { let data: [GlucoseEntry] }
            if let body = try? JSONDecoder().decode(ResponseBody.self, from: data) {
                entries = body.data
            }
        } catch {
            #if DEBUG
            print("[GlucoseView] loadEntries error: \(error)")
            #endif
        }
    }

    func saveEntry() async {
        guard let value = Double(logValue), value >= 0.1, value <= 30.0 else {
            errorMessage = "Enter a valid glucose value (0.1–30 mmol/L)"
            return
        }

        let baseString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard !baseString.isEmpty, let url = URL(string: "\(baseString)/api/glucose") else {
            errorMessage = "Configuration error"
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["value_mmol": value, "context": logContext]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let status = (response as? HTTPURLResponse)?.statusCode, status == 200 || status == 201 {
                logValue = ""
                errorMessage = ""
                await loadEntries()
            } else {
                errorMessage = "Failed to save reading"
            }
        } catch {
            errorMessage = "Network error"
            #if DEBUG
            print("[GlucoseView] saveEntry error: \(error)")
            #endif
        }
    }
}
