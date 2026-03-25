import SwiftUI
import AVFoundation

// MARK: - ProductComparisonView

struct ProductComparisonView: View {
    let productA: ScannedProduct
    @State private var productB: ScannedProduct?
    @State private var showScannerForB = false
    @State private var isLoadingB = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if let b = productB {
                    comparisonContent(a: productA, b: b)
                } else {
                    pickSecondProduct
                }
            }
            .navigationTitle("Compare Products")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .sheet(isPresented: $showScannerForB) {
                BarcodeScanPickerView { barcode in
                    showScannerForB = false
                    Task { await loadProductB(barcode: barcode) }
                }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
        }
    }

    // MARK: - Pick second product

    private var pickSecondProduct: some View {
        VStack(spacing: 24) {
            productCard(productA, label: "Product A")
                .padding(.horizontal)

            Divider()

            VStack(spacing: 16) {
                Image(systemName: "rectangle.on.rectangle")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)
                Text("Pick a second product to compare")
                    .font(.headline)
                    .multilineTextAlignment(.center)

                if isLoadingB {
                    ProgressView("Looking up…")
                } else {
                    Button {
                        showScannerForB = true
                    } label: {
                        Label("Scan a barcode", systemImage: "barcode.viewfinder")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.accentColor)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal)
                }
            }

            Spacer()
        }
        .padding(.top, 24)
    }

    // MARK: - Full side-by-side comparison

    private func comparisonContent(a: ScannedProduct, b: ScannedProduct) -> some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header row
                HStack(spacing: 0) {
                    productHeader(a)
                    Divider()
                    productHeader(b)
                }
                .padding(.vertical, 12)
                .background(Color(.secondarySystemBackground))

                Divider()

                // Health score row
                comparisonRow(
                    label: "Health Score",
                    valueA: "\(a.healthScore.score)/100",
                    valueB: "\(b.healthScore.score)/100",
                    higherIsBetter: true,
                    numA: Double(a.healthScore.score),
                    numB: Double(b.healthScore.score)
                )

                // NOVA group row
                comparisonRow(
                    label: "NOVA Group",
                    valueA: a.novaGroup.map { "NOVA \($0)" } ?? "—",
                    valueB: b.novaGroup.map { "NOVA \($0)" } ?? "—",
                    higherIsBetter: false,
                    numA: a.novaGroup.map(Double.init),
                    numB: b.novaGroup.map(Double.init)
                )

                // Nutri-Score row
                nutriScoreRow(a: a, b: b)

                // Calories row
                comparisonRow(
                    label: "Calories (per 100g)",
                    valueA: "\(a.calories) kcal",
                    valueB: "\(b.calories) kcal",
                    higherIsBetter: false,
                    numA: Double(a.calories),
                    numB: Double(b.calories)
                )

                // Protein row
                comparisonRow(
                    label: "Protein",
                    valueA: String(format: "%.1fg", a.protein),
                    valueB: String(format: "%.1fg", b.protein),
                    higherIsBetter: true,
                    numA: a.protein,
                    numB: b.protein
                )

                // Fat row
                comparisonRow(
                    label: "Fat",
                    valueA: String(format: "%.1fg", a.fat),
                    valueB: String(format: "%.1fg", b.fat),
                    higherIsBetter: false,
                    numA: a.fat,
                    numB: b.fat
                )

                // Carbs row
                comparisonRow(
                    label: "Carbs",
                    valueA: String(format: "%.1fg", a.carbs),
                    valueB: String(format: "%.1fg", b.carbs),
                    higherIsBetter: false,
                    numA: a.carbs,
                    numB: b.carbs
                )

                // Sugar row
                comparisonRow(
                    label: "Sugar",
                    valueA: String(format: "%.1fg", a.sugar),
                    valueB: String(format: "%.1fg", b.sugar),
                    higherIsBetter: false,
                    numA: a.sugar,
                    numB: b.sugar
                )

                // Fiber row
                comparisonRow(
                    label: "Fiber",
                    valueA: String(format: "%.1fg", a.fiber),
                    valueB: String(format: "%.1fg", b.fiber),
                    higherIsBetter: true,
                    numA: a.fiber,
                    numB: b.fiber
                )

                Divider().padding(.top, 8)

                // Compare another button
                Button {
                    showScannerForB = true
                } label: {
                    Label("Compare another product", systemImage: "arrow.2.circlepath")
                        .font(.subheadline.bold())
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .foregroundStyle(.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Subviews

    private func productHeader(_ product: ScannedProduct) -> some View {
        VStack(spacing: 6) {
            if let url = product.imageURL {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fit)
                } placeholder: {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color(.tertiarySystemBackground))
                }
                .frame(width: 56, height: 56)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.tertiarySystemBackground))
                    .frame(width: 56, height: 56)
                    .overlay(Text("🍎").font(.title))
            }

            Text(product.name)
                .font(.caption.bold())
                .lineLimit(2)
                .multilineTextAlignment(.center)
            if let brand = product.brand {
                Text(brand)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 8)
    }

    private func productCard(_ product: ScannedProduct, label: String) -> some View {
        HStack(spacing: 12) {
            if let url = product.imageURL {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fit)
                } placeholder: {
                    Color(.secondarySystemBackground)
                }
                .frame(width: 60, height: 60)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Text(product.name).font(.headline).lineLimit(2)
                if let brand = product.brand {
                    Text(brand).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            Spacer()
            ZStack {
                Circle()
                    .stroke(product.healthScore.displayColor.opacity(0.2), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: Double(product.healthScore.score) / 100)
                    .stroke(product.healthScore.displayColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(product.healthScore.score)")
                    .font(.caption.bold())
            }
            .frame(width: 44, height: 44)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func comparisonRow(
        label: String,
        valueA: String,
        valueB: String,
        higherIsBetter: Bool,
        numA: Double?,
        numB: Double?
    ) -> some View {
        let (colorA, colorB) = metricColors(numA: numA, numB: numB, higherIsBetter: higherIsBetter)
        return HStack(spacing: 0) {
            Text(valueA)
                .font(.subheadline.bold())
                .foregroundStyle(colorA)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)

            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 100)
                .multilineTextAlignment(.center)

            Text(valueB)
                .font(.subheadline.bold())
                .foregroundStyle(colorB)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
        }
        .background(Color(.secondarySystemBackground))
        .overlay(Divider(), alignment: .bottom)
    }

    private func nutriScoreRow(a: ScannedProduct, b: ScannedProduct) -> some View {
        let scoreA = a.healthScore.nutriScore
        let scoreB = b.healthScore.nutriScore
        let order = ["a", "b", "c", "d", "e"]
        let rankA = scoreA.flatMap { s in order.firstIndex(of: s.lowercased()) } ?? 999
        let rankB = scoreB.flatMap { s in order.firstIndex(of: s.lowercased()) } ?? 999
        let colorA: Color = rankA < rankB ? .green : rankA > rankB ? .red : .primary
        let colorB: Color = rankB < rankA ? .green : rankB > rankA ? .red : .primary

        return HStack(spacing: 0) {
            Text(scoreA?.uppercased() ?? "—")
                .font(.subheadline.bold())
                .foregroundStyle(colorA)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)

            Text("Nutri-Score")
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 100)
                .multilineTextAlignment(.center)

            Text(scoreB?.uppercased() ?? "—")
                .font(.subheadline.bold())
                .foregroundStyle(colorB)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
        }
        .background(Color(.secondarySystemBackground))
        .overlay(Divider(), alignment: .bottom)
    }

    // MARK: - Helpers

    private func metricColors(numA: Double?, numB: Double?, higherIsBetter: Bool) -> (Color, Color) {
        guard let a = numA, let b = numB, a != b else { return (.primary, .primary) }
        let aIsBetter = higherIsBetter ? a > b : a < b
        return aIsBetter ? (.green, .red) : (.red, .green)
    }

    // MARK: - Data loading

    private func loadProductB(barcode: String) async {
        isLoadingB = true
        defer { isLoadingB = false }
        do {
            let product = try await OpenFoodFactsService.lookupBarcode(barcode)
            await MainActor.run { productB = product }
        } catch {
            await MainActor.run { errorMessage = "Could not find product for that barcode." }
        }
    }
}

// MARK: - BarcodeScanPickerView

struct BarcodeScanPickerView: View {
    let onBarcode: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            BarcodeScannerRepresentable { barcode in
                onBarcode(barcode)
            }
            .ignoresSafeArea()
            .navigationTitle("Scan Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
