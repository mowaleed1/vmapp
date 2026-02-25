'use client'

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    UploadCloud, X, FileAudio, CheckCircle2, AlertCircle,
    Loader2, Mic, StopCircle, Play, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type FileStatus = 'pending' | 'uploading' | 'transcribing' | 'summarizing' | 'completed' | 'failed'

interface UploadFile {
    id: string
    file: File
    status: FileStatus
    progress: number
    error?: string
    ticketId?: string
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a']
const MAX_FILE_SIZE_MB = 100

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusIcon({ status }: { status: FileStatus }) {
    if (status === 'uploading' || status === 'transcribing' || status === 'summarizing') {
        return <Loader2 className="h-4 w-4 animate-spin text-[#056BFC]" />
    }
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-[#3FD534]" />
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-destructive" />
    return <FileAudio className="h-4 w-4 text-muted-foreground" />
}

function StatusLabel({ status }: { status: FileStatus }) {
    const map: Record<FileStatus, { label: string; class: string }> = {
        pending: { label: 'Queued', class: 'text-muted-foreground' },
        uploading: { label: 'Uploading…', class: 'text-[#056BFC]' },
        transcribing: { label: 'Transcribing…', class: 'text-[#FABD00]' },
        summarizing: { label: 'Creating ticket…', class: 'text-purple-500' },
        completed: { label: 'Ticket created', class: 'text-[#3FD534]' },
        failed: { label: 'Failed', class: 'text-destructive' },
    }
    const { label, class: cls } = map[status]
    return <span className={`text-xs font-medium ${cls}`}>{label}</span>
}

export function UploadZone({ userId, batchId }: { userId: string; batchId: string }) {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState<UploadFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function validateAndAddFiles(incoming: File[]) {
        const valid: UploadFile[] = []
        const errors: string[] = []

        for (const f of incoming) {
            if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp3|mp4|wav|ogg|webm|m4a)$/i)) {
                errors.push(`${f.name}: unsupported format`)
                continue
            }
            if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                errors.push(`${f.name}: exceeds ${MAX_FILE_SIZE_MB}MB limit`)
                continue
            }
            // Avoid duplicates
            if (files.some((uf) => uf.file.name === f.name && uf.file.size === f.size)) {
                errors.push(`${f.name}: already added`)
                continue
            }
            valid.push({ id: crypto.randomUUID(), file: f, status: 'pending', progress: 0 })
        }

        if (errors.length > 0) {
            toast.error(errors.join('\n'))
        }
        if (valid.length > 0) {
            setFiles((prev) => [...prev, ...valid])
        }
    }

    function onDragOver(e: DragEvent) {
        e.preventDefault()
        setIsDragging(true)
    }
    function onDragLeave(e: DragEvent) {
        e.preventDefault()
        setIsDragging(false)
    }
    function onDrop(e: DragEvent) {
        e.preventDefault()
        setIsDragging(false)
        validateAndAddFiles(Array.from(e.dataTransfer.files))
    }
    function onFileInput(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            validateAndAddFiles(Array.from(e.target.files))
            e.target.value = ''
        }
    }

    function removeFile(id: string) {
        setFiles((prev) => prev.filter((f) => f.id !== id))
    }

    function updateFile(id: string, patch: Partial<UploadFile>) {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f))
    }

    async function uploadSingleFile(uf: UploadFile) {
        const supabase = createClient()
        const ext = uf.file.name.split('.').pop()
        const path = `${userId}/${batchId}/${uf.id}.${ext}`

        updateFile(uf.id, { status: 'uploading', progress: 10 })

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('audio-uploads')
            .upload(path, uf.file, { upsert: false })

        if (storageError) {
            updateFile(uf.id, { status: 'failed', error: storageError.message })
            return
        }

        updateFile(uf.id, { progress: 50 })

        // Create upload_files DB record
        const { data: uploadRecord, error: dbError } = await supabase
            .from('upload_files')
            .insert({
                batch_id: batchId,
                user_id: userId,
                file_name: uf.file.name,
                file_size_bytes: uf.file.size,
                storage_path: path,
                status: 'uploading',
            })
            .select()
            .single()

        if (dbError || !uploadRecord) {
            updateFile(uf.id, { status: 'failed', error: dbError?.message ?? 'DB error' })
            return
        }

        updateFile(uf.id, { progress: 75, status: 'transcribing' })

        // Kick off AI processing
        const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadFileId: uploadRecord.id, storagePath: path }),
        })

        if (!res.ok) {
            updateFile(uf.id, { status: 'failed', error: 'Processing failed' })
            return
        }

        const { ticketId } = await res.json()
        updateFile(uf.id, { status: 'completed', progress: 100, ticketId })
        toast.success(`Ticket created from "${uf.file.name}"`)
    }

    async function startUpload() {
        const pending = files.filter((f) => f.status === 'pending')
        if (pending.length === 0) {
            toast.warning('No files to upload!')
            return
        }

        setIsUploading(true)

        // Create the batch record first
        const supabase = createClient()
        await supabase.from('upload_batches').insert({
            id: batchId,
            user_id: userId,
            total_files: pending.length,
            status: 'processing',
        })

        // Upload in parallel
        await Promise.all(pending.map(uploadSingleFile))
        setIsUploading(false)

        const allDone = files.every((f) => f.status === 'completed' || f.status === 'failed')
        if (allDone) {
            const success = files.filter((f) => f.status === 'completed').length
            toast.success(`${success} of ${files.length} files processed successfully`)
        }
    }

    const pendingCount = files.filter((f) => f.status === 'pending').length
    const completedCount = files.filter((f) => f.status === 'completed').length

    return (
        <div className="space-y-6">
            {/* Drop Zone */}
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200',
                    isDragging
                        ? 'border-[#056BFC] bg-[#056BFC]/5 scale-[1.01]'
                        : 'border-muted-foreground/25 hover:border-[#056BFC]/50 hover:bg-muted/50'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".mp3,.mp4,.wav,.ogg,.webm,.m4a,audio/*"
                    className="hidden"
                    onChange={onFileInput}
                />
                <UploadCloud
                    className={cn('mx-auto h-12 w-12 mb-4 transition-colors', isDragging ? 'text-[#056BFC]' : 'text-muted-foreground')}
                />
                <h3 className="text-lg font-semibold mb-1">
                    {isDragging ? 'Drop files here' : 'Drag & drop audio files'}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                    or <span className="text-[#056BFC] font-medium">click to browse</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                    {['MP3', 'MP4', 'WAV', 'OGG', 'WebM', 'M4A'].map((fmt) => (
                        <span key={fmt} className="px-2 py-0.5 rounded-full bg-muted font-medium">{fmt}</span>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Max {MAX_FILE_SIZE_MB}MB per file</p>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                        <span className="text-sm font-medium">
                            {files.length} file{files.length !== 1 ? 's' : ''} selected
                            {completedCount > 0 && ` · ${completedCount} completed`}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFiles([])}
                            disabled={isUploading}
                            className="text-xs text-muted-foreground h-7"
                        >
                            <Trash2 className="h-3 w-3 mr-1" /> Clear all
                        </Button>
                    </div>

                    <div className="divide-y">
                        {files.map((uf) => (
                            <div key={uf.id} className="flex items-center gap-4 px-5 py-4">
                                {/* Status icon */}
                                <div className="shrink-0">
                                    <StatusIcon status={uf.status} />
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium truncate">{uf.file.name}</p>
                                        <div className="flex items-center gap-3 ml-3 shrink-0">
                                            <StatusLabel status={uf.status} />
                                            <span className="text-xs text-muted-foreground">{formatBytes(uf.file.size)}</span>
                                            {uf.ticketId && (
                                                <a href={`/tickets/${uf.ticketId}`} className="text-xs text-[#056BFC] hover:underline">
                                                    View ticket →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    {(uf.status === 'uploading' || uf.status === 'transcribing' || uf.status === 'summarizing') && (
                                        <Progress
                                            value={uf.progress}
                                            className="h-1.5 [&>div]:bg-[#056BFC]"
                                        />
                                    )}
                                    {uf.status === 'completed' && (
                                        <Progress value={100} className="h-1.5 [&>div]:bg-[#3FD534]" />
                                    )}
                                    {uf.error && (
                                        <p className="text-xs text-destructive mt-1">{uf.error}</p>
                                    )}
                                </div>

                                {/* Remove button */}
                                {uf.status === 'pending' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(uf.id) }}
                                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload action */}
            {files.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {pendingCount} file{pendingCount !== 1 ? 's' : ''} ready to process
                    </p>
                    <Button
                        onClick={startUpload}
                        disabled={isUploading || pendingCount === 0}
                        className="bg-[#056BFC] hover:bg-[#056BFC]/90 text-white font-semibold px-8"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing…
                            </>
                        ) : (
                            <>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Upload & Process {pendingCount > 0 ? `(${pendingCount})` : ''}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
