import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewTransferForm } from '@/components/transfers/new-transfer-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewTransferPage({ searchParams }: { searchParams: Promise<{ loan?: string }> }) {
  const { loan: preselectedLoanId } = await searchParams
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) redirect('/login')

  // Get the user's profile
  const { data: myProfile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  // Get active loans where current user is the holder
  const { data: myLoans } = await supabase
    .from('equipment_loans')
    .select(`
      id, item_id, recipient_name, checked_out_by,
      item:equipment_items!equipment_loans_item_id_fkey(id, name, asset_tag)
    `)
    .is('checked_in_at', null)
    .or(`checked_out_by.eq.${user.id},recipient_name.eq.${myProfile?.full_name}`)
    .order('checked_out_at', { ascending: false })

  // Filter out loans that already have a pending transfer
  const loanIds = (myLoans ?? []).map((l: any) => l.id)
  let pendingTransferLoanIds: string[] = []
  if (loanIds.length > 0) {
    const { data: pendingTransfers } = await supabase
      .from('equipment_transfers')
      .select('loan_id')
      .in('loan_id', loanIds)
      .eq('status', 'pending')
    pendingTransferLoanIds = (pendingTransfers ?? []).map((t: any) => t.loan_id)
  }

  const availableLoans = (myLoans ?? []).filter((l: any) => !pendingTransferLoanIds.includes(l.id))

  // Get all coaches (excluding current user)
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, full_name')
    .neq('id', user.id)
    .order('full_name')

  return (
    <div className="space-y-5">
      <div>
        <Link href="/transfers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Transfers
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Transfer Equipment</h1>
        <p className="text-sm text-gray-500 mt-1">Transfer an item you currently hold to another coach.</p>
      </div>

      {availableLoans.length === 0 ? (
        <div className="bg-white rounded-lg border p-6 text-center text-sm text-gray-500">
          You don&apos;t have any equipment available to transfer.
        </div>
      ) : (
        <NewTransferForm loans={availableLoans} coaches={coaches ?? []} preselectedLoanId={preselectedLoanId} />
      )}
    </div>
  )
}
