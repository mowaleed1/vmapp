import { NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI()

export async function POST(req: Request) {
    try {
        const { uploadFileId, storagePath } = await req.json()

        if (!uploadFileId || !storagePath) {
            return NextResponse.json({ error: 'Missing uploadFileId or storagePath' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Mark as transcribing
        await supabase.from('upload_files').update({ status: 'transcribing' }).eq('id', uploadFileId)

        // 2. Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('audio-uploads')
            .download(storagePath)

        if (downloadError || !fileData) {
            await supabase.from('upload_files').update({
                status: 'failed',
                error_message: downloadError?.message ?? 'Download failed.'
            }).eq('id', uploadFileId)
            return NextResponse.json({ error: 'Download failed.' }, { status: 500 })
        }

        // 3. Convert to OpenAI File
        const buffer = await fileData.arrayBuffer()
        const fileName = storagePath.split('/').pop() ?? 'audio.mp3'
        const audioFile = await toFile(Buffer.from(buffer), fileName, { type: fileData.type || 'audio/mpeg' })

        // 4. Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile as any,
            model: 'whisper-1',
            language: 'en',
        })
        const transcript = transcription.text

        // 5. Mark as summarizing
        await supabase.from('upload_files').update({ transcript, status: 'summarizing' }).eq('id', uploadFileId)

        // 6. GPT: extract ticket structured data
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support ticket triage assistant for ValueMomentum, an insurance technology company.
Given a voice recording transcript, extract a structured support ticket.
If the transcript mentions a specific prior ticket number (e.g., "VM-1234", "ticket 5678", "issue one two three"), extract it exactly as it sounded in 'linked_ticket_number'.
Return ONLY valid JSON with this exact shape:
{
  "title": "Short, clear ticket title (max 80 chars)",
  "description": "Detailed description of the issue based on the transcript",
  "priority": "low" | "medium" | "high" | "critical",
  "category": "billing" | "technical" | "account" | "feature_request" | "general",
  "summary": "1-2 sentence summary of the core issue",
  "linked_ticket_number": "Any mentioned ticket reference string or null"
}`
                },
                {
                    role: 'user',
                    content: `Transcript:\n"${transcript}"`
                }
            ],
            response_format: { type: 'json_object' }
        })

        const raw = completion.choices[0].message.content ?? '{}'
        const ticketFields = JSON.parse(raw)

        // 7. Mark as "pending_review" — do NOT auto-create ticket
        await supabase.from('upload_files').update({
            status: 'pending_review',
            transcript,
        }).eq('id', uploadFileId)

        // Return analysis for user review
        return NextResponse.json({
            uploadFileId,
            transcript,
            title: ticketFields.title ?? 'Untitled Ticket',
            description: ticketFields.description ?? transcript,
            priority: ticketFields.priority ?? 'medium',
            category: ticketFields.category ?? 'general',
            summary: ticketFields.summary ?? '',
            linked_ticket_number: ticketFields.linked_ticket_number ?? null,
        })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[transcribe API error]', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
