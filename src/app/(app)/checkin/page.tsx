import { createClient } from '@/lib/supabase/server'
import CheckInForm from './checkin-form'

export default async function CheckInPage() {
  const supabase = await createClient()

  const { data: openLoans } = await supabase
    .from('equipment_loans')
    .select(`
      id, checked_out_at, expected_return_date, purpose, recipient_name,
      equipment_items(id, name, asset_tag)
    `)
    .is('checked_in_at', null)
    .order('checked_out_at', { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Check In</h1>
        <p className="text-sm text-gray-500">Return equipment to the club</p>
      </div>
      <CheckInForm openLoans={(openLoans ?? []) as any[]} />
    </div>
  )
}
