'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User, Settings, ChevronDown, Menu } from 'lucide-react'
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

    return (
        <header className="h-16 px-4 lg:px-6 flex items-center justify-between border-b bg-background shrink-0">
            {/* Left side: mobile menu + page title */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMobileMenuToggle}
                    className="lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
            </div>

            {/* Right side: notifications + user menu */}
            <div className="flex items-center gap-2">
                {/* Notifications bell */}
                {userRole !== 'user' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative outline-none">
                                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-[#056BFC] text-white border-0 shadow-sm animate-in zoom-in">
                                    3
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[320px] p-2">
                            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                                <span className="font-semibold text-sm">Notifications</span>
                                <Badge variant="secondary" className="text-[10px] bg-[#056BFC]/10 text-[#056BFC]">3 New</Badge>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg m-1">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="w-2 h-2 rounded-full bg-[#056BFC] shrink-0" />
                                    <p className="text-sm font-medium leading-none">New ticket assigned</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-4 leading-relaxed">Ticket VM-A1B2C3 has been assigned to you for immediate review.</p>
                                <p className="text-[10px] text-muted-foreground ml-4 mt-1 font-medium">2m ago</p>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg m-1">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="w-2 h-2 rounded-full bg-[#f59e0b] shrink-0" />
                                    <p className="text-sm font-medium leading-none">SLA Warning</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-4 leading-relaxed">Ticket VM-X9Y8Z7 SLA resolution approaches in 1 hour.</p>
                                <p className="text-[10px] text-muted-foreground ml-4 mt-1 font-medium">1h ago</p>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg m-1">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
                                    <p className="text-sm font-medium leading-none">System updated</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-4 leading-relaxed">ValueMomentum workspace v1.0 deployed successfully.</p>
                                <p className="text-[10px] text-muted-foreground ml-4 mt-1 font-medium">2h ago</p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-xs text-[#056BFC] font-medium cursor-pointer p-2.5 rounded-lg m-1 hover:bg-[#056BFC]/5">
                                Mark all as read
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
