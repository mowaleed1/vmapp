'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CheckCircle2, FileText, Tag, AlertTriangle, Info,
    ChevronDown, ChevronUp, X
} from 'lucide-react'
import { VMLoader } from '@/components/ui/vm-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AnalysisResult {
    uploadFileId: string
    transcript: string
    title: string
    description: string
    priority: string
    category: string
    summary: string
    linked_ticket_number?: string | null
}

interface Props {
    analysis: AnalysisResult
    onDismiss: () => void
}

const PRIORITY_STYLES: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 border border-red-200',
    high: 'bg-orange-50 text-orange-700 border border-orange-200',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

const CATEGORY_LABELS: Record<string, string> = {
    billing: 'Billing',
    technical: 'Technical',
    account: 'Account',
    feature_request: 'Feature Request',
    general: 'General',
}

export function AudioReviewPanel({ analysis, onDismiss }: Props) {
    const router = useRouter()
    const [title, setTitle] = useState(analysis.title)
    const [priority, setPriority] = useState(analysis.priority)
    const [category, setCategory] = useState(analysis.category)
    const [showTranscript, setShowTranscript] = useState(false)
    const [creating, setCreating] = useState(false)

    async function handleCreate() {
        if (!title.trim()) {
            toast.error('Please provide a ticket title.')
            return
        }

        setCreating(true)
        try {
            const res = await fetch('/api/create-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uploadFileId: analysis.uploadFileId,
                    title: title.trim(),
                    description: analysis.description,
                    priority,
                    category,
                    summary: analysis.summary,
                    transcript: analysis.transcript,
                    linked_ticket_number: analysis.linked_ticket_number,
                }),
            })
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error)

            toast.success(`Ticket ${data.ticketNumber} created successfully.`)
            router.push(`/tickets/${data.ticketId}`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            toast.error(msg)
            setCreating(false)
        }
    }

    return (
        <div className="rounded-xl border bg-card divide-y animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                        <h3 className="font-semibold text-sm">Analysis Complete — Review Before Creating</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">AI has extracted the ticket details. Review and adjust before saving.</p>
                    </div>
                </div>
                <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Summary */}
            {analysis.summary && (
                <div className="px-5 py-4 bg-[#056BFC]/5">
                    <div className="flex gap-2">
                        <Info className="h-4 w-4 text-[#056BFC] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#056BFC]/80">{analysis.summary}</p>
                    </div>
                </div>
            )}

            {/* Editable fields */}
            <div className="px-5 py-5 space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ticket Title</Label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="font-medium border-gray-200"
                        placeholder="Enter ticket title"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</Label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full h-9 rounded-md border border-gray-200 bg-background px-3 text-sm focus:outline-none focus:border-[#056BFC]"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</Label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full h-9 rounded-md border border-gray-200 bg-background px-3 text-sm focus:outline-none focus:border-[#056BFC]"
                        >
                            <option value="billing">Billing</option>
                            <option value="technical">Technical</option>
                            <option value="account">Account</option>
                            <option value="feature_request">Feature Request</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium)}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-muted-foreground/20">
                        {CATEGORY_LABELS[category] ?? category}
                    </span>
                    {analysis.linked_ticket_number && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            Updates Ticket: {analysis.linked_ticket_number}
                        </span>
                    )}
                </div>
            </div>

            {/* Transcript accordion */}
            <div className="px-5 py-3">
                <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Full Transcript
                    </div>
                    {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showTranscript && (
                    <div className="mt-3 p-4 rounded-lg bg-muted/40 border border-muted-foreground/10">
                        <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{analysis.transcript}</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button
                    onClick={onDismiss}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Discard
                </button>
                <Button
                    onClick={handleCreate}
                    disabled={creating || !title.trim()}
                    className="bg-[#056BFC] hover:bg-[#0455CC] text-white font-semibold px-6"
                >
                    {creating
                        ? <><VMLoader className="mr-2 h-5 w-5" /> Creating…</>
                        : 'Create Ticket'}
                </Button>
            </div>
        </div>
    )
}
