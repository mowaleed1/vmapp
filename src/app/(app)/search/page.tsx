import { TicketSearch } from '@/components/TicketSearch'
import { Search } from 'lucide-react'

export const metadata = { title: 'Search — VMApp' }

export default function SearchPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#056BFC]/10">
                    <Search className="h-5 w-5 text-[#056BFC]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Search</h2>
                    <p className="text-sm text-muted-foreground">Find tickets by keyword, summary, or category</p>
                </div>
            </div>
            <TicketSearch />
        </div>
    )
}
