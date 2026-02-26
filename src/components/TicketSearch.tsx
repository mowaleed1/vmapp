'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Ticket, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface TicketResult {
    id: string
    title: string
    priority: string
    status: string
    category: string | null
    summary: string | null
    created_at: string
}

const STATUS_CONFIG: Record<string, { icon: any; class: string; label: string }> = {
    open: { icon: AlertCircle, class: 'text-[#056BFC]', label: 'Open' },
    in_progress: { icon: Clock, class: 'text-[#FABD00]', label: 'In Progress' },
    resolved: { icon: CheckCircle2, class: 'text-[#3FD534]', label: 'Resolved' },
    closed: { icon: XCircle, class: 'text-muted-foreground', label: 'Closed' },
}

const PRIORITY_CLASS: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-600 border-green-500/20',
}

export function TicketSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<TicketResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([])
            setSearched(false)
            return
        }
        setLoading(true)
        setSearched(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('tickets')
            .select('id, title, priority, status, category, summary, created_at')
            .or(`title.ilike.%${q}%,description.ilike.%${q}%,summary.ilike.%${q}%,category.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .limit(20)

        setResults(data ?? [])
        setLoading(false)
    }, [])

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value
        setQuery(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(val), 300)
    }

    return (
        <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
                {loading
                    ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                }
                <Input
                    autoFocus
                    placeholder="Search by title, description, summary, category…"
                    value={query}
                    onChange={handleInput}
                    className="pl-9 h-12 text-base"
                />
            </div>

            {/* Results */}
            {searched && !loading && results.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                    <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No tickets found for &quot;{query}&quot;</p>
                    <p className="text-sm mt-1">Try a different keyword or <Link href="/tickets/new" className="text-[#056BFC] hover:underline">create a ticket</Link></p>
                </div>
            )}

            {results.length > 0 && (
                <div className="rounded-xl border bg-card overflow-hidden divide-y">
                    <div className="px-4 py-2.5 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                        {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                    </div>
                    {results.map((t) => {
                        const sCfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open
                        const StatusIcon = sCfg.icon
                        return (
                            <Link
                                key={t.id}
                                href={`/tickets/${t.id}`}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate group-hover:text-[#056BFC] transition-colors">{t.title}</p>
                                    {t.summary && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.summary}</p>
                                    )}
                                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                        TKT-{t.id.slice(0, 8).toUpperCase()}
                                        {t.category && ` · ${t.category.replace('_', ' ')}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_CLASS[t.priority] ?? PRIORITY_CLASS.medium}`}>
                                        {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                                    </span>
                                    <div className={`flex items-center gap-1 text-xs font-medium ${sCfg.class}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        {sCfg.label}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            {!searched && (
                <div className="py-16 text-center text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Start typing to search across all tickets</p>
                </div>
            )}
        </div>
    )
}
