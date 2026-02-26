'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, PlusCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityLog {
    id: string
    action: string
    old_value: any
    new_value: any
    created_at: string
    actor: { full_name: string | null; email: string } | null
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    ticket_created: { icon: PlusCircle, color: 'text-[#056BFC] bg-[#056BFC]/10 border-[#056BFC]/20', label: 'Ticket created' },
    status_changed: { icon: CheckCircle2, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Status changed' },
    assignment_changed: { icon: UserPlus, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'Assignment changed' },
}

function formatValue(key: string, val: any) {
    if (!val) return '—'
    if (key === 'status') return String(val).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    if (key === 'assigned_to') return 'a new agent'
    return String(val)
}

function timeAgoLong(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function TicketActivityLog({ ticketId }: { ticketId: string }) {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        let mounted = true

        async function fetchLogs() {
            setLoading(true)
            const { data } = await supabase
                .from('ticket_activity_logs')
                .select('id, action, old_value, new_value, created_at, actor:users!ticket_activity_logs_actor_id_fkey(full_name, email)')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: false })

            if (mounted && data) {
                // Supabase joins can return arrays, normalise to single object
                const normalised = (data as any[]).map(r => ({
                    ...r,
                    actor: Array.isArray(r.actor) ? r.actor[0] : r.actor
                }))
                setLogs(normalised as ActivityLog[])
            }
            if (mounted) setLoading(false)
        }

        fetchLogs()

        // Realtime subscription
        const channel = supabase.channel(`ticket_activity_${ticketId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_activity_logs', filter: `ticket_id=eq.${ticketId}` }, fetchLogs)
            .subscribe()

        return () => {
            mounted = false
            supabase.removeChannel(channel)
        }
    }, [ticketId])

    if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>

    if (logs.length === 0) return null

    return (
        <div className="rounded-xl border bg-card p-5 mt-6">
            <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                Activity Log
                <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">{logs.length}</span>
            </h3>

            <div className="space-y-4">
                {logs.map(log => {
                    const cfg = ACTION_CONFIG[log.action] ?? { icon: PlusCircle, color: 'text-muted-foreground bg-muted border-transparent', label: log.action }
                    const Icon = cfg.icon
                    const actorName = log.actor?.full_name ?? log.actor?.email ?? 'System'

                    let detailHtml = null
                    if (log.action === 'status_changed') {
                        detailHtml = <span className="text-foreground font-medium">{formatValue('status', (log.new_value as any)?.status)}</span>
                    } else if (log.action === 'assignment_changed') {
                        const newAgent = (log.new_value as any)?.assigned_to
                        detailHtml = newAgent
                            ? <>to <span className="text-foreground font-medium">an agent</span></>
                            : <span className="text-foreground font-medium">Unassigned</span>
                    }

                    return (
                        <div key={log.id} className="flex gap-3 text-sm">
                            <div className={cn('h-7 w-7 rounded-full flex items-center justify-center border shrink-0', cfg.color)}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 pt-1.5">
                                <p className="text-muted-foreground leading-tight">
                                    <span className="text-foreground font-medium">{actorName}</span>
                                    {' '}{cfg.label.toLowerCase()}{' '}
                                    {detailHtml}
                                </p>
                                <p className="text-xs text-muted-foreground opacity-60 mt-0.5">
                                    {timeAgoLong(log.created_at)}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
