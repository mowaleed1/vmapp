'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
    { value: 'open', label: 'Open', icon: AlertCircle, class: 'text-[#056BFC]' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, class: 'text-amber-500' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle2, class: 'text-emerald-500' },
    { value: 'closed', label: 'Closed', icon: XCircle, class: 'text-muted-foreground' },
]

export function TicketStatusSelect({
    ticketId,
    currentStatus,
}: {
    ticketId: string
    currentStatus: string
}) {
    const router = useRouter()
    const [status, setStatus] = useState(currentStatus)
    const [saving, setSaving] = useState(false)

    async function handleChange(newStatus: string) {
        setSaving(true)
        setStatus(newStatus)
        const supabase = createClient()
        const { error } = await supabase
            .from('tickets')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', ticketId)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('ticket_activity_logs').insert({
                    ticket_id: ticketId,
                    actor_id: user.id,
                    action: 'status_changed',
                    old_value: { status: currentStatus },
                    new_value: { status: newStatus }
                })
            }
        }

        if (error) {
            toast.error('Failed to update status')
            setStatus(currentStatus)
            setSaving(false)
            return
        }

        // Fire email notification (best-effort, don't block UI)
        fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'status_changed', ticketId, newStatus }),
        }).catch(() => { /* silent */ })

        toast.success(`Status changed to ${newStatus.replace('_', ' ')}`)
        setSaving(false)
        router.refresh()
    }

    const current = STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[0]
    const Icon = current.icon

    return (
        <Select value={status} onValueChange={handleChange} disabled={saving}>
            <SelectTrigger className={cn('w-44 font-medium', current.class)}>
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map(opt => {
                    const OIcon = opt.icon
                    return (
                        <SelectItem key={opt.value} value={opt.value}>
                            <div className={cn('flex items-center gap-2', opt.class)}>
                                <OIcon className="h-4 w-4" />
                                {opt.label}
                            </div>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}
