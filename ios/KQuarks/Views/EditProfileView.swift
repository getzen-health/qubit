import SwiftUI

struct EditProfileView: View {
    @State private var fullName: String = ""
    @State private var age: String = ""
    @State private var biologicalSex: String = "other"
    @State private var fitnessGoal: String = "general_wellness"
    @State private var heightCm: String = ""
    @State private var weightKg: String = ""

    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var successMessage: String?

    @Environment(\.dismiss) private var dismiss

    private let biologicalSexOptions: [(String, String)] = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other")
    ]

    private let fitnessGoalOptions: [(String, String)] = [
        ("lose_weight", "Lose Weight"),
        ("build_muscle", "Build Muscle"),
        ("improve_sleep", "Improve Sleep"),
        ("reduce_stress", "Reduce Stress"),
        ("eat_healthier", "Eat Healthier"),
        ("improve_fitness", "Improve Fitness"),
        ("manage_condition", "Manage Condition"),
        ("general_wellness", "General Wellness")
    ]

    var body: some View {
        Form {
            Section("Personal Info") {
                TextField("Full Name", text: $fullName)
                    .textContentType(.name)
                HStack {
                    Text("Age")
                    Spacer()
                    TextField("Age", text: $age)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .foregroundStyle(.secondary)
                }
                Picker("Biological Sex", selection: $biologicalSex) {
                    ForEach(biologicalSexOptions, id: \.0) { value, label in
                        Text(label).tag(value)
                    }
                }
            }

            Section("Goals") {
                Picker("Fitness Goal", selection: $fitnessGoal) {
                    ForEach(fitnessGoalOptions, id: \.0) { value, label in
                        Text(label).tag(value)
                    }
                }
            }

            Section("Body Measurements") {
                HStack {
                    Text("Height (cm)")
                    Spacer()
                    TextField("e.g. 175", text: $heightCm)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .foregroundStyle(.secondary)
                }
                HStack {
                    Text("Weight (kg)")
                    Spacer()
                    TextField("e.g. 70", text: $weightKg)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .foregroundStyle(.secondary)
                }
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.subheadline)
                }
            }

            if let success = successMessage {
                Section {
                    Text(success)
                        .foregroundStyle(.green)
                        .font(.subheadline)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                if isSaving {
                    ProgressView()
                } else {
                    Button("Save") {
                        Task { await saveProfile() }
                    }
                    .disabled(isLoading)
                }
            }
        }
        .overlay {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(.ultraThinMaterial)
            }
        }
        .task { await loadProfile() }
    }

    private func loadProfile() async {
        isLoading = true
        defer { isLoading = false }

        let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard !urlString.isEmpty, let url = URL(string: "\(urlString)/api/profile") else {
            errorMessage = "Configuration error"
            return
        }

        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return }

            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let profile = json["data"] as? [String: Any] {
                if let name = profile["full_name"] as? String { fullName = name }
                if let ageVal = profile["age"] as? Int { age = String(ageVal) }
                if let sex = profile["biological_sex"] as? String { biologicalSex = sex }
                if let goal = profile["fitness_goal"] as? String { fitnessGoal = goal }
                if let h = profile["height_cm"] as? Double { heightCm = String(h) }
                if let w = profile["weight_kg"] as? Double { weightKg = String(w) }
            }
        } catch {}
    }

    private func saveProfile() async {
        isSaving = true
        errorMessage = nil
        successMessage = nil
        defer { isSaving = false }

        let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard !urlString.isEmpty, let url = URL(string: "\(urlString)/api/profile") else {
            errorMessage = "Configuration error"
            return
        }

        var body: [String: Any] = [
            "full_name": fullName,
            "biological_sex": biologicalSex,
            "fitness_goal": fitnessGoal
        ]
        if let ageInt = Int(age) { body["age"] = ageInt }
        if let h = Double(heightCm) { body["height_cm"] = h }
        if let w = Double(weightKg) { body["weight_kg"] = w }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if (response as? HTTPURLResponse)?.statusCode == 200 {
                successMessage = "Profile saved!"
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { dismiss() }
            } else {
                errorMessage = "Failed to save profile"
            }
        } catch {
            errorMessage = "Network error"
        }
    }
}

#Preview { EditProfileView() }
