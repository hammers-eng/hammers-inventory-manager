'use server'

import { createClient } from '@/lib/supabase/server'

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }
  const lines = [headers.map(escape).join(',')]
  for (const row of rows) {
    lines.push(row.map(v => escape(v ?? '')).join(','))
  }
  return lines.join('\n')
}

export async function exportInventory() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: items } = await supabase
    .from('equipment_items')
    .select(`
      name, asset_tag, serial_number, status, notes, purchase_date, purchase_cost,
      equipment_categories!equipment_items_category_id_fkey(name),
      locations!equipment_items_home_location_id_fkey(name)
    `)
    .neq('status', 'retired')
    .order('name')

  if (!items) return { error: 'Failed to fetch items' }

  const headers = ['Name', 'Asset Tag', 'Serial Number', 'Category', 'Location', 'Status', 'Purchase Date', 'Purchase Cost', 'Notes']
  const rows = items.map((item: any) => [
    item.name,
    item.asset_tag ?? '',
    item.serial_number ?? '',
    item.equipment_categories?.name ?? '',
    item.locations?.name ?? '',
    item.status,
    item.purchase_date ?? '',
    item.purchase_cost != null ? item.purchase_cost.toString() : '',
    item.notes ?? '',
  ])

  return { csv: toCsv(headers, rows), filename: `inventory-${new Date().toISOString().split('T')[0]}.csv` }
}

export async function exportLoans() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: loans } = await supabase
    .from('equipment_loans')
    .select(`
      recipient_name, checked_out_at, expected_return_date, checked_in_at, purpose, return_notes,
      equipment_items!equipment_loans_item_id_fkey(name, asset_tag),
      profiles!equipment_loans_checked_out_by_fkey(full_name)
    `)
    .order('checked_out_at', { ascending: false })
    .limit(500)

  if (!loans) return { error: 'Failed to fetch loans' }

  const headers = ['Item', 'Asset Tag', 'Recipient', 'Checked Out By', 'Checked Out', 'Expected Return', 'Returned', 'Purpose', 'Return Notes']
  const rows = loans.map((loan: any) => [
    loan.equipment_items?.name ?? '',
    loan.equipment_items?.asset_tag ?? '',
    loan.recipient_name ?? '',
    loan.profiles?.full_name ?? '',
    loan.checked_out_at ? new Date(loan.checked_out_at).toLocaleDateString() : '',
    loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleDateString() : '',
    loan.checked_in_at ? new Date(loan.checked_in_at).toLocaleDateString() : 'Outstanding',
    loan.purpose ?? '',
    loan.return_notes ?? '',
  ])

  return { csv: toCsv(headers, rows), filename: `loans-${new Date().toISOString().split('T')[0]}.csv` }
}

export async function exportConditionReport() {
  const supabaseTyped = await createClient()
  const supabase = supabaseTyped as any
  const { data: { user } } = await supabaseTyped.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: logs } = await supabase
    .from('condition_logs')
    .select(`
      condition, assessed_at, notes,
      equipment_items!condition_logs_item_id_fkey(name, asset_tag),
      profiles!condition_logs_assessed_by_fkey(full_name)
    `)
    .order('assessed_at', { ascending: false })
    .limit(500)

  if (!logs) return { error: 'Failed to fetch condition logs' }

  const headers = ['Item', 'Asset Tag', 'Condition', 'Assessed By', 'Date', 'Notes']
  const rows = logs.map((log: any) => [
    log.equipment_items?.name ?? '',
    log.equipment_items?.asset_tag ?? '',
    log.condition,
    log.profiles?.full_name ?? '',
    log.assessed_at ? new Date(log.assessed_at).toLocaleDateString() : '',
    log.notes ?? '',
  ])

  return { csv: toCsv(headers, rows), filename: `condition-report-${new Date().toISOString().split('T')[0]}.csv` }
}
