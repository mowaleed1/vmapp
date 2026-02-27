import { VMLoader } from '@/components/ui/vm-loader'

export default function Loading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-background/80 backdrop-blur-sm z-[9999]">
            <VMLoader loading={true} />
        </div>
    )
}
