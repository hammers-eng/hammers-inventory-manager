import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, ArrowLeft, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: packages } = await (supabase as any)
    .from('equipment_packages')
    .select('*, package_items(id)')
    .order('name') as { data: Array<{
      id: string
      name: string
      description: string | null
      season: string | null
      assigned_to: string | null
      package_items: { id: string }[]
    }> | null }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Packages</h1>
            <p className="text-sm text-gray-500">{packages?.length ?? 0} packages</p>
          </div>
          <Link
            href="/admin/packages/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-gold-400 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} /> New package
          </Link>
        </div>
      </div>

      {(!packages || packages.length === 0) ? (
        <div className="text-sm text-gray-400 text-center py-12">No packages yet</div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <Link key={pkg.id} href={`/admin/packages/${pkg.id}`}>
              <Card className="hover:border-gray-300 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Package size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{pkg.name}</div>
                    <div className="text-sm text-gray-500">
                      {pkg.package_items.length} item{pkg.package_items.length !== 1 ? 's' : ''}
                      {pkg.assigned_to && ` · ${pkg.assigned_to}`}
                      {pkg.season && ` · ${pkg.season}`}
                    </div>
                    {pkg.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{pkg.description}</div>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-gray-300" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
