import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hammers RUFC</h1>
          <p className="text-gray-500 mt-1">Equipment Manager</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-gray-400 mt-6">
          Sign in with your @hammersrugby.com Google account
        </p>
      </div>
    </div>
  )
}
