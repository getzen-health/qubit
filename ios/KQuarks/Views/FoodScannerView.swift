import SwiftUI
import AVFoundation

// MARK: - Models

struct ScannedProduct: Identifiable {
    let id = UUID()
    let barcode: String
    let name: String
    let brand: String?
    let quantity: String?
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let fiber: Double
    let sugar: Double
    let sodium: Double
    let servingSize: String
    let imageURL: URL?
    let healthScore: ProductHealthScore
    let ingredients: String?
    let categories: [String]
    let novaGroup: Int?
    let allergenTags: [String]
}

struct ProductHealthScore {
    let score: Int
    let grade: String
    let color: String
    let nutriScore: String?

    var displayColor: Color {
        switch score {
        case 75...100: return .green
        case 50..<75:  return Color(red: 0.6, green: 0.8, blue: 0)
        case 25..<50:  return .orange
        default:       return .red
        }
    }

    var emoji: String {
        switch score {
        case 75...100: return "✅"
        case 50..<75:  return "🟡"
        case 25..<50:  return "🟠"
        default:       return "🔴"
        }
    }

    var label: String {
        switch score {
        case 75...100: return "Excellent"
        case 50..<75:  return "Good"
        case 25..<50:  return "Poor"
        default:       return "Avoid"
        }
    }
}

// MARK: - FoodScannerView (Yuka-style, ZenScore™)

struct FoodScannerView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = 0
    @State private var service = FoodScannerService()
    @State private var scannedProduct: FoodProduct?
    @State private var showProductSheet = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Segmented picker instead of TabView to avoid colliding with bottom nav
                Picker("Mode", selection: $selectedTab) {
                    Label("Scan", systemImage: "barcode.viewfinder").tag(0)
                    Label("Search", systemImage: "magnifyingglass").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)

                if selectedTab == 0 {
                    BarcodeScannerTab(service: service) { product in
                        scannedProduct = product
                        showProductSheet = true
                    }
                } else {
                    FoodSearchTab(service: service) { product in
                        scannedProduct = product
                        showProductSheet = true
                    }
                }
            }
            .background(Color.premiumBackground)
            .navigationTitle("Food Scanner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.premiumBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.white.opacity(0.7))
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: ScanHistoryView()) {
                        Label("History", systemImage: "clock.arrow.circlepath")
                    }
                    .foregroundStyle(.white.opacity(0.7))
                }
            }
            .sheet(item: $scannedProduct) { product in
                ProductDetailSheet(product: product, service: service)
            }
            .preferredColorScheme(.dark)
        }
    }
}

// MARK: - ProductDetailView

