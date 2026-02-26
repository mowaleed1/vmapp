import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'notifications@valuemomentum.com'

interface EmailPayload {
    to: string
    subject: string
    html: string
}

async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not set — skipping email send')
        return { ok: false, skipped: true }
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    return { ok: res.ok, status: res.status }
}

function vmEmailTemplate(title: string, body: string, ctaUrl?: string, ctaLabel?: string) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a2332;padding:28px 40px;text-align:left;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">
              VM<span style="color:#056BFC;">.</span> Support
            </span>
            <span style="color:#ffffff;opacity:0.5;font-size:11px;margin-left:12px;text-transform:uppercase;letter-spacing:1px;">Enterprise</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${title}</h1>
            <div style="color:#6b7280;font-size:15px;line-height:1.6;">${body}</div>
            ${ctaUrl ? `
            <div style="margin-top:32px;">
              <a href="${ctaUrl}" style="display:inline-block;background:#056BFC;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                ${ctaLabel ?? 'View Ticket'}
              </a>
            </div>` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              This is an automated notification from ValueMomentum Support Platform.<br/>
              Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
    try {
        const { event, ticketId } = await req.json()

        if (!event || !ticketId) {
            return NextResponse.json({ error: 'Missing event or ticketId' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: ticket } = await supabase
            .from('tickets')
            .select(`
                id, title, description, priority, status, ticket_number, created_at,
                requester:users!tickets_requester_id_fkey(full_name, email),
                assigned:users!tickets_assigned_to_fkey(full_name, email)
            `)
            .eq('id', ticketId)
            .single()

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        const ticketNum = (ticket as any).ticket_number ?? `VM-${ticket.id.slice(0, 6).toUpperCase()}`
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
        const ticketUrl = `${baseUrl}/tickets/${ticket.id}`
        const requesterEmail = (ticket.requester as any)?.email
        const assignedEmail = (ticket.assigned as any)?.email
        const priorityLabel = ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)

        let emailsSent = 0

        switch (event) {
            case 'ticket_created': {
                if (requesterEmail) {
                    await sendEmail({
                        to: requesterEmail,
                        subject: `Ticket ${ticketNum} created — ${ticket.title}`,
                        html: vmEmailTemplate(
                            `Your ticket has been received`,
                            `<p>Hi ${(ticket.requester as any)?.full_name ?? 'there'},</p>
                             <p>Your support ticket has been logged and our team will be in touch shortly.</p>
                             <table style="border-collapse:collapse;width:100%;margin:20px 0;">
                               <tr><td style="padding:8px 0;color:#374151;font-weight:600;width:120px;">Ticket</td><td style="padding:8px 0;font-family:monospace;color:#056BFC;">${ticketNum}</td></tr>
                               <tr><td style="padding:8px 0;color:#374151;font-weight:600;">Subject</td><td style="padding:8px 0;">${ticket.title}</td></tr>
                               <tr><td style="padding:8px 0;color:#374151;font-weight:600;">Priority</td><td style="padding:8px 0;">${priorityLabel}</td></tr>
                             </table>`,
                            ticketUrl,
                            'View Ticket'
                        ),
                    })
                    emailsSent++
                }
                break
            }

            case 'ticket_assigned': {
                if (assignedEmail) {
                    await sendEmail({
                        to: assignedEmail,
                        subject: `Assigned: ${ticketNum} — ${ticket.title}`,
                        html: vmEmailTemplate(
                            `You have been assigned a ticket`,
                            `<p>Hi ${(ticket.assigned as any)?.full_name ?? 'there'},</p>
                             <p>You have been assigned the following support ticket. Please review and respond within the SLA window.</p>
                             <table style="border-collapse:collapse;width:100%;margin:20px 0;">
                               <tr><td style="padding:8px 0;color:#374151;font-weight:600;width:120px;">Ticket</td><td style="padding:8px 0;font-family:monospace;color:#056BFC;">${ticketNum}</td></tr>
                               <tr><td style="padding:8px 0;color:#374151;font-weight:600;">Subject</td><td style="padding:8px 0;">${ticket.title}</td></tr>
                               <tr><td style="padding:8px 0;color:#374151;font-weight:600;">Priority</td><td style="padding:8px 0;color:${ticket.priority === 'critical' ? '#dc2626' : ticket.priority === 'high' ? '#ea580c' : '#374151'};">${priorityLabel}</td></tr>
                             </table>`,
                            ticketUrl,
                            'Open Ticket'
                        ),
                    })
                    emailsSent++
                }
                break
            }

            case 'status_changed': {
                const { newStatus } = await req.json().catch(() => ({}))
                if (requesterEmail) {
                    const statusLabel = (newStatus ?? ticket.status).replace('_', ' ')
                    await sendEmail({
                        to: requesterEmail,
                        subject: `Ticket ${ticketNum} — status updated to ${statusLabel}`,
                        html: vmEmailTemplate(
                            `Your ticket status has been updated`,
                            `<p>Hi ${(ticket.requester as any)?.full_name ?? 'there'},</p>
                             <p>The status of your support ticket <strong>${ticketNum}</strong> has been updated to <strong>${statusLabel}</strong>.</p>`,
                            ticketUrl,
                            'View Ticket'
                        ),
                    })
                    emailsSent++
                }
                break
            }

            case 'sla_warning':
            case 'sla_breach': {
                const isBreach = event === 'sla_breach'
                const recipients = [assignedEmail, requesterEmail].filter(Boolean) as string[]
                for (const to of recipients) {
                    await sendEmail({
                        to,
                        subject: `${isBreach ? '🚨 SLA BREACHED' : '⚠️ SLA Warning'}: ${ticketNum} — ${ticket.title}`,
                        html: vmEmailTemplate(
                            isBreach ? 'SLA Breach — Immediate Action Required' : 'SLA Warning — Response Deadline Approaching',
                            `<p>Ticket <strong>${ticketNum}</strong> — <em>${ticket.title}</em> — has ${isBreach ? 'breached its SLA response deadline' : 'less than 1 hour remaining on its SLA'}.</p>
                             <p>Priority: <strong style="color:#dc2626;">${priorityLabel}</strong></p>
                             <p>Please take action immediately.</p>`,
                            ticketUrl,
                            'View Ticket Now'
                        ),
                    })
                    emailsSent++
                }
                break
            }

            default:
                return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
        }

        return NextResponse.json({ ok: true, emailsSent })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
