import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StockTakeClient } from './stock-take-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function StockTakePage() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  // Get all locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .order('name')

  // Get all available items with their home location
  const { data: items } = await supabase
    .from('equipment_items')
    .select(`
      id, name, asset_tag, status, home_location_id,
      equipment_categories!equipment_items_category_id_fkey(name)
    `)
    .in('status', ['available', 'on_loan'])
    .order('name')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Stock Take</h1>
        <p className="text-sm text-gray-500">Select a location and check off items as you find them.</p>
      </div>

      <StockTakeClient locations={locations ?? []} items={items ?? []} />
    </div>
  )
}