struct ProductDetailView: View {
    let product: ScannedProduct
    @Environment(\.dismiss) private var dismiss
    @State private var isSaving = false
    @State private var showSaved = false
    @State private var selectedMealType: MealTypeOption = .snack
    @State private var alternatives: [ScannedProduct] = []
    @State private var isLoadingAlternatives = false
    @State private var showComparison = false
    @State private var servings: Double = 1.0
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    productHeader
                    allergenBadgesSection
                    healthScoreCard
                    nutritionCard
                    if let ingredients = product.ingredients, !ingredients.isEmpty {
                        ingredientsCard(ingredients)
                    }
                    compareButton
                    logButton
                    betterAlternativesSection
                }
                .padding()
            }
            .background(Color.premiumBackground)
            .navigationTitle("Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .alert("Logged!", isPresented: $showSaved) {
                Button("OK") { dismiss() }
            } message: {
                Text("\(product.name) has been added to your \(selectedMealType.label).")
            }
            .sheet(isPresented: $showComparison) {
                ProductComparisonView(productA: product)
            }
        }
    }

    private var compareButton: some View {
        Button {
            showComparison = true
        } label: {
            Label("Compare with another product", systemImage: "rectangle.on.rectangle")
                .font(.subheadline.bold())
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.cardSurface)
                .foregroundStyle(Color.accentColor)
                .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    private var productHeader: some View {
        HStack(spacing: 16) {
            if let url = product.imageURL {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fit)
                } placeholder: {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.cardSurface)
                        .overlay(Image(systemName: "photo").foregroundStyle(.tertiary))
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.headline)
                    .lineLimit(2)
                if let brand = product.brand {
                    Text(brand).font(.subheadline).foregroundStyle(.secondary)
                }
                if let qty = product.quantity {
                    Text(qty).font(.caption).foregroundStyle(.tertiary)
                }
            }
            Spacer()
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var healthScoreCard: some View {
        HStack(spacing: 20) {
            ZStack {
                Circle()
                    .stroke(product.healthScore.displayColor.opacity(0.2), lineWidth: 10)
                    .frame(width: 90, height: 90)
                Circle()
                    .trim(from: 0, to: Double(product.healthScore.score) / 100)
                    .stroke(product.healthScore.displayColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 90, height: 90)
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(product.healthScore.score)")
                        .font(.title2.bold())
                    Text("/100").font(.caption2).foregroundStyle(.secondary)
                }
            }
            .accessibilityLabel("Health score: \(product.healthScore.score) out of 100")

            VStack(alignment: .leading, spacing: 6) {
                Text("\(product.healthScore.emoji) \(product.healthScore.label)")
                    .font(.title3.bold())
                    .foregroundStyle(product.healthScore.displayColor)

                if let nutriScore = product.healthScore.nutriScore {
                    HStack(spacing: 4) {
                        Text("Nutri-Score")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(nutriScore.uppercased())
                            .font(.caption.bold())
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(nutriScoreColor(nutriScore))
                            .foregroundStyle(.white)
                            .clipShape(Capsule())
                    }
                }

                if let nova = product.novaGroup {
                    NOVABadge(group: nova)
                }

                Text("per \(product.servingSize)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var nutritionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Nutrition").font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                NutrientBadge(label: "Calories", value: "\(product.calories)", unit: "kcal", color: .orange)
                NutrientBadge(label: "Protein", value: String(format: "%.1f", product.protein), unit: "g", color: .blue)
                NutrientBadge(label: "Carbs", value: String(format: "%.1f", product.carbs), unit: "g", color: .purple)
                NutrientBadge(label: "Fat", value: String(format: "%.1f", product.fat), unit: "g", color: .red)
                NutrientBadge(label: "Fiber", value: String(format: "%.1f", product.fiber), unit: "g", color: .green)
                NutrientBadge(label: "Sugar", value: String(format: "%.1f", product.sugar), unit: "g", color: .yellow)
            }
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func ingredientsCard(_ ingredients: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Ingredients").font(.headline)
            Text(coloredIngredients(ingredients))
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // Colors known risky E-number additives within ingredient text.
    // Colorants (E1xx) and preservatives (E2xx) in red; others amber.
    private func coloredIngredients(_ text: String) -> AttributedString {
        let baseAttrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor.secondaryLabel,
            .font: UIFont.preferredFont(forTextStyle: .caption1)
        ]
        let mutable = NSMutableAttributedString(string: text, attributes: baseAttrs)

        let riskMap: [String: UIColor] = [
            "E102":  .systemRed,    // Tartrazine
            "E104":  .systemOrange, // Quinoline Yellow
            "E110":  .systemRed,    // Sunset Yellow FCF
            "E122":  .systemRed,    // Carmoisine
            "E123":  .systemRed,    // Amaranth
            "E124":  .systemRed,    // Ponceau 4R
            "E127":  .systemRed,    // Erythrosine
            "E129":  .systemRed,    // Allura Red AC
            "E131":  .systemRed,    // Patent Blue V
            "E133":  .systemRed,    // Brilliant Blue FCF
            "E150D": .systemOrange, // Caramel IV
            "E171":  .systemOrange, // Titanium Dioxide
            "E211":  .systemRed,    // Sodium Benzoate
            "E212":  .systemOrange, // Potassium Benzoate
            "E213":  .systemOrange, // Calcium Benzoate
            "E220":  .systemOrange, // Sulphur Dioxide
            "E249":  .systemOrange, // Potassium Nitrite
            "E250":  .systemOrange, // Sodium Nitrite
            "E621":  .systemRed,    // Monosodium Glutamate
            "E951":  .systemRed,    // Aspartame
        ]

        guard let regex = try? NSRegularExpression(
            pattern: "\\bE\\d{3,4}[a-z]?\\b",
            options: .caseInsensitive
        ) else { return AttributedString(mutable) }

        let nsText = text as NSString
        let boldFont = UIFont.boldSystemFont(
            ofSize: UIFont.preferredFont(forTextStyle: .caption1).pointSize
        )
        for match in regex.matches(in: text, range: NSRange(location: 0, length: nsText.length)) {
            let upper = nsText.substring(with: match.range).uppercased()
            let color = riskMap[upper] ?? UIColor.systemOrange
            mutable.addAttribute(.foregroundColor, value: color, range: match.range)
            mutable.addAttribute(.font, value: boldFont, range: match.range)
        }
        return AttributedString(mutable)
    }

    private var logButton: some View {
        VStack(spacing: 12) {
            Picker("Meal Type", selection: $selectedMealType) {
                ForEach(MealTypeOption.allCases, id: \.self) { type in
                    Label(type.label, systemImage: type.icon).tag(type)
                }
            }
            .pickerStyle(.segmented)

            Button {
                Task { await logMeal() }
            } label: {
                Group {
                    if isSaving {
                        ProgressView().tint(.white)
                    } else {
                        Label("Add to Meal Log", systemImage: "plus.circle.fill")
                            .font(.headline)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .accessibilityLabel("Add \(product.name) to \(selectedMealType.label)")
            .accessibilityHint("Logs this product to your meal diary")
            .disabled(isSaving)
        }
        .padding()
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func logMeal() async {
        isSaving = true
        defer { isSaving = false }

        do {
            try await SupabaseService.shared.logMeal(
                mealType: selectedMealType.rawValue,
                name: product.name,
                calories: Int(Double(product.calories) * servings),
                protein: product.protein * servings,
                carbs: product.carbs * servings,
                fat: product.fat * servings,
                servings: servings
            )
            showSaved = true
        } catch {
            errorMessage = "Failed to save meal: \(error.localizedDescription)"
        }
    }

    // MARK: - Allergen Badges

    private struct AllergenInfo: Identifiable {
        let id: String
        let key: String
        let name: String
        let emoji: String
    }

    private static let knownAllergens: [AllergenInfo] = [
        .init(id: "milk",        key: "milk",        name: "Milk",      emoji: "🥛"),
        .init(id: "eggs",        key: "eggs",        name: "Eggs",      emoji: "🥚"),
        .init(id: "nuts",        key: "nuts",        name: "Tree Nuts", emoji: "🌰"),
        .init(id: "peanuts",     key: "peanuts",     name: "Peanuts",   emoji: "🥜"),
        .init(id: "wheat",       key: "wheat",       name: "Wheat",     emoji: "🌾"),
        .init(id: "gluten",      key: "gluten",      name: "Gluten",    emoji: "🌾"),
        .init(id: "soybeans",    key: "soybeans",    name: "Soy",       emoji: "🫘"),
        .init(id: "fish",        key: "fish",        name: "Fish",      emoji: "🐟"),
        .init(id: "crustaceans", key: "crustaceans", name: "Shellfish", emoji: "🦐"),
        .init(id: "sesame",      key: "sesame",      name: "Sesame",    emoji: "🌿"),
    ]

    @ViewBuilder private var allergenBadgesSection: some View {
        let present = Self.knownAllergens.filter { info in
            product.allergenTags.contains { $0.lowercased().contains(info.key) }
        }
        if !present.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                        .font(.caption)
                    Text("Contains Allergens")
                        .font(.caption.bold())
                        .foregroundStyle(.red)
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(present) { info in
                            HStack(spacing: 4) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.caption2)
                                Text("\(info.emoji) \(info.name)")
                                    .font(.caption.bold())
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.red.opacity(0.1))
                            .foregroundStyle(.red)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(Color.red.opacity(0.3), lineWidth: 1))
                        }
                    }
                }
            }
            .padding()
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private func nutriScoreColor(_ grade: String) -> Color {        switch grade.lowercased() {
        case "a": return .green
        case "b": return Color(red: 0.6, green: 0.8, blue: 0)
        case "c": return .yellow
        case "d": return .orange
        default:  return .red
        }
    }

    @ViewBuilder private var betterAlternativesSection: some View {
        if product.healthScore.score < 75 {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "arrow.up.circle.fill")
                        .foregroundStyle(.blue)
                    Text("Healthier Alternatives")
                        .font(.headline)
                    Spacer()
                    if isLoadingAlternatives {
                        ProgressView().scaleEffect(0.7)
                    }
                }

                if alternatives.isEmpty && !isLoadingAlternatives {
                    Text("Scan similar products to compare")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(alternatives) { alt in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(alt.name).font(.subheadline).lineLimit(1)
                                if let brand = alt.brand {
                                    Text(brand).font(.caption).foregroundStyle(.secondary)
                                }
                            }
                            Spacer()
                            Text("\(alt.healthScore.score)")
                                .font(.headline.bold())
                                .foregroundStyle(alt.healthScore.displayColor)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.premiumSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }

                // NOVA 4 warning
                if let nova = product.novaGroup, nova == 4 {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                        Text("Ultra-processed food (NOVA 4). Associated with increased cardiovascular risk (BMJ 2024).")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(10)
                    .background(Color.orange.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            .padding()
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .task {
                await fetchAlternatives()
            }
        }
    }

    private func fetchAlternatives() async {
        guard product.healthScore.score < 75, let category = product.categories.first else { return }
        isLoadingAlternatives = true
        defer { isLoadingAlternatives = false }

        do {
            let results = try await OpenFoodFactsService.search(query: category)
            alternatives = results
                .filter { $0.healthScore.score > product.healthScore.score }
                .sorted { $0.healthScore.score > $1.healthScore.score }
                .prefix(3)
                .map { $0 }
        } catch {
            // silently fail — alternatives are nice-to-have
        }
    }
}

