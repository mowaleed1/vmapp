'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Shield, Users, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TeamMember {
    id: string
    full_name: string | null
    email: string
    created_at: string
    role: { id: string; name: string } | null
}

interface Role {
    id: string
    name: string
    description: string | null
}

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    agent: 'bg-blue-50 text-[#056BFC] border-blue-200',
    viewer: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function TeamSettingsPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUserId(user.id)

            const [membersRes, rolesRes, selfRes] = await Promise.all([
                supabase.from('users').select('id, full_name, email, created_at, role:roles(id, name)').order('created_at'),
                supabase.from('roles').select('id, name, description').order('name'),
                supabase.from('users').select('role:roles(name)').eq('id', user.id).single(),
            ])

            if (membersRes.data) {
                // Supabase returns role as an array for joined tables — normalise to object
                const normalised = (membersRes.data as unknown[]).map((m: unknown) => {
                    const row = m as Record<string, unknown>
                    const roleArr = row.role as Array<{ id: string; name: string }>
                    return { ...row, role: roleArr?.[0] ?? null } as TeamMember
                })
                setMembers(normalised)
            }
            if (rolesRes.data) setRoles(rolesRes.data)
            if (selfRes.data) setCurrentUserRole((selfRes.data.role as any)?.name ?? null)
            setLoading(false)
        }
        load()
    }, [])

    async function changeRole(memberId: string, newRoleId: string, newRoleName: string) {
        setSavingId(memberId)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('users')
                .update({ role_id: newRoleId })
                .eq('id', memberId)
            if (error) throw error

            setMembers(prev => prev.map(m =>
                m.id === memberId
                    ? { ...m, role: { id: newRoleId, name: newRoleName } }
                    : m
            ))
            toast.success(`Role updated to ${newRoleName}`)
        } catch {
            toast.error('Failed to update role')
        } finally {
            setSavingId(null)
        }
    }

    const isAdmin = currentUserRole === 'admin'

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold">Team</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    {members.length} member{members.length !== 1 ? 's' : ''} in your workspace.
                    {isAdmin && ' As an admin you can change member roles.'}
                </p>
            </div>

            {/* Role legend */}
            <div className="flex flex-wrap gap-3">
                {roles.map(role => (
                    <div key={role.id} className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium',
                        ROLE_COLORS[role.name] ?? 'bg-muted text-muted-foreground border-muted'
                    )}>
                        <Shield className="h-3 w-3" />
                        <span className="capitalize">{role.name}</span>
                        {role.description && (
                            <span className="opacity-60 font-normal">— {role.description}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Members table */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_120px] px-5 py-3 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Member</span>
                    <span>Role</span>
                    <span>Joined</span>
                </div>
                <div className="divide-y">
                    {members.map(member => {
                        const roleName = member.role?.name ?? 'No role'
                        const isSelf = member.id === currentUserId
                        return (
                            <div key={member.id} className="grid grid-cols-[1fr_140px_120px] items-center px-5 py-4">
                                {/* Avatar + info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-[#056BFC] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                        {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {member.full_name || member.email}
                                            {isSelf && <span className="ml-2 text-[10px] text-muted-foreground font-normal">(you)</span>}
                                        </p>
                                        {member.full_name && (
                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Role selector or badge */}
                                <div>
                                    {isAdmin && !isSelf ? (
                                        <RoleDropdown
                                            currentRoleId={member.role?.id ?? ''}
                                            currentRoleName={roleName}
                                            roles={roles}
                                            saving={savingId === member.id}
                                            onChange={(id, name) => changeRole(member.id, id, name)}
                                        />
                                    ) : (
                                        <span className={cn(
                                            'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border',
                                            ROLE_COLORS[roleName] ?? 'bg-muted text-muted-foreground border-muted'
                                        )}>
                                            <Shield className="h-3 w-3" />
                                            <span className="capitalize">{roleName}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Joined date */}
                                <span className="text-xs text-muted-foreground">
                                    {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {!isAdmin && (
                <p className="text-xs text-muted-foreground">
                    Contact an admin to change role assignments.
                </p>
            )}
        </div>
    )
}

function RoleDropdown({ currentRoleId, currentRoleName, roles, saving, onChange }: {
    currentRoleId: string
    currentRoleName: string
    roles: Role[]
    saving: boolean
    onChange: (id: string, name: string) => void
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={saving}
                className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors',
                    ROLE_COLORS[currentRoleName] ?? 'bg-muted text-muted-foreground border-muted',
                    'hover:opacity-80'
                )}
            >
                {saving
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Shield className="h-3 w-3" />
                }
                <span className="capitalize">{currentRoleName}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 top-full left-0 mt-1 rounded-lg border bg-popover shadow-lg py-1 min-w-[140px]">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => { onChange(role.id, role.name); setOpen(false) }}
                                className={cn(
                                    'flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors',
                                    currentRoleId === role.id ? 'font-semibold text-[#056BFC]' : ''
                                )}
                            >
                                <Shield className="h-3 w-3" />
                                <span className="capitalize">{role.name}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
