import SwiftUI

// MARK: - FoodDiaryEntry Model

struct FoodDiaryEntry: Identifiable, Decodable {
    let id: String
    let name: String
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let mealType: String
    let loggedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, calories, protein, carbs, fat
        case mealType = "meal_type"
        case loggedAt = "logged_at"
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        calories = try container.decode(Int.self, forKey: .calories)
        protein = try container.decode(Double.self, forKey: .protein)
        carbs = try container.decode(Double.self, forKey: .carbs)
        fat = try container.decode(Double.self, forKey: .fat)
        mealType = try container.decode(String.self, forKey: .mealType)
        
        let dateStr = try container.decode(String.self, forKey: .loggedAt)
        loggedAt = ISO8601DateFormatter().date(from: dateStr) ?? Date()
    }
    
    init(id: String, name: String, calories: Int, protein: Double, carbs: Double, fat: Double, mealType: String, loggedAt: Date) {
        self.id = id
        self.name = name
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.mealType = mealType
        self.loggedAt = loggedAt
    }
}

// MARK: - FoodDiaryView

struct FoodDiaryView: View {
    @State private var entries: [FoodDiaryEntry] = []
    @State private var selectedDate = Date()
    @State private var isLoading = false
    
    var calorieGoal: Int {
        UserDefaults.standard.integer(forKey: "calorieGoal") == 0 ? 2000 : UserDefaults.standard.integer(forKey: "calorieGoal")
    }
    
    var totalCalories: Int { entries.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { entries.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Double { entries.reduce(0) { $0 + $1.carbs } }
    var totalFat: Double { entries.reduce(0) { $0 + $1.fat } }
    
    var mealGroups: [(String, [FoodDiaryEntry])] {
        let meals = ["Breakfast", "Lunch", "Dinner", "Snacks"]
        return meals.compactMap { meal in
            let filtered = entries.filter { $0.mealType.lowercased() == meal.lowercased() }
            return filtered.isEmpty ? nil : (meal, filtered)
        }
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Date picker
                    DatePicker("Date", selection: $selectedDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .padding(.horizontal)
                        .onChange(of: selectedDate) { _, _ in Task { await loadEntries() } }
                    
                    // Calorie summary
                    VStack(spacing: 4) {
                        HStack {
                            Text("\(totalCalories) / \(calorieGoal) kcal")
                                .font(.headline)
                                .foregroundColor(.white)
                            Spacer()
                            if totalCalories > calorieGoal {
                                Text("+\(totalCalories - calorieGoal) over")
                                    .font(.caption)
                                    .foregroundColor(.red)
                            } else {
                                Text("\(calorieGoal - totalCalories) left")
                                    .font(.caption)
                                    .foregroundColor(.green)
                            }
                        }
                        ProgressView(value: Double(totalCalories), total: Double(calorieGoal))
                            .tint(totalCalories > calorieGoal ? .red : .green)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.15))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Macro summary
                    HStack(spacing: 12) {
                        MacroChip(label: "Protein", value: totalProtein, unit: "g", color: .blue)
                        MacroChip(label: "Carbs", value: totalCarbs, unit: "g", color: .orange)
                        MacroChip(label: "Fat", value: totalFat, unit: "g", color: .yellow)
                    }
                    .padding(.horizontal)
                    
                    if isLoading {
                        ProgressView().padding()
                    } else if entries.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "fork.knife")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                            Text("No entries for this day")
                                .foregroundColor(.gray)
                                .font(.subheadline)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                    } else {
                        ForEach(mealGroups, id: \.0) { meal, mealEntries in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(meal)
                                    .font(.headline)
                                    .foregroundColor(.gray)
                                    .padding(.horizontal)
                                
                                ForEach(mealEntries) { entry in
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text(entry.name)
                                                .font(.subheadline)
                                                .foregroundColor(.white)
                                            Text("P:\(Int(entry.protein))g C:\(Int(entry.carbs))g F:\(Int(entry.fat))g")
                                                .font(.caption)
                                                .foregroundColor(.gray)
                                        }
                                        Spacer()
                                        Text("\(entry.calories) kcal")
                                            .font(.subheadline)
                                            .foregroundColor(.orange)
                                    }
                                    .padding(.horizontal)
                                    .padding(.vertical, 6)
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(8)
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .background(Color(.systemBackground))
            .navigationTitle("Food Diary")
            .navigationBarTitleDisplayMode(.inline)
            .task { await loadEntries() }
        }
    }
    
    private func loadEntries() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let dateStr = selectedDate.formatted(.iso8601.year().month().day())
            entries = try await SupabaseService.shared.getFoodDiaryEntries(date: dateStr)
        } catch {
            print("[FoodDiaryView] Failed to load entries: \(error)")
            entries = []
        }
    }
}

// MARK: - MacroChip Component

struct MacroChip: View {
    let label: String
    let value: Double
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(String(format: "%.0f\(unit)", value))
                .font(.headline)
                .bold()
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

#Preview {
    FoodDiaryView()
}
