import SwiftUI

/// Screen 4 of 5 — Optional profile details that personalise AI insights.
struct OnboardingProfileView: View {
    let onNext: () -> Void

    @AppStorage("userDisplayName") private var displayName = ""
    @AppStorage("userBirthYear") private var birthYear = 0
    @AppStorage("userBiologicalSex") private var biologicalSexRaw = ""

    @State private var nameInput = ""
    @State private var selectedBirthYear: Int = Calendar.current.component(.year, from: Date()) - 30
    @State private var selectedSex: BiologicalSex = .notSet
    @FocusState private var nameFieldFocused: Bool

    private let currentYear = Calendar.current.component(.year, from: Date())
    private var birthYears: [Int] { Array(stride(from: currentYear - 100, through: currentYear - 13, by: 1)).reversed() }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Spacer().frame(height: 48)

                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue, .cyan.opacity(0.25))

                Spacer().frame(height: 24)

                Text("Almost There")
                    .font(.title2.bold())

                Spacer().frame(height: 8)

                Text("These details help Claude personalise your health insights. Everything is optional and stored only on your device.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 36)

                // Form fields
                VStack(spacing: 0) {
                    // Name
                    HStack {
                        Text("Name")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .frame(width: 100, alignment: .leading)

                        TextField("What should we call you?", text: $nameInput)
                            .font(.subheadline)
                            .focused($nameFieldFocused)
                            .submitLabel(.done)
                            .onSubmit { nameFieldFocused = false }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)

                    Divider()
                        .padding(.leading, 116)

                    // Age / birth year
                    HStack {
                        Text("Birth year")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .frame(width: 100, alignment: .leading)

                        Picker("Birth year", selection: $selectedBirthYear) {
                            Text("Prefer not to say").tag(0)
                            ForEach(birthYears, id: \.self) { year in
                                Text(String(year)).tag(year)
                            }
                        }
                        .pickerStyle(.menu)
                        .font(.subheadline)

                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 4)

                    Divider()
                        .padding(.leading, 116)

                    // Biological sex
                    HStack {
                        Text("Sex")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .frame(width: 100, alignment: .leading)

                        Picker("Biological sex", selection: $selectedSex) {
                            ForEach(BiologicalSex.allCases, id: \.self) { sex in
                                Text(sex.label).tag(sex)
                            }
                        }
                        .pickerStyle(.menu)
                        .font(.subheadline)

                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 4)
                }
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(.horizontal, 24)

                Spacer().frame(height: 36)

                Button(action: saveAndContinue) {
                    Text("Continue")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .padding(.horizontal, 24)

                Button(action: onNext) {
                    Text("Skip")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 12)
                .padding(.bottom, 48)
            }
        }
        .onTapGesture { nameFieldFocused = false }
    }

    // MARK: - Private

    private func saveAndContinue() {
        let trimmed = nameInput.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { displayName = trimmed }
        if selectedBirthYear != 0 { birthYear = selectedBirthYear }
        biologicalSexRaw = selectedSex.rawValue
        onNext()
    }
}

// MARK: - BiologicalSex enum

private enum BiologicalSex: String, CaseIterable {
    case notSet = ""
    case female = "female"
    case male = "male"
    case other = "other"

    var label: String {
        switch self {
        case .notSet: return "Prefer not to say"
        case .female: return "Female"
        case .male: return "Male"
        case .other: return "Other"
        }
    }
}

#Preview {
    OnboardingProfileView(onNext: {})
}
