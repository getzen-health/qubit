import SwiftUI

@MainActor
enum HealthCardRenderer {
    static func renderCard(_ cardType: HealthCardType) -> UIImage? {
        let view = HealthShareCardView(cardType: cardType)
        let renderer = ImageRenderer(content: view)
        renderer.scale = 3.0
        return renderer.uiImage
    }
}

struct ShareHealthCardButton: View {
    let cardType: HealthCardType
    @State private var renderedImage: UIImage?
    @State private var showShare = false
    
    var body: some View {
        Button {
            renderedImage = HealthCardRenderer.renderCard(cardType)
            showShare = renderedImage != nil
        } label: {
            Label("Share", systemImage: "square.and.arrow.up")
                .font(.subheadline)
        }
        .sheet(isPresented: $showShare) {
            if let img = renderedImage {
                ShareSheet(items: [img])
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uvc: UIActivityViewController, context: Context) {}
}
