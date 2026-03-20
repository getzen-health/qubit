import SwiftUI
import Charts
import HealthKit

// MARK: - SleepArchitectureView

/// Analyzes sleep architecture — the proportion of time spent in each sleep stage
/// (REM, Core/Light, Deep/SWS, Awake) across the past 30 nights.
///
/// Uses HKCategoryType(.sleepAnalysis) with valueTypes:
/// .asleepREM, .asleepCore, .asleepDeep, .awake, .inBed
///
/// Science: Deep sleep peaks in the first half of the night (slow-wave sleep for
/// physical recovery); REM peaks in the second half (memory consolidation, emotional
/// regulation). Normal architecture: ~20-25% REM, 15-20% Deep, 50-60% Core.
struct SleepArchitectureView: View {

    struct SleepNight: Identifiable {
        let id: Date
        let date: Date
        let totalMins: Double
        let remMins: Double
        let coreMins: Double
        let deepMins: Double
        let awakeMins: Double

        var remPct: Double { totalMins > 0 ? remMins / totalMins * 100 : 0 }
        var deepPct: Double { totalMins > 0 ? deepMins / totalMins * 100 : 0 }
        var corePct: Double { totalMins > 0 ? coreMins / totalMins * 100 : 0 }
        var efficiency: Double {
            let sleep = remMins + coreMins + deepMins
            return totalMins > 0 ? sleep / totalMins * 100 : 0
        }
    }

    @State private var nights: [SleepNight] = []
    @State private var avgTotal: Double = 0
    @State private var avgREM: Double = 0
    @State private var avgCore: Double = 0
    @State private var avgDeep: Double = 0
    @State private var avgEfficiency: Double = 0
    @State private var isLoading = true

