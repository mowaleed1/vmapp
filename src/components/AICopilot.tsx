'use client'

import { useState } from 'react'
import {
    Sparkles, Loader2, ChevronRight, Copy, CheckCheck,
    GitBranch, Zap, ExternalLink, AlertTriangle, Info, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SimilarTicket {
    id: string
    title: string
    priority: string
    status: string
    score: number
}

interface NextAction {
    action: string
    reason: string
    confidence: 'high' | 'medium' | 'low'
    type: 'escalate' | 'gather_info' | 'resolve' | 'follow_up' | 'assign' | 'close'
}

interface Props {
    ticketId: string
    ticketTitle: string
    ticketDescription?: string | null
    ticketSummary?: string | null
    transcript?: string | null
    onUseSuggestion: (text: string) => void
}

const TABS = [
    { id: 'replies', label: 'Reply Ideas', icon: Sparkles },
    { id: 'similar', label: 'Similar', icon: GitBranch },
    { id: 'next', label: 'Next Action', icon: Zap },
]

const ACTION_ICONS: Record<string, React.ReactNode> = {
    escalate: <AlertTriangle className="h-4 w-4 text-red-500" />,
    gather_info: <Info className="h-4 w-4 text-[#056BFC]" />,
    resolve: <CheckCircle2 className="h-4 w-4 text-[#3FD534]" />,
    follow_up: <Sparkles className="h-4 w-4 text-purple-500" />,
    assign: <GitBranch className="h-4 w-4 text-orange-400" />,
    close: <CheckCheck className="h-4 w-4 text-muted-foreground" />,
}

const CONFIDENCE_COLORS = {
    high: 'bg-green-500/10 text-green-600',
    medium: 'bg-yellow-500/10 text-yellow-600',
    low: 'bg-muted text-muted-foreground',
}

export function AICopilot({
    ticketId, ticketTitle, ticketDescription, ticketSummary, transcript, onUseSuggestion
}: Props) {
    const [activeTab, setActiveTab] = useState<'replies' | 'similar' | 'next'>('replies')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([])
    const [nextAction, setNextAction] = useState<NextAction | null>(null)
    const [loading, setLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    async function loadTab(tab: 'replies' | 'similar' | 'next') {
        setActiveTab(tab)

        // Only load if we don't have data yet
        if (tab === 'replies' && suggestions.length > 0) return
        if (tab === 'similar' && similarTickets.length > 0) return
        if (tab === 'next' && nextAction) return

        setLoading(true)
        try {
            if (tab === 'replies') {
                const res = await fetch('/api/ai-suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticketTitle, ticketDescription, ticketSummary, transcript }),
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setSuggestions(data.suggestions ?? [])
            }

            if (tab === 'similar') {
                const res = await fetch('/api/similar-tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticketId, title: ticketTitle, description: ticketDescription, summary: ticketSummary }),
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setSimilarTickets(data.similar ?? [])
            }

            if (tab === 'next') {
                const res = await fetch('/api/next-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticketTitle, ticketDescription, ticketSummary, transcript }),
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setNextAction(data)
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            toast.error(`AI Copilot: ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    async function copyToClipboard(text: string, index: number) {
        await navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-gradient-to-r from-[#056BFC]/5 to-transparent">
                <Sparkles className="h-4 w-4 text-[#056BFC]" />
                <span className="font-semibold text-sm">AI Copilot</span>
                <span className="text-xs text-[#3FD534] bg-[#3FD534]/10 px-1.5 py-0.5 rounded-full font-medium">GPT-4o mini</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => loadTab(tab.id as any)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2',
                                isActive
                                    ? 'border-[#056BFC] text-[#056BFC] bg-[#056BFC]/5'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {loading && (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-[#056BFC]" />
                        <span className="text-sm">
                            {activeTab === 'replies' ? 'Generating replies…' : activeTab === 'similar' ? 'Finding similar tickets…' : 'Analyzing ticket…'}
                        </span>
                    </div>
                )}

                {/* Reply Suggestions */}
                {!loading && activeTab === 'replies' && (
                    <>
                        {suggestions.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-3">Get AI-generated reply suggestions based on this ticket.</p>
                                <Button
                                    size="sm"
                                    onClick={() => { setSuggestions([]); loadTab('replies') }}
                                    className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white"
                                >
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate Replies
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {suggestions.map((s, i) => (
                                    <div key={i} className="group relative rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors p-3">
                                        <p className="text-sm leading-relaxed pr-14">{s}</p>
                                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => copyToClipboard(s, i)} className="p-1.5 rounded hover:bg-background" title="Copy">
                                                {copiedIndex === i ? <CheckCheck className="h-3.5 w-3.5 text-[#3FD534]" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                            </button>
                                            <button onClick={() => onUseSuggestion(s)} className="p-1.5 rounded hover:bg-background" title="Use reply">
                                                <ChevronRight className="h-3.5 w-3.5 text-[#056BFC]" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => { setSuggestions([]); loadTab('replies') }}
                                    className="w-full text-xs text-muted-foreground hover:text-[#056BFC] text-center pt-1 transition-colors"
                                >
                                    ↻ Regenerate
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Similar Tickets */}
                {!loading && activeTab === 'similar' && (
                    <>
                        {similarTickets.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-3">Find tickets with similar issues to help answer faster.</p>
                                <Button
                                    size="sm"
                                    onClick={() => loadTab('similar')}
                                    className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white"
                                >
                                    <GitBranch className="mr-1.5 h-3.5 w-3.5" /> Find Similar
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground mb-2">{similarTickets.length} similar ticket{similarTickets.length !== 1 ? 's' : ''} found</p>
                                {similarTickets.map(t => (
                                    <Link
                                        key={t.id}
                                        href={`/tickets/${t.id}`}
                                        target="_blank"
                                        className="flex items-start gap-2 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors p-3 group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate group-hover:text-[#056BFC] transition-colors">{t.title}</p>
                                            <div className="flex gap-1.5 mt-1">
                                                <PriorityDot priority={t.priority} />
                                                <span className="text-[10px] text-muted-foreground capitalize">{t.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Next Action */}
                {!loading && activeTab === 'next' && (
                    <>
                        {!nextAction ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-3">Get an AI recommendation on the best next step.</p>
                                <Button
                                    size="sm"
                                    onClick={() => loadTab('next')}
                                    className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white"
                                >
                                    <Zap className="mr-1.5 h-3.5 w-3.5" /> Recommend Action
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-background border shrink-0">
                                            {ACTION_ICONS[nextAction.type] ?? <Zap className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold capitalize">{nextAction.type.replace('_', ' ')}</span>
                                                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', CONFIDENCE_COLORS[nextAction.confidence])}>
                                                    {nextAction.confidence} confidence
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium leading-snug">{nextAction.action}</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-border" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">{nextAction.reason}</p>
                                </div>
                                <button
                                    onClick={() => { setNextAction(null); loadTab('next') }}
                                    className="w-full text-xs text-muted-foreground hover:text-[#056BFC] text-center transition-colors"
                                >
                                    ↻ Re-analyze
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function PriorityDot({ priority }: { priority: string }) {
    const colors: Record<string, string> = {
        critical: 'bg-red-500',
        high: 'bg-orange-400',
        medium: 'bg-yellow-400',
        low: 'bg-green-400',
    }
    return (
        <span className={cn('inline-block w-1.5 h-1.5 rounded-full mt-0.5', colors[priority] ?? 'bg-muted-foreground')} />
    )
}
