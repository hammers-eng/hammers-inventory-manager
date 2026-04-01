import { getItems } from '@/lib/queries/items'
import { createClient } from '@/lib/supabase/server'
import InventoryClient from './inventory-client'

export default async function InventoryPage() {
  const supabase = await createClient()

  const [items, categoriesRes, locationsRes] = await Promise.all([
    getItems(),
    supabase.from('equipment_categories').select('id, name').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  return (
    <InventoryClient
      items={items}
      categories={categoriesRes.data ?? []}
      locations={(locationsRes.data ?? []) as { id: string; name: string }[]}
    />
  )
}
