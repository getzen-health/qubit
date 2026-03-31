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
              (response as? HTTPURLResponse)?.statusCode == 201 else {
            errorMessage = "Failed to save measurements"
            return
        }
        saved = true
        HapticService.notification(.success)
    }
}

struct BodyMeasurementsView: View {
    @State private var viewModel = BodyMeasurementsViewModel()

    var body: some View {
        @Bindable var vm = viewModel
        NavigationStack {
            ZStack {
                PremiumBackgroundView()
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 20) {

                        // MARK: - Measurements
                        VStack(alignment: .leading, spacing: 10) {
                            PremiumSectionHeader(title: "MEASUREMENTS (CM)", icon: "ruler", tint: .teal)
                            VStack(spacing: 0) {
                                TextField("Neck circumference", text: $vm.neck)
                                    .keyboardType(.decimalPad)
                                    .foregroundStyle(.white)
                                    .tint(.teal)
                                    .onChange(of: vm.neck) { viewModel.calculateBodyFat() }
                                Color.premiumDivider.frame(height: 0.5)
                                TextField("Waist circumference", text: $vm.waist)
                                    .keyboardType(.decimalPad)
                                    .foregroundStyle(.white)
                                    .tint(.teal)
                                    .onChange(of: vm.waist) { viewModel.calculateBodyFat() }
                                if vm.sex == "female" {
                                    Color.premiumDivider.frame(height: 0.5)
                                    TextField("Hips circumference", text: $vm.hips)
                                        .keyboardType(.decimalPad)
                                        .foregroundStyle(.white)
                                        .tint(.teal)
                                        .onChange(of: vm.hips) { viewModel.calculateBodyFat() }
                                }
                                Color.premiumDivider.frame(height: 0.5)
                                TextField("Height", text: $vm.height)
                                    .keyboardType(.decimalPad)
                                    .foregroundStyle(.white)
                                    .tint(.teal)
                                    .onChange(of: vm.height) { viewModel.calculateBodyFat() }
                            }
                            .padding(16)
                            .premiumCard(cornerRadius: 18, tint: .teal, tintOpacity: 0.02)
                        }

                        // MARK: - Sex
                        VStack(alignment: .leading, spacing: 10) {
                            PremiumSectionHeader(title: "SEX", icon: "person.fill", tint: .teal)
                            VStack(spacing: 0) {
                                Picker("Sex", selection: $vm.sex) {
                                    Text("Male").tag("male")
                                    Text("Female").tag("female")
                                }
                                .pickerStyle(.segmented)
                                .tint(.teal)
                                .onChange(of: vm.sex) { viewModel.calculateBodyFat() }
                            }
                            .padding(16)
                            .premiumCard(cornerRadius: 18, tint: .teal, tintOpacity: 0.02)
                        }

                        // MARK: - Body Fat Estimate
                        if let bf = viewModel.bodyFat, let (label, color) = viewModel.category {
                            VStack(alignment: .leading, spacing: 10) {
                                PremiumSectionHeader(title: "BODY FAT ESTIMATE", icon: "percent", tint: .teal)
                                VStack(spacing: 0) {
                                    HStack {
                                        Text("Body Fat %")
                                            .foregroundStyle(.white.opacity(0.85))
                                        Spacer()
                                        Text("\(bf, specifier: "%.1f")%")
                                            .font(.system(size: 28, weight: .bold, design: .rounded))
                                            .foregroundStyle(.teal)
                                    }
                                    Color.premiumDivider.frame(height: 0.5)
                                        .padding(.vertical, 8)
                                    HStack {
                                        Text("Category")
                                            .foregroundStyle(.white.opacity(0.85))
                                        Spacer()
                                        Text(label)
                                            .foregroundStyle(color)
                                            .bold()
                                    }
                                }
                                .padding(16)
                                .premiumCard(cornerRadius: 18, tint: .teal, tintOpacity: 0.02)
                            }
                        }

                        // MARK: - Save Button
                        Button {
                            Task { await viewModel.saveMeasurement() }
                        } label: {
                            Text("Save Measurements")
                                .font(.headline)
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(
                                    LinearGradient(
                                        colors: [.teal, .teal.opacity(0.7)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }

                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Body Measurements")
            .preferredColorScheme(.dark)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .alert("Saved!", isPresented: $vm.saved) { Button("OK") {} }
        }
    }
}