// MARK: - NutrientBadge

private struct NutrientBadge: View {
    let label: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value + unit)
                .font(.subheadline.bold())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - NOVABadge

private struct NOVABadge: View {
    let group: Int

    var label: String {
        switch group {
        case 1: return "NOVA 1 · Unprocessed"
        case 2: return "NOVA 2 · Culinary"
        case 3: return "NOVA 3 · Processed"
        default: return "NOVA 4 · Ultra-processed"
        }
    }

    var color: Color {
        switch group {
        case 1: return .green
        case 2: return Color(red: 0.6, green: 0.8, blue: 0)
        case 3: return .orange
        default: return .red
        }
    }

    var body: some View {
        Text(label)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(color.opacity(0.4), lineWidth: 1))
    }
}

// MARK: - AVFoundation Barcode Scanner

struct BarcodeScannerRepresentable: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeUIViewController(context: Context) -> BarcodeScannerViewController {
        let vc = BarcodeScannerViewController()
        vc.onScan = onScan
        return vc
    }

    func updateUIViewController(_ uiViewController: BarcodeScannerViewController, context: Context) {}
}

final class BarcodeScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onScan: ((String) -> Void)?

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var hasScanned = false

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        if let session = captureSession, !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { session.startRunning() }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }

    private func setupCamera() {
        let session = AVCaptureSession()

        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else { return }

        session.addInput(input)

        let output = AVCaptureMetadataOutput()
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.ean8, .ean13, AVMetadataObject.ObjectType(rawValue: "org.gs1.UPC-A"), .upce, .code128, .code39, .qr]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.frame = view.layer.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        self.previewLayer = preview

        captureSession = session
        DispatchQueue.global(qos: .userInitiated).async { session.startRunning() }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !hasScanned,
              let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let barcode = object.stringValue,
              !barcode.isEmpty else { return }

        hasScanned = true
        captureSession?.stopRunning()
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
        onScan?(barcode)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }
}

