'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function TicketSaveViewDialog({ currentFilters }: { currentFilters: Record<string, string> }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setSaving(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('You must be logged in to save views')
                setSaving(false)
                return
            }

            const { error } = await supabase.from('saved_views').insert({
                user_id: user.id,
                name: name.trim(),
                filters: currentFilters
            })

            if (error) throw error

            toast.success('View saved successfully')
            setOpen(false)
            setName('')

            // Dispatch event for Sidebar to re-fetch views
            window.dispatchEvent(new Event('view_saved'))

            router.refresh()
        } catch (error: any) {
            // Log specific properties because Supabase PostgrestError objects often log as {} in Next.js Turbopack
            console.error('Error saving view:', {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code
            })

            if (error?.code === 'PGRST205') {
                toast.error('Views table missing. Please run database migrations.')
            } else {
                toast.error(error?.message || 'Failed to save view')
            }
        } finally {
            setSaving(false)
        }
    }

    // Only render the button if there are actually filters active
    if (Object.keys(currentFilters).length === 0) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 h-7 text-xs flex items-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground">
                    <Bookmark className="h-3.5 w-3.5" />
                    Save View
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>Save Current View</DialogTitle>
                        <DialogDescription>
                            Save this exact combination of filters so you can easily access it later from the sidebar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">View Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. My Open Criticals"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#056BFC] hover:bg-[#0455CC] text-white" disabled={saving || !name.trim()}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                            Save View
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
