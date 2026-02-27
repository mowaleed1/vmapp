'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { VMLoader } from '@/components/ui/vm-loader'
import { toast } from 'sonner'

export function TicketBulkExport({ ticketIds }: { ticketIds: string[] }) {
    const [exporting, setExporting] = useState(false)

    async function handleExport() {
        if (!ticketIds.length) {
            toast.error('No tickets selected')
            return
        }

        setExporting(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    id, ticket_number, title, priority, status, category, sla_breach_at, created_at,
                    requester:users!tickets_requester_id_fkey(email),
                    assigned:users!tickets_assigned_to_fkey(email)
                `)
                .in('id', ticketIds)

            if (error || !data) throw new Error(error?.message ?? 'Export failed')

            // Create CSV header
            const headers = ['Ticket Number', 'Title', 'Priority', 'Status', 'Category', 'Requester', 'Assigned To', 'SLA Breach', 'Created At']
            const csvRows = [headers.join(',')]

            // Create CSV rows
            for (const row of data as any[]) {
                const values = [
                    row.ticket_number ?? row.id,
                    `"${(row.title || '').replace(/"/g, '""')}"`, // escape quotes
                    row.priority,
                    row.status,
                    row.category || '',
                    row.requester?.email || '',
                    row.assigned?.email || '',
                    row.sla_breach_at || '',
                    row.created_at || ''
                ]
                csvRows.push(values.join(','))
            }

            const csvString = csvRows.join('\n')
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `vm_tickets_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success(`Exported ${data.length} tickets`)
        } catch (err: unknown) {
            toast.error('Export failed')
            console.error(err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || ticketIds.length === 0}
            className="gap-2"
        >
            {exporting ? <VMLoader className="h-5 w-5 mr-1" /> : <Download className="h-4 w-4" />}
            Export CSV
        </Button>
    )
}
