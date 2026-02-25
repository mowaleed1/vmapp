import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UploadZone } from '@/components/UploadZone'
import { UploadCloud, Mic } from 'lucide-react'

export const metadata = {
    title: 'Upload Audio — VMApp',
}

export default async function UploadPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Generate a batch ID for this upload session
    const batchId = crypto.randomUUID()

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[#056BFC]/10">
                        <UploadCloud className="h-6 w-6 text-[#056BFC]" />
                    </div>
                    <h2 className="text-2xl font-bold">Upload Audio</h2>
                </div>
                <p className="text-muted-foreground">
                    Upload voice recordings or call audio. VMApp will transcribe each file with Whisper and automatically create structured support tickets using GPT.
                </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <HowItWorksStep n={1} icon="🎙️" title="Upload Audio" desc="Drag & drop MP3, WAV, M4A, or any audio format" />
                <HowItWorksStep n={2} icon="⚡" title="AI Transcribes" desc="OpenAI Whisper converts speech to text in seconds" />
                <HowItWorksStep n={3} icon="🎫" title="Ticket Created" desc="GPT extracts title, priority, category & summary" />
            </div>

            {/* Upload Zone */}
            <div className="rounded-xl border bg-card p-6">
                <UploadZone userId={user.id} batchId={batchId} />
            </div>

            {/* Info callout */}
            <div className="flex gap-3 p-4 rounded-lg bg-[#056BFC]/5 border border-[#056BFC]/20 text-sm text-muted-foreground">
                <Mic className="h-5 w-5 text-[#056BFC] shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-foreground mb-1">Voice Recording (Coming Soon)</p>
                    <p>Record directly from your browser microphone with waveform visualization. Your recording will go through the same AI pipeline as uploaded files.</p>
                </div>
            </div>
        </div>
    )
}

function HowItWorksStep({ n, icon, title, desc }: { n: number; icon: string; title: string; desc: string }) {
    return (
        <div className="flex gap-3 p-4 rounded-lg border bg-muted/30">
            <div className="w-8 h-8 rounded-full bg-[#056BFC] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {n}
            </div>
            <div>
                <p className="font-semibold text-sm">{icon} {title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
        </div>
    )
}
