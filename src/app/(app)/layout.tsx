import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShellClient } from '@/components/AppShellClient'

export default async function AppLayout({
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
        .select('full_name, email, role:roles(name)')
        .eq('id', user.id)
        .single()

    // Supabase TS might type 'role' as an array depending on relationships
    const roleData = profile?.role as any
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
    const finalRole = roleName || 'user'

    return (
        <TooltipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar userRole={finalRole} />
                <AppShellClient
                    userEmail={profile?.email ?? user.email}
                    userFullName={profile?.full_name ?? undefined}
                    userRole={finalRole}
                >
                    {children}
                </AppShellClient>
            </div>
        </TooltipProvider>
    )
}
