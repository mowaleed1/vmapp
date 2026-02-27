'use client'

import { cn } from "@/lib/utils"

interface VMLoaderProps {
    loading?: boolean
    className?: string
}

export function VMLoader({ loading = true, className }: VMLoaderProps) {
    if (!loading) return null

    return (
        <div
            className={cn("relative flex items-center justify-center isolate w-[112px] h-[112px]", className)}
            aria-busy="true"
            role="status"
        >
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes wipe-reveal {
          0% { clip-path: inset(0 100% 0 0); }
          40% { clip-path: inset(0 0 0 0); }
          60% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 0 100%); }
        }
        .animate-wipe-reveal {
          animation: wipe-reveal 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />

            {/* Grayscale Base Logo */}
            <VMLogoSVG className="absolute inset-0 w-full h-full grayscale opacity-15" />

            {/* Colored Logo - Reveals left to right */}
            <VMLogoSVG className="relative w-full h-full animate-wipe-reveal drop-shadow-sm" />

            <span className="sr-only">Loading content...</span>
        </div>
    )
}

function VMLogoSVG({ className }: { className?: string }) {
    // Pure inline SVG drawn exactly as the Value Momentum folded M logo.
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <polygon points="0,50 25,25 25,50" fill="#63A0FC" />
            <polygon points="25,25 50,75 25,50" fill="#0263FF" />
            <polygon points="50,35 58,43 50,51 42,43" fill="#F9BA00" />
            <polygon points="75,25 50,75 75,50" fill="#56AC4D" />
            <polygon points="100,50 75,25 75,50" fill="#92D086" />
        </svg>
    )
}
