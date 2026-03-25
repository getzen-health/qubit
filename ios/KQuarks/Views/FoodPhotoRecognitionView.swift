import SwiftUI
import PhotosUI
import AVFoundation

// MARK: - FoodPhotoRecognitionView

struct FoodPhotoRecognitionView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var recognizedFoods: [RecognizedFoodItem] = []
    @State private var isAnalyzing = false
    @State private var errorMessage: String?
    @State private var showCamera = false
    @State private var showResults = false
    @State private var selectedMealType: MealTypeOption = .lunch

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let image = selectedImage {
                    imagePreview(image)
                } else {
                    emptyState
                }
            }
            .navigationTitle("Photo Log Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraPickerView { image in
                    selectedImage = image
                    selectedItem = nil
                    recognizedFoods = []
                    showCamera = false
                    Task { await analyzeImage(image) }
                }
            }
            .sheet(isPresented: $showResults) {
                recognitionResultsSheet
            }
            .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "camera.viewfinder")
                .font(.system(size: 72))
                .foregroundStyle(.secondary)

            VStack(spacing: 8) {
                Text("AI Food Recognition")
                    .font(.title2.bold())
                Text("Take a photo or choose from your library to automatically identify food and estimate nutrition.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 32)
            }

            VStack(spacing: 12) {
                Button {
                    showCamera = true
                } label: {
                    Label("Take Photo", systemImage: "camera.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                PhotosPicker(selection: $selectedItem, matching: .images) {
                    Label("Choose from Library", systemImage: "photo.on.rectangle")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .foregroundStyle(.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .onChange(of: selectedItem) { _, newItem in
                    Task {
                        if let newItem,
                           let data = try? await newItem.loadTransferable(type: Data.self),
                           let img = UIImage(data: data) {
                            selectedImage = img
                            recognizedFoods = []
                            await analyzeImage(img)
                        }
                    }
                }
            }
            .padding(.horizontal, 32)

            Spacer()
        }
    }

    // MARK: - Image Preview

    private func imagePreview(_ image: UIImage) -> some View {
        VStack(spacing: 0) {
            ZStack {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 300)
                    .clipped()

                if isAnalyzing {
                    ZStack {
                        Color.black.opacity(0.5)
                        VStack(spacing: 12) {
                            ProgressView().scaleEffect(1.4).tint(.white)
                            Text("Analyzing food…")
                                .foregroundStyle(.white)
                                .font(.subheadline.bold())
                        }
                        .padding(24)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                }
            }

            VStack(spacing: 16) {
                if !recognizedFoods.isEmpty {
                    Button {
                        showResults = true
                    } label: {
                        HStack {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                            Text("\(recognizedFoods.count) food item\(recognizedFoods.count == 1 ? "" : "s") detected")
                                .font(.headline)
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .foregroundStyle(.primary)
                }

                HStack(spacing: 12) {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Retake", systemImage: "camera.rotate")
                            .font(.subheadline)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    PhotosPicker(selection: $selectedItem, matching: .images) {
                        Label("New Photo", systemImage: "photo")
                            .font(.subheadline)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .foregroundStyle(.primary)
            .padding()

            Spacer()
        }
    }

    // MARK: - Results Sheet

    private var recognitionResultsSheet: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Meal Type", selection: $selectedMealType) {
                        ForEach(MealTypeOption.allCases, id: \.self) { type in
                            Label(type.label, systemImage: type.icon).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }

                Section("Detected Foods") {
                    ForEach($recognizedFoods) { $food in
                        FoodResultRow(food: $food)
                    }
                }

                let selected = recognizedFoods.filter(\.isSelected)
                if !selected.isEmpty {
                    Section {
                        let totalCal = selected.reduce(0) { $0 + $1.calories }
                        let totalProt = selected.reduce(0) { $0 + $1.protein }
                        let totalCarbs = selected.reduce(0) { $0 + $1.carbs }
                        let totalFat = selected.reduce(0) { $0 + $1.fat }

                        HStack {
                            nutritionLabel("Calories", value: "\(totalCal)", color: .orange)
                            Divider()
                            nutritionLabel("Protein", value: "\(totalProt)g", color: .blue)
                            Divider()
                            nutritionLabel("Carbs", value: "\(totalCarbs)g", color: .purple)
                            Divider()
                            nutritionLabel("Fat", value: "\(totalFat)g", color: .red)
                        }
                        .frame(maxWidth: .infinity)
                    } header: {
                        Text("Selected Total")
                    }
                }
            }
            .navigationTitle("Food Detected")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showResults = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Log All") {
                        Task { await logSelectedFoods() }
                    }
                    .bold()
                    .disabled(recognizedFoods.filter(\.isSelected).isEmpty)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func nutritionLabel(_ label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Analysis

    private func analyzeImage(_ image: UIImage) async {
        isAnalyzing = true
        defer { isAnalyzing = false }

        guard let base64 = image.jpegData(compressionQuality: 0.7)?.base64EncodedString() else {
            errorMessage = "Failed to process image."
            return
        }

        let imageData = "data:image/jpeg;base64,\(base64)"

        // Call Supabase Edge Function or web API
        // Use the Supabase client's REST API with auth token
        guard let session = SupabaseService.shared.currentSession else {
            errorMessage = "Please sign in to use food recognition."
            return
        }

        let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        // Call edge function directly via Supabase
        let endpoint = "\(supabaseURL)/functions/v1/recognize-food"

        guard let url = URL(string: endpoint) else {
            errorMessage = "Service not configured."
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        let payload = ["image": imageData]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else { return }
        request.httpBody = body

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let httpResponse = response as? HTTPURLResponse

            if httpResponse?.statusCode == 404 {
                // Edge function not deployed — fall back to mock with helpful message
                errorMessage = "Food recognition service not yet deployed. Configure the recognize-food edge function."
                return
            }

            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let foods = json?["foods"] as? [[String: Any]] ?? []

            recognizedFoods = foods.map { food in
                RecognizedFoodItem(
                    name: food["name"] as? String ?? "Unknown",
                    calories: food["calories"] as? Int ?? 0,
                    protein: food["protein"] as? Int ?? 0,
                    carbs: food["carbs"] as? Int ?? 0,
                    fat: food["fat"] as? Int ?? 0,
                    fiber: food["fiber"] as? Int,
                    servingSize: food["servingSize"] as? String ?? "1 serving",
                    confidence: food["confidence"] as? Double ?? 0.5
                )
            }

            if !recognizedFoods.isEmpty {
                showResults = true
            } else {
                errorMessage = "No food detected in this image. Try a clearer photo."
            }
        } catch {
            errorMessage = "Analysis failed. Check your connection."
        }
    }

    private func logSelectedFoods() async {
        let selected = recognizedFoods.filter(\.isSelected)
        for food in selected {
            try? await SupabaseService.shared.logMeal(
                mealType: selectedMealType.rawValue,
                name: food.name,
                calories: food.calories,
                protein: Double(food.protein),
                carbs: Double(food.carbs),
                fat: Double(food.fat)
            )
        }
        showResults = false
        dismiss()
    }
}

// MARK: - RecognizedFoodItem

struct RecognizedFoodItem: Identifiable {
    let id = UUID()
    let name: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let fiber: Int?
    let servingSize: String
    let confidence: Double
    var isSelected: Bool = true
}

// MARK: - FoodResultRow

private struct FoodResultRow: View {
    @Binding var food: RecognizedFoodItem

    var confidenceColor: Color {
        food.confidence >= 0.8 ? .green : food.confidence >= 0.6 ? .orange : .red
    }

    var body: some View {
        HStack(spacing: 12) {
            Button {
                food.isSelected.toggle()
            } label: {
                Image(systemName: food.isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(food.isSelected ? .accentColor : .secondary)
                    .font(.title3)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(food.name).font(.body)
                    Spacer()
                    HStack(spacing: 2) {
                        Circle()
                            .fill(confidenceColor)
                            .frame(width: 6, height: 6)
                        Text("\(Int(food.confidence * 100))%")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                HStack(spacing: 8) {
                    Text("\(food.calories) kcal")
                        .font(.caption.bold())
                        .foregroundStyle(.orange)
                    Text("P:\(food.protein)g")
                        .font(.caption)
                        .foregroundStyle(.blue)
                    Text("C:\(food.carbs)g")
                        .font(.caption)
                        .foregroundStyle(.purple)
                    Text("F:\(food.fat)g")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
                Text(food.servingSize)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Camera Picker

struct CameraPickerView: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.cameraCaptureMode = .photo
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage) -> Void
        init(onCapture: @escaping (UIImage) -> Void) { self.onCapture = onCapture }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                onCapture(image)
            }
            picker.dismiss(animated: true)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}
