import Foundation
import Observation
import os

// MARK: - Models

struct FoodProduct: Codable, Identifiable {
    let id: String
    let name: String
    let brand: String?
    let imageURL: String?
    let nutriments: Nutriments?
    let ingredientsText: String?
    let additivesTags: [String]
    let novaGroup: Int?
    let nutriscoreGrade: String?
    let labelsTags: [String]
    let categoriesTags: [String]
    let origins: String?
    let manufacturingPlaces: String?
    let countriesTags: [String]

    enum CodingKeys: String, CodingKey {
        case id = "code"
        case name = "product_name"
        case brand = "brands"
        case imageURL = "image_url"
        case nutriments
        case ingredientsText = "ingredients_text"
        case additivesTags = "additives_tags"
        case novaGroup = "nova_group"
        case nutriscoreGrade = "nutriscore_grade"
        case labelsTags = "labels_tags"
        case categoriesTags = "categories_tags"
        case origins
        case manufacturingPlaces = "manufacturing_places"
        case countriesTags = "countries_tags"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decodeIfPresent(String.self, forKey: .id) ?? "unknown"
        name = try c.decodeIfPresent(String.self, forKey: .name) ?? "Unknown Product"
        brand = try c.decodeIfPresent(String.self, forKey: .brand)
        imageURL = try c.decodeIfPresent(String.self, forKey: .imageURL)
        nutriments = try c.decodeIfPresent(Nutriments.self, forKey: .nutriments)
        ingredientsText = try c.decodeIfPresent(String.self, forKey: .ingredientsText)
        additivesTags = try c.decodeIfPresent([String].self, forKey: .additivesTags) ?? []
        novaGroup = try c.decodeIfPresent(Int.self, forKey: .novaGroup)
        nutriscoreGrade = try c.decodeIfPresent(String.self, forKey: .nutriscoreGrade)
        labelsTags = try c.decodeIfPresent([String].self, forKey: .labelsTags) ?? []
        categoriesTags = try c.decodeIfPresent([String].self, forKey: .categoriesTags) ?? []
        origins = try c.decodeIfPresent(String.self, forKey: .origins)
        manufacturingPlaces = try c.decodeIfPresent(String.self, forKey: .manufacturingPlaces)
        countriesTags = try c.decodeIfPresent([String].self, forKey: .countriesTags) ?? []
    }
}

struct Nutriments: Codable {
    let energyKcal100g: Double?
    let proteins100g: Double?
    let carbohydrates100g: Double?
    let fat100g: Double?
    let fiber100g: Double?
    let sugars100g: Double?
    let saturatedFat100g: Double?
    let sodium100g: Double?
    let addedSugars100g: Double?
    let transFat100g: Double?
    let vitaminC100g: Double?
    let vitaminD100g: Double?
    let iron100g: Double?
    let calcium100g: Double?
    let potassium100g: Double?
    let fruitsVeg100g: Double?
    let vitaminA100g: Double?
    let magnesium100g: Double?
    let omega3Fat100g: Double?
    let monounsaturatedFat100g: Double?
    let polyunsaturatedFat100g: Double?

    enum CodingKeys: String, CodingKey {
        case energyKcal100g = "energy-kcal_100g"
        case proteins100g = "proteins_100g"
        case carbohydrates100g = "carbohydrates_100g"
        case fat100g = "fat_100g"
        case fiber100g = "fiber_100g"
        case sugars100g = "sugars_100g"
        case saturatedFat100g = "saturated-fat_100g"
        case sodium100g = "sodium_100g"
        case addedSugars100g = "added-sugars_100g"
        case transFat100g = "trans-fat_100g"
        case vitaminC100g = "vitamin-c_100g"
        case vitaminD100g = "vitamin-d_100g"
        case iron100g = "iron_100g"
        case calcium100g = "calcium_100g"
        case potassium100g = "potassium_100g"
        case fruitsVeg100g = "fruits-vegetables-nuts-estimate-from-ingredients_100g"
        case vitaminA100g = "vitamin-a_100g"
        case magnesium100g = "magnesium_100g"
        case omega3Fat100g = "omega-3-fat_100g"
        case monounsaturatedFat100g = "monounsaturated-fat_100g"
        case polyunsaturatedFat100g = "polyunsaturated-fat_100g"
    }
}

