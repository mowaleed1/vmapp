'use client'

import { useEffect, useState } from 'react'
import { getSlaStatus, formatSlaRemaining } from '@/lib/sla'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    breachAt: string | null
    priority: string
    status: string     // resolved/closed tickets don't show SLA
    compact?: boolean  // for ticket list row
}

const CONFIG = {
    ok: {
        label: 'On track',
        class: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        icon: Clock,
    },
    warning: {
        label: 'At risk',
        class: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: AlertTriangle,
    },
    breached: {
        label: 'Breached',
        class: 'text-red-600 bg-red-50 border-red-200',
        icon: AlertTriangle,
    },
    none: {
        label: '—',
        class: 'text-muted-foreground bg-muted border-muted',
        icon: Clock,
    },
}

export function SlaIndicator({ breachAt, priority, status, compact = false }: Props) {
    const [remaining, setRemaining] = useState(formatSlaRemaining(breachAt))
    const [slaStatus, setSlaStatus] = useState(getSlaStatus(breachAt))

    // Update every minute
    useEffect(() => {
        const tick = () => {
            setRemaining(formatSlaRemaining(breachAt))
            setSlaStatus(getSlaStatus(breachAt))
        }
        tick()
        const interval = setInterval(tick, 60_000)
        return () => clearInterval(interval)
    }, [breachAt])

    // Don't show SLA for resolved/closed tickets
    if (status === 'resolved' || status === 'closed') {
        return compact ? null : (
            <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Met</span>
            </div>
        )
    }

    const cfg = CONFIG[slaStatus]
    const Icon = cfg.icon

    if (compact) {
        return (
            <span className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
                cfg.class
            )}>
                <Icon className="h-3 w-3" />
                {remaining}
            </span>
        )
    }

    return (
        <div className={cn(
            'flex items-center justify-between rounded-lg border px-3 py-2.5',
            cfg.class
        )}>
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <div>
                    <p className="text-xs font-semibold">{cfg.label}</p>
                    <p className="text-xs opacity-80">
                        {slaStatus === 'breached' ? 'SLA has been breached' : `${remaining} remaining`}
                    </p>
                </div>
            </div>
        </div>
    )
}
