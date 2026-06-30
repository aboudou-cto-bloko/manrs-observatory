import type { ReactNode } from "react"

interface StatValueProps {
  label: string
  value: string | number
  suffix?: string
  icon?: ReactNode
  color?: string
}

export function StatValue({ label, value, suffix, icon, color = "#3b82f6" }: StatValueProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color }}>
            {value}
            {suffix && <span className="text-lg ml-0.5 opacity-70">{suffix}</span>}
          </p>
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `${color}15`, color }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
