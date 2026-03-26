import SwiftUI
import Vision
import UIKit

// MARK: - NutritionLabelScannerView

struct NutritionLabelScannerView: View {
    @Environment(\.dismiss) private var dismiss
    var onParsed: (ParsedNutritionLabel) -> Void

    @State private var showImagePicker = false
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var sourceType: UIImagePickerController.SourceType = .camera

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "text.viewfinder")
                    .font(.system(size: 72))
                    .foregroundStyle(.accent)

                VStack(spacing: 8) {
                    Text("Scan Nutrition Label")
                        .font(.title2.bold())
                    Text("Point your camera at a nutrition facts label. Values will be extracted automatically.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                if isProcessing {
                    ProgressView("Reading label…")
                        .padding(.top, 8)
                }

                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                Spacer()

                VStack(spacing: 12) {
    Button {
        sourceType = .camera
        showImagePicker = true
    } label: {
        Label("Take Photo", systemImage: "camera.fill")
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.accentColor)
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
    .disabled(isProcessing)
    .accessibilityLabel("Take photo of nutrition label")

    Button {
        sourceType = .photoLibrary
        showImagePicker = true
    } label: {
        Label("Choose from Library", systemImage: "photo.on.rectangle")
            .font(.subheadline)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(.secondarySystemBackground))
            .foregroundStyle(.primary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
    .disabled(isProcessing)

    NavigationLink(destination: FoodScannerView()) {
        Label("Scan Barcode", systemImage: "barcode.viewfinder")
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(.secondarySystemBackground))
            .foregroundStyle(.primary)
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
    .accessibilityLabel("Scan barcode on product")
}

                .padding(.horizontal, 32)
                .padding(.bottom, 32)
            }
            .navigationTitle("Nutrition Label OCR")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showImagePicker) {
                ImagePickerRepresentable(sourceType: sourceType) { image in
                    Task { await runOCR(on: image) }
                }
            }
        }
    }

    // MARK: - OCR

    private func runOCR(on image: UIImage) async {
        isProcessing = true
        errorMessage = nil
        defer { isProcessing = false }

        guard let cgImage = image.cgImage else {
            errorMessage = "Could not process image."
            return
        }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        do {
            try handler.perform([request])
        } catch {
            errorMessage = "OCR failed: \(error.localizedDescription)"
            return
        }

        guard let observations = request.results, !observations.isEmpty else {
            errorMessage = "No text found. Make sure the label is clearly visible."
            return
        }

        let recognized = observations.compactMap { obs -> String? in
            guard let candidate = obs.topCandidates(1).first else { return nil }
            return candidate.string
        }

        let fullText = recognized.joined(separator: "\n")
        let parsed = parseNutritionLabel(from: fullText)

        let hasData = parsed.calories != nil || parsed.protein != nil ||
                      parsed.fat != nil || parsed.carbs != nil

        guard hasData else {
            errorMessage = "Couldn't detect nutrition values. Try a clearer photo."
            return
        }

        #if os(iOS)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif

        dismiss()
        onParsed(parsed)
    }
}

// MARK: - ImagePickerRepresentable

struct ImagePickerRepresentable: UIViewControllerRepresentable {
    let sourceType: UIImagePickerController.SourceType
    let onImage: (UIImage) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onImage: onImage) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onImage: (UIImage) -> Void
        init(onImage: @escaping (UIImage) -> Void) { self.onImage = onImage }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            picker.dismiss(animated: true)
            if let image = info[.originalImage] as? UIImage {
                onImage(image)
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}
