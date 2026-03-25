import SwiftUI
import HealthKit

// MARK: - NutritionView

struct NutritionView: View {
    @State private var nutrition: SupabaseService.DailyNutrition?
    @State private var meals: [SupabaseService.MealEntry] = []
    @State private var isLoading = true
    @State private var showLogMeal = false
    @State private var selectedMealType: MealTypeOption = .breakfast

    private let calorieTarget = 2000

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if isLoading {
                        ProgressView().padding(.top, 40)
                    } else {
                        calorieRing
                        macroBar
                        mealTypeQuickAdd
                        if !meals.isEmpty { mealList }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Nutrition")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    HStack {
                        NavigationLink(destination: NutritionPatternView()) {
                            Image(systemName: "chart.bar.xaxis")
                        }
                        Button {
                            showLogMeal = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showLogMeal, onDismiss: {
                Task { await load() }
            }) {
                LogMealView(initialMealType: selectedMealType)
            }
            .task { await load() }
            .refreshable { await load() }
        }
    }

    // MARK: - Calorie Ring

    private var caloriesConsumed: Int { nutrition?.calories_consumed ?? 0 }
    private var progress: Double { min(Double(caloriesConsumed) / Double(calorieTarget), 1.0) }

    private var calorieRing: some View {
        HStack(spacing: 24) {
            ZStack {
                Circle()
                    .stroke(Color.orange.opacity(0.15), lineWidth: 16)
                    .frame(width: 110, height: 110)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Color.orange, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                    .frame(width: 110, height: 110)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.6), value: progress)
                VStack(spacing: 2) {
                    Text("\(caloriesConsumed)")
                        .font(.title2.bold())
                    Text("kcal")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Consumed")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(caloriesConsumed) kcal")
                        .font(.subheadline.bold())
                }
                HStack {
                    Text("Target")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(calorieTarget) kcal")
                        .font(.subheadline.bold())
                }
                HStack {
                    Text("Remaining")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    let remaining = max(calorieTarget - caloriesConsumed, 0)
                    Text("\(remaining) kcal")
                        .font(.subheadline.bold())
                        .foregroundStyle(remaining > 0 ? Color.primary : Color.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Macro Bar

    private var macroBar: some View {
        VStack(spacing: 12) {
            MacroRow(
                label: "Protein",
                value: nutrition?.protein_consumed ?? 0,
                target: 150,
                unit: "g",
                color: .blue
            )
            MacroRow(
                label: "Carbs",
                value: nutrition?.carbs_consumed ?? 0,
                target: 250,
                unit: "g",
                color: .orange
            )
            MacroRow(
                label: "Fat",
                value: nutrition?.fat_consumed ?? 0,
                target: 65,
                unit: "g",
                color: .purple
            )
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Quick Add by Meal Type

    private var mealTypeQuickAdd: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Add to Meal")
                .font(.headline)

            HStack(spacing: 10) {
                ForEach(MealTypeOption.allCases, id: \.self) { type in
                    Button {
                        selectedMealType = type
                        showLogMeal = true
                    } label: {
                        VStack(spacing: 4) {
                            Text(type.emoji)
                                .font(.title2)
                            Text(type.label)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Meal List

    private var mealList: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Today's Meals")
                .font(.headline)
                .padding(.horizontal)
                .padding(.bottom, 8)

            VStack(spacing: 0) {
                ForEach(Array(meals.enumerated()), id: \.offset) { (idx, meal) in
                    HStack(spacing: 12) {
                        Text(MealTypeOption.from(meal.meal_type).emoji)
                            .font(.title3)
                            .frame(width: 36, height: 36)
                            .background(Color(.systemGroupedBackground))
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 2) {
                            Text(meal.name)
                                .font(.subheadline.weight(.medium))
                            Text("\(meal.calories) kcal · P:\(Int(meal.protein))g · C:\(Int(meal.carbs))g · F:\(Int(meal.fat))g")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Text(MealTypeOption.from(meal.meal_type).label)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            Task {
                                try? await SupabaseService.shared.deleteMeal(mealId: meal.id)
                                await load()
                            }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                    if idx < meals.count - 1 {
                        Divider().padding(.leading, 60)
                    }
                }
            }
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private func load() async {
        isLoading = true
        async let n = SupabaseService.shared.fetchTodayNutrition()
        async let m = SupabaseService.shared.fetchTodayMeals()
        nutrition = try? await n
        meals = (try? await m) ?? []
        isLoading = false
    }
}

// MARK: - Macro Row

private struct MacroRow: View {
    let label: String
    let value: Double
    let target: Double
    let unit: String
    let color: Color

    var progress: Double { min(value / target, 1.0) }

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.subheadline)
                Spacer()
                Text(String(format: "%.0f", value) + " / " + String(format: "%.0f", target) + " " + unit)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color.opacity(0.15))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geo.size.width * progress, height: 8)
                        .animation(.easeInOut(duration: 0.5), value: progress)
                }
            }
            .frame(height: 8)
        }
    }
}

// MARK: - Log Meal View

struct LogMealView: View {
    let initialMealType: MealTypeOption
    @Environment(\.dismiss) private var dismiss

    @State private var mealType: MealTypeOption
    @State private var foodName = ""
    @State private var calories = 300
    @State private var protein: Double = 20
    @State private var carbs: Double = 40
    @State private var fat: Double = 10
    @State private var showMacros = false
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMsg = ""

    init(initialMealType: MealTypeOption) {
        self.initialMealType = initialMealType
        _mealType = State(initialValue: initialMealType)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Meal") {
                    Picker("Type", selection: $mealType) {
                        ForEach(MealTypeOption.allCases, id: \.self) { type in
                            Label(type.label, systemImage: type.icon).tag(type)
                        }
                    }
                    TextField("Food name (e.g. Chicken salad)", text: $foodName)
                }

                Section("Calories") {
                    Stepper("\(calories) kcal", value: $calories, in: 0...5000, step: 25)
                }

                Section {
                    Toggle("Add Macros", isOn: $showMacros)
                    if showMacros {
                        Stepper(String(format: "Protein: %.0f g", protein), value: $protein, in: 0...500, step: 5)
                        Stepper(String(format: "Carbs: %.0f g", carbs), value: $carbs, in: 0...500, step: 5)
                        Stepper(String(format: "Fat: %.0f g", fat), value: $fat, in: 0...200, step: 2.5)
                    }
                } header: {
                    Text("Macros (optional)")
                }
            }
            .navigationTitle("Log Food")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text("Save").bold()
                        }
                    }
                    .disabled(foodName.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: { Text(errorMsg) }
        }
    }

    private func save() async {
        let name = foodName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        isSaving = true
        defer { isSaving = false }

        do {
            try await SupabaseService.shared.logMeal(
                mealType: mealType.rawValue,
                name: name,
                calories: calories,
                protein: showMacros ? protein : 0,
                carbs: showMacros ? carbs : 0,
                fat: showMacros ? fat : 0
            )

            // Also save to HealthKit as dietary energy
            if calories > 0 {
                let type = HKQuantityType(.dietaryEnergyConsumed)
                let qty = HKQuantity(unit: .kilocalorie(), doubleValue: Double(calories))
                let sample = HKQuantitySample(type: type, quantity: qty, start: Date(), end: Date())
                try? await HKHealthStore().save(sample)
            }

            #if os(iOS)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            #endif
            dismiss()
        } catch {
            errorMsg = error.localizedDescription
            showError = true
        }
    }
}

// MARK: - Meal Type Option

enum MealTypeOption: String, CaseIterable {
    case breakfast, lunch, dinner, snack

    var label: String {
        switch self {
        case .breakfast: return "Breakfast"
        case .lunch: return "Lunch"
        case .dinner: return "Dinner"
        case .snack: return "Snack"
        }
    }

    var emoji: String {
        switch self {
        case .breakfast: return "🌅"
        case .lunch: return "☀️"
        case .dinner: return "🌙"
        case .snack: return "🍎"
        }
    }

    var icon: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.fill"
        case .snack: return "apple.logo"
        }
    }

    static func from(_ string: String) -> MealTypeOption {
        MealTypeOption(rawValue: string) ?? .snack
    }
}

#Preview {
    NutritionView()
}
