import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FavoritesClient } from './favorites-client'

const PAGE_SIZE = 20

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: favorites } = await supabase
    .from('food_favorites')
    .select('id, barcode, product_name, brand, health_score, nova_group, thumbnail_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  const hasMore = (favorites?.length ?? 0) === PAGE_SIZE

  return <FavoritesClient favorites={favorites ?? []} hasMore={hasMore} />
}