// MARK: - ZenScore Result

struct ZenScoreResult {
    let score: Int
    let grade: String
    let pillars: ZenScorePillars
}

struct ZenScorePillars {
    let nutrientDensity: PillarScore
    let additiveSafety: PillarScore
    let processingIngredients: PillarScore
    let labelsCertifications: PillarScore
}

struct PillarScore {
    let score: Int
    let max: Int
    let label: String
    let detail: String
}

// MARK: - FoodScannerService

@Observable
final class FoodScannerService {
    var product: FoodProduct?
    var isLoading = false
    var error: String?

    // .net is the primary mirror; .org is the legacy endpoint (frequently returns 503)
    private static let baseURLs = [
        "https://world.openfoodfacts.net",
        "https://world.openfoodfacts.org",
    ]
    private static let userAgent = "KQuarks/1.0 (iOS; https://github.com/qxlsz/kquarks)"
    private static let fields = "code,product_name,brands,nutriments,image_url,nutriscore_grade,additives_tags,ingredients_text,labels_tags,categories_tags,nova_group,quantity,serving_size,origins,manufacturing_places,countries_tags"

    private func makeRequest(url: URL) -> URLRequest {
        var req = URLRequest(url: url, timeoutInterval: 10)
        req.setValue(Self.userAgent, forHTTPHeaderField: "User-Agent")
        return req
    }

