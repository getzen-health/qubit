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
                Spacer()
                ProgressView()
                    .tint(.white.opacity(0.6))
                Spacer()
            } else if results.isEmpty && !query.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 36))
                        .foregroundStyle(.white.opacity(0.2))
                    Text("No results")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                    Text("Try a different search term or scan the barcode")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.3))
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(results) { product in
                            Button {
                                onProductSelected(product)
                            } label: {
                                ProductRowView(product: product, service: service)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                }
            }
        }
        .background(Color.premiumBackground)
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
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white.opacity(0.35))
            TextField("Search food products…", text: $query)
                .font(.system(size: 15))
                .foregroundStyle(.white)
                .autocorrectionDisabled()
            if !query.isEmpty {
                Button { query = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.white.opacity(0.3))
                }
            }
        }
        .padding(12)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .padding(.horizontal, 16)
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
                    Color.white.opacity(0.04)
                }
                .frame(width: 52, height: 52)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(Color.white.opacity(0.06), lineWidth: 1)
                )
            } else {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color.white.opacity(0.04))
                    .frame(width: 52, height: 52)
                    .overlay {
                        Image(systemName: "cart")
                            .font(.system(size: 16))
                            .foregroundStyle(.white.opacity(0.2))
                    }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(product.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                if let brand = product.brand {
                    Text(brand)
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.4))
                }
            }
            Spacer()
            QuarkScoreBadge(score: quarkScore.score, grade: quarkScore.grade, size: .small)
        }
        .padding(12)
        .background(Color.cardSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.04), lineWidth: 1)
        )
    }
}
