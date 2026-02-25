'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
    { value: 'open', label: '🔵 Open' },
    { value: 'in_progress', label: '🟡 In Progress' },
    { value: 'resolved', label: '🟢 Resolved' },
    { value: 'closed', label: '⚫ Closed' },
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

        setSaving(false)
        if (error) {
            toast.error('Failed to update status')
            setStatus(currentStatus)
        } else {
            toast.success('Status updated')
            router.refresh()
        }
    }

    return (
        <Select value={status} onValueChange={handleChange} disabled={saving}>
            <SelectTrigger className="w-40">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
