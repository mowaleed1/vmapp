'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function NewTicketPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
    })

    function set(key: string, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.title.trim()) {
            toast.warning('Please enter a ticket title')
            return
        }
        setLoading(true)

        try {
            const res = await fetch('/api/create-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title.trim(),
                    description: form.description.trim() || null,
                    priority: form.priority,
                    category: form.category,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(`Ticket ${data.ticketNumber} created.`)
            router.push(`/tickets/${data.ticketId}`)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to create ticket')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>
                <h2 className="text-2xl font-bold">Create Ticket</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Fill in the details below, or{' '}
                    <Link href="/upload" className="text-[#056BFC] hover:underline">upload audio</Link>{' '}
                    to create a ticket automatically with AI.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="Brief description of the issue"
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            required
                            disabled={loading}
                            className="border-gray-200 focus:border-[#056BFC]"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Provide as much detail as possible…"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            rows={5}
                            disabled={loading}
                            className="border-gray-200 focus:border-[#056BFC] resize-none"
                        />
                    </div>

                    {/* Priority + Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</Label>
                            <Select value={form.priority} onValueChange={(v) => set('priority', v)} disabled={loading}>
                                <SelectTrigger className="border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</Label>
                            <Select value={form.category} onValueChange={(v) => set('category', v)} disabled={loading}>
                                <SelectTrigger className="border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="technical">Technical</SelectItem>
                                    <SelectItem value="billing">Billing</SelectItem>
                                    <SelectItem value="account">Account</SelectItem>
                                    <SelectItem value="feature_request">Feature Request</SelectItem>
                                    <SelectItem value="complaint">Complaint</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#056BFC] hover:bg-[#0455CC] text-white font-semibold"
                        >
                            {loading
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                                : <><Plus className="mr-2 h-4 w-4" /> Create Ticket</>}
                        </Button>
                        <Link href="/tickets">
                            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
