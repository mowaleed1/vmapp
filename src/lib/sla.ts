// SLA resolution time in minutes by priority
export const SLA_MINUTES: Record<string, number> = {
    critical: 4 * 60,      // 4 hours
    high: 8 * 60,          // 8 hours
    medium: 24 * 60,       // 24 hours
    low: 72 * 60,          // 72 hours
}

/**
 * Calculate the SLA breach deadline for a ticket.
 * Returns an ISO string for when the SLA expires.
 */
export function calcSlaBreachAt(priority: string, createdAt: string): string {
    const minutes = SLA_MINUTES[priority] ?? SLA_MINUTES.medium
    const created = new Date(createdAt)
    created.setMinutes(created.getMinutes() + minutes)
    return created.toISOString()
}

/**
 * Categorise SLA status for a given breach timestamp.
 * Returns: 'ok' | 'warning' | 'breached'
 */
export function getSlaStatus(breachAt: string | null): 'ok' | 'warning' | 'breached' | 'none' {
    if (!breachAt) return 'none'
    const now = Date.now()
    const breach = new Date(breachAt).getTime()
    const remaining = breach - now
    if (remaining <= 0) return 'breached'
    if (remaining <= 60 * 60 * 1000) return 'warning'   // < 1 hour left
    return 'ok'
}

/**
 * Format remaining SLA time as a human-readable string.
 * e.g. "3h 24m" or "BREACHED"
 */
export function formatSlaRemaining(breachAt: string | null): string {
    if (!breachAt) return '—'
    const remaining = new Date(breachAt).getTime() - Date.now()
    if (remaining <= 0) return 'Breached'
    const totalMins = Math.floor(remaining / 60000)
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
}