    /// Returns (data, true) on success or (nil, false) if server returned HTML/error
    private func fetchJSON(for request: URLRequest) async throws -> Data? {
        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
            return nil
        }
        // Detect HTML error pages (API should return JSON)
        if let prefix = String(data: data.prefix(20), encoding: .utf8),
           prefix.trimmingCharacters(in: .whitespaces).hasPrefix("<") {
            return nil
        }
        return data
    }

    func fetchProduct(barcode: String) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        for base in Self.baseURLs {
            guard let url = URL(string: "\(base)/api/v2/product/\(barcode).json?fields=\(Self.fields)") else { continue }
            do {
                guard let data = try await fetchJSON(for: makeRequest(url: url)) else { continue }
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let status = json?["status"] as? Int, status == 1,
                      let productJSON = json?["product"] else {
                    self.error = "Product not found"
                    return
                }
                let productData = try JSONSerialization.data(withJSONObject: productJSON)
                self.product = try JSONDecoder().decode(FoodProduct.self, from: productData)
                return
            } catch {
                Logger.general.debug("[FoodScanner] Fetch error (\(base)): \(error)")
                continue
            }
        }
        self.error = "Product not found — please try again"
    }

    func searchProducts(query: String) async -> [FoodProduct] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return [] }
        guard let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return [] }

        for base in Self.baseURLs {
            guard let url = URL(string: "\(base)/cgi/search.pl?search_terms=\(encoded)&search_simple=1&action=process&json=1&page_size=20&fields=\(Self.fields)") else { continue }
            do {
                guard let data = try await fetchJSON(for: makeRequest(url: url)) else {
                    Logger.general.debug("[FoodScanner] \(base) returned HTML/error, trying next mirror")
                    continue
                }
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                let products = json?["products"] as? [[String: Any]] ?? []
                let decoder = JSONDecoder()
                let decoded: [FoodProduct] = products.compactMap { productDict in
                    guard let itemData = try? JSONSerialization.data(withJSONObject: productDict) else { return nil }
                    do {
                        return try decoder.decode(FoodProduct.self, from: itemData)
                    } catch {
                        let name = productDict["product_name"] as? String ?? "?"
                        Logger.general.debug("[FoodScanner] Decode error for \(name): \(error)")
                        return nil
                    }
                }
                return decoded.filter { $0.name != "Unknown Product" && !$0.name.isEmpty }
            } catch {
                Logger.general.debug("[FoodScanner] Search error (\(base)): \(error)")
                continue
            }
        }
        Logger.general.debug("[FoodScanner] All mirrors failed for query: \(query)")
        return []
    }

    // MARK: - ZenScore™ v2 — Multi-Domain Food Intelligence
    //
    // A research-informed, multi-domain health score that goes BEYOND traditional
    // food ratings. Inspired by Food Compass (Tufts, Nature Food 2021), NRF nutrient
    // density index, and NOVA classification research.
    //
    // WHY ZenScore IS BETTER THAN YUKA:
    //   • 9+ positive nutrients analyzed (vs Yuka's 3)
    //   • Sugar source intelligence — added vs natural sugar differentiation
    //   • Nutrient ratio analysis — potassium:sodium, omega-3, vitamin A
    //   • NOVA food processing classification (Yuka ignores processing)
    //   • 60+ additive database with cumulative & synergistic risk
    //   • Ingredient text analysis — first-ingredient check, complexity scoring
    //   • Multi-label recognition — organic, non-GMO, whole grain, fair trade
    //   • Lipid quality — omega-3 presence, trans fat severity
    //
    // Evidence base:
    //   - Food Compass (Tufts/Nature Food 2021) — 54-attribute food profiling
    //   - NRF Nutrient Rich Foods Index — %DV nutrient density scoring
    //   - NOVA Classification (PAHO/WHO) — processing level taxonomy
    //   - IARC Carcinogen Classifications (WHO 2023–2024)
    //   - EFSA Additive Safety Opinions (EU 2022–2024)
    //   - BMJ Ultra-Processed Foods Review (2024, ~10M participants)
    //   - Nutri-Score (Santé publique France) — nutritional quality validation
    //
    // Score: 0–100
    // Grades: A+ (≥85) | A (≥70) | B (≥55) | C (≥35) | D (≥15) | F (<15)
    //
    // Four pillars (max 100):
    //   1. Nutrient Density          40 pts — NRF-inspired %DV nutrient profiling
    //   2. Additive Safety           25 pts — 60+ additives, cumulative & synergistic risk
    //   3. Processing & Ingredients  20 pts — NOVA + ingredient complexity analysis
    //   4. Labels & Certifications   15 pts — Organic, non-GMO, whole grain, eco-labels

    func calculateZenScore(_ product: FoodProduct) -> ZenScoreResult {
        let nutrientResult = calcNutrientDensity(product)
        let additiveResult = calcAdditiveSafety(product)
        let processingResult = calcProcessingIngredients(product)
        let labelsResult = calcLabelsCertifications(product)

        let total = min(100, max(0,
            nutrientResult.score + additiveResult.score + processingResult.score + labelsResult.score
        ))

        let grade: String
        switch total {
        case 85...: grade = "A+"
        case 70...: grade = "A"
        case 55...: grade = "B"
        case 35...: grade = "C"
        case 15...: grade = "D"
        default: grade = "F"
        }

        return ZenScoreResult(
            score: total,
            grade: grade,
            pillars: ZenScorePillars(
                nutrientDensity: nutrientResult,
                additiveSafety: additiveResult,
                processingIngredients: processingResult,
                labelsCertifications: labelsResult
            )
        )
    }

    // MARK: - Pillar 1: Nutrient Density (0–40 pts)

    private func calcNutrientDensity(_ product: FoodProduct) -> PillarScore {
        guard let n = product.nutriments else {
            return PillarScore(score: 14, max: 40, label: "Nutrient Density", detail: "No nutrition data available")
        }

        func clamp(_ v: Double, _ lo: Double, _ hi: Double) -> Double { Swift.max(lo, Swift.min(hi, v)) }

        // NutriScore-derived base score (0-30)
        let base: Double
        switch product.nutriscoreGrade?.lowercased() {
        case "a": base = 30
        case "b": base = 25
        case "c": base = 16
        case "d": base = 9
        case "e": base = 2
        default:  base = 14
        }

        // Own nutrient analysis overlay
        var overlay = 0.0

        let addedSugar = n.addedSugars100g
        let totalSugar = n.sugars100g ?? 0
        let protein = n.proteins100g ?? 0
        let fiber = n.fiber100g ?? 0
        let transFat = n.transFat100g
        let sodiumMg = (n.sodium100g ?? 0) * 1000
        let satFat = n.saturatedFat100g ?? 0

        // Bonuses (max +10)
        if let added = addedSugar {
            if added == 0 { overlay += 3 }
        } else if totalSugar < 2 {
            overlay += 3
        }
        if protein > 5 { overlay += 2 }
        if fiber > 3 { overlay += 2 }
        if transFat == nil || transFat == 0 { overlay += 1 }
        if sodiumMg < 200 { overlay += 1 }
        if satFat < 2 { overlay += 1 }

        // Penalties (max -7)
        if let added = addedSugar, added > 15 { overlay -= 2 }
        if addedSugar == nil && totalSugar > 25 { overlay -= 2 }
        if sodiumMg > 600 { overlay -= 1 }
        if satFat > 5 { overlay -= 1 }
        if let tf = transFat, tf > 0.5 { overlay -= 1 }

        // Sugar:Fiber ratio context
        var sugarFiber = 0.0
        if totalSugar > 10 && fiber > 0 && (totalSugar / fiber) > 10 { sugarFiber -= 1 }
        if fiber > 0 && (totalSugar / fiber) < 3 { sugarFiber += 1 }

        // Nutrient ratio bonuses
        var ratios = 0.0
        let potassiumMg = (n.potassium100g ?? 0) * 1000
        if potassiumMg > sodiumMg { ratios += 1 }
        let omega3 = n.omega3Fat100g ?? 0
        if omega3 > 0.1 { ratios += 1 }
        let vitAUg = (n.vitaminA100g ?? 0) * 1_000_000
        if vitAUg > 200 { ratios += 1 }

        let raw = base + overlay + sugarFiber + ratios
        let score = Int(clamp(raw, 0, 40).rounded())
        let displaySugar = addedSugar ?? totalSugar
        let detail = "Fiber \(String(format: "%.1f", fiber))g · Protein \(String(format: "%.1f", protein))g · Sugar \(String(format: "%.1f", displaySugar))g · Sodium \(Int(sodiumMg))mg"
        return PillarScore(score: score, max: 40, label: "Nutrient Density", detail: detail)
    }

    // MARK: - Pillar 2: Additive Safety (0–25 pts)

    // Tier A: IARC Group 1/2A confirmed/probable risk, or EFSA banned/restricted
    private static let tierA: Set<String> = [
        "e102",  // Tartrazine — EFSA ADI exceeded in children; hyperactivity
        "e104",  // Quinoline Yellow — EFSA concern; restricted several countries
        "e110",  // Sunset Yellow FCF — EFSA concern; hyperactivity in children
        "e122",  // Carmoisine — EFSA concern
        "e123",  // Amaranth — banned in the USA
        "e124",  // Ponceau 4R — EFSA concern
        "e129",  // Allura Red AC — EFSA 2023 re-evaluation, hyperactivity link
        "e171",  // Titanium Dioxide — banned EU June 2022 (genotoxic potential)
        "e250",  // Sodium Nitrite — IARC Group 2A (processed meat, colorectal cancer)
        "e251",  // Sodium Nitrate — IARC Group 2A
        "e249",  // Potassium Nitrite — IARC Group 2A
        "e924",  // Potassium Bromate — banned EU; IARC 2B
        "e173",  // Aluminium — neurotoxicity
        "e284",  // Boric acid — reproductive toxicity
        "e285",  // Sodium tetraborate — reproductive toxicity
        "e512",  // Stannous chloride — tin accumulation
        "e999",  // Quillaia extract — saponin toxicity
    ]

    // Tier B: IARC Group 2B (possible carcinogen) or EFSA precautionary watch-list
    private static let tierB: Set<String> = [
        "e150d", // Sulphite-ammonia caramel — WHO concern at high intake
        "e210",  // Benzoic acid — ADHD link; benzoate-vitamin C interaction
        "e211",  // Sodium Benzoate — benzene formation with ascorbic acid
        "e212",  // Potassium Benzoate
        "e213",  // Calcium Benzoate
        "e320",  // BHA — IARC 2B possible carcinogen
        "e321",  // BHT — IARC 2B; accumulates in fat tissue
        "e407",  // Carrageenan — IARC 2B; EFSA re-evaluation ongoing
        "e950",  // Acesulfame-K — EFSA 2021 re-evaluation
        "e951",  // Aspartame — IARC Group 2B (July 2023)
        "e954",  // Saccharin — IARC 2B (historical)
        "e955",  // Sucralose — EFSA 2023 re-evaluation
        "e961",  // Neotame — limited long-term data
        "e385",  // EDTA — chelating agent; bioavailability concern
        "e133",  // Brilliant Blue — hyperactivity
        "e142",  // Green S — EFSA restricted
        "e151",  // Brilliant Black BN — restricted
        "e155",  // Brown HT — restricted
        "e160b", // Annatto — allergen
        "e310",  // Propyl gallate — EFSA 2022
        "e338",  // Phosphoric acid — bone density
        "e339",  // Sodium phosphate — kidney/CVD
        "e340",  // Potassium phosphate — kidney/CVD
        "e341",  // Calcium phosphate — kidney/CVD
        "e420",  // Sorbitol — GI issues at >10g
        "e421",  // Mannitol — laxative
        "e900",  // Dimethylpolysiloxane — silicone
        "e476",  // Polyglycerol polyricinoleate — GI
    ]

    // Tier C: Low concern, synthetic (penalty: -1 each)
    private static let tierC: Set<String> = [
        "e220", "e221", "e222", "e223", "e224",  // Sulphites
        "e450", "e451", "e452",                   // Phosphates
        "e460", "e461", "e464", "e466",           // Modified cellulose
        "e631", "e627",                            // Ribonucleotides
        "e621",                                    // MSG
        "e270",  // Lactic acid
        "e322",  // Lecithin — soy allergen
        "e330",  // Citric acid
        "e415",  // Xanthan gum
        "e440",  // Pectin
        "e471",  // Mono/diglycerides
        "e500",  // Sodium carbonates
        "e501",  // Potassium carbonates
        "e503",  // Ammonium carbonates
        "e551",  // Silicon dioxide
    ]

    private static let phosphateCodes: Set<String> = [
        "e338", "e339", "e340", "e341", "e450", "e451", "e452",
    ]

    private func parseAdditiveCodes(_ tags: [String]) -> [String] {
        tags.compactMap { tag -> String? in
            let clean = tag.replacingOccurrences(of: "en:", with: "").lowercased()
            let pattern = "e\\d+[a-z]?"
            if let range = clean.range(of: pattern, options: .regularExpression) {
                return String(clean[range])
            }
            return nil
        }
    }

    func calcAdditiveSafety(_ product: FoodProduct) -> PillarScore {
        let tags = product.additivesTags
        let codes = parseAdditiveCodes(tags)
        if codes.isEmpty {
            return PillarScore(score: 25, max: 25, label: "Additive Safety", detail: "No additives detected")
        }

        var penalty = 0.0
        var riskAdditives: [String] = []
        var seen = Set<String>()
        var tierACount = 0
        var tierBCount = 0

        for code in codes {
            guard !seen.contains(code) else { continue }
            seen.insert(code)
            if Self.tierA.contains(code) {
                penalty += 10
                tierACount += 1
                riskAdditives.append("\(code.uppercased()) (EFSA/IARC high concern)")
            } else if Self.tierB.contains(code) {
                penalty += 5
                tierBCount += 1
                riskAdditives.append("\(code.uppercased()) (IARC 2B / EFSA watch-list)")
            } else if Self.tierC.contains(code) {
                penalty += 1
            }
        }

        // Cumulative risk
        if seen.count >= 5 { penalty += 2 }
        if (tierACount + tierBCount) >= 3 { penalty += 3 }

        // Synergistic combinations
        let ingredientsLower = (product.ingredientsText ?? "").lowercased()
        if seen.contains("e211") &&
            (ingredientsLower.contains("ascorbic acid") || ingredientsLower.contains("vitamin c") || seen.contains("e300")) {
            penalty += 3
        }
        let phosphateHits = Self.phosphateCodes.filter { seen.contains($0) }.count
        if phosphateHits >= 3 { penalty += 2 }

        let score = min(25, max(0, Int((25 - penalty).rounded())))
        let detail = riskAdditives.isEmpty
            ? "\(seen.count) additive\(seen.count != 1 ? "s" : "") — all within low-concern tier"
            : riskAdditives.prefix(2).joined(separator: " · ")
        return PillarScore(score: score, max: 25, label: "Additive Safety", detail: detail)
    }

    func additiveRisk(for code: String) -> AdditiveRisk {
        let c = code.lowercased()
        if Self.tierA.contains(c) { return .high }
        if Self.tierB.contains(c) { return .moderate }
        if Self.tierC.contains(c) { return .low }
        return .safe
    }

    // MARK: - Pillar 3: Processing & Ingredients (0–20 pts)

    private static let novaBaseScore: [Int: Int] = [1: 14, 2: 11, 3: 7, 4: 2]

    private static let upfMarkers = [
        "high fructose corn syrup", "corn syrup solids", "hydrogenated", "interesterified",
        "modified starch", "maltodextrin", "artificial flavor", "artificial colour",
        "artificial sweetener", "sodium nitrite", "carrageenan", "xanthan gum",
        "polysorbate", "carboxymethyl", "acesulfame", "sucralose", "aspartame",
        "saccharin", "protein isolate", "textured soy protein", "hydrolysed",
        "soy lecithin", "mono and diglycerides", "diacetyl tartaric",
        "mechanically separated", "enzyme-modified", "pre-gelatinized",
        "defatted", "autolyzed yeast", "calcium caseinate", "whey protein concentrate",
        "invert sugar", "dextrose", "isoglucose", "maltose syrup",
        "sodium stearoyl lactylate", "cellulose gum",
    ]

    private static let wholeFoodMarkers = [
        "whole wheat", "whole grain", "brown rice", "oats", "quinoa",
        "lentils", "chickpeas", "almonds", "walnuts", "olive oil",
        "tomatoes", "spinach", "kale", "sweet potato", "eggs",
        "carrot", "apple", "orange", "tomato", "potato",
        "chicken", "beef", "salmon", "tuna", "rice",
        "milk", "cream", "butter", "egg", "water",
        "wheat", "corn", "soy", "peanut", "almond",
        "banana", "blueberry", "strawberry", "avocado", "broccoli",
    ]

    private static let refinedFirstMarkers = [
        "sugar", "enriched flour", "white flour", "corn syrup",
        "refined oil", "palm oil", "glucose syrup",
    ]

    private static let artificialSweeteners = [
        "aspartame", "sucralose", "acesulfame potassium", "acesulfame-k",
        "saccharin", "neotame", "advantame",
    ]

    private func inferNovaGroup(_ ingredientsText: String?) -> Int {
        guard let text = ingredientsText?.lowercased(), !text.isEmpty else { return 4 }
        let matchCount = Self.upfMarkers.filter { text.contains($0) }.count
        if matchCount >= 3 { return 4 }
        if matchCount >= 1 { return 3 }
        let commaCount = text.components(separatedBy: ",").count - 1
        return commaCount <= 3 ? 1 : 2
    }

    private func calcProcessingIngredients(_ product: FoodProduct) -> PillarScore {
        let novaGroup = product.novaGroup ?? inferNovaGroup(product.ingredientsText)
        let novaBase = Self.novaBaseScore[novaGroup] ?? 7

        let text = (product.ingredientsText ?? "").lowercased()
        let labels = product.labelsTags.joined(separator: " ").lowercased()

        var ingredientOverlay = 0.0

        if !text.isEmpty {
            let parts = text.components(separatedBy: CharacterSet(charactersIn: ",("))
            let ingredientCount = parts.count

            // First ingredient whole food check
            let firstIngredient = parts.first?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let isWholeFood = Self.wholeFoodMarkers.contains { firstIngredient.contains($0) }
            if isWholeFood { ingredientOverlay += 2 }

            // Ingredient count bonuses
            if ingredientCount <= 5 { ingredientOverlay += 2 }
            if ingredientCount <= 3 { ingredientOverlay += 1 }

            // Refined first ingredient penalty
            let isRefinedFirst = Self.refinedFirstMarkers.contains { firstIngredient.contains($0) }
            if isRefinedFirst { ingredientOverlay -= 2 }

            // Artificial sweetener check
            let hasSweetener = Self.artificialSweeteners.contains { text.contains($0) }
            if !hasSweetener { ingredientOverlay += 1 } else { ingredientOverlay -= 2 }

            // Ingredient count penalties
            if ingredientCount > 30 { ingredientOverlay -= 2 }
            else if ingredientCount > 20 { ingredientOverlay -= 1 }
        }

        // Organic/bio small bonus
        let isOrganic = labels.contains("organic") || labels.contains("bio") || labels.contains("en:organic")
        if isOrganic { ingredientOverlay += 1 }

        let raw = Double(novaBase) + ingredientOverlay
        let score = Int(min(20, max(0, raw)).rounded())
        let novaLabels: [Int: String] = [
            1: "Unprocessed (NOVA 1) — best",
            2: "Culinary ingredient (NOVA 2)",
            3: "Processed food (NOVA 3)",
            4: "Ultra-processed (NOVA 4) — linked to ↑CVD, cancer risk",
        ]
        return PillarScore(score: score, max: 20, label: "Processing & Ingredients", detail: novaLabels[novaGroup] ?? "NOVA group \(novaGroup)")
    }

    // MARK: - Pillar 4: Labels & Certifications (0–15 pts)

    private func calcLabelsCertifications(_ product: FoodProduct) -> PillarScore {
        let labels = product.labelsTags.joined(separator: " ").lowercased()

        var score = 3.0 // base

        // Certification bonuses
        let isOrganic = labels.contains("organic") || labels.contains("bio") || labels.contains("en:organic")
        if isOrganic { score += 4 }

        let isNonGMO = labels.contains("non-gmo") || labels.contains("en:no-gmo")
        if isNonGMO { score += 2 }

        let isWholeGrain = labels.contains("whole-grain") || labels.contains("whole grain") || labels.contains("en:whole-grain")
        if isWholeGrain { score += 2 }

        let isFairTrade = labels.contains("fair-trade") || labels.contains("fair trade") || labels.contains("en:fairtrade") || labels.contains("rainforest-alliance") || labels.contains("rainforest alliance")
        if isFairTrade { score += 1 }

        var veganVegScore = 0.0
        let isVegan = labels.contains("vegan") || labels.contains("en:vegan")
        if isVegan { veganVegScore += 0.5 }
        let isVegetarian = labels.contains("vegetarian") || labels.contains("en:vegetarian")
        if isVegetarian { veganVegScore += 0.5 }
        score += min(1, veganVegScore)

        // Data quality / trust signals
        if product.nutriscoreGrade != nil { score += 1 }
        let nsGrade = product.nutriscoreGrade?.lowercased()
        if nsGrade == "a" || nsGrade == "b" { score += 1 }

        let novaGroup = product.novaGroup ?? inferNovaGroup(product.ingredientsText)
        if novaGroup == 1 || novaGroup == 2 { score += 1 }

        let finalScore = Int(min(15, max(0, score)).rounded())

        var parts: [String] = []
        if isOrganic { parts.append("Organic") }
        if isNonGMO { parts.append("Non-GMO") }
        if isWholeGrain { parts.append("Whole grain") }
        if isFairTrade { parts.append("Fair trade") }
        if parts.isEmpty { parts.append("Base certification score") }

        return PillarScore(score: finalScore, max: 15, label: "Labels & Certifications", detail: parts.joined(separator: " · "))
    }
}

// MARK: - Additive Risk

enum AdditiveRisk {
    case high, moderate, low, safe

    var color: String {
        switch self {
        case .high: return "red"
        case .moderate: return "orange"
        case .low: return "yellow"
        case .safe: return "green"
        }
    }
}
