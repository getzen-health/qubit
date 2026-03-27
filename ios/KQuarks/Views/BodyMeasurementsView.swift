import SwiftUI

@Observable
class BodyMeasurementsViewModel {
    var neck = ""
    var waist = ""
    var hips = ""
    var height = ""
    var sex = "male"
    var bodyFat: Double? = nil
    var saved = false
    var errorMessage: String?

    var category: (String, Color)? {
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

    func calculateBodyFat() {
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
        saved = true
        HapticService.notification(.success)
    }
}

struct BodyMeasurementsView: View {
    @State private var viewModel = BodyMeasurementsViewModel()

    var body: some View {
        @Bindable var vm = viewModel
        NavigationView {
            Form {
                Section("Measurements (cm)") {
                    TextField("Neck circumference", text: $vm.neck)
                        .keyboardType(.decimalPad)
                        .onChange(of: vm.neck) { viewModel.calculateBodyFat() }
                    TextField("Waist circumference", text: $vm.waist)
                        .keyboardType(.decimalPad)
                        .onChange(of: vm.waist) { viewModel.calculateBodyFat() }
                    if vm.sex == "female" {
                        TextField("Hips circumference", text: $vm.hips)
                            .keyboardType(.decimalPad)
                            .onChange(of: vm.hips) { viewModel.calculateBodyFat() }
                    }
                    TextField("Height", text: $vm.height)
                        .keyboardType(.decimalPad)
                        .onChange(of: vm.height) { viewModel.calculateBodyFat() }
                }
                Section("Sex") {
                    Picker("Sex", selection: $vm.sex) {
                        Text("Male").tag("male")
                        Text("Female").tag("female")
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: vm.sex) { viewModel.calculateBodyFat() }
                }
                if let bf = viewModel.bodyFat, let (label, color) = viewModel.category {
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
                        Task { await viewModel.saveMeasurement() }
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.primary)
                    .cornerRadius(10)
                }
            }
            .navigationTitle("Body Measurements")
            .alert("Saved!", isPresented: $vm.saved) { Button("OK") {} }
        }
    }
}
