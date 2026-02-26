import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcSlaBreachAt } from '@/lib/sla'
import stringSimilarity from 'string-similarity'

function generateTicketNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = 'VM-'
    for (let i = 0; i < 6; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

export async function POST(req: Request) {
    try {
        const { uploadFileId, title, description, priority, category, summary, transcript, linked_ticket_number } = await req.json()

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if this audio transcript mentions an existing ticket
        if (linked_ticket_number) {
            let matchedTicket = null

            // Phase 1: Try an exact or partial substring match first
            // Note: We strip whitespace to help with basic formatting issues
            const cleanSourceNumber = linked_ticket_number.replace(/\s+/g, '')

            const { data: exactMatch } = await supabase
                .from('tickets')
                .select('id, ticket_number, description, transcript, summary')
                .ilike('ticket_number', `%${cleanSourceNumber}%`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (exactMatch) {
                matchedTicket = exactMatch
            } else {
                // Phase 2: Fuzzy matching for heavy typos (e.g. "BM-1234" instead of "VM-1234")
                // Fetch the most recent 100 tickets to run our algorithm against
                const { data: recentTickets } = await supabase
                    .from('tickets')
                    .select('id, ticket_number, description, transcript, summary')
                    .order('created_at', { ascending: false })
                    .limit(100)

                if (recentTickets && recentTickets.length > 0) {
                    const ticketNumbers = recentTickets.map(t => t.ticket_number)
                    // Compare the raw AI string against the array of real database strings
                    const matchResult = stringSimilarity.findBestMatch(linked_ticket_number.toUpperCase(), ticketNumbers)

                    // Dice's coefficient for "VM-1234" vs "BM-1234" is ~0.83.
                    if (matchResult.bestMatch.rating >= 0.60) {
                        const bestMatchedTicket = recentTickets.find(t => t.ticket_number === matchResult.bestMatch.target)
                        if (bestMatchedTicket) {
                            matchedTicket = bestMatchedTicket
                            console.log(`Fuzzy matched! Transcript said: "${linked_ticket_number}", linked to: "${matchedTicket.ticket_number}" (Score: ${matchResult.bestMatch.rating})`)
                        }
                    }
                }
            }

            if (matchedTicket) {
                const timestamp = new Date().toLocaleString()
                const divider = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n**PREVIOUS REPORT (${timestamp})**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

                // Prepend new details to old details with a visual boundary
                const newDescription = description ? `${description}${divider}${matchedTicket.description || ''}` : matchedTicket.description
                const newSummary = summary ? `**Audio Update (${timestamp}):**\n${summary}${divider}${matchedTicket.summary || ''}` : matchedTicket.summary
                const newTranscript = transcript ? `**Audio Update (${timestamp}):**\n${transcript}${divider}${matchedTicket.transcript || ''}` : matchedTicket.transcript

                // Update the Ticket explicitly, prepending the text (no comment generated)
                const { error: updateError } = await supabase.from('tickets').update({
                    description: newDescription,
                    summary: newSummary,
                    transcript: newTranscript
                }).eq('id', matchedTicket.id)

                if (updateError) {
                    return NextResponse.json({ error: 'Failed to append update to ticket' }, { status: 500 })
                }

                // Attach the audio File to this old ticket
                if (uploadFileId) {
                    await supabase.from('upload_files').update({
                        status: 'completed',
                        ticket_id: matchedTicket.id,
                    }).eq('id', uploadFileId)
                }

                // Log the activity
                await supabase.from('ticket_activity_logs').insert({
                    ticket_id: matchedTicket.id,
                    actor_id: user.id,
                    action: 'ticket_updated',
                    new_value: { note: 'Ticket body explicitly updated and prepended via new audio recording' }
                })

                // Inform the frontend to redirect to the updated existing ticket
                return NextResponse.json({ ticketId: matchedTicket.id, ticketNumber: matchedTicket.ticket_number })
            }
        }

        // --- FALLBACK: CREATE NEW TICKET ---

        const ticketNumber = generateTicketNumber()
        const resolvedPriority = priority ?? 'medium'

        const slaBreachAt = calcSlaBreachAt(resolvedPriority, new Date().toISOString())

        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert({
                ticket_number: ticketNumber,
                title,
                description,
                transcript: transcript ?? null,
                summary: summary ?? '',
                priority: resolvedPriority,
                category: category ?? 'general',
                status: 'open',
                requester_id: user.id,
                sla_breach_at: slaBreachAt,
            })
            .select()
            .single()

        if (ticketError || !ticket) {
            return NextResponse.json({ error: ticketError?.message ?? 'Ticket creation failed' }, { status: 500 })
        }

        // Update upload file if this came from an audio upload
        if (uploadFileId) {
            await supabase.from('upload_files').update({
                status: 'completed',
                ticket_id: ticket.id,
            }).eq('id', uploadFileId)
        }

        // Record creation in activity log
        await supabase.from('ticket_activity_logs').insert({
            ticket_id: ticket.id,
            actor_id: user.id,
            action: 'ticket_created',
            new_value: { priority: ticket.priority }
        })

        // Fire email notification (best-effort)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
        fetch(`${baseUrl}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'ticket_created', ticketId: ticket.id }),
        }).catch(() => { /* silent */ })

        return NextResponse.json({ ticketId: ticket.id, ticketNumber })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
