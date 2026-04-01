'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'

interface Location {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  asset_tag: string | null
  status: string
  home_location_id: string | null
  equipment_categories: { name: string } | null
}

type AuditStatus = 'found' | 'missing' | 'unchecked'

export function StockTakeClient({ locations, items }: { locations: Location[]; items: Item[] }) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [audit, setAudit] = useState<Map<string, AuditStatus>>(new Map())
  const [showOnLoan, setShowOnLoan] = useState(false)

  const locationItems = useMemo(() => {
    if (!selectedLocation) return []
    return items.filter(item => item.home_location_id === selectedLocation)
  }, [items, selectedLocation])

  const expectedHere = locationItems.filter(i => i.status === 'available')
  const onLoanFromHere = locationItems.filter(i => i.status === 'on_loan')

  function handleLocationChange(locId: string) {
    setSelectedLocation(locId)
    setAudit(new Map())
  }

  function setStatus(itemId: string, status: AuditStatus) {
    const next = new Map(audit)
    if (next.get(itemId) === status) {
      next.delete(itemId)
    } else {
      next.set(itemId, status)
    }
    setAudit(next)
  }

  function markAllFound() {
    const next = new Map(audit)
    expectedHere.forEach(item => next.set(item.id, 'found'))
    setAudit(next)
  }

  const foundCount = Array.from(audit.values()).filter(v => v === 'found').length
  const missingCount = Array.from(audit.values()).filter(v => v === 'missing').length
  const uncheckedCount = expectedHere.length - foundCount - missingCount

  function exportAudit() {
    if (!selectedLocation) return
    const loc = locations.find(l => l.id === selectedLocation)
    const lines = [
      `Stock Take: ${loc?.name ?? 'Unknown'}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `Found: ${foundCount}  |  Missing: ${missingCount}  |  Unchecked: ${uncheckedCount}`,
      ``,
      'Status,Name,Asset Tag,Category',
    ]
    for (const item of expectedHere) {
      const status = audit.get(item.id) ?? 'unchecked'
      lines.push([
        status.toUpperCase(),
        item.name,
        item.asset_tag ?? '',
        item.equipment_categories?.name ?? '',
      ].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock-take-${loc?.name?.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Location selector */}
      <div className="flex gap-2 flex-wrap">
        {locations.map(loc => {
          const count = items.filter(i => i.home_location_id === loc.id && i.status === 'available').length
          return (
            <button
              key={loc.id}
              onClick={() => handleLocationChange(loc.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm border transition-colors',
                selectedLocation === loc.id
                  ? 'bg-gold-600 text-white border-gold-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {loc.name}
              <span className={cn('ml-1.5', selectedLocation === loc.id ? 'text-gold-200' : 'text-gray-400')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {!selectedLocation && (
        <div className="bg-white rounded-lg border p-8 text-center text-sm text-gray-500">
          Select a location to begin the stock take.
        </div>
      )}

      {selectedLocation && (
        <>
          {/* Summary bar */}
          <div className="bg-white rounded-lg border p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} /> {foundCount} found
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle size={14} /> {missingCount} missing
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <HelpCircle size={14} /> {uncheckedCount} unchecked
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={markAllFound}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
              >
                Mark all found
              </button>
              {(foundCount > 0 || missingCount > 0) && (
                <button
                  onClick={exportAudit}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Expected items */}
          {expectedHere.length === 0 ? (
            <div className="bg-white rounded-lg border p-6 text-center text-sm text-gray-500">
              No available items assigned to this location.
            </div>
          ) : (
            <div className="space-y-1">
              {expectedHere.map(item => {
                const status = audit.get(item.id) ?? 'unchecked'
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 bg-white rounded-lg border p-3 transition-colors',
                      status === 'found' && 'bg-green-50 border-green-200',
                      status === 'missing' && 'bg-red-50 border-red-200',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                        {item.asset_tag && <span className="text-gray-400 font-normal"> · {item.asset_tag}</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.equipment_categories?.name}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setStatus(item.id, 'found')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          status === 'found'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                        )}
                        title="Found"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => setStatus(item.id, 'missing')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          status === 'missing'
                            ? 'bg-red-600 text-white'
                            : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                        )}
                        title="Missing"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* On loan from this location */}
          {onLoanFromHere.length > 0 && (
            <div>
              <button
                onClick={() => setShowOnLoan(!showOnLoan)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <AlertTriangle size={12} />
                {onLoanFromHere.length} item{onLoanFromHere.length !== 1 ? 's' : ''} on loan from this location
                <span className="text-gray-400">{showOnLoan ? '▲' : '▼'}</span>
              </button>
              {showOnLoan && (
                <div className="mt-2 space-y-1">
                  {onLoanFromHere.map(item => (
                    <div key={item.id} className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                        {item.asset_tag && <span className="text-gray-400 font-normal"> · {item.asset_tag}</span>}
                      </div>
                      <div className="text-xs text-blue-600">Currently on loan</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
