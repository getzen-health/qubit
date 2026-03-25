import SwiftUI

// MARK: - PredictiveInsightsView

/// Displays a Claude-generated 7-day health forecast: recovery outlook,
/// best training window, and caution flags.
struct PredictiveInsightsView: View {
    @State private var service = PredictionService.shared

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if service.isLoading {
                    ProgressView()
                        .padding(.top, 80)
                } else if let prediction = service.currentPrediction {
                    headerCard(prediction: prediction)
                    recoveryCard(prediction: prediction)
                    trainingWindowCard(prediction: prediction)
                    cautionCard(prediction: prediction)
                    lastUpdatedFooter(prediction: prediction)
                } else {
                    emptyState
                }

                if let errorMessage = service.error {
                    errorBanner(message: errorMessage)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Week Ahead")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await service.generatePrediction() }
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }
                .disabled(service.isLoading)
            }
        }
        .task {
            await service.loadPrediction()
        }
        .refreshable {
            await service.generatePrediction()
        }
    }

    // MARK: - Header Card

    private func headerCard(prediction: PredictionService.PredictionRecord) -> some View {
        let dateRange = weekDateRange(from: prediction.weekOf)
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(.purple)
                Text("This Week's Outlook")
                    .font(.headline)
                Spacer()
            }
            Text(dateRange)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Recovery Forecast Card

    private func recoveryCard(prediction: PredictionService.PredictionRecord) -> some View {
        let indicator = recoveryIndicator(text: prediction.recoveryForecast)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Circle()
                    .fill(indicator.color)
                    .frame(width: 12, height: 12)
                Text("Recovery Forecast")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(prediction.recoveryForecast)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Best Training Window Card

    private func trainingWindowCard(prediction: PredictionService.PredictionRecord) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "calendar.badge.checkmark")
                    .foregroundStyle(.blue)
                Text("Best Training Window")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(prediction.performanceWindow)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Caution Flags Card

    private func cautionCard(prediction: PredictionService.PredictionRecord) -> some View {
        let hasContent = !prediction.cautionFlags.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: hasContent ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                    .foregroundStyle(hasContent ? .orange : .green)
                Text("Watch Out")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            Text(hasContent ? prediction.cautionFlags : "All clear — no risk factors detected this week.")
                .font(.body)
                .foregroundStyle(hasContent ? .primary : .secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Last Updated Footer

    private func lastUpdatedFooter(prediction: PredictionService.PredictionRecord) -> some View {
        Text("Updated \(prediction.createdAt.formatted(.relative(presentation: .named)))")
            .font(.caption)
            .foregroundStyle(.tertiary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 4)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.line.uptrend.xyaxis.circle")
                .font(.system(size: 56))
                .foregroundStyle(.purple.opacity(0.6))
            Text("No prediction yet")
                .font(.title3.weight(.semibold))
            Text("Tap refresh to generate your first prediction. We'll analyse 90 days of biometric data to forecast your week ahead.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Button {
                Task { await service.generatePrediction() }
            } label: {
                Label("Generate Prediction", systemImage: "sparkles")
                    .font(.body.weight(.semibold))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.purple)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.top, 60)
    }

    // MARK: - Error Banner

    private func errorBanner(message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundStyle(.red)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Helpers

    /// Heuristically infers recovery level from the forecast text to choose a traffic-light colour.
    private func recoveryIndicator(text: String) -> (label: String, color: Color) {
        let lower = text.lowercased()
        if lower.contains("excellent") || lower.contains("optimal") || lower.contains("well-recovered") ||
           lower.contains("well recovered") || lower.contains("strong") {
            return ("Excellent", .green)
        }
        if lower.contains("poor") || lower.contains("fatigued") || lower.contains("low recovery") ||
           lower.contains("depleted") || lower.contains("struggling") {
            return ("Poor", .red)
        }
        return ("Moderate", .yellow)
    }

    /// Formats a Monday Date as "24 Mar – 30 Mar, 2026".
    private func weekDateRange(from monday: Date) -> String {
        let sunday = Calendar.current.date(byAdding: .day, value: 6, to: monday) ?? monday
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        let start = formatter.string(from: monday)
        let end = formatter.string(from: sunday)
        let yearFormatter = DateFormatter()
        yearFormatter.dateFormat = "yyyy"
        return "\(start) – \(end), \(yearFormatter.string(from: monday))"
    }
}

#Preview {
    NavigationStack {
        PredictiveInsightsView()
    }
}
