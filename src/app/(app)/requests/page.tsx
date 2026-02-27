import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Activity, FileText, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Requests — ValueMomentum' }

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export default async function RequestsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('role:roles(name)').eq('id', user.id).single()
    const roleData = profile?.role as any
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name

    if (roleName === 'user') {
        redirect('/dashboard/user')
    }

    // Pending User Uploads
    const { data: pendingUploads } = await supabase
        .from('upload_files')
        .select('id, file_name, created_at, ai_analysis, users!upload_files_user_id_fkey(full_name, email)')
        .eq('status', 'awaiting_agent_review')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Pending Requests</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Review and approve user-submitted audio tickets.</p>
                </div>
            </div>

            {!pendingUploads || pendingUploads.length === 0 ? (
                <div className="rounded-xl border bg-card p-16 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500/50" />
                    <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
                    <p className="text-muted-foreground text-sm mt-1">There are no pending requests requiring agent review right now.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-purple-200 bg-purple-50/30 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-purple-100 bg-purple-50/50 text-purple-900">
                        <Activity className="h-5 w-5 text-purple-600 animate-pulse" />
                        <h3 className="font-semibold">Review Required</h3>
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                            {pendingUploads.length} pending
                        </span>
                    </div>
                    <div className="divide-y divide-purple-100/50">
                        {pendingUploads.map(upload => {
                            const analysis = upload.ai_analysis as any
                            return (
                                <Link key={upload.id} href={`/upload/review/${upload.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-purple-100/50 transition-colors group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-10 w-10 rounded-lg bg-white border border-purple-100 shadow-sm flex items-center justify-center shrink-0 group-hover:border-purple-300 transition-colors">
                                            <FileText className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-purple-950 truncate">{analysis?.title || 'Untitled Audio Format'}</p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-purple-700/80">
                                                <span>User: {(upload.users as any)?.full_name || (upload.users as any)?.email}</span>
                                                <span>·</span>
                                                <span>Submitted {timeAgo(upload.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-purple-600 bg-white border border-purple-200 px-4 py-2 rounded-md shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all whitespace-nowrap ml-4">
                                        Review Audio →
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
