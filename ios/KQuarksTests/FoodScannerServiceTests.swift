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
}
