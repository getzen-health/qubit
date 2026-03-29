import SwiftUI

/// Skeleton loading placeholder — premium dark theme
struct DashboardSkeletonView: View {
    var body: some View {
        VStack(spacing: 24) {
            aiEssenceSkeleton
            quickStatsSkeleton
            metricsSkeleton
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
    }

    private var aiEssenceSkeleton: some View {
        VStack(spacing: 20) {
            HStack(spacing: 32) {
                ForEach(0..<2, id: \.self) { _ in
                    VStack(spacing: 10) {
                        Circle()
                            .fill(Color.white.opacity(0.06))
                            .frame(width: 88, height: 88)
                        skeletonBar(width: 60, height: 10)
                        skeletonBar(width: 40, height: 9)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            HStack(spacing: 10) {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 8, height: 8)
                VStack(alignment: .leading, spacing: 5) {
                    skeletonBar(width: nil, height: 12)
                    skeletonBar(width: 160, height: 10)
                }
                Spacer()
            }
            .padding(14)
            .background(Color.white.opacity(0.03))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .padding(22)
        .premiumCard(tint: .purple, tintOpacity: 0.04, gradientBorder: true)
        .shimmer()
    }

    private var quickStatsSkeleton: some View {
        LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
            spacing: 12
        ) {
            ForEach(0..<4, id: \.self) { i in
                VStack(alignment: .leading, spacing: 10) {
                    skeletonBar(width: 20, height: 20)
                    skeletonBar(width: nil, height: 24)
                    skeletonBar(width: 50, height: 10)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .premiumCard(
                    tint: [Color.green, .blue, .orange, .pink][i % 4],
                    tintOpacity: 0.06
                )
                .shimmer()
            }
        }
    }

    private var metricsSkeleton: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 3, height: 14)
                skeletonBar(width: 100, height: 10)
                Spacer()
            }
            .padding(.bottom, 10)

            VStack(spacing: 0) {
                ForEach(0..<5, id: \.self) { _ in
                    HStack(spacing: 12) {
                        Circle()
                            .fill(Color.white.opacity(0.06))
                            .frame(width: 32, height: 32)
                        VStack(alignment: .leading, spacing: 4) {
                            skeletonBar(width: 80, height: 10)
                            skeletonBar(width: 50, height: 8)
                        }
                        Spacer()
                        skeletonBar(width: 50, height: 16)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 13)

                    Color.premiumDivider
                        .frame(height: 0.5)
                        .padding(.leading, 56)
                }
            }
            .glassCard(cornerRadius: 16, shadowRadius: 12, shadowY: 6)
        }
        .shimmer()
    }

    private func skeletonBar(width: CGFloat?, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: height / 2)
            .fill(Color.white.opacity(0.07))
            .frame(width: width, height: height)
            .frame(maxWidth: width == nil ? .infinity : nil, alignment: .leading)
    }
}

#Preview {
    ScrollView {
        DashboardSkeletonView()
    }
    .background(PremiumBackgroundView())
    .preferredColorScheme(.dark)
}
