import SwiftUI

/// Lets users view and edit their physical profile (height, weight, max HR, resting HR)
/// after onboarding. Changes are saved to both AppStorage and Supabase.
struct ProfileSettingsView: View {
    @AppStorage("userHeightCm") private var storedHeightCm = 0.0
    @AppStorage("userWeightKg") private var storedWeightKg = 0.0
    @AppStorage("userMaxHeartRate") private var storedMaxHR = 0
    @AppStorage("userRestingHR") private var storedRestingHR = 0

    @State private var heightText = ""
    @State private var weightText = ""
    @State private var maxHRText = ""
    @State private var restingHRText = ""
    @State private var isSaving = false
    @State private var saveError: String?
    @State private var didSave = false

    @FocusState private var focusedField: Field?
    private enum Field { case height, weight, maxHR, restingHR }

    var body: some View {
        Form {
            Section {
                row(label: "Height (cm)", placeholder: "100 – 250", text: $heightText, keyboard: .numberPad, field: .height)
                row(label: "Weight (kg)", placeholder: "30 – 300", text: $weightText, keyboard: .decimalPad, field: .weight)
            } header: {
                Text("Body Measurements")
            }

            Section {
                row(label: "Max HR (bpm)", placeholder: "120 – 220", text: $maxHRText, keyboard: .numberPad, field: .maxHR)
                row(label: "Resting HR (bpm)", placeholder: "30 – 120", text: $restingHRText, keyboard: .numberPad, field: .restingHR)
            } header: {
                Text("Heart Rate")
            } footer: {
                Text("Leave Max HR blank to use the 220 − age estimate in calculations.")
            }

            if let error = saveError {
                Section {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button(action: save) {
                    HStack {
                        Spacer()
                        if isSaving {
                            ProgressView()
                        } else if didSave {
                            Label("Saved", systemImage: "checkmark")
                        } else {
                            Text("Save")
                        }
                        Spacer()
                    }
                }
                .disabled(isSaving)
            }
        }
        .navigationTitle("Physical Profile")
        .toolbarTitleDisplayMode(.inline)
        .onAppear(perform: loadStoredValues)
    }

    // MARK: - Private

    @ViewBuilder
    private func row(label: String, placeholder: String, text: Binding<String>, keyboard: UIKeyboardType, field: Field) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField(placeholder, text: text)
                .multilineTextAlignment(.trailing)
                .keyboardType(keyboard)
                .focused($focusedField, equals: field)
                .frame(maxWidth: 120)
        }
    }

    private func loadStoredValues() {
        // Prefer values from the live Supabase user if already fetched;
        // fall back to AppStorage set during onboarding.
        let user = SupabaseService.shared.currentUser

        if let h = user?.heightCm, h > 0 {
            heightText = formatDecimal(h)
        } else if storedHeightCm > 0 {
            heightText = formatDecimal(storedHeightCm)
        }

        if let w = user?.weightKg, w > 0 {
            weightText = formatDecimal(w)
        } else if storedWeightKg > 0 {
            weightText = formatDecimal(storedWeightKg)
        }

        if let m = user?.maxHeartRate, m > 0 {
            maxHRText = "\(m)"
        } else if storedMaxHR > 0 {
            maxHRText = "\(storedMaxHR)"
        }

        if let r = user?.restingHr, r > 0 {
            restingHRText = "\(r)"
        } else if storedRestingHR > 0 {
            restingHRText = "\(storedRestingHR)"
        }
    }

    private func save() {
        focusedField = nil
        saveError = nil
        didSave = false

        let height: Double? = heightText.isEmpty ? nil : Double(heightText).flatMap { (100...250).contains(Int($0)) ? $0 : nil }
        let weight: Double? = weightText.isEmpty ? nil : Double(weightText).flatMap { $0 >= 30 && $0 <= 300 ? $0 : nil }
        let maxHR: Int?    = maxHRText.isEmpty ? nil : Int(maxHRText).flatMap { (120...220).contains($0) ? $0 : nil }
        let restHR: Int?   = restingHRText.isEmpty ? nil : Int(restingHRText).flatMap { (30...120).contains($0) ? $0 : nil }

        if let h = height { storedHeightCm = h }
        if let w = weight { storedWeightKg = w }
        if let m = maxHR  { storedMaxHR = m }
        if let r = restHR { storedRestingHR = r }

        isSaving = true
        Task {
            do {
                try await SupabaseService.shared.updatePhysicalProfile(
                    heightCm: height,
                    weightKg: weight,
                    maxHeartRate: maxHR,
                    restingHr: restHR
                )
                await MainActor.run {
                    isSaving = false
                    didSave = true
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    saveError = error.localizedDescription
                }
            }
        }
    }

    private func formatDecimal(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0
            ? String(Int(value))
            : String(format: "%.1f", value)
    }
}

#Preview {
    NavigationStack {
        ProfileSettingsView()
    }
}
