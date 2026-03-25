import { createServerClient } from "@/lib/supabase/server"
import { SupplementsClient } from "./supplements-client"
import { redirect } from "next/navigation"

export const metadata = { title: "Supplements" }

export default async function SupplementsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: supplements } = await supabase
    .from("supplements")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name")

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Supplements</h1>
      <SupplementsClient initialSupplements={supplements ?? []} userId={user.id} />
    </main>
  )
}
