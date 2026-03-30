import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const [itemsRes, playersRes] = await Promise.all([
    supabase.from('equipment_items').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const sections = [
    {
      href: '/admin/items',
      icon: Package,
      label: 'Equipment Items',
      description: 'Add, edit, or retire items',
      count: itemsRes.count ?? 0,
      countLabel: 'items',
    },
    {
      href: '/admin/players',
      icon: Users,
      label: 'Players',
      description: 'Manage squad members',
      count: playersRes.count ?? 0,
      countLabel: 'active players',
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500">Manage club equipment and members</p>
      </div>
      <div className="space-y-3">
        {sections.map(({ href, icon: Icon, label, description, count, countLabel }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-gray-300 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500">{description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{count} {countLabel}</div>
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
