import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PackageForm } from '@/components/packages/package-form'

export default async function NewPackagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/packages" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Packages
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Package</h1>
      </div>
      <PackageForm />
    </div>
  )
}
