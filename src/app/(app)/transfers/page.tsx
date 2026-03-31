import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferActions } from '@/components/transfers/transfer-actions'
import { ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TransfersPage() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')

  // Incoming transfers (to me)
  const { data: incoming } = await supabase
    .from('equipment_transfers')
    .select(`
      id, status, notes, initiated_at, responded_at,
      from_profile:profiles!equipment_transfers_from_profile_id_fkey(full_name),
      item:equipment_items!equipment_transfers_item_id_fkey(id, name, asset_tag)
    `)
    .eq('to_profile_id', user.id)
    .order('initiated_at', { ascending: false })

  // Outgoing transfers (from me)
  const { data: outgoing } = await supabase
    .from('equipment_transfers')
    .select(`
      id, status, notes, initiated_at, responded_at,
      to_profile:profiles!equipment_transfers_to_profile_id_fkey(full_name),
      item:equipment_items!equipment_transfers_item_id_fkey(id, name, asset_tag)
    `)
    .eq('from_profile_id', user.id)
    .order('initiated_at', { ascending: false })

  const pendingIncoming = (incoming ?? []).filter((t: any) => t.status === 'pending')
  const pastIncoming = (incoming ?? []).filter((t: any) => t.status !== 'pending')
  const pendingOutgoing = (outgoing ?? []).filter((t: any) => t.status === 'pending')
  const pastOutgoing = (outgoing ?? []).filter((t: any) => t.status !== 'pending')

  const statusIcon = (status: string) => {
    if (status === 'pending') return <Clock size={14} className="text-amber-500" />
    if (status === 'accepted') return <CheckCircle size={14} className="text-green-500" />
    return <XCircle size={14} className="text-red-500" />
  }

  const statusLabel = (status: string) => {
    if (status === 'pending') return 'Pending'
    if (status === 'accepted') return 'Accepted'
    return 'Rejected'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Transfers</h1>
        <Link
          href="/transfers/new"
          className="inline-flex items-center gap-1 text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 px-3 py-2 rounded-lg transition-colors"
        >
          New Transfer
        </Link>
      </div>

      {/* Pending incoming */}
      {pendingIncoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Awaiting Your Response</h2>
          <div className="space-y-2">
            {pendingIncoming.map((t: any) => (
              <Card key={t.id} className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">{t.from_profile?.full_name}</span>
                        <ArrowRight size={12} className="text-gray-400" />
                        <span className="font-medium text-gold-700">You</span>
                      </div>
                      <Link href={`/inventory/${t.item?.id}`} className="text-sm text-blue-600 hover:underline">
                        {t.item?.name}
                        {t.item?.asset_tag && <span className="text-gray-400 ml-1">({t.item.asset_tag})</span>}
                      </Link>
                      {t.notes && <p className="text-xs text-gray-500 mt-1">{t.notes}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(t.initiated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <TransferActions transferId={t.id} type="incoming" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending outgoing */}
      {pendingOutgoing.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Waiting for Response</h2>
          <div className="space-y-2">
            {pendingOutgoing.map((t: any) => (
              <Card key={t.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gold-700">You</span>
                        <ArrowRight size={12} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{t.to_profile?.full_name}</span>
                      </div>
                      <Link href={`/inventory/${t.item?.id}`} className="text-sm text-blue-600 hover:underline">
                        {t.item?.name}
                        {t.item?.asset_tag && <span className="text-gray-400 ml-1">({t.item.asset_tag})</span>}
                      </Link>
                      {t.notes && <p className="text-xs text-gray-500 mt-1">{t.notes}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(t.initiated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <TransferActions transferId={t.id} type="outgoing" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-gray-500">
            No pending transfers
          </CardContent>
        </Card>
      )}

      {/* Past transfers */}
      {(pastIncoming.length > 0 || pastOutgoing.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">History</h2>
          <div className="space-y-2">
            {[...pastIncoming.map((t: any) => ({ ...t, direction: 'incoming' as const })),
              ...pastOutgoing.map((t: any) => ({ ...t, direction: 'outgoing' as const }))]
              .sort((a, b) => new Date(b.responded_at ?? b.initiated_at).getTime() - new Date(a.responded_at ?? a.initiated_at).getTime())
              .map((t: any) => (
                <div key={t.id} className="bg-white rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        {t.direction === 'incoming' ? (
                          <>
                            <span className="text-gray-600">{t.from_profile?.full_name}</span>
                            <ArrowRight size={12} className="text-gray-400" />
                            <span className="text-gray-900 font-medium">You</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-900 font-medium">You</span>
                            <ArrowRight size={12} className="text-gray-400" />
                            <span className="text-gray-600">{t.to_profile?.full_name}</span>
                          </>
                        )}
                      </div>
                      <Link href={`/inventory/${t.item?.id}`} className="text-sm text-blue-600 hover:underline">
                        {t.item?.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {statusIcon(t.status)}
                      <span className="text-gray-500">{statusLabel(t.status)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(t.responded_at ?? t.initiated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
