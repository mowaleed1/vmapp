'use client'

import { useState } from 'react'
import { TopNav } from '@/components/TopNav'
import { MobileNav } from '@/components/MobileNav'

export function AppShellClient({
    userEmail,
    userFullName,
    userRole,
    children,
}: {
    userEmail?: string
    userFullName?: string
    userRole?: string
    children: React.ReactNode
}) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} userRole={userRole} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <TopNav
                    userEmail={userEmail}
                    userFullName={userFullName}
                    userRole={userRole}
                    onMobileMenuToggle={() => setMobileOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </>
    )
}
