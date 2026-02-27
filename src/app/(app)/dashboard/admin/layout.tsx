import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

    const roleData = profile?.role as any
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name

    if (roleName !== 'admin') {
        redirect('/dashboard/agent') // Or an access denied page
    }

    return (
        <div className="admin-dashboard-wrapper">
            {children}
        </div>
    )
}
