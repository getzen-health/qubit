import SwiftUI
import HealthKit

struct RacquetballScienceView: View {
    @State private var totalSessions: Int = 0
    @State private var avgHR: Double = 0
    @State private var avgDurationMin: Double = 0
    @State private var isLoading = true
    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    statCard(value: "\(totalSessions)", label: "Sessions", color: .blue)
                    statCard(value: String(format: "%.0f", avgHR), label: "Avg HR bpm", color: .cyan)
                    statCard(value: String(format: "%.0f min", avgDurationMin), label: "Avg Duration", color: .green)
                }
                .padding(.horizontal)

                scienceCard(
                    title: "The Fastest Indoor Racket Sport",
                    icon: "sportscourt.fill",
                    color: .blue,
                    rows: [
                        sciRow(
                            stat: "Ball speed: 240+ km/h off back wall in professional play",
                            detail: "Racquetball ball physics: pressurised rubber ball, coefficient of restitution 0.95+, speed off front wall up to 200 km/h, off back wall 240+ km/h. Court dimensions 9.75×6.1×6.1 m (same width as squash but shorter). Professional player serve speed: 180–220 km/h."
                        ),
                        sciRow(
                            stat: "Rally: all 4 walls, ceiling, and floor in play",
                            detail: "Unique racquetball court geometry enabling shots off all surfaces — back wall kills, ceiling shots (defensive lobs), pinch shots (front wall + side wall), Z-shots (front wall + far side wall). 3D spatial reasoning demands."
                        ),
                        sciRow(
                            stat: "Physical demands: VO₂max 55–68 mL/kg/min",
                            detail: "Aerobic demands of racquetball, HR 82–92% HRmax during match play, blood lactate 4–7 mmol/L, match duration 30–60 min, work:rest ratio 1:1 to 2:1. Less extreme than squash but more demanding than tennis."
                        ),
                        sciRow(
                            stat: "Court coverage: 2.5–4.0 km per match",
                            detail: "Movement pattern analysis, lateral shuffles, forward/backward explosiveness, ceiling ball defensive retreating, drop-and-recover movement patterns."
                        )
                    ]
                )

                scienceCard(
                    title: "Biomechanics & Technique",
                    icon: "bolt.fill",
                    color: .cyan,
                    rows: [
                        sciRow(
                            stat: "Forehand drive: wrist snap at 900–1,200°/s, waist-high contact",
                            detail: "Racquetball forehand mechanics: contact at waist height for maximum power and control, wrist snap contribution vs. arm swing, backswing length, follow-through path. Lower contact point vs. squash (lower walls)."
                        ),
                        sciRow(
                            stat: "Serve: drive serve and lob serve biomechanics",
                            detail: "Drive serve: explosive serve to Z-zone, jam serve to body — deception through similar preparation. Lob serve: high arc hitting side wall, pace change tactical use. Server's box positioning rules."
                        ),
                        sciRow(
                            stat: "Kill shot: contact <18 inches from floor for 'rollout'",
                            detail: "The kill shot — ball contacted low enough to roll out (not bounce, just roll) — is the ultimate offensive weapon. Requires precise contact at 15–18 cm height, steep downward swing plane, timing at apex of bounce or on-the-fly. Success rate: 40–60% even for experts."
                        ),
                        sciRow(
                            stat: "Back wall shot: convert back wall set-up to offensive",
                            detail: "Back wall play — ball off back wall presenting as offensive opportunity — is the skill most differentiating intermediate from advanced racquetball players. Approach timing, court position, reading ball trajectory off rubber wall."
                        )
                    ]
                )

                scienceCard(
                    title: "Physical Demands & Injury",
                    icon: "heart.fill",
                    color: .blue,
                    rows: [
                        sciRow(
                            stat: "Eye injuries: racquetball has highest eye injury rate of any sport",
                            detail: "Protective eyewear is mandatory in USAR sanctioned events: racquetball ball can pass through eye socket (unlike squash ball). Eye injury rate 75× higher in non-eyewear users. Polycarbonate lens requirement. History of serious injuries driving mandatory eyewear rules."
                        ),
                        sciRow(
                            stat: "Shoulder: rotator cuff demands from varied swing heights",
                            detail: "Racquetball requires shots from floor level to above head — extreme range shoulder demands. Supraspinatus and infraspinatus loading, shoulder impingement risk in repetitive ceiling ball play, eccentric loading in overhead shots."
                        ),
                        sciRow(
                            stat: "Ankle sprains: lateral plant-and-cut on hard court",
                            detail: "Ankle injury rate 18–25% in racquetball — sudden direction changes on polished hardwood surface, court shoes and their shock absorption ratings, proprioceptive training for ankle stability."
                        ),
                        sciRow(
                            stat: "Thermal regulation: enclosed court, limited air circulation",
                            detail: "Indoor racquetball court thermal environment: temperature 20–26°C, humidity 40–60%, limited air movement. Sweat rate 1.2–1.8 L/hour, dehydration risk in multi-game sessions, heat illness awareness in older recreational players."
                        )
                    ]
                )

                scienceCard(
                    title: "Strategy & Tactics",
                    icon: "brain.head.profile",
                    color: .cyan,
                    rows: [
                        sciRow(
                            stat: "Centre court position: T-zone control determines match outcome",
                            detail: "Centre court (T-zone) positioning in racquetball: controlling the middle of the court for maximum shot reach, court coverage, and forcing opponent to shoot from unfavourable positions. Rally outcome correlates strongly with T-zone occupancy time."
                        ),
                        sciRow(
                            stat: "Passing shots: down-the-line vs. crosscourt angles",
                            detail: "Passing shot trajectories in racquetball: down-the-line (parallel to side wall, hardest to intercept) vs. crosscourt V-pass (wider angle, lower recovery probability). Shot selection based on opponent's court position."
                        ),
                        sciRow(
                            stat: "Mental game: managing rallies in an enclosed environment",
                            detail: "Psychological factors in racquetball's intimate court environment — auditory cues from ball/wall, proximity to opponent, spatial awareness in small enclosure. Focus and visual tracking skills."
                        ),
                        sciRow(
                            stat: "Doubles vs. singles: unique communication and spacing demands",
                            detail: "Doubles racquetball: I-formation (front/back) vs. side-by-side positioning, communication timing for avoiding partner collisions, shot selection responsibility by position."
                        )
                    ]
                )
            }
            .padding(.vertical)
        }
        .navigationTitle("Racquetball Science")
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
