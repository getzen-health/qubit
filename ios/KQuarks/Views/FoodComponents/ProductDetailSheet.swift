import SwiftUI

struct ProductDetailSheet: View {
    let product: FoodProduct
    let service: FoodScannerService
    @Environment(\.dismiss) private var dismiss
    @State private var showScoreInfo = false

    private var quarkScore: QuarkScoreResult {
        service.calculateQuarkScore(product)
    }

    private var nutriments: Nutriments? { product.nutriments }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    heroSection
                    scoreExplainerCard
                    pillarBreakdownCard
                    nutriScoreSection
                    novaGroupSection
                    nutrientsCard
                    if let ingredients = product.ingredientsText, !ingredients.isEmpty {
                        ingredientsCard(ingredients)
                    }
                    additivesSection
                    sourcesSection
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .background(Color.premiumBackground)
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.7))
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.08), in: Circle())
                    }
                }
            }
            .preferredColorScheme(.dark)
        }
    }

    // MARK: - Hero Section (Product + Score Ring)

    private var heroSection: some View {
        VStack(spacing: 20) {
            // Product info row
            HStack(spacing: 14) {
                if let urlStr = product.imageURL, let url = URL(string: urlStr) {
                    AsyncImage(url: url) { img in
                        img.resizable().aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Color.white.opacity(0.05)
                    }
                    .frame(width: 72, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(product.name)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                    if let brand = product.brand {
                        Text(brand)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white.opacity(0.5))
                    }
                }
                Spacer()
            }

            // Score Ring
            HStack(spacing: 0) {
                Spacer()
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(quarkGradeColor.opacity(0.12))
                            .blur(radius: 20)

                        Circle()
                            .stroke(Color.white.opacity(0.06), lineWidth: 10)

                        Circle()
                            .trim(from: 0, to: Double(quarkScore.score) / 100)
                            .stroke(
                                LinearGradient(
                                    colors: [quarkGradeColor, quarkGradeColor.opacity(0.5)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                style: StrokeStyle(lineWidth: 10, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 2) {
                            Text("\(quarkScore.score)")
                                .font(.system(size: 38, weight: .black, design: .rounded))
                                .foregroundStyle(.white)
                            Text(quarkScore.grade)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(quarkGradeColor)
                        }
                    }
                    .frame(width: 120, height: 120)

                    Text("QuarkScore™")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.4))
                        .kerning(1.5)
                }
                Spacer()
            }

            // Verdict strip
            HStack(spacing: 8) {
                Circle()
                    .fill(quarkGradeColor)
                    .frame(width: 8, height: 8)
                Text(quarkVerdict)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()
            }
            .padding(12)
            .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [
                    quarkGradeColor.opacity(0.15),
                    Color.cardSurface.opacity(0.8),
                    Color.cardSurface
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: [quarkGradeColor.opacity(0.3), Color.white.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
    }

    // MARK: - Score Explainer

    private var scoreExplainerCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                withAnimation(.spring(response: 0.3)) { showScoreInfo.toggle() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "info.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.purple)
                    Text("What is QuarkScore™?")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                    Spacer()
                    Image(systemName: showScoreInfo ? "chevron.up" : "chevron.down")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.3))
                }
            }
            .buttonStyle(.plain)

            if showScoreInfo {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Unlike simple nutrition ratings, QuarkScore™ evaluates food across 5 dimensions:")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.6))

                    VStack(alignment: .leading, spacing: 6) {
                        explainerRow("🥦", "Nutrient Balance", "Vitamins, protein, fiber vs sugar, sodium")
                        explainerRow("🏭", "Processing", "How processed is it? (NOVA classification)")
                        explainerRow("🧪", "Additives", "Are the additives safe or concerning?")
                        explainerRow("🌿", "Ingredients", "Whole foods vs refined/artificial")
                        explainerRow("🎯", "Context", "Does it fit your health goals?")
                    }

                    HStack(spacing: 4) {
                        gradeChip("A+", Color(red: 0.07, green: 0.73, blue: 0.44))
                        gradeChip("A", .green)
                        gradeChip("B", Color(red: 0.45, green: 0.75, blue: 0.1))
                        gradeChip("C", .orange)
                        gradeChip("D", Color(red: 0.9, green: 0.3, blue: 0.3))
                        gradeChip("F", Color(red: 0.7, green: 0.15, blue: 0.15))
                        Spacer()
                        Text("85+  70+  55+  35+  15+  <15")
                            .font(.system(size: 8, weight: .medium).monospacedDigit())
                            .foregroundStyle(.white.opacity(0.3))
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(16)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Pillar Breakdown

    private var pillarBreakdownCard: some View {
        VStack(spacing: 14) {
            HStack {
                AccentBar(color: .purple)
                Text("SCORE BREAKDOWN")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                    .kerning(1.2)
                Spacer()
            }

            let pillars: [(String, Color, PillarScore)] = [
                ("🥦", Color(red: 0.3, green: 0.85, blue: 0.4), quarkScore.pillars.nutrientBalance),
                ("🏭", Color(red: 0.4, green: 0.7, blue: 0.95), quarkScore.pillars.processingIntegrity),
                ("🧪", Color(red: 0.95, green: 0.6, blue: 0.2), quarkScore.pillars.additiveSafety),
                ("🌿", Color(red: 0.5, green: 0.9, blue: 0.5), quarkScore.pillars.ingredientQuality),
                ("🎯", Color(red: 0.7, green: 0.5, blue: 0.95), quarkScore.pillars.contextFit),
            ]
            ForEach(Array(pillars.enumerated()), id: \.offset) { _, item in
                let (emoji, color, pillar) = item
                PillarRow(emoji: emoji, pillar: pillar, barColor: color)
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Nutri-Score

    private var nutriScoreSection: some View {
        Group {
            if let grade = product.nutriscoreGrade?.lowercased(),
               grade != "unknown" && grade != "not-applicable" {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        AccentBar(color: .green)
                        Text("NUTRI-SCORE")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                            .kerning(1.2)
                        Spacer()
                    }

                    NutriScoreBar(activeGrade: grade)
                        .frame(maxWidth: .infinity)

                    Text("European nutrition-only rating (A=best, E=worst). Based on calories, sugar, fat & sodium vs protein, fiber & fruits per 100g. Does not consider additives or processing.")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.4))
                        .lineSpacing(2)

                    Link(destination: URL(string: "https://www.santepubliquefrance.fr/en/nutri-score")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "link")
                                .font(.system(size: 9))
                            Text("Santé publique France — Nutri-Score")
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(.purple.opacity(0.7))
                    }
                }
                .padding(18)
                .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color.white.opacity(0.06), lineWidth: 1)
                )
            }
        }
    }

    // MARK: - NOVA Group

    private var novaGroupSection: some View {
        Group {
            if let nova = product.novaGroup {
                VStack(spacing: 12) {
                    HStack {
                        AccentBar(color: novaColor(nova))
                        Text("NOVA GROUP")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                            .kerning(1.2)
                        Spacer()
                    }

                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(novaColor(nova).opacity(0.15))
                                .frame(width: 48, height: 48)
                            Text("\(nova)")
                                .font(.system(size: 22, weight: .black, design: .rounded))
                                .foregroundStyle(novaColor(nova))
                        }

                        VStack(alignment: .leading, spacing: 3) {
                            Text(novaLabel(nova))
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                            Text(novaDescription(nova))
                                .font(.system(size: 11))
                                .foregroundStyle(.white.opacity(0.45))
                                .lineLimit(2)
                        }
                        Spacer()
                    }

                    Link(destination: URL(string: "https://doi.org/10.1017/S1368980017000234")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "link")
                                .font(.system(size: 9))
                            Text("Monteiro et al. 2019 — NOVA Classification")
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(.purple.opacity(0.7))
                    }
                }
                .padding(18)
                .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color.white.opacity(0.06), lineWidth: 1)
                )
            }
        }
    }

    // MARK: - Nutrients Card

    private var nutrientsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                AccentBar(color: .cyan)
                Text("NUTRIENTS PER 100G")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                    .kerning(1.2)
                Spacer()
            }

            if let n = nutriments {
                VStack(spacing: 0) {
                    NutrientRow(name: "Calories", value: n.energyKcal100g, unit: "kcal", style: .neutral)
                    nutrientDivider
                    NutrientRow(name: "Protein", value: n.proteins100g, unit: "g", style: .positive)
                    nutrientDivider
                    NutrientRow(name: "Carbohydrates", value: n.carbohydrates100g, unit: "g", style: .neutral)
                    nutrientDivider
                    NutrientRow(name: "  of which Sugars", value: n.sugars100g, unit: "g", style: .caution)
                    nutrientDivider
                    NutrientRow(name: "Fat", value: n.fat100g, unit: "g", style: .neutral)
                    nutrientDivider
                    NutrientRow(name: "  Saturated Fat", value: n.saturatedFat100g, unit: "g", style: .negative)
                    nutrientDivider
                    NutrientRow(name: "Fiber", value: n.fiber100g, unit: "g", style: .positive)
                    nutrientDivider
                    NutrientRow(name: "Sodium", value: n.sodium100g.map { $0 * 1000 }, unit: "mg", style: .caution)
                }
            } else {
                Text("No nutritional data available")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private var nutrientDivider: some View {
        Rectangle()
            .fill(Color.white.opacity(0.04))
            .frame(height: 1)
            .padding(.vertical, 4)
    }

    // MARK: - Ingredients Card

    private func ingredientsCard(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                AccentBar(color: .yellow)
                Text("INGREDIENTS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                    .kerning(1.2)
                Spacer()
            }
            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.55))
                .lineSpacing(3)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Additives

    private var additivesSection: some View {
        Group {
            if !product.additivesTags.isEmpty {
                let parsed = parseAdditivesForDisplay()
                if !parsed.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            AccentBar(color: .orange)
                            Text("ADDITIVES")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white.opacity(0.5))
                                .kerning(1.2)
                            Spacer()
                            Text("\(parsed.count) found")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(.white.opacity(0.3))
                        }
                        ForEach(parsed, id: \.self) { code in
                            let risk = service.additiveRisk(for: code)
                            HStack {
                                Text(code.uppercased())
                                    .font(.system(size: 13, weight: .semibold).monospaced())
                                    .foregroundStyle(.white.opacity(0.8))
                                Spacer()
                                AdditiveRiskBadge(risk: risk)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    .padding(18)
                    .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
                }
            }
        }
    }

    // MARK: - Sources

    private var sourcesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                AccentBar(color: .white.opacity(0.4))
                Text("SCIENTIFIC SOURCES")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                    .kerning(1.2)
                Spacer()
            }

            VStack(alignment: .leading, spacing: 10) {
                sourceLink(
                    "Product data — Open Food Facts",
                    url: "https://world.openfoodfacts.org",
                    desc: "Open, collaborative food products database"
                )
                sourceLink(
                    "Nutri-Score — Santé publique France",
                    url: "https://www.santepubliquefrance.fr/en/nutri-score",
                    desc: "French national public health agency"
                )
                sourceLink(
                    "NOVA food classification — Monteiro et al.",
                    url: "https://doi.org/10.1017/S1368980017000234",
                    desc: "Public Health Nutrition, 2019"
                )
                sourceLink(
                    "Food additive safety — EFSA",
                    url: "https://www.efsa.europa.eu/en/topics/topic/food-additives",
                    desc: "European Food Safety Authority evaluations"
                )
                sourceLink(
                    "Additive carcinogenicity — IARC Monographs",
                    url: "https://monographs.iarc.who.int/agents-classified-by-the-iarc/",
                    desc: "WHO International Agency for Research on Cancer"
                )
                sourceLink(
                    "Ultra-processed foods & health — BMJ 2024",
                    url: "https://doi.org/10.1136/bmj-2023-077310",
                    desc: "Lane et al. — UPF exposure and adverse health outcomes"
                )
                sourceLink(
                    "Dietary guidelines — WHO",
                    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
                    desc: "World Health Organization healthy diet fact sheet"
                )
            }

            Text("QuarkScore™ is an independent assessment combining nutrition science, food processing research, and additive safety data. It is not affiliated with Nutri-Score or NOVA.")
                .font(.system(size: 10))
                .foregroundStyle(.white.opacity(0.3))
                .lineSpacing(2)
                .padding(.top, 4)
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private func sourceLink(_ title: String, url: String, desc: String) -> some View {
        Link(destination: URL(string: url)!) {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "doc.text")
                    .font(.system(size: 10))
                    .foregroundStyle(.purple.opacity(0.6))
                    .frame(width: 14, alignment: .center)
                    .padding(.top, 2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.7))
                    Text(desc)
                        .font(.system(size: 9))
                        .foregroundStyle(.white.opacity(0.35))
                }
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.2))
                    .padding(.top, 2)
            }
        }
    }

    // MARK: - Helpers

    private var quarkGradeColor: Color {
        switch quarkScore.grade {
        case "A+": return Color(red: 0.07, green: 0.78, blue: 0.48)
        case "A":  return Color(red: 0.2, green: 0.82, blue: 0.35)
        case "B":  return Color(red: 0.45, green: 0.78, blue: 0.15)
        case "C":  return Color(red: 0.95, green: 0.65, blue: 0.15)
        case "D":  return Color(red: 0.92, green: 0.35, blue: 0.3)
        default:   return Color(red: 0.75, green: 0.2, blue: 0.2)
        }
    }

    private var quarkVerdict: String {
        switch quarkScore.grade {
        case "A+": return "Excellent choice — one of the healthiest options"
        case "A":  return "Great choice — well-balanced and nutritious"
        case "B":  return "Good option — decent nutritional profile"
        case "C":  return "Moderate — consume in moderation"
        case "D":  return "Poor choice — consider healthier alternatives"
        default:   return "Not recommended — significant health concerns"
        }
    }

    private func explainerRow(_ emoji: String, _ title: String, _ desc: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(emoji).font(.system(size: 12))
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.75))
                Text(desc)
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
    }

    private func gradeChip(_ grade: String, _ color: Color) -> some View {
        Text(grade)
            .font(.system(size: 9, weight: .black))
            .foregroundStyle(.white)
            .frame(width: 24, height: 18)
            .background(color, in: RoundedRectangle(cornerRadius: 4))
    }

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
        case 1: return "Unprocessed"
        case 2: return "Culinary Ingredients"
        case 3: return "Processed"
        case 4: return "Ultra-Processed ⚠️"
        default: return "Unknown"
        }
    }

    private func novaDescription(_ group: Int) -> String {
        switch group {
        case 1: return "Fresh, unprocessed or minimally processed food"
        case 2: return "Oils, butter, sugar — used in cooking"
        case 3: return "Modified with salt, oil, or sugar for preservation"
        case 4: return "Industrial formulations with additives and little whole food"
        default: return ""
        }
    }

    private func novaColor(_ group: Int) -> Color {
        switch group {
        case 1: return Color(red: 0.2, green: 0.85, blue: 0.4)
        case 2: return Color(red: 0.5, green: 0.82, blue: 0.15)
        case 3: return Color(red: 0.95, green: 0.65, blue: 0.15)
        default: return Color(red: 0.92, green: 0.35, blue: 0.3)
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
        case "A":  return Color(red: 0.2, green: 0.78, blue: 0.3)
        case "B":  return Color(red: 0.42, green: 0.72, blue: 0.1)
        case "C":  return Color(red: 0.92, green: 0.6, blue: 0.1)
        case "D":  return Color(red: 0.88, green: 0.3, blue: 0.25)
        default:   return Color(red: 0.6, green: 0.6, blue: 0.6)
        }
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(bgColor)
                .frame(width: size == .large ? 80 : 36, height: size == .large ? 80 : 36)
            if size == .large {
                VStack(spacing: 0) {
                    Text("\(score)")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text(grade)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.85))
                }
            } else {
                Text(grade)
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(.white)
            }
        }
    }
}

