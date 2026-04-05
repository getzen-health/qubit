import Foundation
import Observation

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
    }
}

// MARK: - ZenScore Result

struct ZenScoreResult {
    let score: Int
    let grade: String
    let pillars: ZenScorePillars
}

struct ZenScorePillars {
    let nutrientBalance: PillarScore
    let processingIntegrity: PillarScore
    let additiveSafety: PillarScore
    let ingredientQuality: PillarScore
    let contextFit: PillarScore
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
                print("[FoodScanner] Fetch error (\(base)): \(error)")
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
                    print("[FoodScanner] \(base) returned HTML/error, trying next mirror")
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
                        print("[FoodScanner] Decode error for \(productDict["product_name"] ?? "?"): \(error)")
                        return nil
                    }
                }
                return decoded.filter { $0.name != "Unknown Product" && !$0.name.isEmpty }
            } catch {
                print("[FoodScanner] Search error (\(base)): \(error)")
                continue
            }
        }
        print("[FoodScanner] All mirrors failed for query: \(query)")
        return []
    }

    // MARK: - ZenScore Algorithm (4-pillar, 0-100)
    // Ported from web/lib/food-scoring.ts
    // Yuka-inspired: 50% nutrition, 25% additives, 15% processing, 10% ingredients
    // Grades: A+(≥85), A(≥70), B(≥55), C(≥35), D(≥15), F(<15)

    func calculateZenScore(_ product: FoodProduct) -> ZenScoreResult {
        let nutrientResult = calcNutrientBalance(product)
        let additiveResult = calcAdditiveSafety(product.additivesTags)
        let processingResult = calcProcessingIntegrity(product)
        let ingredientResult = calcIngredientQuality(product)

        let total = min(100, max(0,
            nutrientResult.score + additiveResult.score + processingResult.score + ingredientResult.score
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
                nutrientBalance: nutrientResult,
                processingIntegrity: processingResult,
                additiveSafety: additiveResult,
                ingredientQuality: ingredientResult,
                contextFit: PillarScore(score: 0, max: 0, label: "Context Fit", detail: "Included in other pillars")
            )
        )
    }

    // MARK: - Pillar 1: Nutrient Balance (0–50 pts)

    private func calcNutrientBalance(_ product: FoodProduct) -> PillarScore {
        let n = product.nutriments
        guard let n = n else {
            return PillarScore(score: 25, max: 50, label: "Nutrient Balance", detail: "No nutrition data available")
        }

        func clamp(_ v: Double, _ lo: Double, _ hi: Double) -> Double { max(lo, min(hi, v)) }

        let fiber    = n.fiber100g ?? 0
        let protein  = n.proteins100g ?? 0
        let vitC     = (n.vitaminC100g ?? 0) * 1000
        let vitD     = (n.vitaminD100g ?? 0) * 1_000_000
        let iron     = (n.iron100g ?? 0) * 1000
        let calcium  = (n.calcium100g ?? 0) * 1000
        let potassium = (n.potassium100g ?? 0) * 1000
        let fruitsVeg = n.fruitsVeg100g ?? 0

        // Positive nutrients (lower thresholds for gentler scoring)
        let posScore =
            clamp(fiber / 5, 0, 1) * 6 +
            clamp(protein / 10, 0, 1) * 5 +
            clamp(vitC / 60, 0, 1) * 3 +
            clamp(vitD / 5, 0, 1) * 2 +
            clamp(iron / 10, 0, 1) * 2 +
            clamp(calcium / 800, 0, 1) * 2 +
            clamp(potassium / 2000, 0, 1) * 2 +
            clamp(fruitsVeg / 80, 0, 1) * 3

        // Sugar penalty: differentiate added vs natural sugars
        let addedSugar = n.addedSugars100g
        let totalSugar = n.sugars100g ?? 0
        let sugarPenalty: Double
        if let added = addedSugar {
            sugarPenalty = clamp(added / 25, 0, 1) * 10 + clamp((totalSugar - added) / 50, 0, 1) * 3
        } else {
            sugarPenalty = clamp(totalSugar / 40, 0, 1) * 8
        }

        let satFat  = n.saturatedFat100g ?? 0
        let sodium  = (n.sodium100g ?? 0) * 1000
        let transFat = n.transFat100g ?? 0
        let energy  = n.energyKcal100g ?? 0

        let negPenalty = sugarPenalty +
            clamp(satFat / 15, 0, 1) * 7 +
            clamp(sodium / 1200, 0, 1) * 6 +
            clamp(transFat / 2, 0, 1) * 5 +
            (energy > 800 ? 3.0 : energy > 500 ? 1.5 : 0)

        // NutriScore grade as a strong signal
        let nutriScoreBonus: Double
        switch product.nutriscoreGrade?.lowercased() {
        case "a": nutriScoreBonus = 15
        case "b": nutriScoreBonus = 10
        case "c": nutriScoreBonus = 0
        case "d": nutriScoreBonus = -8
        case "e": nutriScoreBonus = -15
        default: nutriScoreBonus = 0
        }

        let raw = 28 + posScore - negPenalty + nutriScoreBonus
        let displaySugar = addedSugar ?? totalSugar
        let score = min(50, max(0, Int(raw.rounded())))
        let detail = "Fiber \(String(format: "%.1f", fiber))g · Protein \(String(format: "%.1f", protein))g · Sugar \(String(format: "%.1f", displaySugar))g · Sodium \(Int(sodium))mg"
        return PillarScore(score: score, max: 50, label: "Nutrient Balance", detail: detail)
    }

    // MARK: - Pillar 2: Processing Integrity (0–15 pts)

    private static let novaBaseScore: [Int: Int] = [1: 15, 2: 12, 3: 7, 4: 2]

    private static let upfMarkers = [
        "high fructose corn syrup", "corn syrup solids", "hydrogenated", "interesterified",
        "modified starch", "maltodextrin", "artificial flavor", "artificial colour",
        "artificial sweetener", "sodium nitrite", "carrageenan", "xanthan gum",
        "polysorbate", "carboxymethyl", "acesulfame", "sucralose", "aspartame",
        "saccharin", "protein isolate", "textured soy protein", "hydrolysed",
        "soy lecithin", "mono and diglycerides", "diacetyl tartaric",
    ]

    private func inferNovaGroup(_ ingredientsText: String?) -> Int {
        guard let text = ingredientsText?.lowercased(), !text.isEmpty else { return 4 }
        let matchCount = Self.upfMarkers.filter { text.contains($0) }.count
        if matchCount >= 3 { return 4 }
        if matchCount >= 1 { return 3 }
        let commaCount = text.components(separatedBy: ",").count - 1
        return commaCount <= 3 ? 1 : 2
    }

    private func calcProcessingIntegrity(_ product: FoodProduct) -> PillarScore {
        let novaGroup = product.novaGroup ?? inferNovaGroup(product.ingredientsText)
        let base = Self.novaBaseScore[novaGroup] ?? 7
        let score = min(15, max(0, base))
        let novaLabels: [Int: String] = [
            1: "Unprocessed (NOVA 1) — best",
            2: "Culinary ingredient (NOVA 2)",
            3: "Processed food (NOVA 3)",
            4: "Ultra-processed (NOVA 4) — linked to ↑CVD, cancer risk",
        ]
        return PillarScore(score: score, max: 15, label: "Processing Level", detail: novaLabels[novaGroup] ?? "NOVA group \(novaGroup)")
    }

    // MARK: - Pillar 3: Additive Safety (0–25 pts)

    private static let tierA: Set<String> = [
        "e102", "e104", "e110", "e122", "e123", "e124", "e129",
        "e171", "e250", "e251", "e249", "e924",
    ]
    private static let tierB: Set<String> = [
        "e150d", "e210", "e211", "e212", "e213", "e320", "e321",
        "e407", "e950", "e951", "e954", "e955", "e961", "e385",
    ]
    private static let tierC: Set<String> = [
        "e220", "e221", "e222", "e223", "e224",
        "e450", "e451", "e452",
        "e460", "e461", "e464", "e466",
        "e631", "e627", "e621",
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

    func calcAdditiveSafety(_ tags: [String]) -> PillarScore {
        let codes = parseAdditiveCodes(tags)
        if codes.isEmpty {
            return PillarScore(score: 25, max: 25, label: "Additive Safety", detail: "No additives detected")
        }

        var penalty = 0
        var riskAdditives: [String] = []
        var seen = Set<String>()

        for code in codes {
            guard !seen.contains(code) else { continue }
            seen.insert(code)
            if Self.tierA.contains(code) {
                penalty += 10
                riskAdditives.append("\(code.uppercased()) (EFSA/IARC high concern)")
            } else if Self.tierB.contains(code) {
                penalty += 6
                riskAdditives.append("\(code.uppercased()) (IARC 2B / EFSA watch-list)")
            } else if Self.tierC.contains(code) {
                penalty += 2
            }
        }

        let score = min(25, max(0, 25 - penalty))
        let detail = riskAdditives.isEmpty
            ? "\(codes.count) additive\(codes.count != 1 ? "s" : "") — all within low-concern tier"
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

    // MARK: - Pillar 4: Ingredient Quality (0–10 pts)

    private static let wholeFoodMarkers = [
        "whole wheat", "whole grain", "brown rice", "oats", "quinoa",
        "lentils", "chickpeas", "almonds", "walnuts", "olive oil",
        "tomatoes", "spinach", "kale", "sweet potato", "eggs",
    ]
    private static let refinedFirstMarkers = [
        "sugar", "enriched flour", "white flour", "corn syrup",
        "refined oil", "palm oil", "glucose syrup",
    ]
    private static let artificialSweeteners = [
        "aspartame", "sucralose", "acesulfame potassium", "acesulfame-k",
        "saccharin", "neotame", "advantame",
    ]

    private func calcIngredientQuality(_ product: FoodProduct) -> PillarScore {
        let text = (product.ingredientsText ?? "").lowercased()
        let labels = product.labelsTags.joined(separator: " ").lowercased()

        guard !text.isEmpty else {
            return PillarScore(score: 5, max: 10, label: "Ingredient Quality", detail: "Ingredient list unavailable — default score applied")
        }

        let top5 = text.components(separatedBy: CharacterSet(charactersIn: ",(")).prefix(5).joined(separator: " ")
        var score = 5.0
        let isOrganic = labels.contains("organic") || labels.contains("bio")
        if isOrganic { score += 3 }
        let isWholeGrain = labels.contains("whole grain") || labels.contains("whole-grain")
        if isWholeGrain { score += 1 }
        let wholeFoodHits = Self.wholeFoodMarkers.filter { top5.contains($0) }.count
        if wholeFoodHits > 0 { score += 1 }
        let refinedHits = Self.refinedFirstMarkers.filter { top5.contains($0) }.count
        if refinedHits > 0 { score -= 2 }
        let hasSweetener = Self.artificialSweeteners.contains { text.contains($0) }
        if hasSweetener { score -= 3 }

        var parts: [String] = []
        if isOrganic { parts.append("Certified organic") }
        if isWholeGrain { parts.append("Whole grain certified") }
        if hasSweetener { parts.append("Contains artificial sweeteners") }
        if refinedHits > 0 { parts.append("\(refinedHits) refined input\(refinedHits > 1 ? "s" : "") in top ingredients") }
        if wholeFoodHits > 0 { parts.append("\(wholeFoodHits) whole food ingredient\(wholeFoodHits > 1 ? "s" : "")") }

        return PillarScore(
            score: min(10, max(0, Int(score.rounded()))),
            max: 10,
            label: "Ingredient Quality",
            detail: parts.isEmpty ? "Standard ingredient composition" : parts.joined(separator: " · ")
        )
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
