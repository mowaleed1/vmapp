import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Server-side Supabase with service role to bypass RLS in API routes
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const { uploadFileId, storagePath } = await req.json()

        if (!uploadFileId || !storagePath) {
            return NextResponse.json({ error: 'Missing uploadFileId or storagePath' }, { status: 400 })
        }

        // Mark as transcribing
        await supabase.from('upload_files').update({ status: 'transcribing' }).eq('id', uploadFileId)

        // Download file from Supabase Storage
        const { data: blob, error: downloadError } = await supabase.storage
            .from('audio-uploads')
            .download(storagePath)

        if (downloadError || !blob) {
            await supabase.from('upload_files').update({
                status: 'failed',
                error_message: downloadError?.message ?? 'Download failed'
            }).eq('id', uploadFileId)
            return NextResponse.json({ error: 'Download failed' }, { status: 500 })
        }

        // Convert to File for OpenAI
        const fileName = storagePath.split('/').pop() ?? 'audio.mp3'
        const audioFile = new File([blob], fileName, { type: blob.type || 'audio/mpeg' })

        // Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en',
        })

        const transcript = transcription.text
        await supabase.from('upload_files').update({ transcript, status: 'summarizing' }).eq('id', uploadFileId)

        // GPT: extract ticket fields
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support ticket triage assistant. 
Given a voice recording transcript, extract a structured support ticket.
Return ONLY valid JSON with this shape:
{
  "title": "Short, clear ticket title (max 80 chars)",
  "description": "Detailed description of the issue",
  "priority": "low" | "medium" | "high" | "critical",
  "category": "billing" | "technical" | "account" | "feature_request" | "complaint" | "general",
  "summary": "1–2 sentence summary of the core issue",
  "sentiment": "positive" | "neutral" | "negative" | "frustrated"
}`,
                },
                {
                    role: 'user',
                    content: `Transcript:\n"${transcript}"`,
                },
            ],
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0].message.content ?? '{}'
        const ticketFields = JSON.parse(raw)

        // Get the upload file's user_id
        const { data: uploadFile } = await supabase
            .from('upload_files')
            .select('user_id, batch_id')
            .eq('id', uploadFileId)
            .single()

        // Create ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert({
                title: ticketFields.title ?? 'Untitled Ticket',
                description: ticketFields.description ?? '',
                transcript,
                summary: ticketFields.summary ?? '',
                priority: ticketFields.priority ?? 'medium',
                category: ticketFields.category ?? 'general',
                status: 'open',
                requester_id: uploadFile?.user_id,
            })
            .select()
            .single()

        if (ticketError || !ticket) {
            await supabase.from('upload_files').update({
                status: 'failed',
                error_message: ticketError?.message ?? 'Ticket creation failed'
            }).eq('id', uploadFileId)
            return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
        }

        // Mark upload file as completed with ticket reference
        await supabase.from('upload_files').update({
            status: 'completed',
            ticket_id: ticket.id,
        }).eq('id', uploadFileId)

        return NextResponse.json({ ticketId: ticket.id, ticket })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[transcribe API]', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
