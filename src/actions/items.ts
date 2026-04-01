'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', supabase: null }
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') return { error: 'Admin required', supabase: null }
  return { error: null, supabase: supabase as any }
}

export async function createItem(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  // Collect custom attributes from form fields prefixed with "custom_"
  const customAttributes: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('custom_') && typeof value === 'string' && value.trim()) {
      customAttributes[key.slice(7)] = value.trim()
    }
  }

  const data = {
    name: (formData.get('name') as string).trim(),
    category_id: formData.get('category_id') as string,
    home_location_id: (formData.get('home_location_id') as string) || null,
    asset_tag: (formData.get('asset_tag') as string)?.trim() || null,
    serial_number: (formData.get('serial_number') as string)?.trim() || null,
    description: (formData.get('description') as string)?.trim() || null,
    purchase_date: (formData.get('purchase_date') as string) || null,
    purchase_cost: formData.get('purchase_cost') ? Number(formData.get('purchase_cost')) : null,
    expected_life_years: formData.get('expected_life_years') ? Number(formData.get('expected_life_years')) : null,
    notes: (formData.get('notes') as string)?.trim() || null,
    custom_attributes: customAttributes,
  }

  if (!data.name) return { error: 'Name is required' }
  if (!data.category_id) return { error: 'Category is required' }

  const quantity = Math.max(1, Math.min(100, Number(formData.get('quantity')) || 1))

  if (quantity === 1) {
    const { error } = await supabase.from('equipment_items').insert(data)
    if (error) return { error: error.message }
  } else {
    const items = Array.from({ length: quantity }, (_, i) => {
      const num = i + 1
      return {
        ...data,
        name: `${data.name} #${num}`,
        asset_tag: data.asset_tag ? `${data.asset_tag}-${String(num).padStart(2, '0')}` : null,
      }
    })
    const { error } = await supabase.from('equipment_items').insert(items)
    if (error) return { error: error.message }
  }

  revalidatePath('/inventory')
  revalidatePath('/admin/items')
  return { success: true }
}

export async function updateItem(id: string, formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const customAttributes: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('custom_') && typeof value === 'string' && value.trim()) {
      customAttributes[key.slice(7)] = value.trim()
    }
  }

  const data = {
    name: (formData.get('name') as string).trim(),
    category_id: formData.get('category_id') as string,
    home_location_id: (formData.get('home_location_id') as string) || null,
    asset_tag: (formData.get('asset_tag') as string)?.trim() || null,
    serial_number: (formData.get('serial_number') as string)?.trim() || null,
    description: (formData.get('description') as string)?.trim() || null,
    purchase_date: (formData.get('purchase_date') as string) || null,
    purchase_cost: formData.get('purchase_cost') ? Number(formData.get('purchase_cost')) : null,
    expected_life_years: formData.get('expected_life_years') ? Number(formData.get('expected_life_years')) : null,
    notes: (formData.get('notes') as string)?.trim() || null,
    custom_attributes: customAttributes,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('equipment_items').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)
  revalidatePath('/admin/items')
  return { success: true }
}

export async function retireItem(id: string) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from('equipment_items')
    .update({ status: 'retired', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/inventory')
  revalidatePath('/admin/items')
  return { success: true }
}


export async function markItemLostOrDamaged(id: string, status: 'lost' | 'damaged', reason: string) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  if (!reason.trim()) return { error: 'Please describe what happened' }

  // If the item is currently on loan, check it back in first
  const { data: openLoan } = await supabase
    .from('equipment_loans')
    .select('id')
    .eq('item_id', id)
    .is('checked_in_at', null)
    .limit(1)
    .single()

  if (openLoan) {
    const { data: { user } } = await (await createClient()).auth.getUser()
    await supabase
      .from('equipment_loans')
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: user?.id,
        return_notes: `Item marked as ${status}: ${reason.trim()}`,
      })
      .eq('id', openLoan.id)
  }

  const { error } = await supabase
    .from('equipment_items')
    .update({
      status,
      removal_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)
  revalidatePath('/admin/items')
  revalidatePath('/admin/reports')
  return { success: true }
}

export async function logCondition(formData: FormData) {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const itemId = formData.get('item_id') as string
  const condition = formData.get('condition') as string
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!itemId || !condition) return { error: 'Item and condition are required' }

  const { error } = await supabase.from('condition_logs').insert({
    item_id: itemId,
    assessed_by: user.id,
    condition,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath(`/inventory/${itemId}`)
  revalidatePath('/admin/reports')
  return { success: true }
}
