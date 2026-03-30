import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReferenceDataManager } from '@/components/admin/reference-data-manager'
import { CustomFieldsEditor } from '@/components/admin/custom-fields-editor'
import { createCategory, updateCategory, deleteCategory } from '@/actions/admin'
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

  const cats = categories ?? []

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Equipment Categories</h1>
        <p className="text-sm text-gray-500">Manage how equipment is grouped and define custom fields per category</p>
      </div>
      <ReferenceDataManager
        items={cats}
        actions={{ create: createCategory, update: updateCategory, delete: deleteCategory }}
        emptyLabel="No categories yet"
      />

      {cats.length > 0 && (
        <div className="space-y-4 border-t pt-5">
          <h2 className="text-sm font-semibold text-gray-700">Custom Fields</h2>
          <p className="text-xs text-gray-400">Add category-specific fields that appear when creating or editing items of that category.</p>
          {cats.map(cat => (
            <div key={cat.id} className="bg-white rounded-lg border p-4">
              <CustomFieldsEditor
                categoryId={cat.id}
                categoryName={cat.name}
                initialFields={cat.custom_fields ?? []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
