'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CheckCircle2, FileText, Tag, AlertTriangle, Info,
    X, FileAudio, Clock, Trash2
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
    const [creating, setCreating] = useState(false)
    const [rejecting, setRejecting] = useState(false)

    async function handleReject() {
        if (!confirm('Are you sure you want to reject and delete this request?')) return
        setRejecting(true)
        try {
            const res = await fetch('/api/reject-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadFileId: analysis.uploadFileId })
            })
            if (!res.ok) throw new Error('Failed to reject request')
            toast.success('Request rejected successfully.')
            onDismiss()
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Error rejecting request')
            setRejecting(false)
        }
    }

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
        <div className="rounded-xl border bg-card divide-y shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#056BFC]/10 flex items-center justify-center">
                        <FileAudio className="h-5 w-5 text-[#056BFC]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Request Approval Form</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Review the submitted details and approve to generate an official ticket.</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x">
                {/* Left Column: Form Fields */}
                <div className="md:col-span-3 px-6 py-6 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Ticket Configuration
                        </h4>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Ticket Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="font-medium bg-background"
                                placeholder="Enter ticket title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Priority</Label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#056BFC]"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Category</Label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#056BFC]"
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
                        <div className="flex items-center gap-2 pt-2">
                            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium)}>
                                Priority: {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-muted-foreground/20">
                                Category: {CATEGORY_LABELS[category] ?? category}
                            </span>
                            {analysis.linked_ticket_number && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                    Updates: {analysis.linked_ticket_number}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Source Content */}
                <div className="md:col-span-2 bg-muted/5 flex flex-col h-full">
                    {analysis.summary && (
                        <div className="px-6 py-5 border-b bg-white">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Request Summary
                            </h4>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{analysis.summary}</p>
                        </div>
                    )}

                    <div className="px-6 py-5 flex-1">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Original Transcript
                        </h4>
                        <div className="bg-white rounded-lg border p-4 h-[250px] overflow-y-auto shadow-inner text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono relative">
                            {analysis.transcript}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-muted/10 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={handleReject}
                    disabled={rejecting || creating}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                >
                    {rejecting ? <VMLoader className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Reject Request
                </Button>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={onDismiss}
                        disabled={creating || rejecting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={creating || rejecting || !title.trim()}
                        className="bg-[#056BFC] hover:bg-[#0455CC] text-white font-semibold px-6"
                    >
                        {creating
                            ? <><VMLoader className="mr-2 h-5 w-5" /> Processing…</>
                            : <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Create Ticket</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}
