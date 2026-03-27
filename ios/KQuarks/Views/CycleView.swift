import SwiftUI

struct CycleView: View {
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var phase: String = "menstrual"
    @State private var symptoms: [String] = []
    @State private var notes: String = ""
    @State private var isLoading = true
    @State private var successMessage: String?
    @State private var errorMessage: String?

    let phases = ["menstrual", "follicular", "ovulation", "luteal"]
    let symptomOptions = ["Cramps", "Headache", "Bloating", "Fatigue", "Mood swings", "Breast tenderness", "Back pain", "Nausea"]

    var body: some View {
        NavigationView {
            Form {
                Section("Cycle Dates") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }
                Section("Phase") {
                    Picker("Phase", selection: $phase) {
                        ForEach(phases, id: \.self) { Text($0.capitalized) }
                    }.pickerStyle(.segmented)
                }
                Section("Symptoms") {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) {
                        ForEach(symptomOptions, id: \.self) { symptom in
                            Button(action: { toggleSymptom(symptom) }) {
                                HStack {
                                    Image(systemName: symptoms.contains(symptom) ? "checkmark.circle.fill" : "circle")
                                        .foregroundColor(symptoms.contains(symptom) ? .pink : .secondary)
                                    Text(symptom).font(.caption)
                                    Spacer()
                                }
                            }.buttonStyle(.plain)
                        }
                    }
                }
                Section("Notes") {
                    TextEditor(text: $notes).frame(minHeight: 60)
                }
                if let msg = successMessage {
                    Text(msg).foregroundColor(.green)
                }
                if let err = errorMessage {
                    Text(err).foregroundColor(.red)
                }
            }
            .navigationTitle("Cycle Tracking")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { Task { await saveCycle() } }
                        .disabled(isLoading)
                }
            }
        }
    }

    func toggleSymptom(_ s: String) {
        if symptoms.contains(s) { symptoms.removeAll { $0 == s } }
        else { symptoms.append(s) }
    }

    func saveCycle() async {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        guard let baseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let url = URL(string: "\(baseURL)/api/cycle") else {
            errorMessage = "Configuration error"
            isLoading = false
            return
        }
        let body: [String: Any] = [
            "start_date": ISO8601DateFormatter().string(from: startDate),
            "end_date": ISO8601DateFormatter().string(from: endDate),
            "phase": phase,
            "symptoms": symptoms,
            "notes": notes
        ]
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, http.statusCode == 201 {
                successMessage = "Cycle entry saved!"
                phase = "menstrual"
                symptoms = []
                notes = ""
            } else {
                errorMessage = "Failed to save"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
