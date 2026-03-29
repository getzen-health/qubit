import SwiftUI

/// Skeleton loading placeholder that mirrors the real dashboard layout.
struct DashboardSkeletonView: View {
    var body: some View {
        VStack(spacing: 20) {
            aiEssenceSkeleton
            quickStatsSkeleton
            metricsSkeleton
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
    }

    // MARK: - AI Essence skeleton (recovery + strain rings + insight text)
    private var aiEssenceSkeleton: some View {
        VStack(spacing: 16) {
            HStack(spacing: 24) {
                ForEach(0..<2, id: \.self) { _ in
                    VStack(spacing: 8) {
                        Circle()
                            .fill(Color(.systemFill))
                            .frame(width: 72, height: 72)
                        skeletonBar(width: 50, height: 10)
                        skeletonBar(width: 36, height: 8)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            VStack(alignment: .leading, spacing: 6) {
                skeletonBar(width: nil, height: 12)
                skeletonBar(width: nil, height: 12)
                skeletonBar(width: 160, height: 12)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemFill))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shimmer()
    }

    // MARK: - Quick stats skeleton (4 cards)
    private var quickStatsSkeleton: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4),
            spacing: 12
        ) {
            ForEach(0..<4, id: \.self) { _ in
                VStack(alignment: .leading, spacing: 8) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color(.systemFill))
                        .frame(width: 32, height: 32)
                    skeletonBar(width: nil, height: 16)
                    skeletonBar(width: 28, height: 8)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shimmer()
            }
        }
    }

    // MARK: - Metric rows skeleton
    private var metricsSkeleton: some View {
        VStack(spacing: 0) {
            skeletonSectionHeader
            VStack(spacing: 0) {
                ForEach(0..<6, id: \.self) { _ in
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(.systemFill))
                            .frame(width: 34, height: 34)
                        VStack(alignment: .leading, spacing: 4) {
                            skeletonBar(width: 90, height: 10)
                            skeletonBar(width: 60, height: 8)
                        }
                        Spacer()
                        skeletonBar(width: 44, height: 14)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(Color(.systemBackground))
                    Divider()
                        .padding(.leading, 62)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .shimmer()
    }

    private var skeletonSectionHeader: some View {
        HStack {
            skeletonBar(width: 110, height: 10)
            Spacer()
        }
        .padding(.bottom, 8)
    }

    private func skeletonBar(width: CGFloat?, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: height / 2)
            .fill(Color(.systemFill))
            .frame(width: width, height: height)
            .frame(maxWidth: width == nil ? .infinity : nil, alignment: .leading)
    }
}

#Preview {
    ScrollView {
        DashboardSkeletonView()
    }
    .background(Color(.systemGroupedBackground))
}
