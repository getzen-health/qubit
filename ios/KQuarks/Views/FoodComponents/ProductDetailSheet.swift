import SwiftUI

struct ProductDetailSheet: View {
    let product: FoodProduct
    let service: FoodScannerService
    @Environment(\.dismiss) private var dismiss

    private var quarkScore: QuarkScoreResult {
        service.calculateQuarkScore(product)
    }

    private var nutriments: Nutriments? { product.nutriments }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    productHeader
                    quarkScoreCard
                    nutriScoreSection
                    novaGroupSection
                    nutrientsCard
                    if let ingredients = product.ingredientsText, !ingredients.isEmpty {
                        ingredientsCard(ingredients)
                    }
                    additivesSection
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    // MARK: - Product Header

    private var productHeader: some View {
        HStack(spacing: 16) {
            if let urlStr = product.imageURL, let url = URL(string: urlStr) {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color(.tertiarySystemBackground)
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.headline)
                    .lineLimit(3)
                if let brand = product.brand {
                    Text(brand)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - QuarkScore Card

    private var quarkScoreCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("QuarkScore™")
                        .font(.headline)
                    Text("5-pillar health assessment")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                QuarkScoreBadge(score: quarkScore.score, grade: quarkScore.grade, size: .large)
            }

            Divider()

            let pillars = [
                ("🥦", quarkScore.pillars.nutrientBalance),
                ("🏭", quarkScore.pillars.processingIntegrity),
                ("🧪", quarkScore.pillars.additiveSafety),
                ("🌿", quarkScore.pillars.ingredientQuality),
                ("🎯", quarkScore.pillars.contextFit),
            ]
            ForEach(Array(pillars.enumerated()), id: \.offset) { _, pair in
                let (emoji, pillar) = pair
                PillarRow(emoji: emoji, pillar: pillar)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Nutri-Score

    private var nutriScoreSection: some View {
        Group {
            if let grade = product.nutriscoreGrade?.lowercased() {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Nutri-Score")
                        .font(.headline)
                    NutriScoreBar(activeGrade: grade)
                }
                .padding()
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    // MARK: - NOVA Group

    private var novaGroupSection: some View {
        Group {
            if let nova = product.novaGroup {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("NOVA Group \(nova)")
                            .font(.subheadline.weight(.semibold))
                        Text(novaLabel(nova))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("\(nova)")
                        .font(.title.bold())
                        .foregroundStyle(novaColor(nova))
                }
                .padding()
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
            }
        }
    }

    // MARK: - Nutrients Card

    private var nutrientsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Nutrients per 100g")
                .font(.headline)
            if let n = nutriments {
                VStack(spacing: 8) {
                    NutrientRow(name: "Calories", value: n.energyKcal100g, unit: "kcal", style: .neutral)
                    NutrientRow(name: "Protein", value: n.proteins100g, unit: "g", style: .positive)
                    NutrientRow(name: "Carbohydrates", value: n.carbohydrates100g, unit: "g", style: .neutral)
                    NutrientRow(name: "  of which Sugars", value: n.sugars100g, unit: "g", style: .caution)
                    NutrientRow(name: "Fat", value: n.fat100g, unit: "g", style: .neutral)
                    NutrientRow(name: "  Saturated Fat", value: n.saturatedFat100g, unit: "g", style: .negative)
                    NutrientRow(name: "Fiber", value: n.fiber100g, unit: "g", style: .positive)
                    NutrientRow(name: "Sodium", value: n.sodium100g.map { $0 * 1000 }, unit: "mg", style: .caution)
                }
            } else {
                Text("No nutritional data available")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Ingredients Card

    private func ingredientsCard(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Ingredients")
                .font(.headline)
            Text(text)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Additives

    private var additivesSection: some View {
        Group {
            if !product.additivesTags.isEmpty {
                let parsed = parseAdditivesForDisplay()
                VStack(alignment: .leading, spacing: 10) {
                    Text("Additives")
                        .font(.headline)
                    ForEach(parsed, id: \.self) { code in
                        let risk = service.additiveRisk(for: code)
                        HStack {
                            Text(code.uppercased())
                                .font(.subheadline.monospaced())
                            Spacer()
                            AdditiveRiskBadge(risk: risk)
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
            }
        }
    }

    // MARK: - Helpers

    private func parseAdditivesForDisplay() -> [String] {
        product.additivesTags.compactMap { tag -> String? in
            let clean = tag.replacingOccurrences(of: "en:", with: "").lowercased()
            let pattern = "e\\d+[a-z]?"
            if let range = clean.range(of: pattern, options: .regularExpression) {
                return String(clean[range])
            }
            return nil
        }
    }

    private func novaLabel(_ group: Int) -> String {
        switch group {
        case 1: return "Unprocessed or minimally processed"
        case 2: return "Processed culinary ingredients"
        case 3: return "Processed foods"
        case 4: return "Ultra-processed foods ⚠️"
        default: return "Unknown"
        }
    }

    private func novaColor(_ group: Int) -> Color {
        switch group {
        case 1: return .green
        case 2: return Color(red: 0.5, green: 0.8, blue: 0)
        case 3: return .orange
        default: return .red
        }
    }
}

// MARK: - Shared Components

struct QuarkScoreBadge: View {
    enum BadgeSize { case small, large }
    let score: Int
    let grade: String
    let size: BadgeSize

    private var bgColor: Color {
        switch grade {
        case "A+": return Color(red: 0.07, green: 0.73, blue: 0.44)
        case "A":  return .green
        case "B":  return Color(red: 0.42, green: 0.72, blue: 0.1)
        case "C":  return .orange
        case "D":  return .red
        default:   return Color(.systemGray)
        }
    }

    var body: some View {
        Group {
            if size == .large {
                ZStack {
                    Circle()
                        .fill(bgColor)
                        .frame(width: 80, height: 80)
                    VStack(spacing: 0) {
                        Text("\(score)")
                            .font(.system(size: 28, weight: .black))
                            .foregroundStyle(.white)
                        Text(grade)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                }
            } else {
                ZStack {
                    Circle()
                        .fill(bgColor)
                        .frame(width: 36, height: 36)
                    Text(grade)
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.white)
                }
            }
        }
    }
}

struct PillarRow: View {
    let emoji: String
    let pillar: PillarScore

    var body: some View {
        HStack(spacing: 10) {
            Text(emoji).font(.body)
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(pillar.label)
                        .font(.caption.weight(.medium))
                    Spacer()
                    Text("\(pillar.score)/\(pillar.max)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color(.systemGray5))
                        RoundedRectangle(cornerRadius: 3)
                            .fill(pillarColor(pillar.score, max: pillar.max))
                            .frame(width: geo.size.width * CGFloat(pillar.score) / CGFloat(pillar.max))
                    }
                }
                .frame(height: 6)
                Text(pillar.detail)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }

    private func pillarColor(_ score: Int, max: Int) -> Color {
        let ratio = Double(score) / Double(max)
        if ratio >= 0.7 { return .green }
        if ratio >= 0.4 { return .orange }
        return .red
    }
}

struct NutriScoreBar: View {
    let activeGrade: String
    private let grades = ["a", "b", "c", "d", "e"]
    private let colors: [Color] = [.green, Color(red: 0.5, green: 0.8, blue: 0), .yellow, .orange, .red]

    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(grades.enumerated()), id: \.offset) { i, g in
                let isActive = g == activeGrade.lowercased()
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(colors[i])
                        .opacity(isActive ? 1 : 0.3)
                    Text(g.uppercased())
                        .font(.system(size: isActive ? 16 : 12, weight: .black))
                        .foregroundStyle(.white)
                }
                .frame(width: isActive ? 44 : 36, height: isActive ? 44 : 36)
            }
        }
    }
}

struct NutrientRow: View {
    enum RowStyle { case neutral, positive, negative, caution }
    let name: String
    let value: Double?
    let unit: String
    let style: RowStyle

    private var valueColor: Color {
        switch style {
        case .positive: return .green
        case .negative: return .red
        case .caution:  return .orange
        case .neutral:  return .primary
        }
    }

    var body: some View {
        HStack {
            Text(name)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            if let v = value {
                Text("\(String(format: v < 10 ? "%.1f" : "%.0f", v)) \(unit)")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(valueColor)
            } else {
                Text("—")
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct AdditiveRiskBadge: View {
    let risk: AdditiveRisk

    private var label: String {
        switch risk {
        case .high: return "High concern"
        case .moderate: return "Watch-list"
        case .low: return "Low concern"
        case .safe: return "Safe"
        }
    }

    private var color: Color {
        switch risk {
        case .high: return .red
        case .moderate: return .orange
        case .low: return .yellow
        case .safe: return .green
        }
    }

    var body: some View {
        Text(label)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15), in: Capsule())
    }
}
