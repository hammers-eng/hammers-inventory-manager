import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { TemplateActions } from './template-actions'

export default async function TemplatesPage() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: templates } = await supabase
    .from('kit_templates')
    .select(`
      id, name, description, created_at,
      kit_template_lines(id, quantity, equipment_categories!kit_template_lines_category_id_fkey(name))
    `)
    .order('name')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kit Templates</h1>
            <p className="text-sm text-gray-500">Define reusable kit lists for seasonal packages</p>
          </div>
          <Link
            href="/admin/templates/new"
            className="text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 px-3 py-2 rounded-lg transition-colors"
          >
            New Template
          </Link>
        </div>
      </div>

      {(!templates || templates.length === 0) ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-gray-500">
            No templates yet. Create one to define standard kit lists.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t: any) => {
            const lines = t.kit_template_lines ?? []
            const totalItems = lines.reduce((sum: number, l: any) => sum + l.quantity, 0)
            return (
              <Link key={t.id} href={`/admin/templates/${t.id}`}>
                <Card className="hover:border-gray-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{t.name}</div>
                        {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                        <div className="text-xs text-gray-400 mt-1">
                          {lines.length === 0 ? 'No items defined' : (
                            lines.map((l: any) => `${l.quantity}× ${l.equipment_categories?.name}`).join(', ')
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{totalItems} items</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
