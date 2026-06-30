import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG = {
  valid: { label: "Valid", className: "border-green-500/30 bg-green-500/15 text-green-400" },
  invalid: { label: "Invalid", className: "border-red-500/30 bg-red-500/15 text-red-400" },
  "not-found": { label: "Not Found", className: "border-yellow-500/30 bg-yellow-500/15 text-yellow-400" },
} as const

interface RoaBadgeProps {
  status: "valid" | "invalid" | "not-found"
}

export function RoaBadge({ status }: RoaBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
