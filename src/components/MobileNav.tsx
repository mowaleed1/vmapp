'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { X, LayoutDashboard, Ticket, Upload, Search, Settings, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { label: 'Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
    { label: 'Tickets', href: '/tickets', icon: Ticket },
    { label: 'Requests', href: '/requests', icon: Activity },
    { label: 'Upload', href: '/upload', icon: Upload },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav({ open, onClose, userRole = 'user' }: { open: boolean; onClose: () => void; userRole?: string }) {
    const pathname = usePathname()

    // Close the drawer automatically when the route has actually changed
    useEffect(() => {
        if (open) {
            onClose()
        }
    }, [pathname]) // Intentionally not including onClose so it doesn't loop

    if (!open) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[#1a2332] text-white flex flex-col lg:hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-8 h-8 shrink-0">
                            <rect width="100" height="100" rx="20" fill="#1a1a1a" />
                            <path d="M20 30L38 72L56 30" stroke="#056BFC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M52 72L70 30L88 72" stroke="#3FD534" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="50" cy="51" r="5" fill="#FABD00" />
                        </svg>
                        <span className="font-bold text-lg tracking-tight">
                            <span className="text-white">VM</span>
                            <span className="text-[#056BFC]">App</span>
                        </span>
                    </div>
                    <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="h-5 w-5 text-white/70" aria-hidden="true" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isDashboard = item.label === 'Dashboard'
                        const targetHref = isDashboard && userRole === 'user' ? '/dashboard/user' : item.href
                        const isActive = pathname === targetHref || pathname.startsWith(targetHref + '/')

                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={targetHref}
                                onClick={() => {
                                    // Only close manually if we're already on that page. 
                                    // Otherwise, let the RouteLoader and useEffect handle it smoothly!
                                    if (isActive) onClose()
                                }}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-[#056BFC] text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                                {item.label}
                                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3FD534]" />}
                            </Link>
                        )
                    })}
                </nav>

                <div className="px-3 pb-4 text-xs text-white/30 text-center">
                    Enterprise AI Support Platform
                </div>
            </div>
        </>
    )
}
