'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ticket, AlertCircle, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SlaIndicator } from '@/components/SlaIndicator'
import { TicketBulkActions } from '@/components/TicketBulkActions'
import { cn } from '@/lib/utils'

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
    high: { label: 'High', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    medium: { label: 'Medium', class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    low: { label: 'Low', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
} as const

const STATUS_CONFIG = {
    open: { label: 'Open', icon: AlertCircle, class: 'text-[#056BFC]' },
    in_progress: { label: 'In Progress', icon: Clock, class: 'text-amber-500' },
    resolved: { label: 'Resolved', icon: CheckCircle2, class: 'text-emerald-500' },
    closed: { label: 'Closed', icon: XCircle, class: 'text-muted-foreground' },
} as const

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export interface TicketsListClientProps {
    tickets: any[]
    count: number
    totalPages: number
    page: number
    status?: string
    priority?: string
    sort: string
    dir: string
}

export function TicketsListClient({
    tickets, count, totalPages, page, status, priority, sort, dir
}: TicketsListClientProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    function pageUrl(p: number) {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        if (priority) params.set('priority', priority)
        if (sort !== 'created_at') params.set('sort', sort)
        if (dir !== 'desc') params.set('dir', dir)
        params.set('page', String(p))
        return `/tickets?${params.toString()}`
    }

    function sortUrl(col: string) {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        if (priority) params.set('priority', priority)
        params.set('sort', col)
        params.set('dir', sort === col && dir === 'asc' ? 'desc' : 'asc')
        return `/tickets?${params.toString()}`
    }

    function SortArrow({ col }: { col: string }) {
        if (sort !== col) return <span className="opacity-20">↕</span>
        return <span>{dir === 'asc' ? '↑' : '↓'}</span>
    }

    return (
        <>
            <div className="rounded-xl border bg-card overflow-hidden">
                {!tickets || tickets.length === 0 ? (
                    <div className="py-20 text-center">
                        <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="font-semibold text-lg">No tickets found</p>
                        <p className="text-muted-foreground text-sm mt-1 mb-6">
                            {status || priority ? 'Try clearing your filters.' : 'Upload audio or create a ticket manually.'}
                        </p>
                        <Link href="/tickets/new">
                            <Button className="bg-[#056BFC] hover:bg-[#0455CC] text-white">
                                <Plus className="mr-2 h-4 w-4" /> Create first ticket
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Table header with sort and bulk select */}
                        <div className="hidden md:flex items-center gap-4 px-5 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="w-8 shrink-0 flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-input text-[#056BFC] focus:ring-[#056BFC]"
                                    checked={selectedIds.length > 0 && selectedIds.length === tickets.length}
                                    ref={input => {
                                        if (input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < tickets.length
                                    }}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(tickets.map((t: any) => t.id))
                                        else setSelectedIds([])
                                    }}
                                />
                            </div>
                            <Link href={sortUrl('title')} className="flex-1 flex items-center gap-1 hover:text-foreground transition-colors">
                                Ticket <SortArrow col="title" />
                            </Link>
                            <Link href={sortUrl('priority')} className="w-[100px] flex items-center gap-1 hover:text-foreground transition-colors">
                                Priority <SortArrow col="priority" />
                            </Link>
                            <Link href={sortUrl('status')} className="w-[110px] flex items-center gap-1 hover:text-foreground transition-colors">
                                Status <SortArrow col="status" />
                            </Link>
                            <span className="w-[100px]">SLA</span>
                            <span className="w-[110px]">Assigned</span>
                            <Link href={sortUrl('created_at')} className="w-[90px] flex items-center gap-1 hover:text-foreground transition-colors text-right justify-end">
                                Created <SortArrow col="created_at" />
                            </Link>
                        </div>

                        {/* Bulk actions bar */}
                        {selectedIds.length > 0 && (
                            <div className="bg-[#056BFC]/5 border-b px-5 py-3 flex items-center justify-between text-sm animate-in slide-in-from-top-2">
                                <span className="font-semibold text-[#056BFC]">{selectedIds.length} selected</span>
                                <TicketBulkActions selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
                            </div>
                        )}

                        {/* Rows */}
                        <div className="divide-y relative">
                            {tickets.map((ticket: any) => {
                                const pCfg = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
                                const sCfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open
                                const StatusIcon = sCfg.icon
                                const isSelected = selectedIds.includes(ticket.id)
                                return (
                                    <div
                                        key={ticket.id}
                                        className={cn(
                                            "flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-5 py-4 transition-colors group relative",
                                            isSelected ? "bg-[#056BFC]/5" : "hover:bg-muted/40"
                                        )}
                                    >
                                        <div className="w-8 shrink-0 flex items-center justify-center pt-1 md:pt-0">
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-[#056BFC] focus:ring-[#056BFC] relative z-10 cursor-pointer"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds([...selectedIds, ticket.id])
                                                    else setSelectedIds(selectedIds.filter(id => id !== ticket.id))
                                                }}
                                            />
                                        </div>

                                        <Link href={`/tickets/${ticket.id}`} className="absolute inset-0 z-0" />

                                        {/* Title + ID */}
                                        <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                                            <p className="font-medium truncate group-hover:text-[#056BFC] transition-colors pointer-events-auto">
                                                <Link href={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {ticket.ticket_number ?? `VM-${ticket.id.slice(0, 6).toUpperCase()}`}
                                                </span>
                                                {ticket.category && (
                                                    <span className="text-xs text-muted-foreground capitalize">· {ticket.category.replace('_', ' ')}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border w-fit md:w-[100px] shrink-0 text-center relative z-10 pointer-events-none', pCfg.class)}>
                                            {pCfg.label}
                                        </span>

                                        {/* Status */}
                                        <div className={cn('flex items-center gap-1.5 text-xs font-medium md:w-[110px] shrink-0 relative z-10 pointer-events-none', sCfg.class)}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {sCfg.label}
                                        </div>

                                        {/* SLA */}
                                        <div className="md:w-[100px] shrink-0 relative z-10">
                                            <SlaIndicator
                                                breachAt={ticket.sla_breach_at ?? null}
                                                priority={ticket.priority}
                                                status={ticket.status}
                                                compact
                                            />
                                        </div>

                                        {/* Assigned */}
                                        <span className="text-sm text-muted-foreground truncate md:w-[110px] shrink-0 relative z-10 pointer-events-none">
                                            {(ticket.assigned as any)?.full_name ?? (ticket.assigned as any)?.email ?? '—'}
                                        </span>

                                        {/* Created */}
                                        <span className="text-xs text-muted-foreground md:w-[90px] text-right shrink-0 relative z-10 pointer-events-none">
                                            {timeAgo(ticket.created_at)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
                    <p className="text-muted-foreground">
                        Page {page} of {totalPages} · {count} tickets
                    </p>
                    <div className="flex gap-2">
                        {page > 1 ? (
                            <Link href={pageUrl(page - 1)}>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="gap-1">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                        )}

                        {/* Page numbers */}
                        <div className="flex gap-1 hidden sm:flex">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                                return (
                                    <Link key={p} href={pageUrl(p)}>
                                        <Button
                                            variant={p === page ? 'default' : 'outline'}
                                            size="sm"
                                            className={p === page ? 'bg-[#056BFC] text-white hover:bg-[#0455CC] w-9' : 'w-9'}
                                        >
                                            {p}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </div>

                        {page < totalPages ? (
                            <Link href={pageUrl(page + 1)}>
                                <Button variant="outline" size="sm" className="gap-1">
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="gap-1">
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