struct PillarRow: View {
    let emoji: String
    let pillar: PillarScore
    var barColor: Color = .green

    var body: some View {
        HStack(spacing: 10) {
            Text(emoji).font(.system(size: 16))
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(pillar.label)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.85))
                    Spacer()
                    Text("\(pillar.score)/\(pillar.max)")
                        .font(.system(size: 12, weight: .semibold).monospacedDigit())
                        .foregroundStyle(pillarColor(pillar.score, max: pillar.max))
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.white.opacity(0.06))
                        RoundedRectangle(cornerRadius: 3)
                            .fill(
                                LinearGradient(
                                    colors: [barColor, barColor.opacity(0.6)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: max(0, geo.size.width * CGFloat(pillar.score) / CGFloat(max(pillar.max, 1))))
                    }
                }
                .frame(height: 6)
                Text(pillar.detail)
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.35))
                    .lineLimit(1)
            }
        }
    }

    private func pillarColor(_ score: Int, max: Int) -> Color {
        let ratio = Double(score) / Double(max)
        if ratio >= 0.7 { return Color(red: 0.3, green: 0.88, blue: 0.45) }
        if ratio >= 0.4 { return Color(red: 0.95, green: 0.65, blue: 0.15) }
        return Color(red: 0.92, green: 0.35, blue: 0.3)
    }
}

