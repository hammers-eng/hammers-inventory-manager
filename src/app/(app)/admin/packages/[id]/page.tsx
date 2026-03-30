import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/inventory/status-badge'
import { PackageForm } from '@/components/packages/package-form'
import { PackageItemsManager } from '@/components/packages/package-items-manager'
import { PackageCheckout } from '@/components/packages/package-checkout'

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  // Fetch the package
  const { data: pkg } = await (supabase as any)
    .from('equipment_packages')
    .select('*')
    .eq('id', id)
    .single()

  if (!pkg) notFound()

  // Fetch items in this package with their current loan status
  const { data: packageItems } = await (supabase as any)
    .from('package_items')
    .select('id, item_id, added_at, equipment_items(id, name, asset_tag, status, category_id, equipment_categories(name))')
    .eq('package_id', id)
    .order('added_at') as { data: Array<{
      id: string
      item_id: string
      added_at: string
      equipment_items: {
        id: string
        name: string
        asset_tag: string | null
        status: import('@/lib/supabase/database.types').ItemStatus
        category_id: string
        equipment_categories: { name: string } | null
      }
    }> | null }

  const items = packageItems ?? []

  // Fetch open loans for items in this package
  const itemIds = items.map(pi => pi.item_id)
  let openLoans: Array<{ item_id: string; recipient_name: string; expected_return_date: string | null; checked_out_at: string }> = []
  if (itemIds.length > 0) {
    const { data } = await (supabase as any)
      .from('equipment_loans')
      .select('item_id, recipient_name, expected_return_date, checked_out_at')
      .in('item_id', itemIds)
      .is('checked_in_at', null)
    openLoans = data ?? []
  }

  const loanMap = new Map(openLoans.map(l => [l.item_id, l]))
  const onLoanCount = items.filter(pi => pi.equipment_items.status === 'on_loan').length
  const availableCount = items.filter(pi => pi.equipment_items.status === 'available').length

  // Fetch all available items NOT in any package (for adding)
  const { data: availableItems } = await (supabase as any)
    .from('equipment_items')
    .select('id, name, asset_tag, equipment_categories(name)')
    .eq('status', 'available')
    .order('name') as { data: Array<{
      id: string
      name: string
      asset_tag: string | null
      equipment_categories: { name: string } | null
    }> | null }

  // Filter out items already in a package
  const { data: allPackageItemIds } = await (supabase as any)
    .from('package_items')
    .select('item_id')
  const usedItemIds = new Set((allPackageItemIds ?? []).map((pi: any) => pi.item_id))
  const addableItems = (availableItems ?? []).filter(item => !usedItemIds.has(item.id))

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/packages" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Packages
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{pkg.name}</h1>
        {pkg.description && <p className="text-sm text-gray-500">{pkg.description}</p>}
        <div className="flex gap-3 mt-1 text-xs text-gray-400">
          {pkg.assigned_to && <span>Assigned to: {pkg.assigned_to}</span>}
          {pkg.season && <span>Season: {pkg.season}</span>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
            <div className="text-xs text-gray-500">Total items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{onLoanCount}</div>
            <div className="text-xs text-gray-500">On loan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <div className="text-xs text-gray-500">Available</div>
          </CardContent>
        </Card>
      </div>

      {/* Check out all available items */}
      {availableCount > 0 && (
        <PackageCheckout
          packageId={id}
          packageName={pkg.name}
          assignedTo={pkg.assigned_to}
          availableCount={availableCount}
        />
      )}

      {/* Items in package */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No items in this package yet</p>
          ) : (
            <div className="space-y-2">
              {items.map(pi => {
                const item = pi.equipment_items
                const loan = loanMap.get(pi.item_id)
                const category = item.equipment_categories
                return (
                  <div key={pi.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/inventory/${item.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                          {item.name}
                        </Link>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {category?.name}
                        {item.asset_tag && ` · ${item.asset_tag}`}
                      </div>
                      {loan && (
                        <div className="text-xs text-blue-600 mt-0.5">
                          Out to {loan.recipient_name}
                          {loan.expected_return_date && ` · Due ${new Date(loan.expected_return_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                    <PackageItemsManager
                      mode="remove"
                      packageId={id}
                      packageItemId={pi.id}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add items */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700">Add items</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <PackageItemsManager
            mode="add"
            packageId={id}
            availableItems={addableItems}
          />
        </CardContent>
      </Card>

      {/* Edit package details */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Edit package</h2>
        <PackageForm pkg={pkg} />
      </div>
    </div>
  )
}