// MARK: - OpenFoodFacts iOS Service

enum OpenFoodFactsError: Error {
    case notFound
    case networkError
}

struct OpenFoodFactsService {
    private static let baseURL = "https://world.openfoodfacts.org"
    private static let userAgent = "KQuarks/1.0 (iOS; https://github.com/qxlsz/kquarks)"

    static func lookupBarcode(_ barcode: String) async throws -> ScannedProduct {
        let fields = "product_name,brands,nutriments,serving_size,image_url,code,nutriscore_grade,additives_tags,allergens_tags,ingredients_text,labels_tags,categories_tags,quantity"
        guard let url = URL(string: "\(baseURL)/api/v2/product/\(barcode).json?fields=\(fields)") else {
            throw OpenFoodFactsError.networkError
        }

        var req = URLRequest(url: url)
        req.setValue(userAgent, forHTTPHeaderField: "User-Agent")

        let (data, _) = try await URLSession.shared.data(for: req)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        guard let status = json?["status"] as? Int, status == 1,
              let product = json?["product"] as? [String: Any] else {
            throw OpenFoodFactsError.notFound
        }

        return parseProduct(product, barcode: barcode)
    }

    static func search(query: String) async throws -> [ScannedProduct] {
        guard let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(baseURL)/cgi/search.pl?search_terms=\(encoded)&search_simple=1&action=process&json=1&page_size=5&fields=id,product_name,brands,image_url,nutriscore_grade,additives_tags,allergens_tags,labels_tags,nutriments,serving_size,ingredients_text,quantity") else {
            throw OpenFoodFactsError.networkError
        }

