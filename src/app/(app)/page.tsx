import { getDashboardStats } from '@/lib/queries/dashboard'
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'

export default async function DashboardPage() {
  const { onLoan, available, total, overdue, recentActivity } = await getDashboardStats()

  const stats = [
    {
      label: 'On Loan',
      value: onLoan,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/inventory?status=on_loan',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: AlertTriangle,
      color: overdue > 0 ? 'text-red-600' : 'text-gray-400',
      bg: overdue > 0 ? 'bg-red-50' : 'bg-gray-50',
      href: '/inventory?status=on_loan',
    },
    {
      label: 'Available',
      value: available,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/inventory?status=available',
    },
    {
      label: 'Total Items',
      value: total,
      icon: Clock,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      href: '/inventory',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Equipment overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">No activity yet</div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((loan: any) => {
              const item = loan.equipment_items as { name: string; asset_tag: string | null } | null
              const player = loan.players as { full_name: string } | null
              const staffName = (loan.profiles as { full_name: string } | null)?.full_name
              const recipient = player?.full_name ?? loan.recipient_name ?? 'Unknown'
              const isReturn = !!loan.checked_in_at

              return (
                <div key={loan.id} className="bg-white rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isReturn ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isReturn ? 'Returned' : 'Checked out'}
                      </span>
                      <div className="text-sm font-medium text-gray-900 mt-1 truncate">
                        {item?.name ?? 'Unknown item'}
                        {item?.asset_tag && <span className="text-gray-400 font-normal"> · {item.asset_tag}</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {recipient}
                        {staffName && ` · via ${staffName}`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDistanceToNow(isReturn ? loan.checked_in_at : loan.checked_out_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
