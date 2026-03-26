import { createClient } from "@/lib/supabase/server"
import { SupplementsClient } from "./supplements-client"

export const metadata = { title: "Supplements" }

export default async function SupplementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: supplements } = await supabase
    .from('supplements')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Supplements</h1>
      <div className="mb-4 flex justify-end">
        <a href="/supplements/interactions" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-primary hover:bg-surface/80 text-sm font-medium transition">
          Check Interactions <span aria-hidden>→</span>
        </a>
      </div>
      <SupplementsClient initialSupplements={supplements ?? []} userId={user.id} />
    </main>
  )
}

