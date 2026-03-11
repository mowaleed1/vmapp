import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Allow admin bypass mode — skip all auth/role checks
    const cookieStore = await cookies()
    const adminBypass = cookieStore.get('admin-bypass')?.value === 'true'

    if (!adminBypass) {
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
            redirect('/dashboard/agent')
        }
    }

    return (
        <div className="admin-dashboard-wrapper">
            {children}
        </div>
    )
}
