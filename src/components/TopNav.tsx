'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User, Settings, ChevronDown, Menu, Ticket } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TopNavProps {
    pageTitle?: string
    userEmail?: string
    userFullName?: string
    userRole?: string
    onMobileMenuToggle?: () => void
}

export function TopNav({ pageTitle = 'Dashboard', userEmail, userFullName, userRole, onMobileMenuToggle }: TopNavProps) {
    const router = useRouter()

    const initials = userFullName
        ? userFullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : userEmail?.slice(0, 2).toUpperCase() ?? 'U'

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const [recentTickets, setRecentTickets] = useState<any[]>([])

    useEffect(() => {
        if (userRole === 'user') return

        const fetchTickets = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('tickets')
                .select('id, title, created_at, ticket_number')
                .order('created_at', { ascending: false })
                .limit(3)
            if (data) {
                setRecentTickets(data)
            }
        }
        fetchTickets()
    }, [userRole])

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    return (
        <header className="h-16 px-4 lg:px-6 flex items-center justify-between border-b bg-background shrink-0">
            {/* Left side: mobile menu + page title */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMobileMenuToggle}
                    className="lg:hidden"
                    aria-label="Toggle mobile menu"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
            </div>

            {/* Right side: notifications + user menu */}
            <div className="flex items-center gap-2">
                {/* Notifications bell */}
                {userRole !== 'user' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative outline-none" aria-label="View notifications">
                                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" aria-hidden="true" />
                                {recentTickets.length > 0 && (
                                    <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-[#056BFC] text-white border-0 shadow-sm animate-in zoom-in">
                                        {recentTickets.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[320px] p-2">
                            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                                <span className="font-semibold text-sm">Recent Tickets</span>
                                {recentTickets.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] bg-[#056BFC]/10 text-[#056BFC]">{recentTickets.length} New</Badge>
                                )}
                            </div>
                            <DropdownMenuSeparator />

                            {recentTickets.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">No recent tickets</div>
                            ) : (
                                recentTickets.map(ticket => (
                                    <DropdownMenuItem key={ticket.id} className="p-0 m-1 cursor-pointer rounded-lg overflow-hidden group">
                                        <Link href={`/tickets/${ticket.id}`} className="flex flex-col items-start gap-1 p-3 w-full hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="w-2 h-2 rounded-full bg-[#056BFC] shrink-0" />
                                                <p className="text-sm font-medium leading-none truncate">{ticket.title}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground ml-4 leading-relaxed font-mono">
                                                {ticket.ticket_number ?? `VM-${ticket.id.slice(0, 6).toUpperCase()}`}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground ml-4 mt-1 font-medium">{timeAgo(ticket.created_at)}</p>
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/search" className="justify-center text-xs text-[#056BFC] font-medium cursor-pointer p-2.5 rounded-lg m-1 hover:bg-[#056BFC]/5 w-full flex">
                                    Search all tickets
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 ml-1 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                            <Avatar className="h-7 w-7 text-xs">
                                <AvatarFallback className="bg-[#056BFC] text-white text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:block text-left">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium leading-none">{userFullName || 'Agent'}</p>
                                    {userRole && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#056BFC] bg-[#056BFC]/10 px-1.5 py-0.5 rounded-sm">
                                            {userRole}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate max-w-[140px] mt-0.5">{userEmail}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{userFullName || 'Agent'}</p>
                                    {userRole && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#056BFC] bg-[#056BFC]/10 px-1.5 py-0.5 rounded-sm">
                                            {userRole}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{userEmail}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
