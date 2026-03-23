import SwiftUI
import Charts
import HealthKit

/// 6-dimension fitness fingerprint: HRV, sleep, activity, cardiac health,
/// recovery, and aerobic fitness plotted as a radar/spider chart.
struct FitnessProfileView: View {
    @State private var dimensions: [Dimension] = []
    @State private var prevDimensions: [Dimension] = []
    @State private var overallScore: Int = 0
    @State private var prevOverallScore: Int = 0
    @State private var isLoading = true

    private struct Dimension: Identifiable {
        let id: String
        let name: String
        let shortName: String
        let score: Int          // 0–100
        let prevScore: Int
        let value: String
        let description: String
        let icon: String
        let color: Color
    }

    // ── View ──────────────────────────────────────────────────────────────────

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 300)
            } else if dimensions.isEmpty {
                emptyState
            } else {
                VStack(spacing: 16) {
                    overallCard
                    radarChartCard
                    dimensionGrid
                    rankingCard
                    strengthsCard
                    scoringInfoCard
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Fitness Profile")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
    }

    // ── Overall card ──────────────────────────────────────────────────────────

    private var overallCard: some View {
        HStack(spacing: 20) {
            // Ring
            ZStack {
                Circle()
                    .stroke(Color(.systemFill), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: CGFloat(overallScore) / 100)
                    .stroke(scoreColor(overallScore), style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(overallScore)")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(scoreColor(overallScore))
                    Text("/ 100")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 100, height: 100)

            VStack(alignment: .leading, spacing: 6) {
                Text("Overall Score")
                    .font(.headline)
                Text(scoreLabel(overallScore))
                    .font(.subheadline)
                    .foregroundStyle(scoreColor(overallScore))
                let delta = overallScore - prevOverallScore
                HStack(spacing: 4) {
                    Image(systemName: delta > 2 ? "arrow.up" : delta < -2 ? "arrow.down" : "minus")
                        .font(.caption2)
                        .foregroundStyle(delta > 2 ? .green : delta < -2 ? .red : .secondary)
                    Text(abs(delta) > 2 ? "\(delta > 0 ? "+" : "")\(delta) vs last month" : "Stable vs last month")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Text("6-dimension health fingerprint")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // ── Radar chart ───────────────────────────────────────────────────────────

    private var radarChartCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fitness Fingerprint")
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal)
                .padding(.top)

            // SwiftUI Charts doesn't have a native RadarChart, so we build
            // a polygon overlay on a polar grid.
            GeometryReader { geo in
                ZStack {
                    radarGrid(in: geo.size)
                    radarPolygon(scores: prevDimensions.map { $0.score }, size: geo.size, color: Color(.systemFill).opacity(0.5))
                    radarPolygon(scores: dimensions.map { $0.score }, size: geo.size, color: .blue.opacity(0.2))
                    radarPolygonOutline(scores: dimensions.map { $0.score }, size: geo.size, color: .blue)
                    radarLabels(size: geo.size)
                }
            }
            .frame(height: 220)
            .padding(.horizontal, 8)

            // Legend
            HStack(spacing: 16) {
                HStack(spacing: 6) {
                    Rectangle().fill(Color.blue).frame(width: 16, height: 2)
                    Text("This month").font(.caption2).foregroundStyle(.secondary)
                }
                HStack(spacing: 6) {
                    Rectangle().fill(Color(.systemFill)).frame(width: 16, height: 2)
                    Text("Last month").font(.caption2).foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: Radar helpers

    private func radarPoint(index: Int, score: Int, size: CGSize) -> CGPoint {
        let n = dimensions.count
        let angle = (Double(index) * (2 * .pi / Double(n))) - .pi / 2
        let r = Double(min(size.width, size.height)) * 0.38 * Double(score) / 100
        let cx = size.width / 2
        let cy = size.height / 2
        return CGPoint(x: cx + r * cos(angle), y: cy + r * sin(angle))
    }

    private func radarRingPath(n: Int, cx: Double, cy: Double, maxR: Double, level: Double) -> Path {
        var path = Path()
        for i in 0..<n {
            let angle = (Double(i) * (2 * .pi / Double(n))) - .pi / 2
            let pt = CGPoint(x: cx + maxR * level * cos(angle), y: cy + maxR * level * sin(angle))
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        path.closeSubpath()
        return path
    }

    private func radarSpokePath(n: Int, i: Int, cx: Double, cy: Double, maxR: Double) -> Path {
        let angle = (Double(i) * (2 * .pi / Double(n))) - .pi / 2
        var path = Path()
        path.move(to: CGPoint(x: cx, y: cy))
        path.addLine(to: CGPoint(x: cx + maxR * cos(angle), y: cy + maxR * sin(angle)))
        return path
    }

    private func radarGrid(in size: CGSize) -> some View {
        let n = dimensions.count
        let cx = Double(size.width / 2)
        let cy = Double(size.height / 2)
        let maxR = Double(min(size.width, size.height)) * 0.38
        return Canvas { context, _ in
            for level in [0.25, 0.5, 0.75, 1.0] {
                context.stroke(radarRingPath(n: n, cx: cx, cy: cy, maxR: maxR, level: level),
                               with: .color(.white.opacity(0.08)), lineWidth: 1)
            }
            for i in 0..<n {
                context.stroke(radarSpokePath(n: n, i: i, cx: cx, cy: cy, maxR: maxR),
                               with: .color(.white.opacity(0.08)), lineWidth: 1)
            }
        }
    }

    private func radarPolygon(scores: [Int], size: CGSize, color: Color) -> some View {
        let n = dimensions.count
        guard n == scores.count else { return AnyView(EmptyView()) }
        var path = Path()
        for (i, score) in scores.enumerated() {
            let pt = radarPoint(index: i, score: score, size: size)
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        path.closeSubpath()
        return AnyView(path.fill(color))
    }

    private func radarPolygonOutline(scores: [Int], size: CGSize, color: Color) -> some View {
        let n = dimensions.count
        guard n == scores.count else { return AnyView(EmptyView()) }
        var path = Path()
        for (i, score) in scores.enumerated() {
            let pt = radarPoint(index: i, score: score, size: size)
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        path.closeSubpath()
        return AnyView(path.stroke(color, lineWidth: 2))
    }

    private func radarLabels(size: CGSize) -> some View {
        let n = dimensions.count
        let cx = size.width / 2
        let cy = size.height / 2
        let maxR = Double(min(size.width, size.height)) * 0.38

        return ZStack {
            ForEach(0..<n, id: \.self) { i in
                let angle = (Double(i) * (2 * .pi / Double(n))) - .pi / 2
                let labelR = maxR + 20
                let x = cx + labelR * cos(angle)
                let y = cy + labelR * sin(angle)
                let dim = dimensions[i]

                VStack(spacing: 1) {
                    Text(dim.icon).font(.system(size: 14))
                    Text(dim.shortName)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                .position(x: x, y: y)
            }
        }
    }

    // ── Dimension grid ────────────────────────────────────────────────────────

    private var dimensionGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(dimensions, id: \.id) { d in
                dimensionCard(d)
            }
        }
    }

    private func dimensionCard(_ d: Dimension) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(d.icon).font(.title3)
                Spacer()
                let delta = d.score - d.prevScore
                if abs(delta) > 2 {
                    HStack(spacing: 2) {
                        Image(systemName: delta > 0 ? "arrow.up" : "arrow.down")
                            .font(.system(size: 9))
                        Text("\(abs(delta))")
                            .font(.system(size: 10))
                    }
                    .foregroundStyle(delta > 0 ? .green : .red)
                }
            }
            Text("\(d.score)")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundStyle(scoreColor(d.score))
            Text(d.name)
                .font(.caption.weight(.medium))
                .lineLimit(1)
            Text(d.value)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            // Progress bar
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemFill))
                        .frame(height: 4)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(scoreColor(d.score))
                        .frame(width: g.size.width * CGFloat(d.score) / 100, height: 4)
                }
            }
            .frame(height: 4)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // ── Ranking card ─────────────────────────────────────────────────────────

    private var rankingCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Dimension Ranking")
                .font(.subheadline.weight(.semibold))
            ForEach(dimensions.sorted(by: { $0.score > $1.score }), id: \.id) { d in
                HStack(spacing: 10) {
                    Text(d.icon).frame(width: 24)
                    Text(d.name)
                        .font(.caption)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(.systemFill))
                                .frame(height: 6)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(scoreColor(d.score))
                                .frame(width: g.size.width * CGFloat(d.score) / 100, height: 6)
                        }
                    }
                    .frame(width: 80, height: 6)
                    Text("\(d.score)")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(scoreColor(d.score))
                        .frame(width: 28, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // ── Strengths card ────────────────────────────────────────────────────────

    private var strengthsCard: some View {
        let strengths = dimensions.filter { $0.score >= 70 }
        let weaknesses = dimensions.filter { $0.score < 50 }
        guard !strengths.isEmpty || !weaknesses.isEmpty else { return AnyView(EmptyView()) }
        return AnyView(
            VStack(spacing: 10) {
                if !strengths.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Strengths", systemImage: "checkmark.seal.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.green)
                        ForEach(strengths, id: \.id) { d in
                            HStack(spacing: 6) {
                                Text(d.icon)
                                Text("\(d.name) is strong at \(d.score)/100")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color.green.opacity(0.08))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.green.opacity(0.2), lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                if !weaknesses.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Areas to Focus", systemImage: "arrow.right.circle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.orange)
                        ForEach(weaknesses, id: \.id) { d in
                            HStack(spacing: 6) {
                                Text(d.icon)
                                Text(improvementTip(for: d))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color.orange.opacity(0.08))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.2), lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            }
        )
    }

    private func improvementTip(for d: Dimension) -> String {
        switch d.id {
        case "hrv": return "HRV is below baseline — prioritize rest & recovery"
        case "sleep": return "Aim for 7–8h sleep per night to boost your score"
        case "activity": return "Increase daily steps — current avg: \(d.value)"
        case "cardiac": return "Lower your resting HR through consistent cardio"
        case "recovery": return "Balance training load with adequate recovery"
        case "aerobic": return "Zone 2 runs and cycling will improve VO₂ max over time"
        default: return "\(d.name) has room to improve"
        }
    }

    // ── Scoring info card ─────────────────────────────────────────────────────

    private var scoringInfoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("How Scores Are Calculated")
                .font(.caption.weight(.semibold))
            ForEach(dimensions, id: \.id) { d in
                HStack(alignment: .top, spacing: 8) {
                    Text(d.icon)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(d.name).font(.caption.weight(.medium))
                        Text(d.description).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            Text("Scores are based on your last 30 days of data, compared to the previous 30 days.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // ── Empty state ───────────────────────────────────────────────────────────

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "hexagon.fill")
                .font(.system(size: 60))
                .foregroundStyle(.blue.opacity(0.4))
            Text("Not Enough Data")
                .font(.title3.bold())
            Text("Sync at least 7 days of health data to see your fitness profile.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
    }

    // ── Score helpers ─────────────────────────────────────────────────────────

    private func scoreColor(_ score: Int) -> Color {
        if score >= 80 { return .green }
        if score >= 60 { return .yellow }
        if score >= 40 { return .orange }
        return .red
    }

    private func scoreLabel(_ score: Int) -> String {
        if score >= 85 { return "Excellent" }
        if score >= 70 { return "Good" }
        if score >= 55 { return "Fair" }
        if score >= 40 { return "Needs Work" }
        return "Low"
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    private func load() async {
        defer { isLoading = false }

        let now = Date()
        let cal = Calendar.current
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: now) ?? now
        let sixtyDaysAgo  = cal.date(byAdding: .day, value: -60, to: now) ?? now

        let rows = (try? await SupabaseService.shared.fetchAllDailySummaries(days: 60)) ?? []
        let vo2Records = try? await SupabaseService.shared.fetchTypedHealthRecords(type: "vo2_max", days: 60)

        let thisPeriod = rows.filter { r in
            guard let d = isoDate(r.date) else { return false }
            return d >= thirtyDaysAgo
        }
        let prevPeriod = rows.filter { r in
            guard let d = isoDate(r.date) else { return false }
            return d >= sixtyDaysAgo && d < thirtyDaysAgo
        }

        // HRV score
        let allHrvs = rows.compactMap { $0.avg_hrv }.filter { $0 > 0 }
        let baseline = allHrvs.isEmpty ? 0.0 : allHrvs.reduce(0, +) / Double(allHrvs.count)
        let thisHrvs = thisPeriod.compactMap { $0.avg_hrv }.filter { $0 > 0 }
        let prevHrvs = prevPeriod.compactMap { $0.avg_hrv }.filter { $0 > 0 }
        let thisHrvAvg = thisHrvs.isEmpty ? 0.0 : thisHrvs.reduce(0, +) / Double(thisHrvs.count)
        let prevHrvAvg = prevHrvs.isEmpty ? 0.0 : prevHrvs.reduce(0, +) / Double(prevHrvs.count)
        let hrvScoreCurrent = baseline > 0 && thisHrvAvg > 0 ? clamp(50 + (thisHrvAvg / baseline - 1) * 100) : 50
        let hrvScorePrev    = baseline > 0 && prevHrvAvg > 0 ? clamp(50 + (prevHrvAvg / baseline - 1) * 100) : 50
        let hrvValue = thisHrvAvg > 0 ? "\(Int(thisHrvAvg)) ms avg" : "No data"

        // Sleep score
        let thisSleepMins = mean(thisPeriod.compactMap { $0.sleep_duration_minutes }.filter { $0 > 0 }.map { Double($0) })
        let prevSleepMins = mean(prevPeriod.compactMap { $0.sleep_duration_minutes }.filter { $0 > 0 }.map { Double($0) })
        let sleepScoreCurrent = sleepScore(thisSleepMins)
        let sleepScorePrev    = sleepScore(prevSleepMins)
        let sleepHours = thisSleepMins > 0 ? String(format: "%.1fh avg", thisSleepMins / 60) : "No data"

        // Activity score
        let thisSteps = mean(thisPeriod.compactMap { $0.steps }.filter { $0 > 0 }.map { Double($0) })
        let prevSteps = mean(prevPeriod.compactMap { $0.steps }.filter { $0 > 0 }.map { Double($0) })
        let actScoreCurrent = clamp(thisSteps / 100)   // 10000 → 100
        let actScorePrev    = clamp(prevSteps / 100)
        let stepsValue = thisSteps > 0 ? "\(Int(thisSteps).formatted()) steps/day" : "No data"

        // Cardiac (RHR) score — fetch from HealthKit since Supabase summary doesn't always include it
        let rhrSamples = (try? await HealthKitService.shared.fetchSamples(for: .restingHeartRate, from: sixtyDaysAgo, to: now)) ?? []
        let rhrByDate: [String: Double] = Dictionary(grouping: rhrSamples) { s in
            let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
            return df.string(from: s.startDate)
        }.mapValues { ss in
            let vals = ss.map { $0.quantity.doubleValue(for: HKUnit(from: "count/min")) }
            return vals.reduce(0, +) / Double(vals.count)
        }
        let thisRhrVals = rhrByDate.filter { thirtyDaysAgo <= (isoDate($0.key) ?? Date.distantPast) }.map { $0.value }
        let prevRhrVals = rhrByDate.filter { let d = isoDate($0.key) ?? Date.distantFuture; return d >= sixtyDaysAgo && d < thirtyDaysAgo }.map { $0.value }
        let thisRhr = mean(thisRhrVals)
        let prevRhr = mean(prevRhrVals)
        let cardScoreCurrent = rhrScore(thisRhr)
        let cardScorePrev    = rhrScore(prevRhr)
        let rhrValue = thisRhr > 0 ? "\(Int(thisRhr)) bpm resting" : "No data"

        // Recovery score
        let thisRec = mean(thisPeriod.compactMap { $0.recovery_score }.filter { $0 > 0 }.map { Double($0) })
        let prevRec = mean(prevPeriod.compactMap { $0.recovery_score }.filter { $0 > 0 }.map { Double($0) })
        let recScoreCurrent = clamp(thisRec)
        let recScorePrev    = clamp(prevRec)
        let recValue = thisRec > 0 ? "\(Int(thisRec))% avg recovery" : "No data"

        // VO2 max score
        let allVo2 = vo2Records ?? []
        let latestVo2: Double = allVo2.last?.value ?? 0
        let prevVo2: Double = allVo2.dropLast().last?.value ?? latestVo2
        let aeroScoreCurrent = vo2Score(latestVo2)
        let aeroScorePrev    = vo2Score(prevVo2)
        let vo2Value = latestVo2 > 0 ? String(format: "%.1f mL/kg/min", latestVo2) : "No data"

        let dims: [Dimension] = [
            Dimension(id: "hrv", name: "HRV & Recovery", shortName: "HRV", score: Int(hrvScoreCurrent), prevScore: Int(hrvScorePrev), value: hrvValue, description: "Current 30d HRV vs 60d baseline. Above baseline = better score.", icon: "💗", color: .purple),
            Dimension(id: "sleep", name: "Sleep Quality", shortName: "Sleep", score: Int(sleepScoreCurrent), prevScore: Int(sleepScorePrev), value: sleepHours, description: "Based on average duration (optimal 7–8h) and efficiency.", icon: "😴", color: .blue),
            Dimension(id: "activity", name: "Activity Level", shortName: "Activity", score: Int(actScoreCurrent), prevScore: Int(actScorePrev), value: stepsValue, description: "Average daily steps vs 10,000 target.", icon: "🚶", color: .green),
            Dimension(id: "cardiac", name: "Cardiac Health", shortName: "Cardiac", score: Int(cardScoreCurrent), prevScore: Int(cardScorePrev), value: rhrValue, description: "Resting HR vs fitness norms. Lower RHR = better score.", icon: "❤️", color: .red),
            Dimension(id: "recovery", name: "Recovery Rate", shortName: "Recovery", score: Int(recScoreCurrent), prevScore: Int(recScorePrev), value: recValue, description: "Avg daily recovery score balancing HRV, sleep, and strain.", icon: "⚡", color: .orange),
            Dimension(id: "aerobic", name: "Aerobic Fitness", shortName: "VO₂ Max", score: Int(aeroScoreCurrent), prevScore: Int(aeroScorePrev), value: vo2Value, description: "VO₂ max from Apple Health. Reflects cardiovascular capacity.", icon: "🫀", color: .cyan),
        ]

        let validCurrent = dims.filter { $0.score > 0 }
        let validPrev    = dims.filter { $0.prevScore > 0 }
        let overall     = validCurrent.isEmpty ? 50 : validCurrent.map { $0.score }.reduce(0, +) / validCurrent.count
        let prevOverall = validPrev.isEmpty ? 50    : validPrev.map { $0.prevScore }.reduce(0, +) / validPrev.count

        await MainActor.run {
            self.dimensions = dims
            self.overallScore = overall
            self.prevOverallScore = prevOverall
        }
    }

    // ── Score formulae ────────────────────────────────────────────────────────

    private func clamp(_ v: Double) -> Double { max(0, min(100, v)) }

    private func sleepScore(_ mins: Double) -> Double {
        guard mins > 0 else { return 0 }
        return clamp(100 - abs(mins / 60 - 7.5) * 25)
    }

    private func rhrScore(_ rhr: Double) -> Double {
        guard rhr > 0 else { return 50 }
        return clamp(100 - (rhr - 40) * 2.5)
    }

    private func vo2Score(_ vo2: Double) -> Double {
        guard vo2 > 0 else { return 50 }
        return clamp((vo2 - 25) * (100.0 / 35.0))  // 25→0, 60→100
    }

    private func mean(_ arr: [Double]) -> Double {
        guard !arr.isEmpty else { return 0 }
        return arr.reduce(0, +) / Double(arr.count)
    }

    private func isoDate(_ s: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: s)
    }
}

// MARK: - SupabaseService extension for typed health records

extension SupabaseService {
    struct TypedHealthRecord: Codable {
        let value: Double
        let start_time: String
    }

    func fetchTypedHealthRecords(type: String, days: Int) async throws -> [TypedHealthRecord] {
        guard let userId = currentSession?.user.id else { return [] }
        let since = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let sinceStr = ISO8601DateFormatter().string(from: since)
        let response: [TypedHealthRecord] = try await client
            .from("health_records")
            .select("value, start_time")
            .eq("user_id", value: userId.uuidString)
            .eq("type", value: type)
            .gte("start_time", value: sinceStr)
            .gt("value", value: 0)
            .order("start_time", ascending: true)
            .execute()
            .value
        return response
    }
}

#Preview {
    NavigationStack {
        FitnessProfileView()
    }
}
