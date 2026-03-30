import { createClient } from '@/lib/supabase/server'
import CheckOutForm from './checkout-form'

export default async function CheckOutPage() {
  const supabase = await createClient()

  const [itemsRes, coachesRes] = await Promise.all([
    supabase
      .from('equipment_items')
      .select('id, name, asset_tag, equipment_categories(name)')
      .eq('status', 'available')
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name'),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Check Out</h1>
        <p className="text-sm text-gray-500">Assign equipment to a coach or staff member</p>
      </div>
      <CheckOutForm
        availableItems={(itemsRes.data ?? []) as any[]}
        coaches={(coachesRes.data ?? []) as any[]}
      />
    </div>
  )
}
