'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function initiateTransfer(formData: FormData) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const loanId = formData.get('loan_id') as string
  const toProfileId = formData.get('to_profile_id') as string
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!loanId || !toProfileId) return { error: 'Loan and recipient are required' }
  if (toProfileId === user.id) return { error: 'Cannot transfer to yourself' }

  // Get the loan and verify it's active
  const { data: loan } = await supabase
    .from('equipment_loans')
    .select('id, item_id, recipient_name, checked_out_by, checked_in_at')
    .eq('id', loanId)
    .single()

  if (!loan) return { error: 'Loan not found' }
  if (loan.checked_in_at) return { error: 'This item has already been checked in' }

  // Verify the current user is the holder (by profile id or name match)
  const { data: myProfile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  if (loan.checked_out_by !== user.id && loan.recipient_name !== myProfile?.full_name) {
    return { error: 'You are not the current holder of this item' }
  }

  // Check no pending transfer already exists for this loan
  const { data: existing } = await supabase
    .from('equipment_transfers')
    .select('id')
    .eq('loan_id', loanId)
    .eq('status', 'pending')
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'A transfer is already pending for this item' }
  }

  const { error } = await supabase.from('equipment_transfers').insert({
    loan_id: loanId,
    item_id: loan.item_id,
    from_profile_id: user.id,
    to_profile_id: toProfileId,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/transfers')
  revalidatePath(`/inventory/${loan.item_id}`)
  return { success: true }
}

export async function respondToTransfer(formData: FormData) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const transferId = formData.get('transfer_id') as string
  const action = formData.get('action') as string // 'accept' or 'reject'

  if (!transferId || !action) return { error: 'Transfer ID and action are required' }

  if (action === 'accept') {
    // Use the RPC function for atomic acceptance
    const { error } = await supabase.rpc('complete_transfer', { p_transfer_id: transferId })
    if (error) return { error: error.message }
  } else if (action === 'reject') {
    const { error } = await supabase
      .from('equipment_transfers')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', transferId)

    if (error) return { error: error.message }
  } else {
    return { error: 'Invalid action' }
  }

  revalidatePath('/')
  revalidatePath('/transfers')
  revalidatePath('/inventory')
  return { success: true }
}

export async function cancelTransfer(formData: FormData) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const transferId = formData.get('transfer_id') as string
  if (!transferId) return { error: 'Transfer ID is required' }

  // Verify ownership
  const { data: transfer } = await supabase
    .from('equipment_transfers')
    .select('from_profile_id, status')
    .eq('id', transferId)
    .single()

  if (!transfer) return { error: 'Transfer not found' }
  if (transfer.status !== 'pending') return { error: 'Transfer is no longer pending' }
  if (transfer.from_profile_id !== user.id) return { error: 'You did not initiate this transfer' }

  const { error } = await supabase
    .from('equipment_transfers')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', transferId)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/transfers')
  return { success: true }
}
