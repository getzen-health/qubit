import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ExportPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">Export Your Data</h1>
      <p className="text-muted-foreground mb-8">Download your health data in CSV or JSON format.</p>
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-5 space-y-3">
          <p className="font-semibold">Date Range</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a href="/api/export?format=csv" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            📄 Export CSV
          </a>
          <a href="/api/export?format=json" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            📦 Export JSON
          </a>
        </div>
        <p className="text-xs text-muted-foreground text-center">Maximum 10,000 records per export. Large exports are paginated.</p>
      </div>
    </div>
  )
}
