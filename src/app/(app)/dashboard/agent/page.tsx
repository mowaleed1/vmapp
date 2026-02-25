import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Ticket, UploadCloud, Clock, CheckCircle2 } from 'lucide-react'

export default async function AgentDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const firstName = profile?.full_name?.split(' ')[0] || 'Agent'

    // Fetch ticket counts for this agent
    const { count: openCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'open')

    const { count: inProgressCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'in_progress')

    const { count: resolvedCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'resolved')

    // Get recent tickets
    const { data: recentTickets } = await supabase
        .from('tickets')
        .select('id, title, priority, status, created_at')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Good day, {firstName} 👋</h2>
                <p className="text-muted-foreground">Here&apos;s what&apos;s on your plate today.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Open Tickets"
                    value={openCount ?? 0}
                    icon={<Ticket className="h-5 w-5 text-[#056BFC]" />}
                    color="#056BFC"
                    trend="+2 from yesterday"
                />
                <StatCard
                    label="In Progress"
                    value={inProgressCount ?? 0}
                    icon={<Clock className="h-5 w-5 text-[#FABD00]" />}
                    color="#FABD00"
                    trend="Active now"
                />
                <StatCard
                    label="Resolved Today"
                    value={resolvedCount ?? 0}
                    icon={<CheckCircle2 className="h-5 w-5 text-[#3FD534]" />}
                    color="#3FD534"
                    trend="Keep it up!"
                />
                <StatCard
                    label="Audio Uploads"
                    value={0}
                    icon={<UploadCloud className="h-5 w-5 text-purple-500" />}
                    color="rgb(168, 85, 247)"
                    trend="Upload to create tickets"
                />
            </div>

            {/* Recent tickets table */}
            <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="font-semibold">My Recent Tickets</h3>
                    <a href="/tickets" className="text-sm text-[#056BFC] hover:underline">View all →</a>
                </div>
                {!recentTickets || recentTickets.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                        <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No tickets yet</p>
                        <p className="text-sm">Upload audio or create a ticket manually to get started.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {recentTickets.map((ticket) => (
                            <a key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center px-5 py-3 hover:bg-muted/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{ticket.title}</p>
                                    <p className="text-xs text-muted-foreground font-mono">TKT-{ticket.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <PriorityBadge priority={ticket.priority} />
                                    <StatusBadge status={ticket.status} />
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="rounded-lg border bg-card p-5">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <QuickAction href="/upload" label="Upload Audio" icon="🎙️" desc="Create ticket from recording" />
                    <QuickAction href="/tickets/new" label="New Ticket" icon="✏️" desc="Manual ticket creation" />
                    <QuickAction href="/search" label="Search" icon="🔍" desc="Find existing tickets" />
                    <QuickAction href="/settings" label="Settings" icon="⚙️" desc="Profile & preferences" />
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color, trend }: {
    label: string
    value: number
    icon: React.ReactNode
    color: string
    trend?: string
}) {
    return (
        <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="p-2 rounded-lg bg-muted">{icon}</div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
    )
}

function PriorityBadge({ priority }: { priority: string }) {
    const config: Record<string, { label: string; class: string }> = {
        critical: { label: 'Critical', class: 'bg-red-500/10 text-red-500' },
        high: { label: 'High', class: 'bg-orange-500/10 text-orange-500' },
        medium: { label: 'Medium', class: 'bg-yellow-500/10 text-yellow-600' },
        low: { label: 'Low', class: 'bg-green-500/10 text-green-600' },
    }
    const c = config[priority] ?? config.medium
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.class}`}>{c.label}</span>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; class: string }> = {
        open: { label: 'Open', class: 'bg-blue-500/10 text-[#056BFC]' },
        in_progress: { label: 'In Progress', class: 'bg-yellow-500/10 text-yellow-600' },
        resolved: { label: 'Resolved', class: 'bg-green-500/10 text-[#3FD534]' },
        closed: { label: 'Closed', class: 'bg-muted text-muted-foreground' },
    }
    const c = config[status] ?? config.open
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.class}`}>{c.label}</span>
    )
}

function QuickAction({ href, label, icon, desc }: { href: string; label: string; icon: string; desc: string }) {
    return (
        <a
            href={href}
            className="flex flex-col p-4 rounded-lg border hover:border-[#056BFC]/40 hover:bg-[#056BFC]/5 transition-all group"
        >
            <span className="text-2xl mb-2">{icon}</span>
            <p className="font-medium text-sm group-hover:text-[#056BFC] transition-colors">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </a>
    )
}
