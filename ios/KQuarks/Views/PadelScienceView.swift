import SwiftUI
import HealthKit

struct PadelScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .green)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .yellow)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Padel Physics & Court Science",
                    icon: "sportscourt.fill",
                    color: .green,
                    rows: [
                        sciRow(
                            stat: "Court: 10×20m enclosed glass + fence, balls remain in play off walls",
                            detail: "Padel court dimensions, glass back walls + metal mesh sides, ball rebound angles off glass, serve bounce height requirements, net height 88 cm at centre. Padel ball: similar to tennis but 10–15% lower pressure. Court surface: artificial grass (padelgrass) with sand infill."
                        ),
                        sciRow(
                            stat: "Serve: underhand bounce serve below waist — unique rule",
                            detail: "Padel serve mechanics: must bounce in service box before striking, contact below waist height, serve into opponent's service box, no smash/jump serve allowed. Less dominant serve than tennis — rally-based sport. Serve speed: 80–120 km/h vs. 200+ in tennis."
                        ),
                        sciRow(
                            stat: "Glass wall play: vibora, bandeja, bajada — unique techniques",
                            detail: "Padel-specific shots using glass walls: vibora (vibrating/sidespin lob off back glass), bajada (controlled drop return off back glass), bandeja (defensive overhead off back glass). These shots don't exist in any other racket sport — require spatial depth perception and timing for wall-bounced balls."
                        ),
                        sciRow(
                            stat: "Ball speed: 120–160 km/h elite smash, 40–80 km/h rally average",
                            detail: "Padel smash biomechanics vs. tennis: lower maximum speed due to underhand serve restriction, no full-arm overhead serve. Rally ball speeds 40–80 km/h — lower than tennis, squash, badminton — but frequency of shots is very high (short court)."
                        )
                    ]
                )

                scienceCard(
                    title: "Physical Demands",
                    icon: "heart.fill",
                    color: .blue,
                    rows: [
                        sciRow(
                            stat: "Elite padel: 6–9 km per match (doubles)",
                            detail: "GPS data from elite padel matches (WPT/FIP circuit): doubles players cover 6–9 km per match, with high-intensity actions (>18 km/h) representing 15–20% of total distance. Match duration: 60–90 min. High shot frequency: 80–120 shots per game."
                        ),
                        sciRow(
                            stat: "HR: 75–88% HRmax in doubles, 80–92% in singles padel",
                            detail: "Heart rate monitoring in competitive padel: sustained aerobic demand, short burst anaerobic actions at net volleys and lobs. Blood lactate: 3–5 mmol/L. VO₂max for elite padel players: 55–65 mL/kg/min."
                        ),
                        sciRow(
                            stat: "Shoulder demands: overhead bandeja/vibora high volume",
                            detail: "Padel overhead technique volume (50–80 defensive overheads per match), shoulder ER/IR demands similar to tennis but with more defensive (rather than offensive) overhead loading. Rotator cuff adaptation required."
                        ),
                        sciRow(
                            stat: "Wrist injuries: 15–20% of padel injuries from wall rebounds",
                            detail: "Unexpected ball rebound angles from glass/mesh create reactive wrist loading. TFCC strain, extensor tendinopathy. Padel-specific injury pattern: players underestimate unpredictable rebound physics in first years of play."
                        )
                    ]
                )

                scienceCard(
                    title: "Technique & Tactics",
                    icon: "bolt.fill",
                    color: .green,
                    rows: [
                        sciRow(
                            stat: "Net position: 80% of winning shots from net (1–2 m)",
                            detail: "Tactical analysis: majority of winners scored from net position. Padel strategy revolves around moving opponents back with lobs and taking net position. Parallel vs. cross-court shot selection from net."
                        ),
                        sciRow(
                            stat: "Lob: the most important shot in padel",
                            detail: "The lob is padel's most tactically important shot — used defensively to regain net position, offensively to send opponents back for wall shots. Lob height: 5–7 m (above opponents reach, below 10 m height limit). Topspin vs. flat lob differences in bounce angle."
                        ),
                        sciRow(
                            stat: "Back wall return: rebound reading requires 0.5–0.8 s tracking",
                            detail: "Player must read ball trajectory off glass, move to intercept, and play return shot — all within 0.8–1.2 s from ball hitting glass. Expert-novice difference in rebound prediction timing (200–300 ms advantage for experienced players)."
                        ),
                        sciRow(
                            stat: "Mixed doubles tactics: attacking with weaker opponent disadvantage",
                            detail: "Padel mixed doubles strategy: attack weaker player's side, exploit forehand-backhand asymmetry, serve to body to limit return options. Spatial awareness of 4-player court positioning."
                        )
                    ]
                )

                scienceCard(
                    title: "Growth Science & Development",
                    icon: "chart.bar.fill",
                    color: .yellow,
                    rows: [
                        sciRow(
                            stat: "Fastest growing sport: from 4M to 25M players in 10 years",
                            detail: "World Padel Tour growth statistics, expansion from Spain/Argentina to global sport, 90,000+ courts worldwide, Olympic inclusion consideration, major investment from tennis infrastructure."
                        ),
                        sciRow(
                            stat: "Learning curve: faster skill acquisition than tennis",
                            detail: "Padel's lower technical barrier: shorter racket, enclosed court (ball always in play), underhand serve. Research: novices achieve competitive rally ability in 3–4 sessions vs. 10–15 for tennis. Lower injury rate in beginners vs. tennis."
                        ),
                        sciRow(
                            stat: "Transfer from tennis: 65–75% skill transfer",
                            detail: "Tennis players transitioning to padel: groundstroke mechanics applicable (65–75%), but wall play, soft hands at net, and defensive overheads require new motor programmes. Overlearned tennis instincts (e.g., hard smash) counterproductive in padel."
                        ),
                        sciRow(
                            stat: "Social and mental health: padel's psychological benefits",
                            detail: "Social sport design (doubles-only format on intimate court), community building, lower anxiety threshold vs. singles sports. Research on doubles sport participation and social wellbeing, padel as accessible entry point for sedentary adults."
                        )
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Padel Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        // Padel does not have its own HKWorkoutActivityType; using .racquetball as the closest racket sport match
        let filtered = workouts.filter { $0.workoutActivityType == .racquetball }
        let sessions = filtered.count
        let totalHR = filtered.compactMap { $0.statistics(for: HKQuantityType(.heartRate))?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) }.reduce(0, +)
        let totalDur = filtered.map { $0.duration / 60 }.reduce(0, +)
        await MainActor.run {
            totalSessions = sessions
            avgHR = sessions > 0 ? totalHR / Double(sessions) : 0
            avgDurationMin = sessions > 0 ? totalDur / Double(sessions) : 0
            isLoading = false
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(.title2, design: .rounded, weight: .bold)).foregroundColor(color)
            Text(label).font(.caption2).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10)
        .background(Color(.secondarySystemBackground)).cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon).font(.headline).foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding().background(Color(.secondarySystemBackground)).cornerRadius(14).padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
