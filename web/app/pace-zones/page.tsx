import { createClient } from '@/lib/supabase/server'

export default async function PaceZonesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Please log in</div>
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Running Pace Zones</h1>
      <p className="text-muted-foreground">Connect your Apple Health data to see your pace zone analysis.</p>
    </div>
  )
}
