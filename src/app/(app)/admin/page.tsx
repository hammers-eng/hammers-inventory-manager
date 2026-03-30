import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Tag, MapPin, ArrowRight, BarChart2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  const [itemsRes, categoriesRes, locationsRes] = await Promise.all([
    supabase.from('equipment_items').select('*', { count: 'exact', head: true }).neq('status', 'retired'),
    supabase.from('equipment_categories').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
  ])

  const sections = [
    {
      href: '/admin/items',
      icon: Package,
      label: 'Equipment Items',
      description: 'Add, edit, or retire items',
      count: itemsRes.count ?? 0,
      countLabel: 'active items',
    },
    {
      href: '/admin/categories',
      icon: Tag,
      label: 'Categories',
      description: 'Manage equipment categories',
      count: categoriesRes.count ?? 0,
      countLabel: 'categories',
    },
    {
      href: '/admin/locations',
      icon: MapPin,
      label: 'Locations',
      description: 'Manage storage locations',
      count: locationsRes.count ?? 0,
      countLabel: 'locations',
    },
    {
      href: '/admin/reports',
      icon: BarChart2,
      label: 'Replacement Planning',
      description: 'Items needing replacement or past end of life',
      count: null,
      countLabel: '',
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500">Manage club equipment</p>
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
                  {count !== null && <div className="text-xs text-gray-400 mt-0.5">{count} {countLabel}</div>}
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
