import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface TableCount { table: string; count: number }

import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default async function AdminPage() {
  // Auth guard is handled by layout.tsx – but double-check for defence in depth
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service-role client for privileged queries
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Stat queries in parallel
  const [
    { count: totalUsers },
    { count: totalRecords },
    { count: totalScans },
    { data: recentUsers },
  ] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('health_records').select('id', { count: 'exact', head: true }),
    admin.from('product_scans').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id, email, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  // Active users in last 7 days (users with health records in past 7d)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: activeUsers } = await admin
    .from('health_records')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  // System health: record counts for key tables
  const keyTables = ['health_records', 'workout_records', 'meals', 'product_scans', 'users']
  const tableCounts: TableCount[] = await Promise.all(
    keyTables.map(async (table) => {
      const { count } = await admin.from(table).select('id', { count: 'exact', head: true })
      return { table, count: count ?? 0 }
    })
  )

  const stats = [
    { label: 'Total Users', value: totalUsers ?? 0 },
    { label: 'Active (7d)', value: activeUsers ?? 0 },
    { label: 'Health Records', value: totalRecords ?? 0 },
    { label: 'Food Scans', value: totalScans ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <Breadcrumbs items={[{label:'Dashboard',href:'/dashboard'},{label:'Admin'}]} />
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">System overview and user management</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-3xl font-bold text-text-primary">{value.toLocaleString()}</p>
            <p className="text-sm text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent sign-ups */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Recent Sign-ups (last 20)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(recentUsers ?? []).map((u: { id: string; email: string; created_at: string }) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors">
                  <td className="px-4 py-2.5 text-text-primary font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-2.5 text-text-secondary text-xs">
                    {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System health */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">System Health</h2>
        </div>
        <div className="divide-y divide-border">
          {tableCounts.map(({ table, count }) => (
            <div key={table} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-secondary font-mono">{table}</span>
              <span className="text-sm font-semibold text-text-primary tabular-nums">{count.toLocaleString()} rows</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
