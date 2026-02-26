'use client'

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

interface Props {
    byStatus: { name: string; value: number }[]
    byPriority: { name: string; value: number }[]
    byDay: { date: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
    Open: '#056BFC',
    'In Progress': '#FABD00',
    Resolved: '#3FD534',
    Closed: '#9ca3af',
}

const PRIORITY_COLORS: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-background border rounded-lg shadow-lg px-3 py-2 text-sm">
            <p className="font-medium mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color ?? p.fill }}>
                    {p.name}: <span className="font-bold">{p.value}</span>
                </p>
            ))}
        </div>
    )
}

export function DashboardCharts({ byStatus, byPriority, byDay }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets over time bar chart */}
            <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                <h3 className="font-semibold mb-4">Tickets Created (Last 14 Days)</h3>
                {byDay.every((d) => d.count === 0) ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={byDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Tickets" fill="#056BFC" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Status pie */}
            <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4">By Status</h3>
                {byStatus.every((d) => d.value === 0) ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No tickets yet</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={byStatus.filter((d) => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {byStatus.filter((d) => d.value > 0).map((entry) => (
                                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#9ca3af'} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                formatter={(val) => <span className="text-xs">{val}</span>}
                                iconSize={10}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Priority pie */}
            <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4">By Priority</h3>
                {byPriority.every((d) => d.value === 0) ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No tickets yet</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={byPriority.filter((d) => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {byPriority.filter((d) => d.value > 0).map((entry) => (
                                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? '#9ca3af'} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                formatter={(val) => <span className="text-xs">{val}</span>}
                                iconSize={10}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
