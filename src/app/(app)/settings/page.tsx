'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, User, Shield, Bell, Palette, Users } from 'lucide-react'
import { VMLoader } from '@/components/ui/vm-loader'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Profile {
    id: string
    full_name: string | null
    email: string
    role_id: string | null
    role?: { name: string } | null
    created_at: string
}

const TABS = [
    { id: 'profile', label: 'Profile', icon: User, href: '/settings' },
    { id: 'account', label: 'Account', icon: Shield, href: '/settings' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/settings', restrictTo: ['admin', 'agent'] },
    { id: 'appearance', label: 'Appearance', icon: Palette, href: '/settings' },
    { id: 'team', label: 'Team', icon: Users, href: '/settings/team', restrictTo: ['admin', 'agent'] },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')
    const [profile, setProfile] = useState<Profile | null>(null)
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase
                .from('users')
                .select('*, role:roles(name)')
                .eq('id', user.id)
                .single()
            if (data) {
                setProfile(data)
                setFullName(data.full_name ?? '')
            }
            setLoading(false)
        }
        load()
    }, [])

    async function saveProfile() {
        if (currentRole === 'user') {
            toast.error('Users are not permitted to modify their details directly.')
            return
        }

        const supabase = createClient()
        const { error } = await supabase
            .from('users')
            .update({ full_name: fullName.trim() })
            .eq('id', profile!.id)
        if (error) {
            toast.error('Failed to save: ' + error.message)
        } else {
            setProfile(p => p ? { ...p, full_name: fullName.trim() } : p)
            toast.success('Profile updated!')
        }
    }

    async function signOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <VMLoader className="h-10 w-10" />
            </div>
        )
    }

    const roleData = profile?.role as any
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
    const currentRole = roleName || 'user'

    const initials = (profile?.full_name || profile?.email || '?').slice(0, 2).toUpperCase()

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold">Settings</h2>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <nav className="w-48 shrink-0 space-y-1">
                    {TABS.map(tab => {
                        if (tab.restrictTo && !tab.restrictTo.includes(currentRole)) return null

                        const Icon = tab.icon
                        const isTeam = tab.id === 'team'
                        if (isTeam) {
                            return (
                                <a
                                    key={tab.id}
                                    href={tab.href}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                                        'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </a>
                            )
                        }
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                                    activeTab === tab.id
                                        ? 'bg-[#056BFC] text-white'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>

                {/* Tab Content */}
                <div className="flex-1 rounded-xl border bg-card p-6 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Profile</h3>

                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-[#056BFC] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                    {initials}
                                </div>
                                <div>
                                    <p className="font-medium">{profile?.full_name || 'No name set'}</p>
                                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#056BFC]/10 text-[#056BFC]">
                                        <Shield className="h-3 w-3" />
                                        {(profile?.role as any)?.name ?? 'No role'}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-border" />

                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    readOnly={currentRole === 'user'}
                                    placeholder="Your full name"
                                    className={cn(
                                        "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#056BFC]/50",
                                        currentRole === 'user' ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-background"
                                    )}
                                />
                                {currentRole === 'user' && (
                                    <p className="text-xs text-muted-foreground">Your account details are managed by your administrator.</p>
                                )}
                            </div>

                            {/* Email (read-only) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Email Address</label>
                                <input
                                    type="email"
                                    value={profile?.email ?? ''}
                                    readOnly
                                    className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground">Email is managed via Supabase Auth and cannot be changed here.</p>
                            </div>

                            {currentRole !== 'user' && (
                                <Button
                                    onClick={saveProfile}
                                    disabled={isPending || !fullName.trim()}
                                    className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white"
                                >
                                    {isPending ? <><VMLoader className="mr-2 h-5 w-5" /> Saving…</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save Changes</>}
                                </Button>
                            )}
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Account</h3>
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                                <h4 className="font-medium text-sm text-destructive">Danger Zone</h4>
                                <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
                                <Button
                                    variant="outline"
                                    className="text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
                                    onClick={signOut}
                                >
                                    Sign Out
                                </Button>
                            </div>

                            <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
                                <h4 className="font-medium text-sm">Account Details</h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>User ID: <span className="font-mono text-xs">{profile?.id}</span></p>
                                    <p>Member since: <span className="font-medium">{new Date(profile!.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                                    <p>Role: <span className="font-medium capitalize">{(profile?.role as any)?.name ?? '—'}</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Notifications</h3>
                            <p className="text-sm text-muted-foreground">Email and in-app notification settings.</p>
                            <div className="rounded-lg border bg-muted/30 p-8 text-center">
                                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Notification Preferences</p>
                                <p className="text-sm text-muted-foreground mt-1">Configure when and how you receive alerts.</p>
                                <p className="text-xs text-muted-foreground mt-3 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full px-3 py-1 inline-block">Coming soon</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Appearance</h3>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Theme</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Light', 'Dark', 'System'].map(theme => (
                                        <button
                                            key={theme}
                                            onClick={() => toast.info(`${theme} theme — coming soon`)}
                                            className="border rounded-lg p-4 text-sm font-medium hover:border-[#056BFC]/50 hover:bg-[#056BFC]/5 transition-colors"
                                        >
                                            <span className="block mt-1.5">{theme}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Accent Color</label>
                                <div className="flex gap-3">
                                    {[
                                        { color: '#056BFC', label: 'Blue' },
                                        { color: '#3FD534', label: 'Green' },
                                        { color: '#FABD00', label: 'Yellow' },
                                        { color: '#8B5CF6', label: 'Purple' },
                                    ].map(c => (
                                        <button
                                            key={c.color}
                                            title={c.label}
                                            className="h-8 w-8 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-[#056BFC] transition-all"
                                            style={{ backgroundColor: c.color }}
                                            onClick={() => toast.info(`${c.label} accent — coming soon`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
