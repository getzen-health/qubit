import { createClient } from "@/lib/supabase/server"
import { SupplementsClient } from "./supplements-client"
import { redirect } from "next/navigation"

export const metadata = { title: "Supplements" }

import { SupplementsClient } from "./supplements-client"

export default async function SupplementsPage() {
  // Fetch today's taken supplements for quick log UI
  let takenNames: string[] = []
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/supplement_logs?select=name&date=eq.${new Date().toISOString().split('T')[0]}`)
    if (res.ok) {
      const logs = await res.json()
      takenNames = logs.map((l: any) => l.name)
    }
  } catch {}
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Supplements</h1>
      <SupplementsClient initialTaken={takenNames} />
    </main>
  )
}

