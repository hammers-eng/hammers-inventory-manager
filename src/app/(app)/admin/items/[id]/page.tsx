import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ItemForm from '@/components/admin/item-form'
import RetireButton from './retire-button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const [itemRes, categoriesRes, locationsRes] = await Promise.all([
    (supabase as any).from('equipment_items').select('*').eq('id', id).single(),
    supabase.from('equipment_categories').select('id, name').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  if (!itemRes.data) notFound()

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Items
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit item</h1>
      </div>
      <ItemForm
        categories={categoriesRes.data ?? []}
        locations={locationsRes.data ?? []}
        item={itemRes.data as any}
      />
      {itemRes.data.status !== 'retired' && (
        <div className="border-t pt-4">
          <RetireButton itemId={id} itemName={itemRes.data.name} />
        </div>
      )}
    </div>
  )
}
