import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BulkCheckInClient } from './bulk-checkin-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function BulkCheckInPage() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: loans } = await supabase
    .from('equipment_loans')
    .select(`
      id, recipient_name, checked_out_at, expected_return_date, purpose,
      equipment_items!equipment_loans_item_id_fkey(id, name, asset_tag, equipment_categories(name))
    `)
    .is('checked_in_at', null)
    .order('recipient_name')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Bulk Check-In</h1>
        <p className="text-sm text-gray-500">
          {(loans ?? []).length} item{(loans ?? []).length !== 1 ? 's' : ''} currently on loan
        </p>
      </div>

      <BulkCheckInClient loans={loans ?? []} />
    </div>
  )
}
