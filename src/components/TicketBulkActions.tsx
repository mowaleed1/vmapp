'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TicketBulkExport } from './TicketBulkExport'
import { toast } from 'sonner'
import { VMLoader } from '@/components/ui/vm-loader'

export function TicketBulkActions({ selectedIds, onClear }: { selectedIds: string[], onClear: () => void }) {
    const router = useRouter()
    const [updating, setUpdating] = useState(false)
    const [agents, setAgents] = useState<{ id: string, email: string, full_name: string | null }[]>([])

    useEffect(() => {
        async function fetchAgents() {
            const supabase = createClient()
            const { data } = await supabase
                .from('users')
                .select('id, email, full_name')
                .order('full_name', { ascending: true })
            if (data) setAgents(data)
        }
        fetchAgents()
    }, [])

    async function handleStatus(val: string) {
        if (selectedIds.length === 0) return
        setUpdating(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('tickets')
            .update({ status: val, updated_at: new Date().toISOString() })
            .in('id', selectedIds)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const logs = selectedIds.map(id => ({
                    ticket_id: id,
                    actor_id: user.id,
                    action: 'status_changed',
                    new_value: { status: val }
                }))
                await supabase.from('ticket_activity_logs').insert(logs)
            }
            toast.success(`Updated ${selectedIds.length} tickets`)
            onClear()
            router.refresh()
        } else {
            toast.error('Failed to update status')
        }
        setUpdating(false)
    }

    async function handleAssign(val: string) {
        if (selectedIds.length === 0) return
        setUpdating(true)
        const supabase = createClient()

        const agentId = val === 'unassigned' ? null : val

        const { error } = await supabase
            .from('tickets')
            .update({ assigned_to: agentId, updated_at: new Date().toISOString() })
            .in('id', selectedIds)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const logs = selectedIds.map(id => ({
                    ticket_id: id,
                    actor_id: user.id,
                    action: 'assignment_changed',
                    new_value: { assigned_to: agentId }
                }))
                await supabase.from('ticket_activity_logs').insert(logs)
            }
            toast.success(`Assigned ${selectedIds.length} tickets`)
            onClear()
            router.refresh()
        } else {
            toast.error('Failed to assign tickets')
        }
        setUpdating(false)
    }

    return (
        <div className="flex items-center gap-2">
            <Select onValueChange={handleStatus} disabled={updating} value="">
                <SelectTrigger className="h-8 w-[130px] bg-white text-xs">
                    <SelectValue placeholder="Set Status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={handleAssign} disabled={updating} value="">
                <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
                    <SelectValue placeholder="Assign To..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <TicketBulkExport ticketIds={selectedIds} />

            <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground ml-1 h-8" disabled={updating}>
                Cancel
            </Button>
            {updating && <VMLoader className="h-5 w-5 ml-2" />}
        </div>
    )
}
