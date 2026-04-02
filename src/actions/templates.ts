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

export async function createTemplate(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) return { error: 'Name is required' }

  const { data, error } = await supabase
    .from('kit_templates')
    .insert({ name, description })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'A template with that name already exists' }
    return { error: error.message }
  }

  revalidatePath('/admin/templates')
  return { success: true, id: data.id }
}

export async function updateTemplate(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!id || !name) return { error: 'ID and name are required' }

  const { error } = await supabase
    .from('kit_templates')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/templates')
  revalidatePath(`/admin/templates/${id}`)
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('kit_templates').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/templates')
  return { success: true }
}

export async function addTemplateLine(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const templateId = formData.get('template_id') as string
  const categoryId = formData.get('category_id') as string
  const quantity = Math.max(1, Number(formData.get('quantity')) || 1)
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!templateId || !categoryId) return { error: 'Template and category are required' }

  const { error } = await supabase
    .from('kit_template_lines')
    .insert({ template_id: templateId, category_id: categoryId, quantity, notes })

  if (error) {
    if (error.code === '23505') return { error: 'This category is already in the template' }
    return { error: error.message }
  }

  revalidatePath(`/admin/templates/${templateId}`)
  return { success: true }
}

export async function removeTemplateLine(id: string, templateId: string) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('kit_template_lines').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/admin/templates/${templateId}`)
  return { success: true }
}

export async function createPackageFromTemplate(formData: FormData) {
  const { error: authError, supabase } = await assertAdmin()
  if (authError) return { error: authError }

  const templateId = formData.get('template_id') as string
  const packageName = (formData.get('package_name') as string)?.trim()
  const season = (formData.get('season') as string)?.trim() || null
  const assignedTo = (formData.get('assigned_to') as string)?.trim() || null

  if (!templateId || !packageName) return { error: 'Template and package name are required' }

  // Get template lines
  const { data: lines } = await supabase
    .from('kit_template_lines')
    .select('category_id, quantity')
    .eq('template_id', templateId)

  if (!lines || lines.length === 0) return { error: 'Template has no items defined' }

  // Get available items grouped by category
  const { data: availableItems } = await supabase
    .from('equipment_items')
    .select('id, category_id')
    .eq('status', 'available')
    .order('name')

  if (!availableItems) return { error: 'Failed to fetch available items' }

  // Build item map by category
  const byCategory = new Map<string, string[]>()
  for (const item of availableItems) {
    const list = byCategory.get(item.category_id) ?? []
    list.push(item.id)
    byCategory.set(item.category_id, list)
  }

  // Also need to exclude items already in packages
  const { data: existingPackageItems } = await supabase
    .from('package_items')
    .select('item_id')
  const inPackage = new Set((existingPackageItems ?? []).map((pi: any) => pi.item_id))

  // Pick items for each line
  const selectedItemIds: string[] = []
  const shortages: string[] = []

  // Get category names for error messages
  const categoryIds = lines.map((l: any) => l.category_id)
  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .in('id', categoryIds)
  const categoryNames = new Map((categories ?? []).map((c: any) => [c.id, c.name]))

  for (const line of lines) {
    const available = (byCategory.get(line.category_id) ?? [])
      .filter((id: string) => !inPackage.has(id) && !selectedItemIds.includes(id))
    const needed = line.quantity
    const catName = categoryNames.get(line.category_id) ?? 'Unknown'

    if (available.length < needed) {
      shortages.push(`${catName}: need ${needed}, only ${available.length} available`)
    }

    selectedItemIds.push(...available.slice(0, needed))
  }

  if (shortages.length > 0) {
    return { error: `Not enough items:\n${shortages.join('\n')}` }
  }

  // Create the package
  const { data: pkg, error: pkgError } = await supabase
    .from('equipment_packages')
    .insert({ name: packageName, description: `Created from template`, season, assigned_to: assignedTo })
    .select('id')
    .single()

  if (pkgError) {
    if (pkgError.code === '23505') return { error: 'A package with that name already exists' }
    return { error: pkgError.message }
  }

  // Add items to the package
  const packageItems = selectedItemIds.map((itemId: string) => ({
    package_id: pkg.id,
    item_id: itemId,
  }))

  const { error: itemsError } = await supabase
    .from('package_items')
    .insert(packageItems)

  if (itemsError) return { error: itemsError.message }

  revalidatePath('/admin/packages')
  revalidatePath(`/admin/packages/${pkg.id}`)
  return { success: true, packageId: pkg.id }
}
