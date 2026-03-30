import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReferenceDataManager } from '@/components/admin/reference-data-manager'
import { createLocation, updateLocation, deleteLocation } from '@/actions/admin'

export default async function LocationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, description')
    .order('name')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Locations</h1>
        <p className="text-sm text-gray-500">Manage where equipment is stored</p>
      </div>
      <ReferenceDataManager
        items={locations ?? []}
        actions={{ create: createLocation, update: updateLocation, delete: deleteLocation }}
        emptyLabel="No locations yet"
      />
    </div>
  )
}
