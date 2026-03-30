import { createClient } from '@/lib/supabase/server'

export async function getItems() {
  const supabase = await createClient()

  const [itemsRes, loansRes, conditionsRes] = await Promise.all([
    supabase
      .from('equipment_items')
      .select(`
        id, name, asset_tag, status, notes, purchase_date, expected_life_years, custom_attributes,
        equipment_categories(id, name),
        locations(id, name)
      `)
      .neq('status', 'retired')
      .order('name'),
    supabase
      .from('equipment_loans')
      .select('item_id, recipient_name, expected_return_date, checked_out_at')
      .is('checked_in_at', null),
    supabase
      .from('condition_logs')
      .select('item_id, condition, assessed_at')
      .order('assessed_at', { ascending: false }),
  ])

  const items = (itemsRes.data ?? []) as Array<{
    id: string
    name: string
    asset_tag: string | null
    status: string
    notes: string | null
    purchase_date: string | null
    expected_life_years: number | null
    custom_attributes: Record<string, string>
    equipment_categories: { id: string; name: string } | null
    locations: { id: string; name: string } | null
  }>
  const openLoans = (loansRes.data ?? []) as Array<{
    item_id: string
    recipient_name: string | null
    expected_return_date: string | null
    checked_out_at: string
  }>
  const conditions = (conditionsRes.data ?? []) as Array<{
    item_id: string
    condition: string
    assessed_at: string
  }>

  // Latest condition per item (conditions are already sorted desc)
  const latestCondition = new Map<string, string>()
  for (const c of conditions) {
    if (!latestCondition.has(c.item_id)) latestCondition.set(c.item_id, c.condition)
  }

  // Index open loans by item_id
  const loanByItem = new Map<string, (typeof openLoans)[0]>()
  for (const l of openLoans) loanByItem.set(l.item_id, l)

  return items.map(item => ({
    ...item,
    currentLoan: loanByItem.get(item.id) ?? null,
    currentCondition: latestCondition.get(item.id) ?? null,
  }))
}

export type ItemWithDetails = Awaited<ReturnType<typeof getItems>>[0]

export async function getItemById(id: string) {
  const supabase = await createClient()

  const [itemRes, loansRes, conditionsRes] = await Promise.all([
    supabase
      .from('equipment_items')
      .select(`
        *,
        equipment_categories(id, name),
        locations(id, name)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('equipment_loans')
      .select(`
        id, checked_out_at, checked_in_at, expected_return_date, purpose,
        location_while_out, return_notes, recipient_name,
        profiles!checked_out_by(full_name)
      `)
      .eq('item_id', id)
      .order('checked_out_at', { ascending: false })
      .limit(20),
    supabase
      .from('condition_logs')
      .select(`
        id, condition, assessed_at, notes, photo_url,
        profiles!assessed_by(full_name)
      `)
      .eq('item_id', id)
      .order('assessed_at', { ascending: false })
      .limit(20),
  ])

  const item = itemRes.data as any
  if (!item) return null

  const loans = (loansRes.data ?? []) as any[]
  const conditionHistory = (conditionsRes.data ?? []) as any[]

  return {
    ...item,
    loans,
    conditionHistory,
    currentCondition: conditionHistory[0]?.condition ?? null,
    currentLoan: loans.find((l: any) => !l.checked_in_at) ?? null,
  }
}

export type ItemDetail = Awaited<ReturnType<typeof getItemById>>
