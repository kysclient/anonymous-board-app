import type React from "react"
interface StatsCardProps {
    title: string
    value: number
    subtitle?: string
    icon?: React.ReactNode
}

export function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                {icon && <div className="text-gray-400">{icon}</div>}
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    )
}
