import { getItemById } from '@/lib/queries/items'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/inventory/status-badge'
import { ConditionBadge } from '@/components/inventory/condition-badge'
import { LogConditionForm } from '@/components/inventory/log-condition-form'
import { QrLabel } from '@/components/inventory/qr-label'
import { ArrowLeft, MapPin, Tag, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getItemById(id)
  if (!item) notFound()

  const category = item.equipment_categories as { name: string } | null
  const location = item.locations as { name: string } | null

  const currentLoan = item.currentLoan as any
  const holderName = currentLoan?.recipient_name ?? null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Inventory
        </Link>
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900 flex-1">{item.name}</h1>
          <StatusBadge status={item.status} />
          {item.currentCondition && <ConditionBadge condition={item.currentCondition} />}
        </div>
      </div>

      {/* Key info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {item.asset_tag && (
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-gray-400" />
              <span className="text-gray-500">Asset tag</span>
              <span className="font-mono font-medium text-gray-900">{item.asset_tag}</span>
            </div>
          )}
          {category && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 w-3.5" />
              <span className="text-gray-500">Category</span>
              <span className="text-gray-900">{category.name}</span>
            </div>
          )}
          {location && item.status !== 'on_loan' && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-500">Location</span>
              <span className="text-gray-900">{location.name}</span>
            </div>
          )}
          {item.purchase_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-500">Purchased</span>
              <span className="text-gray-900">
                {new Date(item.purchase_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
          {item.custom_attributes && Object.keys(item.custom_attributes).length > 0 && (
            Object.entries(item.custom_attributes as Record<string, string>).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-3.5" />
                <span className="text-gray-500">{key}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))
          )}
          {item.notes && (
            <div className="text-sm text-gray-500 pt-1 border-t">{item.notes}</div>
          )}
        </CardContent>
      </Card>

      {/* Current loan */}
      {item.status === 'on_loan' && currentLoan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-blue-800">Currently On Loan</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-blue-600" />
              <span className="font-medium text-blue-900">{holderName}</span>
            </div>
            {currentLoan.expected_return_date && (
              <div className="text-sm text-blue-700">
                Due back: {new Date(currentLoan.expected_return_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            )}
            {currentLoan.purpose && (
              <div className="text-sm text-blue-600">{currentLoan.purpose}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR label */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700">QR Label</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <QrLabel itemId={id} itemName={item.name} assetTag={item.asset_tag} />
        </CardContent>
      </Card>

      {/* Log condition */}
      {item.status !== 'retired' && (
        <LogConditionForm itemId={id} />
      )}

      {/* Condition history */}
      {item.conditionHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Condition History</h2>
          <div className="space-y-2">
            {item.conditionHistory.map((log: any) => (
              <div key={log.id} className="bg-white rounded-lg border p-3 flex items-start gap-3">
                <ConditionBadge condition={log.condition} />
                <div className="flex-1 min-w-0">
                  {log.notes && <div className="text-sm text-gray-700">{log.notes}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">
                    {log.profiles?.full_name} · {new Date(log.assessed_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loan history */}
      {item.loans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Loan History</h2>
          <div className="space-y-2">
            {item.loans.map((loan: any) => {
              const name = loan.recipient_name ?? 'Unknown'
              return (
                <div key={loan.id} className="bg-white rounded-lg border p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{name}</div>
                      {loan.purpose && <div className="text-xs text-gray-500">{loan.purpose}</div>}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${loan.checked_in_at ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {loan.checked_in_at ? 'Returned' : 'Out'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(loan.checked_out_at).toLocaleDateString()}
                    {loan.checked_in_at && ` → ${new Date(loan.checked_in_at).toLocaleDateString()}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
