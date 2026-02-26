import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { TicketNotificationEmail } from '@/emails/ticket-notification'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 10 // Setup max duration for edge deployment if needed
export const dynamic = 'force-dynamic' // Prevent Next.js from prerendering this webhook route

export async function POST(req: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@valuemomentum.com'

    // A background, service-role supabase client just to look up user emails internally without RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const payload = await req.json()

        // Log the payload to see the webhook structure
        console.log('Webhook payload received:', payload)

        const { type, record, old_record } = payload

        if (!record || !record.id) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const ticketId = record.display_id || record.id
        const title = record.title || 'Support Ticket'
        let action: 'Created' | 'Assigned' | 'Updated' | 'SLA Warning' | 'SLA Breach' | 'Resolved' | 'Closed' = 'Updated'
        let message = ''
        let recipientId = null

        if (type === 'INSERT') {
            action = 'Created'
            message = 'A new ticket has been generated and is awaiting assignment.'
            recipientId = record.created_by
        } else if (type === 'UPDATE') {
            if (record.status !== old_record?.status) {
                if (record.status === 'resolved') action = 'Resolved'
                else if (record.status === 'closed') action = 'Closed'
                else action = 'Updated'

                message = `The status of this ticket has changed from ${old_record?.status || 'unknown'} to ${record.status}.`
                recipientId = record.created_by // Notify the reporter of status changes
            }

            if (record.assigned_to && record.assigned_to !== old_record?.assigned_to) {
                action = 'Assigned'
                message = `You have been assigned to handle this ticket.`
                recipientId = record.assigned_to // Notify the assigned agent
            }
        }

        // We could also do SLA checks here via a different CRON trigger or by observing an 'is_breaching' column, setup for future

        if (!recipientId) {
            return NextResponse.json({ message: 'No recipient identified for this event, ignoring.' }, { status: 200 })
        }

        // Fetch user email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', recipientId)
            .single()

        if (userError || !user?.email) {
            console.error('Failed to find user email for ID:', recipientId, userError)
            return NextResponse.json({ error: 'Recipient email not found mapping to internal user' }, { status: 400 })
        }

        // Send Email via Resend
        const data = await resend.emails.send({
            from: `VMApp Notifications <${fromEmail}>`,
            to: [user.email],
            subject: `[${ticketId}] Ticket ${action} - ${title}`,
            react: TicketNotificationEmail({
                ticketId,
                title,
                action,
                message,
            }),
        })

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error processing ticket webhook:', error)
        return NextResponse.json({ error: 'Internal server error while processing webhook' }, { status: 500 })
    }
}
