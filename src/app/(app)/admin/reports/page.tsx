import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConditionBadge } from '@/components/inventory/condition-badge'
import { ArrowLeft, AlertTriangle, Clock, ThumbsDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportButton } from '@/components/export-button'
import { exportInventory, exportLoans, exportConditionReport } from '@/actions/exports'

interface ReportItem {
  id: string
  name: string
  asset_tag: string | null
  purchase_date: string | null
  expected_life_years: number | null
  purchase_cost: number | null
  equipment_categories: { name: string } | null
  condition: string | null
  ageYears: number | null
  endOfLifeDate: Date | null
  yearsOverdue: number | null
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const [itemsRes, allItemsRes, conditionsRes] = await Promise.all([
    (supabase as any)
      .from('equipment_items')
      .select('id, name, asset_tag, purchase_date, expected_life_years, purchase_cost, equipment_categories(name)')
      .neq('status', 'retired')
      .order('name') as Promise<{ data: any[] | null }>,
    (supabase as any)
      .from('equipment_items')
      .select('id, purchase_date, purchase_cost, status, equipment_categories(name)')
      .order('purchase_date') as Promise<{ data: any[] | null }>,
    supabase
      .from('condition_logs')
      .select('item_id, condition, assessed_at')
      .order('assessed_at', { ascending: false }) as unknown as Promise<{ data: any[] | null }>,
  ])

  const items = (itemsRes.data ?? [])
  const allItems = (allItemsRes.data ?? []) as Array<{
    id: string; purchase_date: string | null; purchase_cost: number | null;
    status: string; equipment_categories: { name: string } | null
  }>
  const conditions = (conditionsRes.data ?? []) as Array<{ item_id: string; condition: string; assessed_at: string }>

  // Latest condition per item
  const latestCondition = new Map<string, string>()
  for (const c of conditions) {
    if (!latestCondition.has(c.item_id)) latestCondition.set(c.item_id, c.condition)
  }

  const today = new Date()

  function enrichItem(item: any): ReportItem {
    let ageYears: number | null = null
    let endOfLifeDate: Date | null = null
    let yearsOverdue: number | null = null

    if (item.purchase_date) {
      const purchaseDate = new Date(item.purchase_date)
      ageYears = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365))

      if (item.expected_life_years) {
        endOfLifeDate = new Date(purchaseDate)
        endOfLifeDate.setFullYear(endOfLifeDate.getFullYear() + item.expected_life_years)
        if (endOfLifeDate < today) {
          yearsOverdue = Math.floor((today.getTime() - endOfLifeDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
        }
      }
    }

    return {
      ...item,
      equipment_categories: item.equipment_categories,
      condition: latestCondition.get(item.id) ?? null,
      ageYears,
      endOfLifeDate,
      yearsOverdue,
    }
  }

  const enriched = items.map(enrichItem)

  const needsReplacement = enriched.filter(i => i.condition === 'replace')
  const poorCondition = enriched.filter(i => i.condition === 'poor')
  const pastEndOfLife = enriched.filter(
    i => i.yearsOverdue !== null && i.condition !== 'replace'
  ).sort((a, b) => (b.yearsOverdue ?? 0) - (a.yearsOverdue ?? 0))

  const totalFlagged = new Set([
    ...needsReplacement.map(i => i.id),
    ...poorCondition.map(i => i.id),
    ...pastEndOfLife.map(i => i.id),
  ]).size

  // --- Spend tracking ---
  const totalSpend = allItems.reduce((sum, i) => sum + (i.purchase_cost ?? 0), 0)
  const activeSpend = allItems
    .filter(i => !['retired', 'lost', 'damaged'].includes(i.status))
    .reduce((sum, i) => sum + (i.purchase_cost ?? 0), 0)

  // Spend by category
  const spendByCategory = new Map<string, { count: number; total: number }>()
  for (const item of allItems) {
    if (!item.purchase_cost) continue
    const cat = item.equipment_categories?.name ?? 'Uncategorised'
    const entry = spendByCategory.get(cat) ?? { count: 0, total: 0 }
    entry.count++
    entry.total += item.purchase_cost
    spendByCategory.set(cat, entry)
  }
  const spendByCategorySorted = Array.from(spendByCategory.entries())
    .sort((a, b) => b[1].total - a[1].total)

  // Estimated replacement cost (items flagged as poor/replace or past end of life)
  const flaggedIds = new Set([
    ...needsReplacement.map(i => i.id),
    ...poorCondition.map(i => i.id),
    ...pastEndOfLife.map(i => i.id),
  ])
  const replacementCost = enriched
    .filter(i => flaggedIds.has(i.id) && i.purchase_cost)
    .reduce((sum, i) => sum + (i.purchase_cost ?? 0), 0)

