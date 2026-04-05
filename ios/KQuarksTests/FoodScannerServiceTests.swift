import XCTest
@testable import KQuarks

// MARK: - FoodScannerService Unit Tests
//
// Tests the QuarkScore algorithm (5-pillar 0–100 scoring), additive safety,
// additive risk classification, and FoodProduct JSON decoding.
// All tests are pure logic — no network calls.

final class FoodScannerServiceTests: XCTestCase {

    var sut: FoodScannerService!

    override func setUp() {
        super.setUp()
        sut = FoodScannerService()
    }

    override func tearDown() {
        sut = nil
        super.tearDown()
    }

    // MARK: - FoodProduct JSON Decoding

    func testFoodProductDecodesFromJSON() throws {
        let json = """
        {
          "code": "1234567890123",
          "product_name": "Organic Oats",
          "brands": "Nature's Best",
          "nutriments": {
            "energy-kcal_100g": 367,
            "proteins_100g": 13.5,
            "carbohydrates_100g": 60.0,
            "fat_100g": 7.0,
            "fiber_100g": 10.0,
            "sugars_100g": 1.0,
            "saturated-fat_100g": 1.2,
            "sodium_100g": 0.005
          },
          "nutriscore_grade": "a",
          "nova_group": 1,
          "additives_tags": [],
          "labels_tags": ["en:organic"],
          "categories_tags": ["en:cereals"],
          "countries_tags": []
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let product = try decoder.decode(FoodProduct.self, from: json)

        XCTAssertEqual(product.id, "1234567890123")
        XCTAssertEqual(product.name, "Organic Oats")
        XCTAssertEqual(product.brand, "Nature's Best")
        XCTAssertEqual(product.nutriscoreGrade, "a")
        XCTAssertEqual(product.novaGroup, 1)
        XCTAssertEqual(product.labelsTags, ["en:organic"])
        XCTAssertTrue(product.additivesTags.isEmpty)
    }

    func testFoodProductHandlesMissingFields() throws {
        let json = """
        {
          "code": "9999",
          "additives_tags": [],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": []
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)

        XCTAssertEqual(product.id, "9999")
        XCTAssertEqual(product.name, "Unknown Product")
        XCTAssertNil(product.brand)
        XCTAssertNil(product.novaGroup)
        XCTAssertNil(product.nutriscoreGrade)
        XCTAssertNil(product.nutriments)
        XCTAssertTrue(product.additivesTags.isEmpty)
    }

