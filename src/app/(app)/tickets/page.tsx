import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
    Plus, Ticket, Search, Filter,
    AlertCircle, Clock, CheckCircle2, XCircle
} from 'lucide-react'

export const metadata = { title: 'Tickets — VMApp' }

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
    high: { label: 'High', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    medium: { label: 'Medium', class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    low: { label: 'Low', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
} as const

const STATUS_CONFIG = {
    open: { label: 'Open', icon: AlertCircle, class: 'text-[#056BFC]' },
    in_progress: { label: 'In Progress', icon: Clock, class: 'text-[#FABD00]' },
    resolved: { label: 'Resolved', icon: CheckCircle2, class: 'text-[#3FD534]' },
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

export default async function TicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; priority?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { status, priority } = await searchParams

    let query = supabase
        .from('tickets')
        .select(`
      id, title, priority, status, category, created_at, updated_at,
      requester:users!tickets_requester_id_fkey(full_name, email),
      assigned:users!tickets_assigned_to_fkey(full_name, email)
    `)
        .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data: tickets } = await query

    const { count: openCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
    const { count: inProgressCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
    const { count: resolvedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tickets</h2>
                    <p className="text-muted-foreground text-sm">{tickets?.length ?? 0} tickets found</p>
                </div>
                <Link href="/tickets/new">
                    <Button className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white font-semibold">
                        <Plus className="mr-2 h-4 w-4" /> New Ticket
                    </Button>
                </Link>
            </div>

            {/* Status summary bar */}
            <div className="grid grid-cols-3 gap-3">
                <StatusSummaryCard href="/tickets?status=open" label="Open" count={openCount ?? 0} color="#056BFC" active={status === 'open'} />
                <StatusSummaryCard href="/tickets?status=in_progress" label="In Progress" count={inProgressCount ?? 0} color="#FABD00" active={status === 'in_progress'} />
                <StatusSummaryCard href="/tickets?status=resolved" label="Resolved" count={resolvedCount ?? 0} color="#3FD534" active={status === 'resolved'} />
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Filter className="h-4 w-4" /> Priority:
                </span>
                {(['', 'critical', 'high', 'medium', 'low'] as const).map((p) => (
                    <Link
                        key={p}
                        href={p ? `/tickets${status ? `?status=${status}&` : '?'}priority=${p}` : (status ? `/tickets?status=${status}` : '/tickets')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${priority === p || (!priority && p === '')
                                ? 'bg-[#056BFC] text-white border-[#056BFC]'
                                : 'border-border hover:border-[#056BFC]/50 hover:bg-[#056BFC]/5'
                            }`}
                    >
                        {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All'}
                    </Link>
                ))}
                {(status || priority) && (
                    <Link href="/tickets" className="text-xs text-muted-foreground hover:text-foreground ml-1 underline underline-offset-2">
                        Clear filters
                    </Link>
                )}
            </div>

            {/* Ticket list */}
            <div className="rounded-xl border bg-card overflow-hidden">
                {!tickets || tickets.length === 0 ? (
                    <div className="py-20 text-center">
                        <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="font-semibold text-lg">No tickets yet</p>
                        <p className="text-muted-foreground text-sm mt-1 mb-6">
                            Upload audio or create a ticket manually to get started.
                        </p>
                        <Link href="/tickets/new">
                            <Button className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white">
                                <Plus className="mr-2 h-4 w-4" /> Create first ticket
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-[1fr_120px_120px_140px_120px] gap-4 px-5 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <span>Ticket</span>
                            <span>Priority</span>
                            <span>Status</span>
                            <span>Assigned</span>
                            <span>Created</span>
                        </div>

                        {/* Rows */}
                        <div className="divide-y">
                            {tickets.map((ticket: any) => {
                                const pCfg = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
                                const sCfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open
                                const StatusIcon = sCfg.icon
                                return (
                                    <Link
                                        key={ticket.id}
                                        href={`/tickets/${ticket.id}`}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_140px_120px] gap-2 md:gap-4 items-center px-5 py-4 hover:bg-muted/40 transition-colors group"
                                    >
                                        {/* Title + ID + category */}
                                        <div className="min-w-0">
                                            <p className="font-medium truncate group-hover:text-[#056BFC] transition-colors">
                                                {ticket.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    TKT-{ticket.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                {ticket.category && (
                                                    <span className="text-xs text-muted-foreground capitalize">· {ticket.category.replace('_', ' ')}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border w-fit ${pCfg.class}`}>
                                            {pCfg.label}
                                        </span>

                                        {/* Status */}
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${sCfg.class}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {sCfg.label}
                                        </div>

                                        {/* Assigned */}
                                        <span className="text-sm text-muted-foreground truncate">
                                            {(ticket.assigned as any)?.full_name ?? (ticket.assigned as any)?.email ?? '—'}
                                        </span>

                                        {/* Created */}
                                        <span className="text-xs text-muted-foreground">{timeAgo(ticket.created_at)}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StatusSummaryCard({
    href, label, count, color, active,
}: {
    href: string; label: string; count: number; color: string; active: boolean
}) {
    return (
        <Link
            href={href}
            className={`p-4 rounded-xl border transition-all ${active ? 'border-2 shadow-sm' : 'hover:border-muted-foreground/30'
                }`}
            style={active ? { borderColor: color } : undefined}
        >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{count}</p>
        </Link>
    )
}
