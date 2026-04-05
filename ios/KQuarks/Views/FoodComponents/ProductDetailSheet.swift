import SwiftUI

struct ProductDetailSheet: View {
    let product: FoodProduct
    let service: FoodScannerService
    @Environment(\.dismiss) private var dismiss
    @State private var animatedScore: Double = 0
    @State private var showIngredients = false
    @State private var showScoreInfo = false

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
                scoreExplainerCard
                    .padding(.top, 16)
                pillarBreakdownCard
                    .padding(.top, 16)
                nutriScoreSection
                    .padding(.top, 16)
                novaGroupSection
                    .padding(.top, 16)
                nutritionalQualitySection
                    .padding(.top, 16)
                nutrientsTableCard
                    .padding(.top, 16)
                additivesSection
                    .padding(.top, 16)
                if let text = product.ingredientsText, !text.isEmpty {
                    ingredientsSection(text)
                        .padding(.top, 16)
                }
                sourcingSection
                    .padding(.top, 16)
                productInfoSection
                    .padding(.top, 16)
                sourcesSection
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
                trailing: "\(zenScore.pillars.nutrientDensity.score)/\(zenScore.pillars.nutrientDensity.max)"
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
                    let info = Self.additiveDatabase[code.lowercased()]
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 10) {
                            Circle()
                                .fill(riskColor(risk))
                                .frame(width: 8, height: 8)
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(code.uppercased())
                                        .font(.system(size: 13, weight: .semibold).monospaced())
                                        .foregroundStyle(.white.opacity(0.85))
                                    if let name = info?.name {
                                        Text("· \(name)")
                                            .font(.system(size: 12))
                                            .foregroundStyle(.white.opacity(0.5))
                                    }
                                }
                                if let reason = info?.concern {
                                    Text(reason)
                                        .font(.system(size: 11))
                                        .foregroundStyle(.white.opacity(0.45))
                                        .lineLimit(2)
                                }
                            }
                            Spacer()
                            Text(riskLabel(risk))
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(riskColor(risk))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(riskColor(risk).opacity(0.12), in: Capsule())
                        }
                        if let source = info?.source {
                            Text(source)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(.white.opacity(0.3))
                                .padding(.leading, 18)
                        }
                    }
                    .padding(.vertical, 6)
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
        Text("ZenScore™ analyzes 54+ food attributes across 4 scientific domains — going beyond simple nutrition labels to evaluate additive safety, processing level, ingredient quality, and certifications. Powered by research from Food Compass, EFSA, IARC, and NOVA classification.")
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

    // MARK: - Additive Evidence Database

    private struct AdditiveInfo {
        let name: String
        let concern: String
        let source: String
    }

    private static let additiveDatabase: [String: AdditiveInfo] = [
        // Tier A — High risk
        "e102": AdditiveInfo(name: "Tartrazine", concern: "Linked to hyperactivity in children. Banned in several countries.", source: "EFSA 2009 — ADI exceeded in children · Southampton Study"),
        "e104": AdditiveInfo(name: "Quinoline Yellow", concern: "May cause allergic reactions and hyperactivity.", source: "EFSA re-evaluation 2009 · UK Food Standards Agency"),
        "e110": AdditiveInfo(name: "Sunset Yellow", concern: "Linked to hyperactivity in children. Requires warning label in EU.", source: "EFSA 2014 · EU Regulation 1333/2008"),
        "e122": AdditiveInfo(name: "Carmoisine", concern: "May cause allergic reactions and hyperactivity in children.", source: "EFSA Scientific Opinion 2009"),
        "e123": AdditiveInfo(name: "Amaranth", concern: "Suspected carcinogen. Banned in the United States.", source: "FDA ban 1976 · EFSA restricted use"),
        "e124": AdditiveInfo(name: "Ponceau 4R", concern: "Linked to hyperactivity. Requires warning label in EU.", source: "EFSA re-evaluation · Southampton Study"),
        "e129": AdditiveInfo(name: "Allura Red", concern: "Linked to hyperactivity in children. Under EFSA re-evaluation.", source: "EFSA 2023 re-evaluation · CSPI petition to FDA"),
        "e171": AdditiveInfo(name: "Titanium Dioxide", concern: "Genotoxicity concern — no longer considered safe. Banned in EU.", source: "EFSA 2021 — banned EU June 2022"),
        "e250": AdditiveInfo(name: "Sodium Nitrite", concern: "Forms nitrosamines (carcinogenic) during cooking. Linked to colorectal cancer.", source: "IARC Group 2A · WHO processed meat report 2015"),
        "e251": AdditiveInfo(name: "Sodium Nitrate", concern: "Converts to nitrite in the body. Associated with increased cancer risk.", source: "IARC Group 2A · EFSA re-evaluation 2017"),
        "e249": AdditiveInfo(name: "Potassium Nitrite", concern: "Same nitrosamine formation concern as sodium nitrite.", source: "IARC Group 2A"),
        "e924": AdditiveInfo(name: "Potassium Bromate", concern: "Possible carcinogen. Banned in EU, Canada, Brazil, China.", source: "IARC Group 2B · EU ban"),
        "e173": AdditiveInfo(name: "Aluminium", concern: "Neurotoxicity concern at high exposure. Accumulates in body.", source: "EFSA 2008 — reduced tolerable weekly intake"),
        // Tier B — Moderate risk
        "e150d": AdditiveInfo(name: "Sulphite Ammonia Caramel", concern: "Contains 4-MEI, a possible carcinogen formed during production.", source: "IARC · California Prop 65 listing"),
        "e210": AdditiveInfo(name: "Benzoic Acid", concern: "Can form benzene when combined with vitamin C. ADHD link.", source: "FDA benzene investigation · Southampton Study"),
        "e211": AdditiveInfo(name: "Sodium Benzoate", concern: "Forms benzene with ascorbic acid. Linked to hyperactivity.", source: "FDA 2006 benzene in beverages report"),
        "e320": AdditiveInfo(name: "BHA", concern: "Possible carcinogen. Endocrine disruptor at high doses.", source: "IARC Group 2B · NTP Report on Carcinogens"),
        "e321": AdditiveInfo(name: "BHT", concern: "Possible carcinogen. Accumulates in adipose tissue.", source: "IARC Group 2B"),
        "e407": AdditiveInfo(name: "Carrageenan", concern: "May cause gut inflammation. Under EFSA re-evaluation.", source: "IARC Group 2B (degraded) · Tobacman 2001 review"),
        "e950": AdditiveInfo(name: "Acesulfame-K", concern: "Artificial sweetener. May affect gut microbiome.", source: "EFSA 2021 re-evaluation · Suez et al. Nature 2014"),
        "e951": AdditiveInfo(name: "Aspartame", concern: "Classified as possibly carcinogenic to humans by IARC.", source: "IARC Group 2B — July 2023 classification"),
        "e954": AdditiveInfo(name: "Saccharin", concern: "Historical cancer concern. Delisted from NTP report in 2000.", source: "IARC Group 2B (historical)"),
        "e955": AdditiveInfo(name: "Sucralose", concern: "May affect glucose metabolism and gut bacteria.", source: "EFSA 2023 re-evaluation · Schiffman & Rother 2013"),
        "e338": AdditiveInfo(name: "Phosphoric Acid", concern: "High intake linked to lower bone density.", source: "Tucker et al. Am J Clin Nutr 2006"),
        // Tier C — Low risk
        "e220": AdditiveInfo(name: "Sulphur Dioxide", concern: "Can trigger asthma and allergic reactions in sensitive individuals.", source: "EFSA 2016 · FDA allergen labeling"),
        "e621": AdditiveInfo(name: "MSG", concern: "Generally safe. Some report sensitivity symptoms at high doses.", source: "FDA GRAS status · EFSA 2017 ADI set"),
        "e322": AdditiveInfo(name: "Lecithin", concern: "Generally safe emulsifier. Soy allergen concern.", source: "EFSA — no safety concern at current use levels"),
        "e330": AdditiveInfo(name: "Citric Acid", concern: "Generally safe. Natural compound found in citrus fruits.", source: "EFSA — no safety concern"),
        "e415": AdditiveInfo(name: "Xanthan Gum", concern: "Generally safe thickener. May cause bloating at very high intake.", source: "EFSA — acceptable daily intake not specified (safe)"),
        "e440": AdditiveInfo(name: "Pectin", concern: "Natural fiber from fruits. Generally recognized as safe.", source: "EFSA — no safety concern"),
        "e471": AdditiveInfo(name: "Mono/Diglycerides", concern: "Common emulsifier. May contain trans fats from processing.", source: "EFSA 2017 re-evaluation"),
        "e500": AdditiveInfo(name: "Sodium Carbonate", concern: "Baking soda. Safe at normal use levels.", source: "EFSA — no safety concern"),
    ]

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
        case 1: return Color(red: 0.2, green: 0.85, blue: 0.4)
        case 2: return Color(red: 0.5, green: 0.82, blue: 0.15)
        case 3: return Color(red: 0.95, green: 0.65, blue: 0.15)
        default: return Color(red: 0.92, green: 0.35, blue: 0.3)
        }
    }

    // MARK: - Score Explainer Card

    private var scoreExplainerCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                withAnimation(.spring(response: 0.3)) { showScoreInfo.toggle() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "info.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.purple)
                    Text("What is ZenScore™?")
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
                    Text("ZenScore™ evaluates food across multiple scientific dimensions — going beyond simple nutrition labels:")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.6))

                    VStack(alignment: .leading, spacing: 6) {
                        explainerRow("leaf.fill", .green, "Nutrient Density", "Vitamins, protein, fiber vs sugar, sodium — %DV based")
                        explainerRow("flask.fill", .orange, "Additive Safety", "60+ additives analyzed with EFSA/IARC evidence")
                        explainerRow("gearshape.2.fill", .blue, "Processing Level", "NOVA classification + ingredient complexity")
                        explainerRow("sparkles", Color(red: 0.5, green: 0.9, blue: 0.5), "Ingredient Quality", "Whole foods vs refined/artificial analysis")
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
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private func explainerRow(_ icon: String, _ iconColor: Color, _ title: String, _ desc: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundStyle(iconColor)
                .frame(width: 16)
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

    // MARK: - Pillar Breakdown Card

    private var pillarBreakdownCard: some View {
        VStack(spacing: 14) {
            sectionHeader(color: .purple, title: "Score Breakdown", trailing: nil)

            let pillars: [(String, Color, PillarScore)] = [
                ("leaf.fill", Color(red: 0.3, green: 0.85, blue: 0.4), zenScore.pillars.nutrientDensity),
                ("gearshape.2.fill", Color(red: 0.4, green: 0.7, blue: 0.95), zenScore.pillars.processingIngredients),
                ("flask.fill", Color(red: 0.95, green: 0.6, blue: 0.2), zenScore.pillars.additiveSafety),
                ("sparkles", Color(red: 0.5, green: 0.9, blue: 0.5), zenScore.pillars.labelsCertifications),
            ]
            ForEach(Array(pillars.enumerated()), id: \.offset) { _, item in
                let (icon, color, pillar) = item
                PillarRow(icon: icon, iconColor: color, pillar: pillar, barColor: color)
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Nutri-Score Section

    private var nutriScoreSection: some View {
        Group {
            if let grade = product.nutriscoreGrade?.lowercased(),
               grade != "unknown" && grade != "not-applicable" {
                VStack(alignment: .leading, spacing: 14) {
                    sectionHeader(color: .green, title: "Nutri-Score", trailing: nil)

                    NutriScoreBar(activeGrade: grade)
                        .frame(maxWidth: .infinity)

                    Text("European nutrition-only rating (A=best, E=worst). Based on calories, sugar, fat & sodium vs protein, fiber & fruits per 100g. Does not consider additives or processing.")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.4))
                        .lineSpacing(2)
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

    // MARK: - NOVA Group Section

    private var novaGroupSection: some View {
        Group {
            if let nova = product.novaGroup {
                VStack(spacing: 12) {
                    sectionHeader(color: novaColor(nova), title: "NOVA Group", trailing: nil)

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

    // MARK: - Nutrients Table Card

    private var nutrientsTableCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(color: .cyan, title: "Nutrients per 100g", trailing: nil)

            if let n = nutriments {
                VStack(spacing: 0) {
                    NutrientRow(name: "Calories", value: n.energyKcal100g, unit: "kcal", style: .neutral)
                    nutrientDivider
                    NutrientRow(name: "Protein", value: n.proteins100g, unit: "g", style: .positive)
                    nutrientDivider
                    NutrientRow(name: "Carbohydrates", value: n.carbohydrates100g, unit: "g", style: .neutral)
                    nutrientDivider
                    NutrientRow(name: "  of which Sugars", value: n.sugars100g, unit: "g", style: .caution)
                    if let added = n.addedSugars100g {
                        nutrientDivider
                        NutrientRow(name: "  Added Sugars", value: added, unit: "g", style: .negative)
                    }
                    nutrientDivider
                    NutrientRow(name: "Fat", value: n.fat100g, unit: "g", style: .neutral)
                    nutrientDivider
                    NutrientRow(name: "  Saturated Fat", value: n.saturatedFat100g, unit: "g", style: .negative)
                    if let trans = n.transFat100g {
                        nutrientDivider
                        NutrientRow(name: "  Trans Fat", value: trans, unit: "g", style: .negative)
                    }
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
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private var nutrientDivider: some View {
        Rectangle()
            .fill(Color.white.opacity(0.04))
            .frame(height: 1)
            .padding(.vertical, 4)
    }

    // MARK: - Sourcing & Origin Section

    private var sourcingSection: some View {
        let origins = product.origins?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let manufacturing = product.manufacturingPlaces?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let countries = product.countriesTags
            .map { $0.replacingOccurrences(of: "en:", with: "").replacingOccurrences(of: "-", with: " ").capitalized }
        let hasData = !origins.isEmpty || !manufacturing.isEmpty || !countries.isEmpty

        return Group {
            if hasData {
                VStack(alignment: .leading, spacing: 12) {
                    sectionHeader(color: .cyan, title: "Sourcing & Origin", trailing: nil)

                    VStack(alignment: .leading, spacing: 10) {
                        if !origins.isEmpty {
                            sourcingRow(icon: "leaf.fill", color: .green, title: "Ingredients Origin", value: origins)
                        }
                        if !manufacturing.isEmpty {
                            sourcingRow(icon: "building.2.fill", color: .orange, title: "Manufactured In", value: manufacturing)
                        }
                        if !countries.isEmpty {
                            sourcingRow(icon: "globe", color: .cyan, title: "Sold In", value: countries.joined(separator: ", "))
                        }
                    }

                    Text("Origin data from Open Food Facts. May not reflect all sourcing regions for every batch.")
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.3))
                        .lineSpacing(2)
                        .padding(.top, 2)
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

    private func sourcingRow(icon: String, color: Color, title: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(color.opacity(0.8))
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.5))
                Text(value)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white.opacity(0.9))
            }
            Spacer()
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    // MARK: - Sources Section (contextual evidence)

    private var sourcesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(color: .white.opacity(0.4), title: "Why This Score?", trailing: nil)

            // Contextual nutrient evidence
            if let n = nutriments {
                let sugar = n.sugars100g ?? 0
                let satFat = n.saturatedFat100g ?? 0
                let fiber = n.fiber100g ?? 0
                let sodium = (n.sodium100g ?? 0) * 1000

                if sugar > 10 {
                    evidenceRow(
                        icon: "exclamationmark.triangle.fill",
                        color: .orange,
                        title: "High sugar (\(String(format: "%.1f", sugar))g/100g)",
                        detail: "WHO recommends <25g added sugar per day. High sugar intake linked to obesity, type 2 diabetes, and cardiovascular disease.",
                        source: "WHO Guideline: Sugars intake for adults and children, 2015"
                    )
                }
                if satFat > 5 {
                    evidenceRow(
                        icon: "heart.fill",
                        color: .red,
                        title: "High saturated fat (\(String(format: "%.1f", satFat))g/100g)",
                        detail: "Saturated fat raises LDL cholesterol. AHA recommends <13g/day for a 2,000 calorie diet.",
                        source: "American Heart Association — Dietary Fats, 2021"
                    )
                }
                if fiber > 3 {
                    evidenceRow(
                        icon: "leaf.fill",
                        color: .green,
                        title: "Good fiber source (\(String(format: "%.1f", fiber))g/100g)",
                        detail: "Dietary fiber supports digestion, reduces cholesterol, and helps regulate blood sugar.",
                        source: "Harvard T.H. Chan School of Public Health"
                    )
                }
                if sodium > 600 {
                    evidenceRow(
                        icon: "drop.triangle.fill",
                        color: .orange,
                        title: "High sodium (\(Int(sodium))mg/100g)",
                        detail: "Excess sodium raises blood pressure. WHO recommends <2,000mg/day.",
                        source: "WHO Guideline: Sodium intake for adults and children, 2023"
                    )
                }
                if let trans = n.transFat100g, trans > 0 {
                    evidenceRow(
                        icon: "xmark.octagon.fill",
                        color: .red,
                        title: "Contains trans fat (\(String(format: "%.1f", trans))g/100g)",
                        detail: "Industrial trans fats have no safe level of intake. WHO targets global elimination by 2025.",
                        source: "WHO REPLACE trans fat elimination programme"
                    )
                }
            }

            // Contextual NOVA evidence
            if let nova = product.novaGroup, nova == 4 {
                evidenceRow(
                    icon: "gearshape.2.fill",
                    color: .red,
                    title: "Ultra-processed food (NOVA 4)",
                    detail: "Ultra-processed foods linked to higher risk of cardiovascular disease, cancer, and all-cause mortality in meta-analysis of 10M+ participants.",
                    source: "BMJ 2024 — Lane et al. (doi:10.1136/bmj-2023-077310)"
                )
            }

            // Contextual additive evidence
            let codes = parseAdditivesForDisplay()
            let highRiskCodes = codes.filter { service.additiveRisk(for: $0) == .high }
            if !highRiskCodes.isEmpty {
                let names = highRiskCodes.prefix(3).compactMap { Self.additiveDatabase[$0.lowercased()]?.name ?? $0.uppercased() }
                evidenceRow(
                    icon: "flask.fill",
                    color: .red,
                    title: "\(highRiskCodes.count) high-risk additive\(highRiskCodes.count > 1 ? "s" : "")",
                    detail: "\(names.joined(separator: ", ")) — flagged by European Food Safety Authority (EFSA) or International Agency for Research on Cancer (IARC).",
                    source: "EFSA Scientific Opinions · IARC Monographs"
                )
            }

            // NutriScore context
            if let grade = product.nutriscoreGrade?.lowercased() {
                let (emoji, verdict) = nutriScoreVerdict(grade)
                evidenceRow(
                    icon: emoji,
                    color: nutriScoreVerdictColor(grade),
                    title: "Nutri-Score \(grade.uppercased())",
                    detail: verdict,
                    source: "Santé publique France — Nutri-Score algorithm v2, 2024"
                )
            }
        }
        .padding(18)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private func evidenceRow(icon: String, color: Color, title: String, detail: String, source: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(color.opacity(0.12))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(color)
                }
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.9))
            }
            Text(detail)
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.55))
                .lineSpacing(2)
                .padding(.leading, 42)
            HStack(spacing: 4) {
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 9))
                Text(source)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(.purple.opacity(0.6))
            .padding(.leading, 42)
        }
        .padding(.vertical, 8)
    }

    private func nutriScoreVerdict(_ grade: String) -> (String, String) {
        switch grade {
        case "a": return ("checkmark.seal.fill", "Excellent nutritional quality. Rich in positive nutrients with low negative markers.")
        case "b": return ("hand.thumbsup.fill", "Good nutritional quality. Positive nutrients outweigh negatives.")
        case "c": return ("equal.circle.fill", "Average nutritional quality. Balance of positive and negative nutrients.")
        case "d": return ("exclamationmark.circle.fill", "Below average. Higher levels of sugar, salt, or saturated fat.")
        case "e": return ("xmark.circle.fill", "Poor nutritional quality. High in sugar, salt, saturated fat, or calories.")
        default: return ("questionmark.circle.fill", "Nutritional quality not rated.")
        }
    }

    private func nutriScoreVerdictColor(_ grade: String) -> Color {
        switch grade {
        case "a": return Color(red: 0.1, green: 0.75, blue: 0.35)
        case "b": return Color(red: 0.5, green: 0.8, blue: 0.1)
        case "c": return .orange
        case "d": return Color(red: 0.95, green: 0.55, blue: 0.1)
        case "e": return Color(red: 0.9, green: 0.25, blue: 0.2)
        default: return .gray
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

// MARK: - PillarRow

struct PillarRow: View {
    let icon: String
    let iconColor: Color
    let pillar: PillarScore
    var barColor: Color = .green

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(iconColor)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(pillar.label)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.85))
                    Spacer()
                    Text("\(pillar.score)/\(pillar.max)")
                        .font(.system(size: 12, weight: .semibold).monospacedDigit())
                        .foregroundStyle(pillarScoreColor(pillar.score, max: pillar.max))
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
                            .frame(width: Swift.max(0, geo.size.width * CGFloat(pillar.score) / CGFloat(Swift.max(pillar.max, 1))))
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

    private func pillarScoreColor(_ score: Int, max: Int) -> Color {
        let ratio = Double(score) / Double(Swift.max(max, 1))
        if ratio >= 0.7 { return Color(red: 0.3, green: 0.88, blue: 0.45) }
        if ratio >= 0.4 { return Color(red: 0.95, green: 0.65, blue: 0.15) }
        return Color(red: 0.92, green: 0.35, blue: 0.3)
    }
}

// MARK: - NutriScoreBar

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

// MARK: - NutrientRow

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

// MARK: - AdditiveRiskBadge

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
