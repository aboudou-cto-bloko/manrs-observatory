import { ActionIcon } from "@/components/atoms/action-icon"

interface ManrsScoreCardProps {
  actions: {
    filtering: boolean
    anti_spoofing: boolean | null
    coordination: boolean
    validation: boolean
  }
}

export function ManrsScoreCard({ actions }: ManrsScoreCardProps) {
  const values = [actions.filtering, actions.anti_spoofing, actions.coordination, actions.validation]
  const evaluated = values.filter((v) => v !== null).length
  const score = values.filter((v) => v === true).length

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Score MANRS</h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.max(evaluated, 1) }, (_, i) => i).map((i) => (
            <div
              key={i}
              className={`h-3 w-8 rounded-full transition-colors ${
                i < score ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
          <span className="ml-2 text-lg font-bold text-primary">{score}/{evaluated}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ActionIcon label="Filtering" active={actions.filtering} />
        <ActionIcon label="Anti-spoofing" active={actions.anti_spoofing} />
        <ActionIcon label="Coordination" active={actions.coordination} />
        <ActionIcon label="Validation" active={actions.validation} />
      </div>
    </div>
  )
}
