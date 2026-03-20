import SwiftUI

// MARK: - WorkoutAnalyticsView

/// Hub view listing all workout analysis sections and cross-cutting analytics.
struct WorkoutAnalyticsView: View {

    private struct AnalyticsEntry: Identifiable {
        let id = UUID()
        let title: String
        let subtitle: String
        let icon: String
        let color: Color
        let destination: AnyView
    }

    private let sections: [(header: String, entries: [AnalyticsEntry])] = [
        (
            header: "Sport Analysis",
            entries: [
                AnalyticsEntry(title: "Walking", subtitle: "Pace, distance & weekly volume", icon: "figure.walk", color: .green,
                               destination: AnyView(WalkingAnalysisView())),
                AnalyticsEntry(title: "Walking Patterns", subtitle: "DOW distribution, time-of-day & monthly distance trend", icon: "chart.bar.xaxis", color: .green,
                               destination: AnyView(WalkingPatternView())),
                AnalyticsEntry(title: "Walking Progression", subtitle: "12-month distance & pace trend with quarterly breakdown", icon: "chart.line.uptrend.xyaxis", color: .green,
                               destination: AnyView(WalkingProgressionView())),
                AnalyticsEntry(title: "Yoga & Mind-Body", subtitle: "Session frequency, duration & practice type breakdown", icon: "figure.mind.and.body", color: .purple,
                               destination: AnyView(YogaAnalysisView())),
                AnalyticsEntry(title: "Mindful Minutes", subtitle: "Meditation streaks, session trends & time-of-day practice pattern", icon: "brain.head.profile", color: .purple,
                               destination: AnyView(MindfulMinutesView())),
                AnalyticsEntry(title: "Stair Climbing", subtitle: "Session trends, kcal/min intensity & weekly volume", icon: "figure.stair.stepper", color: .orange,
                               destination: AnyView(StairClimbingView())),
                AnalyticsEntry(title: "Elliptical", subtitle: "Session volume, calorie intensity & duration trend", icon: "figure.elliptical", color: .cyan,
                               destination: AnyView(EllipticalAnalysisView())),
                AnalyticsEntry(title: "Golf", subtitle: "Distance walked, calories & monthly round frequency", icon: "figure.golf", color: .green,
                               destination: AnyView(GolfAnalysisView())),
                AnalyticsEntry(title: "Cross-Training", subtitle: "CrossFit & mixed cardio sessions, intensity & weekly volume", icon: "figure.cross.training", color: .red,
                               destination: AnyView(CrossTrainingView())),
                AnalyticsEntry(title: "Tennis", subtitle: "Session history, calories & monthly match frequency", icon: "figure.tennis", color: .yellow,
                               destination: AnyView(TennisAnalysisView())),
                AnalyticsEntry(title: "Outdoor vs Indoor", subtitle: "Environment split by sport, monthly trend & preference", icon: "sun.and.horizon.fill", color: .yellow,
                               destination: AnyView(OutdoorIndoorView())),
                AnalyticsEntry(title: "Running", subtitle: "Pace, distance & PRs", icon: "figure.run", color: .orange,
                               destination: AnyView(RunningAnalysisView())),
                AnalyticsEntry(title: "Running Patterns", subtitle: "DOW distribution, time-of-day & pace trend", icon: "chart.bar.xaxis", color: .green,
                               destination: AnyView(RunningPatternView())),
                AnalyticsEntry(title: "Cycling", subtitle: "Speed, distance & weekly volume", icon: "figure.outdoor.cycle", color: .blue,
                               destination: AnyView(CyclingAnalysisView())),
                AnalyticsEntry(title: "Cycling Patterns", subtitle: "DOW distribution, time-of-day & speed trend", icon: "chart.bar.xaxis", color: .blue,
                               destination: AnyView(CyclingPatternView())),
                AnalyticsEntry(title: "Cycling Progression", subtitle: "12-month distance & speed trend with elevation", icon: "chart.line.uptrend.xyaxis", color: .blue,
                               destination: AnyView(CyclingProgressionView())),
                AnalyticsEntry(title: "Swimming", subtitle: "Pace per 100m & pool sets", icon: "figure.pool.swim", color: .cyan,
                               destination: AnyView(SwimmingAnalysisView())),
                AnalyticsEntry(title: "Swimming Patterns", subtitle: "DOW distribution, time-of-day & pace per 100m trend", icon: "chart.bar.xaxis", color: .cyan,
                               destination: AnyView(SwimmingPatternView())),
                AnalyticsEntry(title: "Swimming Progression", subtitle: "12-month distance & pace per 100m trend", icon: "chart.line.uptrend.xyaxis", color: .cyan,
                               destination: AnyView(SwimmingProgressionView())),
                AnalyticsEntry(title: "Strength Training", subtitle: "Frequency, volume & sessions", icon: "figure.strengthtraining.traditional", color: .red,
                               destination: AnyView(StrengthAnalysisView())),
                AnalyticsEntry(title: "Strength Patterns", subtitle: "DOW distribution, time-of-day & duration trend", icon: "chart.bar.xaxis", color: .red,
                               destination: AnyView(StrengthPatternView())),
                AnalyticsEntry(title: "Strength Progression", subtitle: "12-month volume trend, duration trend & quarterly breakdown", icon: "chart.line.uptrend.xyaxis", color: .red,
                               destination: AnyView(StrengthProgressionView())),
                AnalyticsEntry(title: "Hiking", subtitle: "Distance, elevation & hike log", icon: "figure.hiking", color: .green,
                               destination: AnyView(HikingAnalysisView())),
                AnalyticsEntry(title: "Hiking Patterns", subtitle: "DOW distribution, time-of-day & elevation trend", icon: "chart.bar.xaxis", color: .green,
                               destination: AnyView(HikingPatternView())),
                AnalyticsEntry(title: "Hiking Progression", subtitle: "12-month distance & elevation gain trend", icon: "chart.line.uptrend.xyaxis", color: .green,
                               destination: AnyView(HikingProgressionView())),
                AnalyticsEntry(title: "HIIT", subtitle: "Peak HR, burn rate & intensity", icon: "bolt.heart.fill", color: .pink,
                               destination: AnyView(HIITAnalysisView())),
                AnalyticsEntry(title: "HIIT Patterns", subtitle: "DOW distribution, time-of-day & weekly volume", icon: "chart.bar.xaxis", color: .yellow,
                               destination: AnyView(HIITPatternView())),
                AnalyticsEntry(title: "HIIT Progression", subtitle: "12-month frequency, duration trend & calorie burn", icon: "chart.line.uptrend.xyaxis", color: .pink,
                               destination: AnyView(HIITProgressionView())),
                AnalyticsEntry(title: "Rowing", subtitle: "500m splits, distance & HR", icon: "figure.rowing", color: .cyan,
                               destination: AnyView(RowingAnalysisView())),
                AnalyticsEntry(title: "Rowing Patterns", subtitle: "DOW distribution, time-of-day & 500m split trend", icon: "chart.bar.xaxis", color: .pink,
                               destination: AnyView(RowingPatternView())),
                AnalyticsEntry(title: "Rowing Progression", subtitle: "12-month distance & 500m split trend", icon: "chart.line.uptrend.xyaxis", color: .pink,
                               destination: AnyView(RowingProgressionView())),
            ]
        ),
        (
            header: "Training Analytics",
            entries: [
                AnalyticsEntry(title: "Heart Rate Zones", subtitle: "Z1–Z5 distribution across workouts", icon: "heart.circle.fill", color: .red,
                               destination: AnyView(HeartRateZonesView())),
                AnalyticsEntry(title: "Training Load", subtitle: "Acute:chronic ratio & fatigue", icon: "chart.bar.fill", color: .purple,
                               destination: AnyView(TrainingLoadView())),
                AnalyticsEntry(title: "Running Form", subtitle: "Cadence, stride & vertical oscillation", icon: "figure.run.motion", color: .orange,
                               destination: AnyView(RunningFormView())),
                AnalyticsEntry(title: "Pace Zones", subtitle: "80/20 easy vs hard distribution", icon: "timer", color: .orange,
                               destination: AnyView(RunningPaceZonesView())),
                AnalyticsEntry(title: "Running Efficiency", subtitle: "AEI trend — speed per heartbeat", icon: "gauge.open.with.lines.needle.33percent", color: .green,
                               destination: AnyView(RunningEfficiencyView())),
                AnalyticsEntry(title: "Race Predictor", subtitle: "5K, 10K, half & full via VDOT", icon: "stopwatch.fill", color: .green,
                               destination: AnyView(RacePredictorView())),
                AnalyticsEntry(title: "Race Goal Planner", subtitle: "16-week countdown & progressive mileage plan to target race", icon: "flag.checkered.2.crossed", color: .red,
                               destination: AnyView(RaceGoalPlannerView())),
                AnalyticsEntry(title: "Records & PRs", subtitle: "Your lifetime personal bests", icon: "trophy.fill", color: .yellow,
                               destination: AnyView(RecordsView())),
                AnalyticsEntry(title: "Sleep Impact", subtitle: "How workouts affect overnight HRV & sleep", icon: "bed.double.fill", color: .indigo,
                               destination: AnyView(WorkoutSleepImpactView())),
                AnalyticsEntry(title: "Workout Calendar", subtitle: "Monthly view colored by sport type", icon: "calendar.badge.clock", color: .teal,
                               destination: AnyView(WorkoutCalendarView())),
                AnalyticsEntry(title: "Training Advisor", subtitle: "HRV-based weekly training plan", icon: "brain.head.profile", color: .cyan,
                               destination: AnyView(TrainingAdvisorView())),
                AnalyticsEntry(title: "Workout Variety", subtitle: "Sport mix, diversity score & weekly balance", icon: "figure.mixed.cardio", color: .purple,
                               destination: AnyView(WorkoutVarietyView())),
                AnalyticsEntry(title: "Running Progression", subtitle: "12-month pace trend, monthly volume & quarterly breakdown", icon: "chart.line.uptrend.xyaxis", color: .orange,
                               destination: AnyView(RunningProgressionView())),
                AnalyticsEntry(title: "Training Patterns", subtitle: "Day-of-week, time-of-day & weekly volume analysis", icon: "calendar.badge.clock", color: .teal,
                               destination: AnyView(TrainingPatternView())),
                AnalyticsEntry(title: "Workout Efficiency", subtitle: "kcal/min by type — intensity across all sports", icon: "bolt.heart.fill", color: .yellow,
                               destination: AnyView(WorkoutEfficiencyView())),
                AnalyticsEntry(title: "Performance Overview", subtitle: "Cross-sport year-over-year comparison", icon: "chart.bar.doc.horizontal.fill", color: .blue,
                               destination: AnyView(PerformanceOverviewView())),
                AnalyticsEntry(title: "Volume History", subtitle: "52-week training breakdown by sport", icon: "chart.bar.fill", color: .orange,
                               destination: AnyView(TrainingVolumeHistoryView())),
                AnalyticsEntry(title: "Zone 2 Training", subtitle: "Aerobic base volume tracker — 52 weeks", icon: "heart.circle.fill", color: .green,
                               destination: AnyView(Zone2TrainingView())),
                AnalyticsEntry(title: "Consistency Tracker", subtitle: "52-week session frequency, streaks & training days", icon: "calendar.badge.checkmark", color: .teal,
                               destination: AnyView(WorkoutConsistencyView())),
                AnalyticsEntry(title: "Lifetime Stats", subtitle: "All-time totals, milestones & year-over-year", icon: "star.circle.fill", color: .teal,
                               destination: AnyView(LifetimeStatsView())),
                AnalyticsEntry(title: "Injury Risk Score", subtitle: "ACWR, consecutive days, HRV & resting HR risk factors", icon: "exclamationmark.triangle.fill", color: .orange,
                               destination: AnyView(InjuryRiskView())),
                AnalyticsEntry(title: "Fitness Age", subtitle: "VO₂ max-based biological fitness age vs chronological age", icon: "figure.run.circle.fill", color: .indigo,
                               destination: AnyView(FitnessAgeView())),
                AnalyticsEntry(title: "Training Phases", subtitle: "Auto-detect base, build, peak & taper from 52-week volume", icon: "calendar.badge.clock", color: .blue,
                               destination: AnyView(PeriodizationView())),
                AnalyticsEntry(title: "Monotony & Strain", subtitle: "Coggan's training science — daily load variety & cumulative stress", icon: "waveform.path.ecg", color: .indigo,
                               destination: AnyView(TrainingMonotonyView())),
                AnalyticsEntry(title: "Stress vs Recovery", subtitle: "12-week scatter: training load vs HRV recovery — quadrant analysis", icon: "chart.scatter", color: .purple,
                               destination: AnyView(StressRecoveryView())),
                AnalyticsEntry(title: "ECG History", subtitle: "Sinus rhythm %, AFib burden & classification timeline", icon: "waveform.path.ecg.rectangle.fill", color: .red,
                               destination: AnyView(ECGAnalysisView())),
                AnalyticsEntry(title: "Walking Heart Rate", subtitle: "Passive walking HR as a daily fitness indicator trend", icon: "figure.walk.circle.fill", color: .teal,
                               destination: AnyView(WalkingHeartRateView())),
                AnalyticsEntry(title: "Cardiac Drift", subtitle: "HR drift in long runs — first vs second half aerobic base measure", icon: "arrow.up.right.heart.fill", color: .teal,
                               destination: AnyView(CardiacDriftView())),
                AnalyticsEntry(title: "Aerobic Decoupling", subtitle: "Pace-to-HR efficiency across long runs — MAF training metric", icon: "waveform.path", color: .teal,
                               destination: AnyView(AerobicDecouplingView())),
                AnalyticsEntry(title: "Energy Balance", subtitle: "Radar: aerobic base, threshold, VO₂ max, strength & recovery score", icon: "pentagon.fill", color: .teal,
                               destination: AnyView(EnergySystemBalanceView())),
                AnalyticsEntry(title: "HRV Session Recommender", subtitle: "Today's readiness zone & session suggestions based on HRV vs baseline", icon: "brain.head.profile", color: .green,
                               destination: AnyView(HRVSessionRecommenderView())),
                AnalyticsEntry(title: "VO₂ Max Trend", subtitle: "Apple Watch VO₂ max estimates, fitness category & 12-month progression", icon: "lungs.fill", color: .purple,
                               destination: AnyView(VO2MaxTrendView())),
            ]
        ),
    ]

    var body: some View {
        List {
            ForEach(sections, id: \.header) { section in
                Section(section.header) {
                    ForEach(section.entries) { entry in
                        NavigationLink(destination: entry.destination) {
                            HStack(spacing: 12) {
                                Image(systemName: entry.icon)
                                    .font(.title3)
                                    .foregroundStyle(entry.color)
                                    .frame(width: 36, height: 36)
                                    .background(entry.color.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(entry.title)
                                        .font(.subheadline.weight(.medium))
                                    Text(entry.subtitle)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Analytics")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        WorkoutAnalyticsView()
    }
}
