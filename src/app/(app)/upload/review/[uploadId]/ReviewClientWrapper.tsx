'use client'

import { useRouter } from 'next/navigation'
import { AudioReviewPanel } from '@/components/AudioReviewPanel'

export function ReviewClientWrapper({ analysisResult }: { analysisResult: any }) {
    const router = useRouter()
    return (
        <AudioReviewPanel
            analysis={analysisResult}
            onDismiss={() => {
                router.push('/requests')
            }}
        />
    )
}
