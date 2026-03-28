import SwiftUI
import HealthKit

struct ExerciseLibraryView: View {
    @State private var searchText = ""
    @State private var selectedCategory: ExerciseCategory = .cardio
    
    private var filteredExercises: [Exercise] {
        let categoryExercises = selectedCategory.exercises
        guard !searchText.isEmpty else { return categoryExercises }
        return categoryExercises.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category Picker
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(ExerciseCategory.allCases, id: \.self) { category in
                            VStack(spacing: 4) {
                                Text(category.icon)
                                    .font(.title2)
                                Text(category.name)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                            .frame(minWidth: 60)
                            .padding(8)
                            .background(selectedCategory == category ? Color.blue : Color.gray.opacity(0.1))
                            .cornerRadius(8)
                            .onTapGesture {
                                withAnimation {
                                    selectedCategory = category
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 12)
                .background(Color(UIColor.systemBackground))
                .border(Color.gray.opacity(0.2), width: 1)
                
                // Exercise Grid
                ScrollView {
                    if filteredExercises.isEmpty {
                        ContentUnavailableView(
                            "No Exercises Found",
                            systemImage: "figure.walk",
                            description: Text("No exercises match your search in this category.")
                        )
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(filteredExercises, id: \.id) { exercise in
                                NavigationLink(destination: exercise.destinationView) {
                                    VStack(spacing: 8) {
                                        Text(exercise.icon)
                                            .font(.title)
                                        Text(exercise.name)
                                            .font(.callout)
                                            .fontWeight(.semibold)
                                            .lineLimit(2)
                                            .multilineTextAlignment(.center)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 100)
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(12)
                                }
                                .foregroundStyle(.primary)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Exercise Library")
            .toolbarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search exercises")
        }
    }
}

enum ExerciseCategory: String, CaseIterable, Hashable {
    case cardio = "Cardio"
    case strength = "Strength"
    case flexibility = "Flexibility"
    case sports = "Sports"
    case mindBody = "Mind & Body"
    
    var name: String { self.rawValue }
    
    var icon: String {
        switch self {
        case .cardio: return "🏃"
        case .strength: return "💪"
        case .flexibility: return "🧘"
        case .sports: return "⚽"
        case .mindBody: return "🧠"
        }
    }
    
    var exercises: [Exercise] {
        switch self {
        case .cardio:
            return [
                Exercise(id: "running", name: "Running", icon: "🏃", view: AnyView(RunningScienceView())),
                Exercise(id: "cycling", name: "Cycling", icon: "🚴", view: AnyView(CyclingScienceView())),
                Exercise(id: "swimming", name: "Swimming", icon: "🏊", view: AnyView(Text("Swimming View"))),
                Exercise(id: "rowing", name: "Rowing", icon: "🚣", view: AnyView(Text("Rowing View"))),
                Exercise(id: "walking", name: "Walking", icon: "🚶", view: AnyView(WalkingScienceView())),
                Exercise(id: "elliptical", name: "Elliptical", icon: "🏃", view: AnyView(EllipticalScienceView())),
                Exercise(id: "hiking", name: "Hiking", icon: "⛰️", view: AnyView(HikingScienceView())),
                Exercise(id: "crosscountry", name: "Cross Country Skiing", icon: "🎿", view: AnyView(CrossCountrySkiingScienceView())),
                Exercise(id: "downhill", name: "Downhill Skiing", icon: "🏂", view: AnyView(DownhillSkiingScienceView())),
                Exercise(id: "dance", name: "Dance", icon: "💃", view: AnyView(DanceScienceView())),
            ]
        case .strength:
            return [
                Exercise(id: "weightlifting", name: "Weight Training", icon: "🏋️", view: AnyView(Text("Weight Training View"))),
                Exercise(id: "boxing", name: "Boxing", icon: "🥊", view: AnyView(BoxingScienceView())),
                Exercise(id: "climbing", name: "Climbing", icon: "🧗", view: AnyView(ClimbingScienceView())),
                Exercise(id: "hiit", name: "HIIT", icon: "⚡", view: AnyView(HIITScienceView())),
                Exercise(id: "crosstraining", name: "Cross Training", icon: "🤸", view: AnyView(CrossTrainingScienceView())),
                Exercise(id: "gymnastics", name: "Gymnastics", icon: "🤸", view: AnyView(GymnasticsScienceView())),
                Exercise(id: "functional", name: "Functional Strength", icon: "💪", view: AnyView(FunctionalStrengthScienceView())),
                Exercise(id: "yoga", name: "Yoga Strength", icon: "🧘", view: AnyView(Text("Yoga Strength View"))),
                Exercise(id: "pilates", name: "Pilates", icon: "🧘‍♀️", view: AnyView(Text("Pilates View"))),
                Exercise(id: "kettlebell", name: "Kettlebell", icon: "🔔", view: AnyView(Text("Kettlebell View"))),
            ]
        case .flexibility:
            return [
                Exercise(id: "yoga", name: "Yoga", icon: "🧘", view: AnyView(Text("Yoga View"))),
                Exercise(id: "pilates", name: "Pilates", icon: "🧘‍♀️", view: AnyView(Text("Pilates View"))),
                Exercise(id: "stretching", name: "Stretching", icon: "🤸", view: AnyView(Text("Stretching View"))),
                Exercise(id: "tai_chi", name: "Tai Chi", icon: "⚛️", view: AnyView(Text("Tai Chi View"))),
                Exercise(id: "breathing", name: "Breathing", icon: "💨", view: AnyView(BreathingView())),
                Exercise(id: "foam_rolling", name: "Foam Rolling", icon: "🛼", view: AnyView(Text("Foam Rolling View"))),
                Exercise(id: "barre", name: "Barre", icon: "💃", view: AnyView(Text("Barre View"))),
                Exercise(id: "mobility", name: "Mobility", icon: "🚶", view: AnyView(Text("Mobility View"))),
                Exercise(id: "gymnastics", name: "Gymnastics", icon: "🤸", view: AnyView(Text("Gymnastics View"))),
            ]
        case .sports:
            return [
                Exercise(id: "basketball", name: "Basketball", icon: "🏀", view: AnyView(BasketballScienceView())),
                Exercise(id: "soccer", name: "Soccer", icon: "⚽", view: AnyView(Text("Soccer Science View"))),
                Exercise(id: "tennis", name: "Tennis", icon: "🎾", view: AnyView(Text("Tennis Science View"))),
                Exercise(id: "football", name: "American Football", icon: "🏈", view: AnyView(AmericanFootballScienceView())),
                Exercise(id: "baseball", name: "Baseball", icon: "⚾", view: AnyView(BaseballScienceView())),
                Exercise(id: "cricket", name: "Cricket", icon: "🏏", view: AnyView(CricketScienceView())),
                Exercise(id: "rugby", name: "Rugby", icon: "🏉", view: AnyView(RugbyScienceView())),
                Exercise(id: "badminton", name: "Badminton", icon: "🏸", view: AnyView(BadmintonScienceView())),
                Exercise(id: "squash", name: "Squash", icon: "🎾", view: AnyView(SquashScienceView())),
                Exercise(id: "racquetball", name: "Racquetball", icon: "🎾", view: AnyView(RacquetballScienceView())),
            ]
        case .mindBody:
            return [
                Exercise(id: "meditation", name: "Meditation", icon: "🧘", view: AnyView(Text("Meditation View"))),
                Exercise(id: "breathing", name: "Breathing", icon: "💨", view: AnyView(BreathingView())),
                Exercise(id: "tai_chi", name: "Tai Chi", icon: "⚛️", view: AnyView(Text("Tai Chi View"))),
                Exercise(id: "qigong", name: "Qigong", icon: "⚛️", view: AnyView(Text("Qigong View"))),
                Exercise(id: "pilates", name: "Pilates", icon: "🧘‍♀️", view: AnyView(Text("Pilates View"))),
                Exercise(id: "yoga", name: "Yoga", icon: "🧘", view: AnyView(Text("Yoga View"))),
            ]
        }
    }
}

struct Exercise: Identifiable {
    let id: String
    let name: String
    let icon: String
    let view: AnyView
    
    var destinationView: AnyView {
        view
    }
}

#Preview {
    ExerciseLibraryView()
}
