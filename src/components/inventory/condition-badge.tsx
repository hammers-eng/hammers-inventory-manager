import { Badge } from '@/components/ui/badge'
import { ItemCondition } from '@/lib/supabase/database.types'

const config: Record<ItemCondition, { label: string; className: string }> = {
  new:     { label: 'New',     className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  good:    { label: 'Good',    className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  fair:    { label: 'Fair',    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  poor:    { label: 'Poor',    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  replace: { label: 'Replace', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
}

export function ConditionBadge({ condition }: { condition: ItemCondition | string }) {
  const c = config[condition as ItemCondition]
  if (!c) return null
  return <Badge className={c.className}>{c.label}</Badge>
}
