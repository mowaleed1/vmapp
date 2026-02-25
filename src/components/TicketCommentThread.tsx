'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Lock, Globe, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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

export function TicketCommentThread({ ticketId, currentUserId, initialComments }: Props) {
    const router = useRouter()
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [body, setBody] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [isPending, startTransition] = useTransition()

    async function submitComment() {
        if (!body.trim()) return
        const supabase = createClient()

        const { data, error } = await supabase
            .from('ticket_comments')
            .insert({ ticket_id: ticketId, author_id: currentUserId, body: body.trim(), is_internal: isInternal })
            .select('*, author:users!ticket_comments_author_id_fkey(id, full_name, email)')
            .single()

        if (error) {
            toast.error('Failed to post comment')
            return
        }

        setComments((prev) => [...prev, data as Comment])
        setBody('')
        toast.success('Comment posted')

        startTransition(() => router.refresh())
    }

    return (
        <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Comments</h3>
                <span className="text-xs text-muted-foreground">{comments.length}</span>
            </div>

            {/* Comment list */}
            <div className="divide-y">
                {comments.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                        No comments yet. Be the first to respond.
                    </div>
                )}
                {comments.map((c) => {
                    const name = c.author?.full_name ?? c.author?.email ?? 'Unknown'
                    const initials = name.slice(0, 2).toUpperCase()
                    return (
                        <div
                            key={c.id}
                            className={`px-5 py-4 ${c.is_internal ? 'bg-[#FABD00]/5 border-l-2 border-l-[#FABD00]' : ''}`}
                        >
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 text-xs shrink-0">
                                    <AvatarFallback className="bg-[#056BFC] text-white text-xs font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{name}</span>
                                        {c.is_internal && (
                                            <span className="flex items-center gap-1 text-xs text-[#FABD00] font-medium">
                                                <Lock className="h-3 w-3" /> Internal note
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.body}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Reply box */}
            <div className="p-5 border-t space-y-3">
                <Textarea
                    placeholder="Write a reply…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="resize-none"
                    disabled={isPending}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
                    }}
                />
                <div className="flex items-center justify-between">
                    {/* Internal note toggle */}
                    <button
                        type="button"
                        onClick={() => setIsInternal(!isInternal)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${isInternal
                                ? 'bg-[#FABD00]/10 text-[#FABD00] border-[#FABD00]/30'
                                : 'text-muted-foreground border-border hover:border-muted-foreground/50'
                            }`}
                    >
                        {isInternal ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        {isInternal ? 'Internal note' : 'Public reply'}
                    </button>

                    <Button
                        onClick={submitComment}
                        disabled={!body.trim() || isPending}
                        className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white"
                        size="sm"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="mr-1.5 h-3.5 w-3.5" /> Reply
                            </>
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Tip: Ctrl/Cmd + Enter to submit</p>
            </div>
        </div>
    )
}
