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
                AnalyticsEntry(title: "Pilates & Barre", subtitle: "Pilates, barre, flexibility & core training — type mix & duration", icon: "figure.pilates", color: .purple,
                               destination: AnyView(PilatesBarreView())),
                AnalyticsEntry(title: "Mindful Minutes", subtitle: "Meditation streaks, session trends & time-of-day practice pattern", icon: "brain.head.profile", color: .purple,
                               destination: AnyView(MindfulMinutesView())),
                AnalyticsEntry(title: "Stair Climbing", subtitle: "Session trends, kcal/min intensity & weekly volume", icon: "figure.stair.stepper", color: .orange,
                               destination: AnyView(StairClimbingView())),
                AnalyticsEntry(title: "Elliptical", subtitle: "Session volume, calorie intensity & duration trend", icon: "figure.elliptical", color: .cyan,
                               destination: AnyView(EllipticalAnalysisView())),
                AnalyticsEntry(title: "Golf", subtitle: "Distance walked, calories & monthly round frequency", icon: "figure.golf", color: .green,
                               destination: AnyView(GolfAnalysisView())),
                AnalyticsEntry(title: "Soccer", subtitle: "Match distance, calorie intensity & monthly session frequency", icon: "soccerball", color: .green,
                               destination: AnyView(SoccerAnalysisView())),
                AnalyticsEntry(title: "Basketball", subtitle: "Session history, calorie burn & weekly volume", icon: "basketball.fill", color: .orange,
                               destination: AnyView(BasketballAnalysisView())),
                AnalyticsEntry(title: "Dance & Aerobics", subtitle: "Dance, social dance & step training sessions — frequency & calorie trends", icon: "music.note", color: .pink,
                               destination: AnyView(DanceAnalysisView())),
                AnalyticsEntry(title: "Racquet Sports", subtitle: "Pickleball, badminton, racquetball & squash — sport mix & session history", icon: "figure.badminton", color: .green,
                               destination: AnyView(RacquetSportsView())),
                AnalyticsEntry(title: "Martial Arts & Combat", subtitle: "Kickboxing, boxing, martial arts & wrestling — intensity & weekly volume", icon: "figure.kickboxing", color: .red,
                               destination: AnyView(MartialArtsView())),
                AnalyticsEntry(title: "Jump Rope", subtitle: "Skipping sessions, kcal/min intensity & weekly volume", icon: "figure.jumprope", color: .cyan,
                               destination: AnyView(JumpRopeView())),
                AnalyticsEntry(title: "Winter Sports", subtitle: "Skiing, snowboarding, cross-country & ice skating — seasonal sport history", icon: "snowflake", color: .blue,
                               destination: AnyView(WinterSportsView())),
                AnalyticsEntry(title: "Water & Paddle Sports", subtitle: "Surfing, paddleboarding, kayaking & water fitness — sessions & sport mix", icon: "figure.surfing", color: .blue,
                               destination: AnyView(WaterSportsView())),
                AnalyticsEntry(title: "Diving Analytics", subtitle: "Underwater depth, water temperature & no-deco limits — Apple Watch Ultra", icon: "water.waves", color: .cyan,
                               destination: AnyView(DivingAnalyticsView())),
                AnalyticsEntry(title: "Triathlon", subtitle: "Swim/bike/run volume split, brick workout detection & race-type distribution target", icon: "sportscourt.fill", color: .blue,
                               destination: AnyView(TriathlonView())),
                AnalyticsEntry(title: "Open Water Swimming", subtitle: "OWS pace per 100m, distance trend & monthly volume", icon: "figure.pool.swim", color: .cyan,
                               destination: AnyView(OpenWaterSwimmingView())),
                AnalyticsEntry(title: "Functional Strength", subtitle: "CrossFit, calisthenics & Olympic lifting — intensity & weekly volume", icon: "figure.strengthtraining.functional", color: .orange,
                               destination: AnyView(FunctionalStrengthView())),
                AnalyticsEntry(title: "Rock Climbing", subtitle: "Session duration, calorie intensity & weekly climbing volume", icon: "figure.climbing", color: .brown,
                               destination: AnyView(RockClimbingView())),
                AnalyticsEntry(title: "Volleyball", subtitle: "Session frequency, calorie burn & heart rate intensity", icon: "volleyball.fill", color: .yellow,
                               destination: AnyView(VolleyballAnalysisView())),
                AnalyticsEntry(title: "Equestrian Sports", subtitle: "Horseback riding, dressage & trail sessions — duration & monthly history", icon: "figure.equestrian.sports", color: .brown,
                               destination: AnyView(EquestrianView())),
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
                AnalyticsEntry(title: "Cycling Cadence", subtitle: "RPM trend, zone distribution & optimal 85–100 RPM target — Apple Watch Ultra", icon: "speedometer", color: .green,
                               destination: AnyView(CyclingCadenceView())),
                AnalyticsEntry(title: "Power-to-Weight", subtitle: "FTP W/kg ratio, British Cycling tier & weight impact simulator (iOS 17+)", icon: "bolt.fill", color: .yellow,
                               destination: AnyView(PowerToWeightView())),
                AnalyticsEntry(title: "Cycling Speed", subtitle: "Session avg & max speed, zone distribution & 90-day trend (iOS 17+)", icon: "gauge.with.needle.fill", color: .teal,
                               destination: AnyView(CyclingSpeedView())),
                AnalyticsEntry(title: "Cycling Power", subtitle: "FTP, power zones (Z1–Z7), power curve & TSS — compatible power meters", icon: "bolt.circle.fill", color: .yellow,
                               destination: AnyView(CyclingPowerView())),
                AnalyticsEntry(title: "Swimming", subtitle: "Pace per 100m & pool sets", icon: "figure.pool.swim", color: .cyan,
                               destination: AnyView(SwimmingAnalysisView())),
                AnalyticsEntry(title: "Swimming Patterns", subtitle: "DOW distribution, time-of-day & pace per 100m trend", icon: "chart.bar.xaxis", color: .cyan,
                               destination: AnyView(SwimmingPatternView())),
                AnalyticsEntry(title: "Swimming Progression", subtitle: "12-month distance & pace per 100m trend", icon: "chart.line.uptrend.xyaxis", color: .cyan,
                               destination: AnyView(SwimmingProgressionView())),
                AnalyticsEntry(title: "Stroke Efficiency", subtitle: "SWOLF score, distance-per-stroke & stroke rate — pool swim analytics", icon: "figure.pool.swim", color: .teal,
                               destination: AnyView(SwimmingStrokeEfficiencyView())),
                AnalyticsEntry(title: "Rowing Stroke Rate", subtitle: "SPM trend, zone distribution (steady–sprint) & power science", icon: "oar.2.crossed", color: .blue,
                               destination: AnyView(RowingStrokeRateView())),
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
                AnalyticsEntry(title: "Zone Progression", subtitle: "Monthly Z1–Z5 evolution, polarization index & Seiler 80/20 trend", icon: "chart.bar.doc.horizontal", color: .purple,
                               destination: AnyView(HRZoneProgressionView())),
                AnalyticsEntry(title: "Overtraining Warning", subtitle: "Composite OTS detector: HRV trend, RHR elevation, ACWR & sleep deficit", icon: "exclamationmark.triangle.fill", color: .red,
                               destination: AnyView(OvertrainingWarningView())),
                AnalyticsEntry(title: "Training Load", subtitle: "Acute:chronic ratio & fatigue", icon: "chart.bar.fill", color: .purple,
                               destination: AnyView(TrainingLoadView())),
                AnalyticsEntry(title: "Running Power", subtitle: "Critical power, power zones (Z1–Z5), NP & trend — Apple Watch Ultra", icon: "bolt.fill", color: .orange,
                               destination: AnyView(RunningPowerZonesView())),
                AnalyticsEntry(title: "Running Form", subtitle: "Cadence, stride & vertical oscillation", icon: "figure.run.motion", color: .orange,
                               destination: AnyView(RunningFormView())),
                AnalyticsEntry(title: "Pacing Analysis", subtitle: "Negative splits, pacing CV & within-run speed variation (iOS 16+)", icon: "gauge.with.dots.needle.67percent", color: .orange,
                               destination: AnyView(RunningPacingView())),
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
                AnalyticsEntry(title: "Workout Effort Score", subtitle: "Apple's 1–10 effort rating, session load & 80:20 balance (iOS 17+)", icon: "flame.fill", color: .orange,
                               destination: AnyView(PhysicalEffortView())),
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
                AnalyticsEntry(title: "Biological Age", subtitle: "Multi-biomarker age: HRV + RHR + VO₂ + gait speed — Levine 2018 PhenoAge methodology", icon: "dna", color: .teal,
                               destination: AnyView(BiologicalAgeView())),
                AnalyticsEntry(title: "Life Expectancy Impact", subtitle: "Years gained/lost per biomarker — VO₂ + steps + RHR + HRV + sleep vs. population", icon: "hourglass", color: .indigo,
                               destination: AnyView(LifeExpectancyView())),
                AnalyticsEntry(title: "Training Phases", subtitle: "Auto-detect base, build, peak & taper from 52-week volume", icon: "calendar.badge.clock", color: .blue,
                               destination: AnyView(PeriodizationView())),
                AnalyticsEntry(title: "Monotony & Strain", subtitle: "Coggan's training science — daily load variety & cumulative stress", icon: "waveform.path.ecg", color: .indigo,
                               destination: AnyView(TrainingMonotonyView())),
                AnalyticsEntry(title: "Stress vs Recovery", subtitle: "12-week scatter: training load vs HRV recovery — quadrant analysis", icon: "chart.scatter", color: .purple,
                               destination: AnyView(StressRecoveryView())),
                AnalyticsEntry(title: "ECG History", subtitle: "Sinus rhythm %, AFib burden & classification timeline", icon: "waveform.path.ecg.rectangle.fill", color: .red,
                               destination: AnyView(ECGAnalysisView())),
                AnalyticsEntry(title: "AFib Burden", subtitle: "Daily AFib burden %, 90-day trend & stroke risk context (iOS 16+)", icon: "waveform.path.ecg.rectangle.fill", color: .red,
                               destination: AnyView(AFibBurdenView())),
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
                AnalyticsEntry(title: "HRV Deep Dive", subtitle: "12-month SDNN trend, ANS balance, monthly averages & science", icon: "waveform.path.ecg", color: .green,
                               destination: AnyView(HRVDeepDiveView())),
                AnalyticsEntry(title: "Resting HR Deep Dive", subtitle: "12-month RHR trend, fitness classification & day-of-week pattern", icon: "heart.fill", color: .red,
                               destination: AnyView(RestingHRDeepDiveView())),
                AnalyticsEntry(title: "Workout Goals", subtitle: "Weekly session target, goal streak & sport breakdown over 13 weeks", icon: "trophy.fill", color: .yellow,
                               destination: AnyView(WorkoutGoalTrackerView())),
                AnalyticsEntry(title: "Cycle-Synced Training", subtitle: "Current phase, training tips & performance by menstrual cycle phase", icon: "figure.run.circle.fill", color: .pink,
                               destination: AnyView(CycleTrainingView())),
                AnalyticsEntry(title: "PAI Score", subtitle: "NTNU-validated weekly fitness score — time in HR zones vs 100 PAI longevity target", icon: "waveform.path.ecg.rectangle.fill", color: .green,
                               destination: AnyView(PAIScoreView())),
                AnalyticsEntry(title: "Athlete's Heart", subtitle: "12-month composite: RHR + HRV + VO₂ max adaptation progress & physiology timeline", icon: "heart.fill", color: .red,
                               destination: AnyView(AthletesHeartView())),
                AnalyticsEntry(title: "Cardio Fitness Trajectory", subtitle: "VO₂ max rate of change, 6-month projection & adaptation benchmarks", icon: "chart.line.uptrend.xyaxis.circle.fill", color: .purple,
                               destination: AnyView(CardioFitnessTrajectoryView())),
                AnalyticsEntry(title: "VO₂ Max Trend", subtitle: "Apple Watch VO₂ max estimates, fitness category & 12-month progression", icon: "lungs.fill", color: .purple,
                               destination: AnyView(VO2MaxTrendView())),
                AnalyticsEntry(title: "VO₂ Max vs Age Norms", subtitle: "Compare your VO₂ max against HUNT study age-group percentiles & fitness age", icon: "chart.bar.xaxis.ascending.badge.clock", color: .purple,
                               destination: AnyView(VO2MaxAgeNormsView())),
                AnalyticsEntry(title: "Lactate Threshold", subtitle: "Estimated LT1 & LT2 from run data — training zones & HR-pace scatter", icon: "waveform.path.ecg", color: .orange,
                               destination: AnyView(LactateThresholdView())),
                AnalyticsEntry(title: "Training Polarization", subtitle: "Seiler's 80/20 model — easy vs hard split across all sports with weekly trend", icon: "chart.pie.fill", color: .indigo,
                               destination: AnyView(TrainingPolarizationView())),
                AnalyticsEntry(title: "Critical Speed", subtitle: "Estimated aerobic-anaerobic threshold from run data — CS, D' & training zones", icon: "gauge.with.dots.needle.67percent", color: .teal,
                               destination: AnyView(CriticalSpeedView())),
                AnalyticsEntry(title: "Running Streaks", subtitle: "Current & longest streak, 90-day activity heatmap & weekly frequency", icon: "flame.fill", color: .orange,
                               destination: AnyView(RunningStreakView())),
                AnalyticsEntry(title: "Detraining", subtitle: "Training break detection, Mujika-Padilla VO₂ loss curve & retraining estimates", icon: "arrow.down.heart.fill", color: .red,
                               destination: AnyView(DetrainingView())),
                AnalyticsEntry(title: "State of Mind", subtitle: "Mood valence trend, emotional labels & life-area associations (iOS 18+)", icon: "heart.text.square.fill", color: .pink,
                               destination: AnyView(StateOfMindView())),
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
