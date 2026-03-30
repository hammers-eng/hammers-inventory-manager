import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { ConditionBadge } from './condition-badge'
import { ItemWithDetails } from '@/lib/queries/items'
import { ItemStatus } from '@/lib/supabase/database.types'

export function ItemCard({ item }: { item: ItemWithDetails }) {
  const category = item.equipment_categories as { name: string } | null
  const location = item.locations as { name: string } | null

  const holderName = item.currentLoan?.recipient_name ?? null

  return (
    <Link href={`/inventory/${item.id}`}>
      <div className="bg-white rounded-lg border p-4 flex items-center gap-3 hover:border-gray-300 active:bg-gray-50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 truncate">{item.name}</span>
            <StatusBadge status={item.status as ItemStatus} />
            {item.currentCondition && <ConditionBadge condition={item.currentCondition} />}
          </div>
          <div className="text-sm text-gray-500 mt-0.5 space-x-2">
            {category && <span>{category.name}</span>}
            {item.asset_tag && <span>· {item.asset_tag}</span>}
            {item.custom_attributes && Object.entries(item.custom_attributes as Record<string, string>).map(([k, v]) => (
              v ? <span key={k}>· {k}: {v}</span> : null
            ))}
          </div>
          {item.status === 'on_loan' && holderName && (
            <div className="text-sm text-blue-600 mt-0.5">With {holderName}</div>
          )}
          {item.status === 'available' && location && (
            <div className="text-sm text-gray-400 mt-0.5">{location.name}</div>
          )}
        </div>
        <ChevronRight className="text-gray-300 flex-shrink-0" size={18} />
      </div>
    </Link>
  )
}
