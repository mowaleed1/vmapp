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
    onMobileMenuToggle?: () => void
}

export function TopNav({ pageTitle = 'Dashboard', userEmail, userFullName, onMobileMenuToggle }: TopNavProps) {
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
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-[#056BFC] text-white border-0">
                        3
                    </Badge>
                </Button>

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
                                <p className="text-sm font-medium leading-none">{userFullName || 'Agent'}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{userEmail}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col">
                                <p className="font-medium">{userFullName || 'Agent'}</p>
                                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
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
