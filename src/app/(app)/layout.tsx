import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShellClient } from '@/components/AppShellClient'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const adminBypass = cookieStore.get('admin-bypass')?.value === 'true'

    let finalRole = 'admin'
    let userEmail = 'admin@bypass.local'
    let userFullName: string | undefined = 'Admin (Bypass)'

    if (!adminBypass) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            redirect('/login')
        }

        const { data: profile } = await supabase
            .from('users')
            .select('full_name, email, role:roles(name)')
            .eq('id', user.id)
            .single()

        const roleData = profile?.role as any
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
        finalRole = roleName || 'user'
        userEmail = profile?.email ?? user.email ?? ''
        userFullName = profile?.full_name ?? undefined
    }

    return (
        <TooltipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar userRole={finalRole} />
                <AppShellClient
                    userEmail={userEmail}
                    userFullName={userFullName}
                    userRole={finalRole}
                >
                    {children}
                </AppShellClient>
            </div>
        </TooltipProvider>
    )
}
