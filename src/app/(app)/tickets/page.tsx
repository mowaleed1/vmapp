import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SlaIndicator } from '@/components/SlaIndicator'
import {
    Plus, Ticket, Filter,
    AlertCircle, Clock, CheckCircle2, XCircle,
    ChevronLeft, ChevronRight
} from 'lucide-react'

import { TicketsListClient } from './TicketsListClient'
import { TicketSaveViewDialog } from '@/components/TicketSaveViewDialog'

export const metadata = { title: 'Tickets — ValueMomentum' }

const PAGE_SIZE = 20

export default async function TicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; priority?: string; page?: string; sort?: string; dir?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { status, priority, page: pageStr, sort = 'created_at', dir = 'desc' } = await searchParams
    const page = Math.max(1, parseInt(pageStr ?? '1', 10))
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
        .from('tickets')
        .select(`
      id, title, priority, status, category, created_at, updated_at, ticket_number, sla_breach_at,
      requester:users!tickets_requester_id_fkey(full_name, email),
      assigned:users!tickets_assigned_to_fkey(full_name, email)
    `, { count: 'exact' })
        .order(sort, { ascending: dir === 'asc' })
        .range(from, to)

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data: tickets, count } = await query

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

    const [
        { count: openCount },
        { count: inProgressCount },
        { count: resolvedCount }
    ] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved')
    ])

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tickets</h2>
                    <p className="text-muted-foreground text-sm">{count ?? 0} total tickets</p>
                </div>
                <Link href="/tickets/new">
                    <Button className="bg-[#056BFC] hover:bg-[#0455CC] text-white font-semibold">
                        <Plus className="mr-2 h-4 w-4" /> New Ticket
                    </Button>
                </Link>
            </div>

            {/* Status summary bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatusSummaryCard href="/tickets?status=open" label="Open" count={openCount ?? 0} color="#056BFC" active={status === 'open'} />
                <StatusSummaryCard href="/tickets?status=in_progress" label="In Progress" count={inProgressCount ?? 0} color="#f59e0b" active={status === 'in_progress'} />
                <StatusSummaryCard href="/tickets?status=resolved" label="Resolved" count={resolvedCount ?? 0} color="#10b981" active={status === 'resolved'} />
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
                    <div className="flex items-center ml-1">
                        <Link href="/tickets" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                            Clear filters
                        </Link>
                        <TicketSaveViewDialog
                            currentFilters={{
                                ...(status && { status }),
                                ...(priority && { priority }),
                                ...(sort !== 'created_at' && { sort }),
                                ...(dir !== 'desc' && { dir })
                            }}
                        />
                    </div>
                )}
            </div>

            <TicketsListClient
                tickets={tickets ?? []}
                count={count ?? 0}
                totalPages={totalPages}
                page={page}
                status={status}
                priority={priority}
                sort={sort}
                dir={dir}
            />
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
