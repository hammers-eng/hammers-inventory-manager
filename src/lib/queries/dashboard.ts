import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [onLoanRes, availableRes, overdueRes, recentRes] = await Promise.all([
    supabase
      .from('equipment_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'on_loan'),
    supabase
      .from('equipment_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available'),
    supabase
      .from('equipment_loans')
      .select('*', { count: 'exact', head: true })
      .is('checked_in_at', null)
      .lt('expected_return_date', today),
    supabase
      .from('equipment_loans')
      .select(`
        id, checked_out_at, checked_in_at, purpose,
        equipment_items(name, asset_tag),
        players(full_name),
        profiles!checked_out_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const onLoan = onLoanRes.count ?? 0
  const available = availableRes.count ?? 0
  const total = onLoan + available
  const overdue = overdueRes.count ?? 0
  const recentActivity = recentRes.data ?? []

  return { onLoan, available, total, overdue, recentActivity }
}
