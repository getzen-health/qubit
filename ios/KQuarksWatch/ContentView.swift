import SwiftUI
import HealthKit

struct ContentView: View {
    @StateObject private var vm = WatchViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.green)
                        VStack(alignment: .leading) {
                            Text("\(vm.steps)")
                                .font(.title3.bold())
                            Text("Steps today")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        VStack(alignment: .leading) {
                            Text(vm.heartRate > 0 ? "\(vm.heartRate) bpm" : "--")
                                .font(.title3.bold())
                            Text("Heart Rate")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                        VStack(alignment: .leading) {
                            Text("\(vm.healthScore)")
                                .font(.title3.bold())
                            Text("Health Score")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                Section("Quick Add") {
                    Button { vm.logWater() } label: {
                        Label("Log Water", systemImage: "drop.fill")
                    }
                    Button { vm.logMood() } label: {
                        Label("Log Mood", systemImage: "face.smiling")
                    }
                }
            }
            .navigationTitle("GetZen")
            .onAppear { vm.fetchData() }
        }
    }
}
