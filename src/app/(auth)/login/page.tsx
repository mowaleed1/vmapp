'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

            if (authError) {
                setError(authError.message)
                setLoading(false)
                return
            }

            router.push('/dashboard/agent')
            router.refresh()
        } catch (err: unknown) {
            // Show the real error so it's diagnosable
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Connection error: ${msg}. Make sure your network can reach Supabase.`)
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex justify-center lg:hidden mb-8">
                <Image src="/vm-logo.png" alt="ValueMomentum" width={180} height={50} className="object-contain" />
            </div>

            {/* Card — white so it pops on the blue half */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-white/20">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">Sign in</h1>
                    <p className="text-muted-foreground text-sm mt-1">Access your Value Momentum account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[#303030] font-medium">Password</Label>
                            <Link href="/forgot-password" className="text-xs text-[#056BFC] hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
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
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </form>

                <div className="pt-2 border-t border-gray-100 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-[#056BFC] font-semibold hover:underline">
                            Request access
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
