'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { VMLoader } from '@/components/ui/vm-loader'

export default function SignupPage() {
    const router = useRouter()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            })

            if (authError) {
                setError(authError.message)
                setLoading(false)
                return
            }

            setSuccess(true)
            setLoading(false)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Connection error: ${msg}`)
            setLoading(false)
        }
    }

    // Success state — white card on blue background
    if (success) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-10 text-center space-y-4">
                    <CheckCircle2 className="h-14 w-14 text-[#3FD534] mx-auto" />
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">Check your email</h1>
                    <p className="text-[#303030]/65 text-sm leading-relaxed">
                        We sent a confirmation link to{' '}
                        <span className="font-semibold text-[#1a1a1a]">{email}</span>.{' '}
                        Click the link to activate your Value Momentum account.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block mt-2 text-sm text-[#056BFC] font-semibold hover:underline"
                    >
                        ← Back to sign in
                    </Link>
                </div>
                <p className="text-center text-xs text-white/50 mt-6">
                    © {new Date().getFullYear()} ValueMomentum, Inc. All rights reserved.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md">
            {/* Mobile-only logo */}
            <div className="flex justify-center mb-8 lg:hidden">
                <Image src="/vm-logo.png" alt="ValueMomentum" width={180} height={50} className="object-contain brightness-0 invert" />
            </div>

            {/* White card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-white/20">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">Create account</h1>
                    <p className="text-muted-foreground text-sm mt-1">Join the Value Momentum platform</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="full_name" className="text-[#303030] font-medium">Full name</Label>
                        <Input
                            id="full_name"
                            type="text"
                            placeholder="Jane Smith"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            className="h-11 border-gray-200 focus:border-[#056BFC] focus:ring-[#056BFC]/20"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-[#303030] font-medium">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@valuemomentum.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                            className="h-11 border-gray-200 focus:border-[#056BFC] focus:ring-[#056BFC]/20"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-[#303030] font-medium">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                disabled={loading}
                                className="h-11 pr-10 border-gray-200 focus:border-[#056BFC] focus:ring-[#056BFC]/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-[#056BFC] hover:bg-[#0455CC] text-white font-semibold rounded-lg shadow-sm transition-colors"
                        disabled={loading}
                    >
                        {loading
                            ? <><VMLoader className="mr-2 h-5 w-5" /> Creating account…</>
                            : 'Create account'}
                    </Button>
                </form>

                <div className="pt-2 border-t border-gray-100 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#056BFC] font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <p className="text-center text-xs text-white/50 mt-6">
                © {new Date().getFullYear()} ValueMomentum, Inc. All rights reserved.
            </p>
        </div>
    )
}
