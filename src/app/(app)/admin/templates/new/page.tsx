import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NewTemplateForm } from './new-template-form'

export default async function NewTemplatePage() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('id, name')
    .order('name')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/templates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Templates
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Kit Template</h1>
      </div>
      <NewTemplateForm categories={categories ?? []} />
    </div>
  )
}
