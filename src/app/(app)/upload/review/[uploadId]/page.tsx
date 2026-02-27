import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AudioReviewPanel } from '@/components/AudioReviewPanel'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Review User Upload — ValueMomentum' }

export default async function ReviewUploadPage({ params }: { params: { uploadId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Access control: only admin/agent can review
    const { data: profile } = await supabase.from('users').select('role:roles(name)').eq('id', user.id).single()
    const roleData = profile?.role as any
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
    if (roleName === 'user') {
        redirect('/upload')
    }

    const { data: uploadFile } = await supabase
        .from('upload_files')
        .select('*')
        .eq('id', params.uploadId)
        .single()

    if (!uploadFile) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
                <h2 className="text-xl font-bold">Upload Not Found</h2>
                <p className="text-muted-foreground">This upload may have been deleted or already processed.</p>
                <Link href="/dashboard/agent" className="text-[#056BFC] hover:underline inline-flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                </Link>
            </div>
        )
    }

    if (uploadFile.status !== 'awaiting_agent_review' && uploadFile.status !== 'pending_review') {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
                <h2 className="text-xl font-bold">Already Processed</h2>
                <p className="text-muted-foreground">This upload has already been processed (Status: {uploadFile.status}).</p>
                {uploadFile.ticket_id && (
                    <Link href={`/tickets/${uploadFile.ticket_id}`} className="inline-flex items-center px-4 py-2 bg-[#056BFC] text-white rounded-lg">
                        View Ticket
                    </Link>
                )}
                <div className="pt-4">
                    <Link href="/dashboard/agent" className="text-[#056BFC] hover:underline inline-flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const analysis = uploadFile.ai_analysis as any
    if (!analysis) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                AI Analysis data is missing for this upload.
            </div>
        )
    }

    // Adapt the DB ai_analysis JSON back into the AnalysisResult shape Expected by AudioReviewPanel
    const analysisResult = {
        uploadFileId: uploadFile.id,
        transcript: uploadFile.transcript || '',
        title: analysis.title || 'Untitled',
        description: analysis.description || '',
        priority: analysis.priority || 'medium',
        category: analysis.category || 'general',
        summary: analysis.summary || '',
        linked_ticket_number: analysis.linked_ticket_number || null
    }

    return (
        <div className="max-w-4xl space-y-6">
            <Link href="/dashboard/agent" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
            </Link>

            <div>
                <h2 className="text-2xl font-bold">Review User Upload</h2>
                <p className="text-muted-foreground mt-1">
                    Review and finalize the AI-generated details before creating the official ticket.
                </p>
            </div>

            <div className="bg-card rounded-xl border p-6">
                <AudioReviewPanel
                    analysis={analysisResult}
                    onDismiss={() => {
                        // In a real app we might use a router.push here, but the panel handles
                        // the "Create Ticket" action, overriding this. We can just rely on standard navigation 
                        // from the AudioReviewPanel on completion.
                    }}
                />
            </div>
        </div>
    )
}
