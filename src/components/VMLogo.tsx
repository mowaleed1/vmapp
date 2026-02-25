import React from 'react';

type Variant = 'full' | 'compact' | 'icon';

interface VMLogoProps extends React.SVGProps<SVGSVGElement> {
    variant?: Variant;
}

export function VMLogo({ variant = 'full', className, ...props }: VMLogoProps) {
    // If we had actual VM SVG assets we would return them here based on variant.
    // For now, we will render a stylized SVG matching the VM brand colors.

    if (variant === 'icon' || variant === 'compact') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                fill="none"
                className={`w-10 h-10 ${className || ''}`}
                {...props}
            >
                <rect width="100" height="100" rx="20" fill="#303030" />
                <path d="M25 30L40 70L55 30" stroke="#056BFC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 70L65 30L80 70" stroke="#3FD534" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="50" r="4" fill="#FABD00" />
            </svg>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                fill="none"
                className="w-8 h-8"
                {...props}
            >
                <rect width="100" height="100" rx="20" fill="#303030" />
                <path d="M25 30L40 70L55 30" stroke="#056BFC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 70L65 30L80 70" stroke="#3FD534" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="50" r="4" fill="#FABD00" />
            </svg>
            {variant === 'full' && (
                <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
                    <span className="text-foreground">VM</span>
                    <span className="text-[#056BFC]">App</span>
                </span>
            )}
        </div>
    );
}
