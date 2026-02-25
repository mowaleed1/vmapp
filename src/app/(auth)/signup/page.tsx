'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

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

        const supabase = createClient()
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="w-full max-w-md text-center space-y-4">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-[#3FD534]" />
                </div>
                <h1 className="text-2xl font-bold">Check your email</h1>
                <p className="text-muted-foreground">
                    We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click the link to activate your account.
                </p>
                <Link href="/login" className="text-[#056BFC] hover:underline text-sm font-medium">
                    Back to sign in
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md space-y-6">
            {/* Mobile logo */}
            <div className="flex justify-center lg:hidden mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-16 h-16">
                    <rect width="100" height="100" rx="20" fill="#303030" />
                    <path d="M20 30L38 72L56 30" stroke="#056BFC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M52 72L70 30L88 72" stroke="#3FD534" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="50" cy="51" r="5" fill="#FABD00" />
                </svg>
            </div>

            <div className="text-center">
                <h1 className="text-3xl font-bold">Create an account</h1>
                <p className="text-muted-foreground mt-2">Get started with VMApp today</p>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full name</Label>
                            <Input
                                id="full_name"
                                type="text"
                                placeholder="John Smith"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
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
                                    className="pr-10"
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
                            className="w-full bg-[#3FD534] hover:bg-[#3FD534]/90 text-white font-semibold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#056BFC] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
                By signing up, you agree to our{' '}
                <span className="text-[#056BFC] cursor-pointer hover:underline">Terms of Service</span>{' '}
                and{' '}
                <span className="text-[#056BFC] cursor-pointer hover:underline">Privacy Policy</span>
            </p>
        </div>
    )
}
