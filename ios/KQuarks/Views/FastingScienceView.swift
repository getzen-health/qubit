import SwiftUI

struct FastingScienceView: View {
    // Fasting data comes from app's own fasting tracker (not HealthKit)
    // Show science content with illustrative protocol examples

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                fastingProtocolsRow
                autophagyAndCellularCard
                metabolicBenefitsCard
                hormoneResponseCard
                practicalFastingCard
            }
            .padding()
        }
        .navigationTitle("Fasting Science")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Protocol Row
    private var fastingProtocolsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                protocolCard(name: "16:8", desc: "Most studied IF protocol", color: .orange)
                protocolCard(name: "5:2", desc: "500 kcal on 2 days/week", color: .blue)
                protocolCard(name: "OMAD", desc: "One meal a day (24h)", color: .purple)
            }
            HStack {
                Text("Mattson 2014 (Nat Rev Neurosci): fasting triggers the same cellular pathways as caloric restriction without permanent dietary restriction")
                    .font(.caption2).foregroundColor(.secondary)
            }
        }
    }

    private func protocolCard(name: String, desc: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(name).font(.title2).bold().foregroundColor(color)
            Text(desc).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    // MARK: - Science Cards
    private var autophagyAndCellularCard: some View {
        scienceCard(title: "Autophagy & Cellular Cleaning", icon: "🔬", color: .purple) {
            sciRow(stat: "Ohsumi 2016 (Nobel Prize)", detail: "Autophagy ('self-eating'): lysosomal degradation of damaged organelles, protein aggregates, and intracellular pathogens; regulated by mTOR (inhibits autophagy) and AMPK (promotes autophagy); fasting for 16–24h significantly upregulates autophagic flux in liver, muscle, and brain; Nobel Prize in Physiology awarded 2016 for elucidating autophagy mechanisms")
            sciRow(stat: "Levine 2019 (Cell Metabolism)", detail: "Autophagy induction timeline: blood glucose falls after 4–8h fasting; glycogen depletion at 12–16h triggers autophagy upregulation; insulin drops to minimum at ~14h; AMPK peaks at 16–24h fasting; autophagy peaks at 24–48h; mTOR re-activation after refeeding is critical for muscle protein synthesis — this oscillation (fasting/feeding) may be more beneficial than constant autophagy")
            sciRow(stat: "Alirezaei 2010 (Autophagy)", detail: "Fasting and brain health: 24–48h fasting increases autophagy in neurons 2-fold; autophagy clears tau aggregates, amyloid-β, and α-synuclein — all implicated in Alzheimer's, Parkinson's, and Huntington's disease; animal models show fasting reduces AD pathology 50–60%; human clinical trials ongoing; caloric restriction (25%) mimics some autophagic benefits")
            sciRow(stat: "Choi 2016 (Cell)", detail: "Prolonged fasting and immune system: 48–72h fasting promotes stem cell-based regeneration of the immune system — depletes old lymphocytes and triggers new stem cell proliferation upon refeeding; fasting-mimicking diet (FMD) 3–5 days monthly reduces inflammatory markers, reduces IGF-1 30%, and reduces CRP significantly in 3-month human trial (Brandhorst 2015)")
        }
    }

    private var metabolicBenefitsCard: some View {
        scienceCard(title: "Metabolic Effects of Fasting", icon: "⚡", color: .orange) {
            sciRow(stat: "Mattson 2014 (Nat Rev Neurosci)", detail: "Metabolic switching: within 12–14h fasting, liver glycogen depletes and hepatic ketogenesis begins; blood ketones (primarily β-hydroxybutyrate) rise from <0.1 to 0.5–2.0 mmol/L during 24h fast; β-HB is not merely a fuel but a signaling molecule — inhibits NLRP3 inflammasome, activates FOXO3, and acts as HDAC inhibitor modifying gene expression")
            sciRow(stat: "Sutton 2018 (Cell Metabolism)", detail: "Time-restricted eating (TRE) and metabolic health: 5-week RCT of early TRE (eating 6:00–15:00) in men with prediabetes: improved insulin sensitivity 38%, reduced mean arterial pressure significantly, reduced oxidative stress — all independent of weight loss; circadian alignment of eating with peak insulin sensitivity (morning) amplifies metabolic benefits beyond simple caloric restriction")
            sciRow(stat: "Varady 2013", detail: "Alternate day fasting (ADF) and body composition: 12-week ADF (alternate 25% vs ad-lib days) produces comparable weight loss to daily caloric restriction (−5.7 vs −5.4 kg) with better preservation of fat-free mass; ADF may be more sustainable for some populations — study days create automatic deficit without daily tracking; however, hunger on fasting days remains significant")
            sciRow(stat: "Longo 2016 (Cell Metabolism)", detail: "Fasting-mimicking diet (FMD): 5-day FMD monthly (day 1: 1,090 kcal; days 2–5: 725 kcal) provides caloric restriction signals while allowing some food intake; in 3 cycles: reduces trunk fat 1.9 kg, reduces IGF-1 15%, reduces CRP 26%, reduces fasting glucose in pre-diabetic range; regenerative effects attributed to stem cell activation during refeeding phase")
        }
    }

    private var hormoneResponseCard: some View {
        scienceCard(title: "Hormonal Response to Fasting", icon: "🧬", color: .blue) {
            sciRow(stat: "Cahill 1970", detail: "Fasting hormones timeline: 0–4h: insulin falls, glucagon rises → hepatic glycogenolysis; 4–16h: GH rises 3-fold, cortisol increases slightly → protein sparing; 16–24h: growth hormone peaks 5-fold, ketones rise, insulin at nadir; 24–72h: full ketoadaptation, muscle proteolysis minimized, nitrogen excretion decreased; ketones spare ~50% of brain's glucose need by day 3")
            sciRow(stat: "Ho 1988 (J Clin Endocrinol)", detail: "Growth hormone and fasting: 24h fasting increases GH pulsatile secretion 5-fold in both sexes; GH rises during fasting to preserve lean mass and mobilize fat; Hartman 1992: GH response to fasting is blunted in obese individuals; IGF-1 (downstream of GH) falls during fasting — this GH↑/IGF-1↓ dissociation is unique to fasting and may have protective anti-aging effects")
            sciRow(stat: "Mosley 2013 (5:2 Diet)", detail: "5:2 protocol metabolic effects: 2 days of 500 kcal/week vs daily 25% CR: similar weight loss but 5:2 produces greater insulin sensitization, greater reduction in IGF-1, and better retention of lean mass; adherence to 5:2 may be superior to daily CR for many individuals as full eating days prevent habitual restriction fatigue; 5:2 also reduces triglycerides 14% vs 9% daily CR")
            sciRow(stat: "Patterson 2017 (Ann Rev Nutr)", detail: "Circadian fasting science: circadian misalignment (eating at night) increases insulin resistance 17%, inflammation, and disrupts leptin/ghrelin rhythms; time-restricted feeding aligned with daylight hours reduces these risks; metabolic syndrome markers improve significantly with 12h overnight fast regardless of caloric intake; 'when you eat matters as much as what you eat' — circadian nutrient timing")
        }
    }

    private var practicalFastingCard: some View {
        scienceCard(title: "Evidence-Based Fasting Protocols", icon: "📋", color: .green) {
            sciRow(stat: "Harris 2018 (NEJM)", detail: "Who benefits most from IF: metabolically healthy overweight adults: weight loss comparable to CR with better insulin outcomes; pre-diabetics and insulin-resistant individuals: strongest clinical benefit (Sutton 2018: −38% insulin resistance from TRE); athletes: shorter fasts (12–14h overnight) are safest; people with disordered eating history: IF may reinforce restrictive patterns — clinical supervision recommended")
            sciRow(stat: "Moro 2016 (J Transl Med)", detail: "Fasting and muscle preservation: 8-week 16:8 TRE in resistance-trained men: fat mass decreased 16.4%, lean mass maintained, strength unchanged; eating window: 13:00–21:00; protein intake maintained at 1.8 g/kg/day; muscle-protein synthesis is preserved during fasting periods when daily protein intake is adequate; whey protein pre-sleep (within eating window) showed additive benefit")
            sciRow(stat: "Tinsley 2019", detail: "Exercise during fasted state: aerobic exercise in fasted state increases fat oxidation 20–30% vs fed state at same intensity; no significant difference in total 24h fat oxidation with matched calories; fasted resistance training: no impairment in session quality when glycogen stores are sufficient from prior day; post-exercise refeeding window is critical — consume 20–40g protein + carbs within 30–60 min of fasted training")
            sciRow(stat: "Mattson 2019 (NEJM)", detail: "Long-term safety and considerations: 12-month RCT of 16:8 in adults with obesity: equivalent weight loss to caloric restriction, no adverse effects; no evidence of metabolic adaptation or disproportionate muscle loss with adequate protein; contraindications: pregnant/nursing, type 1 diabetes on insulin, history of eating disorders, underweight (BMI <18.5); refeeding syndrome risk after prolonged fasts >72h in malnourished individuals")
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
}
