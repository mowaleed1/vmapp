import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Ticket, UploadCloud, Clock, CheckCircle2, FileText, Plus, Search, List } from 'lucide-react'
import { DashboardCharts } from '@/components/DashboardCharts'
import { RealtimeStats } from '@/components/RealtimeStats'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — ValueMomentum' }

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export default async function AgentDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
    const firstName = profile?.full_name?.split(' ')[0] || 'Agent'

    const { count: openCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
    const { count: inProgressCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
    const { count: resolvedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved')
    const { count: closedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed')
    const { count: criticalCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'critical')
    const { count: highCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'high')
    const { count: mediumCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'medium')
    const { count: lowCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'low')

    const now = new Date()
    const { data: allTickets } = await supabase.from('tickets').select('created_at').gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (13 - i))
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const count = (allTickets ?? []).filter(t => { const td = new Date(t.created_at); return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate() }).length
        return { date: label, count }
    })

    const { data: recentTickets } = await supabase.from('tickets').select('id, title, priority, status, created_at, ticket_number').order('created_at', { ascending: false }).limit(6)

    const greetingHour = new Date().getHours()
    const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{greeting}, {firstName}</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Here is your support overview for today.</p>
                </div>
                <Link
                    href="/tickets/new"
                    className="flex items-center gap-2 px-4 py-2 bg-[#056BFC] hover:bg-[#0455CC] text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Ticket
                </Link>
            </div>

            {/* Realtime stats */}
            <div>
                <RealtimeStats
                    initialOpen={openCount ?? 0}
                    initialInProgress={inProgressCount ?? 0}
                    initialResolved={resolvedCount ?? 0}
                    initialCritical={0}
                />
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Open" value={openCount ?? 0} icon={<Ticket className="h-4 w-4 text-[#056BFC]" />} accent="#056BFC" href="/tickets?status=open" />
                <StatCard label="In Progress" value={inProgressCount ?? 0} icon={<Clock className="h-4 w-4 text-amber-500" />} accent="#F59E0B" href="/tickets?status=in_progress" />
                <StatCard label="Resolved" value={resolvedCount ?? 0} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} accent="#10B981" href="/tickets?status=resolved" />
                <StatCard label="Total Uploads" value={0} icon={<UploadCloud className="h-4 w-4 text-[#056BFC]" />} accent="#056BFC" href="/upload" />
            </div>

            {/* Charts */}
            <DashboardCharts
                byStatus={[
                    { name: 'Open', value: openCount ?? 0 },
                    { name: 'In Progress', value: inProgressCount ?? 0 },
                    { name: 'Resolved', value: resolvedCount ?? 0 },
                    { name: 'Closed', value: closedCount ?? 0 },
                ]}
                byPriority={[
                    { name: 'Critical', value: criticalCount ?? 0 },
                    { name: 'High', value: highCount ?? 0 },
                    { name: 'Medium', value: mediumCount ?? 0 },
                    { name: 'Low', value: lowCount ?? 0 },
                ]}
                byDay={last14}
            />

            {/* Recent Tickets */}
            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="font-semibold text-sm">Recent Tickets</h3>
                    <Link href="/tickets" className="text-xs text-[#056BFC] hover:underline font-medium">View all</Link>
                </div>
                {!recentTickets || recentTickets.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                        <Ticket className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No tickets yet</p>
                        <p className="text-xs mt-1">Upload audio or create a ticket to get started.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {recentTickets.map((ticket) => (
                            <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center px-5 py-3 hover:bg-muted/40 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-[#056BFC] transition-colors">{ticket.title}</p>
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                        {ticket.ticket_number ?? `VM-${ticket.id.slice(0, 6).toUpperCase()}`} · {timeAgo(ticket.created_at)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                    <PriorityBadge priority={ticket.priority} />
                                    <StatusBadge status={ticket.status} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions — professional grid, no emojis */}
            <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <QuickAction href="/upload" label="Upload Audio" icon={UploadCloud} desc="Transcribe & create ticket" />
                    <QuickAction href="/tickets/new" label="New Ticket" icon={Plus} desc="Manual ticket creation" />
                    <QuickAction href="/search" label="Search" icon={Search} desc="Find existing tickets" />
                    <QuickAction href="/tickets" label="All Tickets" icon={List} desc="Browse & filter tickets" />
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, accent, href }: { label: string; value: number; icon: React.ReactNode; accent: string; href: string }) {
    return (
        <Link href={href} className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow block group">
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <div className="p-1.5 rounded-md bg-muted/60">{icon}</div>
            </div>
            <p className="text-3xl font-bold" style={{ color: accent }}>{value}</p>
        </Link>
    )
}

function PriorityBadge({ priority }: { priority: string }) {
    const config: Record<string, { label: string; class: string }> = {
        critical: { label: 'Critical', class: 'bg-red-50 text-red-600 border border-red-100' },
        high: { label: 'High', class: 'bg-orange-50 text-orange-600 border border-orange-100' },
        medium: { label: 'Medium', class: 'bg-amber-50 text-amber-600 border border-amber-100' },
        low: { label: 'Low', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    }
    const c = config[priority] ?? config.medium
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.class}`}>{c.label}</span>
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; class: string }> = {
        open: { label: 'Open', class: 'bg-blue-50 text-[#056BFC] border border-blue-100' },
        in_progress: { label: 'In Progress', class: 'bg-amber-50 text-amber-600 border border-amber-100' },
        resolved: { label: 'Resolved', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
        closed: { label: 'Closed', class: 'bg-muted text-muted-foreground border border-muted' },
    }
    const c = config[status] ?? config.open
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.class}`}>{c.label}</span>
}

function QuickAction({ href, label, icon: Icon, desc }: { href: string; label: string; icon: React.ElementType; desc: string }) {
    return (
        <Link href={href} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/20 hover:border-[#056BFC]/30 hover:bg-[#056BFC]/5 transition-all group">
            <div className="p-2 rounded-md bg-background border shrink-0 mt-0.5 group-hover:border-[#056BFC]/30 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-[#056BFC] transition-colors" />
            </div>
            <div>
                <p className="font-medium text-sm group-hover:text-[#056BFC] transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
        </Link>
    )
}