  // Lost/damaged cost
  const lostDamagedCost = allItems
    .filter(i => (i.status === 'lost' || i.status === 'damaged') && i.purchase_cost)
    .reduce((sum, i) => sum + (i.purchase_cost ?? 0), 0)

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">
          {totalFlagged === 0
            ? 'All equipment is in good shape'
            : `${totalFlagged} item${totalFlagged !== 1 ? 's' : ''} need attention`}
        </p>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 flex-wrap">
        <ExportButton label="Inventory CSV" action={exportInventory} />
        <ExportButton label="Loan History CSV" action={exportLoans} />
        <ExportButton label="Condition Report CSV" action={exportConditionReport} />
      </div>

      {/* Spend summary */}
      {totalSpend > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="inline-flex p-2 rounded-lg bg-green-50 mb-2">
                  <DollarSign size={18} className="text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{fmt(totalSpend)}</div>
                <div className="text-xs text-gray-500">Total spend ({allItems.filter(i => i.purchase_cost).length} items)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="inline-flex p-2 rounded-lg bg-blue-50 mb-2">
                  <DollarSign size={18} className="text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{fmt(activeSpend)}</div>
                <div className="text-xs text-gray-500">Active inventory value</div>
              </CardContent>
            </Card>
            {replacementCost > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="inline-flex p-2 rounded-lg bg-amber-50 mb-2">
                    <AlertTriangle size={18} className="text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{fmt(replacementCost)}</div>
                  <div className="text-xs text-gray-500">Est. replacement cost</div>
                </CardContent>
              </Card>
            )}
            {lostDamagedCost > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="inline-flex p-2 rounded-lg bg-red-50 mb-2">
                    <DollarSign size={18} className="text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{fmt(lostDamagedCost)}</div>
                  <div className="text-xs text-gray-500">Lost / damaged value</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Spend by category */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Spend by Category</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {spendByCategorySorted.map(([cat, { count, total }]) => {
                const pct = Math.round((total / totalSpend) * 100)
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{cat} <span className="text-gray-400">({count})</span></span>
                      <span className="font-medium text-gray-900">{fmt(total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* Replacement planning */}
      {totalFlagged === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✓</div>
          <div className="font-medium text-gray-600">Nothing flagged for replacement</div>
          <div className="text-sm mt-1">Log conditions on items to track wear over time</div>
        </div>
      )}

      {needsReplacement.length > 0 && (
        <ReportSection
          icon={<AlertTriangle size={16} className="text-red-600" />}
          title="Marked for replacement"
          bg="bg-red-50"
          border="border-red-200"
          items={needsReplacement}
        />
      )}

      {poorCondition.length > 0 && (
        <ReportSection
          icon={<ThumbsDown size={16} className="text-orange-600" />}
          title="Poor condition"
          bg="bg-orange-50"
          border="border-orange-200"
          items={poorCondition}
        />
      )}

      {pastEndOfLife.length > 0 && (
        <ReportSection
          icon={<Clock size={16} className="text-yellow-600" />}
          title="Past expected life"
          bg="bg-yellow-50"
          border="border-yellow-200"
          items={pastEndOfLife}
          showLifespan
        />
      )}
    </div>
  )
}

function ReportSection({
  icon, title, bg, border, items, showLifespan = false,
}: {
  icon: React.ReactNode
  title: string
  bg: string
  border: string
  items: ReportItem[]
  showLifespan?: boolean
}) {
  return (
    <Card className={`${border}`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
          <span className="ml-auto text-xs font-normal text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {items.map(item => (
          <Link key={item.id} href={`/inventory/${item.id}`}>
            <div className={`${bg} rounded-lg p-3 hover:opacity-80 transition-opacity`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                    {item.name}
                    {item.condition && <ConditionBadge condition={item.condition} />}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.equipment_categories?.name}
                    {item.asset_tag && ` · ${item.asset_tag}`}
                  </div>
                  {showLifespan && item.purchase_date && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Purchased {new Date(item.purchase_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      {item.expected_life_years && ` · ${item.expected_life_years}yr expected life`}
                      {item.yearsOverdue !== null && item.yearsOverdue > 0 && (
                        <span className="text-yellow-700 font-medium"> · {item.yearsOverdue}yr overdue</span>
                      )}
                      {item.yearsOverdue === 0 && (
                        <span className="text-yellow-700 font-medium"> · due this year</span>
                      )}
                    </div>
                  )}
                  {item.purchase_cost && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Original cost: ${item.purchase_cost.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
