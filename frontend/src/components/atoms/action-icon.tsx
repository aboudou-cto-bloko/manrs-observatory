import { Check, X } from "@phosphor-icons/react"

interface ActionIconProps {
  label: string
  active: boolean
}

export function ActionIcon({ label, active }: ActionIconProps) {
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
      active
        ? "border-green-500/20 bg-green-500/5 text-green-400"
        : "border-border bg-secondary/30 text-muted-foreground"
    }`}>
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
        active ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"
      }`}>
        {active ? <Check size={14} weight="bold" /> : <X size={14} weight="bold" />}
      </div>
      <span className="font-medium">{label}</span>
    </div>
  )
}
