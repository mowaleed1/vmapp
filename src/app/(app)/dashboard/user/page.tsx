import Link from 'next/link'
import { ShieldCheck, UploadCloud, Brain, FileText, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Dashboard — ValueMomentum' }

export default function UserLandingPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-white">

            {/* Top Hero Section */}
            <div
                className="w-full px-6 py-20 lg:py-28 relative overflow-hidden flex flex-col items-center border-b border-gray-100"
                style={{ background: 'linear-gradient(145deg, #f0f4ff 0%, #e8f0fe 60%, #ffffff 100%)' }}
            >
                {/* Subtle Dot Grid */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #056BFC 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <div className="relative z-10 flex flex-col items-center max-w-4xl text-center space-y-6">
                    {/* Hero Trust Strip */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white border border-[#056BFC]/10 text-xs font-semibold uppercase tracking-widest text-[#056BFC] shadow-sm mb-4">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Secure • Audit-ready • Built for high-velocity teams</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] leading-tight tracking-tight">
                        Transform voice, calls, and recordings into{' '}
                        <span className="text-[#056BFC]">
                            structured, actionable support tickets
                        </span>
                    </h1>

                    <p className="text-lg text-[#303030]/80 max-w-2xl leading-relaxed mt-4 mb-8">
                        Upload your daily support calls or audio files securely. Our dedicated AI engine
                        extracts context and drafts categorized tickets for the service team instantly.
                    </p>

                    <Link
                        href="/upload"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white bg-[#056BFC] hover:bg-[#0455CC] rounded shadow-sm transition-colors w-full sm:w-auto"
                    >
                        <UploadCloud className="w-5 h-5" />
                        Upload Recording to Get Help
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </div>

            {/* Bottom Process Section */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col items-center">
                <h2 className="text-2xl lg:text-3xl font-bold text-[#1a1a1a] mb-12 text-center">
                    Where P&C expertise meets execution.
                </h2>

                <div className="grid md:grid-cols-3 gap-8 lg:gap-16 w-full">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-[#f0f4ff] rounded text-[#056BFC] mb-2 transform rotate-45">
                            <UploadCloud className="w-8 h-8 -rotate-45" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1a1a1a]">1 — Input</h3>
                        <p className="text-sm text-[#303030]/70 leading-relaxed font-medium">
                            Drop in a call recording or speak naturally to describe your issue. Support for multiple audio formats.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-[#e8ffe9] rounded text-[#3FD534] mb-2 transform rotate-45">
                            <Brain className="w-8 h-8 -rotate-45" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1a1a1a]">2 — Intelligence</h3>
                        <p className="text-sm text-[#303030]/70 leading-relaxed font-medium">
                            AI seamlessly extracts the core issue, context, priority, and recommended classification.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded text-gray-700 mb-2 transform rotate-45 border border-gray-100">
                            <FileText className="w-8 h-8 -rotate-45" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1a1a1a]">3 — Action</h3>
                        <p className="text-sm text-[#303030]/70 leading-relaxed font-medium">
                            Create clean, structured tickets instantly and route them automatically to the appropriate team.
                        </p>
                    </div>
                </div>

                {/* Stats Row from Login Page style */}
                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-wrap justify-center gap-12 text-center w-full max-w-4xl">
                    <div className="flex flex-col gap-1">
                        <span className="text-3xl font-bold text-[#056BFC]">25</span>
                        <span className="text-xs font-semibold text-[#303030]/60 uppercase tracking-wider">Years in Business</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-3xl font-bold text-[#056BFC]">100+</span>
                        <span className="text-xs font-semibold text-[#303030]/60 uppercase tracking-wider">Insurers Served</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-3xl font-bold text-[#056BFC]">4000+</span>
                        <span className="text-xs font-semibold text-[#303030]/60 uppercase tracking-wider">P&C Associates</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
