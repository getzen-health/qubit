import SwiftUI

struct BodyMeasurementsView: View {
    @State private var neck = ""
    @State private var waist = ""
    @State private var hips = ""
    @State private var height = ""
    @State private var sex = "male"
    @State private var bodyFat: Double? = nil
    @State private var saved = false

    private var category: (String, Color)? {
        guard let bf = bodyFat else { return nil }
        if sex == "male" {
            if bf < 6 { return ("Essential Fat", .blue) }
            if bf < 14 { return ("Athletic", .green) }
            if bf < 18 { return ("Fit", .green.opacity(0.8)) }
            if bf < 25 { return ("Average", .yellow) }
            return ("Obese", .red)
        } else {
            if bf < 14 { return ("Essential Fat", .blue) }
            if bf < 21 { return ("Athletic", .green) }
            if bf < 25 { return ("Fit", .green.opacity(0.8)) }
            if bf < 32 { return ("Average", .yellow) }
            return ("Obese", .red)
        }
    }

    private func calculateBodyFat() {
        guard let n = Double(neck), let w = Double(waist), let h = Double(height), n > 0, w > n, h > 0 else {
            bodyFat = nil; return
        }
        if sex == "male" {
            bodyFat = 86.010 * log10(w - n) - 70.041 * log10(h) + 36.76
        } else {
            guard let hp = Double(hips), hp > 0 else { bodyFat = nil; return }
            bodyFat = 163.205 * log10(w + hp - n) - 97.684 * log10(h) - 78.387
        }
        bodyFat = bodyFat.map { max(0, round($0 * 10) / 10) }
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Measurements (cm)") {
                    TextField("Neck circumference", text: $neck)
                        .keyboardType(.decimalPad)
                        .onChange(of: neck) { calculateBodyFat() }
                    TextField("Waist circumference", text: $waist)
                        .keyboardType(.decimalPad)
                        .onChange(of: waist) { calculateBodyFat() }
                    if sex == "female" {
                        TextField("Hips circumference", text: $hips)
                            .keyboardType(.decimalPad)
                            .onChange(of: hips) { calculateBodyFat() }
                    }
                    TextField("Height", text: $height)
                        .keyboardType(.decimalPad)
                        .onChange(of: height) { calculateBodyFat() }
                }
                Section("Sex") {
                    Picker("Sex", selection: $sex) {
                        Text("Male").tag("male")
                        Text("Female").tag("female")
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: sex) { calculateBodyFat() }
                }
                if let bf = bodyFat, let (label, color) = category {
                    Section("Body Fat Estimate") {
                        HStack {
                            Text("Body Fat %")
                            Spacer()
                            Text("\(bf, specifier: "%.1f")%")
                                .bold()
                        }
                        HStack {
                            Text("Category")
                            Spacer()
                            Text(label).foregroundColor(color).bold()
                        }
                    }
                }
                Section {
                    Button("Save Measurements") {
                        Task { await saveMeasurement() }
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.primary)
                    .cornerRadius(10)
                }
            }
            .navigationTitle("Body Measurements")
            .alert("Saved!", isPresented: $saved) { Button("OK") {} }
        }
    }
    
    func saveMeasurement() async {
        let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        guard !urlString.isEmpty, let url = URL(string: "\(urlString)/api/measurements") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body: [String: Any] = [:]
        if let n = Double(neck) { body["neck_cm"] = n }
        if let w = Double(waist) { body["waist_cm"] = w }
        if let h = Double(height) { body["height_cm"] = h }
        if sex == "female", let hp = Double(hips) { body["hips_cm"] = hp }
        if let bf = bodyFat { body["body_fat"] = bf }
        body["sex"] = sex
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        guard let (_, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 201 else { return }
        await MainActor.run {
            saved = true
            HapticService.notification(.success)
        }
    }
}
