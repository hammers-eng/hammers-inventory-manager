'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated', supabase: null as any, user: null as any }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required', supabase: null as any, user: null as any }

  return { error: null, supabase, user }
}

export async function createPackage(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const season = (formData.get('season') as string)?.trim() || null
  const assignedTo = (formData.get('assigned_to') as string)?.trim() || null

  if (!name) return { error: 'Name is required' }

  const { data, error } = await supabase
    .from('equipment_packages')
    .insert({ name, description, season, assigned_to: assignedTo })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'A package with that name already exists' }
    return { error: error.message }
  }

  revalidatePath('/admin/packages')
  return { success: true, id: data.id }
}

export async function updatePackage(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const season = (formData.get('season') as string)?.trim() || null
  const assignedTo = (formData.get('assigned_to') as string)?.trim() || null

  if (!id || !name) return { error: 'ID and name are required' }

  const { error } = await supabase
    .from('equipment_packages')
    .update({ name, description, season, assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'A package with that name already exists' }
    return { error: error.message }
  }

  revalidatePath('/admin/packages')
  revalidatePath(`/admin/packages/${id}`)
  return { success: true }
}

export async function deletePackage(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const id = formData.get('id') as string
  if (!id) return { error: 'ID is required' }

  const { error } = await supabase.from('equipment_packages').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/packages')
  return { success: true }
}

export async function addItemToPackage(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const packageId = formData.get('package_id') as string
  const itemId = formData.get('item_id') as string

  if (!packageId || !itemId) return { error: 'Package and item are required' }

  const { error } = await supabase
    .from('package_items')
    .insert({ package_id: packageId, item_id: itemId })

  if (error) {
    if (error.code === '23505') return { error: 'This item is already in a package' }
    return { error: error.message }
  }

  revalidatePath(`/admin/packages/${packageId}`)
  return { success: true }
}

export async function removeItemFromPackage(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const packageItemId = formData.get('package_item_id') as string
  const packageId = formData.get('package_id') as string

  if (!packageItemId) return { error: 'Package item ID is required' }

  const { error } = await supabase
    .from('package_items')
    .delete()
    .eq('id', packageItemId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/packages/${packageId}`)
  return { success: true }
}

export async function checkOutPackage(formData: FormData) {
  const { error: authError, supabase, user } = await assertAdmin()
  if (authError) return { error: authError }

  const packageId = formData.get('package_id') as string
  const recipientName = (formData.get('recipient_name') as string)?.trim()
  const expectedReturnDate = (formData.get('expected_return_date') as string) || null
  const purpose = (formData.get('purpose') as string)?.trim() || null

  if (!packageId) return { error: 'Package is required' }
  if (!recipientName) return { error: 'Recipient is required' }

  // Get all items in this package
  const { data: packageItems } = await supabase
    .from('package_items')
    .select('item_id, equipment_items(id, name, status)')
    .eq('package_id', packageId)

  if (!packageItems || packageItems.length === 0) {
    return { error: 'Package has no items' }
  }

  // Check all items are available
  const unavailable = packageItems.filter((pi: any) => pi.equipment_items?.status !== 'available')
  if (unavailable.length > 0) {
    const names = unavailable.map((pi: any) => pi.equipment_items?.name).join(', ')
    return { error: `These items are not available: ${names}` }
  }

  // Create loans for all items
  const loans = packageItems.map((pi: any) => ({
    item_id: pi.item_id,
    recipient_name: recipientName,
    checked_out_by: user.id,
    expected_return_date: expectedReturnDate,
    purpose: purpose ?? `Package: ${packageId}`,
  }))

  const { error } = await supabase.from('equipment_loans').insert(loans)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/inventory')
  revalidatePath(`/admin/packages/${packageId}`)
  return { success: true }
}
