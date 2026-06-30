import { ActionIcon } from "@/components/atoms/action-icon"

interface ManrsScoreCardProps {
  actions: {
    filtering: boolean
    anti_spoofing: boolean
    coordination: boolean
    validation: boolean
  }
}

export function ManrsScoreCard({ actions }: ManrsScoreCardProps) {
  const score = [actions.filtering, actions.anti_spoofing, actions.coordination, actions.validation]
    .filter(Boolean).length

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Score MANRS</h3>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-3 w-8 rounded-full transition-colors ${
                i < score ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
          <span className="ml-2 text-lg font-bold text-primary">{score}/4</span>
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
