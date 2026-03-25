import Foundation

struct ParsedNutritionLabel {
    var calories: Double?
    var protein: Double?
    var fat: Double?
    var carbs: Double?
    var fiber: Double?
    var servingSize: String?
}

func parseNutritionLabel(from text: String) -> ParsedNutritionLabel {
    var result = ParsedNutritionLabel()
    let lines = text.components(separatedBy: .newlines)
    let joined = lines.joined(separator: "\n")

    // Calories — "Calories 250" or "Calories\n250"
    if let val = extractValue(from: joined, patterns: [
        #"Calories\s+(\d+)"#,
        #"Energy\s+(\d+)\s*(?:kcal|Cal)"#,
        #"Calories[:\s]+(\d+)"#
    ]) {
        result.calories = val
    }

    // Total Fat
    if let val = extractValue(from: joined, patterns: [
        #"Total\s+Fat\s+([\d.]+)\s*g"#,
        #"Fat\s+([\d.]+)\s*g"#
    ]) {
        result.fat = val
    }

    // Total Carbohydrate
    if let val = extractValue(from: joined, patterns: [
        #"Total\s+Carbohydrate\s+([\d.]+)\s*g"#,
        #"Carbohydrates?\s+([\d.]+)\s*g"#,
        #"Total\s+Carbs?\s+([\d.]+)\s*g"#
    ]) {
        result.carbs = val
    }

    // Dietary Fiber
    if let val = extractValue(from: joined, patterns: [
        #"Dietary\s+Fiber\s+([\d.]+)\s*g"#,
        #"Fiber\s+([\d.]+)\s*g"#
    ]) {
        result.fiber = val
    }

    // Protein
    if let val = extractValue(from: joined, patterns: [
        #"Protein\s+([\d.]+)\s*g"#,
        #"Protein[:\s]+([\d.]+)"#
    ]) {
        result.protein = val
    }

    // Serving Size — capture descriptive string
    if let match = firstMatch(in: joined, pattern: #"Serving\s+Size\s*[:\s]+([^\n]{2,30})"#) {
        result.servingSize = match.trimmingCharacters(in: .whitespaces)
    }

    return result
}

// MARK: - Helpers

private func extractValue(from text: String, patterns: [String]) -> Double? {
    for pattern in patterns {
        if let match = firstCapture(in: text, pattern: pattern),
           let value = Double(match) {
            return value
        }
    }
    return nil
}

private func firstCapture(in text: String, pattern: String) -> String? {
    guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
    let range = NSRange(text.startIndex..., in: text)
    guard let match = regex.firstMatch(in: text, options: [], range: range),
          match.numberOfRanges > 1 else { return nil }
    let captureRange = match.range(at: 1)
    guard let swiftRange = Range(captureRange, in: text) else { return nil }
    return String(text[swiftRange])
}

private func firstMatch(in text: String, pattern: String) -> String? {
    guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
    let range = NSRange(text.startIndex..., in: text)
    guard let match = regex.firstMatch(in: text, options: [], range: range),
          match.numberOfRanges > 1 else { return nil }
    let captureRange = match.range(at: 1)
    guard let swiftRange = Range(captureRange, in: text) else { return nil }
    return String(text[swiftRange])
}
