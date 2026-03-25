import { LogWorkoutClient } from "./log-workout-client"

export const metadata = { title: "Log Workout" }

export default function LogWorkoutPage() {
  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Log Workout</h1>
      <LogWorkoutClient />
    </main>
  )
}
