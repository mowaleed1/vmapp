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
        .select('full_name, email')
        .eq('id', user.id)
        .single()

    return (
        <TooltipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <AppShellClient
                    userEmail={profile?.email ?? user.email}
                    userFullName={profile?.full_name ?? undefined}
                >
                    {children}
                </AppShellClient>
            </div>
        </TooltipProvider>
    )
}
