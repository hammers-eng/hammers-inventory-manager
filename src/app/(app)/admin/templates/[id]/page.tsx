import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TemplateLineManager } from './template-line-manager'
import { CreateFromTemplate } from './create-from-template'
import { TemplateActions } from '../template-actions'

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: template } = await supabase
    .from('kit_templates')
    .select('id, name, description')
    .eq('id', id)
    .single()

  if (!template) notFound()

  const { data: lines } = await supabase
    .from('kit_template_lines')
    .select(`
      id, quantity, notes,
      equipment_categories!kit_template_lines_category_id_fkey(id, name)
    `)
    .eq('template_id', id)
    .order('quantity', { ascending: false })

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .order('name')

  // Count available items per category for the "create package" form
  const { data: availableItems } = await supabase
    .from('equipment_items')
    .select('category_id')
    .eq('status', 'available')

  const availableByCategory = new Map<string, number>()
  for (const item of (availableItems ?? [])) {
    availableByCategory.set(item.category_id, (availableByCategory.get(item.category_id) ?? 0) + 1)
  }

  const usedCategoryIds = (lines ?? []).map((l: any) => l.equipment_categories?.id).filter(Boolean)
  const totalItems = (lines ?? []).reduce((sum: number, l: any) => sum + l.quantity, 0)

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/templates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Templates
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
            {template.description && <p className="text-sm text-gray-500">{template.description}</p>}
          </div>
          <TemplateActions templateId={id} templateName={template.name} />
        </div>
      </div>

      {/* Kit contents */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
            Kit Contents
            <span className="text-xs font-normal text-gray-400">{totalItems} items total</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {(!lines || lines.length === 0) ? (
            <p className="text-sm text-gray-400 py-4 text-center">No items defined yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {lines.map((line: any) => {
                const catName = line.equipment_categories?.name ?? 'Unknown'
                const catId = line.equipment_categories?.id
                const available = catId ? (availableByCategory.get(catId) ?? 0) : 0
                const enough = available >= line.quantity
                return (
                  <TemplateLineManager key={line.id} line={line} catName={catName} available={available} enough={enough} templateId={id} />
                )
              })}
            </div>
          )}

          {/* Add line form */}
          <AddLineForm
            templateId={id}
            categories={(categories ?? []).filter((c: any) => !usedCategoryIds.includes(c.id))}
          />
        </CardContent>
      </Card>

      {/* Create package from template */}
      {lines && lines.length > 0 && (
        <CreateFromTemplate templateId={id} templateName={template.name} />
      )}
    </div>
  )
}

function AddLineForm({ templateId, categories }: { templateId: string; categories: { id: string; name: string }[] }) {
  if (categories.length === 0) return null
  return (
    <form action={async (formData: FormData) => {
      'use server'
      const { addTemplateLine } = await import('@/actions/templates')
      await addTemplateLine(formData)
    }}>
      <input type="hidden" name="template_id" value={templateId} />
      <div className="flex items-center gap-2 border-t pt-3">
        <input
          type="number"
          name="quantity"
          min={1}
          defaultValue={1}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        <span className="text-sm text-gray-400">×</span>
        <select
          name="category_id"
          required
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Add
        </button>
      </div>
    </form>
  )
}
