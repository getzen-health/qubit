import SwiftUI

struct EditFoodEntryView: View {
    @Environment(\.dismiss) var dismiss
    let entry: FoodDiaryEntry
    let onSave: (FoodDiaryEntry) -> Void
    
    @State private var calories: Int
    @State private var protein: Double
    @State private var carbs: Double
    @State private var fat: Double
    @State private var mealType: String
    
    init(entry: FoodDiaryEntry, onSave: @escaping (FoodDiaryEntry) -> Void) {
        self.entry = entry
        self.onSave = onSave
        _calories = State(initialValue: entry.calories)
        _protein = State(initialValue: entry.protein)
        _carbs = State(initialValue: entry.carbs)
        _fat = State(initialValue: entry.fat)
        _mealType = State(initialValue: entry.mealType)
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Nutrition") {
                    Stepper("Calories: \(calories) kcal", value: $calories, in: 0...2000, step: 10)
                    Stepper("Protein: \(String(format:"%.0f",protein))g", value: $protein, in: 0...200, step: 1)
                    Stepper("Carbs: \(String(format:"%.0f",carbs))g", value: $carbs, in: 0...400, step: 1)
                    Stepper("Fat: \(String(format:"%.0f",fat))g", value: $fat, in: 0...100, step: 1)
                }
                Section("Meal") {
                    Picker("Meal Type", selection: $mealType) {
                        ForEach(["Breakfast","Lunch","Dinner","Snacks"], id: \.self) { Text($0) }
                    }
                }
            }
            .navigationTitle("Edit Entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        var updated = entry
                        updated = FoodDiaryEntry(
                            id: updated.id,
                            name: updated.name,
                            calories: calories,
                            protein: protein,
                            carbs: carbs,
                            fat: fat,
                            mealType: mealType,
                            loggedAt: updated.loggedAt
                        )
                        onSave(updated)
                        dismiss()
                    }
                }
            }
        }
    }
}
