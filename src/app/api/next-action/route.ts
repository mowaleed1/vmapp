import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI()

export async function POST(req: Request) {
    try {
        const { ticketTitle, ticketDescription, ticketSummary, transcript, comments } = await req.json()
        if (!ticketTitle) {
            return NextResponse.json({ error: 'Missing ticket context' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const commentSummary = (comments ?? [])
            .slice(-5)
            .map((c: any) => `${c.is_internal ? '[Internal] ' : ''}${c.body}`)
            .join('\n')

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert customer support team lead. Analyze the given ticket and recommend the single best next action for the agent. Be concise (1-2 sentences) and actionable. Also assign a confidence level: high, medium, or low.

Return ONLY valid JSON with this shape:
{
  "action": "String — the specific recommended action",
  "reason": "String — brief explanation of why",
  "confidence": "high" | "medium" | "low",
  "type": "escalate" | "gather_info" | "resolve" | "follow_up" | "assign" | "close"
}`
                },
                {
                    role: 'user',
                    content: `Ticket: "${ticketTitle}"
Description: ${ticketDescription ?? 'N/A'}
Summary: ${ticketSummary ?? 'N/A'}
Transcript: ${transcript ?? 'N/A'}
Recent comments:
${commentSummary || 'No comments yet.'}`
                }
            ],
            response_format: { type: 'json_object' }
        })

        const raw = completion.choices[0].message.content ?? '{}'
        const result = JSON.parse(raw)

        return NextResponse.json(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
