export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex bg-background">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#303030] flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#056BFC] blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#3FD534] blur-3xl"></div>
                    <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-[#FABD00] blur-2xl"></div>
                </div>
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>

                <div className="relative z-10 text-white text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-20 h-20">
                            <rect width="100" height="100" rx="20" fill="#1a1a1a" />
                            <path d="M20 30L38 72L56 30" stroke="#056BFC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M52 72L70 30L88 72" stroke="#3FD534" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="50" cy="51" r="5" fill="#FABD00" />
                        </svg>
                    </div>

                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">VM</span>
                        <span className="text-[#056BFC]">App</span>
                    </h1>
                    <p className="text-[#FBFBFB]/60 text-lg mb-12">AI-Powered Enterprise Ticketing</p>

                    <div className="space-y-6 text-left max-w-sm">
                        <Feature icon="🎙️" title="Audio-First Tickets" desc="Upload voice recordings and let AI create structured support tickets automatically." />
                        <Feature icon="⚡" title="Real-Time Processing" desc="Whisper transcription + GPT analysis runs in the background while you work." />
                        <Feature icon="🤖" title="AI Copilot" desc="Every ticket gets an AI assistant to help agents respond faster and smarter." />
                        <Feature icon="📊" title="SLA Intelligence" desc="Automatic SLA tracking with breach alerts keeps your team on target." />
                    </div>
                </div>
            </div>

            {/* Right auth panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                {children}
            </div>
        </div>
    )
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="text-2xl mt-0.5">{icon}</div>
            <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-[#FBFBFB]/50 text-sm">{desc}</p>
            </div>
        </div>
    )
}
