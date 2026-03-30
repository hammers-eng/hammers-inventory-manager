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
  }

  if (!data.name) return { error: 'Name is required' }
  if (!data.category_id) return { error: 'Category is required' }

  const { error } = await supabase.from('equipment_items').insert(data)
  if (error) return { error: error.message }

  revalidatePath('/inventory')
  revalidatePath('/admin/items')
  return { success: true }
}

export async function updateItem(id: string, formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

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

export async function createPlayer(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const data = {
    full_name: (formData.get('full_name') as string).trim(),
    jersey_number: formData.get('jersey_number') ? Number(formData.get('jersey_number')) : null,
    position: (formData.get('position') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
  }

  if (!data.full_name) return { error: 'Name is required' }

  const { error } = await supabase.from('players').insert(data)
  if (error) return { error: error.message }

  revalidatePath('/admin/players')
  return { success: true }
}

export async function updatePlayer(id: string, formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const data = {
    full_name: (formData.get('full_name') as string).trim(),
    jersey_number: formData.get('jersey_number') ? Number(formData.get('jersey_number')) : null,
    position: (formData.get('position') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
    is_active: formData.get('is_active') === 'true',
  }

  const { error } = await supabase.from('players').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/players')
  return { success: true }
}