        var req = URLRequest(url: url)
        req.setValue(userAgent, forHTTPHeaderField: "User-Agent")

        let (data, _) = try await URLSession.shared.data(for: req)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let products = json?["products"] as? [[String: Any]] ?? []

        return products
            .filter { ($0["product_name"] as? String)?.isEmpty == false }
            .map { parseProduct($0, barcode: $0["id"] as? String ?? "") }
    }

    private static func parseProduct(_ p: [String: Any], barcode: String) -> ScannedProduct {
        let nutriments = p["nutriments"] as? [String: Any] ?? [:]
        let hasServing = nutriments["energy-kcal_serving"] != nil
        let labels = p["labels_tags"] as? [String] ?? []
        let isOrganic = labels.contains { $0.contains("organic") || $0.contains("bio") }
        let additivesTags = p["additives_tags"] as? [String] ?? []
        let nutriscoreGrade = p["nutriscore_grade"] as? String

        let score = calculateHealthScore(
            nutriscoreGrade: nutriscoreGrade,
            additivesTags: additivesTags,
            isOrganic: isOrganic
        )

        let novaGroup = additivesTags.isEmpty ? nil : detectNovaGroup(additivesTags)

        func num(_ key100: String, _ keyServing: String) -> Double {
            let v = hasServing ? nutriments[keyServing] : nutriments[key100]
            if let d = v as? Double { return d }
            if let i = v as? Int { return Double(i) }
            return 0
        }

        return ScannedProduct(
            barcode: barcode,
            name: (p["product_name"] as? String) ?? "Unknown Product",
            brand: p["brands"] as? String,
            quantity: p["quantity"] as? String,
            calories: Int(num("energy-kcal_100g", "energy-kcal_serving")),
            protein: num("proteins_100g", "proteins_serving"),
            carbs: num("carbohydrates_100g", "carbohydrates_serving"),
            fat: num("fat_100g", "fat_serving"),
            fiber: num("fiber_100g", "fiber_serving"),
            sugar: num("sugars_100g", "sugars_serving"),
            sodium: num("sodium_100g", "sodium_serving"),
            servingSize: (p["serving_size"] as? String) ?? "100g",
            imageURL: (p["image_url"] as? String).flatMap { URL(string: $0) },
            healthScore: score,
            ingredients: p["ingredients_text"] as? String,
            categories: (p["categories_tags"] as? [String])?.prefix(5).map { $0 } ?? [],
            novaGroup: novaGroup,
            allergenTags: p["allergens_tags"] as? [String] ?? []
        )
    }

    private static func detectNovaGroup(_ additivesTags: [String]) -> Int {
        let nova4Codes: Set<String> = [
            "en:e471", "en:e472a", "en:e472b", "en:e472c", "en:e472e",
            "en:e476", "en:e481", "en:e482", "en:e433", "en:e434",
            "en:e435", "en:e436", "en:e150c", "en:e150d", "en:e171",
            "en:e950", "en:e951", "en:e952", "en:e954", "en:e955",
            "en:e960", "en:e961", "en:e962"
        ]
        let nova4Prefixes = ["en:e1", "en:e47", "en:e48"]

        let hasNova4 = additivesTags.contains { tag in
            nova4Codes.contains(tag) ||
            nova4Prefixes.contains(where: { tag.hasPrefix($0) && tag != "en:e160a" })
        }

        if hasNova4 { return 4 }
        if additivesTags.count > 5 { return 3 }
        if !additivesTags.isEmpty { return 2 }
        return 1
    }

    // Yuka-style 0-100 scoring (mirrors web/lib/product-scoring.ts)
    private static func calculateHealthScore(
        nutriscoreGrade: String?,
        additivesTags: [String],
        isOrganic: Bool
    ) -> ProductHealthScore {
        // High-risk additive E-numbers (subset of the web scoring engine)
        let highRiskAdditives: Set<String> = [
            "en:e102", "en:e104", "en:e110", "en:e122", "en:e123",
            "en:e124", "en:e129", "en:e131", "en:e133", "en:e150d",
            "en:e211", "en:e212", "en:e213", "en:e220", "en:e250",
            "en:e621", "en:e951", "en:e952", "en:e954", "en:e955",
        ]
        let moderateRiskAdditives: Set<String> = [
            "en:e150a", "en:e150b", "en:e150c", "en:e160b",
            "en:e171", "en:e172", "en:e249", "en:e251",
        ]

        let hasHighRisk = additivesTags.contains { highRiskAdditives.contains($0) }
        let moderateCount = additivesTags.filter { moderateRiskAdditives.contains($0) }.count
        let additivePenalty = min(30, (hasHighRisk ? 20 : 0) + moderateCount * 3)

        let nutriScoreBase: Int
        switch nutriscoreGrade?.lowercased() {
        case "a": nutriScoreBase = 100
        case "b": nutriScoreBase = 75
        case "c": nutriScoreBase = 50
        case "d": nutriScoreBase = 25
        case "e": nutriScoreBase = 0
        default:  nutriScoreBase = 50
        }

        let organicBonus = isOrganic ? 10 : 0
        var raw = Int(Double(nutriScoreBase) * 0.6) + (30 - additivePenalty) + organicBonus
        if hasHighRisk { raw = min(raw, 24) }
        let finalScore = max(0, min(100, raw))

        let grade: String
        switch finalScore {
        case 75...100: grade = "A"
        case 50..<75:  grade = "B"
        case 25..<50:  grade = "C"
        default:       grade = "D"
        }

        return ProductHealthScore(
            score: finalScore,
            grade: grade,
            color: finalScore >= 75 ? "green" : finalScore >= 50 ? "yellow" : finalScore >= 25 ? "orange" : "red",
            nutriScore: nutriscoreGrade
        )
    }
}
