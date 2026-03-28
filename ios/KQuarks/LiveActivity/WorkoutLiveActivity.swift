import WidgetKit
import SwiftUI
import ActivityKit

#if !targetEnvironment(macCatalyst)
@available(iOS 16.1, *)
struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            WorkoutLiveActivityView(context: context)
                .padding(.vertical, 8)
                .background(Color(UIColor.systemBackground))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    WorkoutCompactLeadingView(context: context)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    WorkoutCompactTrailingView(context: context)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    WorkoutLiveActivityView(context: context)
                }
            } compactLeading: {
                WorkoutCompactLeadingView(context: context)
            } compactTrailing: {
                WorkoutCompactTrailingView(context: context)
            } minimal: {
                Image(systemName: "figure.run")
                    .foregroundStyle(.green)
            }
        }
    }
}
#endif