struct NutriScoreBar: View {
    let activeGrade: String
    private let grades = ["a", "b", "c", "d", "e"]
    private let colors: [Color] = [
        Color(red: 0.1, green: 0.75, blue: 0.35),
        Color(red: 0.5, green: 0.8, blue: 0.1),
        Color(red: 0.95, green: 0.78, blue: 0.1),
        Color(red: 0.95, green: 0.55, blue: 0.1),
        Color(red: 0.9, green: 0.25, blue: 0.2)
    ]

    var body: some View {
        HStack(spacing: 5) {
            ForEach(Array(grades.enumerated()), id: \.offset) { i, g in
                let isActive = g == activeGrade.lowercased()
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(colors[i].opacity(isActive ? 1 : 0.2))
                    Text(g.uppercased())
                        .font(.system(size: isActive ? 16 : 12, weight: .black))
                        .foregroundStyle(isActive ? .white : .white.opacity(0.3))
                }
                .frame(height: isActive ? 44 : 38)
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
        case .positive: return Color(red: 0.3, green: 0.88, blue: 0.45)
        case .negative: return Color(red: 0.92, green: 0.35, blue: 0.3)
        case .caution:  return Color(red: 0.95, green: 0.65, blue: 0.15)
        case .neutral:  return .white.opacity(0.8)
        }
    }

    var body: some View {
        HStack {
            Text(name)
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.5))
            Spacer()
            if let v = value {
                Text("\(String(format: v < 10 ? "%.1f" : "%.0f", v)) \(unit)")
                    .font(.system(size: 13, weight: .semibold).monospacedDigit())
                    .foregroundStyle(valueColor)
            } else {
                Text("—")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.2))
            }
        }
        .padding(.vertical, 2)
    }
}

struct AdditiveRiskBadge: View {
    let risk: AdditiveRisk

    private var label: String {
        switch risk {
        case .high: return "High risk"
        case .moderate: return "Moderate"
        case .low: return "Low risk"
        case .safe: return "Safe"
        }
    }

    private var color: Color {
        switch risk {
        case .high: return Color(red: 0.92, green: 0.3, blue: 0.25)
        case .moderate: return Color(red: 0.95, green: 0.6, blue: 0.1)
        case .low: return Color(red: 0.85, green: 0.8, blue: 0.2)
        case .safe: return Color(red: 0.3, green: 0.85, blue: 0.4)
        }
    }

    var body: some View {
        Text(label)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.12), in: Capsule())
    }
}
