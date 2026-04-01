'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkOutItem(formData: FormData) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const itemId = formData.get('item_id') as string
  const recipientName = (formData.get('recipient_name') as string)?.trim()
  const expectedReturnDate = formData.get('expected_return_date') as string | null
  const purpose = formData.get('purpose') as string | null

  if (!itemId) return { error: 'Item is required' }
  if (!recipientName) return { error: 'Recipient is required' }

  // Verify item is available
  const { data: item } = await supabase
    .from('equipment_items')
    .select('status, name')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Item not found' }
  if (item.status !== 'available') return { error: `${item.name} is not available` }

  const { error } = await supabase.from('equipment_loans').insert({
    item_id: itemId,
    recipient_name: recipientName,
    checked_out_by: user.id,
    expected_return_date: expectedReturnDate || null,
    purpose: purpose?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
  return { success: true }
}

export async function checkInItem(formData: FormData) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const loanId = formData.get('loan_id') as string
  const returnNotes = formData.get('return_notes') as string | null
  const condition = formData.get('condition') as string | null
  const conditionNotes = formData.get('condition_notes') as string | null

  if (!loanId) return { error: 'Loan ID is required' }

  // Get the loan to find the item_id
  const { data: loan } = await supabase
    .from('equipment_loans')
    .select('item_id, checked_in_at')
    .eq('id', loanId)
    .single()

  if (!loan) return { error: 'Loan not found' }
  if (loan.checked_in_at) return { error: 'Already checked in' }

  // Check in the item
  const { error } = await supabase
    .from('equipment_loans')
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
      return_notes: returnNotes?.trim() || null,
    })
    .eq('id', loanId)

  if (error) return { error: error.message }

  // Log condition if provided
  if (condition) {
    await supabase.from('condition_logs').insert({
      item_id: loan.item_id,
      assessed_by: user.id,
      condition,
      notes: conditionNotes?.trim() || null,
    })
  }

  revalidatePath('/')
  revalidatePath('/inventory')
  revalidatePath('/checkin')
  revalidatePath(`/inventory/${loan.item_id}`)
  return { success: true }
}

export async function bulkCheckIn(loanIds: string[]) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!loanIds.length) return { error: 'No items selected' }

  const now = new Date().toISOString()
  let checked = 0
  let failed = 0

  for (const loanId of loanIds) {
    const { error } = await supabase
      .from('equipment_loans')
      .update({
        checked_in_at: now,
        checked_in_by: user.id,
        return_notes: 'Bulk check-in',
      })
      .eq('id', loanId)
      .is('checked_in_at', null)

    if (error) failed++
    else checked++
  }

  revalidatePath('/')
  revalidatePath('/inventory')
  revalidatePath('/checkin')
  return { success: true, checked, failed }
}
