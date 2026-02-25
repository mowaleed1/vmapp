import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { TicketCommentThread } from '@/components/TicketCommentThread'
import { TicketStatusSelect } from '@/components/TicketStatusSelect'
import {
    ArrowLeft, User, Calendar, Tag, AlertCircle,
    Clock, CheckCircle2, XCircle, Sparkles, Mic
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
      requester:users!tickets_requester_id_fkey(id, full_name, email),
      assigned:users!tickets_assigned_to_fkey(id, full_name, email)
    `)
        .eq('id', id)
        .single()

    if (!ticket) notFound()

    const { data: comments } = await supabase
        .from('ticket_comments')
        .select(`*, author:users!ticket_comments_author_id_fkey(id, full_name, email)`)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

    const pCfg = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back + title */}
            <div>
                <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold">{ticket.title}</h2>
                        <p className="text-sm font-mono text-muted-foreground mt-1">
                            TKT-{ticket.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <TicketStatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                {/* Main content */}
                <div className="space-y-5">
                    {/* AI Summary */}
                    {ticket.summary && (
                        <div className="p-4 rounded-xl bg-[#056BFC]/5 border border-[#056BFC]/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-[#056BFC]" />
                                <span className="text-sm font-semibold text-[#056BFC]">AI Summary</span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">{ticket.summary}</p>
                        </div>
                    )}

                    {/* Description */}
                    {ticket.description && (
                        <div className="rounded-xl border bg-card p-5">
                            <h3 className="font-semibold mb-3">Description</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {ticket.description}
                            </p>
                        </div>
                    )}

                    {/* Transcript */}
                    {ticket.transcript && (
                        <div className="rounded-xl border bg-card p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Mic className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">Audio Transcript</h3>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {ticket.transcript}
                            </div>
                        </div>
                    )}

                    {/* Comment thread */}
                    <TicketCommentThread
                        ticketId={ticket.id}
                        currentUserId={user.id}
                        initialComments={comments ?? []}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-xl border bg-card p-4 space-y-4">
                        <h3 className="font-semibold text-sm">Details</h3>

                        <DetailRow label="Status" icon={<StatusIcon status={ticket.status} />}>
                            <span className="text-sm font-medium capitalize">{ticket.status.replace('_', ' ')}</span>
                        </DetailRow>

                        <DetailRow label="Priority" icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pCfg.class}`}>
                                {pCfg.label}
                            </span>
                        </DetailRow>

                        <DetailRow label="Category" icon={<Tag className="h-4 w-4 text-muted-foreground" />}>
                            <span className="text-sm capitalize">{ticket.category?.replace('_', ' ') ?? '—'}</span>
                        </DetailRow>

                        <DetailRow label="Requester" icon={<User className="h-4 w-4 text-muted-foreground" />}>
                            <span className="text-sm truncate">
                                {(ticket.requester as any)?.full_name ?? (ticket.requester as any)?.email ?? '—'}
                            </span>
                        </DetailRow>

                        <DetailRow label="Assigned to" icon={<User className="h-4 w-4 text-muted-foreground" />}>
                            <span className="text-sm truncate">
                                {(ticket.assigned as any)?.full_name ?? (ticket.assigned as any)?.email ?? 'Unassigned'}
                            </span>
                        </DetailRow>

                        <DetailRow label="Created" icon={<Calendar className="h-4 w-4 text-muted-foreground" />}>
                            <span className="text-sm">{timeAgo(ticket.created_at)}</span>
                        </DetailRow>

                        <DetailRow label="Updated" icon={<Calendar className="h-4 w-4 text-muted-foreground" />}>
                            <span className="text-sm">{timeAgo(ticket.updated_at)}</span>
                        </DetailRow>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatusIcon({ status }: { status: string }) {
    const map: Record<string, { icon: any; class: string }> = {
        open: { icon: AlertCircle, class: 'text-[#056BFC]' },
        in_progress: { icon: Clock, class: 'text-[#FABD00]' },
        resolved: { icon: CheckCircle2, class: 'text-[#3FD534]' },
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
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                {children}
            </div>
        </div>
    )
}
