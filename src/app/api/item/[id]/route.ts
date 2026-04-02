import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient() as any

  const { data: item } = await supabase
    .from('equipment_items')
    .select('id, name, asset_tag, status, equipment_categories!equipment_items_category_id_fkey(name)')
    .eq('id', id)
    .single()

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get current loan if on_loan
  let holder: string | null = null
  let loanId: string | null = null
  if (item.status === 'on_loan') {
    const { data: loan } = await supabase
      .from('equipment_loans')
      .select('id, recipient_name')
      .eq('item_id', id)
      .is('checked_in_at', null)
      .limit(1)
      .single()
    holder = loan?.recipient_name ?? null
    loanId = loan?.id ?? null
  }

  return NextResponse.json({
    id: item.id,
    name: item.name,
    asset_tag: item.asset_tag,
    status: item.status,
    category: item.equipment_categories?.name ?? null,
    holder,
    loanId,
  })
}
