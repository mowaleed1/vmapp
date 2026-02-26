import Image from 'next/image'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex bg-white">

            {/* ——— Left branding panel ——— */}
            <div
                className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #f0f4ff 0%, #e8f0fe 60%, #dbeafe 100%)' }}
            >
                {/* Decorative blob — top right */}
                <div
                    className="absolute -top-24 -right-24 w-80 h-80 opacity-20 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, #056BFC 0%, transparent 70%)',
                        borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                    }}
                />
                {/* Decorative blob — bottom left */}
                <div
                    className="absolute -bottom-16 -left-16 w-64 h-64 opacity-15 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, #3FD534 0%, transparent 70%)',
                        borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%',
                    }}
                />
                {/* Subtle dot grid overlay */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #056BFC 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* Content */}
                <div className="relative z-10">
                    <Image
                        src="/vm-logo.png"
                        alt="ValueMomentum"
                        width={260}
                        height={70}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-3">
                    <h1 className="text-5xl xl:text-6xl font-bold text-[#1a1a1a] leading-tight whitespace-nowrap">
                        Let&apos;s insure the future.
                    </h1>
                    <h2 className="text-5xl xl:text-6xl font-bold text-[#056BFC] leading-tight">
                        Together.
                    </h2>
                    <p className="text-[#303030]/65 text-base xl:text-lg leading-relaxed max-w-sm pt-1">
                        Join ValueMomentum to help people, businesses, and societies thrive
                        by managing risk and overcoming loss.
                    </p>
                </div>

                {/* Stats row */}
                <div className="relative z-10 flex items-stretch divide-x divide-[#303030]/20">
                    <Stat number="25" label="Years in Business" />
                    <Stat number="100+" label="Insurers Served" />
                    <Stat number="4000+" label="P&C-Focused Associates" />
                </div>
            </div>

            {/* ——— Right auth panel ——— */}
            <div
                className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #056BFC 0%, #0245B8 100%)' }}
            >
                {/* Decorative circles on blue side */}
                <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-32 h-32 rounded-full bg-white/5 pointer-events-none -translate-y-1/2" />

                <div className="relative z-10 w-full max-w-md">
                    {/* Mobile-only logo */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        <Image src="/vm-logo.png" alt="ValueMomentum" width={180} height={50} className="object-contain brightness-0 invert" />
                    </div>
                    {children}
                </div>
            </div>

        </div>
    )
}

function Stat({ number, label }: { number: string; label: string }) {
    return (
        <div className="px-6 first:pl-0 flex flex-col gap-0.5">
            <span className="text-4xl font-bold text-[#056BFC]">{number}</span>
            <span className="text-sm font-medium text-[#303030]/65 leading-snug max-w-[90px]">{label}</span>
        </div>
    )
}
