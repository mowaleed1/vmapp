'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    Ticket,
    Upload,
    Search,
    Settings,
    ChevronLeft,
    ChevronRight,
    BarChart2,
    Trash2,
    Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
    { label: 'Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
    { label: 'Analytics', href: '/dashboard/admin', icon: BarChart2, restrictTo: ['admin'] },
    { label: 'Tickets', href: '/tickets', icon: Ticket, restrictTo: ['admin', 'agent'] },
    { label: 'Requests', href: '/requests', icon: Activity, restrictTo: ['admin', 'agent'] },
    { label: 'Upload', href: '/upload', icon: Upload }, // Everyone
    { label: 'Search', href: '/search', icon: Search, restrictTo: ['admin', 'agent'] },
    { label: 'Settings', href: '/settings', icon: Settings, restrictTo: ['admin', 'agent'] },
]

export function Sidebar({ userRole = 'user' }: { userRole?: string }) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [views, setViews] = useState<{ id: string; name: string; filters: Record<string, string> }[]>([])

    useEffect(() => {
        async function fetchViews() {
            const supabase = createClient()
            const { data } = await supabase.from('saved_views').select('*').order('created_at', { ascending: false })
            if (data) setViews(data)
        }

        // Initial fetch
        fetchViews()

        // Re-fetch when a new view is saved
        window.addEventListener('view_saved', fetchViews)
        return () => window.removeEventListener('view_saved', fetchViews)
    }, [])

    const handleDeleteView = async (id: string) => {
        try {
            const supabase = createClient()
            const { error } = await supabase.from('saved_views').delete().eq('id', id)
            if (error) throw error

            setViews(prev => prev.filter(v => v.id !== id))
            toast.success('View deleted')
        } catch (err: any) {
            console.error('Error deleting view:', err)
            toast.error('Failed to delete view')
        }
    }

    return (
        <aside
            className={cn(
                'relative hidden lg:flex flex-col h-screen bg-[#1a2332] text-white transition-all duration-300 ease-in-out shrink-0',
                collapsed ? 'w-16' : 'w-60'
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center h-16 border-b border-white/10 shrink-0',
                collapsed ? 'justify-center px-3' : 'px-5'
            )}>
                {collapsed ? (
                    /* Collapsed: show just the VM mark from the logo */
                    <div className="w-8 h-8 rounded-md bg-[#056BFC] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">VM</span>
                    </div>
                ) : (
                    <Image
                        src="/vm-logo-white.png"
                        alt="ValueMomentum"
                        width={160}
                        height={40}
                        className="object-contain"
                        priority
                    />
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1.5 pt-4">
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        if (item.restrictTo && !item.restrictTo.includes(userRole)) return null

                        const isDashboard = item.label === 'Dashboard'
                        const targetHref = isDashboard && userRole === 'user' ? '/dashboard/user' : item.href
                        const isActive = pathname === targetHref || pathname.startsWith(targetHref + '/')

                        const Icon = item.icon
                        const NavItem = () => (
                            <Link
                                href={targetHref}
                                aria-label={collapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                    collapsed ? 'justify-center' : '',
                                    isActive
                                        ? 'bg-[#056BFC] text-white'
                                        : 'text-white/55 hover:text-white hover:bg-white/8'
                                )}
                            >
                                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
                                {!collapsed && <span>{item.label}</span>}
                                {isActive && !collapsed && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                                )}
                            </Link>
                        )

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href} delayDuration={0}>
                                    <TooltipTrigger asChild><NavItem /></TooltipTrigger>
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                </Tooltip>
                            )
                        }

                        return <div key={item.href}><NavItem /></div>
                    })}
                </div>

                {/* Saved Views Section */}
                {views.length > 0 && userRole !== 'user' && (
                    <div className="pt-6 pb-2">
                        {!collapsed && (
                            <p className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                Your Views
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {views.map(view => {
                                const params = new URLSearchParams(view.filters)
                                const href = `/tickets?${params.toString()}`

                                const linkContent = (
                                    <div
                                        className={cn(
                                            'group flex items-center justify-between rounded-lg text-sm transition-all duration-150',
                                            collapsed ? 'justify-center p-2' : 'px-3 py-2',
                                            'text-white/55 hover:text-white hover:bg-white/8'
                                        )}
                                    >
                                        <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#056BFC]" />
                                            </div>
                                            {!collapsed && <span className="truncate">{view.name}</span>}
                                        </Link>
                                        {!collapsed && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleDeleteView(view.id)
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all ml-2 shrink-0"
                                                title="Delete view"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-white/40 hover:text-red-400" />
                                            </button>
                                        )}
                                    </div>
                                )

                                if (collapsed) {
                                    return (
                                        <Tooltip key={view.id} delayDuration={0}>
                                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                            <TooltipContent side="right">{view.name}</TooltipContent>
                                        </Tooltip>
                                    )
                                }

                                return <div key={view.id}>{linkContent}</div>
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom branding strip */}
            {!collapsed && (
                <div className="mx-3 mb-4 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Enterprise</p>
                    <p className="text-xs text-white/55 mt-0.5">AI Support Platform</p>
                </div>
            )}

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1a2332] border border-white/20 text-white/50 hover:text-white hover:border-[#056BFC] transition-colors"
            >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
        </aside>
    )
}
