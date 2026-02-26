import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { ticketTitle, ticketDescription, ticketSummary, transcript, comments } = await req.json()

        const commentHistory = (comments ?? [])
            .map((c: { author: string; body: string }) => `${c.author}: ${c.body}`)
            .join('\n')

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful customer support agent assistant. You help agents write clear, empathetic, and professional replies to support tickets.
Generate 3 short reply suggestions (1-3 sentences each) for the agent to choose from.
Return ONLY valid JSON: { "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }
Tone: professional, empathetic, solution-focused. Keep suggestions concise and actionable.`,
                },
                {
                    role: 'user',
                    content: `Ticket: "${ticketTitle}"
${ticketSummary ? `Summary: ${ticketSummary}` : ''}
${ticketDescription ? `Description: ${ticketDescription}` : ''}
${transcript ? `Transcript: ${transcript.slice(0, 500)}` : ''}
${commentHistory ? `\nComment history:\n${commentHistory}` : ''}

Generate 3 reply suggestions for the agent.`,
                },
            ],
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0].message.content ?? '{}'
        const { suggestions } = JSON.parse(raw)
        return NextResponse.json({ suggestions: suggestions ?? [] })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
