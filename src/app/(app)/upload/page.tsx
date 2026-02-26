import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UploadZone } from '@/components/UploadZone'
import { UploadCloud, FileAudio, Zap, FileCheck } from 'lucide-react'

export const metadata = {
    title: 'Upload Audio — ValueMomentum',
}

export default async function UploadPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const batchId = crypto.randomUUID()

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold">Upload Audio</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Upload voice recordings or call audio. Our AI will transcribe and extract ticket details for your review before creating.
                </p>
            </div>

            {/* How it works — no numbers, no emojis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ProcessStep icon={FileAudio} title="Upload Recording" desc="Drag & drop or browse MP3, WAV, M4A, or any audio format" />
                <ProcessStep icon={Zap} title="AI Transcribes & Analyses" desc="Whisper transcribes speech, GPT extracts title, priority & category" />
                <ProcessStep icon={FileCheck} title="Review & Confirm" desc="Review all extracted details before the ticket is created" />
            </div>

            {/* Upload Zone */}
            <div className="rounded-xl border bg-card p-6">
                <UploadZone userId={user.id} batchId={batchId} />
            </div>

            {/* Info note */}
            <div className="flex gap-3 p-4 rounded-lg bg-muted/30 border text-sm text-muted-foreground">
                <UploadCloud className="h-4 w-4 text-[#056BFC] shrink-0 mt-0.5" />
                <p>
                    Recordings are processed securely via OpenAI Whisper. After analysis you will see a full review panel with the transcription,
                    AI-suggested title, priority, and category — all editable before the ticket is created.
                </p>
            </div>
        </div>
    )
}

function ProcessStep({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
    return (
        <div className="flex gap-3 p-4 rounded-lg border bg-card">
            <div className="p-2 rounded-md bg-[#056BFC]/8 border border-[#056BFC]/15 shrink-0 h-fit">
                <Icon className="h-4 w-4 text-[#056BFC]" />
            </div>
            <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
