'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, ChevronDown } from 'lucide-react'
import { VMLoader } from '@/components/ui/vm-loader'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Agent {
    id: string
    full_name: string | null
    email: string
}

interface Props {
    ticketId: string
    currentAssignedId: string | null
    currentAssignedName?: string | null
}

export function TicketAssignSelect({ ticketId, currentAssignedId, currentAssignedName }: Props) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [assignedId, setAssignedId] = useState<string | null>(currentAssignedId)
    const [saving, setSaving] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        async function loadAgents() {
            const supabase = createClient()
            // Load all users who have agent or admin roles
            const { data } = await supabase
                .from('users')
                .select('id, full_name, email')
                .order('full_name', { ascending: true })
            if (data) setAgents(data)
        }
        loadAgents()
    }, [])

    const currentAgent = agents.find(a => a.id === assignedId)
    const displayName = currentAgent
        ? (currentAgent.full_name || currentAgent.email)
        : (currentAssignedName ?? 'Unassigned')

    async function assign(agentId: string | null) {
        setSaving(true)
        setOpen(false)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('tickets')
                .update({
                    assigned_to: agentId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ticketId)

            if (!error) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await supabase.from('ticket_activity_logs').insert({
                        ticket_id: ticketId,
                        actor_id: user.id,
                        action: 'assignment_changed',
                        old_value: { assigned_to: currentAssignedId },
                        new_value: { assigned_to: agentId }
                    })
                }
            }

            if (error) throw error

            setAssignedId(agentId)
            const name = agents.find(a => a.id === agentId)?.full_name
            // Fire assignment notification (best-effort)
            fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'ticket_assigned', ticketId }),
            }).catch(() => { /* silent */ })
            toast.success(agentId ? `Assigned to ${name ?? 'agent'}` : 'Ticket unassigned')
        } catch (err: unknown) {
            toast.error('Failed to assign ticket')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={saving}
                className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm transition-colors text-left',
                    'hover:border-[#056BFC]/40 hover:bg-[#056BFC]/5',
                    open ? 'border-[#056BFC]/40 bg-[#056BFC]/5' : 'border-border bg-background'
                )}
            >
                {saving
                    ? <VMLoader className="h-4 w-4 shrink-0" />
                    : <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
                <span className={cn(
                    'flex-1 truncate',
                    assignedId ? 'text-foreground' : 'text-muted-foreground'
                )}>
                    {displayName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg py-1 max-h-56 overflow-y-auto">
                        <button
                            onClick={() => assign(null)}
                            className={cn(
                                'flex items-center w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left',
                                !assignedId ? 'text-[#056BFC] font-medium' : 'text-muted-foreground'
                            )}
                        >
                            Unassigned
                        </button>
                        <div className="h-px bg-border mx-2 my-1" />
                        {agents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => assign(agent.id)}
                                className={cn(
                                    'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left',
                                    assignedId === agent.id ? 'text-[#056BFC] font-medium bg-[#056BFC]/5' : ''
                                )}
                            >
                                <div className="h-6 w-6 rounded-full bg-[#056BFC] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                                    {(agent.full_name || agent.email).slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate">{agent.full_name || agent.email}</p>
                                    {agent.full_name && (
                                        <p className="text-[10px] text-muted-foreground truncate">{agent.email}</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
