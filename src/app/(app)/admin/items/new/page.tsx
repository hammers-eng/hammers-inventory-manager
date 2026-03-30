import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ItemForm from '@/components/admin/item-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewItemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const [categoriesRes, locationsRes] = await Promise.all([
    (supabase as any).from('equipment_categories').select('id, name, custom_fields').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Items
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add item</h1>
      </div>
      <ItemForm
        categories={categoriesRes.data ?? []}
        locations={locationsRes.data ?? []}
      />
    </div>
  )
}
