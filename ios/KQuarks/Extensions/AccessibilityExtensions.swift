import SwiftUI

extension View {
    func accessibilityMetric(_ label: String, value: String, hint: String? = nil) -> some View {
        self
            .accessibilityLabel("\(label): \(value)")
            .accessibilityHint(hint ?? "Double tap to view details")
            .accessibilityElement(children: .combine)
    }
}
