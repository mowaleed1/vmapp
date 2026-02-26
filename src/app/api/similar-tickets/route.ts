import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { ticketId, title, description, summary } = await req.json()
        if (!ticketId || !title) {
            return NextResponse.json({ error: 'Missing ticketId or title' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Build a keyword set from the ticket text
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were', 'it', 'this', 'that', 'be', 'from', 'have', 'has'])
        const text = `${title} ${description ?? ''} ${summary ?? ''}`.toLowerCase()
        const words = text
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w))

        // Unique keywords, take top 10 most meaningful
        const keywords = [...new Set(words)].slice(0, 10)

        if (keywords.length === 0) {
            return NextResponse.json({ similar: [] })
        }

        // Fetch candidate tickets (excluding itself)
        const { data: candidates } = await supabase
            .from('tickets')
            .select('id, title, priority, status, summary, created_at')
            .neq('id', ticketId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (!candidates || candidates.length === 0) {
            return NextResponse.json({ similar: [] })
        }

        // Score each candidate by keyword overlap
        const scored = candidates.map(t => {
            const candidateText = `${t.title} ${t.summary ?? ''}`.toLowerCase()
            const matches = keywords.filter(kw => candidateText.includes(kw)).length
            return { ...t, score: matches }
        })
            .filter(t => t.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)

        return NextResponse.json({ similar: scored })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
