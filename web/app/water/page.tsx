import { redirect } from 'next/navigation'

// /water is replaced by the enhanced /hydration page
export default function WaterPage() {
  redirect('/hydration')
}
