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

// ── Categories ──────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase.from('equipment_categories').insert({ name, description })
  if (error) return { error: error.code === '23505' ? 'A category with that name already exists' : error.message }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase.from('equipment_categories').update({ name, description }).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'A category with that name already exists' : error.message }

  revalidatePath('/admin/categories')
  revalidatePath('/inventory')
  return { success: true }
}

export async function updateCategoryCustomFields(id: string, customFields: Array<{ name: string; type: string; options?: string[] }>) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from('equipment_categories')
    .update({ custom_fields: customFields })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  revalidatePath('/inventory')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase.from('equipment_categories').delete().eq('id', id)
  if (error) return { error: error.code === '23503' ? 'Cannot delete: items are using this category' : error.message }

  revalidatePath('/admin/categories')
  return { success: true }
}

// ── Locations ───────────────────────────────────────────────

export async function createLocation(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase.from('locations').insert({ name, description })
  if (error) return { error: error.code === '23505' ? 'A location with that name already exists' : error.message }

  revalidatePath('/admin/locations')
  return { success: true }
}

export async function updateLocation(id: string, formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase.from('locations').update({ name, description }).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'A location with that name already exists' : error.message }

  revalidatePath('/admin/locations')
  revalidatePath('/inventory')
  return { success: true }
}

export async function deleteLocation(id: string) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) return { error: error.code === '23503' ? 'Cannot delete: items are using this location' : error.message }

  revalidatePath('/admin/locations')
  return { success: true }
}
