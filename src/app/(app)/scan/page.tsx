import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScanClient } from './scan-client'

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()

  return <ScanClient role={profile?.role ?? 'coach'} />
}