    func testNutrimentsDecoding() throws {
        let json = """
        {
          "code": "1",
          "additives_tags": [],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nutriments": {
            "energy-kcal_100g": 200.0,
            "proteins_100g": 10.0,
            "carbohydrates_100g": 25.0,
            "fat_100g": 8.0,
            "fiber_100g": 5.0,
            "sugars_100g": 3.0,
            "saturated-fat_100g": 2.0,
            "sodium_100g": 0.3
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let n = try XCTUnwrap(product.nutriments)

        XCTAssertEqual(n.energyKcal100g ?? 0, 200.0, accuracy: 0.01)
        XCTAssertEqual(n.proteins100g ?? 0, 10.0, accuracy: 0.01)
        XCTAssertEqual(n.carbohydrates100g ?? 0, 25.0, accuracy: 0.01)
        XCTAssertEqual(n.fat100g ?? 0, 8.0, accuracy: 0.01)
        XCTAssertEqual(n.fiber100g ?? 0, 5.0, accuracy: 0.01)
        XCTAssertEqual(n.sugars100g ?? 0, 3.0, accuracy: 0.01)
    }

    // MARK: - QuarkScore: Additive Safety Pillar (0–20 pts)

    func testCalcAdditiveSafety_noAdditives_returns20() {
        let result = sut.calcAdditiveSafety([])
        XCTAssertEqual(result.score, 20)
        XCTAssertEqual(result.max, 20)
        XCTAssertTrue(result.detail.lowercased().contains("no additives"))
    }

    func testCalcAdditiveSafety_tierAAdditive_lowerScore() {
        // e102 is Tier A (high risk) — penalises 12 pts
        let result = sut.calcAdditiveSafety(["en:e102"])
        XCTAssertLessThan(result.score, 20)
        XCTAssertGreaterThanOrEqual(result.score, 0)
    }

    func testCalcAdditiveSafety_tierCOnlyAdditive_slightPenalty() {
        // Tier C (low risk) — small penalty
        let tierC = sut.calcAdditiveSafety(["en:e220"])
        let noAdditive = sut.calcAdditiveSafety([])
        XCTAssertLessThanOrEqual(tierC.score, noAdditive.score)
        XCTAssertGreaterThan(tierC.score, 0)
    }

    func testCalcAdditiveSafety_scoreNeverExceedsMax() {
        let result = sut.calcAdditiveSafety(["en:e102", "en:e950", "en:e220", "en:e460"])
        XCTAssertLessThanOrEqual(result.score, 20)
    }

    func testCalcAdditiveSafety_scoreNeverNegative() {
        // Many high-risk additives should floor at 0
        let manyBad = (1...10).map { "en:e10\($0 % 5 == 0 ? "2" : "29")" }
        let result = sut.calcAdditiveSafety(manyBad)
        XCTAssertGreaterThanOrEqual(result.score, 0)
    }

    // MARK: - Additive Risk Classification

    func testAdditiveRisk_tierA_returnsHigh() {
        // e102 = Tartrazine — Tier A (high risk)
        let risk = sut.additiveRisk(for: "e102")
        XCTAssertEqual(risk.color, "red")
    }

    func testAdditiveRisk_tierB_returnsModerate() {
        // e950 = Acesulfame-K — Tier B
        let risk = sut.additiveRisk(for: "e950")
        XCTAssertEqual(risk.color, "orange")
    }

    func testAdditiveRisk_tierC_returnsLow() {
        // e220 = Sulphur dioxide — Tier C
        let risk = sut.additiveRisk(for: "e220")
        XCTAssertEqual(risk.color, "yellow")
    }

    func testAdditiveRisk_unknownCode_returnsSafe() {
        let risk = sut.additiveRisk(for: "e999")
        XCTAssertEqual(risk.color, "green")
    }

    func testAdditiveRisk_uppercaseInput_matchesCaseInsensitive() {
        // Function lowercases internally
        let lower = sut.additiveRisk(for: "e102")
        let upper = sut.additiveRisk(for: "E102")
        XCTAssertEqual(lower.color, upper.color)
    }

    // MARK: - QuarkScore: Full Score Range

    func testCalculateQuarkScore_cleanProduct_highScore() throws {
        let json = """
        {
          "code": "1",
          "product_name": "Whole Grain Oats",
          "additives_tags": [],
          "labels_tags": ["en:organic"],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 1,
          "nutriscore_grade": "a",
          "ingredients_text": "whole oats",
          "nutriments": {
            "energy-kcal_100g": 367,
            "proteins_100g": 13.0,
            "carbohydrates_100g": 60.0,
            "fat_100g": 7.0,
            "fiber_100g": 10.0,
            "sugars_100g": 1.0,
            "saturated-fat_100g": 1.0,
            "sodium_100g": 0.001
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let result = sut.calculateQuarkScore(product)

        XCTAssertGreaterThanOrEqual(result.score, 50, "Clean product should score at least 50")
        XCTAssertLessThanOrEqual(result.score, 100)
        XCTAssertEqual(result.pillars.additiveSafety.score, 20, "No additives = perfect additive score")
    }

    func testCalculateQuarkScore_ultraProcessedProduct_lowScore() throws {
        let json = """
        {
          "code": "2",
          "product_name": "Ultra Processed Snack",
          "additives_tags": ["en:e102", "en:e950", "en:e124", "en:e320"],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 4,
          "nutriscore_grade": "e",
          "ingredients_text": "enriched flour, sugar, corn syrup, palm oil, artificial flavor, modified starch, maltodextrin, sodium nitrite",
          "nutriments": {
            "energy-kcal_100g": 550,
            "proteins_100g": 3.0,
            "carbohydrates_100g": 80.0,
            "fat_100g": 25.0,
            "fiber_100g": 0.5,
            "sugars_100g": 40.0,
            "saturated-fat_100g": 12.0,
            "sodium_100g": 1.2
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let result = sut.calculateQuarkScore(product)

        XCTAssertLessThan(result.score, 50, "Ultra-processed product should score below 50")
        XCTAssertGreaterThanOrEqual(result.score, 0)
        XCTAssertLessThan(result.pillars.additiveSafety.score, 20, "Multiple bad additives should reduce additive score")
    }

    func testCalculateQuarkScore_totalNeverExceeds100() throws {
        let json = """
        {
          "code": "3",
          "additives_tags": [],
          "labels_tags": ["en:organic", "en:whole-grain"],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 1,
          "nutriscore_grade": "a",
          "ingredients_text": "whole wheat, oats, quinoa, almonds, walnuts",
          "nutriments": {
            "energy-kcal_100g": 300,
            "proteins_100g": 20.0,
            "carbohydrates_100g": 40.0,
            "fat_100g": 10.0,
            "fiber_100g": 12.0,
            "sugars_100g": 2.0,
            "saturated-fat_100g": 1.5,
            "sodium_100g": 0.001
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let result = sut.calculateQuarkScore(product)

        XCTAssertLessThanOrEqual(result.score, 100)
        XCTAssertGreaterThanOrEqual(result.score, 0)
    }

    func testCalculateQuarkScore_totalNeverNegative() throws {
        let json = """
        {
          "code": "4",
          "additives_tags": ["en:e102", "en:e124", "en:e129", "en:e171", "en:e250", "en:e950", "en:e955"],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 4,
          "ingredients_text": "sugar, enriched flour, corn syrup, aspartame, sucralose",
          "nutriments": {
            "energy-kcal_100g": 600,
            "proteins_100g": 1.0,
            "carbohydrates_100g": 90.0,
            "fat_100g": 30.0,
            "sugars_100g": 60.0,
            "saturated-fat_100g": 20.0,
            "sodium_100g": 2.0
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let result = sut.calculateQuarkScore(product)

        XCTAssertGreaterThanOrEqual(result.score, 0)
    }

    func testCalculateQuarkScore_pillarsAddUpToTotal() throws {
        let json = """
        {
          "code": "5",
          "additives_tags": ["en:e211"],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 3,
          "ingredients_text": "tomatoes, salt, citric acid",
          "nutriments": {
            "energy-kcal_100g": 30,
            "proteins_100g": 1.5,
            "carbohydrates_100g": 5.0,
            "fat_100g": 0.2,
            "fiber_100g": 2.0,
            "sugars_100g": 4.0,
            "sodium_100g": 0.6
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let result = sut.calculateQuarkScore(product)
        let p = result.pillars

        let pillarSum = p.nutrientBalance.score + p.processingIntegrity.score +
                        p.additiveSafety.score + p.ingredientQuality.score + p.contextFit.score

        XCTAssertEqual(result.score, pillarSum, "Total score must equal sum of pillar scores")
    }

    // MARK: - FoodProduct Decoding Edge Cases

    func testFoodProductDecodes_nullArrayFields() throws {
        // API sometimes returns null instead of empty array for tags
        let json = """
        {
          "code": "100",
          "product_name": "Test Product"
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        XCTAssertEqual(product.name, "Test Product")
        XCTAssertTrue(product.additivesTags.isEmpty)
        XCTAssertTrue(product.labelsTags.isEmpty)
        XCTAssertTrue(product.categoriesTags.isEmpty)
        XCTAssertTrue(product.countriesTags.isEmpty)
    }

    func testFoodProductDecodes_integerNutriments() throws {
        // API returns int (e.g. 0) instead of float for some nutrient values
        let json = """
        {
          "code": "101",
          "product_name": "Integer Nutrients",
          "additives_tags": [],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nutriments": {
            "energy-kcal_100g": 200,
            "proteins_100g": 10,
            "fat_100g": 0,
            "carbohydrates_100g": 30,
            "sugars_100g": 5,
            "sodium_100g": 0,
            "fiber_100g": 3,
            "saturated-fat_100g": 0
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let n = try XCTUnwrap(product.nutriments)
        XCTAssertEqual(n.energyKcal100g, 200.0)
        XCTAssertEqual(n.fat100g, 0.0)
    }

    func testFoodProductDecodes_emptyProductName() throws {
        let json = """
        {
          "code": "102",
          "product_name": "",
          "additives_tags": [],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": []
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        XCTAssertEqual(product.name, "")
    }

    func testFoodProductDecodes_realAPIResponse() throws {
        // Exact JSON structure from OpenFoodFacts API search response
        let json = """
        {
          "additives_tags": [],
          "brands": "Bolthouse Farms",
          "categories_tags": ["en:beverages-and-beverages-preparations", "en:plant-based-foods-and-beverages"],
          "code": "0071464240806",
          "countries_tags": ["en:france", "en:united-states"],
          "image_url": "https://images.openfoodfacts.net/images/products/007/146/424/0806/front_en.23.400.jpg",
          "ingredients_text": "PINEAPPLE JUICE CONCENTRATE, APPLE JUICE FROM CONCENTRATE",
          "nova_group": 4,
          "nutriments": {
            "added-sugars": 0,
            "added-sugars_100g": 0,
            "carbohydrates": 12.5,
            "carbohydrates_100g": 12.5,
            "energy-kcal": 54.17,
            "energy-kcal_100g": 54.17,
            "fat": 0,
            "fat_100g": 0,
            "fiber": 0.42,
            "fiber_100g": 0.42,
            "proteins": 0.42,
            "proteins_100g": 0.42,
            "saturated-fat": 0,
            "saturated-fat_100g": 0,
            "sodium": 0.008,
            "sodium_100g": 0.008,
            "sugars": 10,
            "sugars_100g": 10,
            "trans-fat": 0,
            "trans-fat_100g": 0
          },
          "nutriscore_grade": "c",
          "product_name": "Green Goodness 100% Juice Smoothie",
          "quantity": "1540 g",
          "serving_size": "1 portion (240 ml)"
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        XCTAssertEqual(product.id, "0071464240806")
        XCTAssertEqual(product.name, "Green Goodness 100% Juice Smoothie")
        XCTAssertEqual(product.brand, "Bolthouse Farms")
        XCTAssertEqual(product.novaGroup, 4)
        XCTAssertEqual(product.nutriscoreGrade, "c")
        XCTAssertNotNil(product.nutriments)
        XCTAssertEqual(product.nutriments?.energyKcal100g ?? 0, 54.17, accuracy: 0.01)
        XCTAssertEqual(product.nutriments?.sugars100g ?? 0, 10.0, accuracy: 0.01)
    }

    func testFoodProductDecodes_missingOptionalFields() throws {
        // Some products have very sparse data
        let json = """
        {
          "code": "103",
          "product_name": "Sparse Product",
          "additives_tags": [],
          "categories_tags": [],
          "countries_tags": []
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        XCTAssertEqual(product.name, "Sparse Product")
        XCTAssertNil(product.brand)
        XCTAssertNil(product.imageURL)
        XCTAssertNil(product.nutriments)
        XCTAssertNil(product.ingredientsText)
        XCTAssertNil(product.novaGroup)
        XCTAssertNil(product.nutriscoreGrade)
        XCTAssertNil(product.origins)
        XCTAssertNil(product.manufacturingPlaces)
        XCTAssertTrue(product.labelsTags.isEmpty)
    }

    func testFoodProductDecodes_extraFieldsIgnored() throws {
        // API returns fields not in our model — should be ignored
        let json = """
        {
          "code": "104",
          "product_name": "Extra Fields",
          "additives_tags": [],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nutrition_data": "on",
          "nutrition_data_per": "100g",
          "product_quantity": 500,
          "product_quantity_unit": "g",
          "unknown_future_field": "some value"
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        XCTAssertEqual(product.name, "Extra Fields")
    }

    // MARK: - Search Result Batch Decoding

    func testSearchResultBatchDecoding() throws {
        // Simulate what searchProducts does: decode array of products
        let productsJSON = """
        [
          {
            "code": "001",
            "product_name": "Product A",
            "brands": "Brand A",
            "additives_tags": [],
            "labels_tags": [],
            "categories_tags": [],
            "countries_tags": [],
            "nova_group": 1,
            "nutriments": { "energy-kcal_100g": 100, "proteins_100g": 5 }
          },
          {
            "code": "002",
            "product_name": "Product B",
            "additives_tags": ["en:e330"],
            "labels_tags": ["en:organic"],
            "categories_tags": ["en:beverages"],
            "countries_tags": ["en:united-states"],
            "nova_group": 2
          },
          {
            "code": "003",
            "product_name": "",
            "additives_tags": [],
            "labels_tags": [],
            "categories_tags": [],
            "countries_tags": []
          },
          {
            "code": "004",
            "additives_tags": [],
            "labels_tags": [],
            "categories_tags": [],
            "countries_tags": []
          }
        ]
        """.data(using: .utf8)!

        let products = try JSONDecoder().decode([FoodProduct].self, from: productsJSON)
        XCTAssertEqual(products.count, 4)

        // Apply the same filter as searchProducts
        let filtered = products.filter { $0.name != "Unknown Product" && !$0.name.isEmpty }
        XCTAssertEqual(filtered.count, 2, "Should filter out empty name and 'Unknown Product'")
        XCTAssertEqual(filtered[0].name, "Product A")
        XCTAssertEqual(filtered[1].name, "Product B")
    }

    func testSearchResultDecoding_compactMapApproach() throws {
        // Test the exact compactMap approach used in searchProducts
        let productsArray: [[String: Any]] = [
            [
                "code": "001",
                "product_name": "Valid Product",
                "additives_tags": [] as [String],
                "labels_tags": [] as [String],
                "categories_tags": [] as [String],
                "countries_tags": [] as [String],
            ],
            [
                "code": "002",
                "product_name": "Another Valid",
                "brands": "Test Brand",
                "additives_tags": [] as [String],
                "labels_tags": [] as [String],
                "categories_tags": [] as [String],
                "countries_tags": [] as [String],
                "nutriments": [
                    "energy-kcal_100g": 200,
                    "proteins_100g": 10.5,
                ] as [String: Any],
            ],
        ]

        let decoder = JSONDecoder()
        let decoded: [FoodProduct] = productsArray.compactMap { productDict in
            guard let itemData = try? JSONSerialization.data(withJSONObject: productDict) else { return nil }
            return try? decoder.decode(FoodProduct.self, from: itemData)
        }

        XCTAssertEqual(decoded.count, 2)
        XCTAssertEqual(decoded[0].name, "Valid Product")
        XCTAssertEqual(decoded[1].name, "Another Valid")
        XCTAssertEqual(decoded[1].brand, "Test Brand")
    }

    // MARK: - Search API Integration Tests

    func testSearchProducts_liveAPI_bolthouse() async throws {
        let results = await sut.searchProducts(query: "bolthouse")
        XCTAssertGreaterThan(results.count, 0, "Search for 'bolthouse' should return results from OpenFoodFacts API")
        XCTAssertTrue(results.allSatisfy { !$0.name.isEmpty }, "All results should have non-empty names")
        XCTAssertTrue(results.allSatisfy { $0.name != "Unknown Product" }, "No 'Unknown Product' entries")
    }

    func testSearchProducts_liveAPI_coca_cola() async throws {
        let results = await sut.searchProducts(query: "coca cola")
        XCTAssertGreaterThan(results.count, 0, "Search for 'coca cola' should return results")
    }

    func testSearchProducts_liveAPI_nutella() async throws {
        let results = await sut.searchProducts(query: "nutella")
        XCTAssertGreaterThan(results.count, 0, "Search for 'nutella' should return results")

        // Verify QuarkScore can be calculated for all results
        for product in results {
            let score = sut.calculateQuarkScore(product)
            XCTAssertGreaterThanOrEqual(score.score, 0, "Score should be >= 0 for \(product.name)")
            XCTAssertLessThanOrEqual(score.score, 100, "Score should be <= 100 for \(product.name)")
        }
    }

    func testSearchProducts_emptyQuery_returnsEmpty() async {
        let results = await sut.searchProducts(query: "")
        XCTAssertTrue(results.isEmpty, "Empty query should return empty results")
    }

    func testSearchProducts_nonsenseQuery_returnsEmpty() async {
        let results = await sut.searchProducts(query: "zxqwvbnm999888")
        XCTAssertTrue(results.isEmpty, "Nonsense query should return no results")
    }

    func testSearchProducts_specialCharacters() async {
        let results = await sut.searchProducts(query: "café au lait")
        // Should not crash, may or may not return results
        XCTAssertTrue(results.allSatisfy { !$0.name.isEmpty })
    }

    func testSearchProducts_unicodeQuery() async {
        let results = await sut.searchProducts(query: "日本茶")
        // Should handle unicode gracefully, may return empty for niche queries
        XCTAssertTrue(results.allSatisfy { $0.name != "Unknown Product" })
    }

    // MARK: - Barcode Lookup Integration Tests

    func testFetchProduct_liveAPI_knownBarcode() async throws {
        // Bolthouse Farms Green Goodness
        await sut.fetchProduct(barcode: "0071464240806")
        XCTAssertNotNil(sut.product, "Known barcode should return a product")
        XCTAssertEqual(sut.product?.brand, "Bolthouse Farms")
        XCTAssertNil(sut.error)
    }

    func testFetchProduct_liveAPI_unknownBarcode() async {
        await sut.fetchProduct(barcode: "0000000000000")
        XCTAssertNil(sut.product)
        XCTAssertNotNil(sut.error, "Unknown barcode should set error message")
    }

    // MARK: - QuarkScore Consistency

    func testQuarkScore_identicalProducts_sameScore() throws {
        let json = """
        {
          "code": "same",
          "product_name": "Consistent",
          "additives_tags": ["en:e330"],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 2,
          "nutriments": {
            "energy-kcal_100g": 150,
            "proteins_100g": 8.0,
            "fat_100g": 5.0,
            "carbohydrates_100g": 20.0,
            "sugars_100g": 8.0,
            "sodium_100g": 0.3
          }
        }
        """.data(using: .utf8)!

        let product = try JSONDecoder().decode(FoodProduct.self, from: json)
        let score1 = sut.calculateQuarkScore(product)
        let score2 = sut.calculateQuarkScore(product)
        XCTAssertEqual(score1.score, score2.score, "Same product should always get the same score")
        XCTAssertEqual(score1.grade, score2.grade)
    }

    func testQuarkScore_gradeMatchesScore() throws {
        // Clean product should get high grade
        let cleanJSON = """
        {
          "code": "grade-clean",
          "product_name": "Clean Product",
          "additives_tags": [],
          "labels_tags": ["en:organic"],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 1,
          "nutriscore_grade": "a",
          "ingredients_text": "whole oats, almonds",
          "nutriments": {
            "energy-kcal_100g": 200,
            "proteins_100g": 10,
            "fat_100g": 5,
            "carbohydrates_100g": 30,
            "sugars_100g": 2.0,
            "sodium_100g": 0.01,
            "fiber_100g": 10.0,
            "saturated-fat_100g": 1
          }
        }
        """.data(using: .utf8)!

        let clean = try JSONDecoder().decode(FoodProduct.self, from: cleanJSON)
        let cleanScore = sut.calculateQuarkScore(clean)
        XCTAssertTrue(["A+", "A"].contains(cleanScore.grade), "Clean product should get A+ or A, got \(cleanScore.grade) (\(cleanScore.score))")

        // Bad product should get low grade
        let badJSON = """
        {
          "code": "grade-bad",
          "product_name": "Bad Product",
          "additives_tags": ["en:e102", "en:e950", "en:e124"],
          "labels_tags": [],
          "categories_tags": [],
          "countries_tags": [],
          "nova_group": 4,
          "nutriscore_grade": "e",
          "ingredients_text": "sugar, enriched flour, corn syrup, aspartame, palm oil",
          "nutriments": {
            "energy-kcal_100g": 500,
            "proteins_100g": 2,
            "fat_100g": 20,
            "carbohydrates_100g": 70,
            "sugars_100g": 50.0,
            "sodium_100g": 2.0,
            "fiber_100g": 0,
            "saturated-fat_100g": 10
          }
        }
        """.data(using: .utf8)!

        let bad = try JSONDecoder().decode(FoodProduct.self, from: badJSON)
        let badScore = sut.calculateQuarkScore(bad)
        XCTAssertTrue(["D", "F"].contains(badScore.grade), "Bad product should get D or F, got \(badScore.grade) (\(badScore.score))")
    }
}
