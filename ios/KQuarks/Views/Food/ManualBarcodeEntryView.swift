import SwiftUI

struct ManualBarcodeEntryView: View {
    @Environment(\.dismiss) var dismiss
    let onSubmit: (String) -> Void
    @State private var barcode = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Enter Barcode Number")
                    .font(.headline)

                TextField("e.g. 012345678905", text: $barcode)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)
                    .padding(.horizontal)

                Text("Enter the barcode number printed below the barcode on the product packaging.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                if let error {
                    Text(error).foregroundColor(.red).font(.caption)
                }

                Button("Look Up Product") {
                    let cleaned = barcode.trimmingCharacters(in: .whitespaces)
                    guard cleaned.count >= 8 && cleaned.count <= 14 else {
                        self.error = "Barcode must be 8–14 digits"
                        return
                    }
                    guard cleaned.allSatisfy(\.isNumber) else {
                        self.error = "Barcode must contain only digits"
                        return
                    }
                    onSubmit(cleaned)
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .disabled(barcode.isEmpty)

                Spacer()
            }
            .padding()
            .navigationTitle("Manual Entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    ManualBarcodeEntryView { barcode in
        print("Entered barcode: \(barcode)")
    }
}
