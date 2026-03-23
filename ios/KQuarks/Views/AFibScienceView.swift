import SwiftUI
import HealthKit

struct AFibScienceView: View {
    @State private var afibBurden: Double = 0
    @State private var irregularNotifications: Int = 0
    @State private var isLoading = true

    private let store = HKHealthStore()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                afibStatsRow
                afibPhysiologyCard
                ecgAppleWatchCard
                strokeRiskCard
                managementCard
            }
            .padding()
        }
        .navigationTitle("AFib Science")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { Task { await loadData() } }
    }

    // MARK: - Stats Row
    private var afibStatsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                statCard(value: afibBurden > 0 ? String(format: "%.1f%%", afibBurden) : "0%", label: "AFib Burden (30d)", color: afibBurden > 5 ? .red : afibBurden > 0 ? .orange : .green)
                statCard(value: irregularNotifications > 0 ? "\(irregularNotifications)" : "0", label: "Irregular HR Alerts", color: irregularNotifications > 3 ? .red : irregularNotifications > 0 ? .orange : .green)
                statCard(value: afibBurden > 0 ? "Detected" : "None", label: "30-Day Status", color: afibBurden > 0 ? .orange : .green)
            }
            Text("Perez 2019 (NEJM): Apple Watch irregular rhythm notification showed 84% positive predictive value for AFib in 419,000-person Apple Heart Study — the largest cardiac screening trial ever conducted")
                .font(.caption2).foregroundColor(.secondary)
        }
    }

    private func statCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title2).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Science Cards
    private var afibPhysiologyCard: some View {
        scienceCard(title: "AFib Physiology & Epidemiology", icon: "💓", color: .red) {
            sciRow(stat: "Fuster 2006 (Circulation — AHA/ESC guidelines)", detail: "AFib defined: supraventricular tachyarrhythmia characterized by uncoordinated atrial activation with consequent deterioration of atrial mechanical function; electrically: absence of discrete P waves; ventricular rate irregularly irregular; types: paroxysmal (self-terminating ≤7 days), persistent (>7 days), long-standing persistent (>12 months), permanent; mechanism: multiple re-entrant wavelets in atrial myocardium maintained by structural and electrophysiological remodeling")
            sciRow(stat: "Lloyd-Jones 2004 (Circulation)", detail: "Epidemiology: AFib affects 1–2% of the general population; prevalence rises steeply with age — 0.1% in <55 year-olds, 3.8% in 60–69, 9% in 70–79, 18% in ≥80; lifetime risk is 25% for adults ≥40 (Framingham Heart Study); incidence is increasing 1–2% per year due to aging, obesity epidemic, and improved survival from other CVD; by 2050, projected 12–16 million Americans with AFib; AFib accounts for one-third of all hospitalizations for cardiac rhythm disturbance")
            sciRow(stat: "Wolf 1991 (Stroke — Framingham)", detail: "AFib risk factors: hypertension (#1 risk factor, attributable risk 14–22%), heart failure, valve disease, CAD, diabetes, sleep apnea, obesity, hyperthyroidism; modifiable: obesity raises AFib risk 49% per 5 kg/m² BMI increase; each 10 mmHg systolic BP increase → 9% higher AFib risk; alcohol dose-dependently increases risk — each additional drink/day → 8% higher risk; physical exercise has a U-shaped relationship: moderate exercise is protective (−20%), while extreme endurance sport raises risk (+5-fold in lone AFib)")
            sciRow(stat: "Haissaguerre 1998 (NEJM)", detail: "Triggering mechanism discovery: landmark paper demonstrating that most AFib triggers originate from ectopic foci in the pulmonary veins (PV); rapid PV firing drives re-entrant circuits in adjacent atrial tissue; this led to pulmonary vein isolation (PVI) catheter ablation; understanding: PV ectopy → initiates AFib; atrial substrate (fibrosis, remodeling) → maintains AFib; eliminating triggers via PVI cures paroxysmal AFib in 70–85% of patients (Haissaguerre 1998, Calkins 2012 meta-analysis)")
        }
    }

    private var ecgAppleWatchCard: some View {
        scienceCard(title: "ECG & Apple Watch Cardiac Monitoring", icon: "⌚", color: .blue) {
            sciRow(stat: "Perez 2019 (NEJM — Apple Heart Study)", detail: "419,297 participants without known AFib; irregular rhythm notifications sent to 0.52% of participants; of those notified: 84% confirmed AFib on concurrent ECG patch; 57% of those notified had AFib at the time of notification; not all notifications = AFib in real-time (some were from previous events); key limitation: false-positive notifications led to unnecessary cardiology visits in 14%; the study established wearable PPG as a valid screening tool for undiagnosed AFib in large populations")
            sciRow(stat: "Lubitz 2022 (Circulation)", detail: "Apple Watch ECG accuracy: single-lead ECG (lead I, right-left arm placement via finger on Digital Crown); sensitivity for AFib 98.3%, specificity 99.6% vs 12-lead ECG reference (Fung 2021 Eur Heart J Digital Health); PPG-based irregular rhythm notification: sensitivity 71.5%, specificity 97.3% for AFib (Perez 2019); clinical caveat: Apple Watch cannot diagnose — it screens; confirmed diagnosis requires 12-lead ECG or Holter monitor reviewed by cardiologist; Class IIa recommendation for screening in asymptomatic patients ≥65 (ACC/AHA 2023)")
            sciRow(stat: "Bumgarner 2018 (J Am Coll Cardiol)", detail: "Validation in clinical setting: Apple Watch vs 12-lead ECG in 100 patients with known AFib; AUC 0.97 for AFib detection; sensitivity 98%, specificity 90%; comparable to dedicated cardiac event monitors; the Apple Watch ECG app is FDA-cleared as a software device (De Novo authorization 2018); not approved for <22 years old, atrial flutter (may appear similar), other arrhythmias; notification requires continuous monitoring — detects AFib when it occurs during monitoring, not prospective screening")
            sciRow(stat: "Chung 2020 (Heart Rhythm)", detail: "AFib burden monitoring: AFib burden = percentage of time in AFib; even low AFib burden (≥1 min/day) is associated with 2–3× higher stroke risk vs no AFib; Apple Watch AFib History feature (iOS 16+) reports estimated AFib burden percentage for users with confirmed AFib; longitudinal AFib burden tracking enables treatment response monitoring; rhythm control strategy vs rate control: EAST-AFNET4 trial (2020 NEJM) showed early rhythm control significantly reduces CVD events when started within 1 year of AFib diagnosis")
        }
    }

    private var strokeRiskCard: some View {
        scienceCard(title: "Stroke Risk & CHA₂DS₂-VASc Score", icon: "⚡", color: .orange) {
            sciRow(stat: "Wolf 1991 (Stroke) + CHA₂DS₂-VASc scoring (Lip 2010)", detail: "AFib increases stroke risk 5-fold — the leading cause of cardioembolic stroke; risk stratification: CHA₂DS₂-VASc score: C=CHF (+1), H=Hypertension (+1), A₂=Age ≥75 (+2), D=Diabetes (+1), S₂=Prior stroke/TIA (+2), V=Vascular disease (+1), A=Age 65–74 (+1), Sc=Sex category female (+1); score 0 = low risk (no treatment); score 1 = intermediate; score ≥2 = high risk (anticoagulation recommended); annual stroke risk: score 0 = 0%, score 2 = 2.2%, score 6 = 9.7%, score 9 = 15.2%")
            sciRow(stat: "Hart 2007 (Ann Intern Med meta-analysis)", detail: "Anticoagulation efficacy: warfarin (INR 2–3) reduces stroke risk 64% vs placebo; direct oral anticoagulants (DOACs: apixaban, rivaroxaban, dabigatran, edoxaban) are at least as effective as warfarin with 50% less intracranial hemorrhage risk (Ruff 2014 Lancet); aspirin reduces stroke risk only 22% — inadequate for high-risk patients; DOAC non-adherence: each day missed raises monthly stroke risk 15%; wearables may aid DOAC adherence by providing real-time AFib burden as patient motivation for medication taking")
            sciRow(stat: "Hijazi 2016 (Eur Heart J)", detail: "Subclinical AFib and stroke: subclinical AFib (SCAF) detected only on continuous monitor lasting <24h is associated with 2–3× higher stroke risk vs patients with no AFib at all; ASSERT trial (Healey 2012 NEJM): SCAF episodes >6 min predicted 2.5× higher stroke risk over 2.5 years; threshold debate: some analyses suggest even episodes <6 min are associated with increased stroke risk; Apple Watch's ability to detect brief AFib episodes may identify SCAF — a previously underdiagnosed population")
            sciRow(stat: "Kim 2020 (NEJM Evidence)", detail: "Left atrial appendage closure: AFib thrombus forms in the left atrial appendage (LAA) in 90% of cases; WATCHMAN device (FDA-approved 2015) closes the LAA mechanically; PROTECT-AF trial: WATCHMAN non-inferior to warfarin for stroke prevention at 18 months; recommended for patients with high stroke risk AND high bleeding risk on anticoagulation; understanding: LAA is the anatomic site of AFib thrombus because reduced LAA flow during AFib allows blood stasis and clot formation")
        }
    }

    private var managementCard: some View {
        scienceCard(title: "AFib Management & Prevention", icon: "🛡️", color: .green) {
            sciRow(stat: "Calkins 2012 (Circulation — HRS/EHRA/ECAS guidelines)", detail: "Catheter ablation (pulmonary vein isolation): PVI via radiofrequency or cryoballoon ablation; success rates: paroxysmal AFib 70–85% single procedure, 80–90% with repeat procedures; persistent AFib 50–70%; superior to antiarrhythmic drugs for maintaining sinus rhythm long-term (CABANA trial 2019 JAMA); AF ablation is associated with reduced mortality (HR 0.60) vs drug therapy in the CABANA intention-to-treat analysis; early ablation (within 1 year of diagnosis) dramatically improves success rates")
            sciRow(stat: "Patel 2020 (Lancet) — weight loss and AFib", detail: "Lifestyle risk factor modification: LEGACY study — comprehensive risk factor management (10% weight loss, exercise, alcohol reduction, sleep apnea treatment, smoking cessation) achieved AFib freedom in 45% of patients vs 8% in control at 5 years; weight loss most powerful single factor; each 10% weight loss reduction → AFib recurrence −46%; in athletes: reducing extreme training volume reduces lone AFib recurrence; structured exercise ≤150 min/week REDUCES AFib risk; >1,000 min/week lifetime competitive sport significantly RAISES risk")
            sciRow(stat: "Pathak 2015 (J Am Coll Cardiol — ARREST-AF)", detail: "Exercise and AFib: moderate-intensity exercise (target 200 min/week at 60–80% HRmax) reduced AFib burden 50% and recurrence after ablation 60% vs usual care over 1 year; cardiorespiratory fitness improvement was the mediating variable — every 1 MET increase in fitness → 13% AFib reduction; the recommendation: for AFib prevention and management, moderate structured exercise with high-intensity AVOIDED; personalized exercise prescriptions targeting ≤80% HRmax are optimal")
            sciRow(stat: "Camm 2022 (Eur Heart J)", detail: "Rate control targets: ventricular rate goal during AFib: resting <110 bpm (lenient) OR <80 bpm (strict) — RACE II trial: no difference in outcomes between lenient vs strict rate control; symptom-driven rate control is preferred; drugs: beta-blockers, non-dihydropyridine CCBs (verapamil, diltiazem), digoxin; symptom burden and quality of life drive treatment intensity more than ventricular rate; Apple Watch AFib Burden monitoring enables objective response assessment to rate or rhythm control therapy")
        }
    }

    // MARK: - Helpers
    private func scienceCard(title: String, icon: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(icon); Text(title).font(.headline).bold() }
                .foregroundColor(color)
            content()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func sciRow(stat: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(stat).font(.caption).bold().foregroundColor(.secondary)
            Text(detail).font(.caption).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 2)
    }

    // MARK: - Data Loading
    private func loadData() async {
        guard HKHealthStore.isHealthDataAvailable() else { isLoading = false; return }
        guard let irregularType = HKObjectType.categoryType(forIdentifier: .irregularHeartRhythmEvent) else {
            isLoading = false; return
        }
        let ecgType = HKObjectType.electrocardiogramType()
        guard (try? await store.requestAuthorization(toShare: [], read: [irregularType, ecgType])) != nil else {
            isLoading = false; return
        }

        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: endDate) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

        let irregularSamples: [HKCategorySample] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: irregularType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKCategorySample]) ?? [])
            }
            store.execute(q)
        }

        let ecgSamples: [HKElectrocardiogram] = await withCheckedContinuation { continuation in
            let q = HKSampleQuery(sampleType: HKObjectType.electrocardiogramType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, s, _ in
                continuation.resume(returning: (s as? [HKElectrocardiogram]) ?? [])
            }
            store.execute(q)
        }

        let afibECGs = ecgSamples.filter { $0.classification == .atrialFibrillation }
        let afibBurdenEst = ecgSamples.isEmpty ? 0.0 : Double(afibECGs.count) / Double(ecgSamples.count) * 100

        await MainActor.run {
            self.afibBurden = afibBurdenEst
            self.irregularNotifications = irregularSamples.count
            self.isLoading = false
        }
    }
}
