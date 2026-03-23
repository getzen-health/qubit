import SwiftUI
import HealthKit

struct BowlingScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .purple)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .blue)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .red)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "Ball Dynamics & Lane Physics",
                    icon: "circle.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Ball speed: 17–22 mph (27–35 km/h) optimal for strikes",
                               detail: "Professional bowling ball speed range, speed effects on pin action (too fast = 'deflection through', too slow = over-hook), optimal entry angle 4–6° into the pocket. PBA tour average speed: 18–19 mph. Bowling ball weight: 14–16 lbs, maximum by USBC rules."),
                        sciRow(stat: "Revolution rate: 300–450 rpm for elite hook ball",
                               detail: "Hook ball revolution mechanics, axis rotation, axis tilt, flare potential of reactive resin vs. polyester balls. Revolution rate directly determines hook potential. High-rev players (Kyle Traber ~500 rpm) vs. strokers (Walter Ray Williams ~150 rpm) — different styles achieving elite success."),
                        sciRow(stat: "Oil pattern: 41–44 feet creates scoring zones",
                               detail: "Lane conditioning (oil pattern) science: sport patterns vs. house patterns, oil pattern length affecting hook point location, friction differential between oiled and dry parts of lane, breakdown of oil creating changing conditions across 3-game blocks."),
                        sciRow(stat: "Pin action: 1-3 pocket entry = 62.5° maximum pin scatter",
                               detail: "Pin physics: bowling pins weigh 1.5 kg, 10-pin triangular arrangement, entry angle physics for maximum pin scatter (pocket entry 4–6° optimal), thin hits (1-2 pocket) vs. high hits (1-1-3 Brooklyn), deflection through pin deck.")
                    ]
                )

                scienceCard(
                    title: "Biomechanics of the Delivery",
                    icon: "figure.bowling",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Approach: 4–5 step approach, timing 96% of professional success",
                               detail: "Bowling delivery timing mechanics: 4-step (push → down → back → slide), 5-step (one extra timing step), timing of ball at slide foot contact. Synchronised pendulum swing — arm should be straight at slide step. Hall of Fame professional biomechanics: swing plane, wrist position, release point."),
                        sciRow(stat: "Wrist position: cupped vs. relaxed determines revolution rate",
                               detail: "Wrist position science in bowling release: cupped wrist creates axis-forward rotation (higher revs); relaxed/broken-back reduces revs. Wrist devices (positioners): legal USBC equipment helping maintain consistent wrist position. Fingertip grip vs. conventional grip."),
                        sciRow(stat: "Release: thumb exits ball 10–20 ms before fingers",
                               detail: "Ball release sequence: thumb exits 10–20 ms before ring/middle fingers, creating lift and rotation. Finger position at release: fingers at 4–5 o'clock position (right-handed), rotation through to 2–3 o'clock generates hook. Axis rotation: 30–50° for medium hook players."),
                        sciRow(stat: "Slide: 3–6 inch slide on slide foot at release",
                               detail: "Footwork at release: slide distance on non-dominant foot, balance preservation through shot, elbow height at release (should be above hip), follow-through direction (pointing at target arrow). Bowling shoes: slide shoe left/brake shoe right (right-handed).")
                    ]
                )

                scienceCard(
                    title: "Physical Demands & Injury",
                    icon: "heart.fill",
                    color: .purple,
                    rows: [
                        sciRow(stat: "Professional bowling: 70–100+ games per week in practice/competition",
                               detail: "Elite bowler training volume, physical repetition demands, PBA tour event scheduling (6 games per day × 4 days), physical fatigue effects on accuracy. Low cardiovascular demand but high repetitive motion demand."),
                        sciRow(stat: "Thumb and finger injuries: 'bowler's thumb' — ulnar digital nerve",
                               detail: "Repetitive thumb hole pressure causing ulnar digital nerve neuropathy ('bowler's thumb'), pin callus formation, size-specific thumb hole fitting, skin tape wrapping techniques. Ring and middle finger tendinopathy from fingertip grip stress."),
                        sciRow(stat: "Back pain: 35–45% of professional bowlers",
                               detail: "Trunk rotation with ball momentum creates asymmetrical loading, repetitive lumbar extension during release, disc stress from 14–16 lb ball swing. Core strengthening and bilateral balance training as prevention."),
                        sciRow(stat: "Shoulder: 20–25% of elite bowling injuries",
                               detail: "Pendulum swing shoulder loading, infraspinatus and posterior capsule stress from internal rotation at release, acromioclavicular joint stress. Prevention: rotator cuff EC programme, shoulder ER strengthening.")
                    ]
                )

                scienceCard(
                    title: "Mental Game & Strategy",
                    icon: "brain.head.profile",
                    color: .blue,
                    rows: [
                        sciRow(stat: "Spare shooting: 85–90% of all scoring opportunity in bowling",
                               detail: "Statistical analysis: spare conversion rate more important than strike rate for average improvement below 200. 10-pin spare conversion: elite bowlers 95%+, average recreational 60%. Straight ball for spares vs. hook creates decision strategy."),
                        sciRow(stat: "Adjustments: 1-board left/right changes angle 0.8–1.2°",
                               detail: "Bowling adjustment science: moving left for right-handed bowler targets area right, moving right targets left (opposite of intuition). 1-board adjustment at foul line = approximately 3 boards at pins. Oil breakdown reading and mid-game adjustment frequency."),
                        sciRow(stat: "Pre-shot routine: 6–8 seconds standardised approach",
                               detail: "Pre-delivery routine in professional bowling: finding mark on approach, target arrow focus (not pins), breathing, mental rehearsal of delivery. Elite professionals time routines to within ±0.5 s. Interruption of pre-shot routine by noise/distraction: performance impact 5–10%."),
                        sciRow(stat: "300 game psychology: managing perfect game pressure",
                               detail: "Perfect game (12 consecutive strikes) psychological demands — TV cameras, crowd attention, pressure escalation from frame 9. Choking mechanism: explicit monitoring of normally automatic delivery mechanics. Post-300 adrenaline: many bowlers report 'can't remember' the final frames (automaticity).")
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Bowling Science")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        let types: Set<HKObjectType> = [HKObjectType.workoutType()]
        guard (try? await store.requestAuthorization(toShare: [], read: types)) != nil else { isLoading = false; return }
        let now = Date()
        let start = Calendar.current.date(byAdding: .weekOfYear, value: -52, to: now) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now)
        let workouts: [HKWorkout] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                cont.resume(returning: (samples as? [HKWorkout]) ?? [])
            }
            store.execute(q)
        }
        let filtered = workouts.filter { $0.workoutActivityType == .bowling }
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
            Text(value)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    private func scienceCard(title: String, icon: String, color: Color, rows: [AnyView]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundColor(color)
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in row }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(14)
        .padding(.horizontal)
    }

    private func sciRow(stat: String, detail: String) -> AnyView {
        AnyView(VStack(alignment: .leading, spacing: 3) {
            Text(stat).font(.subheadline).fontWeight(.semibold)
            Text(detail).font(.caption).foregroundColor(.secondary).fixedSize(horizontal: false, vertical: true)
        })
    }
}