    private let healthStore = HKHealthStore()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if nights.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    summaryCard
                    stageBreakdownChart
                    stageTrendChart
                    scienceCard
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Sleep Architecture")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("30-Night Average")
                        .font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(hoursStr(avgTotal))
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundStyle(.indigo)
                        Text("sleep")
                            .font(.title3).foregroundStyle(.secondary).padding(.bottom, 6)
                    }
                    HStack(spacing: 4) {
                        Text(String(format: "%.0f%% efficient", avgEfficiency))
                            .font(.subheadline)
                            .foregroundStyle(avgEfficiency >= 85 ? .green : avgEfficiency >= 75 ? .yellow : .orange)
                    }
                }
                Spacer()
                Image(systemName: "moon.zzz.fill")
                    .font(.system(size: 44)).foregroundStyle(.indigo)
            }
            Divider()
            HStack(spacing: 0) {
                stageCell(label: "REM", mins: avgREM, color: .purple, target: "20–25%")
                Divider().frame(height: 36)
                stageCell(label: "Core", mins: avgCore, color: .blue, target: "50–60%")
                Divider().frame(height: 36)
                stageCell(label: "Deep", mins: avgDeep, color: .indigo, target: "15–20%")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func stageCell(label: String, mins: Double, color: Color, target: String) -> some View {
        VStack(spacing: 2) {
            Text(String(format: "%.0f min", mins)).font(.subheadline.bold().monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2.bold()).foregroundStyle(color)
            Text(target).font(.system(size: 9)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
    }

    private func hoursStr(_ mins: Double) -> String {
        let h = Int(mins / 60), m = Int(mins.truncatingRemainder(dividingBy: 60))
        return m > 0 ? "\(h)h \(m)m" : "\(h)h"
    }

    // MARK: - Stage Breakdown — Stacked Bar

    private var stageBreakdownChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sleep Stage Composition").font(.headline)
            Text("Last 30 nights — stacked by stage").font(.caption).foregroundStyle(.secondary)

            // Donut chart using GeometryReader for the average breakdown
            HStack(spacing: 20) {
                ZStack {
                    Circle().stroke(Color.gray.opacity(0.1), lineWidth: 18).frame(width: 110, height: 110)
                    if avgTotal > 0 {
                        donutArc(from: 0, pct: avgDeep / avgTotal, color: .indigo)
                        donutArc(from: avgDeep / avgTotal, pct: avgREM / avgTotal, color: .purple)
                        donutArc(from: (avgDeep + avgREM) / avgTotal, pct: avgCore / avgTotal, color: .blue)
                    }
                    VStack(spacing: 0) {
                        Text(String(format: "%.0f%%", avgEfficiency))
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(.indigo)
                        Text("efficient").font(.system(size: 9)).foregroundStyle(.secondary)
                    }
                }
                VStack(alignment: .leading, spacing: 8) {
                    stageLegend(color: .indigo, label: "Deep SWS", pct: avgTotal > 0 ? avgDeep / avgTotal * 100 : 0, target: "15–20%")
                    stageLegend(color: .purple, label: "REM", pct: avgTotal > 0 ? avgREM / avgTotal * 100 : 0, target: "20–25%")
                    stageLegend(color: .blue, label: "Core/Light", pct: avgTotal > 0 ? avgCore / avgTotal * 100 : 0, target: "50–60%")
                }
                Spacer()
            }
            .frame(height: 130)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func donutArc(from start: Double, pct: Double, color: Color) -> some View {
        Circle()
            .trim(from: start, to: min(1, start + pct))
            .stroke(color, style: StrokeStyle(lineWidth: 18, lineCap: .butt))
            .frame(width: 110, height: 110)
            .rotationEffect(.degrees(-90))
    }

    private func stageLegend(color: Color, label: String, pct: Double, target: String) -> some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 12, height: 12)
            VStack(alignment: .leading, spacing: 0) {
                Text(label).font(.caption.bold()).foregroundStyle(color)
                Text(String(format: "%.0f%% · target %@", pct, target)).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Stage Trend Chart

    private var stageTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Deep Sleep Per Night (min)").font(.headline)
            Chart {
                ForEach(nights.suffix(30)) { n in
                    BarMark(x: .value("Date", n.date, unit: .day),
                            y: .value("Deep", n.deepMins))
                    .foregroundStyle(n.deepMins >= 90 ? Color.indigo :
                                     n.deepMins >= 60 ? Color.indigo.opacity(0.7) :
                                     Color.indigo.opacity(0.4))
                    .cornerRadius(2)
                }
                if avgDeep > 0 {
                    RuleMark(y: .value("Avg", avgDeep))
                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 3]))
                        .foregroundStyle(.secondary.opacity(0.4))
                }
                RuleMark(y: .value("Target", 90))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))
                    .foregroundStyle(Color.green.opacity(0.5))
                    .annotation(position: .trailing, alignment: .center) {
                        Text("90").font(.system(size: 9)).foregroundStyle(.green)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .weekOfYear)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxisLabel("min")
            .frame(height: 140)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Science Card

    private var scienceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "brain.head.profile").foregroundStyle(.indigo)
                Text("Sleep Architecture Science").font(.headline)
            }
            Text("Sleep cycles ~90 minutes each, with 4–6 cycles per night. Each cycle contains lighter and deeper stages in sequence:")
                .font(.caption).foregroundStyle(.secondary)
            VStack(alignment: .leading, spacing: 4) {
                scienceRow(color: .indigo, stage: "Deep (SWS)", fact: "Slow-wave sleep — peaks in first 2 cycles. Physical repair, immune function, growth hormone release. Hardest to wake from.")
                scienceRow(color: .purple, stage: "REM", fact: "Rapid Eye Movement — peaks in later cycles. Memory consolidation, emotional processing, creativity. Dreaming occurs here.")
                scienceRow(color: .blue, stage: "Core/Light", fact: "Transitional stage that bridges cycles. Memory tagging, motor learning. Most abundant stage (~50% of total).")
            }
            Text("Source: Walker 2017 \"Why We Sleep\"; AASM Sleep Staging Guidelines")
                .font(.caption2).foregroundStyle(.tertiary).italic()
        }
        .padding()
        .background(Color.indigo.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.indigo.opacity(0.18), lineWidth: 1))
    }

    private func scienceRow(color: Color, stage: String, fact: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Circle().fill(color).frame(width: 8, height: 8).padding(.top, 4)
            VStack(alignment: .leading, spacing: 1) {
                Text(stage).font(.caption.bold()).foregroundStyle(color)
                Text(fact).font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "moon.zzz.fill")
                .font(.system(size: 52)).foregroundStyle(.secondary)
            Text("No Sleep Stage Data")
                .font(.title3.bold())
            Text("Sleep stage analysis (REM, Core, Deep) requires Apple Watch Series 4+ running watchOS 9 or later worn during sleep.")
                .font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
        }
        .padding(.top, 60)
    }

    // MARK: - Load

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        guard (try? await healthStore.requestAuthorization(toShare: [], read: [sleepType])) != nil else { return }

        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let cal = Calendar.current

        let samples: [HKCategorySample] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: sleepType,
                predicate: HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date()),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, s, _ in cont.resume(returning: (s as? [HKCategorySample]) ?? []) }
            healthStore.execute(q)
        }

        guard !samples.isEmpty else { return }

        // Group by night (use date of endDate for night assignment)
        var nightMap: [Date: (rem: Double, core: Double, deep: Double, awake: Double, total: Double)] = [:]

        for s in samples {
            // Assign to the morning date (sleep ending this day = night before)
            let nightDate = cal.startOfDay(for: s.endDate)
            let mins = s.endDate.timeIntervalSince(s.startDate) / 60
            var cur = nightMap[nightDate] ?? (0, 0, 0, 0, 0)
            cur.total += mins

            switch HKCategoryValueSleepAnalysis(rawValue: s.value) {
            case .asleepREM: cur.rem += mins
            case .asleepCore: cur.core += mins
            case .asleepDeep: cur.deep += mins
            case .awake: cur.awake += mins
            case .inBed: break  // inBed already counted in total
            default: break
            }
            nightMap[nightDate] = cur
        }

        let allNights = nightMap.compactMap { date, v -> SleepNight? in
            guard v.total >= 60 else { return nil }  // filter very short records
            return SleepNight(id: date, date: date,
                              totalMins: v.total, remMins: v.rem,
                              coreMins: v.core, deepMins: v.deep, awakeMins: v.awake)
        }.sorted { $0.date < $1.date }

        guard !allNights.isEmpty else { return }
        nights = allNights

        let n = Double(allNights.count)
        avgTotal = allNights.map(\.totalMins).reduce(0, +) / n
        avgREM = allNights.map(\.remMins).reduce(0, +) / n
        avgCore = allNights.map(\.coreMins).reduce(0, +) / n
        avgDeep = allNights.map(\.deepMins).reduce(0, +) / n
        avgEfficiency = allNights.map(\.efficiency).reduce(0, +) / n
    }
}

#Preview { NavigationStack { SleepArchitectureView() } }
