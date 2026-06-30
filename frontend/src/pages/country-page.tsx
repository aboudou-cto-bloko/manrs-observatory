import { useParams, Link } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Globe, ShieldCheck, ChartBar, LockKey, ArrowLeft } from "@phosphor-icons/react"
import { api } from "@/lib/api"
import { useFetch } from "@/hooks/use-fetch"
import { Loading, ErrorMessage } from "@/components/atoms/loading"
import { StatValue } from "@/components/atoms/stat-value"
import { AsnTable } from "@/components/organisms/asn-table"
import { roaColorHex } from "@/lib/countries"

export function CountryPage() {
  const { code } = useParams<{ code: string }>()
  const { data, loading, error } = useFetch(
    () => api.getCountry(code!),
    [code],
  )

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!data) return null

  const chartData = [...data.asns]
    .filter((a) => a.name)
    .sort((a, b) => b.roa_coverage_pct - a.roa_coverage_pct)
    .slice(0, 15)
    .map((a) => ({
      name: a.name!.length > 20 ? a.name!.slice(0, 20) + "…" : a.name,
      roa: a.roa_coverage_pct,
      code: a.asn_number,
    }))

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          {data.country_name}
        </h1>
        <p className="text-sm text-muted-foreground">{data.country_code} — {data.total_asn} opérateurs réseau</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatValue label="ASN total" value={data.total_asn} icon={<Globe size={20} />} color="#3b82f6" />
        <StatValue label="Membres MANRS" value={data.manrs_members} icon={<ShieldCheck size={20} />} color="#a855f7" />
        <StatValue label="Score moyen" value={data.avg_manrs_score} suffix="/4" icon={<ChartBar size={20} />} color="#f59e0b" />
        <StatValue
          label="Couverture ROA"
          value={data.roa_coverage_pct}
          suffix="%"
          icon={<LockKey size={20} />}
          color={roaColorHex(data.roa_coverage_pct)}
        />
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Couverture ROA par opérateur</h2>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3140" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={{ stroke: "#2e3140" }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={{ stroke: "#2e3140" }} />
                <Tooltip
                  contentStyle={{ background: "#1a1c25", border: "1px solid #2e3140", borderRadius: "8px", color: "#e4e4e7" }}
                  formatter={(value) => [`${value}%`, "ROA"]}
                />
                <Bar dataKey="roa" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.code} fill={roaColorHex(entry.roa)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Tous les opérateurs ({data.asns.length})</h2>
        </div>
        <AsnTable asns={data.asns} />
      </div>
    </div>
  )
}
