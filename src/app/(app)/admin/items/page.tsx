import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/inventory/status-badge'
import { Button } from '@/components/ui/button'
import { Plus, ChevronRight } from 'lucide-react'
import { ItemStatus } from '@/lib/supabase/database.types'

export default async function AdminItemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const { data: items } = await (supabase as any)
    .from('equipment_items')
    .select('id, name, asset_tag, status, equipment_categories(name)')
    .order('name') as { data: Array<{ id: string; name: string; asset_tag: string | null; status: string; equipment_categories: { name: string } | null }> | null }

  const activeItems = (items ?? []).filter(i => i.status !== 'retired')
  const retiredItems = (items ?? []).filter(i => i.status === 'retired')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Equipment Items</h1>
          <p className="text-sm text-gray-500">{activeItems.length} active items</p>
        </div>
        <Link href="/admin/items/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={16} /> Add item
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {activeItems.map(item => (
          <Link key={item.id} href={`/admin/items/${item.id}`}>
            <div className="bg-white rounded-lg border p-3 flex items-center gap-3 hover:border-gray-300 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                  <StatusBadge status={item.status as ItemStatus} />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {(item.equipment_categories as any)?.name}
                  {item.asset_tag && ` · ${item.asset_tag}`}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {retiredItems.length > 0 && (
        <details className="group">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
            {retiredItems.length} retired items
          </summary>
          <div className="mt-2 space-y-2">
            {retiredItems.map(item => (
              <Link key={item.id} href={`/admin/items/${item.id}`}>
                <div className="bg-gray-50 rounded-lg border p-3 flex items-center gap-3 opacity-60 hover:opacity-80">
                  <div className="flex-1 text-sm text-gray-600">{item.name}</div>
                  <StatusBadge status="retired" />
                </div>
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
