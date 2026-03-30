import { Badge } from '@/components/ui/badge'
import { ItemStatus } from '@/lib/supabase/database.types'

const config: Record<ItemStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  on_loan:   { label: 'On Loan',   className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  retired:   { label: 'Retired',   className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' },
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}
