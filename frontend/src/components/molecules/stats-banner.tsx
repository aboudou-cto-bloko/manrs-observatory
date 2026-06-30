import { Globe, ShieldCheck, ChartBar, LockKey } from "@phosphor-icons/react"
import { StatValue } from "@/components/atoms/stat-value"
import type { GlobalStats } from "@/types/api"

interface StatsBannerProps {
  stats: GlobalStats
}

export function StatsBanner({ stats }: StatsBannerProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatValue
        label="ASN surveillés"
        value={stats.total_asn}
        icon={<Globe size={20} />}
        color="#3b82f6"
      />
      <StatValue
        label="Membres MANRS"
        value={stats.manrs_members}
        icon={<ShieldCheck size={20} />}
        color="#a855f7"
      />
      <StatValue
        label="Score MANRS moyen"
        value={stats.avg_manrs_score}
        suffix="/4"
        icon={<ChartBar size={20} />}
        color="#f59e0b"
      />
      <StatValue
        label="Couverture ROA"
        value={stats.roa_coverage_pct}
        suffix="%"
        icon={<LockKey size={20} />}
        color={stats.roa_coverage_pct > 60 ? "#22c55e" : stats.roa_coverage_pct > 25 ? "#f59e0b" : "#ef4444"}
      />
    </div>
  )
}
