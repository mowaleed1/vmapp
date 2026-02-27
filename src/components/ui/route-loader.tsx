'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VMLoader } from '@/components/ui/vm-loader'
import { cn } from '@/lib/utils'

export function RouteLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // When pathname or search params change, navigation has completed
    useEffect(() => {
        setIsNavigating(false)
    }, [pathname, searchParams])

    useEffect(() => {
        if (!mounted) return

        const handleAnchorClick = (e: MouseEvent) => {
            // Find closest anchor tag
            const anchor = (e.target as HTMLElement).closest('a')
            if (!anchor || e.defaultPrevented) return

            const href = anchor.href
            const target = anchor.target

            // Ignore standard browser link behaviors (new tab, external, modifier keys)
            if (
                target === '_blank' ||
                !href.startsWith('http') ||
                e.ctrlKey ||
                e.metaKey ||
                e.altKey ||
                e.shiftKey
            ) {
                return
            }

            const currentUrl = new URL(window.location.href)
            const targetUrl = new URL(href)

            // Ignore cross-origin links
            if (currentUrl.origin !== targetUrl.origin) return

            // Ignore hash links on the exact same page
            if (
                currentUrl.pathname === targetUrl.pathname &&
                currentUrl.search === targetUrl.search &&
                targetUrl.hash
            ) {
                return
            }

            // If we made it here, it's likely a valid internal navigation.
            if (currentUrl.pathname !== targetUrl.pathname || currentUrl.search !== targetUrl.search) {
                setIsNavigating(true)
            }
        }

        const handlePopState = () => setIsNavigating(true)

        // Capture phase intercepts before framework routing handling
        document.addEventListener('click', handleAnchorClick, true)
        window.addEventListener('popstate', handlePopState)

        return () => {
            document.removeEventListener('click', handleAnchorClick, true)
            window.removeEventListener('popstate', handlePopState)
        }
    }, [mounted])

    if (!mounted) return null

    return (
        <div
            aria-busy={isNavigating ? "true" : "false"}
            role="status"
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ease-in-out pointer-events-none",
                isNavigating
                    ? "opacity-100 bg-white/10 dark:bg-black/10 backdrop-blur-sm"
                    : "opacity-0 bg-transparent backdrop-blur-none"
            )}
        >
            <div className={cn(
                "transition-transform duration-300 ease-in-out",
                isNavigating ? "scale-100" : "scale-95"
            )}>
                {/* We keep it rendered so that VMLoader doesn't unmount suddenly, but hidden by parent's opacity. 
            Force loading=true so the animation continues while fading out. */}
                <VMLoader loading={true} className="drop-shadow-2xl" />
            </div>
        </div>
    )
}
