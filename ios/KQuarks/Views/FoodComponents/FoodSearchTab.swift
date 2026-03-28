import SwiftUI

struct FoodSearchTab: View {
    let service: FoodScannerService
    let onProductSelected: (FoodProduct) -> Void

    @State private var query = ""
    @State private var results: [FoodProduct] = []
    @State private var isSearching = false
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        VStack(spacing: 0) {
            searchBar
            if isSearching {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if results.isEmpty && !query.isEmpty {
                ContentUnavailableView(
                    "No results",
                    systemImage: "magnifyingglass",
                    description: Text("Try a different search term or scan the barcode")
                )
            } else {
                List(results) { product in
                    Button {
                        onProductSelected(product)
                    } label: {
                        ProductRowView(product: product, service: service)
                    }
                    .buttonStyle(.plain)
                }
                .listStyle(.plain)
            }
        }
        .onChange(of: query) { _, newValue in
            searchTask?.cancel()
            guard newValue.count >= 2 else {
                results = []
                return
            }
            searchTask = Task {
                try? await Task.sleep(nanoseconds: 400_000_000)
                guard !Task.isCancelled else { return }
                isSearching = true
                let found = await service.searchProducts(query: newValue)
                isSearching = false
                results = found
            }
        }
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            TextField("Search food products…", text: $query)
                .textFieldStyle(.plain)
                .autocorrectionDisabled()
            if !query.isEmpty {
                Button { query = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(10)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 10))
        .padding(.horizontal)
        .padding(.vertical, 10)
    }
}

// MARK: - ProductRowView

struct ProductRowView: View {
    let product: FoodProduct
    let service: FoodScannerService

    private var quarkScore: QuarkScoreResult {
        service.calculateQuarkScore(product)
    }

    var body: some View {
        HStack(spacing: 12) {
            if let urlStr = product.imageURL, let url = URL(string: urlStr) {
                AsyncImage(url: url) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color(.tertiarySystemBackground)
                }
                .frame(width: 52, height: 52)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.tertiarySystemBackground))
                    .frame(width: 52, height: 52)
                    .overlay {
                        Image(systemName: "cart")
                            .foregroundStyle(.secondary)
                    }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(product.name)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(2)
                if let brand = product.brand {
                    Text(brand)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            QuarkScoreBadge(score: quarkScore.score, grade: quarkScore.grade, size: .small)
        }
        .padding(.vertical, 4)
    }
}
