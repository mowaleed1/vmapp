import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardCharts } from '@/components/DashboardCharts'
import Link from 'next/link'
import {
    Ticket, Clock, CheckCircle2, XCircle,
    TrendingUp, Users, AlertTriangle, BarChart2
} from 'lucide-react'

export const metadata = { title: 'Analytics — ValueMomentum' }

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export default async function AdminDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Status counts
    const { count: openCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
    const { count: inProgressCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')
    const { count: resolvedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved')
    const { count: closedCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed')

    // Priority counts
    const { count: criticalCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'critical')
    const { count: highCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'high')
    const { count: mediumCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'medium')
    const { count: lowCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'low')

    const totalTickets = (openCount ?? 0) + (inProgressCount ?? 0) + (resolvedCount ?? 0) + (closedCount ?? 0)
    const resolveRate = totalTickets > 0
        ? Math.round(((resolvedCount ?? 0) + (closedCount ?? 0)) / totalTickets * 100)
        : 0

    // Last 14 days
    const { data: allTickets } = await supabase
        .from('tickets')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())

    const now = new Date()
    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (13 - i))
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const count = (allTickets ?? []).filter(t => {
            const td = new Date(t.created_at)
            return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate()
        }).length
        return { date: label, count }
    })

    // Category breakdown
    const { data: categoryData } = await supabase
        .from('tickets')
        .select('category')

    const categoryMap: Record<string, number> = {}
    for (const t of categoryData ?? []) {
        const cat = t.category || 'general'
        categoryMap[cat] = (categoryMap[cat] ?? 0) + 1
    }

    // Critical open tickets
    const { data: criticalTickets } = await supabase
        .from('tickets')
        .select('id, title, created_at, ticket_number')
        .eq('priority', 'critical')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: true })
        .limit(5)

    // Recent tickets
    const { data: recentTickets } = await supabase
        .from('tickets')
        .select('id, title, priority, status, created_at, ticket_number')
        .order('created_at', { ascending: false })
        .limit(8)

    // Team members
    const { count: agentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Team-wide metrics and system health.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/agent" className="text-sm px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors">
                        Agent View
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Total Tickets"
                    value={totalTickets}
                    icon={<Ticket className="h-5 w-5 text-[#056BFC]" />}
                    color="#056BFC"
                    sub={`${openCount ?? 0} open`}
                />
                <KPICard
                    label="Resolve Rate"
                    value={`${resolveRate}%`}
                    icon={<TrendingUp className="h-5 w-5 text-[#3FD534]" />}
                    color="#3FD534"
                    sub={`${(resolvedCount ?? 0) + (closedCount ?? 0)} resolved`}
                />
                <KPICard
                    label="Critical Open"
                    value={criticalCount ?? 0}
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    color="#ef4444"
                    sub="needs immediate attention"
                />
                <KPICard
                    label="Team Members"
                    value={agentCount ?? 0}
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    color="rgb(168,85,247)"
                    sub="registered agents"
                />
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

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Critical Escalations */}
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center gap-2 px-5 py-4 border-b">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <h3 className="font-semibold">Critical Escalations</h3>
                        <span className="ml-auto text-xs text-muted-foreground">{criticalTickets?.length ?? 0} active</span>
                    </div>
                    {!criticalTickets || criticalTickets.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                            No critical escalations at this time.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {criticalTickets.map(t => (
                                <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center px-5 py-3 hover:bg-muted/40 transition-colors group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate group-hover:text-red-500 transition-colors">{t.title}</p>
                                        <p className="text-xs text-muted-foreground">Open for {timeAgo(t.created_at)}</p>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium ml-4 shrink-0">Critical</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Breakdown */}
                <div className="rounded-xl border bg-card">
                    <div className="flex items-center gap-2 px-5 py-4 border-b">
                        <BarChart2 className="h-4 w-4 text-[#056BFC]" />
                        <h3 className="font-semibold">By Category</h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {Object.entries(categoryMap).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No category data yet.</p>
                        ) : (
                            Object.entries(categoryMap)
                                .sort((a, b) => b[1] - a[1])
                                .map(([cat, count]) => {
                                    const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0
                                    return (
                                        <div key={cat} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="capitalize font-medium">{cat.replace('_', ' ')}</span>
                                                <span className="text-muted-foreground">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#056BFC] rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="font-semibold">Recent Activity</h3>
                    <Link href="/tickets" className="text-sm text-[#056BFC] hover:underline">View all →</Link>
                </div>
                {!recentTickets || recentTickets.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No tickets yet.</div>
                ) : (
                    <div className="divide-y">
                        {recentTickets.map(t => (
                            <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center px-5 py-3 hover:bg-muted/50 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate group-hover:text-[#056BFC] transition-colors">{t.title}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{(t as any).ticket_number ?? `VM-${t.id.slice(0, 6).toUpperCase()}`} · {timeAgo(t.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                    <PriorityBadge priority={t.priority} />
                                    <StatusBadge status={t.status} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function KPICard({ label, value, icon, color, sub }: {
    label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string
}) {
    return (
        <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="p-2 rounded-lg bg-muted">{icon}</div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
    )
}

function PriorityBadge({ priority }: { priority: string }) {
    const cfg: Record<string, string> = {
        critical: 'bg-red-500/10 text-red-500',
        high: 'bg-orange-500/10 text-orange-500',
        medium: 'bg-yellow-500/10 text-yellow-600',
        low: 'bg-green-500/10 text-green-600',
    }
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg[priority] ?? cfg.medium}`}>{priority}</span>
}

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        open: 'bg-blue-500/10 text-[#056BFC]',
        in_progress: 'bg-yellow-500/10 text-yellow-600',
        resolved: 'bg-green-500/10 text-[#3FD534]',
        closed: 'bg-muted text-muted-foreground',
    }
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg[status] ?? cfg.open}`}>{status.replace('_', ' ')}</span>
}
