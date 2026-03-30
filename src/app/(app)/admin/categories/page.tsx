import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CategoryManager } from '@/components/admin/category-manager'
import type { CustomFieldDef } from '@/lib/supabase/database.types'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const { data: categories } = await (supabase as any)
    .from('equipment_categories')
    .select('id, name, description, custom_fields')
    .order('name') as { data: Array<{ id: string; name: string; description: string | null; custom_fields: CustomFieldDef[] }> | null }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Equipment Categories</h1>
        <p className="text-sm text-gray-500">Manage categories and their custom fields</p>
      </div>
      <CategoryManager categories={categories ?? []} />
    </div>
  )
}
