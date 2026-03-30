import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const email = data.user.email ?? ''

      // Hard enforce @hammersrugby.com domain — belt and suspenders alongside the hd hint
      if (!email.endsWith('@hammersrugby.com')) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=unauthorized_domain`)
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
