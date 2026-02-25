'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
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

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data: ticket, error } = await supabase
            .from('tickets')
            .insert({
                title: form.title.trim(),
                description: form.description.trim() || null,
                priority: form.priority,
                category: form.category,
                status: 'open',
                requester_id: user?.id,
            })
            .select()
            .single()

        setLoading(false)

        if (error) {
            toast.error('Failed to create ticket')
            return
        }

        toast.success('Ticket created!')
        router.push(`/tickets/${ticket.id}`)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>
                <h2 className="text-2xl font-bold">Create New Ticket</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Fill in the details below, or <Link href="/upload" className="text-[#056BFC] hover:underline">upload audio</Link> to create a ticket automatically with AI.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                            <Input
                                id="title"
                                placeholder="Brief description of the issue"
                                value={form.title}
                                onChange={(e) => set('title', e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Provide as much detail as possible…"
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                                rows={5}
                                disabled={loading}
                            />
                        </div>

                        {/* Priority + Category row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={form.priority} onValueChange={(v) => set('priority', v)} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical">🔴 Critical</SelectItem>
                                        <SelectItem value="high">🟠 High</SelectItem>
                                        <SelectItem value="medium">🟡 Medium</SelectItem>
                                        <SelectItem value="low">🟢 Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={form.category} onValueChange={(v) => set('category', v)} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">⚙️ Technical</SelectItem>
                                        <SelectItem value="billing">💳 Billing</SelectItem>
                                        <SelectItem value="account">👤 Account</SelectItem>
                                        <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                                        <SelectItem value="complaint">📣 Complaint</SelectItem>
                                        <SelectItem value="general">📋 General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#056BFC] hover:bg-[#056BFC]/90 text-white font-semibold"
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                                ) : (
                                    <><Plus className="mr-2 h-4 w-4" /> Create Ticket</>
                                )}
                            </Button>
                            <Link href="/tickets">
                                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
