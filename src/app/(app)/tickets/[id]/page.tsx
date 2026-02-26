import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TicketCommentThread } from '@/components/TicketCommentThread'
import { TicketStatusSelect } from '@/components/TicketStatusSelect'
import { TicketAssignSelect } from '@/components/TicketAssignSelect'
import { SlaIndicator } from '@/components/SlaIndicator'
import { TicketActivityLog } from '@/components/TicketActivityLog'
import {
    ArrowLeft, User, Calendar, Tag, AlertCircle,
    Clock, CheckCircle2, XCircle, Sparkles, Mic, Timer
} from 'lucide-react'

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return days === 1 ? '1 day ago' : `${days} days ago`
}

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
    high: { label: 'High', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    medium: { label: 'Medium', class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    low: { label: 'Low', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { id } = await params

    const { data: ticket } = await supabase
        .from('tickets')
        .select(`
    *,
    requester: users!tickets_requester_id_fkey(id, full_name, email),
        assigned: users!tickets_assigned_to_fkey(id, full_name, email)
            `)
        .eq('id', id)
        .single()

    if (!ticket) notFound()

    const { data: comments } = await supabase
        .from('ticket_comments')
        .select(`*, author: users!ticket_comments_author_id_fkey(id, full_name, email)`)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

    const pCfg = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Area */}
            <div className="space-y-4">
                <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{ticket.title}</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-mono text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">
                                {ticket.ticket_number ?? `VM-${ticket.id.slice(0, 6).toUpperCase()}`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Opened {timeAgo(ticket.created_at)} by <span className="font-medium text-foreground">{(ticket.requester as any)?.full_name ?? (ticket.requester as any)?.email ?? 'Unknown'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Primary Actions (Enterprise Header) */}
                    <div className="flex items-center gap-3 shrink-0 bg-card p-2 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-2 pl-2 border-r pr-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <TicketAssignSelect
                                ticketId={ticket.id}
                                currentAssignedId={(ticket.assigned as any)?.id ?? null}
                                currentAssignedName={(ticket.assigned as any)?.full_name ?? (ticket.assigned as any)?.email ?? null}
                            />
                        </div>
                        <TicketStatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
                    </div>
                </div>
            </div >

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
                {/* Main content (Left Column) */}
                <div className="space-y-8 min-w-0">

                    {/* Standard Content Blocks */}
                    <div className="space-y-6">
                        {/* AI Summary */}
                        {ticket.summary && (
                            <div className="p-5 rounded-xl bg-gradient-to-r from-[#056BFC]/10 to-[#056BFC]/5 border border-[#056BFC]/20 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Sparkles className="h-24 w-24 text-[#056BFC]" />
                                </div>
                                <div className="flex items-center gap-2 mb-3 relative z-10">
                                    <div className="p-1.5 rounded-md bg-[#056BFC]/20">
                                        <Sparkles className="h-4 w-4 text-[#056BFC]" />
                                    </div>
                                    <span className="text-sm font-bold tracking-wide uppercase text-[#056BFC]">AI Summary</span>
                                </div>
                                <p className="text-sm text-foreground/90 leading-relaxed relative z-10">{ticket.summary}</p>
                            </div>
                        )}

                        {/* Description */}
                        {ticket.description && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    Description
                                </h3>
                                <div className="prose prose-sm max-w-none text-muted-foreground">
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {ticket.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Transcript */}
                        {ticket.transcript && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 rounded-md bg-muted">
                                        <Mic className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-lg">Audio Transcript</h3>
                                </div>
                                <div className="rounded-lg bg-muted/30 border p-4 text-sm text-muted-foreground/80 leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                                    {ticket.transcript}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Massive Centralized Comment Thread Canvas */}
                    <div className="pt-2">
                        <h3 className="font-semibold text-lg mb-4">Activity & Comments</h3>
                        <TicketCommentThread
                            ticketId={ticket.id}
                            currentUserId={user.id}
                            initialComments={comments ?? []}
                            ticketTitle={ticket.title}
                            ticketDescription={ticket.description}
                            ticketSummary={ticket.summary}
                            transcript={ticket.transcript}
                        />
                    </div>
                </div>

                {/* Right Column: Metadata Sidebar */}
                <div className="space-y-6 sticky top-6">
                    {/* Details Card */}
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b bg-muted/20">
                            <h3 className="font-semibold text-sm">Ticket Details</h3>
                        </div>
                        <div className="p-5 space-y-5">
                            <DetailRow label="Priority" icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pCfg.class}`}>
                                    {pCfg.label}
                                </span>
                            </DetailRow>

                            <DetailRow label="SLA Standard" icon={<Timer className="h-4 w-4 text-muted-foreground" />}>
                                <SlaIndicator
                                    breachAt={ticket.sla_breach_at ?? null}
                                    priority={ticket.priority}
                                    status={ticket.status}
                                />
                            </DetailRow>

                            <DetailRow label="Category" icon={<Tag className="h-4 w-4 text-muted-foreground" />}>
                                <span className="text-sm font-medium capitalize bg-muted px-2 py-0.5 rounded-md">
                                    {ticket.category?.replace('_', ' ') ?? '—'}
                                </span>
                            </DetailRow>

                            <div className="pt-4 mt-4 border-t space-y-4">
                                <DetailRow label="Updated" icon={<Calendar className="h-4 w-4 text-muted-foreground" />}>
                                    <span className="text-sm">{timeAgo(ticket.updated_at)}</span>
                                </DetailRow>
                            </div>
                        </div>
                    </div>

                    {/* Vertical Timeline Log */}
                    <TicketActivityLog ticketId={ticket.id} />
                </div>
            </div>
        </div >
    )
}

function StatusIcon({ status }: { status: string }) {
    const map: Record<string, { icon: any; class: string }> = {
        open: { icon: AlertCircle, class: 'text-[#056BFC]' },
        in_progress: { icon: Clock, class: 'text-amber-500' },
        resolved: { icon: CheckCircle2, class: 'text-emerald-500' },
        closed: { icon: XCircle, class: 'text-muted-foreground' },
    }
    const cfg = map[status] ?? map.open
    const Icon = cfg.icon
    return <Icon className={`h-4 w-4 ${cfg.class}`} />
}

function DetailRow({ label, icon, children }: {
    label: string; icon: React.ReactNode; children: React.ReactNode
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 bg-muted/50 p-1.5 rounded-md">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>
                {children}
            </div>
        </div>
    )
}
