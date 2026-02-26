'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
    initialOpen: number
    initialInProgress: number
    initialResolved: number
    initialCritical: number
}

export function RealtimeStats({ initialOpen, initialInProgress, initialResolved, initialCritical }: Props) {
    const [open, setOpen] = useState(initialOpen)
    const [inProgress, setInProgress] = useState(initialInProgress)
    const [resolved, setResolved] = useState(initialResolved)
    const [critical, setCritical] = useState(initialCritical)
    const [pulse, setPulse] = useState(false)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('realtime-ticket-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, async () => {
                // Re-fetch counts on any ticket change
                const [o, ip, r, crit] = await Promise.all([
                    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
                    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
                    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'critical').in('status', ['open', 'in_progress']),
                ])
                setOpen(o.count ?? 0)
                setInProgress(ip.count ?? 0)
                setResolved(r.count ?? 0)
                setCritical(crit.count ?? 0)

                // Visual pulse feedback
                setPulse(true)
                setTimeout(() => setPulse(false), 1000)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className={`inline-flex items-center gap-1.5 transition-colors ${pulse ? 'text-[#056BFC]' : ''}`}>
                <span className={`w-2 h-2 rounded-full bg-[#056BFC] ${pulse ? 'animate-ping' : ''}`} />
                <span className="font-medium text-foreground">{open}</span> open
            </span>
            <span>·</span>
            <span><span className="font-medium text-foreground">{inProgress}</span> in progress</span>
            <span>·</span>
            <span><span className="font-medium text-foreground">{resolved}</span> resolved</span>
            {critical > 0 && (
                <>
                    <span>·</span>
                    <span className="text-red-500 font-medium">{critical} critical 🔴</span>
                </>
            )}
            <span className="ml-auto text-[10px] opacity-60">● Live</span>
        </div>
    )
}
