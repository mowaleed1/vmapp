'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
    LayoutDashboard,
    Tickets,
    Upload,
    Search,
    Settings,
    ChevronLeft,
    ChevronRight,
    Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
    { label: 'Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
    { label: 'Tickets', href: '/tickets', icon: Tickets },
    { label: 'Upload', href: '/upload', icon: Upload },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'relative hidden lg:flex flex-col h-screen bg-[#303030] text-white transition-all duration-300 ease-in-out shrink-0',
                collapsed ? 'w-16' : 'w-60'
            )}
        >
            {/* Logo */}
            <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed ? 'justify-center' : 'gap-3')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-8 h-8 shrink-0">
                    <rect width="100" height="100" rx="20" fill="#1a1a1a" />
                    <path d="M20 30L38 72L56 30" stroke="#056BFC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M52 72L70 30L88 72" stroke="#3FD534" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="50" cy="51" r="5" fill="#FABD00" />
                </svg>
                {!collapsed && (
                    <span className="font-bold text-lg tracking-tight">
                        <span className="text-white">VM</span>
                        <span className="text-[#056BFC]">App</span>
                    </span>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    const linkContent = (
                        <Link
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                collapsed ? 'justify-center' : '',
                                isActive
                                    ? 'bg-[#056BFC] text-white shadow-sm'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                            )}
                        >
                            <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                            {!collapsed && <span>{item.label}</span>}
                            {isActive && !collapsed && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3FD534]" />
                            )}
                        </Link>
                    )

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        )
                    }

                    return <div key={item.href}>{linkContent}</div>
                })}
            </nav>

            {/* AI Copilot badge */}
            {!collapsed && (
                <div className="mx-2 mb-3 p-3 rounded-lg bg-[#056BFC]/20 border border-[#056BFC]/30">
                    <div className="flex items-center gap-2 text-sm text-[#056BFC] font-medium">
                        <Bot className="h-4 w-4" />
                        <span>AI Copilot</span>
                        <span className="ml-auto text-xs bg-[#3FD534]/20 text-[#3FD534] px-1.5 py-0.5 rounded-full">Active</span>
                    </div>
                </div>
            )}

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#303030] border border-white/20 text-white/60 hover:text-white hover:bg-[#056BFC] transition-colors"
            >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
        </aside>
    )
}
