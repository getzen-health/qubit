import SwiftUI

struct HealthDataView: View {
    @State private var selectedCategory: HealthCategory = .activity

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category picker
                Picker("Category", selection: $selectedCategory) {
                    ForEach(HealthCategory.allCases, id: \.self) { category in
                        Text(LocalizedStringKey(category.title)).tag(category)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                ScrollView {
                    LazyVStack(spacing: 16) {
                        if selectedCategory == .sleep {
                            NavigationLink(destination: SleepView()) {
                                HStack {
                                    Image(systemName: "moon.fill")
                                        .font(.title2)
                                        .foregroundStyle(.indigo)
                                        .frame(width: 44, height: 44)
                                        .background(Color.indigo.opacity(0.2))
                                        .cornerRadius(10)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Sleep History")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Last 30 nights")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: SleepQualityScoreView()) {
                                HStack {
                                    Image(systemName: "star.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(.yellow)
                                        .frame(width: 44, height: 44)
                                        .background(Color.yellow.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Sleep Quality Score")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Nightly 0–100 score: duration, stages & efficiency")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: SleepDebtView()) {
                                HStack {
                                    Image(systemName: "moon.haze.fill")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Sleep Debt")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Cumulative deficit & repayment tracking")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: SleepEfficiencyView()) {
                                HStack {
                                    Image(systemName: "gauge.with.dots.needle.67percent")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Sleep Efficiency")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Time asleep vs time in bed (CBT-I target ≥85%)")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: SleepApneaView()) {
                                HStack {
                                    Image(systemName: "lungs.fill")
                                        .font(.title2)
                                        .foregroundStyle(.indigo)
                                        .frame(width: 44, height: 44)
                                        .background(Color.indigo.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Sleep Apnea")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("AHI tracking, severity classification & CPAP context (Apple Watch S9+)")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                        } else if selectedCategory == .body {
                            NavigationLink(destination: BodyCompositionView()) {
                                HStack {
                                    Image(systemName: "scalemass.fill")
                                        .font(.title2)
                                        .foregroundStyle(.mint)
                                        .frame(width: 44, height: 44)
                                        .background(Color.mint.opacity(0.2))
                                        .cornerRadius(10)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Body Weight")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Trend chart and history")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Cycle Tracking
                            NavigationLink(destination: CycleTrackingView()) {
                                HStack {
                                    Image(systemName: "calendar.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(.pink)
                                        .frame(width: 44, height: 44)
                                        .background(Color.pink.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Cycle Tracking")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Phase analysis & training recommendations")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: MedicationTrackingView()) {
                                HStack {
                                    Image(systemName: "cross.case.fill")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Medication Tracking")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("FHIR clinical medication records, dosage history & biomarker correlations")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: AlcoholTrackingView()) {
                                HStack {
                                    Image(systemName: "wineglass.fill")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Alcohol Tracker")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("Drink count vs WHO guidelines, next-day HRV & RHR impact")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: CaffeineAnalyticsView()) {
                                HStack {
                                    Image(systemName: "cup.and.saucer.fill")
                                        .font(.title2)
                                        .foregroundStyle(.brown)
                                        .frame(width: 44, height: 44)
                                        .background(Color.brown.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Caffeine Analytics")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("Daily intake, half-life model & bedtime impact on sleep quality")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Handwashing Science
                            // Handwashing
                            // Audio Exposure Science
                            // Blood Glucose Science
                            // Blood Glucose (CGM)
                            NavigationLink(destination: BloodGlucoseView()) {
                                HStack {
                                    Image(systemName: "drop.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Blood Glucose")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("CGM, time in range & est. A1C")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            ForEach(selectedCategory.dataTypes.filter { $0 != .weight }, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        } else if selectedCategory == .heart {
                            // Daily Readiness
                            NavigationLink(destination: DailyReadinessView()) {
                                HStack {
                                    Image(systemName: "gauge.with.dots.needle.67percent")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Daily Readiness")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("0–100 score from HRV, resting HR & sleep")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Cardio Health Summary
                            NavigationLink(destination: CardioHealthSummaryView()) {
                                HStack {
                                    Image(systemName: "heart.text.square.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Cardio Health Summary")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("HRV, RHR, VO₂ Max & HR Recovery")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // VO₂max Science
                            // VO2 Max / Cardio Fitness
                            NavigationLink(destination: VO2MaxView()) {
                                HStack {
                                    Image(systemName: "lungs.fill")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Cardio Fitness (VO₂ Max)")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Trend and fitness level")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Race Predictor
                            // Circadian HR Pattern
                            NavigationLink(destination: CircadianHRView()) {
                                HStack {
                                    Image(systemName: "clock.arrow.circlepath")
                                        .font(.title2)
                                        .foregroundStyle(.pink)
                                        .frame(width: 44, height: 44)
                                        .background(Color.pink.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Daily HR Pattern")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("24-hour circadian rhythm")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // HR Recovery Science
                            // HR Recovery
                            NavigationLink(destination: HeartRateRecoveryView()) {
                                HStack {
                                    Image(systemName: "arrow.down.heart.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("HR Recovery")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Post-workout recovery rate")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Breathing Rate Deep Dive
                            NavigationLink(destination: BreathingRateView()) {
                                HStack {
                                    Image(systemName: "lungs.fill")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Breathing Rate Deep Dive")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("30-day trend, baseline vs current & illness signals")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Respiratory Rate
                            NavigationLink(destination: RespiratoryRateView()) {
                                HStack {
                                    Image(systemName: "wind")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Respiratory Rate")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Breathing rate during sleep")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: RespiratoryPatternView()) {
                                HStack {
                                    Image(systemName: "waveform")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Respiratory Patterns")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Day-of-week & monthly breathing rate patterns")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Blood Oxygen Science
                            // Blood Oxygen Deep Dive (SpO₂)
                            NavigationLink(destination: BloodOxygenDeepDiveView()) {
                                HStack {
                                    Image(systemName: "lungs.fill")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("SpO₂ Deep Dive")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("30-day trend, nighttime avg & low alerts")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Blood Oxygen (SpO₂)
                            NavigationLink(destination: BloodOxygenView()) {
                                HStack {
                                    Image(systemName: "lungs")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Blood Oxygen (SpO₂)")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("30-day trend & low alerts")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Resting Heart Rate trend
                            NavigationLink(destination: RHRTrendView()) {
                                HStack {
                                    Image(systemName: "heart.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Resting Heart Rate")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("6-month trend & fitness zone")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // HRV Science
                            // HRV deep-dive
                            NavigationLink(destination: HRVDetailView()) {
                                HStack {
                                    Image(systemName: "waveform.path.ecg")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("HRV Analysis")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Baseline, trends, patterns")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: RHRPatternView()) {
                                HStack {
                                    Image(systemName: "heart.text.square")
                                        .font(.title2)
                                        .foregroundStyle(.pink)
                                        .frame(width: 44, height: 44)
                                        .background(Color.pink.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("RHR Patterns")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Day-of-week, monthly & distribution analysis")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: HRVCalendarView()) {
                                HStack {
                                    Image(systemName: "calendar.badge.clock")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("HRV Calendar")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("52-week heatmap — daily HRV vs personal baseline")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // HRV Recovery Zones
                            NavigationLink(destination: HRVZonesView()) {
                                HStack {
                                    Image(systemName: "chart.bar.fill")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("HRV Recovery Zones")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Green / yellow / orange zone history")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Vitality Score — composite longevity index
                            NavigationLink(destination: LongevityView()) {
                                HStack {
                                    Image(systemName: "star.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(.yellow)
                                        .frame(width: 44, height: 44)
                                        .background(Color.yellow.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Vitality Score")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Multi-metric longevity index")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Fitness Profile — 6-dimension radar chart
                            NavigationLink(destination: FitnessProfileView()) {
                                HStack {
                                    Image(systemName: "hexagon.fill")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Fitness Profile")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("6-dimension health fingerprint")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // AFib Science
                            // Cardiac Events (AFib, high HR, low HR)
                            NavigationLink(destination: CardiacEventsView()) {
                                HStack {
                                    Image(systemName: "heart.text.clipboard.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Cardiac Events")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("High HR, low HR & irregular rhythm")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: MaxHRAnalysisView()) {
                                HStack {
                                    Image(systemName: "waveform.path.ecg")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Max HR Analysis")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("Observed HRmax vs. formulas, by sport & zone calibration")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: HeartRateReserveView()) {
                                HStack {
                                    Image(systemName: "arrow.up.arrow.down.heart")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Heart Rate Reserve")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("Karvonen zones, 90-day HRR trend & fitness classification")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            // Blood pressure gets its own detailed view
                            NavigationLink(destination: BloodPressureView()) {
                                HStack {
                                    Image(systemName: "heart.text.clipboard")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Blood Pressure")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Log and track readings")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        } else if selectedCategory == .activity {
                            NavigationLink(destination: StandingHoursView()) {
                                HStack {
                                    Image(systemName: "figure.stand")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Standing Hours")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Daily stand hours, 12-hr goal streak & hourly pattern")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: ExerciseMinutesView()) {
                                HStack {
                                    Image(systemName: "figure.run")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Exercise Minutes")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("WHO 150 min/week goal progress & streak history")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: ActiveEnergyBudgetView()) {
                                HStack {
                                    Image(systemName: "flame.fill")
                                        .font(.title2)
                                        .foregroundStyle(.red)
                                        .frame(width: 44, height: 44)
                                        .background(Color.red.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Active Energy")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Move ring calories, weekly totals & day-of-week patterns")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: FunctionalFitnessBatteryView()) {
                                HStack {
                                    Image(systemName: "figure.strengthtraining.functional.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(.indigo)
                                        .frame(width: 44, height: 44)
                                        .background(Color.indigo.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Functional Fitness Battery")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("VO₂ max + 6-min walk + steadiness + gait speed + stair speed — composite functional age")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: BasalMetabolicRateView()) {
                                HStack {
                                    Image(systemName: "flame.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(.orange)
                                        .frame(width: 44, height: 44)
                                        .background(Color.orange.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Basal Metabolic Rate")
                                            .font(.headline).foregroundStyle(.white)
                                        Text("Apple Watch BMR, Mifflin-St Jeor formula & TDEE estimate")
                                            .font(.subheadline).foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: ActivitySummaryView()) {
                                HStack {
                                    Image(systemName: "chart.bar.fill")
                                        .font(.title2)
                                        .foregroundStyle(.blue)
                                        .frame(width: 44, height: 44)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Activity Summary")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("This week vs last week with streak & goals")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: MonthlyHealthSummaryView()) {
                                HStack {
                                    Image(systemName: "calendar.badge.checkmark")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Monthly Summary")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("This month vs last month with best days")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: GoalsHistoryView()) {
                                HStack {
                                    Image(systemName: "target")
                                        .font(.title2)
                                        .foregroundStyle(.purple)
                                        .frame(width: 44, height: 44)
                                        .background(Color.purple.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Goals History")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("30-day step, calorie & sleep goal streaks")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: ActivityRingsHistoryView()) {
                                HStack {
                                    Image(systemName: "rays")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Activity Rings")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("30-day ring close history")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: StepPatternView()) {
                                HStack {
                                    Image(systemName: "chart.bar.xaxis")
                                        .font(.title2)
                                        .foregroundStyle(.orange)
                                        .frame(width: 44, height: 44)
                                        .background(Color.orange.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Step Pattern")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Hourly & weekday activity rhythm")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: CaloriePatternView()) {
                                HStack {
                                    Image(systemName: "flame.fill")
                                        .font(.title2)
                                        .foregroundStyle(.orange)
                                        .frame(width: 44, height: 44)
                                        .background(Color.orange.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Calorie Patterns")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Day-of-week & seasonal calorie burn")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: ActivityHeatmapView()) {
                                HStack {
                                    Image(systemName: "calendar.badge.clock")
                                        .font(.title2)
                                        .foregroundStyle(.green)
                                        .frame(width: 44, height: 44)
                                        .background(Color.green.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Activity Calendar")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("365-day heatmap")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: MobilityView()) {
                                HStack {
                                    Image(systemName: "figure.walk.motion")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Mobility")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Walking speed, step length & gait")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: HearingHealthView()) {
                                HStack {
                                    Image(systemName: "ear")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Hearing Health")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("Noise & headphone exposure")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: CorrelationInsightsView()) {
                                HStack {
                                    Image(systemName: "chart.line.text.clipboard")
                                        .font(.title2)
                                        .foregroundStyle(.indigo)
                                        .frame(width: 44, height: 44)
                                        .background(Color.indigo.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Health Correlations")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("How sleep, HRV & steps influence each other — 60-day Pearson analysis")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: MindfulnessImpactView()) {
                                HStack {
                                    Image(systemName: "brain.head.profile")
                                        .font(.title2)
                                        .foregroundStyle(.teal)
                                        .frame(width: 44, height: 44)
                                        .background(Color.teal.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Mindfulness Impact")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("How meditation affects HRV & recovery")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            NavigationLink(destination: SymptomsLogView()) {
                                HStack {
                                    Image(systemName: "cross.case.fill")
                                        .font(.title2)
                                        .foregroundStyle(.orange)
                                        .frame(width: 44, height: 44)
                                        .background(Color.orange.opacity(0.2))
                                        .cornerRadius(10)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Symptoms Log")
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                        Text("30-day log of logged symptoms with severity & patterns")
                                            .font(.subheadline)
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.4))
                                }
                                .padding()
                                .premiumCard(cornerRadius: 12)
                            }
                            .buttonStyle(.plain)

                            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        } else {
                            ForEach(selectedCategory.dataTypes, id: \.self) { dataType in
                                HealthDataRow(dataType: dataType)
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Health Data")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    HStack(spacing: 4) {
                        NavigationLink(destination: BreathingView()) {
                            Image(systemName: "wind")
                        }
                        NavigationLink(destination: HistoryView()) {
                            Image(systemName: "calendar")
                        }
                        NavigationLink(destination: HabitsView()) {
                            Image(systemName: "checklist")
                        }
                        NavigationLink(destination: RecordsView()) {
                            Image(systemName: "trophy")
                        }
                        NavigationLink(destination: AchievementsView()) {
                            Image(systemName: "star.circle.fill")
                        }
                        NavigationLink(destination: StreaksView()) {
                            Image(systemName: "flame")
                        }
                        NavigationLink(destination: SmartNudgesView()) {
                            Image(systemName: "wand.and.stars")
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Health Category

enum HealthCategory: CaseIterable {
    case activity
    case heart
    case sleep
    case body

    var title: String {
        switch self {
        case .activity: return NSLocalizedString("Activity", comment: "Health category")
        case .heart: return NSLocalizedString("Heart", comment: "Health category")
        case .sleep: return NSLocalizedString("Sleep", comment: "Health category")
        case .body: return NSLocalizedString("Body", comment: "Health category")
        }
    }

    var dataTypes: [HealthDataType] {
        switch self {
        case .activity:
            return [.steps, .distance, .activeCalories, .floorsClimbed]
        case .heart:
            return [.heartRate, .restingHeartRate, .hrv]
        case .sleep:
            return [] // Sleep has its own view
        case .body:
            return [.weight, .bodyFat]
        }
    }
}

// MARK: - Health Data Row

struct HealthDataRow: View {
    let dataType: HealthDataType
    @State private var latestValue: Double?
    @State private var isLoading = true

    private let healthKit = HealthKitService.shared

    var body: some View {
        NavigationLink(destination: HealthMetricDetailView(dataType: dataType)) {
            HStack {
                Image(systemName: dataType.icon)
                    .font(.title2)
                    .foregroundStyle(Color.accentColor)
                    .frame(width: 44, height: 44)
                    .background(Color.accentColor.opacity(0.2))
                    .cornerRadius(10)

                VStack(alignment: .leading, spacing: 4) {
                    Text(dataType.displayName)
                        .font(.headline)

                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else if let value = latestValue {
                        Text(formatValue(value, for: dataType))
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.4))
                    } else {
                        Text("No data")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.4))
                    }
                }

                Spacer()
            }
            .padding()
            .premiumCard(cornerRadius: 12)
        }
        .buttonStyle(.plain)
        .task {
            await loadData()
        }
    }

    private func loadData() async {
        isLoading = true

        do {
            let identifier = dataType.healthKitIdentifier
            if let id = identifier {
                latestValue = try await healthKit.fetchLatest(for: id)
            }
        } catch {
            // Silently fail
        }

        isLoading = false
    }

    private func formatValue(_ value: Double, for type: HealthDataType) -> String {
        switch type {
        case .steps, .floorsClimbed:
            return "\(Int(value))"
        case .distance:
            return String(format: "%.2f km", value / 1000)
        case .activeCalories, .totalCalories:
            return "\(Int(value)) kcal"
        case .heartRate, .restingHeartRate:
            return "\(Int(value)) bpm"
        case .hrv:
            return "\(Int(value)) ms"
        case .weight:
            return String(format: "%.1f kg", value)
        case .bodyFat:
            return String(format: "%.1f%%", value * 100)
        default:
            return String(format: "%.1f", value)
        }
    }
}

// MARK: - HealthKit Identifier Extension

extension HealthDataType {
    var healthKitIdentifier: HKQuantityTypeIdentifier? {
        switch self {
        case .steps: return .stepCount
        case .distance: return .distanceWalkingRunning
        case .activeCalories: return .activeEnergyBurned
        case .totalCalories: return .basalEnergyBurned
        case .floorsClimbed: return .flightsClimbed
        case .heartRate: return .heartRate
        case .restingHeartRate: return .restingHeartRate
        case .hrv: return .heartRateVariabilitySDNN
        case .weight: return .bodyMass
        case .bodyFat: return .bodyFatPercentage
        case .oxygenSaturation: return .oxygenSaturation
        case .respiratoryRate: return .respiratoryRate
        case .bloodPressureSystolic: return .bloodPressureSystolic
        case .bloodPressureDiastolic: return .bloodPressureDiastolic
        }
    }
}

import HealthKit

#Preview {
    HealthDataView()
}
