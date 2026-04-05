import SwiftUI

struct ProductDetailSheet: View {
    let product: FoodProduct
    let service: FoodScannerService
    @Environment(\.dismiss) private var dismiss
    @State private var animatedScore: Double = 0
    @State private var showIngredients = false

    private var zenScore: ZenScoreResult {
        service.calculateZenScore(product)
    }

    private var nutriments: Nutriments? { product.nutriments }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                headerSection
                scoreHeroSection
                    .padding(.top, -30)
                quickStatsRow
                    .padding(.top, 16)
                nutritionalQualitySection
                    .padding(.top, 16)
                additivesSection
                    .padding(.top, 16)
                if let text = product.ingredientsText, !text.isEmpty {
                    ingredientsSection(text)
                        .padding(.top, 16)
                }
                productInfoSection
                    .padding(.top, 16)
                disclaimerText
                    .padding(.top, 16)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(Color.premiumBackground)
        .overlay(alignment: .topTrailing) {
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white.opacity(0.7))
                    .frame(width: 30, height: 30)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .padding(.top, 12)
            .padding(.trailing, 16)
        }
        .preferredColorScheme(.dark)
        .onAppear {
            withAnimation(.easeOut(duration: 1.0).delay(0.2)) {
                animatedScore = Double(zenScore.score) / 100
            }
        }
    }

    // MARK: - Header (Product Image + Name)

    private var headerSection: some View {
        ZStack(alignment: .bottomLeading) {
            if let urlStr = product.imageURL, let url = URL(string: urlStr) {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    LinearGradient(
                        colors: [zenGradeColor.opacity(0.3), Color.premiumBackground],
                        startPoint: .top, endPoint: .bottom
                    )
                }
                .frame(height: 220)
                .clipped()
                .overlay(
                    LinearGradient(
                        colors: [.clear, Color.premiumBackground],
                        startPoint: .center, endPoint: .bottom
                    )
                )
            } else {
                LinearGradient(
                    colors: [zenGradeColor.opacity(0.2), Color.premiumBackground],
                    startPoint: .top, endPoint: .bottom
                )
                .frame(height: 160)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                if let brand = product.brand {
                    Text(brand)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
            .padding(.horizontal, 4)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Score Hero (Animated Ring)

    private var scoreHeroSection: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(zenGradeColor.opacity(0.08))
                    .blur(radius: 30)

                Circle()
                    .stroke(Color.white.opacity(0.06), lineWidth: 10)

                Circle()
                    .trim(from: 0, to: animatedScore)
                    .stroke(
                        LinearGradient(
                            colors: [zenGradeColor, zenGradeColor.opacity(0.5)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 2) {
                    Text("\(zenScore.score)")
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text(zenScore.grade)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(zenGradeColor)
                }
            }
            .frame(width: 120, height: 120)

            Text(zenVerdict)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(zenGradeColor)

            Text("ZenScore™")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white.opacity(0.35))
                .kerning(1.5)
        }
        .padding(.vertical, 16)
    }

    // MARK: - Quick Stats Row

    private var quickStatsRow: some View {
        HStack(spacing: 10) {
            if let grade = product.nutriscoreGrade?.lowercased(),
               grade != "unknown" && grade != "not-applicable" {
                quickStatPill(
                    icon: "chart.bar.fill",
                    label: "Nutri-Score",
                    value: grade.uppercased(),
                    color: nutriScoreColor(grade)
                )
            }
            if let nova = product.novaGroup {
                quickStatPill(
                    icon: "gearshape.fill",
                    label: "NOVA",
                    value: "\(nova)",
                    color: novaColor(nova)
                )
            }
            quickStatPill(
                icon: "flask.fill",
                label: "Additives",
                value: additiveCount == 0 ? "None" : "\(additiveCount)",
                color: additiveCount == 0 ? .green : additiveCount <= 3 ? .orange : .red
            )
        }
    }

    private func quickStatPill(icon: String, label: String, value: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(color)
            Text(value)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Nutritional Quality Section

    private var nutritionalQualitySection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(
                color: .green,
                title: "Nutritional Quality",
                trailing: "\(zenScore.pillars.nutrientBalance.score)/\(zenScore.pillars.nutrientBalance.max)"
            )

            if let n = nutriments {
                VStack(spacing: 8) {
                    nutrientBar(label: "Calories", value: n.energyKcal100g, max: 500, unit: "kcal", positive: false)
                    nutrientBar(label: "Fat", value: n.fat100g, max: 30, unit: "g", positive: false)
                    nutrientBar(label: "Sat. Fat", value: n.saturatedFat100g, max: 15, unit: "g", positive: false)
                    nutrientBar(label: "Sugars", value: n.sugars100g, max: 40, unit: "g", positive: false)
                    nutrientBar(label: "Salt", value: n.sodium100g.map { $0 * 2.5 }, max: 5, unit: "g", positive: false)
                    nutrientBar(label: "Fiber", value: n.fiber100g, max: 10, unit: "g", positive: true)
                    nutrientBar(label: "Protein", value: n.proteins100g, max: 25, unit: "g", positive: true)
                }
            } else {
                Text("No nutritional data available")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private func nutrientBar(label: String, value: Double?, max: Double, unit: String, positive: Bool) -> some View {
        HStack(spacing: 10) {
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.6))
                .frame(width: 65, alignment: .leading)

            GeometryReader { geo in
                let v = value ?? 0
                let ratio = min(v / max, 1.0)
                let barColor: Color = positive
                    ? (ratio > 0.5 ? .green : ratio > 0.2 ? Color(red: 0.5, green: 0.8, blue: 0.3) : .gray)
                    : (ratio > 0.7 ? .red : ratio > 0.4 ? .orange : .green)

                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.white.opacity(0.06))
                    RoundedRectangle(cornerRadius: 3)
                        .fill(barColor)
                        .frame(width: Swift.max(0, geo.size.width * CGFloat(ratio)))
                }
            }
            .frame(height: 6)

            if let v = value {
                Text("\(String(format: v < 10 ? "%.1f" : "%.0f", v))\(unit)")
                    .font(.system(size: 11, weight: .semibold).monospacedDigit())
                    .foregroundStyle(.white.opacity(0.7))
                    .frame(width: 50, alignment: .trailing)
            } else {
                Text("—")
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.2))
                    .frame(width: 50, alignment: .trailing)
            }
        }
        .frame(height: 20)
    }

    // MARK: - Additives Section

    private var additivesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(
                color: additiveCount == 0 ? .green : .orange,
                title: "Additives",
                trailing: additiveCount == 0 ? "None" : "\(additiveCount) found"
            )

            if additiveCount == 0 {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.green)
                    Text("No additives")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white.opacity(0.8))
                    Spacer()
                }
                .padding(12)
                .background(Color.green.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            } else {
                let codes = parseAdditivesForDisplay()
                ForEach(codes, id: \.self) { code in
                    let risk = service.additiveRisk(for: code)
                    HStack(spacing: 10) {
                        Circle()
                            .fill(riskColor(risk))
                            .frame(width: 8, height: 8)
                        Text(code.uppercased())
                            .font(.system(size: 13, weight: .semibold).monospaced())
                            .foregroundStyle(.white.opacity(0.85))
                        Spacer()
                        Text(riskLabel(risk))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(riskColor(risk))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(riskColor(risk).opacity(0.12), in: Capsule())
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Ingredients Section (Collapsible)

    private func ingredientsSection(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Button {
                withAnimation(.spring(response: 0.3)) { showIngredients.toggle() }
            } label: {
                HStack {
                    sectionHeaderContent(color: .yellow, title: "Ingredients")
                    Spacer()
                    Image(systemName: showIngredients ? "chevron.up" : "chevron.down")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.3))
                }
            }
            .buttonStyle(.plain)

            if showIngredients {
                Text(text)
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.55))
                    .lineSpacing(3)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Product Info Section

    private var productInfoSection: some View {
        let rows: [(String, String?)] = [
            ("Brand", product.brand),
            ("Category", product.categoriesTags.first?.replacingOccurrences(of: "en:", with: "").replacingOccurrences(of: "-", with: " ").capitalized),
            ("Origin", product.origins),
            ("Sold In", product.countriesTags.isEmpty ? nil :
                product.countriesTags.map { $0.replacingOccurrences(of: "en:", with: "").replacingOccurrences(of: "-", with: " ").capitalized }.joined(separator: ", ")),
        ].filter { $0.1 != nil && !($0.1?.isEmpty ?? true) }

        return Group {
            if !rows.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    sectionHeader(color: .cyan, title: "Product Info", trailing: nil)
                        .padding(.bottom, 10)
                    ForEach(Array(rows.enumerated()), id: \.offset) { i, row in
                        if i > 0 {
                            Rectangle().fill(Color.white.opacity(0.04)).frame(height: 1)
                        }
                        HStack {
                            Text(row.0)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.white.opacity(0.4))
                            Spacer()
                            Text(row.1 ?? "")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(.white.opacity(0.8))
                                .multilineTextAlignment(.trailing)
                        }
                        .padding(.vertical, 8)
                    }
                }
                .padding(18)
                .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.06), lineWidth: 1)
                )
            }
        }
    }

    private var disclaimerText: some View {
        Text("ZenScore™ is an independent assessment combining nutrition science, food processing research, and additive safety data. It is not affiliated with Nutri-Score or NOVA. Data from Open Food Facts.")
            .font(.system(size: 10))
            .foregroundStyle(.white.opacity(0.25))
            .lineSpacing(2)
            .padding(.horizontal, 4)
    }

    // MARK: - Shared Helpers

    private func sectionHeader(color: Color, title: String, trailing: String?) -> some View {
        HStack(spacing: 8) {
            sectionHeaderContent(color: color, title: title)
            Spacer()
            if let trailing = trailing {
                Text(trailing)
                    .font(.system(size: 12, weight: .semibold).monospacedDigit())
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
    }

    private func sectionHeaderContent(color: Color, title: String) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white.opacity(0.85))
        }
    }

    private var zenGradeColor: Color {
        let score = zenScore.score
        if score >= 70 { return Color(red: 0.2, green: 0.82, blue: 0.35) }
        if score >= 55 { return Color(red: 0.55, green: 0.78, blue: 0.15) }
        if score >= 35 { return Color(red: 0.95, green: 0.65, blue: 0.15) }
        return Color(red: 0.92, green: 0.35, blue: 0.3)
    }

    private var zenVerdict: String {
        let score = zenScore.score
        if score >= 70 { return "Excellent" }
        if score >= 55 { return "Good" }
        if score >= 35 { return "Mediocre" }
        return "Bad"
    }

    private var additiveCount: Int {
        parseAdditivesForDisplay().count
    }

    private func parseAdditivesForDisplay() -> [String] {
        product.additivesTags.compactMap { tag -> String? in
            let clean = tag.replacingOccurrences(of: "en:", with: "").lowercased()
            if let range = clean.range(of: "e\\d+[a-z]?", options: .regularExpression) {
                return String(clean[range])
            }
            return nil
        }
    }

    private func riskColor(_ risk: AdditiveRisk) -> Color {
        switch risk {
        case .high: return Color(red: 0.92, green: 0.3, blue: 0.25)
        case .moderate: return Color(red: 0.95, green: 0.6, blue: 0.1)
        case .low: return Color(red: 0.85, green: 0.8, blue: 0.2)
        case .safe: return Color(red: 0.3, green: 0.85, blue: 0.4)
        }
    }

    private func riskLabel(_ risk: AdditiveRisk) -> String {
        switch risk {
        case .high: return "High risk"
        case .moderate: return "Moderate"
        case .low: return "Low risk"
        case .safe: return "Safe"
        }
    }

    private func nutriScoreColor(_ grade: String) -> Color {
        switch grade {
        case "a": return .green
        case "b": return Color(red: 0.5, green: 0.8, blue: 0.1)
        case "c": return .yellow
        case "d": return .orange
        default: return .red
        }
    }

    private func novaColor(_ group: Int) -> Color {
        switch group {
        case 1: return .green
        case 2: return Color(red: 0.5, green: 0.8, blue: 0.15)
        case 3: return .orange
        default: return .red
        }
    }
}

// MARK: - ZenScoreBadge (used by FoodSearchTab)

struct ZenScoreBadge: View {
    enum BadgeSize { case small, large }
    let score: Int
    let grade: String
    let size: BadgeSize

    private var bgColor: Color {
        if score >= 70 { return Color(red: 0.2, green: 0.78, blue: 0.3) }
        if score >= 55 { return Color(red: 0.42, green: 0.72, blue: 0.1) }
        if score >= 35 { return Color(red: 0.92, green: 0.6, blue: 0.1) }
        return Color(red: 0.88, green: 0.3, blue: 0.25)
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
