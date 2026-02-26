'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Lock, Globe, Send, MessageSquare, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { AICopilot } from '@/components/AICopilot'
import { cn } from '@/lib/utils'

interface Comment {
    id: string
    body: string
    is_internal: boolean
    created_at: string
    author: { id: string; full_name: string | null; email: string } | null
}

interface Props {
    ticketId: string
    currentUserId: string
    initialComments: Comment[]
    ticketTitle?: string
    ticketDescription?: string | null
    ticketSummary?: string | null
    transcript?: string | null
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

type Tab = 'all' | 'public' | 'internal'
type ReplyMode = 'public' | 'internal'

const REPLY_CONFIG = {
    public: {
        label: 'Public Reply',
        description: 'Visible to the requester',
        icon: Globe,
        placeholder: 'Write a public reply — the customer will see this…',
        pillClass: 'bg-[#056BFC]/10 text-[#056BFC] border-[#056BFC]/30',
        headerClass: '',
        borderClass: 'border-l-[#056BFC]',
        bgClass: '',
    },
    internal: {
        label: 'Internal Note',
        description: 'Only visible to agents',
        icon: Lock,
        placeholder: 'Write an internal note — only agents will see this…',
        pillClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        headerClass: 'text-amber-600',
        borderClass: 'border-l-amber-400',
        bgClass: 'bg-amber-50/50',
    },
}

export function TicketCommentThread({
    ticketId, currentUserId, initialComments,
    ticketTitle, ticketDescription, ticketSummary, transcript
}: Props) {
    const router = useRouter()
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [body, setBody] = useState('')
    const [replyMode, setReplyMode] = useState<ReplyMode>('public')
    const [activeTab, setActiveTab] = useState<Tab>('all')
    const [isPending, startTransition] = useTransition()

    const publicCount = comments.filter(c => !c.is_internal).length
    const internalCount = comments.filter(c => c.is_internal).length

    const visibleComments = activeTab === 'all'
        ? comments
        : activeTab === 'public'
            ? comments.filter(c => !c.is_internal)
            : comments.filter(c => c.is_internal)

    const cfg = REPLY_CONFIG[replyMode]

    async function submitComment() {
        if (!body.trim()) return
        const supabase = createClient()

        const { data, error } = await supabase
            .from('ticket_comments')
            .insert({
                ticket_id: ticketId,
                author_id: currentUserId,
                body: body.trim(),
                is_internal: replyMode === 'internal',
            })
            .select('*, author:users!ticket_comments_author_id_fkey(id, full_name, email)')
            .single()

        if (error) {
            toast.error('Failed to post comment')
            return
        }

        // Drop an event in the activity log so it appears in the timeline
        await supabase.from('ticket_activity_logs').insert({
            ticket_id: ticketId,
            actor_id: currentUserId,
            action: replyMode === 'internal' ? 'internal_note_added' : 'public_reply_added',
            new_value: { comment_id: data.id }
        })

        setComments(prev => [...prev, data as Comment])
        setBody('')
        toast.success(replyMode === 'internal' ? 'Internal note saved' : 'Reply posted')
        startTransition(() => router.refresh())
    }

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Header with tabs */}
            <div className="px-5 py-3 border-b bg-muted/20">
                <div className="flex items-center gap-1">
                    {([
                        { id: 'all', label: 'All', count: comments.length },
                        { id: 'public', label: 'Public', count: publicCount, icon: Globe },
                        { id: 'internal', label: 'Internal', count: internalCount, icon: Lock },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                activeTab === tab.id
                                    ? 'bg-background text-foreground shadow-sm border'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {'icon' in tab && tab.icon && <tab.icon className="h-3 w-3" />}
                            {tab.label}
                            <span className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center',
                                activeTab === tab.id ? 'bg-[#056BFC]/10 text-[#056BFC]' : 'bg-muted text-muted-foreground'
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment list */}
            <div className="divide-y">
                {visibleComments.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                        {activeTab === 'internal'
                            ? <><StickyNote className="h-8 w-8 mx-auto mb-2 opacity-20" /><p>No internal notes yet.</p></>
                            : <><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" /><p>No comments yet. Be the first to respond.</p></>
                        }
                    </div>
                )}
                {visibleComments.map(c => {
                    const name = c.author?.full_name ?? c.author?.email ?? 'Unknown'
                    const initials = name.slice(0, 2).toUpperCase()
                    const isInternal = c.is_internal
                    return (
                        <div
                            key={c.id}
                            className={cn(
                                'px-5 py-4 border-l-2',
                                isInternal
                                    ? 'bg-amber-50/40 border-l-amber-400'
                                    : 'border-l-transparent'
                            )}
                        >
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 text-xs shrink-0">
                                    <AvatarFallback className={cn(
                                        'text-white text-xs font-semibold',
                                        isInternal ? 'bg-amber-500' : 'bg-[#056BFC]'
                                    )}>
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                        <span className="font-medium text-sm">{name}</span>
                                        {isInternal && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                <Lock className="h-2.5 w-2.5" />
                                                Internal note
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* AI Copilot */}
            {ticketTitle && (
                <div className="border-t">
                    <AICopilot
                        ticketId={ticketId}
                        ticketTitle={ticketTitle}
                        ticketDescription={ticketDescription}
                        ticketSummary={ticketSummary}
                        transcript={transcript}
                        onUseSuggestion={(s) => { setBody(s); setReplyMode('public') }}
                    />
                </div>
            )}

            {/* Reply composer */}
            <div className="border-t">
                {/* Mode selector tabs */}
                <div className="flex border-b">
                    {(['public', 'internal'] as const).map(mode => {
                        const modeCfg = REPLY_CONFIG[mode]
                        const Icon = modeCfg.icon
                        return (
                            <button
                                key={mode}
                                onClick={() => setReplyMode(mode)}
                                className={cn(
                                    'flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-colors flex-1 justify-center',
                                    replyMode === mode
                                        ? mode === 'public'
                                            ? 'border-b-[#056BFC] text-[#056BFC] bg-[#056BFC]/5'
                                            : 'border-b-amber-400 text-amber-700 bg-amber-50/50'
                                        : 'border-b-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {modeCfg.label}
                            </button>
                        )
                    })}
                </div>

                {/* Composer */}
                <div className={cn('p-5 space-y-3', cfg.bgClass)}>
                    <div className="flex items-start gap-2.5">
                        <p className="text-xs text-muted-foreground pt-0.5">
                            {cfg.description}
                        </p>
                    </div>
                    <Textarea
                        placeholder={cfg.placeholder}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={3}
                        className={cn(
                            'resize-none border',
                            replyMode === 'internal' ? 'border-amber-300 focus:border-amber-400' : ''
                        )}
                        disabled={isPending}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
                        }}
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Ctrl/Cmd + Enter to submit</p>
                        <Button
                            onClick={submitComment}
                            disabled={!body.trim() || isPending}
                            size="sm"
                            className={cn(
                                'font-semibold',
                                replyMode === 'internal'
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-[#056BFC] hover:bg-[#0455CC] text-white'
                            )}
                        >
                            {isPending
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <><Send className="mr-1.5 h-3.5 w-3.5" />{replyMode === 'internal' ? 'Save Note' : 'Send Reply'}</>
                            }
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
