import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin/queries'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirect=/admin')
  }

  // Check if user is an admin
  const userIsAdmin = await isAdmin(user.id)

  if (!userIsAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 mr-64">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
